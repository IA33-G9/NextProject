'use client';
import { useSession } from 'next-auth/react';
import SignOut from '@/app/_components/UserAccount/SignOutForm/SignOut';
import Link from 'next/link';

export default function ClientSession() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <div>
          <Link href={`/movie`}>映画一覧</Link>
          <p>ログイン中: {session.user?.email}</p>
          <p>{session.user?.name}</p>
          <SignOut />
        </div>
      ) : (
        <div>
          <p>未ログイン</p>
          <Link href={'/signin'}>サインイン</Link>
        </div>
      )}
    </div>
  );
}
