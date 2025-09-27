"use client"
import  React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SeatLayout from '@/app/_components/SeatLayout/SeatLayout';
import { ScreenSize } from '@/generated/prisma/client';


type Showings = {
    id: string;
    title  : string;
    startTime: string;
    endTime : string;
    uniformPrice: number;
    screenNumber: string;
    screenId : string;
    screenSize: ScreenSize;
    movieId : string;
    movie: {
        title: string;
        duration: string;
        releaseDate: string;
    };
    screen: {
        number: string;
        cinema: {
            name: string;
        };
    };
}

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const showingId = params.id as string;

    const [selectedSeats, setSelectedSeats] = useState<Array<{ id: string; label: string }>>([]);
    const [showing, setShowing] = useState<Showings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShowing = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/showings/${showingId}`);

                if (!res.ok) {
                    throw new Error('上映情報の取得に失敗しました');
                }

                const data = await res.json();
                setShowing(data);
                setLoading(false);
            } catch (err) {
                console.error('上映取得エラー:', err);
                setError('上映情報の読み込みに失敗しました');
                setLoading(false);
            }
        };

        if (showingId) {
            fetchShowing();
        }
    }, [showingId]);

    const handleSeatSelect = (seatId: string, isSelected: boolean, row: string, column: number) => {
        const seatLabel = `${row}${column}`;
        if (isSelected) {
            setSelectedSeats((prev) => [...prev, { id: seatId, label: seatLabel }]);
        } else {
            setSelectedSeats((prev) => prev.filter(seat => seat.id !== seatId));
        }
    };

    const handleGoToConfirm = () => {
        if (selectedSeats.length === 0) {
            alert('座席を選択してください');
            return;
        }

        const seatQuery = selectedSeats.map(seat => seat.id).join(',');
        router.push(`/booking/confirm?showingId=${showingId}&seats=${seatQuery}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">読み込み中...</div>
    </div>;

    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-500">{error}</div>
    </div>;

    if (!showing) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">上映情報が見つかりません</div>
    </div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="container mx-auto max-w-5xl bg-white shadow-lg border border-gray-300 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="header bg-white p-4 md:p-6 text-center border-b-2 border-gray-200 relative">
                    <Link href="/movie" className="top-button absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm md:text-base no-underline">
                        ＜ 上映スケジュールに戻る
                    </Link>
                    <div className="logo text-2xl md:text-3xl font-bold text-gray-900">
                        HAL CINEMAS
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-6">
                        チケット予約
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        {/* Movie Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border p-5">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">上映情報</h2>
                            <ul className="text-gray-700 space-y-2">
                                <li><strong>タイトル:</strong> {showing.movie.title}</li>
                                <li><strong>上映日時:</strong> {new Date(showing.startTime).toLocaleString('ja-JP')}</li>
                                <li><strong>上映時間:</strong> {showing.movie.duration}分</li>
                                <li><strong>シネマ:</strong> {showing.screen.cinema.name}</li>
                                <li><strong>スクリーン:</strong> {showing.screen.number}</li>
                                <li>
                                    <strong>料金:</strong>
                                    {showing.uniformPrice ?
                                        `${showing.uniformPrice.toLocaleString()}円 (1席あたり)` :
                                        'デフォルト料金体系(次のページで区分選択します)'
                                    }
                                </li>
                            </ul>
                        </div>

                        {/* Booking Summary Card */}
                        <div className="bg-white rounded-lg shadow-sm border p-5">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">予約情報</h2>
                            <ul className="text-gray-700 space-y-2">
                                <li><strong>選択座席数:</strong> <span className="text-blue-600 font-bold">{selectedSeats.length}席</span></li>
                                <li>
                                    <strong>選択座席:</strong>
                                    <span className="text-blue-600"> {selectedSeats.map(seat => seat.label).join(", ") || '未選択'}</span>
                                </li>
                                <li>
                                    <strong>合計金額(一般料金の場合):</strong>
                                    <span className="text-blue-600 font-bold">{(selectedSeats.length * (showing.uniformPrice || 1800)).toLocaleString()}円</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Seat Selection Section */}
                    <div className="bg-white rounded-lg shadow-sm border p-5 mt-6">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6 text-center">座席を選択してください</h2>
                        <div className="flex justify-center items-center p-4">
                            <SeatLayout
                                screenSize={showing.screenSize}
                                screenId={showing.screenId}
                                showingId={showing.id as string}
                                onSeatSelect={handleSeatSelect}
                            />
                        </div>
                    </div>
                </div>

                {/* Booking Button */}
                <div className="p-6 border-t border-gray-200 bg-gray-100 flex justify-center">
                    <button
                        onClick={handleGoToConfirm}
                        disabled={selectedSeats.length === 0}
                        className={`px-8 py-4 rounded-lg font-bold text-lg text-white w-full md:w-auto transition-colors duration-200
                        ${selectedSeats.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'}`
                        }
                    >
                        {selectedSeats.length > 0
                            ? `${selectedSeats.length}席を予約する`
                            : '座席を選択してください'}
                    </button>
                </div>
            </div>
        </div>
    );
}