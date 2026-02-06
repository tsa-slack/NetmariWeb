import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, Plus, Clock } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'] & {
  organizer?: {
    first_name: string;
    last_name: string;
  };
  participant_count?: number;
};

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:users(first_name, last_name)
        `)
        .order('event_date', { ascending: true });

      if (filter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('event_date', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const eventsWithCounts = await Promise.all(
          data.map(async (event) => {
            const { count } = await supabase
              .from('event_participants')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'Registered');

            return { ...event, participant_count: count || 0 };
          })
        );
        setEvents(eventsWithCounts);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">イベント</h1>
            <p className="text-gray-600">コミュニティのイベントを探して参加しよう</p>
          </div>
          <Link
            to="/portal/events/new"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            イベントを作成
          </Link>
        </div>

        <div className="mb-6 flex space-x-4">
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">イベントがありません</p>
            <Link
              to="/portal/events/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              最初のイベントを作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/portal/events/${event.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {event.image_url ? (
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.image_url})` }}
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
