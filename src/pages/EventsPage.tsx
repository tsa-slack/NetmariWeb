import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { EventRepository, useQuery, useRepository } from '../lib/data-access';
import { supabase } from '../lib/supabase';
import type { Row } from '../lib/data-access/base/types';
import { logger } from '../lib/logger';
import LoadingSpinner from '../components/LoadingSpinner';

type Event = Row<'events'> & {
  organizer?: {
    first_name: string;
    last_name: string;
  };
  participant_count?: number;
  image_url?: string | null;
  status?: string;
};

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  
  // リポジトリインスタンスを作成
  const eventRepo = useRepository(EventRepository);

  // イベント一覧を取得
  const { data: eventsData, loading, error, refetch } = useQuery<Event[]>(
    async () => {
      // 基本的なイベント取得
      const result = await eventRepo.findAll({
        orderBy: { column: 'event_date', ascending: true },
      });

      if (!result.success) {
        return result; // エラーをそのまま返す
      }

      // 主催者情報と参加者数を含むイベントを取得
      const eventsWithDetails = await Promise.all(
        result.data.map(async (event) => {
          // 主催者情報を取得
          const { data: organizer } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', event.organizer_id!)
            .maybeSingle();

          // ステータスを日付から計算
          const now = new Date();
          const eventDate = new Date(event.event_date);
          const endDate = event.end_date ? new Date(event.end_date) : eventDate;
          let status: string;
          if (now < eventDate) {
            status = 'Upcoming';
          } else if (now <= endDate) {
            status = 'Ongoing';
          } else {
            status = 'Completed';
          }

          // 参加者数を取得
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'Registered');

          return {
            ...event,
            organizer: organizer || undefined,
            participant_count: count || 0,
            status,
          } as Event;
        })
      );

      return { success: true, data: eventsWithDetails } as const;
    },
    {
      onError: (err: Error) => {
        logger.error('Error loading events:', err);
      },
    }
  );

  // フィルタリングされたイベント
  const filteredEvents = useMemo(() => {
    if (!eventsData) return [];

    const now = new Date().toISOString();
    
    if (filter === 'upcoming') {
      return eventsData.filter((event: Event) => event.event_date >= now);
    } else if (filter === 'past') {
      return eventsData.filter((event: Event) => event.event_date < now);
    }
    
    return eventsData;
  }, [eventsData, filter]);

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

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              再試行
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">イベント</h1>
          <p className="text-gray-600">コミュニティのイベントを探して参加しよう</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            開催予定
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            過去のイベント
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">イベントがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: Event) => (
              <Link
                key={event.id}
                to={`/portal/events/${event.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {event.image_url ? (
                  <div
                    className="h-72 bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.image_url})` }}
                  />
                ) : (
                  <div className="h-72 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Calendar className="h-20 w-20 text-white" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
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
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {event.location_type === 'Online' ? 'オンライン' : 'オフライン'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(event.event_date).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {event.participant_count}
                      {event.max_participants ? `/${event.max_participants}` : ''}名参加
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
