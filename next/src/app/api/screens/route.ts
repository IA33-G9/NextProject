import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const screens = await prisma.screen.findMany({
      include: {
        cinema: true,
      },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error('スクリーン一覧取得エラー:', error);
    return NextResponse.json(
      { message: 'スクリーン一覧の取得に失敗しました。' },
      { status: 500 }
    );
  }
}