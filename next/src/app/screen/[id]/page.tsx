'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SeatLayout from '@/app/_components/SeatLayout/SeatLayout';

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
// スクリーンサイズの日本語表示
const screenSizeLabel = {
  LARGE: '大スクリーン',
  MEDIUM: '中スクリーン',
  SMALL: '小スクリーン',
};

export default function ScreenDetailPage() {
  const params = useParams();
  const screenId = params.id as string;

  const [screen, setScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScreen = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/screens/${screenId}`);

        if (!response.ok) {
          throw new Error('スクリーン情報の取得に失敗しました');
        }

        const data = await response.json();
        setScreen(data);
        setLoading(false);
      } catch (err) {
        console.error('スクリーン取得エラー:', err);
        setError('スクリーン情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    if (screenId) {
      fetchScreen();
    }
  }, [screenId]);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!screen) return <div>スクリーン情報が見つかりません</div>;

  return (
    <div>
      <div>
        <Link href="/screen">
          ← スクリーン一覧に戻る
        </Link>
      </div>

      <div>
        <div>
          <h1>
            スクリーン {screen.number}番
          </h1>

          <div>
            <span>
              {screenSizeLabel[screen.size]}
            </span>
            <span>
              {screen.cinema.name}
            </span>
          </div>

          <div>
            <div>
              <div>行数</div>
              <div >{screen.rows}行 (A-{String.fromCharCode(64 + screen.rows)})</div>
            </div>
            <div>
              <div>列数</div>
              <div>{screen.columns}列</div>
            </div>
            <div>
              <div>総座席数</div>
              <div>{screen.capacity}席</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div>
          <h2>座席レイアウト</h2>
          <SeatLayout
            screenSize={screen.size}
            screenId={screen.id}
            bookedSeats={[screen.id]} // 実際の予約済み座席を表示する場合はAPIから取得
          />
        </div>
      </div>
    </div>
  );
}