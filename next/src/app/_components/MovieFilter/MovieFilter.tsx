'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import  { Movie } from '@/type/movie/movie';

interface MovieFilterProps {
  Movies: Movie[];
}

export default function MovieFilter({ Movies }: MovieFilterProps) {
  const [filter, setFilter] = useState('all');
  const [filteredMovies, setFilteredMovies] = useState(Movies);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMovies(Movies);
    } else if (filter === 'showing') {
      setFilteredMovies(Movies.filter(movie => movie.releaseDate < new Date().toISOString() && movie.showingCount > 0));
    }
  }, [filter, Movies]);

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

      <div>
        {filteredMovies.map((movie) => (

          <Link
            key={movie.id}
            href={`movie/${movie.id}`}

          >
            <div>
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
                  width={300}
                  height={300}
                />
              ) : (
                <div className="w-75 h-75 bg-stone-200 c-white">
                  <span>画像なし</span>
                </div>
              )}
            </div>
            <div>
              <h2>{movie.title}</h2>
              <p>
                {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開
                {' • '} {movie.duration}分
              </p>
              <p>{movie.genre}</p>

              {movie.releaseDate < new Date().toISOString() ? (
                movie.showingCount > 0 ? (
                <span>
                  上映中
                </span>
                  ) : movie.releaseDate === new Date().toISOString() ? (
                    <span>
                      本日公開
                    </span>
                  ) : (
                    <span>
                      上映予定
                    </span>
                  )
                ) : (
                  <span>
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