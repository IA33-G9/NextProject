'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Movie = {
  id: string;
  title: string;
  imageUrl?: string;
  posterUrl?: string;
  releaseDate: string;
  duration: number;
  genre: string;
};

type Showing = {
  id: string;
  startTime: string;
  endTime: string;
  movieId: string;
};

type GroupedShowings = {
  date: string;
  showings: Showing[];
};

export default function ShowingSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.movieId as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [groupedShowings, setGroupedShowings] = useState<GroupedShowings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/movies/${movieId}`);
        if (!response.ok) {
          throw new Error('映画情報の取得に失敗しました');
        }
        const data = await response.json();
        setMovie(data);

        // Filter future showings
        const now = new Date();
        const futureShowings = data.showings.filter((showing: Showing) => {
          return new Date(showing.startTime) >= now;
        });

        // Group by date
        const grouped = futureShowings.reduce(
            (acc: Record<string, Showing[]>, showing: Showing) => {
              const date = new Date(showing.startTime).toLocaleDateString('ja-JP');
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push(showing);
              return acc;
            },
            {}
        );

        // Convert to array and sort
        const result = Object.entries(grouped)
            .map(([date, showings]) => ({
              date,
              showings: showings.sort(
                  (a, b) =>
                      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              ),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setGroupedShowings(result);
        if (result.length > 0) {
          setSelectedDate(result[0].date);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <p className="text-lg text-gray-400">読み込み中...</p>
        </div>
    );
  }

  if (!movie) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">映画情報が見つかりません</p>
            <Link href="/admin/reservation" className="text-blue-400 hover:underline text-lg">
              戻る
            </Link>
          </div>
        </div>
    );
  }

  // 選択中の日付グループのみ取得
  const selectedGroup = groupedShowings.find((g) => g.date === selectedDate);

  return (
      <div className="bg-gray-50 text-white min-h-screen p-4 md:p-0">
        <div className="container mx-auto max-w-7xl bg-gray-800 shadow-xl rounded-lg overflow-hidden">

          {/* Movie Details Section */}
          <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Image Section */}
              <div className="flex-shrink-0 w-full md:w-80 lg:w-96">
                {movie.imageUrl || movie.posterUrl ? (
                    <Image
                        src={movie.imageUrl || movie.posterUrl || ''}
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

              {/* Movie Info Section */}
              <div className="flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{movie.title}</h1>
                <p className="text-red-500 text-lg md:text-xl mb-4">
                  {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開 ・ {movie.duration}分
                  ・ {movie.genre}
                </p>
                <p className="text-gray-400 text-lg">上映日時・時間帯を選択してください</p>
              </div>
            </div>
          </div>

          {error && (
              <div className="mx-4 md:mx-8 mb-4 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
                {error}
              </div>
          )}

          {/* Schedule Section */}
          <div className="p-4 md:p-8 border-t border-gray-700">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              上映スケジュール
            </h2>

            {groupedShowings.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">上映予定がありません</p>
                </div>
            ) : (
                <>
                  {/* Date Selection Tabs */}
                  <div className="flex gap-4 mb-6 overflow-x-auto p-2 border-b border-gray-700">
                    {groupedShowings.map((group) => {
                      const dateObj = new Date(group.date);
                      const today = new Date();
                      const isToday =
                          dateObj.toLocaleDateString('ja-JP') === today.toLocaleDateString('ja-JP');
                      const formatted = dateObj.toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        weekday: 'short',
                      });

                      return (
                          <button
                              key={group.date}
                              onClick={() => setSelectedDate(group.date)}
                              className={`flex-none px-6 py-3 rounded-lg whitespace-nowrap border-2 transition-all font-semibold
                        ${
                                  selectedDate === group.date
                                      ? 'bg-red-500 text-white border-red-500'
                                      : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                              }`}
                          >
                            <div className="text-sm md:text-base">{formatted}</div>
                            {isToday && <div className="text-xs text-red-300">今日</div>}
                          </button>
                      );
                    })}
                  </div>

                  {/* 選択した日付の上映時間のみ表示 */}
                  {selectedGroup && (
                      <div className="mb-8 p-6 bg-gray-700 rounded-xl shadow-lg border border-gray-600">
                        <div className="flex flex-wrap gap-4">
                          {selectedGroup.showings.map((showing) => {
                            const startTime = new Date(showing.startTime);
                            const endTime = new Date(showing.endTime);
                            const startTimeStr = startTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const endTimeStr = endTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                                <Link
                                    key={showing.id}
                                    href={`/admin/reservation/seat/${showing.id}`}
                                    className="bg-gray-900 text-white px-6 py-4 rounded-lg shadow-md border border-gray-600 transition-transform transform hover:scale-105"
                                >
                                  <div className="text-lg font-semibold mb-1">
                                    {startTimeStr} - {endTimeStr}
                                  </div>
                                </Link>
                            );
                          })}
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>
        </div>
      </div>
  );
}