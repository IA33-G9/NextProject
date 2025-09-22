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
        setErrorSeats(null);
      } catch (e) {
        setErrorSeats('座席情報の取得に失敗しました');
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [booking]);

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
  const totalPrice = booking?.totalPrice || (seats.length * (showing?.price || 0));

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

        <div className="price">￥{totalPrice.toLocaleString()}円</div>

        <button className="confirm-btn" onClick={handleConfirmBooking}>確定</button>
      </div>

      <style jsx>{`
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

        .back-button a {
          text-decoration: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
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
          margin-bottom: 40px;
          border: 1px solid #ccc;
          border-radius: 4px;
          text-align: center;
        }

        .price {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 40px;
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

          .back-button {
            position: static;
            transform: none;
            margin: 10px 20px;
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}