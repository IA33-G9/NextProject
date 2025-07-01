import React, { useState, useEffect } from 'react';

// 座席タイプの定義
type Seat = {
  id: string;
  row: string;
  column: number;
  isActive: boolean;
  isBooked: boolean;
  isOwnBooked: boolean;
};

type SeatLayoutProps = {
  showingId: string;
  screenId: string;
  bookedSeats?: string[]; // 予約済み座席のID配列
};

const BookedSeatLayout: React.FC<SeatLayoutProps> = ({
  showingId,
  screenId,
  bookedSeats = [],
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


useEffect(() => {
  const fetchData = async () => {
    if (!screenId || !showingId) return;

    try {
      setLoading(true);

      // 並列取得
      const [seatsRes, bookedRes] = await Promise.all([
        fetch(`/api/screens/${screenId}/seats`),
        fetch(`/api/showings/${showingId}/booked-seats`)
      ]);

      if (!seatsRes.ok || !bookedRes.ok) {
        throw new Error('データ取得に失敗しました');
      }

      const seats = await seatsRes.json();
      const bookedIds: string[] = await bookedRes.json();

      const updatedSeats = seats.map((seat: Seat) => ({
        ...seat,
        isBooked: bookedIds.includes(seat.id),
        isOwnBooked: bookedSeats.includes(seat.id),
      }));

      setSeats(updatedSeats);
    } catch (err) {
      console.error(err);
      setError('座席データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [screenId, showingId, bookedSeats]);


  // 行ごとに座席をグループ化
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // 行をソート
  const sortedRows = Object.keys(seatsByRow).sort();

  if (loading) return <div className="p-4 text-center">座席情報を読み込み中...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="w-full mx-auto p-4 bg-gray-50 rounded-lg">
      {/* スクリーン表示 */}
      <div className="w-full bg-gray-300 h-8 flex items-center justify-center mb-6 rounded shadow-sm">
        <span className="text-gray-700 font-bold text-sm">スクリーン</span>
      </div>

      {/* 座席レイアウト */}
      <div className="flex flex-col items-center gap-1 overflow-x-auto">
        {sortedRows.map((row) => (
          <div key={row} className="flex items-center gap-2 min-w-max">
            {/* 行ラベル */}
            <div className="w-6 font-bold text-center text-sm flex-shrink-0 text-gray-600">
              {row}
            </div>

            {/* 座席 */}
            <div className="flex gap-1">
              {seatsByRow[row]
                .sort((a, b) => a.column - b.column)
                .map((seat) => (
                  <div
                    key={`${seat.row}${seat.column}`}
                    className={`
                      w-7 h-7 text-xs rounded flex items-center justify-center font-medium
                      ${!seat.isActive ? 'bg-gray-200 text-gray-400' : 
                        seat.isOwnBooked ? 'bg-green-500 text-white shadow-sm' :
                        seat.isBooked ? 'bg-red-500 text-white shadow-sm' :
                        'bg-blue-100 text-gray-700  '}
                    `}
                    title={`${seat.row}${seat.column} ${
                      seat.isOwnBooked ? '(あなたの予約)' : 
                      seat.isBooked ? '(予約済み)' : 
                      seat.isActive ? '(空席)' : '(利用不可)'
                    }`}
                  >
                    {seat.column}
                  </div>
                ))}
            </div>

            {/* 行ラベル（右側） */}
            <div className="w-6 font-bold text-center text-sm flex-shrink-0 text-gray-600">
              {row}
            </div>
          </div>

        ))}
        <div className="mt-8 flex justify-center gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 mr-2"></div>
            <span className="text-sm">空席</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2"></div>
            <span className="text-sm">予約席</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span className="text-sm">予約済み</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 mr-2"></div>
            <span className="text-sm">使用不可</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookedSeatLayout;