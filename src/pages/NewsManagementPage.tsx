import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Newspaper,
  Plus,
  Trash2,
  Filter,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  Info,
  Edit3,
  X,
  Save,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useQuery, useRepository, AnnouncementRepository } from '../lib/data-access';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  priority: string | null;
  published: boolean | null;
  author_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function NewsManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const announcementRepo = useRepository(AnnouncementRepository);
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // 新規作成/編集モーダル
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [saving, setSaving] = useState(false);

  // お知らせ一覧を取得
  const { data: announcements, loading: loadingAnnouncements, refetch } = useQuery<Announcement[]>(
    async () => {
      return announcementRepo.findAllSorted();
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  // フィルタリングと検索
  const filteredAnnouncements = useMemo(() => {
    let list = announcements || [];

    // 公開状態フィルタ
    if (filter === 'published') {
      list = list.filter((a) => a.published);
    } else if (filter === 'unpublished') {
      list = list.filter((a) => !a.published);
    }

    // 検索
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.content.toLowerCase().includes(s) ||
          (a.category && a.category.toLowerCase().includes(s))
      );
    }

    return list;
  }, [announcements, filter, searchTerm]);

  // 公開/非公開の切り替え
  const togglePublished = async (id: string, currentPublished: boolean | null) => {
    try {
      const result = await announcementRepo.update(id, {
        published: !currentPublished,
      });
      if (!result.success) throw result.error;
      refetch();
    } catch (error) {
      handleError(error, '公開状態の変更に失敗しました');
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      const result = await announcementRepo.delete(selectedAnnouncement.id);
      if (!result.success) throw result.error;
      setDeleteModalOpen(false);
      setSelectedAnnouncement(null);
      refetch();
    } catch (error) {
      handleError(error, 'お知らせの削除に失敗しました');
    }
  };

  // 新規作成を開始
  const openNewModal = () => {
    setEditingAnnouncement({
      title: '',
      content: '',
      category: '',
      priority: 'Medium',
      published: false,
    });
    setEditModalOpen(true);
  };

  // 編集を開始
  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement({ ...announcement });
    setEditModalOpen(true);
  };

  // 保存
  const handleSave = async () => {
    if (!editingAnnouncement) return;
    if (!editingAnnouncement.title?.trim() || !editingAnnouncement.content?.trim()) {
      handleError(new Error('タイトルと内容は必須です'), 'タイトルと内容は必須です');
      return;
    }

    setSaving(true);
    try {
      if (editingAnnouncement.id) {
        // 更新
        const result = await announcementRepo.update(editingAnnouncement.id, {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          category: editingAnnouncement.category || null,
          priority: editingAnnouncement.priority || 'Medium',
          published: editingAnnouncement.published ?? false,
        });
        if (!result.success) throw result.error;
      } else {
        // 新規作成
        const result = await announcementRepo.create({
          title: editingAnnouncement.title!,
          content: editingAnnouncement.content!,
          category: editingAnnouncement.category || null,
          priority: editingAnnouncement.priority || 'Medium',
          published: editingAnnouncement.published ?? false,
          author_id: user?.id || null,
        });
        if (!result.success) throw result.error;
      }

      setEditModalOpen(false);
      setEditingAnnouncement(null);
      refetch();
    } catch (error) {
      handleError(error, 'お知らせの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case 'High':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'Low':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'High':
        return '高';
      case 'Medium':
        return '中';
      case 'Low':
        return '低';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
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
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Newspaper className="h-10 w-10 mr-3 text-blue-600" />
              ニュース管理
            </h1>
            <p className="text-gray-600">お知らせの作成・編集・公開管理</p>
          </div>
          <button
            onClick={openNewModal}
            className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            新規作成
          </button>
        </div>

        {/* フィルターと検索 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                フィルター
              </label>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as 'all' | 'published' | 'unpublished')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="published">公開中</option>
                <option value="unpublished">非公開</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="タイトル、内容、カテゴリーで検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 一覧 */}
        {loadingAnnouncements ? (
          <LoadingSpinner size="sm" fullPage={false} />
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              お知らせがありません
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? '検索条件に一致するお知らせが見つかりません'
                : '「新規作成」ボタンからお知らせを作成しましょう'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {/* 公開状態バッジ */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            announcement.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {announcement.published ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              公開中
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              非公開
                            </>
                          )}
                        </span>
                        {/* 優先度バッジ */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                            announcement.priority
                          )}`}
                        >
                          {getPriorityIcon(announcement.priority)}
                          <span className="ml-1">{getPriorityLabel(announcement.priority)}</span>
                        </span>
                        {/* カテゴリーバッジ */}
                        {announcement.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {announcement.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {announcement.title}
                      </h3>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {announcement.content}
                      </p>

                      <p className="text-xs text-gray-400">
                        {announcement.created_at
                          ? new Date(announcement.created_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '-'}
                      </p>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => togglePublished(announcement.id, announcement.published)}
                        className={`p-2 rounded-lg transition ${
                          announcement.published
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={announcement.published ? '非公開にする' : '公開する'}
                      >
                        {announcement.published ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="編集"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="削除"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集/新規作成モーダル */}
      {editModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAnnouncement.id ? 'お知らせを編集' : '新規お知らせ作成'}
              </h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAnnouncement.title || ''}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
                  }
                  placeholder="お知らせのタイトル"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingAnnouncement.content || ''}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })
                  }
                  rows={6}
                  placeholder="お知らせの内容を入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* カテゴリー */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <input
                    type="text"
                    value={editingAnnouncement.category || ''}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, category: e.target.value })
                    }
                    placeholder="例: お知らせ"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 優先度 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    優先度
                  </label>
                  <select
                    value={editingAnnouncement.priority || 'Medium'}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="High">高</option>
                    <option value="Medium">中</option>
                    <option value="Low">低</option>
                  </select>
                </div>

                {/* 公開状態 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    公開状態
                  </label>
                  <select
                    value={editingAnnouncement.published ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        published: e.target.value === 'true',
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">公開</option>
                    <option value="false">非公開</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onConfirm={handleDelete}
        title="お知らせの削除"
        message={`「${selectedAnnouncement?.title}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除する"
        cancelText="キャンセル"
        type="danger"
      />
    </AdminLayout>
  );
}
