import Link from 'next/link';
import ClientSession from '@/app/_components/ClientSession/ClientSession';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          {/* ロゴ */}
          <div className="text-6xl font-['Luckiest_Guy',cursive] text-gray-900 mb-4 text-center">
            HAL CINEMAS
          </div>

          {/* ユーザーセッション */}
          {/*<ClientSession />*/}

          {/* 未ログイン時のCTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-700 mb-6">
              初めての方は新規登録、既にアカウントがある方はログインしてください
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signin"
                className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
