//すべての座席を表示するapi
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

    return NextResponse.json(seats);
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