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

export default  function BookingPage(){
    const params = useParams();
    const router = useRouter();
    const showingId  = params.id as string;

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

      // URLクエリで渡す
      const seatQuery = selectedSeats.map(seat => seat.id).join(',');
      router.push(`/booking/confirm?showingId=${showingId}&seats=${seatQuery}`);
    };

    if (loading) return <div>読み込み中...</div>;
    if (error) return <div>{error}</div>;
    if (!showing) return <div>上映情報が見つかりません</div>;


    return (
    <div className="container mx-auto p-4 md:p-6">
        <div>
            <Link href="/movie">
            ＜上映スケジュールに戻る
            </Link>
        </div>
        <div>
            <h1>{showing.title}</h1>

            <div>
                <div>
                    <h2>上映情報</h2>
                    <p>タイトル: {showing.movie.title}</p>
                    <p>上映日時: {new Date(showing.startTime).toLocaleString('ja-JP')}</p>
                    <p>上映時間: {showing.movie.duration}</p>
                    <p>シネマ: {showing.screen.cinema.name}</p>
                    <p>スクリーン: {showing.screen.number}</p>
                    <p>料金: {showing.price.toLocaleString()}円 (1席あたり)</p>
                </div>

                <div>
                    <h2>予約情報</h2>
                    <p>選択座席数: {selectedSeats.length}席</p>
                    <p>選択座席: {selectedSeats.map(seat => seat.label).join(", ") || '未選択'}</p>
                    <p>合計金額: {(selectedSeats.length * showing.price).toLocaleString()}円</p>

                </div>
            </div>

            <div>
                <h2>座席を選択してください</h2>
                <SeatLayout
                screenSize={showing.screenSize}
                screenId={showing.screenId}
                showingId={showing.id as string}
                onSeatSelect={handleSeatSelect}
                />
            </div>

            <div>
                <button
                    onClick={handleGoToConfirm}
                    disabled={selectedSeats.length === 0}
                    className={`px-6 py-3 rounded-lg font-bold text-white
                    ${selectedSeats.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
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