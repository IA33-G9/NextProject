// 映画情報更新（showings更新対応版）
import {NextRequest, NextResponse} from "next/server";
import {PrismaClient} from "@/generated/prisma";
const prisma = new PrismaClient();
export async function PUT(
  request: NextRequest,
  { params: paramsInput }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // params が Promise の場合に対応
    const params = paramsInput instanceof Promise ? await paramsInput : paramsInput;
    const movieId = params.id;

    // リクエストボディのJSONをパース
    const body = await request.json();

    // 映画が存在するか確認
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        showings: true // 既存のshowingsも取得
      }
    });

    if (!existingMovie) {
      return NextResponse.json({ message: 'Movie not found' }, { status: 404 });
    }

    const {
      title,
      releaseDate,
      duration,
      genre,
      imageUrl,
      description,
      director,
      casts,
      trailerUrl,
      showings
    } = body;

    // トランザクション内で映画情報とshowingsを一括更新
    const updatedMovie = await prisma.$transaction(async (tx) => {
      // 1. 映画情報を更新
      const movieUpdate = await tx.movie.update({
        where: { id: movieId },
        data: {
          title: title || existingMovie.title,
          releaseDate: releaseDate ? new Date(releaseDate) : undefined,
          duration: duration ? parseInt(duration) : undefined,
          genre: genre || existingMovie.genre,
          imageUrl: imageUrl || existingMovie.imageUrl,
          description: description || existingMovie.description,
          director: director || existingMovie.director,
          casts: casts || existingMovie.casts,
          trailerUrl: trailerUrl || existingMovie.trailerUrl,
        },
      });
      // movieUpdate();

      // 2. showingsが提供されている場合の処理
      if (showings && Array.isArray(showings)) {
        // 既存のshowingsをすべて削除
        await tx.showing.deleteMany({
          where: { movieId: movieId }
        });

        // 新しいshowingsを作成
        if (showings.length > 0) {
          const showingData = await Promise.all(
            showings.map(async (showingItem: any) => {
              // screenIdが指定されていない場合、デフォルトスクリーンを取得
              let screenId = showingItem.screenId;

              if (!screenId) {
                const firstScreen = await tx.screen.findFirst();
                if (!firstScreen) {
                  throw new Error('No screens available in the system');
                }
                screenId = firstScreen.id;
              } else {
                // 指定されたscreenIdが存在するか確認
                const screenExists = await tx.screen.findUnique({
                  where: { id: screenId }
                });
                if (!screenExists) {
                  throw new Error(`Screen with ID ${screenId} not found`);
                }
              }

              const startTime = new Date(showingItem.startTime);
              // endTimeを計算（映画の上映時間を使用）
              const movieDuration = duration || existingMovie.duration || 120; // 分単位
              const endTime = new Date(startTime.getTime() + movieDuration * 60000);

              return {
                movieId: movieId,
                startTime: startTime,
                endTime: endTime,
                screenId: screenId,
                uniformPrice: showingItem.uniformPrice || null,
              };
            })
          );

          await tx.showing.createMany({
            data: showingData,
          });
        }
      }

      // 3. 更新後の完全な映画データを取得して返す
      const finalMovie = await tx.movie.findUnique({
        where: { id: movieId },
        include: {
          showings: {
            include: {
              screen: {
                include: {
                  cinema: true
                }
              }
            },
            orderBy: {
              startTime: 'asc'
            }
          }
        }
      });

      return finalMovie;
    });


    return NextResponse.json(updatedMovie);
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { message: 'Failed to update movie' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 映画削除
export async function DELETE(
  request: Request,
  { params: paramsInput }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // params が Promise の場合に対応
    const params = paramsInput instanceof Promise ? await paramsInput : paramsInput;

    // 削除対象の映画が存在するか確認
    const existingMovie = await prisma.movie.findUnique({
      where: { id: params.id }
    });

    if (!existingMovie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // 関連する上映スケジュールと予約件数を確認
    const relatedShowings = await prisma.showing.findMany({
      where: { movieId: params.id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    // 予約が存在するかチェック
    const totalBookings = relatedShowings.reduce(
      (sum, showing) => sum + showing._count.bookings,
      0
    );

    // 予約が存在する場合は警告または処理方針を決定
    if (totalBookings > 0) {
      // オプション1: 削除をブロックする
      return NextResponse.json(
        {
          error: 'Cannot delete movie with existing showings',
          message: `この映画には${relatedShowings.length}件の予約が存在します`,
          showingCount: relatedShowings.length,
          bookingCount: totalBookings
        },
        { status: 400 }
      );
    }

    // 上映スケジュールが存在する場合（予約はない）
    if (relatedShowings.length > 0) {
      await prisma.showing.deleteMany({
        where: { movieId: params.id }
      });
    }

    // ここで画像が存在する場合は削除する処理を追加するかも

    // 映画を削除
    await prisma.movie.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Movie deleted successfully',
      id: params.id,
      deletedShowings: relatedShowings.length
    });

  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    );
  } finally {
    // 接続のクリーンアップ（オプション）
    await prisma.$disconnect();
  }
}