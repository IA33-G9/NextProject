"use client";
import { useState, useEffect } from "react";
import ProfileComponent from "@/app/_components/MyPage/Profile";
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
  membershipRank: string;
  membershipColor: string;
  membershipBenefits: string[];
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  rankProgress?: {
    nextRank: {
      rank: string;
      displayName: string;
      minBookings: number;
      minSpent: number;
    };
    bookingsNeeded: number;
    spentNeeded: number;
    bookingsProgress: number;
    spentProgress: number;
    overallProgress: number;
  } | null;
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

// メインレイアウトコンポーネント
export default function TabLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs: TabItem[] = [
    { id: 'profile', label: '登録情報', icon: '👤' },
    { id: 'bookings', label: '予約履歴', icon: '🎫' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch('/api/users/me');
        const userData = await res.json();
        console.log(userData);

        // 実際のAPIレスポンスを使用してプロフィールを作成
        const userProfile: UserProfile = {
          id: userData.id,
          name: userData.username,
          email: userData.email,
          phone: userData.phone || "設定されていません", // 必要に応じて追加
          membershipLevel: userData.membershipLevel,
          membershipRank: userData.membershipRank,
          membershipColor: userData.membershipColor,
          membershipBenefits: userData.membershipBenefits,
          joinDate: userData.createdAt,
          totalBookings: userData.totalBookings,
          totalSpent: userData.totalSpent,
          rankProgress: userData.rankProgress
        };

        setProfile(userProfile);
        setBookings(userData.bookings);

      } catch (error) {
        console.error('データの取得に失敗しました:', error);
        // エラー時はモックデータを使用（オプション）
        const mockProfile: UserProfile = {
          id: "user123",
          name: "ユーザー",
          email: "user@example.com",
          phone: "設定されていません",
          membershipLevel: "ブロンズ",
          membershipRank: "BRONZE",
          membershipColor: "#CD7F32",
          membershipBenefits: ["基本予約機能", "メール通知"],
          joinDate: new Date().toISOString(),
          totalBookings: 0,
          totalSpent: 0,
          rankProgress: null
        };
        setProfile(mockProfile);
        setBookings([]);
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
      default:
        return null;
    }
  };

  // 会員ランクに応じたバッジコンポーネント
  const MembershipBadge = ({ profile }: { profile: UserProfile }) => (
    <div className="flex items-center space-x-2">
      <div
        className="px-3 py-1 rounded-full text-white text-sm font-medium flex items-center space-x-1"
        style={{ backgroundColor: profile.membershipColor }}
      >
        <span>👑</span>
        <span>{profile.membershipLevel}</span>
      </div>
      {profile.rankProgress && (
        <div className="text-xs text-gray-500">
          次のランクまで: {profile.rankProgress.overallProgress}%
        </div>
      )}
    </div>
  );

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
              <div>
                <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
                {profile && (
                  <MembershipBadge profile={profile} />
                )}
              </div>
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