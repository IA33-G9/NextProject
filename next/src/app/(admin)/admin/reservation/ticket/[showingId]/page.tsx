'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type Showing = {
  id: string;
  startTime: string;
  uniformPrice: number | null;
  movie: {
    title: string;
  };
};

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
  CHILD: { label: '小学生・幼児', price: 1000 },
} as const;

export default function AdminReservationTicketPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showingId = params.showingId as string;
  const seatsParam = searchParams.get('seats') || '';
  const seatIds = seatsParam ? seatsParam.split(',') : [];

  const [showing, setShowing] = useState<Showing | null>(null);
  const [seatsInfo, setSeatsInfo] = useState<Seat[]>([]);
  const [seatTickets, setSeatTickets] = useState<SeatWithTicket[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [loadingShowing, setLoadingShowing] = useState(true);
  const [errorShowing, setErrorShowing] = useState<string | null>(null);
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
    const fetchSeats = async () => {
      if (!seatsParam) {
        setLoadingSeats(false);
        return;
      }

      try {
        const query = seatIds.map((id) => `${id}`).join('&');
        const res = await fetch(`/api/seats/${query}`);
        if (!res.ok) throw new Error('座席情報の取得に失敗');
        const data: Seat[] = await res.json();
        setSeatsInfo(data);

        const initialSeatTickets = data.map((seat) => ({
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          ticketType: 'GENERAL' as TicketType,
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
  }, [seatsParam]);

  const handleTicketTypeChange = (seatId: string, ticketType: TicketType) => {
    setSeatTickets((prev) =>
      prev.map((seat) => (seat.seatId === seatId ? { ...seat, ticketType } : seat))
    );
  };

  const handleNext = () => {
    const seatTicketParams = seatTickets
      .map((st) => `${st.seatId}:${st.ticketType}`)
      .join(',');
    const seatLabels = seatTickets.map((st) => st.seatNumber).join(',');
    router.push(
      `/admin/reservation/confirm?showingId=${showingId}&seats=${seatIds.join(',')}&seatLabels=${seatLabels}&seatTickets=${seatTicketParams}`
    );
  };

  const handleBack = () => {
    router.push(`/admin/reservation/seat/${showingId}?seats=${seatIds.join(',')}`);
  };

  if (loadingShowing || loadingSeats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (errorShowing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">{errorShowing}</div>
      </div>
    );
  }

  if (!showing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-red-600">上映情報が見つかりません</p>
      </div>
    );
  }

  // uniformPrice が設定されている場合はスキップして confirm ページへ直接遷移
  if (showing.uniformPrice) {
    const seatTicketParams = seatIds
      .map((id) => `${id}:GENERAL`)
      .join(',');
    const seatLabels = seatsInfo.map((seat) => seat.seatNumber).join(',');

    // ページマウント時に自動遷移
    if (typeof window !== 'undefined') {
      router.push(
        `/admin/reservation/confirm?showingId=${showingId}&seats=${seatIds.join(',')}&seatLabels=${seatLabels}&seatTickets=${seatTicketParams}`
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">確認ページへ移動しています...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-5xl bg-white shadow-lg border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center mb-2">座席区分選択</h1>
          <p className="text-center text-gray-600 mb-8">各座席のチケット区分を選択してください</p>

          {errorSeats && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {errorSeats}
            </div>
          )}

          {/* Movie Info */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold mb-3">上映情報</h2>
            <p>
              <span className="font-semibold">映画:</span> {showing.movie.title}
            </p>
            <p className="mt-2">
              <span className="font-semibold">日時:</span>{' '}
              {new Date(showing.startTime).toLocaleString('ja-JP')}
            </p>
          </div>

          {/* Ticket Selection */}
          <div className="bg-white rounded-lg border-2 border-gray-300 p-6 mb-8">
            <div className="space-y-4">
              {seatTickets.map((seatTicket) => (
                <div key={seatTicket.seatId} className="border border-gray-200 rounded-lg p-4">
                  <label className="block font-bold mb-3 text-lg">座席 {seatTicket.seatNumber}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(TICKET_TYPES).map(([key, type]) => (
                      <label
                        key={key}
                        className="flex items-center p-2 border-2 border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition"
                      >
                        <input
                          type="radio"
                          name={seatTicket.seatId}
                          value={key}
                          checked={seatTicket.ticketType === key}
                          onChange={(e) =>
                            handleTicketTypeChange(seatTicket.seatId, e.target.value as TicketType)
                          }
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-sm">
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-xs text-gray-600">¥{type.price}</div>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-100 flex justify-center">
            <button
              onClick={handleNext}
              disabled={seatTickets.length === 0}
              className={`px-8 py-4 rounded-lg font-bold text-lg text-white w-full md:w-auto transition-colors duration-200
                          ${
                            seatTickets.length === 0
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
