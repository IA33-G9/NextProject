import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

// API ルートハンドラー
export async function GET(
  request: Request,
  { params: paramsInput }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // params が Promise の場合に対応
    const params = paramsInput instanceof Promise ? await paramsInput : paramsInput;

    // 映画データの取得
    const movie = await prisma.movie.findUnique({
      where: { id: params.id },
      include: {
        showings: {
          where: {
            startTime: {
              gte: new Date() // 現在時刻以降の上映のみ取得
            }
          },
          include: {
            screen: {
              include: {
                cinema: true // 映画館情報も含める
              }
            }
          },
          orderBy: {
            startTime: 'asc' // 上映時間で昇順ソート
          }
        }
      }
    });

    // 映画が見つからない場合
    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }


    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  } finally {
    // 接続のクリーンアップ（オプション）
    await prisma.$disconnect();
  }
}