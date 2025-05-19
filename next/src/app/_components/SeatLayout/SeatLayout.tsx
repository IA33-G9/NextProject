import React, { useState, useEffect } from 'react';
import { ScreenSize } from '@/generated/prisma/client';

// 座席タイプの定義
type Seat = {
  id: string;
  row: string;
  column: number;
  isActive: boolean;
  isSelected?: boolean;
  isBooked?: boolean;
};

type SeatLayoutProps = {
  screenSize: keyof typeof ScreenSize;
  screenId: string;
  showingId?: string; // 上映IDを追加
  bookedSeats?: string[]; // 予約済み座席のID
  onSeatSelect?: (seatId: string, isSelected: boolean) => void;
};

const SeatLayout: React.FC<SeatLayoutProps> = ({
  screenSize,
  screenId,
  showingId,
  bookedSeats = [],
  onSeatSelect,
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>(bookedSeats);

  // 行のアルファベット（A-J）
  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // スクリーンサイズに基づく行数と列数の設定
  const getScreenDimensions = (size: string) => {
    switch (size) {
      case 'LARGE':
        return { rows: 10, columns: 20 }; // 大スクリーン（1番、2番、3番） - 10行(A-J) x 20列
      case 'MEDIUM':
        return { rows: 10, columns: 12 }; // 中スクリーン（4番、5番） - 10行(A-J) x 12列
      case 'SMALL':
        return { rows: 7, columns: 10 };  // 小スクリーン（6番、7番、8番） - 7行(A-G) x 10列
      default:
        return { rows: 0, columns: 0 };
    }
  };

  // 予約済み座席を取得する
  useEffect(() => {
    const fetchBookedSeats = async () => {
      if (!showingId) return;

      try {
        const response = await fetch(`/api/showings/${showingId}/booked-seats`);

        if (!response.ok) {
          throw new Error('予約済み座席情報の取得に失敗しました');
        }

        const bookedSeatIds = await response.json();
        setBookedSeatIds(bookedSeatIds);
      } catch (err) {
        console.error('予約済み座席情報の取得エラー:', err);
        // エラー時も処理を続行（既存のbookedSeatsを使用）
      }
    };

    fetchBookedSeats();
  }, [showingId]);

  // 座席データの取得
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        // 実際のAPIエンドポイントに置き換える
        const response = await fetch(`/api/screens/${screenId}/seats`);

        if (!response.ok) {
          throw new Error('座席データの取得に失敗しました');
        }

        const data = await response.json();

        // 予約済み座席にフラグを設定
        const seatsWithBookingStatus = data.map((seat: Seat) => ({
          ...seat,
          isBooked: bookedSeatIds.includes(seat.id),
          isSelected: false,
        }));

        setSeats(seatsWithBookingStatus);
        setLoading(false);
      } catch (err) {
        setError('座席データの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error('座席データの読み込みエラー:', err);

        // エラー時のフォールバック：モックデータを生成
        const { rows, columns } = getScreenDimensions(screenSize);
        const mockSeats: Seat[] = [];

        for (let r = 0; r < rows; r++) {
          const rowLetter = rowLetters[r];
          for (let c = 1; c <= columns; c++) {
            const seatId = `mock-${rowLetter}${c}`;
            mockSeats.push({
              id: seatId,
              row: rowLetter,
              column: c,
              isActive: true,
              isBooked: bookedSeatIds.includes(seatId),
              isSelected: false,
            });
          }
        }

        setSeats(mockSeats);
      }
    };

    fetchSeats();
  }, [screenId, screenSize, bookedSeatIds]);

  // 座席選択の処理
  const handleSeatClick = (seat: Seat) => {
    if (!seat.isActive || seat.isBooked) return;

    const newSeats = seats.map((s) => {
      if (s.id === seat.id) {
        const newSelectedState = !s.isSelected;
        if (onSeatSelect) {
          onSeatSelect(s.id, newSelectedState);
        }
        return { ...s, isSelected: newSelectedState };
      }
      return s;
    });

    setSeats(newSeats);
  };

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
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* スクリーン表示 */}
      <div className="w-full bg-gray-300 h-8 flex items-center justify-center mb-8 rounded">
        <span className="text-gray-700 font-bold">スクリーン</span>
      </div>

      {/* 座席レイアウト */}
      <div className="flex flex-col items-center gap-2">
        {sortedRows.map((row) => (
          <div key={row} className="flex items-center w-full">
            <div className="w-8 font-bold text-center">{row}</div>
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {seatsByRow[row]
                .sort((a, b) => a.column - b.column)
                .map((seat) => (
                  <button
                    key={`${seat.row}${seat.column}`}
                    className={`
                      w-8 h-8 text-xs rounded flex items-center justify-center
                      ${!seat.isActive ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                        seat.isBooked ? 'bg-red-500 text-white cursor-not-allowed' : 
                        seat.isSelected ? 'bg-green-500 text-white' : 'bg-blue-100 hover:bg-blue-200'}
                    `}
                    onClick={() => handleSeatClick(seat)}
                    disabled={!seat.isActive || seat.isBooked}
                    title={`${seat.row}${seat.column}`}
                  >
                    {seat.column}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-8 flex justify-center gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 mr-2"></div>
          <span className="text-sm">空席</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2"></div>
          <span className="text-sm">選択中</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 mr-2"></div>
          <span className="text-sm">予約済</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 mr-2"></div>
          <span className="text-sm">使用不可</span>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;