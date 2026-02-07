import { EventRepository, useQuery, useMutation, useRepository } from '../index';
import type { Row } from '../base/types';

/**
 * イベント一覧ページのサンプル実装
 */
export default function EventsPageExample() {
  // リポジトリインスタンスを作成
  const eventRepo = useRepository(EventRepository);

  // 開催予定のイベントを取得
  const { data: upcomingEvents, loading, error, refetch } = useQuery(
    () => eventRepo.findUpcoming(),
    {
      onSuccess: (events: Row<'events'>[]) => {
        console.log('Loaded events:', events.length);
      },
      onError: (err: Error) => {
        console.error('Failed to load events:', err);
      },
    }
  );

  // イベント作成用のミューテーション
  const { mutate: createEvent, loading: creating } = useMutation(
    (data: any) => eventRepo.create(data),
    {
      onSuccess: (event: Row<'events'>) => {
        console.log('Created event:', event);
        // 一覧を再取得
        refetch();
      },
      onError: (err: Error) => {
        alert('イベントの作成に失敗しました: ' + err.message);
      },
    }
  );

  // イベント削除用のミューテーション
  const { mutate: deleteEvent, loading: deleting } = useMutation(
    (id: string) => eventRepo.delete(id),
    {
      onSuccess: () => {
        console.log('Event deleted');
        refetch();
      },
    }
  );

  const handleCreateEvent = () => {
    createEvent({
      title: '新しいイベント',
      description: 'イベントの説明',
      event_date: new Date().toISOString(),
      organizer_id: 'user-id',
      status: 'Upcoming',
      location_type: 'Online',
    });
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  return (
    <div>
      <h1>イベント一覧</h1>
      
      <button 
        onClick={handleCreateEvent}
        disabled={creating}
      >
        {creating ? '作成中...' : '新しいイベントを作成'}
      </button>

      <div>
        {upcomingEvents?.map((event: Row<'events'>) => (
          <div key={event.id}>
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <button
              onClick={() => deleteEvent(event.id)}
              disabled={deleting}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
