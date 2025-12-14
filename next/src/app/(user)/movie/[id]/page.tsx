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
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
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
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/not-found');
            return;
          }
          throw new Error('映画情報の取得に失敗しました');
        }

        const data = await response.json();
        console.log('Fetched movie data:', data);
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">読み込み中...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );

  if (!movie)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">映画情報が見つかりません</div>
      </div>
    );

  const hasShowings = movie.showings && movie.showings.length > 0;

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-0">
      <div className="container mx-auto max-w-7xl bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        {/* Movie Details */}
        <div className="movie-details p-4 md:p-8">
          <div className="content-section flex flex-col md:flex-row gap-8 items-start">
            <div className="image-section flex-shrink-0 w-full md:w-80 lg:w-96">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
                  width={500}
                  height={750}
                  className="w-full h-auto shadow-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-700 text-white flex items-center justify-center shadow-lg">
                  <span>画像なし</span>
                </div>
              )}
            </div>

            <div className="info-section flex-grow">
              <h1 className="detail-title text-3xl md:text-4xl font-bold mb-4">{movie.title}</h1>
              <p className="detail-rating text-red-500 text-lg md:text-xl mb-4">
                {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開 ・ {movie.duration}分
                ・ {movie.genre}
              </p>

              {movie.description && (
                <div className="detail-description text-gray-300 text-base md:text-lg leading-relaxed mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">あらすじ</h2>
                  <p>{movie.description}</p>
                </div>
              )}

              <div className="text-gray-300 text-base md:text-lg mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">スタッフ・キャスト</h2>
                <p>
                  <span className="font-semibold">監督:</span> {movie.director}
                </p>
                <p>
                  <span className="font-semibold">出演:</span> {movie.casts}
                </p>
              </div>

              {movie.trailerUrl && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">予告編</h2>
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    予告編を見る
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Showing Schedule */}
        <div className="p-4 md:p-8 border-t border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            上映スケジュール
          </h2>
          {hasShowings ? (
            <ShowingSchedule showings={movie.showings} />
          ) : (
            <div className="text-center text-gray-400 text-lg">
              <p>現在この映画の上映予定はありません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
