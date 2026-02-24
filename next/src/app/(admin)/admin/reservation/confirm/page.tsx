'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Showing = {
  id: string;
  title: string;
  startTime: string;
  uniformPrice: number | null;
  movie: {
    title: string;
  };
  screen: {
    number: string;
  };
};

type TicketType = 'GENERAL' | 'STUDENT' | 'YOUTH' | 'CHILD';

type SeatTicketPair = {
  seatId: string;
  ticketType: TicketType;
};

const TICKET_TYPES = {
  GENERAL: { label: '一般', price: 1800 },
  STUDENT: { label: '大学生等', price: 1600 },
  YOUTH: { label: '中学・高校生', price: 1400 },
  CHILD: { label: '小学生・幼児', price: 1000 },
} as const;

type PaymentMethod = 'CREDIT_CARD' | 'CASH' | 'MOBILE_PAYMENT';

const PAYMENT_METHODS = {
  CREDIT_CARD: { label: 'クレジットカード' },
  CASH: { label: '現金' },
  MOBILE_PAYMENT: { label: 'モバイル決済' },
};

export default function AdminReservationConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const showingId = searchParams.get('showingId');
  const seatIds = searchParams.get('seats')?.split(',') || [];
  const seatTicketsParam = searchParams.get('seatTickets') || '';

  const seatTickets: SeatTicketPair[] = seatTicketsParam
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [seatId, ticketType] = pair.split(':');
      return { seatId, ticketType: ticketType as TicketType };
    });

  const [showing, setShowing] = useState<Showing | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [processing, setProcessing] = useState(false);
  const [loadingShowing, setLoadingShowing] = useState(true);
  const [errorShowing, setErrorShowing] = useState<string | null>(null);

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

  const handleConfirmBooking = async () => {
    try {
      setProcessing(true);

      const bookingData = {
        showingId,
        seatIds,
        paymentMethod: selectedPaymentMethod,
        seatTickets: seatTickets,
      };

      const response = await fetch(`/admin/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) throw new Error('予約に失敗');

      const data = await response.json();
      alert('予約が完了しました');
      router.push(`/admin/reservation/complete/${data.bookingId}`);
    } catch (err) {
      console.error(err);
      alert('予約に失敗しました');
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.push(`/admin/reservation/ticket/${showingId}?seats=${seatIds.join(',')}`);
  };

  if (loadingShowing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">読み込み中...</div>
      </div>
    );
  }

  if (errorShowing || !showing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-500">{errorShowing || '上映情報が見つかりません'}</div>
      </div>
    );
  }

  // 料金計算
  const calculateTotalPrice = () => {
    if (showing.uniformPrice) {
      return seatIds.length * showing.uniformPrice;
    } else {
      return seatTickets.reduce((total, seat) => {
        return total + TICKET_TYPES[seat.ticketType].price;
      }, 0);
    }
  };

  const totalPrice = calculateTotalPrice();

  const formattedDate = new Date(showing.startTime).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-5xl bg-white shadow-lg border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center mb-8">予約確定</h1>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">上映情報</h2>
            <div className="space-y-2">
              <p>
                <strong>映画:</strong> {showing.movie.title}
              </p>
              <p>
                <strong>日時:</strong> {formattedDate}
              </p>
              <p>
                <strong>スクリーン:</strong> {showing.screen.number}
              </p>
              <p>
                <strong>座席:</strong> {seatIds.join(', ')}
              </p>
            </div>
          </div>

          {/* Seat Tickets Display */}
          {!showing.uniformPrice && seatTickets.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">座席区分</h3>
              <div className="space-y-2">
                {seatTickets.map((st) => {
                  const type = TICKET_TYPES[st.ticketType];
                  return (
                    <p key={st.seatId}>
                      {st.seatId} - {type.label} (¥{type.price.toLocaleString()})
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Display */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-gray-700 mb-2">合計金額</p>
              <p className="text-4xl font-bold text-blue-600">¥{totalPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">支払方法を選択してください</h3>
            <div className="space-y-3">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <label
                  key={key}
                  className="flex items-center p-3 border-2 border-gray-300 rounded cursor-pointer hover:bg-green-100 transition"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={key}
                    checked={selectedPaymentMethod === key}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="font-semibold">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-100 flex justify-center">
            <button
              onClick={handleConfirmBooking}
              disabled={processing}
              className={`px-8 py-4 rounded-lg font-bold text-lg text-white w-full md:w-auto transition-colors duration-200
                          ${
                            processing
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
            >
              {processing ? '処理中...' : '予約を確定する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
