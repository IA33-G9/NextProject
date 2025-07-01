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
        seats:{
          include:{
            seat: {
                select: {
                    id: true,
                    row: true,
                    column: true,
                }
            },
            }
          }
        }
    });

    if (!booking) {
      return NextResponse.json({ message: '予約情報が見つかりません' }, { status: 404 });
    }


    //座席情報をフォーマット
    const seatLabels = booking.seats.map(bookingSeat =>
      `${bookingSeat.seat.row}${bookingSeat.seat.column}`
    ).sort();
    const seatId = booking.seats.map(bookingSeat =>
      `${bookingSeat.seat.id}`
    ).sort();

    // レスポンス用のデータをフォーマット
    const formattedBookingDetails = {
      id: booking.id,
      bookingReference: booking.bookingReference,
      title: booking.showing.movie.title,
      screen: booking.showing.screen.number || `スクリーン${booking.showing.screen.number}`,
      screenId: booking.showing.screen.id,
      screenSize: booking.showing.screen.size || '不明',
      startTime: booking.showing.startTime.toISOString(),
      seats: seatLabels,
      seatId: seatId,
      totalPrice: booking.totalPrice,
      status: booking.status,
      showingId: booking.showing.id,
    };

    return NextResponse.json(formattedBookingDetails);
    // return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({
      message: 'Internal Server Error',error}, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}