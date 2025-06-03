//映画の詳細を取得,更新,削除するapi
import {NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

// 映画の詳細を取得
export async function GET(
  request: NextRequest,
  { params: paramsInput }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
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
        { message: 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch movie details' },
      { status: 500 }
    );
  } finally {
    // 接続のクリーンアップ（オプション）
    await prisma.$disconnect();
  }
}