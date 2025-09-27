"use client";
import { useEffect, useState } from "react";
import {useParams, useRouter} from "next/navigation";
import BookedSeatLayout from "@/app/_components/SeatLayout/BookedSeatsLayout";

interface SeatDetail {
    seatId: string;
    seatLabel: string;
    ticketType: 'GENERAL' | 'STUDENT' | 'YOUTH' | 'CHILD';
    price: number;
    row: string;
    column: number;
}

interface BookingDetails {
  id: string;
  bookingReference: string;
  title: string;
  screen: string;
  screenId?: string;
  screenSize?: 'LARGE' | 'MEDIUM' | 'SMALL';
  startTime: string;
  seats: string[];
  seatId : string[];
  seatDetails: SeatDetail[];
  totalPrice: number;
  payMethod: 'CREDIT_CARD' | 'CASH' | 'MOBILE_PAYMENT';
  status: string;
  showingId: string;
}


interface QRCodeResponse {
  qrCode: string;
  bookingReference: string;
  movieTitle: string;
  startTime: string;
  seats: string[];
  expiresAt: string;
}

const TICKET_TYPE_LABELS = {
    GENERAL: '一般',
    STUDENT: '大学生等',
    YOUTH: '中学・高校生',
    CHILD: '小学生・幼児'
} as const;

const PAYMETHOD_TYPE_LABELS = {
    CREDIT_CARD: 'クレジットカード',
    CASH: '現金支払い',
    MOBILE_PAYMENT: 'モバイル決済',
} as const;

export default function BookingDetailsPage() {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

    // bookingIdをURLパラメータから取得
  const bookingId = params.id as string;
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('予約情報が見つかりません');
          } else if (response.status === 400) {
            throw new Error('無効な予約IDです');
          }
          throw new Error('予約情報の取得に失敗しました');
        }

        const bookingData = await response.json();
        console.log(bookingData)
        setBooking(bookingData);
      } catch (err) {
        console.error('予約詳細取得エラー:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const generateQRCode = async () => {
    setQrLoading(true);
    setQrError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/qr`);
      if (!response.ok) {
        throw new Error('QRコードの生成に失敗しました');
      }

      const data = await response.json();
      setQrData(data);
      setShowQRCode(true);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `ticket-${qrData.bookingReference}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '予約確定';
      case 'pending':
        return '予約中';
      case 'cancelled':
        return 'キャンセル済み';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">予約詳細を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-semibold">エラーが発生しました</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">予約情報が見つかりません</h2>
          <p className="text-gray-600 mb-6">指定された予約は存在しないか、削除されています。</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(booking.startTime);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white rounded-full p-3">
                <span className="text-xl">🎬</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">予約詳細</h1>
                <p className="text-gray-600">予約番号: {booking.bookingReference}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* メイン情報 */}
          <div className="xl:col-span-3 space-y-6">
            {/* 映画情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="text-xl mr-2">🎬</span>
                  映画情報
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{booking.title}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">🏛️</span>
                    <div>
                      <p className="text-sm text-gray-600">上映スクリーン</p>
                      <p className="font-medium text-gray-900">{booking.screen}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">📅</span>
                    <div>
                      <p className="text-sm text-gray-600">上映日時</p>
                      <p className="font-medium text-gray-900">{date}</p>
                      <p className="text-sm text-gray-700">{time}開始</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 座席情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-xl mr-2">💺</span>
                座席情報
              </h2>

              <div className="space-y-4">
                {/* 座席とチケットタイプの詳細表示 */}
                {booking.seatDetails && booking.seatDetails.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">予約座席詳細</h3>
                    <div className="grid gap-3">
                      {booking.seatDetails.map((seatDetail, index) => (
                        <div
                          key={seatDetail.seatId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium text-sm">
                              {seatDetail.seatLabel}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {TICKET_TYPE_LABELS[seatDetail.ticketType]}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            ¥{seatDetail.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // フォールバック表示（seatDetailsがない場合）
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">選択座席:</span>
                    <div className="flex flex-wrap gap-2">
                      {booking.seats.map((seat, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">座席数:</span>
                  <span className="font-medium text-gray-900">{booking.seats.length}席</span>
                </div>

                {/* 座席レイアウト表示（実際の座席コンポーネントを使用） */}
                {booking.screenId && booking.screenSize && (
                  <div className="mt-6">
                    <div className="w-full">
                      <BookedSeatLayout
                        showingId={booking.showingId}
                        screenId={booking.screenId}
                        bookedSeats={booking.seatId}
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        あなたの予約座席: {booking.seats.join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* フォールバック用簡易表示 */}
                {(!booking.screenId || !booking.screenSize) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center mb-4">
                      <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded text-sm">
                        スクリーン
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {booking.seats.map((seat, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 bg-blue-500 text-white rounded text-xs flex items-center justify-center font-medium"
                        >
                          {seat}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="xl:col-span-1 space-y-6">
            {/* 料金情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-lg mr-2">💰</span>
                料金情報
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">座席数</span>
                  <span className="font-medium">{booking.seats.length}席</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">合計金額</span>
                    <span className="text-xl font-bold text-blue-600">
                      ¥{booking.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">支払方法</span>
                  <span className="font-medium">{PAYMETHOD_TYPE_LABELS[booking.payMethod]}</span>
                </div>
              </div>
            </div>

            {/* 予約詳細 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-lg mr-2">📋</span>
                予約詳細
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">予約ID</p>
                  <p className="font-mono text-xs text-gray-900 bg-gray-100 p-2 rounded break-all">
                    {booking.id}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">予約番号</p>
                  <p className="font-medium text-gray-900">
                    {booking.bookingReference}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">ステータス</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* アクション */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                アクション
              </h3>

              <div className="space-y-3">
                {booking.status.toLowerCase() === 'completed' && (
                  <>
                    <button
                      onClick={generateQRCode}
                      disabled={qrLoading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {qrLoading ? (
                        <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        QRコード生成中...
                        </span>
                      ) : (
                        'QRコードを表示'
                      )}
                  </button>

                  {qrError && (
                    <div className="text-red-600 text-sm text-center">
                      {qrError}
                    </div>
                  )}

                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                      チケットをダウンロード（仮）
                  </button>
                  </>
                )}

                <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  予約情報を印刷（仮）
                </button>

                {booking.status.toLowerCase() === 'confirmed' && (
                  <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    予約をキャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QRコード表示モーダル */}
      {showQRCode && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg text-center">
              <h3 className="text-xl font-semibold mb-2">入場用QRコード</h3>
              <p className="text-sm opacity-90">予約番号: {qrData.bookingReference}</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  <img
                    src={qrData.qrCode}
                    alt="入場用QRコード"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  入場時にこのQRコードをスタッフにご提示ください
                </p>
              </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">映画:</span>
                      <span className="font-medium text-right">{qrData.movieTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">上映日時:</span>
                      <span className="font-medium text-right">{formatDateTime(qrData.startTime).date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">開始時間:</span>
                      <span className="font-medium text-right">{formatDateTime(qrData.startTime).time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">座席:</span>
                      <span className="font-medium text-right">{qrData.seats.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ダウンロード
                  </button>
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    閉じる
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-800 mb-1">⚠️ このQRコードは他人に見せないでください</p>
                  <p className="text-xs text-yellow-700">
                    有効期限: {new Date(qrData.expiresAt).toLocaleString('ja-JP')}
                  </p>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}