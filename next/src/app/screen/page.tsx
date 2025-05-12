'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/type/screen/screen';

// スクリーンサイズの日本語表示
const screenSizeLabel = {
  LARGE: '大スクリーン',
  MEDIUM: '中スクリーン',
  SMALL: '小スクリーン',
};

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/screens');

        if (!response.ok) {
          throw new Error('スクリーン情報の取得に失敗しました');
        }

        const data = await response.json();
        setScreens(data);
        setLoading(false);
      } catch (err) {
        console.error('スクリーン取得エラー:', err);
        setError('スクリーン情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchScreens();
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>HALシネマ スクリーン一覧</h1>

      <div>
        {screens.map((screen) => (
          <div key={screen.id}>
            <div>
              <h2>
                スクリーン {screen.number}番
              </h2>
              <div>
                <span>
                  {screenSizeLabel[screen.size]}
                </span>
              </div>
              <div>
                <p>行数: {screen.rows}行 (A-{String.fromCharCode(64 + screen.rows)})</p>
                <p>列数: {screen.columns}列</p>
                <p>総座席数: {screen.capacity}席</p>
              </div>
              <Link
                href={`/screen/${screen.id}`}
              >
                座席レイアウトを見る
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}