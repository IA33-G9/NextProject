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
    price   : number;
    screenNumber: string;
    screenId : string;
    screenSize: ScreenSize;
}

export default  function BookingPage(){
    const params = useParams();
    const router = useRouter();
    const showingId  = params.id as string;

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
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

    const handleSeatSelect = (seatId: string, isSelected: boolean) => {
        if (isSelected) {
          setSelectedSeats([...selectedSeats, seatId]);

        } else {
          setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        }
    };


    const handleGoToConfirm = () => {
      if (selectedSeats.length === 0) {
        alert('座席を選択してください');
        return;
      }

      // URLクエリで渡す
      const seatQuery = selectedSeats.join(',');
      router.push(`/booking/confirm?showingId=${showingId}&seats=${seatQuery}`);
    };

    if (loading) return <div>読み込み中...</div>;
    if (error) return <div>{error}</div>;
    if (!showing) return <div>上映情報が見つかりません</div>;


    return (
    <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
            <Link href="/movie" className="text-blue-600 hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            上映スケジュールに戻る
            </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold mb-6 text-center">{showing.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">上映情報</h2>
                    <p><span className="font-medium">日時:</span> {new Date(showing.startTime).toLocaleString('ja-JP')}</p>
                    <p><span className="font-medium">スクリーン:</span> {showing.screenId}</p>
                    <p><span className="font-medium">料金:</span> {showing.price.toLocaleString()}円 (1席あたり)</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">予約情報</h2>
                    <p><span className="font-medium">選択座席数:</span> {selectedSeats.length}席</p>
                    <p><span className="font-medium">選択座席:</span> {selectedSeats.join(', ') || '未選択'}</p>
                    <p><span className="font-medium">合計金額:</span> {(selectedSeats.length * showing.price).toLocaleString()}円</p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center">座席を選択してください</h2>
                <SeatLayout
                screenSize={showing.screenSize}
                screenId={showing.screenId}
                showingId={showing.id as string}
                onSeatSelect={handleSeatSelect}
                />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleGoToConfirm}
                    disabled={selectedSeats.length === 0}
                    className={`px-6 py-3 rounded-lg font-bold text-white
                    ${selectedSeats.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {selectedSeats.length > 0
                        ? `${selectedSeats.length}席を確認する`
                        : '座席を選択してください'}
                </button>

            </div>
        </div>
    </div>
    );
}