'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScreenSize } from '@/generated/prisma/client';

type Showing = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  price: number;
  screenNumber: string;
  screenId: string;
  screenSize: ScreenSize;
};

interface BookingDetails {
  bookingId: string;
  bookingReference: string; // これは使わないので表示しない
  title: string;
  screenName: string;
  startTime: string;
  seats: string[];
  totalAmount: number;
  status: string;
}

export default function BookingConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  // クエリから上映IDと座席ID取得
  const showingId = searchParams.get('showingId');
  const seatIds = searchParams.get('seats')?.split(',') || [];

  // URLパラメータから予約IDを取得（予約完了時用）
  const bookingId = params.id as string | undefined;

  // 状態管理
  const [showing, setShowing] = useState<Showing | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loadingShowing, setLoadingShowing] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [errorShowing, setErrorShowing] = useState<string | null>(null);
  const [errorBooking, setErrorBooking] = useState<string | null>(null);

  // 上映情報を取得
  useEffect(() => {
    if (!showingId) {
      setErrorShowing('上映IDが指定されていません');
      setLoadingShowing(false);
      return;
    }

    const fetchShowing = async () => {
      try {
        const res = await fetch(`/api/showings/${showingId}`);
        if (!res.ok) throw new Error('上映情報取得に失敗');
        const data = await res.json();
        setShowing(data);
        setErrorShowing(null);
      } catch (e) {
        setErrorShowing('上映情報の読み込みに失敗しました');
      } finally {
        setLoadingShowing(false);
      }
    };
    fetchShowing();
  }, [showingId]);

  // 予約詳細を取得（予約IDがある場合のみ）
  useEffect(() => {
    if (!bookingId) {
      setLoadingBooking(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error('予約情報の取得に失敗');
        const data = await res.json();
        setBooking(data);
        setErrorBooking(null);
      } catch (e) {
        setErrorBooking('予約情報の読み込みに失敗しました');
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBooking();
  }, [bookingId]);
  const handleConfirmBooking = async () => {
      try {
          const response = await fetch(`/api/bookings`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({showingId, seatIds}),
          });

          if (!response.ok) throw new Error('予約に失敗');

          const data = await response.json();
          alert('予約が完了しました');
          router.push(`/booking/completed/${data.bookingId}`);
      } catch (err) {
          console.error(err);
          alert('予約に失敗しました');
      }
  };
  // ローディング・エラー処理
  if (loadingShowing || loadingBooking) {
    return <div className="text-center py-20">読み込み中...</div>;
  }
  if (errorShowing) {
    return <div className="text-center text-red-600 py-20">{errorShowing}</div>;
  }

  // 表示用の映画情報は予約詳細があればそちら、なければ上映情報
  const movieTitle = booking?.title || showing?.title || '';
  const screenName = booking?.screenName || showing?.screenNumber || '';
  const startTime = booking?.startTime || showing?.startTime || '';
  const seats = booking?.seats.length ? booking.seats : seatIds;
  const totalAmount = booking?.totalAmount || (seats.length * (showing?.price || 0));

  const formattedDate = new Date(startTime).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">予約確認</h1>

        {/* 予約番号は表示しない */}

        {/* 映画情報 */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">映画情報</h2>
          <p className="text-xl mb-1">{movieTitle}</p>
          <p>上映時刻 : {formattedDate}</p>
          <p>スクリーン : {screenName}</p>
        </div>

        {/* 座席 */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">座席</h2>
          <div className="flex flex-wrap gap-2">
            {seats.map((seat, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {seat}
            </span>
            ))}
          </div>
        </div>

        {/* お支払い */}
        <div className="border-t border-gray-200 pt-4 mb-8">
          <h2 className="text-lg font-semibold mb-2">お支払い</h2>
          <div className="flex justify-between text-lg">
            <span>合計金額</span>
            <span className="font-bold">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
              onClick={handleConfirmBooking}
              className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700"
          >
            予約を確定する
          </button>
        </div>
      </div>
  );
}
