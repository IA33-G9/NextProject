'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Screen} from '@/type/screen/screen';
import  { Cinema } from '@/type/cinema/cinema';


type Showing = {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
  screen: Screen;
};

interface ShowingScheduleProps {
  showings: Showing[];
}

export default function ShowingSchedule({ showings }: ShowingScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [groupedShowings, setGroupedShowings] = useState<{[key: string]: Showing[]}>({});

  useEffect(() => {
    // グループ化された上映情報を作成
    const grouped = showings.reduce((acc, showing) => {
      const dateKey = format(new Date(showing.startTime), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(showing);
      return acc;
    }, {} as {[key: string]: Showing[]});

    setGroupedShowings(grouped);

    // デフォルトで最初の日付を選択
    if (Object.keys(grouped).length > 0 && !selectedDate) {
      setSelectedDate(Object.keys(grouped)[0]);
    }
  }, [showings, selectedDate]);

  // 上映日付の一覧を取得
  const availableDates = Object.keys(groupedShowings).sort();

  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2">
          {availableDates.map(dateKey => {
            const dateObj = new Date(dateKey);
            const isToday = isSameDay(dateObj, new Date());

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  selectedDate === dateKey
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <div className="font-medium">
                  {format(dateObj, 'M/d', { locale: ja })}（{format(dateObj, 'E', { locale: ja })}）
                </div>
                {isToday && <div className="text-xs">今日</div>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && groupedShowings[selectedDate] && (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* 映画館ごとにグループ化 */}
            {Object.entries(
              groupedShowings[selectedDate].reduce((acc, showing) => {
                const cinemaId = showing.screen.cinema.id;
                if (!acc[cinemaId]) {
                  acc[cinemaId] = {
                    cinema: showing.screen.cinema,
                    showings: []
                  };
                }
                acc[cinemaId].showings.push(showing);
                return acc;
              }, {} as {[key: string]: {cinema: Cinema, showings: Showing[]}})
            ).map(([cinemaId, { cinema, showings }]) => (
              <div key={cinemaId} className="mb-8 last:mb-0">
                <h3 className="text-xl font-semibold mb-4">{cinema.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {showings
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(showing => (
                      <Link
                        key={showing.id}
                        href={`/booking/new?showingId=${showing.id}`}
                        className="block bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">
                            {format(new Date(showing.startTime), 'HH:mm')} - {format(new Date(showing.endTime), 'HH:mm')}
                          </span>
                          <span className="text-sm text-gray-600">
                            スクリーン {showing.screen.number}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {showing.screen.size === 'LARGE' && '大スクリーン'}
                          {showing.screen.size === 'MEDIUM' && '中スクリーン'}
                          {showing.screen.size === 'SMALL' && '小スクリーン'}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-lg font-semibold">¥{showing.price.toLocaleString()}</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}