'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="user-layout">
      {/* 固定ヘッダー */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="header bg-white p-2 border-b-2 border-black flex items-center justify-center relative">
          <div className="text-2xl text-black font-['Luckiest_Guy',cursive]">HAL CINEMAS</div>
          {session && (
            <div className="absolute right-4 flex items-center space-x-4">
              <Link href="/movie" className="text-gray-600 hover:text-gray-900">
                映画一覧
              </Link>
              <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                マイページ
              </Link>
            </div>
          )}
        </div>
      </nav>
      {/* メインコンテンツ */}
      <main className="min-h-screen bg-gray-50">{children}</main>
    </div>
  );
}
