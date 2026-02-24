'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Booking = {
  id: string;
  bookingReference: string;
  title: string;
  screenId: string;
  screen: string | number;
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
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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

  const handleShowTickets = async () => {
    setShowTicketModal(true);
    if (qrCode) return; // 取得済みなら再fetch不要
    try {
      setQrLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode); // data:image/png;base64,...
      }
    } finally {
      setQrLoading(false);
    }
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
              <span className="font-semibold text-gray-800">{booking.seatDetails.map(seat => seat.seatLabel).join(' , ')}</span>
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
              onClick={handleShowTickets}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors"
          >
            チケット
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

        {/* チケットモーダル */}
        {showTicketModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-blue-200">
                <h2 className="text-2xl font-bold text-blue-700">チケット</h2>
                <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {booking.seatDetails.map((seat) => {
                  const ticketDate = new Date(booking.startTime).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  });
                  const ticketTime = new Date(booking.startTime).toLocaleString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                        key={seat.seatId}
                        className="flex border-2 border-blue-400 rounded-lg overflow-hidden h-56 shadow-md hover:shadow-lg transition-shadow bg-white"
                    >
                      {/* 左側 6割 */}
                      <div className="w-3/5 p-6 flex flex-col justify-between bg-gradient-to-br from-white to-blue-50 border-r-2 border-blue-200">
                        <div>
                          <p className="text-xs font-bold tracking-widest text-blue-600 mb-2">
                            HAL CINEMAS
                          </p>
                          <p className="text-xl font-bold leading-tight line-clamp-2 text-gray-800">
                            {booking.title}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-base text-gray-600">{ticketDate} {ticketTime}</p>
                          <p className="text-base text-gray-600">スクリーン: <span className="font-semibold text-blue-700 text-lg">{booking.screen}</span></p>
                        </div>
                        <p className="text-4xl font-bold text-blue-600">{seat.seatLabel}</p>
                      </div>

                      {/* 右側 4割 */}
                      <div className="w-2/5 p-4 flex flex-col items-center justify-between bg-white border-l-2 border-blue-200">
                        <p className="text-[11px] font-bold tracking-widest text-blue-500 text-center leading-tight">
                          HAL CINEMAS
                        </p>
                        <div className="text-xs text-blue-600 text-center space-y-1 font-medium">
                          <p className="leading-tight">{ticketDate}</p>
                          <p className="leading-tight">{ticketTime}</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-blue-700 font-bold">SCR:</span>
                            <span className="font-bold text-blue-700">{booking.screen}</span>
                          </div>
                          <p className="text-sm font-bold text-blue-700 pt-1">{seat.seatLabel}</p>
                        </div>
                        <div className="rounded-lg p-2 bg-blue-100 flex items-center justify-center">
                          {qrLoading ? (
                            <p className="text-xs text-blue-600 font-medium">QR読込中...</p>
                          ) : qrCode ? (
                            <img src={qrCode} alt="QR" className="w-20 h-20" />
                          ) : (
                            <p className="text-xs text-blue-500">QR取得失敗</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}