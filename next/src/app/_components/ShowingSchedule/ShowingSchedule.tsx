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
    const grouped = showings.reduce((acc, showing) => {
      const dateKey = format(new Date(showing.startTime), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(showing);
      return acc;
    }, {} as {[key: string]: Showing[]});

    setGroupedShowings(grouped);

    if (Object.keys(grouped).length > 0 && !selectedDate) {
      setSelectedDate(Object.keys(grouped)[0]);
    }
  }, [showings, selectedDate]);

  const availableDates = Object.keys(groupedShowings).sort();

  return (
    <div className="bg-gray-900 text-white p-4 md:p-8">
      {/* Date Selection Buttons */}
      <div className="flex gap-4 mb-6 overflow-x-auto p-2 border-b border-gray-700">
        {availableDates.map(dateKey => {
          const dateObj = new Date(dateKey);
          const isToday = isSameDay(dateObj, new Date());

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={`flex-none px-6 py-3 rounded-lg whitespace-nowrap border-2 transition-all font-semibold
                ${selectedDate === dateKey
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <div className="text-sm md:text-base">
                {format(dateObj, 'M/d', { locale: ja })}（{format(dateObj, 'E', { locale: ja })}）
              </div>
              {isToday && <div className="text-xs text-red-300">今日</div>}
            </button>
          );
        })}
      </div>

      {selectedDate && groupedShowings[selectedDate] && (
        <div>
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
            <div key={cinemaId} className="mb-8 p-6 bg-gray-700 rounded-xl shadow-lg border border-gray-600">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{cinema.name}</h3>
              <div className="flex flex-wrap gap-4">
                {showings
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(showing => (
                    <Link
                      key={showing.id}
                      href={`/booking/${showing.id}`}
                      className="bg-gray-900 text-white px-6 py-4 rounded-lg shadow-md border border-gray-600 transition-transform transform hover:scale-105"
                    >
                      <div className="text-lg font-semibold mb-1">
                        <span>
                          {format(new Date(showing.startTime), 'HH:mm')} - {format(new Date(showing.endTime), 'HH:mm')}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        スクリーン {showing.screen.number}
                      </div>
                      <div className="text-gray-400 text-sm mb-2">
                        {showing.screen.size === 'LARGE' && '大スクリーン'}
                        {showing.screen.size === 'MEDIUM' && '中スクリーン'}
                        {showing.screen.size === 'SMALL' && '小スクリーン'}
                      </div>
                      <div className="text-xl font-bold text-red-500">
                        <span>¥{showing.price.toLocaleString()}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}