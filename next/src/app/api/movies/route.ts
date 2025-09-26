//映画情報の作成、取得するapi
import {NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

// 映画情報の作成
//作成はadminuserかどうかを確認してから行う
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // 必須フィールドの検証
    if (!data.title || !data.releaseDate || !data.duration || !data.director || !data.genre || !data.casts) {
      return NextResponse.json(
        { message: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // showingsの検証
    if (!data.showings || !Array.isArray(data.showings) || data.showings.length === 0) {
      return NextResponse.json(
        { message: '少なくとも1つの上映スケジュールが必要です' },
        { status: 400 }
      );
    }

    // トランザクションを使用して映画と上映スケジュールを同時に作成
    const result = await prisma.$transaction(async (tx) => {
      // 映画の作成
      const movie = await tx.movie.create({
        data: {
          title: data.title,
          description: data.description || null,
          releaseDate: new Date(data.releaseDate),
          imageUrl: data.imageUrl || null,
          trailerUrl: data.trailerUrl || null,
          genre: data.genre,
          director: data.director,
          casts: data.casts,
          duration: data.duration,
        },
      });

      // 上映スケジュールの作成
      for (const showing of data.showings) {
        // スクリーンが存在するか確認
        const screen = await tx.screen.findUnique({
          where: { id: showing.screenId },
        });

        if (!screen) {
          throw new Error(`スクリーンID ${showing.screenId} が見つかりません`);
        }

        // 日時の変換
        const startTime = new Date(showing.startTime);
        const endTime = new Date(showing.endTime);

        // 時間の重複チェック
        const overlappingShowing = await tx.showing.findFirst({
          where: {
            screenId: showing.screenId,
            OR: [
              {
                // 新しい上映の開始時間が既存の上映時間内にある
                startTime: { lte: startTime },
                endTime: { gt: startTime },
              },
              {
                // 新しい上映の終了時間が既存の上映時間内にある
                startTime: { lt: endTime },
                endTime: { gte: endTime },
              },
              {
                // 新しい上映が既存の上映を完全に含む
                startTime: { gte: startTime },
                endTime: { lte: endTime },
              },
            ],
          },
        });

        if (overlappingShowing) {
          throw new Error(`指定したスクリーンと時間で上映スケジュールが重複しています`);
        }

        // 上映スケジュールの作成
        await tx.showing.create({
          data: {
            startTime,
            endTime,
            price: showing.price,
            screenId: showing.screenId,
            movieId: movie.id,
          },
        });
      }

      // 作成した映画を返す
      return movie;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('映画作成エラー:', error);
    return NextResponse.json(
      { message: error.message || '映画の作成に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
      include: {
        _count: {
          select: {
            showings: {
              where: {
                startTime: {
                  gte: new Date()
                }
              }
            }
          }
        }
      }
    });

    const formattedMovies = movies.map(movie => {
      const { _count, ...rest } = movie;
      return {
        ...rest,
        showingCount: _count.showings
      };
    });

    return NextResponse.json(formattedMovies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ message: 'Failed to fetch movies' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
