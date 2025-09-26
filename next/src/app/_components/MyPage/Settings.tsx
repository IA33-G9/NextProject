// 設定コンポーネント　//モックデータ使用
import {useEffect, useState} from "react";
// 設定情報の型定義
interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  autoConfirm: boolean;
}
const SettingsComponent = ({ settings }: { settings: UserSettings | null }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleNotificationChange = (type: keyof UserSettings['notifications']) => {
    setLocalSettings(prev => prev ? {
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    } : null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">⚙️ 設定</h2>

      {/* 通知設定 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 通知設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">メール通知</h4>
              <p className="text-sm text-gray-600">予約確認やお知らせをメールで受信</p>
            </div>
            <button
              onClick={() => handleNotificationChange('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>


          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">プッシュ通知</h4>
              <p className="text-sm text-gray-600">アプリ内でのお知らせを受信</p>
            </div>
            <button
              onClick={() => handleNotificationChange('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* その他の設定 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 一般設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">言語</label>
            <select
              value={localSettings.language}
              onChange={(e) => setLocalSettings(prev => prev ? {...prev, language: e.target.value} : null)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タイムゾーン</label>
            <select
              value={localSettings.timezone}
              onChange={(e) => setLocalSettings(prev => prev ? {...prev, timezone: e.target.value} : null)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Tokyo">東京 (UTC+9)</option>
              <option value="Asia/Seoul">ソウル (UTC+9)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">自動確認</h4>
              <p className="text-sm text-gray-600">予約時に自動的に確認する</p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => prev ? {...prev, autoConfirm: !prev.autoConfirm} : null)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.autoConfirm ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.autoConfirm ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          設定を保存
        </button>
      </div>
    </div>
  );
};

export default SettingsComponent;