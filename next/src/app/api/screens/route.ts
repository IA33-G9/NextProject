import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const screens = await prisma.screen.findMany({
      select: {
        id: true,
        number: true,
        size: true,
        rows: true,
        columns: true,
        capacity: true,
        cinemaId: true,
        cinema: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error('スクリーン一覧取得エラー:', error);
    return NextResponse.json(
      { message: 'スクリーン一覧の取得に失敗しました。' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}