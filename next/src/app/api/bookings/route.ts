//予約の作成をするAPI
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@/generated/prisma/client';
import { generateBookingReference } from '@/lib/bookingnum/num';


const prisma = new PrismaClient();
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { showingId, seatIds } = body;

    if (!showingId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return Response.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // 上映情報を取得して料金を確認
    const showing = await prisma.showing.findUnique({
      where: { id: showingId },
      include: { movie: true, screen: true },
    });

    if (!showing) {
      return Response.json({ message: '上映情報が見つかりません' }, { status: 404 });
    }

    // 座席がすでに予約されていないか確認
    const existingBookings = await prisma.bookingSeat.findMany({
      where: {
        seatId: { in: seatIds },
        booking: { showingId: showingId },
      },
    });

    if (existingBookings.length > 0) {
      return Response.json({
        message: '選択された座席の一部がすでに予約されています。別の座席を選択してください。'
      }, { status: 409 });
    }

    // 予約番号を生成（例：ABC123）
    const bookingReference = generateBookingReference();

    // 合計金額を計算
    const totalAmount = showing.price * seatIds.length;

    // 仮のユーザーID（実際の認証システムが実装されたら変更する）
    const tempUserId = 'testuser';

    // 予約を作成
    const booking = await prisma.booking.create({
      data: {
        showingId: showingId,
        userId: tempUserId,
        totalPrice: totalAmount,
        bookingReference: bookingReference,
        status: 'CONFIRMED',
        seats: {
          create: seatIds.map(seatId => ({
            seatId: seatId,
          })),
        },
      },
    });

    return Response.json({
      bookingId: booking.id,
      message: '予約が正常に作成されました',
    }, { status: 201 });
  } catch (error) {
    console.error('予約作成エラー:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}