'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ShowingSchedule from '@/app/_components/ShowingSchedule/ShowingSchedule';

export type Movie = {
  id: string;
  title: string;
  releaseDate: string;
  duration: number;
  genre: string;
  description?: string;
  director: string;
  casts: string;
  imageUrl?: string;
  trailerUrl?: string;
  showings: any[];
  showingCount: number;
};

export default function MovieDetailPage({
  params: paramsPromise
}: {
  params: Promise<{ id: string }>;
}) {
  // React.use()を使ってparamsを解決する
  const params = use(paramsPromise);
  const movieId = params.id;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/movies/${movieId}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/not-found');
            return;
          }
          throw new Error('映画情報の取得に失敗しました');
        }

        const data = await response.json();
        console.log('Fetched movie data:', data); // デバッグ用
        setMovie(data);
        setLoading(false);
      } catch (err) {
        console.error('映画取得エラー:', err);
        setError('映画情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, router]);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!movie) return <div>映画情報が見つかりません</div>;
  const message = movie.showings.length;
  // showingsがあるかチェック（undefined、null、空配列の場合に対応）
  const hasShowings = movie.showings && movie.showings.length > 0;

  return (
    <div>
      <Link href="/movie">
        ＜ 映画一覧に戻る
      </Link>

      <div>
        <div>
          <div>
            {movie.imageUrl ? (
              <Image
                src={movie.imageUrl}
                alt={movie.title}
                width={300}
                height={450}
              />
            ) : (
              <div>
                <span>画像なし</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h1>{movie.title}</h1>

          <div>
            <span>{new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開</span>
            <span>{movie.duration}分</span>
            <span>{movie.genre}</span>
          </div>

          {movie.description && (
            <div>
              <h2>あらすじ</h2>
              <p>{movie.description}</p>
            </div>
          )}

          <div>
            <h2>スタッフ・キャスト</h2>
            <p><span>監督:</span> {movie.director}</p>
            <p><span>出演:</span> {movie.casts}</p>
          </div>

          {movie.trailerUrl && (
            <div>
              <h2>予告編</h2>
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                予告編を見る
              </a>
            </div>
          )}
        </div>
      </div>

      {hasShowings ? (
        <div>
          <h2>上映スケジュール</h2>
          <ShowingSchedule showings={movie.showings} />
        </div>
      ) : (
        <div>
          <p>現在この映画の上映予定はありません。</p>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}