// プロフィールコンポーネント //モックデータ使用

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
const ProfileComponent = ({ profile }: { profile: UserProfile | null }) => {
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMembershipColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'gold':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* プロフィール情報 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getMembershipColor(profile.membershipLevel)}`}>
              {profile.membershipLevel}メンバー
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">📧 メールアドレス</h3>
            <p className="text-gray-900">{profile.email}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">📱 電話番号</h3>
            <p className="text-gray-900">{profile.phone}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">📅 入会日</h3>
            <p className="text-gray-900">{formatDate(profile.joinDate)}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">🎫 総予約回数</h3>
            <p className="text-gray-900">{profile.totalBookings}回</p>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 利用統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{profile.totalBookings}</div>
            <div className="text-sm text-gray-600">総予約数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">¥{profile.totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">総利用金額</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{profile.membershipLevel}</div>
            <div className="text-sm text-gray-600">会員ランク</div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">アクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            プロフィールを編集
          </button>
          <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            パスワードを変更
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;