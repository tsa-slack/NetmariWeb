import { useState } from 'react';
import { User, Edit, Phone, Mail, MapPin, Save, X, UserCircle, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/ConfirmModal';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import type { Database } from '../../lib/database.types';
import type { RankProgress } from './types';
import { logger } from '../../lib/logger';

type UserUpdate = Database['public']['Tables']['users']['Update'];

interface ProfileTabProps {
  rankProgress: RankProgress | null;
}

export default function ProfileTab({ rankProgress }: ProfileTabProps) {
  const { user, profile } = useAuth();

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty && !profileSaving);
  const [editForm, setEditForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    phone: profile?.phone_number || '',
    postal_code: profile?.postal_code || '',
    prefecture: profile?.prefecture || '',
    city: profile?.city || '',
    address_line: profile?.address_line || '',
    building: profile?.building || '',
  });

  const handleUpdateProfile = () => {
    if (!user || !profile) return;
    setShowConfirmModal(true);
  };

  const confirmUpdateProfile = async () => {
    if (!user || !profile) return;
    setShowConfirmModal(false);
    setProfileSaving(true);
    try {
      const emailChanged = editForm.email !== profile.email;

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: editForm.email,
        });
        if (authError) throw authError;
        toast.success('メールアドレス変更の確認メールを送信しました。メールをご確認ください。');
      }

      const updateData: UserUpdate = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone,
        postal_code: editForm.postal_code,
        prefecture: editForm.prefecture,
        city: editForm.city,
        address_line: editForm.address_line,
        building: editForm.building,
      };

      const { error } = await supabase.from('users').update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      toast.success(emailChanged ? 'プロフィールを更新しました。メールアドレスの変更は確認後に反映されます。' : 'プロフィールを更新しました');
      setShowProfileEdit(false);
      window.location.reload();
    } catch (error: unknown) {
      logger.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setProfileSaving(false);
    }
  };

  const updateEditForm = (updates: Partial<typeof editForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }));
    if (!isDirty) setIsDirty(true);
  };

  return (
    <div>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmUpdateProfile}
        title="プロフィールを更新しますか？"
        message="この内容でプロフィールを保存します。よろしいですか？"
        confirmText="保存する"
        cancelText="キャンセル"
        type="info"
      />

      {showProfileEdit ? (
        /* ─── 編集モード ─── */
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <UserCircle className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">プロフィール編集</h2>
            </div>
          </div>

          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => updateEditForm({ last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">名</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => updateEditForm({ first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              メールアドレス
            </label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => updateEditForm({ email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">メールアドレスを変更すると、確認メールが送信されます</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              電話番号
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => updateEditForm({ phone: e.target.value })}
              placeholder="090-1234-5678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              郵便番号
            </label>
            <input
              type="text"
              value={editForm.postal_code}
              onChange={(e) => updateEditForm({ postal_code: e.target.value })}
              placeholder="123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
              <input
                type="text"
                value={editForm.prefecture}
                onChange={(e) => updateEditForm({ prefecture: e.target.value })}
                placeholder="東京都"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => updateEditForm({ city: e.target.value })}
                placeholder="渋谷区"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">番地</label>
            <input
              type="text"
              value={editForm.address_line}
              onChange={(e) => updateEditForm({ address_line: e.target.value })}
              placeholder="1-2-3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">建物名・部屋番号（任意）</label>
            <input
              type="text"
              value={editForm.building}
              onChange={(e) => updateEditForm({ building: e.target.value })}
              placeholder="○○ビル 101号室"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowProfileEdit(false);
                setIsDirty(false);
                setEditForm({
                  first_name: profile?.first_name || '',
                  last_name: profile?.last_name || '',
                  email: profile?.email || '',
                  phone: profile?.phone_number || '',
                  postal_code: profile?.postal_code || '',
                  prefecture: profile?.prefecture || '',
                  city: profile?.city || '',
                  address_line: profile?.address_line || '',
                  building: profile?.building || '',
                });
              }}
              disabled={profileSaving}
              className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <X className="h-5 w-5 mr-2" />
              キャンセル
            </button>
            <button
              onClick={handleUpdateProfile}
              disabled={profileSaving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {profileSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      ) : (
        /* ─── 表示モード ─── */
        <>
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール情報</h2>
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </button>
            </div>

            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {profile?.rank}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {profile?.phone_number && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">{profile.phone_number}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">{profile.email}</span>
                </div>
              )}
            </div>

            {(profile?.postal_code || profile?.prefecture || profile?.city || profile?.address_line) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  住所
                </h4>
                <div className="text-gray-600">
                  {profile?.postal_code && <p>〒{profile.postal_code}</p>}
                  <p>
                    {profile?.prefecture}{profile?.city}{profile?.address_line}
                    {profile?.building && ` ${profile.building}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {rankProgress && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Award className="h-7 w-7 mr-2 text-yellow-600" />
                  会員ランク進捗
                </h2>
                <div className="flex items-center">
                  <Award
                    className={`h-8 w-8 mr-2 ${
                      rankProgress.currentRank === 'Platinum'
                        ? 'text-gray-400'
                        : rankProgress.currentRank === 'Gold'
                        ? 'text-yellow-500'
                        : rankProgress.currentRank === 'Silver'
                        ? 'text-gray-300'
                        : 'text-orange-600'
                    }`}
                  />
                  <span className="text-2xl font-bold text-gray-800">{rankProgress.currentRank}</span>
                </div>
              </div>

              {rankProgress.discountRate > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-semibold">
                    現在の特典: レンタル料金が{rankProgress.discountRate}%割引になります
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">累計利用金額</span>
                    <span className="text-sm font-semibold text-gray-800">
                      ¥{rankProgress.totalSpent.toLocaleString()}
                      {rankProgress.nextRequirements && (
                        <span className="text-gray-500 ml-2">
                          / ¥{rankProgress.nextRequirements.min_amount.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>
                  {rankProgress.nextRequirements && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (rankProgress.totalSpent / rankProgress.nextRequirements.min_amount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">いいね獲得数</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {rankProgress.totalLikes}
                      {rankProgress.nextRequirements && (
                        <span className="text-gray-500 ml-2">
                          / {rankProgress.nextRequirements.min_likes}
                        </span>
                      )}
                    </span>
                  </div>
                  {rankProgress.nextRequirements && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (rankProgress.totalLikes / rankProgress.nextRequirements.min_likes) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">公開投稿数</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {rankProgress.totalPosts}
                      {rankProgress.nextRequirements && (
                        <span className="text-gray-500 ml-2">
                          / {rankProgress.nextRequirements.min_posts}
                        </span>
                      )}
                    </span>
                  </div>
                  {rankProgress.nextRequirements && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (rankProgress.totalPosts / rankProgress.nextRequirements.min_posts) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {rankProgress.nextRank && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">{rankProgress.nextRank}ランク</span>まであと少し！
                    いずれかの条件を達成すると自動的にランクアップします。
                  </p>
                </div>
              )}

              {!rankProgress.nextRank && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-semibold">
                    最高ランクに到達しています！引き続きサービスをお楽しみください。
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
