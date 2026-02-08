import { useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import ImageUpload from '../components/ImageUpload';
import { useQuery, useRepository, EventRepository } from '../lib/data-access';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

// Event型は必要に応じて使用

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const eventRepo = useRepository(EventRepository);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty && !loading);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState('Offline');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('Upcoming');

  // 編集時にイベントデータを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const { loading: _loadingEvent } = useQuery<any>(
    async () => {
      const result = await eventRepo.findById(id!);
      if (!result.success) throw result.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;

      if (data && data.organizer_id === user!.id) {
        setTitle(data.title);
        setDescription(data.description);
        setEventDate(data.event_date.slice(0, 16));
        setEndDate(data.end_date ? data.end_date.slice(0, 16) : '');
        setLocation(data.location || '');
        setLocationType(data.location_type || 'Offline');
        setMaxParticipants(data.max_participants?.toString() || '');
        setImageUrl(data.image_url || '');
        setStatus(data.status || 'Upcoming');
      }

      return { success: true, data };
    },
    { enabled: !!(id && user) }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !eventDate) {
      toast.warning('必須項目を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: new Date(eventDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        location: location.trim() || null,
        location_type: locationType,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        image_url: imageUrl.trim() || null,
        status,
        organizer_id: user!.id,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const result = await eventRepo.update(id, eventData);
        if (!result.success) throw result.error;

        toast.success('イベントを更新しました');
        navigate(`/portal/events/${id}`);
      } else {
        const result = await eventRepo.create(eventData);
        if (!result.success) throw result.error;

        toast.success('イベントを作成しました');
        navigate(`/portal/events/${result.data.id}`);
      }
    } catch (error) {
      handleError(error, 'イベントの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/portal/events" className="text-blue-600 hover:text-blue-700">
            ← イベント一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {id ? 'イベントを編集' : 'イベントを作成'}
          </h1>

          <form onSubmit={handleSubmit} onChange={() => { if (!isDirty) setIsDirty(true); }} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                イベント名 <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：秋のツーリングイベント"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                説明 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="イベントの詳細を入力してください"
                rows={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                  開始日時 <span className="text-red-600">*</span>
                </label>
                <input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  終了日時（任意）
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-2">
                開催形式
              </label>
              <select
                id="locationType"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Offline">オフライン</option>
                <option value="Online">オンライン</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                場所
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={locationType === 'Online' ? '例：Zoom' : '例：東京都渋谷区'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                最大参加者数（任意）
              </label>
              <input
                id="maxParticipants"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="例：50"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              bucket="images"
              folder={user?.id}
              label="イベント画像"
            />

            {id && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Upcoming">開催予定</option>
                  <option value="Ongoing">開催中</option>
                  <option value="Completed">終了</option>
                  <option value="Cancelled">キャンセル</option>
                </select>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : id ? '更新する' : '作成する'}
              </button>
              <Link
                to="/portal/events"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title={id ? 'イベントを更新しますか？' : 'イベントを作成しますか？'}
        message="この内容でよろしいですか？"
      />
    </Layout>
  );
}
