'use client';
import { useSession } from 'next-auth/react';
import SignOut from "@/app/_components/UserAccount/SignOutForm/SignOut";
import {SigninForm} from "@/app/_components/UserAccount/SigninForm/SigninForm";
import Link from "next/link";

export default function ClientSession() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <div>
          <p>ログイン中: {session.user?.email}</p>
          <SignOut/>
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
