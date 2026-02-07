import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Clock, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useQuery } from '../lib/data-access';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

interface Activity {
  id: string;
  partner_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  max_participants: number;
  difficulty_level: string;
  available_seasons: string[];
  partner?: {
    name: string;
  };
}

export default function ActivityManagementPage() {
  const { user, loading: authLoading, isAdmin, isStaff } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    partner_id: '',
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    max_participants: 10,
    difficulty_level: 'Beginner',
    available_seasons: [] as string[],
  });

  // アクティビティ一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activities, loading, refetch: refetchActivities } = useQuery<any[]>(
    async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          partner:partners(name)
        `)
        .order('name');

      if (error) throw error;
      return { success: true, data: data || [] };
    },
    { enabled: true }
  );

  // パートナー一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners } = useQuery<any[]>(
    async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return { success: true, data: data || [] };
    },
    { enabled: true }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingActivity) {
        const { error } = await (supabase
          .from('activities'))
          .update(formData)
          .eq('id', editingActivity.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('activities'))
          .insert([formData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingActivity(null);
      resetForm();
      refetchActivities();
    } catch (error) {
      logger.error('Error saving activity:', error);
      toast.error('アクティビティの保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      refetchActivities();
    } catch (error) {
      logger.error('Error deleting activity:', error);
      toast.error('アクティビティの削除に失敗しました');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      partner_id: '',
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      max_participants: 10,
      difficulty_level: 'Beginner',
      available_seasons: [],
    });
  };

  const startEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      partner_id: activity.partner_id,
      name: activity.name,
      description: activity.description,
      duration_minutes: activity.duration_minutes,
      price: activity.price,
      max_participants: activity.max_participants,
      difficulty_level: activity.difficulty_level,
      available_seasons: activity.available_seasons,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingActivity(null);
    resetForm();
  };

  const toggleSeason = (season: string) => {
    setFormData(prev => ({
      ...prev,
      available_seasons: prev.available_seasons.includes(season)
        ? prev.available_seasons.filter(s => s !== season)
        : [...prev.available_seasons, season]
    }));
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <TrendingUp className="h-10 w-10 mr-3 text-orange-600" />
              アクティビティ管理
            </h1>
            <p className="text-gray-600">体験プログラムの登録・編集</p>
          </div>
          {(isAdmin || isStaff) && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              新規登録
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingActivity ? 'アクティビティ編集' : '新規アクティビティ登録'}
            </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                協力店舗
              </label>
              <select
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(partners || []).map((partner: any) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アクティビティ名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所要時間（分）
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  料金（円）
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大参加人数
                </label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                難易度
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Beginner">初級</option>
                <option value="Intermediate">中級</option>
                <option value="Advanced">上級</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施可能シーズン
              </label>
              <div className="flex flex-wrap gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleSeason(season)}
                    className={`px-4 py-2 rounded-lg transition ${
                      formData.available_seasons.includes(season)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {season === 'Spring' && '春'}
                    {season === 'Summer' && '夏'}
                    {season === 'Fall' && '秋'}
                    {season === 'Winter' && '冬'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingActivity ? '更新' : '登録'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                キャンセル
              </button>
            </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (activities || []).length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              アクティビティがありません
            </h3>
            <p className="text-gray-600 mb-6">
              まだアクティビティが登録されていません
            </p>
            {(isAdmin || isStaff) && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初のアクティビティを登録
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(activities || []).map((activity: any) => (
              <div key={activity.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {activity.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{activity.partner?.name}</span>
                    </div>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{activity.duration_minutes}分</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        <span>¥{activity.price.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-700">
                        <span className="font-medium">定員:</span> {activity.max_participants}名
                      </div>
                      <div className="text-gray-700">
                        <span className="font-medium">難易度:</span>{' '}
                        {activity.difficulty_level === 'Beginner' && '初級'}
                        {activity.difficulty_level === 'Intermediate' && '中級'}
                        {activity.difficulty_level === 'Advanced' && '上級'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {activity.available_seasons.map((season: string) => (
                        <span
                          key={season}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {season === 'Spring' && '春'}
                          {season === 'Summer' && '夏'}
                          {season === 'Fall' && '秋'}
                          {season === 'Winter' && '冬'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(isAdmin || isStaff) && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => startEdit(activity)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(activity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="アクティビティを削除"
        message="このアクティビティを削除してもよろしいですか？この操作は取り消せません。"
      />
    </AdminLayout>
  );
}
