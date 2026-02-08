import { useState } from 'react';
import { Bell, Shield, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/ConfirmModal';
import type { Database } from '../../lib/database.types';
import type { UserProfile } from './types';
import { handleError } from '../../lib/handleError';

type UserUpdate = Database['public']['Tables']['users']['Update'];

interface SettingsTabProps {
  userSettings: UserProfile | null;
  setUserSettings: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  settingsLoading: boolean;
}

export default function SettingsTab({ userSettings, setUserSettings, settingsLoading }: SettingsTabProps) {
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAccountSuspension, setShowAccountSuspension] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_savingSettings, setSavingSettings] = useState(false);
  const [suspendReason] = useState('');

  const updateNotificationSetting = async (field: string, value: boolean) => {
    try {
      setSavingSettings(true);
      const { error } = await supabase.from('users').update({ [field]: value } as UserUpdate).eq('id', user!.id);
      if (error) throw error;
      setUserSettings(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      handleError(error, '設定の更新に失敗しました');
    } finally {
      setSavingSettings(false);
    }
  };

  const updatePrivacySetting = async (field: string, value: boolean | string) => {
    try {
      setSavingSettings(true);
      const { error } = await supabase.from('users').update({ [field]: value } as UserUpdate).eq('id', user!.id);
      if (error) throw error;
      setUserSettings(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      handleError(error, '設定の更新に失敗しました');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSuspendAccount = async () => {
    try {
      setSavingSettings(true);
      const { error } = await supabase.rpc('suspend_account' as never, { reason: suspendReason || null } as never);
      if (error) throw error;
      toast.warning('アカウントを一時停止しました。再度ログインすると、アカウントを再開できます。');
      window.location.href = '/login';
    } catch (error) {
      handleError(error, 'アカウントの一時停止に失敗しました');
    } finally {
      setSavingSettings(false);
      setShowSuspendModal(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">通知設定</h3>
            </div>
            {showNotifications ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </button>

          {showNotifications && (
            <div className="space-y-4 pl-13">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">メール通知</p>
                  <p className="text-sm text-gray-600">重要な更新をメールで受け取る</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.email_notifications ?? true} onChange={(e) => updateNotificationSetting('email_notifications', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">ストーリー通知</p>
                  <p className="text-sm text-gray-600">新しいコメントやいいねを受け取る</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.story_notifications ?? true} onChange={(e) => updateNotificationSetting('story_notifications', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">レンタル通知</p>
                  <p className="text-sm text-gray-600">予約の確認や更新を受け取る</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.rental_notifications ?? true} onChange={(e) => updateNotificationSetting('rental_notifications', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">コメント通知</p>
                  <p className="text-sm text-gray-600">あなたへの返信を受け取る</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.comment_notifications ?? true} onChange={(e) => updateNotificationSetting('comment_notifications', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">プライバシー設定</h3>
            </div>
            {showPrivacy ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </button>

          {showPrivacy && (
            <div className="space-y-4 pl-13">
              <div className="py-3 border-b">
                <label className="font-medium text-gray-800 block mb-2">プロフィールの公開範囲</label>
                <select
                  value={userSettings?.profile_visibility ?? 'public'}
                  onChange={(e) => updatePrivacySetting('profile_visibility', e.target.value)}
                  disabled={settingsLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  {userSettings?.profile_visibility === 'private'
                    ? 'プロフィールは非公開です'
                    : '誰でもプロフィールを閲覧できます'}
                </p>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">メールアドレスを表示</p>
                  <p className="text-sm text-gray-600">プロフィールにメールアドレスを表示する</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.show_email ?? false} onChange={(e) => updatePrivacySetting('show_email', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">電話番号を表示</p>
                  <p className="text-sm text-gray-600">プロフィールに電話番号を表示する</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={userSettings?.show_phone ?? false} onChange={(e) => updatePrivacySetting('show_phone', e.target.checked)} disabled={settingsLoading} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
          <button
            onClick={() => setShowAccountSuspension(!showAccountSuspension)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">アカウントの一時停止</h3>
            </div>
            {showAccountSuspension ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </button>

          {showAccountSuspension && (
            <div className="pl-13">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">注意事項</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>アカウントを一時停止すると、プロフィールとコンテンツが他のユーザーに表示されなくなります</li>
                  <li>いつでも再度ログインして、アカウントを再開できます</li>
                  <li>一時停止中もデータは保持されます</li>
                </ul>
              </div>
              <button
                onClick={() => setShowSuspendModal(true)}
                disabled={settingsLoading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                アカウントを一時停止
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendAccount}
        title="アカウント停止の確認"
        message="本当にアカウントを停止しますか？この操作は取り消せません。"
        confirmText="停止する"
        cancelText="キャンセル"
        type="danger"
      />
    </>
  );
}
