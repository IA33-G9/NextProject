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

    if (error) return <div>{error}</div>;

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
        <div>
            <h1>予約確認</h1>

            <div>
        <span>
          予約完了
        </span>
            </div>

            <div>
                <h2>予約番号</h2>
                <p>{booking.bookingReference}</p>
            </div>

            <div>
                <h2>映画情報</h2>

                <p>{booking.title}</p>
                <p>上映時刻 : {formattedDate}</p>
                <p>スクリーン : {booking.screenName}</p>
            </div>

            <div>
                <h2>座席</h2>
                <div>
                    {booking.seats.map((seat, index) => (
                        <span key={index}>
                            {seat}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h2>お支払い</h2>
                <div>
                    <span>合計金額</span>
                    <span>¥{booking.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            <div>
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
