'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ShowingSchedule from '@/app/_components/ShowingSchedule/ShowingSchedule';

type Movie = {
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
};

export default function MovieDetailPage({
  params: paramsPromise
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise); // ← ここで unwrap
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/movies/${params.id}`, {
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
        setMovie(data);
        setLoading(false);
      } catch (err) {
        console.error('映画取得エラー:', err);
        setError('映画情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMovie();
  }, [params.id, router]);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!movie) return <div>映画情報が見つかりません</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/movie" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        映画一覧に戻る
      </Link>

      <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:w-1/3 lg:w-1/4">
          <div className="relative w-full h-96 md:h-full">
            {movie.imageUrl ? (
              <Image
                src={movie.imageUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">画像なし</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:w-2/3 lg:w-3/4">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>

          <div className="flex flex-wrap text-sm text-gray-600 mb-4">
            <span className="mr-4">{new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開</span>
            <span className="mr-4">{movie.duration}分</span>
            <span>{movie.genre}</span>
          </div>

          {movie.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">あらすじ</h2>
              <p className="text-gray-700">{movie.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">スタッフ・キャスト</h2>
            <p className="mb-1"><span className="font-medium">監督:</span> {movie.director}</p>
            <p><span className="font-medium">出演:</span> {movie.casts}</p>
          </div>

          {movie.trailerUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">予告編</h2>
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                予告編を見る
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {movie.showings.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">上映スケジュール</h2>
          <ShowingSchedule showings={movie.showings} />
        </div>
      ) : (
        <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">現在この映画の上映予定はありません。</p>
        </div>
      )}
    </div>
  );
}
