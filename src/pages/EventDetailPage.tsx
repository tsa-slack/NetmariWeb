import { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, Clock, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  EventRepository,
  EventParticipantRepository,
  useQuery,
  useRepository,
} from '../lib/data-access';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // リポジトリインスタンスを作成
  const eventRepo = useRepository(EventRepository);
  const participantRepo = new EventParticipantRepository();

  // イベント詳細を取得
  const { data: event, loading } = useQuery<any>( // eslint-disable-line @typescript-eslint/no-explicit-any
    async () => eventRepo.findByIdWithOrganizer(id!),
    { enabled: !!id }
  );

  // 参加者一覧を取得
  const { data: participants, refetch: refetchParticipants } = useQuery<any[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    async () => participantRepo.findByEventWithUser(id!),
    { enabled: !!id }
  );

  // 参加状況を確認
  const { data: isParticipating } = useQuery<boolean>(
    async () => participantRepo.checkParticipation(id!, user!.id),
    { enabled: !!(id && user) }
  );

  // ミューテーション関数（直接Supabase呼び出しを維持）

  const handleRegister = async () => {
    if (!user) {
      toast.warning('参加するにはログインが必要です');
      return;
    }

    try {
      const { error } = await (supabase

        .from('event_participants'))

        .insert({
          event_id: id,
          user_id: user.id,
          status: 'Registered',
        });

      if (error) throw error;

      refetchParticipants();
      toast.success('イベントに参加登録しました');
    } catch (error) {
      handleError(error, '参加登録に失敗しました');
    }
  };

  const handleCancel = async () => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', id!)
        .eq('user_id', user!.id);

      if (error) throw error;

      refetchParticipants();
      toast.success('参加をキャンセルしました');
    } catch (error) {
      handleError(error, 'キャンセルに失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id!);

      if (error) throw error;

      toast.success('イベントを削除しました');
      navigate('/portal/events');
    } catch (error) {
      handleError(error, 'イベントの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!event) {
    return <Navigate to="/portal/events" replace />;
  }

  const isOrganizer = user && event.organizer_id === user.id;
  const isAdmin = profile?.role === 'Admin';
  const canEdit = isOrganizer || isAdmin;
  const isFull = event.max_participants && (participants || []).length >= event.max_participants;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/portal/events" className="text-blue-600 hover:text-blue-700">
            ← イベント一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {event.image_url ? (
            <div
              className="h-96 bg-cover bg-center"
              style={{ backgroundImage: `url(${event.image_url})` }}
            />
          ) : (
            <div className="h-96 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Calendar className="h-32 w-32 text-white opacity-50" />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      event.status === 'Upcoming'
                        ? 'bg-green-100 text-green-700'
                        : event.status === 'Ongoing'
                        ? 'bg-blue-100 text-blue-700'
                        : event.status === 'Completed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {event.status === 'Upcoming'
                      ? '開催予定'
                      : event.status === 'Ongoing'
                      ? '開催中'
                      : event.status === 'Completed'
                      ? '終了'
                      : 'キャンセル'}
                  </span>
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                    {event.location_type === 'Online' ? 'オンライン' : 'オフライン'}
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">{event.title}</h1>
                <p className="text-gray-600">
                  主催者: {event.organizer?.first_name} {event.organizer?.last_name}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {canEdit && (
                  <>
                    <Link
                      to={`/portal/events/${event.id}/edit`}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit className="h-6 w-6" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </>
                )}
                {!isOrganizer && event.status === 'Upcoming' && (
                  isParticipating ? (
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <UserMinus className="h-5 w-5 mr-2" />
                      参加をキャンセル
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={Boolean(isFull)}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      {isFull ? '満員' : '参加する'}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">概要</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  日時
                </h3>
                <p className="text-gray-700">
                  開始: {new Date(event.event_date).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {event.end_date && (
                  <p className="text-gray-700">
                    終了: {new Date(event.end_date).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              {event.location && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    場所
                  </h3>
                  <p className="text-gray-700">{event.location}</p>
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  参加者
                </h3>
                <p className="text-gray-700">
                  {(participants || []).length}
                  {event.max_participants ? `/${event.max_participants}` : ''}名
                </p>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">参加者一覧</h3>
              {!participants || participants.length === 0 ? (
                <p className="text-gray-600 text-center py-8">まだ参加者がいません</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div
                      key={participant.id}
                      className="flex items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {participant.user.first_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {participant.user.first_name} {participant.user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(participant.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="イベントを削除"
        message="本当にこのイベントを削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Layout>
  );
}
