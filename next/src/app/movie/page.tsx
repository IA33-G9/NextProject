'use client';

import { useEffect, useState } from 'react';
import MovieFilter from '@/app/_components/MovieFilter/MovieFilter';
import  { Movie } from '@/type/movie/movie';


export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!movies.length) return <div>映画情報が見つかりません</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">上映中映画</h1>
      <MovieFilter initialMovies={movies} />
    </div>
  );
}
