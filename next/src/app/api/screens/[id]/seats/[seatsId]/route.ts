//指定したz席の情報を取得するapi
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const {id} = await params;

  try {
        const seat = await prisma.seat.findUnique({
          where: { id: id },
          select: { row: true, column: true },
        });


    return NextResponse.json(seat);
  } catch (error) {
    console.error('座席一覧取得エラー:', error);
    return NextResponse.json(
      { message: '座席情報の取得に失敗しました。' },
      { status: 500 }
    );
  }
}