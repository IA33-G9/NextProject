'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ScreenSize } from '@/generated/prisma/client';

export type Cinema = {
  id: string;
  name: string;
  location: string;
};

export type Screen = {
  id: string;
  number: string;
  size: ScreenSize;
  rows: number;
  columns: number;
  capacity: number;
  cinema: Cinema;
};
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
      <div>
        <div>
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
                <div>
                  {format(dateObj, 'M/d', { locale: ja })}（{format(dateObj, 'E', { locale: ja })}）
                </div>
                {isToday && <div>今日</div>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && groupedShowings[selectedDate] && (
        <div>
          <div>
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
              <div key={cinemaId}>
                <h3>{cinema.name}</h3>
                <div>
                  {showings
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(showing => (
                      <Link
                        key={showing.id}
                        href={`/booking/${showing.id}`}
                      >
                        <div>
                          <span>
                            {format(new Date(showing.startTime), 'HH:mm')} - {format(new Date(showing.endTime), 'HH:mm')}
                          </span>
                          <span>
                            スクリーン {showing.screen.number}
                          </span>
                        </div>
                        <div>
                          {showing.screen.size === 'LARGE' && '大スクリーン'}
                          {showing.screen.size === 'MEDIUM' && '中スクリーン'}
                          {showing.screen.size === 'SMALL' && '小スクリーン'}
                        </div>
                        <div>
                          <span>¥{showing.price.toLocaleString()}</span>
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