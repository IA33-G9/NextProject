// src/app/booking/confirm/[id]/page.tsx
'use client';

import {useState, useEffect} from 'react';
import {useParams} from 'next/navigation';

interface BookingDetails {
    bookingId: string;
    bookingReference: string;
    title: string;
    screenName: string;
    startTime: string;
    seats: string[];
    totalAmount: number;
    status: string;
}

export default function BookingConfirmPage() {
    const params = useParams();
    const bookingId = params.id as string;
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) {
                setError('予約IDが指定されていません');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // デバッグ情報を追加
                console.log(`Page: Fetching booking details for ID: ${bookingId}`);

                // API エンドポイントを呼び出す
                const res = await fetch(`/api/bookings/${bookingId}`);

                console.log(`Page: Received response with status: ${res.status}`);

                // エラーレスポンスの処理
                if (!res.ok) {
                    const errorText = await res.text(); // JSONパースエラーを避けるためにテキストとして取得
                    console.error('Page: Booking fetch error:', res.status, errorText);

                    let errorMessage = '予約情報の取得に失敗しました';

                    try {
                        // JSONとしてパースできるか試みる
                        const errorData = JSON.parse(errorText);
                        if (errorData && errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch (e) {
                        console.error('Page: JSON parse error for error response:', e);
                    }

                    throw new Error(errorMessage);
                }

                // 成功レスポンスの処理
                const data = await res.json();
                console.log('Page: Booking data received:', data);
                setBooking(data);
                setError(null);
            } catch (err) {
                console.error('Page: 予約情報取得エラー:', err);
                setError(err instanceof Error ? err.message : '予約情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="text-center">
                    <div
                        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                    <p>予約情報を読み込んでいます...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-red-600 text-xl font-semibold mb-4">エラーが発生しました</h2>
                <p className="mb-4">{error}</p>
                <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
                    <p className="font-medium">デバッグ情報:</p>
                    <p className="font-mono text-sm mt-1">予約ID: {bookingId || 'なし'}</p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    トップページに戻る
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-lg mb-4">予約情報が見つかりませんでした</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    トップページに戻る
                </button>
            </div>
        );
    }

    // 日付をフォーマット
    const formattedDate = new Date(booking.startTime).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-6">予約確認</h1>

            <div className="mb-8 text-center">
        <span className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full">
          予約完了
        </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">予約番号</h2>
                <p className="text-2xl font-mono text-center">{booking.bookingReference}</p>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
                <h2 className="text-lg font-semibold mb-2">映画情報</h2>

                <p className="text-xl mb-1">{booking.title}</p>
                <p>上映時刻 : {formattedDate}</p>
                <p>スクリーン : {booking.screenName}</p>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
                <h2 className="text-lg font-semibold mb-2">座席</h2>
                <div className="flex flex-wrap gap-2">
                    {booking.seats.map((seat, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {seat}
            </span>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8">
                <h2 className="text-lg font-semibold mb-2">お支払い</h2>
                <div className="flex justify-between text-lg">
                    <span>合計金額</span>
                    <span className="font-bold">¥{booking.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                    予約票を印刷する
                </button>
            </div>
        </div>
    );
}
