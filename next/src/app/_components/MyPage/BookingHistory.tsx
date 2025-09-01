// 予約履歴コンポーネント
import Link from "next/link";
import Image from "next/image";
// 予約履歴の型定義
export interface BookingHistory {
  id: string;
  bookingReference: string;
  title: string;
  screen: string;
  startTime: string;
  totalPrice: number;
  status: 'COMPLETED' | 'CONFIRMED' |'PENDING' | 'CANCELLED' | string;

  showing: {
    startTime: string;
    endTime: string;
    movie: {
      title: string;
      imageUrl: string;
    };
    screen: {
      number: string;
    }
  };
}

const BookingHistoryComponent = ({ bookings }: { bookings: BookingHistory[]}) => {


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-100';
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
      case 'completed':
        return '予約完了';
      case 'confirmed':
        return '確認済';
      case 'pending':
        return '予約中';
      case 'cancelled':
        return 'キャンセル済み';
      default:
        return status;
    }
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">🎫 予約履歴</h2>
        <span className="text-sm text-gray-600">{bookings.length}件の予約</span>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🎬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">予約履歴がありません</h3>
          <p className="text-gray-600">映画の予約をすると、ここに表示されます。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            return (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <Link

                    href={`/mypage/booking/${booking.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{booking.bookingReference}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          <Image
                              src={booking.showing.movie.imageUrl}
                              alt={booking.showing.movie.title}
                              width={50}
                              height={50}/>
                        </span>
                        <span>🏛️ スクリーン{booking.showing.screen.number}</span>
                        <span>📽️ {booking.showing.movie.title}</span>
                        <span>
                          📅 {new Date(booking.showing.startTime).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>

                        {/* 時間表示 */}
                        <span>
                          🕒 {new Date(booking.showing.startTime).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })}～
                          {new Date(booking.showing.endTime).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })}
                        </span>

                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">¥{booking.totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingHistoryComponent;