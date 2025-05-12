'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import  { Movie } from '@/type/movie/movie';

interface MovieFilterProps {
  initialMovies: Movie[];
}

export default function MovieFilter({ initialMovies }: MovieFilterProps) {
  const [filter, setFilter] = useState('all');
  const [filteredMovies, setFilteredMovies] = useState(initialMovies);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMovies(initialMovies);
    } else if (filter === 'showing') {
      setFilteredMovies(initialMovies.filter(movie => movie.showingCount > 0));
    }
  }, [filter, initialMovies]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            すべての映画
          </button>
          <button
            onClick={() => setFilter('showing')}
            className={`px-4 py-2 rounded-md ${filter === 'showing' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            上映中のみ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movie/${movie.id}`}
            className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative h-64 w-full">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <span className="text-gray-400">画像なし</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 line-clamp-2">{movie.title}</h2>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開
                {' • '} {movie.duration}分
              </p>
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{movie.genre}</p>
              {movie.showingCount > 0 ? (
                <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                  上映中
                </span>
              ) : (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded">
                  上映予定
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}