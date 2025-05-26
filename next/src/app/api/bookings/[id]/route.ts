//予約情報を取得するAPI
import { PrismaClient } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // 明示的な検証
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'Invalid booking ID format' }, { status: 400 });
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
      return NextResponse.json({ message: '予約情報が見つかりません' }, { status: 404 });
    }


    // 座席情報をフォーマット
    const seatLabels = booking.seats.map(bookingSeat =>
      `${bookingSeat.seat.row}${bookingSeat.seat.column}`
    ).sort();

    // レスポンス用のデータをフォーマット
    const formattebookingDetails = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      movieTitle: booking.showing.movie.title,
      screenName: booking.showing.screen.number || `スクリーン${booking.showing.screen.number}`,
      startTime: booking.showing.startTime.toISOString(),
      seats: seatLabels,
      totalAmount: booking.totalPrice,
      status: booking.status,
    };

    return NextResponse.json(formattebookingDetails);
  } catch (error) {
    return NextResponse.json({
      message: 'Internal Server Error',error}, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}