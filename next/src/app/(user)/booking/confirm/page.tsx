'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScreenSize } from '@/generated/prisma/client';

type Showing = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  uniformPrice: number | null;
  screenNumber: string;
  screenId: string;
  screenSize: ScreenSize;
  movieId: string;
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

};

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

type Seat = {
  id: string;
  seatNumber: string;
};

type TicketType = 'GENERAL' | 'STUDENT' | 'YOUTH' | 'CHILD';

type SeatWithTicket = {
    seatId: string;
    seatNumber: string;
    ticketType: TicketType;
};

const TICKET_TYPES = {
    GENERAL: { label: '一般', price: 1800 },
    STUDENT: { label: '大学生等', price: 1600 },
    YOUTH: { label: '中学・高校生', price: 1400 },
    CHILD: { label: '小学生・幼児', price: 1000 }
} as const;

type PaymentMethod = 'CREDIT_CARD' | 'CASH' | 'MOBILE_PAYMENT';

const PAYMENT_METHODS = {
    CREDIT_CARD: { label: 'クレジットカード'},
    CASH: { label: '現金'},
    MOBILE_PAYMENT: { label: 'モバイル決済'},
}


export default function BookingConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  const showingId = searchParams.get('showingId');
  const seatIds = searchParams.get('seats')?.split(',') || [];

  const bookingId = params.id as string | undefined;

  const [showing, setShowing] = useState<Showing | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [seatsInfo, setSeatsInfo] = useState<Seat[]>([]);
  const [seatTickets, setSeatTickets] = useState<SeatWithTicket[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [loadingShowing, setLoadingShowing] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [errorShowing, setErrorShowing] = useState<string | null>(null);
  const [errorBooking, setErrorBooking] = useState<string | null>(null);
  const [errorSeats, setErrorSeats] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchSeats = async () => {
      if (!seatIds.length || booking) {
        setLoadingSeats(false);
        return;
      }

      try {
        const query = seatIds.map((id) => `${id}`).join('&');
        const res = await fetch(`/api/seats/${query}`);
        if (!res.ok) throw new Error('座席情報の取得に失敗');
        const data: Seat[] = await res.json();
        setSeatsInfo(data);

        // 座席にデフォルトのチケットタイプ（一般）を設定
        const initialSeatTickets = data.map(seat => ({
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          ticketType: 'GENERAL' as TicketType
        }));
        setSeatTickets(initialSeatTickets);

        setErrorSeats(null);
      } catch (e) {
        setErrorSeats('座席情報の取得に失敗しました');
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [booking]);

  const handleTicketTypeChange = (seatId: string, ticketType: TicketType) => {
    setSeatTickets(prev =>
      prev.map(seat =>
        seat.seatId === seatId
          ? { ...seat, ticketType }
          : seat
      )
    );
  };

  const handleConfirmBooking = async () => {
      try {
          const bookingData = {
              showingId,
              seatIds,
              paymentMethod: selectedPaymentMethod,
              // デフォルト料金体系の場合は座席ごとのチケットタイプも送信
              seatTickets: showing?.uniformPrice === null ? seatTickets : undefined
          };

          const response = await fetch(`/api/bookings`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(bookingData),
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

  if (loadingShowing || loadingBooking) {
    return <div className="text-center py-20">読み込み中...</div>;
  }
  if (errorShowing) {
    return <div className="text-center text-red-600 py-20">{errorShowing}</div>;
  }

  const movieTitle = booking?.title || showing?.title || '';
  const screenName = booking?.screenName || showing?.screen.number || '';
  const startTime = booking?.startTime || showing?.startTime || '';
  const seats = booking?.seats.length ? booking.seats : seatIds;

    // 料金計算
  const calculateTotalPrice = () => {
    if (booking?.totalPrice) return booking.totalPrice;

    if (showing?.uniformPrice) {
      // 一律料金の場合
      return seats.length * showing.uniformPrice;
    } else {
      // デフォルト料金体系の場合
      return seatTickets.reduce((total, seat) => {
        return total + TICKET_TYPES[seat.ticketType].price;
      }, 0);
    }
  };

  const totalPrice = calculateTotalPrice();

  const formattedDate = new Date(startTime).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const seatNumbers = (booking?.seats || seatsInfo.map(s => s.seatNumber)).join(', ');

  return (
    <div className="container">
      <div className="header">
        <div className="logo">HAL CINEMAS</div>
      </div>

      <div className="back-button-container">
        <button className="back-button" onClick={() => router.back()}>
          <span className="arrow">←</span>
          戻る
        </button>
      </div>

      <div className="main">
        <h2>予約確認</h2>

        <div className="summary">
          <div><span>映画タイトル</span><span>{movieTitle}</span></div>
          <div><span>上映日時</span><span>{formattedDate}</span></div>
          <div><span>スクリーン</span><span>{screenName}</span></div>
        </div>

        <label htmlFor="seat">選択した席</label>
        <div className="selected-seats-display">
          <span>{seatNumbers}</span>
        </div>

        {/* チケットタイプ選択（デフォルト料金体系の場合のみ表示） */}
        {!booking && showing?.uniformPrice === null && seatTickets.length > 0 && (
          <div className="ticket-selection">
            <h3>チケットタイプを選択してください</h3>
            <div className="seat-ticket-list">
              {seatTickets.map((seatTicket) => (
                <div key={seatTicket.seatId} className="seat-ticket-row">
                  <div className="seat-info">
                    <strong>{seatTicket.seatNumber}</strong>
                  </div>
                  <select
                    value={seatTicket.ticketType}
                    onChange={(e) => handleTicketTypeChange(seatTicket.seatId, e.target.value as TicketType)}
                    className="ticket-select"
                  >
                    {Object.entries(TICKET_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.label} - ¥{type.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 料金内訳（デフォルト料金体系の場合） */}
        {!booking && showing?.uniformPrice === null && seatTickets.length > 0 && (
          <div className="price-breakdown">
            <h4>料金内訳</h4>
            <div className="breakdown-list">
              {seatTickets.map((seatTicket) => (
                <div key={seatTicket.seatId} className="breakdown-row">
                  <span>{seatTicket.seatNumber} ({TICKET_TYPES[seatTicket.ticketType].label})</span>
                  <span>¥{TICKET_TYPES[seatTicket.ticketType].price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支払方法選択 */}
        {!booking && (
          <div className="payment-selection">
            <h3>支払方法を選択してください</h3>
            <div className="payment-methods">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <label key={key} className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={key}
                    checked={selectedPaymentMethod === key}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                    className="payment-radio"
                  />
                  <div className="payment-card">
                    <span className="payment-label">{method.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="price">￥{totalPrice.toLocaleString()}円</div>

        <button className="confirm-btn" onClick={handleConfirmBooking}>確定</button>
      </div>

    <style jsx>
      {`
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
        max-width: 1920px;
          width: 100%;
          margin: 0 auto;
          background-color: white;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1920px) {
          .container {
            max-width: 1536px;
          }
        }
        .header {
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid black;
        }
        .logo {
          font-size: 28px;
          color: #000;
          font-family: 'Luckiest Guy', cursive;
        }

        .back-button-container {
          padding: 20px 0;
          border-bottom: 1px solid #ddd;
          position: relative;
        }

        .back-button {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s ease;
        }

        .back-button:hover {
          background-color: #5a6268;
        }

        .arrow {
          font-size: 12px;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: start;
          padding: 30px 20px;
        }

        h2 {
          font-size: 32px;
          margin-bottom: 30px;
        }

        .summary {
          border-top: 1px solid #ccc;
          border-bottom: 1px solid #ccc;
          padding: 20px 0;
          width: 400px;
          font-size: 20px;
          margin-bottom: 30px;
        }

        .summary div {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .selected-seats-display {
          width: 300px;
          padding: 10px;
          font-size: 16px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 4px;
          text-align: center;
        }

        .ticket-selection {
          width: 500px;
          margin: 20px 0;
          padding: 20px;
          border: 2px solid #007bff;
          border-radius: 8px;
          background-color: #f8f9fa;
        }

        .ticket-selection h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #333;
          text-align: center;
        }

        .seat-ticket-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .seat-ticket-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .seat-info {
          font-size: 16px;
          min-width: 60px;
        }

        .ticket-select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          min-width: 200px;
        }

        .price-breakdown {
          width: 400px;
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f9f9f9;
        }

        .price-breakdown h4 {
          margin: 0 0 10px 0;
          font-size: 16px;
          text-align: center;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 14px;
        }

        /* 支払方法選択のスタイル */
        .payment-selection {
          width: 500px;
          margin: 20px 0;
          padding: 20px;
          border: 2px solid #28a745;
          border-radius: 8px;
          background-color: #f8fff9;
        }

        .payment-selection h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #333;
          text-align: center;
        }

        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .payment-method {
          cursor: pointer;
          display: block;
        }

        .payment-radio {
          display: none;
        }

        .payment-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background-color: white;
          transition: all 0.3s ease;
        }

        .payment-method:hover .payment-card {
          border-color: #28a745;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }

        .payment-radio:checked + .payment-card {
          border-color: #28a745;
          background-color: #f8fff9;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .payment-label {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }

        .price {
          font-size: 32px;
          font-weight: bold;
          margin: 20px 0;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
        }

        .confirm-btn {
          background-color: red;
          color: white;
          font-size: 20px;
          padding: 15px 60px;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .confirm-btn:hover {
            opacity: 0.85;
        }

        @media (max-width: 768px) {
          .summary {
            width: 90%;
          }

          .selected-seats-display {
            width: 90%;
          }

          .ticket-selection {
            width: 90%;
          }

          .price-breakdown {
            width: 90%;
          }

          .back-button {
            position: static;
            transform: none;
            margin: 10px 20px;
            align-self: flex-start;
          }
        }
      `}
    </style>
    </div>
  );
}