//予約の作成をするAPI
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@/generated/prisma/client';
import { generateBookingReference } from '@/lib/bookingnum/num';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

const DEFAULT_PRICES = {
    GENERAL: 1800,
    STUDENT: 1600,
    YOUTH: 1400,
    CHILD: 1000,
} as const;

export async function POST(req: NextRequest) {
  try {
    // セッションを取得してユーザー認証をチェック
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({
        message: 'ログインが必要です'
      }, { status: 401 });
    }

    const body = await req.json();
    const { showingId, seatIds, paymentMethod, seatTickets } = body;

    if (!showingId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({
        message: 'Invalid request data'
      }, { status: 400 });
    }

    // 上映情報を取得して料金を確認
    const showing = await prisma.showing.findUnique({
      where: { id: showingId },
      include: { movie: true, screen: true },
    });

    if (!showing) {
      return NextResponse.json({
        message: '上映情報が見つかりません'
      }, { status: 404 });
    }

    // 座席がすでに予約されていないか確認
    const existingBookings = await prisma.bookingSeat.findMany({
      where: {
        seatId: { in: seatIds },
        booking: { showingId: showingId },
      },
    });

    if (existingBookings.length > 0) {
      return NextResponse.json({
        message: '選択された座席の一部がすでに予約されています。別の座席を選択してください。'
      }, { status: 409 });
    }

    const validPaymentMethods = ['CREDIT_CARD', 'CASH', 'MOBILE_PAYMENT'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({
        message: '無効な支払方法が指定されています'
      }, { status: 400 });
    }

    // 予約番号を生成（例：ABC123）
    const bookingReference = generateBookingReference();

    // セッションからユーザーIDを取得
    const userId = session.user.id;

    let totalAmount = 0;
    let bookingSeatsData = [];

    if (showing.uniformPrice) {
        totalAmount = showing.uniformPrice * seatIds.length;
        bookingSeatsData = seatIds.map(seatId => ({
            seatId: seatId,
            ticketType: 'GENERAL',
            price: showing.uniformPrice as number,
        }));
    } else {
        if (!seatTickets || !Array.isArray(seatTickets) || seatTickets.length !== seatIds.length) {
            return NextResponse.json({
                message: 'デフォルト料金体系の場合、各座席のチケットタイプが必要です'
            }, { status: 400 });
        }

        // seatTicketsの妥当性をチェック
        for (const seatTicket of seatTickets) {
            if (!seatIds.includes(seatTicket.seatId)) {
                return NextResponse.json({
                    message: '無効な座席IDが含まれています'
                }, { status: 400 });
            }
            if (!DEFAULT_PRICES[seatTicket.ticketType as keyof typeof DEFAULT_PRICES]) {
                return NextResponse.json({
                    message: '無効なチケットタイプが含まれています'
                }, { status: 400 });
            }
        }

        // 合計金額を計算し、BookingSeatデータを準備
        bookingSeatsData = seatTickets.map(seatTicket => {
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

    const booking = await prisma.$transaction(async (tx) => {
        //予約作成
        const newBooking = await tx.booking.create({
            data: {
                showingId: showingId,
                userId: userId,
                totalPrice: totalAmount,
                bookingReference: bookingReference,
                paymentMethod: paymentMethod,
                status: 'COMPLETED',
            },
        });

        await tx.bookingSeat.createMany({
            data: bookingSeatsData.map(seatData => ({
                bookingId: newBooking.id,
                seatId: seatData.seatId,
                ticketType: seatData.ticketType,
                price: seatData.price,
            })),
        });

        return newBooking;
    })

    // 予約が正常に作成されたことを確認
    if (!booking) {
      return NextResponse.json({ message: '予約の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      totalPrice: totalAmount,
      message: '予約が正常に作成されました',
    }, { status: 201 });

  } catch (error) {
    console.error('予約作成エラー:', error);
    return NextResponse.json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}