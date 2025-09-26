'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface BookingDetails {
    bookingId: string;
    bookingReference: string;
    title: string;
    screenName: string;
    startTime: string;
    seats: string[];
    totalPrice: number;
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
                const res = await fetch(`/api/bookings/${bookingId}`);
                if (!res.ok) {
                    const errorText = await res.text();
                    let errorMessage = '予約情報の取得に失敗しました';
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData && errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch (e) {
                        console.error('JSON parse error for error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await res.json();
                setBooking(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : '予約情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent mb-4"></div>
                    <p className="text-gray-600">予約情報を読み込んでいます...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-center text-red-700">
                    <p className="text-lg mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        トップページに戻る
                    </button>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="max-w-md mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-700">
                    <p className="text-lg mb-4">予約情報が見つかりませんでした</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                    >
                        トップページに戻る
                    </button>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(booking.startTime).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="container max-w-6xl mx-auto bg-white shadow-lg">
            <header className="p-5 flex justify-between items-center border-b-4 border-black">
                <div className="text-3xl text-black font-['Luckiest_Guy',cursive]">HAL CINEMAS</div>
            </header>
            
            <main className="main flex flex-col items-center justify-center p-10 text-center">
                <div className="success-icon w-16 h-16 bg-green-500 rounded-full flex justify-center items-center text-white text-3xl mb-5">
                    ✓
                </div>
                
                <h2 className="complete-title font-bold text-3xl text-green-500 mb-4">予約が完了しました。</h2>
                
                <p className="complete-message text-base text-gray-600 mb-8 leading-relaxed">
                    ご来場をお待ちしております！<br />
                    予約内容の詳細は以下の通りです。
                </p>

                <div className="ticket-info bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8 max-w-lg w-full">
                    <h3 className="text-xl text-gray-800 font-bold mb-4">予約詳細</h3>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>予約番号:</span>
                        <strong className="font-bold">{booking.bookingReference}</strong>
                    </div>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>映画:</span>
                        <strong className="font-bold">{booking.title}</strong>
                    </div>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>日時:</span>
                        <strong className="font-bold">{formattedDate}</strong>
                    </div>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>劇場:</span>
                        <strong className="font-bold">{booking.screenName}</strong>
                    </div>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>座席:</span>
                        <strong className="font-bold">{booking.seats.join(', ')}</strong>
                    </div>
                    <div className="ticket-detail flex justify-between items-center mb-2 text-sm">
                        <span>合計金額:</span>
                        <strong className="font-bold">¥{booking.totalPrice.toLocaleString()}</strong>
                    </div>
                </div>

                {/* キャンセルのご案内の代わりに、予約票を印刷するボタンを配置 */}
                <button
                    onClick={() => window.print()}
                    className="inline-block px-8 py-3 bg-blue-600 text-white rounded-full font-bold text-base transition-colors duration-300 hover:bg-blue-700 mb-5"
                >
                    予約票を印刷する
                </button>
                
                <Link href="/" className="top-button inline-block px-8 py-3 bg-black text-white rounded-full font-bold text-base transition-colors duration-300 hover:bg-gray-700">
                    トップへ
                </Link>
            </main>
        </div>
    );
}