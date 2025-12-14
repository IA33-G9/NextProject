'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SigninForm } from '@/app/_components/UserAccount/SigninForm/SigninForm';

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // ログイン済みならリダイレクト
    if (session) {
      router.push('/movie');
    }
  }, [session, router]);

  // ログイン中はローディング表示
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
        </div>

        {/* フォーム */}
        <SigninForm />

        {/* 登録リンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            アカウントをお持ちではありませんか？{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
              新規登録する
            </Link>
          </p>
        </div>

        {/* ホームへのリンク */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
