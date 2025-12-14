'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormField } from './FormField';

export function SigninForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
            setError(result.error);
            return;
            }

            router.push('/movie');
            router.refresh();

        } catch (err) {
            setError('ログイン中にエラーが発生しました');
            console.error('SignIn error:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField
                label="メールアドレス"
                type="email"
                name="email"
            />
            <FormField
                label="パスワード"
                type="password"
                name="password"
            />
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}
            <button
                type="submit"
                className="w-full mt-6 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                ログイン
            </button>
        </form>
    );
}