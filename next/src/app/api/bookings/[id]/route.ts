// src/app/api/bookings/[bookingId]/route.ts
import { PrismaClient } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    console.log(`API: Received request for booking ID: ${id}`);

    // 明示的な検証
    if (!id || typeof id !== 'string') {
      console.error(`API: Invalid booking ID format: ${id}`);
      return Response.json({ message: 'Invalid booking ID format' }, { status: 400 });
    }

    // 予約情報を取得
    const booking = await prisma.booking.findUnique({
      where: {
        id: id,
      },
      include: {
        showing: {
          include: {
            movie: true,
            screen: true,
          }
        },
        seats: {
          include: {
            seat: true,
          }
        },
      },
    });

    if (!booking) {
      console.log(`API: Booking not found for ID: ${id}`);
      return NextResponse.json({ message: '予約情報が見つかりません' }, { status: 404 });
    }

    // デバッグ情報
    console.log(`API: Successfully found booking with ID: ${id}`);

    // 座席情報をフォーマット
    const seatLabels = booking.seats.map(bookingSeat =>
      `${bookingSeat.seat.row}${bookingSeat.seat.column}`
    ).sort();

    // レスポンス用のデータをフォーマット
    const bookingDetails = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      movieTitle: booking.showing.movie.title,
      screenName: booking.showing.screen.number || `スクリーン${booking.showing.screen.number}`,
      startTime: booking.showing.startTime.toISOString(),
      seats: seatLabels,
      totalAmount: booking.totalPrice,
      status: booking.status,
    };

    return NextResponse.json(bookingDetails);
  } catch (error) {
    console.error('API: 予約情報取得エラー:', error);
    return NextResponse.json({
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}