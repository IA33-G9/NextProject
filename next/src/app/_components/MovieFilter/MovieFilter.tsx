'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { router } from "next/client";

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
    <div className="container mx-auto max-w-7xl bg-white shadow-lg border border-gray-300">
      <div className="header bg-white p-2 text-center border-b-2 border-black relative">
        <Link href="/" className="top-button absolute left-5 top-1/2 -translate-y-1/2 bg-red-500 text-white border-none px-4 py-2 rounded-md font-bold text-sm no-underline transition-colors hover:bg-red-600">
          TOPに戻る
        </Link>
        <div className="logo text-2xl font-bold text-black font-luckiest-guy">
          HAL CINEMAS
        </div>
      </div>

      <div className="tab-container flex w-full">
        <button
          onClick={() => setFilter('all')}
          className={`tab flex-1 text-center py-4 cursor-pointer font-bold ${filter === 'all' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}
        >
          すべての映画
        </button>
        <button
          onClick={() => setFilter('showing')}
          className={`tab flex-1 text-center py-4 cursor-pointer font-bold ${filter === 'showing' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}
        >
          上映中のみ
        </button>
      </div>

      <div className="filter-bar flex p-2 overflow-x-auto gap-1 justify-center">
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer active bg-red-500 text-white border-red-500">
          すべて
        </button>
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer">
          アニメ
        </button>
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer">
          アクション
        </button>
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer">
          ドラマ
        </button>
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer">
          コメディ
        </button>
        <button className="filter-button px-5 py-2 rounded-2xl whitespace-nowrap border border-gray-300 bg-white text-sm cursor-pointer">
          ホラー
        </button>
      </div>

      <div className="search-bar p-4 flex justify-center">
        <input
          type="text"
          className="search-input w-full max-w-3xl p-2 border border-gray-300 rounded-md box-border"
          placeholder="作品名を入力..."
        />
      </div>

      <div className="movie-container active p-5">
        <div className="movie-list flex flex-col gap-10 items-center">
          {filteredMovies.map((movie) => (
            <Link
              key={movie.id}
              href={`movie/${movie.id}`}
              className="movie-card border-b border-gray-200 pb-7 w-full max-w-4xl text-center cursor-pointer"
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
                <h2 className="movie-title font-bold mb-4 text-3xl text-gray-800">
                  {movie.title}
                </h2>
                <p className="movie-rating text-red-500 mb-5 text-2xl">
                  {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開
                  {' • '} {movie.duration}分
                </p>
                <p>{movie.genre}</p>
                <div className="flex justify-center mt-5">
                  {movie.releaseDate < new Date().toISOString() ? (
                    movie.showingCount > 0 ? (
                      // <a href="#" className="reservation-button bg-red-500 text-white border-none px-10 py-5 w-96 max-w-[90%] text-center cursor-pointer font-bold text-xl inline-block no-underline rounded-lg transition-colors hover:bg-red-600">
                      //   予約
                      // </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push('');
                        }}
                        className="reservation-button bg-red-500 text-white border-none px-10 py-5 w-96 max-w-[90%] text-center cursor-pointer font-bold text-xl inline-block no-underline rounded-lg transition-colors hover:bg-red-600"
                      >
                        予約
                      </button>
                    ) : (
                      <span className="reservation-button inactive bg-gray-300 text-white border-none px-10 py-5 w-96 max-w-[90%] text-center cursor-not-allowed font-bold text-xl inline-block no-underline rounded-lg">
                        上映予定
                      </span>
                    )
                  ) : (
                    <span className="reservation-button inactive bg-gray-300 text-white border-none px-10 py-5 w-96 max-w-[90%] text-center cursor-not-allowed font-bold text-xl inline-block no-underline rounded-lg">
                      上映予定
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}