// 通知コンポーネント　//モックデータ使用
import {useEffect, useState} from "react";
// 通知情報の型定義
interface Notification {
  id: string;
  type: 'booking' | 'promotion' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
const NotificationsComponent = ({ notifications }: { notifications: Notification[] | null }) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications || []);

  useEffect(() => {
    setLocalNotifications(notifications || []);
  }, [notifications]);

  if (!notifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const markAsRead = (id: string) => {
    setLocalNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setLocalNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '🎫';
      case 'promotion':
        return '🎉';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const unreadCount = localNotifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-900">🔔 通知</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            すべて既読にする
          </button>
        )}
      </div>

      {localNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">通知はありません</h3>
          <p className="text-gray-600">新しい通知が届くとここに表示されます。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsComponent;
