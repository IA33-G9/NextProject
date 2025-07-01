"use client";
import { useState, useEffect } from "react";
import NotificationsComponent from "@/app/_components/MyPage/Notificaions";
import ProfileComponent from "@/app/_components/MyPage/Profile";
import SettingsComponent from "@/app/_components/MyPage/Settings";
import BookingHistoryComponent from "@/app/_components/MyPage/BookingHistory";
import ClientSession from "@/app/_components/ClientSession/ClientSession";

// タブの定義
type TabType = 'profile' | 'bookings' | 'settings' | 'notifications';

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
}
// ユーザープロフィール情報の型定義
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipLevel: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
}
interface Notification {
  id: string;
  type: 'booking' | 'promotion' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
// 予約履歴の型定義
interface BookingHistory {
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
    };
    screen: {
      number: string;
    }
  };
}

// 設定情報の型定義
interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  autoConfirm: boolean;
}





// メインレイアウトコンポーネント
export default function TabLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs: TabItem[] = [
    { id: 'profile', label: 'プロフィール', icon: '👤' },
    { id: 'bookings', label: '予約履歴', icon: '🎫' },
    { id: 'settings', label: '設定', icon: '⚙️' },
    { id: 'notifications', label: '通知', icon: '🔔' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch('/api/users/me');
        const userData = await res.json();

        // モックデータ（実際のAPIレスポンスに置き換えてください）
        const mockProfile: UserProfile = {
          id: "user123",
          name: "田中太郎",
          email: "tanaka@example.com",
          phone: "090-1234-5678",
          membershipLevel: "Premium",
          joinDate: "2023-01-15T00:00:00Z",
          totalBookings: 15,
          totalSpent: 45000
        };

        const mockSettings: UserSettings = {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: "ja",
          timezone: "Asia/Tokyo",
          autoConfirm: true
        };

        const mockNotifications: Notification[] = [
          {
            id: "notif1",
            type: "booking",
            title: "予約確認",
            message: "「君の名は。」の予約が確定しました。",
            timestamp: "2024-06-27T10:00:00Z",
            isRead: false
          }
        ];
        setProfile(mockProfile);
        setBookings(userData.bookings);
        setSettings(mockSettings);
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileComponent profile={profile} />;
      case 'bookings':
        return <BookingHistoryComponent bookings={bookings} />;
      case 'settings':
        return <SettingsComponent settings={settings} />;
      case 'notifications':
        return <NotificationsComponent notifications={notifications} />;
      default:
        return null;
    }
  };

  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white rounded-full p-2">
                <span className="text-xl">🎬</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <ClientSession/>
              </span>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'notifications' && unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">データを読み込み中...</p>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
}