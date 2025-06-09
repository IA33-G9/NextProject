//予約の作成をするAPI
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@/generated/prisma/client';
import { generateBookingReference } from '@/lib/bookingnum/num';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
    const { showingId, seatIds } = body;

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

    // 予約番号を生成（例：ABC123）
    const bookingReference = generateBookingReference();

    // 合計金額を計算
    const totalAmount = showing.price * seatIds.length;

    // セッションからユーザーIDを取得
    const userId = session.user.id;

    // 予約を作成
    const booking = await prisma.booking.create({
      data: {
        showingId: showingId,
        userId: userId,
        totalPrice: totalAmount,
        bookingReference: bookingReference,
        status: 'COMPLETED',
        seats: {
          create: seatIds.map(seatId => ({
            seatId: seatId,
          })),
        },
      },
    });
    // 予約が正常に作成されたことを確認
    if (!booking) {
      return NextResponse.json({ message: '予約の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      bookingId: booking.id,
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