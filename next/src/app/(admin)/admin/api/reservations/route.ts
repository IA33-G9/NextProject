import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { generateBookingReference } from '@/lib/bookingnum/num';
import { requireAdmin } from '@/lib/isAdmin/isAdmin';

const prisma = new PrismaClient();

const DEFAULT_PRICES = {
  GENERAL: 1800,
  STUDENT: 1600,
  YOUTH: 1400,
  CHILD: 1000,
} as const;

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const { session } = await requireAdmin();

    const body = await req.json();
    const { showingId, seatIds, paymentMethod, seatTickets, userId } = body;

    // Validate input
    if (!showingId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        {
          message: '無効なリクエストです',
        },
        { status: 400 }
      );
    }

    // Fetch showing information
    const showing = await prisma.showing.findUnique({
      where: { id: showingId },
      include: { movie: true, screen: true },
    });

    if (!showing) {
      return NextResponse.json(
        {
          message: '上映情報が見つかりません',
        },
        { status: 404 }
      );
    }

    // Check if seats are already booked
    const existingBookings = await prisma.bookingSeat.findMany({
      where: {
        seatId: { in: seatIds },
        booking: { showingId: showingId },
      },
    });

    if (existingBookings.length > 0) {
      return NextResponse.json(
        {
          message: '選択された座席の一部がすでに予約されています',
        },
        { status: 409 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['CREDIT_CARD', 'CASH', 'MOBILE_PAYMENT'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          message: '無効な支払方法が指定されています',
        },
        { status: 400 }
      );
    }

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Use provided userId or fall back to session user ID
    const actualUserId = userId || session.user.id;

    let totalAmount = 0;
    let bookingSeatsData = [];

    if (showing.uniformPrice) {
      // Uniform pricing: use uniformPrice for all seats
      totalAmount = showing.uniformPrice * seatIds.length;
      bookingSeatsData = seatIds.map((seatId) => ({
        seatId: seatId,
        ticketType: 'GENERAL',
        price: showing.uniformPrice as number,
      }));
    } else {
      // Variable pricing: use seatTickets
      if (
        !seatTickets ||
        !Array.isArray(seatTickets) ||
        seatTickets.length !== seatIds.length
      ) {
        return NextResponse.json(
          {
            message: '各座席のチケットタイプが必要です',
          },
          { status: 400 }
        );
      }

      // Validate seatTickets
      for (const seatTicket of seatTickets) {
        if (!seatIds.includes(seatTicket.seatId)) {
          return NextResponse.json(
            {
              message: '無効な座席IDが含まれています',
            },
            { status: 400 }
          );
        }
        if (!DEFAULT_PRICES[seatTicket.ticketType as keyof typeof DEFAULT_PRICES]) {
          return NextResponse.json(
            {
              message: '無効なチケットタイプが含まれています',
            },
            { status: 400 }
          );
        }
      }

      // Calculate total and prepare booking seat data
      bookingSeatsData = seatTickets.map((seatTicket) => {
        const price = DEFAULT_PRICES[seatTicket.ticketType as keyof typeof DEFAULT_PRICES];

        if (!price) {
          throw new Error(`無効なチケットタイプ: ${seatTicket.ticketType}`);
        }

        totalAmount += price;

        return {
          seatId: seatTicket.seatId,
          ticketType: seatTicket.ticketType,
          price: price,
        };
      });
    }

    // Create booking and booking seats in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          showingId: showingId,
          userId: actualUserId,
          totalPrice: totalAmount,
          bookingReference: bookingReference,
          paymentMethod: paymentMethod,
          status: 'COMPLETED',
        },
      });

      await tx.bookingSeat.createMany({
        data: bookingSeatsData.map((seatData) => ({
          bookingId: newBooking.id,
          seatId: seatData.seatId,
          ticketType: seatData.ticketType,
          price: seatData.price,
        })),
      });

      return newBooking;
    });

    if (!booking) {
      return NextResponse.json(
        { message: '予約の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        totalPrice: totalAmount,
        message: '予約が正常に作成されました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('予約作成エラー:', error);
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
