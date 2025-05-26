//列挙されたseatのIDから座席番号を取得するAPI
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const ids = searchParams.getAll('ids'); // ?ids=abc&ids=def&ids=ghi

  if (!ids.length) {
    return NextResponse.json({ message: '座席IDが指定されていません。' }, { status: 400 });
  }

  try {
    const seats = await prisma.seat.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        row: true,
        column: true,
      },
    });

    if (!seats) {
      return NextResponse.json({ message: '指定された座席が見つかりません。' }, { status: 404 });
    }

    // rowとcolumnを seatNumber 文字列に変換（例: A1, B2）
    const formattedSeats = seats.map((seat) => ({
      id: seat.id,
      seatNumber: `${seat.row}${seat.column}`,
    }));

    return NextResponse.json(formattedSeats);
  } catch (error) {
    console.error('座席取得エラー:', error);
    return NextResponse.json({ message: '座席情報の取得に失敗しました。' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
