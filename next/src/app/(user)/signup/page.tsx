'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SignupForm } from '@/app/_components/UserAccount/SignupForm/SignupForm';

export default function SignUp() {
  const router = useRouter();
  const { data: session } = useSession();
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    // ログイン済みならリダイレクト
    if (session) {
      router.push('/movie');
    }
  }, [session, router]);

  const handleSignup = async (email: string, username: string, password: string) => {
    setGeneralError(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.error || 'ユーザーの作成に失敗しました');
        return;
      }

      router.push('/signin');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // ログイン中はローディング表示
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
        </div>

        {/* エラーメッセージ */}
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{generalError}</p>
          </div>
        )}

        {/* フォーム */}
        <SignupForm onSubmit={handleSignup} />

        {/* ログインリンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            既にアカウントをお持ちですか？{' '}
            <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-semibold">
              ログインする
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
