//スクリーンIDから座席を取得するapi
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const {id} = await params;

  try {
    // 指定したスクリーンの座席を取得
    const seats = await prisma.seat.findMany({
      where: { screenId: id },
      select: {
        id: true,
        row: true,
        column: true,
        isActive: true,
        screenId: true,
      },
        orderBy: [
          {row: 'asc'},
          {column: 'asc'},
        ],
    });
    if (!seats) {
        return NextResponse.json(
            { error: '指定されたスクリーンの座席が見つかりません。' },
            { status: 404 }
        );
    }


    // 座席情報を整形
    const formattedSeats = seats.map(seat => ({
      id: seat.id,
      row: seat.row,
      column: seat.column,
      isActive: seat.isActive,
    }));


    // レスポンスとして座席情報を返す
    return NextResponse.json(formattedSeats);
  } catch (error) {
    console.error('座席一覧取得エラー:', error);
    return NextResponse.json(
      { message: '座席情報の取得に失敗しました。' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}