'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Movie = {
  id: string;
  title: string;
  imageUrl?: string;
  releaseDate: string;
  duration: number;
  genre: string;
  showingCount: number;
};

export default function AdminReservationPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/movies');
        if (!response.ok) {
          throw new Error('映画一覧の取得に失敗しました');
        }
        const data = await response.json();
        // Filter movies with showingCount > 0
        const activeMovies = data.filter((movie: Movie) => movie.showingCount > 0);
        setMovies(activeMovies);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl bg-white shadow-lg border border-gray-300 min-h-screen">
      {/* Header */}
      <div className="text-center py-8 border-b border-gray-200">
        <h1 className="text-4xl font-bold mb-2">店頭予約作成</h1>
        <p className="text-gray-600 text-lg">映画を選択して予約を作成します</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
          {error}
        </div>
      )}

      {movies.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 text-lg">上映予定の映画がありません</p>
        </div>
      ) : (
        <div className="movie-container active p-5">
          <div className="movie-list flex flex-col gap-10 items-center">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                href={`/admin/reservation/showing/${movie.id}`}
                className="movie-card border-b border-gray-200 pb-7 w-full max-w-4xl text-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div>
                  {movie.imageUrl ? (
                    <Image
                      src={movie.imageUrl}
                      alt={movie.title}
                      width={540}
                      height={800}
                      className="movie-image w-full max-w-xl h-96 object-cover block mx-auto mb-5 rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-full max-w-xl h-96 bg-stone-200 text-white flex items-center justify-center rounded-xl shadow-md mx-auto mb-5">
                      <span>画像なし</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="movie-title font-bold mb-4 text-3xl text-gray-800">{movie.title}</h2>
                  <p className="movie-info text-blue-600 mb-5 text-2xl">
                    {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開
                    {' • '} {movie.duration}分
                  </p>
                  <p className="text-gray-700">{movie.genre}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
