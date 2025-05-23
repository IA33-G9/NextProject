'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MovieFilter from '@/app/_components/MovieFilter/MovieFilter';
import { Movie } from '@/type/movie/movie';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/movies');

        if (!response.ok) {
          throw new Error('映画情報の取得に失敗しました');
        }

        const data = await response.json();
        setMovies(data);
        setLoading(false);
      } catch (err) {
        console.error('映画取得エラー:', err);
        setError('映画情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleAddMovieClick = () => {
    router.push('movie/add');
  };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">上映中映画</h1>
        <button
          onClick={handleAddMovieClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <h1>+</h1>
          新しい映画を追加
        </button>
      </div>

      {!movies.length ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <p className="text-gray-600">映画情報がありません。新しい映画を追加してください。</p>
        </div>
      ) : (
        <MovieFilter Movies={movies} />
      )}
    </div>
  );
}