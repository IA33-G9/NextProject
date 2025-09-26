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

            router.push('/');
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
            {error && <div>{error}</div>}
            <div>
                <button type="submit">ログイン</button>
            </div>
        </form>
    );
}