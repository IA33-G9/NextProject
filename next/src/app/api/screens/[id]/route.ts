import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const screen = await prisma.screen.findUnique({
      where: { id },
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
          }
        },
      },
    });

    if (!screen) {
      return NextResponse.json(
        { message: 'スクリーンが見つかりません。' },
        { status: 404 }
      );
    }

    return NextResponse.json(screen);
  } catch (error) {
    console.error('スクリーン取得エラー:', error);
    return NextResponse.json(
      { message: 'スクリーン情報の取得に失敗しました。' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}