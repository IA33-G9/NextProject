//予約済みの差席を取得するapi
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const {id} = await params;

  try {
    // 指定した上映に対する予約済み座席を取得
    const bookings = await prisma.booking.findMany({
      where: {
        showingId: id,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      include: {
        seats: {
          include: {
            seat: true,
          },
        },
      },
    });

    // 予約済み座席のIDを抽出
    const bookedSeatIds = bookings.flatMap(booking =>
      booking.seats.map(bs => bs.seatId)
    );

    return NextResponse.json(bookedSeatIds);
  } catch (error) {
    console.error('予約済み座席取得エラー:', error);
    return NextResponse.json(
      { message: '予約済み座席情報の取得に失敗しました。' },
      { status: 500 }
    );
  }
}