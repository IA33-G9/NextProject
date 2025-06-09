'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/app/_components/UserAccount/SignupForm/SignupForm';

export default function SignUp() {
  const router = useRouter();
  const [generalError, setGeneralError] = useState<string | null>(null);


  const handleSignup = async (email: string, username: string,password:string) => {
    setGeneralError(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username,password }),
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

  return (
    <div>
      <h1>ユーザー作成</h1>

      <SignupForm onSubmit={handleSignup}  />

      {generalError && <div>{generalError}</div>}
    </div>
  );
}