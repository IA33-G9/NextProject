'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Booking = {
  id: string;
  bookingReference: string;
  title: string;
  screenId: string;
  startTime: string;
  seats: string[];
  totalPrice: number;
  payMethod: string;
  status: string;
  seatDetails: Array<{
    seatId: string;
    seatLabel: string;
    ticketType: string;
    price: number;
  }>;
};

export default function ReservationCompletePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('予約情報の取得に失敗しました');
        }
        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewReservation = () => {
    router.push('/admin/reservation');
  };

  const handleAdminTop = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-lg text-gray-500">読み込み中...</p>
        </div>
    );
  }

  if (!booking) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">予約情報が見つかりません</p>
            <Link href="/admin" className="text-blue-600 hover:underline">
              管理者トップへ
            </Link>
          </div>
        </div>
    );
  }

  const formattedDateTime = new Date(booking.startTime).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodLabel =
      booking.payMethod === 'CREDIT_CARD'
          ? 'クレジットカード'
          : booking.payMethod === 'CASH'
              ? '現金'
              : 'モバイル決済';

  return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 print:p-0">

        {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm w-full">
              {error}
            </div>
        )}

        {/* チェックアイコン */}
        <div className="w-20 h-20 rounded-full bg-sky-500 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-sky-500 mb-1">予約が確定しました</h1>
        <p className="text-gray-500 text-sm mb-6">お客様の予約情報を登録されました</p>

        {/* 予約詳細ボックス */}
        <div className="w-full max-w-sm border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="text-center py-3 border-b border-gray-200 text-sm text-gray-600 font-medium bg-gray-50">
            予約詳細
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-gray-500">予約番号：</span>
              <span className="font-semibold text-gray-800">{booking.bookingReference}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-gray-500">映画：</span>
              <span className="font-semibold text-gray-800 text-right max-w-[60%]">{booking.title}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-gray-500">日時：</span>
              <span className="font-semibold text-gray-800">{formattedDateTime}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-gray-500">座席：</span>
              <span className="font-semibold text-gray-800">{booking.seats.join(' , ')}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-gray-500">料金：</span>
              <span className="font-semibold text-gray-800">¥{booking.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="w-full max-w-sm space-y-3 print:hidden">
          <button
              onClick={handlePrint}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-full transition-colors"
          >
            領収書発行
          </button>
          <button
              onClick={handleNewReservation}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-full border border-gray-300 transition-colors"
          >
            新しい予約を作成
          </button>
          <button
              onClick={handleAdminTop}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-full transition-colors"
          >
            トップへ
          </button>
        </div>
      </div>
  );
}