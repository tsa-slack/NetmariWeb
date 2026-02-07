# 共通データアクセス層 - 使用例とドキュメント

## 概要

型安全で再利用可能なデータアクセス層が実装されました。このドキュメントでは、基本的な使用方法と実装例を説明します。

## 基本構成

```
src/lib/data-access/
├── base/
│   ├── types.ts              # 共通型定義
│   ├── BaseRepository.ts     # 基本リポジトリクラス
│   ├── QueryBuilder.ts       # クエリビルダー
│   └── index.ts
├── repositories/
│   ├── EventRepository.ts    # イベントリポジトリ
│   ├── UserRepository.ts     # ユーザーリポジトリ
│   └── index.ts
└── index.ts
```

## 使用方法

### 1. Reactフックを使用した実装（推奨）

```typescript
import { EventRepository, useQuery, useMutation, useRepository } from '@/lib/data-access';

function EventsPage() {
  const eventRepo = useRepository(EventRepository);

  // データ取得
  const { data: events, loading, error, refetch } = useQuery(
    () => eventRepo.findUpcoming()
  );

  // データ作成
  const { mutate: createEvent, loading: creating } = useMutation(
    (data) => eventRepo.create(data),
    {
      onSuccess: () => refetch(),
    }
  );

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      {events?.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

### 2. 基本的なCRUD操作

```typescript
import { EventRepository } from '@/lib/data-access';

const eventRepo = new EventRepository();

// 作成
const result = await eventRepo.create({
  title: '新しいイベント',
  description: 'イベントの説明',
  event_date: '2024-12-31',
  organizer_id: userId,
  // ... その他のフィールド
});

if (result.success) {
  console.log('作成されたイベント:', result.data);
} else {
  console.error('エラー:', result.error);
}

// 読み取り
const event = await eventRepo.findById('event-id');

// 更新
const updated = await eventRepo.update('event-id', {
  title: '更新されたタイトル'
});

// 削除
const deleted = await eventRepo.delete('event-id');
```

### 2. カスタムクエリ

```typescript
// 開催予定のイベントを取得
const upcomingEvents = await eventRepo.findUpcoming();

// 主催者でフィルタ
const organizerEvents = await eventRepo.findByOrganizer(userId);

// リレーションを含む
const eventWithOrganizer = await eventRepo.findWithOrganizer('event-id');
```

### 3. QueryBuilderの使用

```typescript
import { QueryBuilder } from '@/lib/data-access';

const query = new QueryBuilder('events')
  .whereEqual('status', 'Upcoming')
  .where('event_date', 'gt', new Date().toISOString())
  .orderBy('event_date', 'asc')
  .limit(10);

const result = await query.execute();
```

### 4. エラーハンドリング

```typescript
const result = await eventRepo.findById('event-id');

if (result.success) {
  // 成功時の処理
  const event = result.data;
  console.log(event);
} else {
  // エラー時の処理
  const error = result.error;
  console.error(error.message);
  alert('データの取得に失敗しました');
}
```

## カスタムリポジトリの作成

新しいテーブル用のリポジトリを作成する場合:

```typescript
import { BaseRepository } from '../base/BaseRepository';
import type { Result, Row } from '../base/types';

export class ReviewRepository extends BaseRepository<'reviews'> {
  constructor() {
    super('reviews');
  }

  // カスタムメソッドを追加
  async findPublished(): Promise<Result<Row<'reviews'>[]>> {
    return this.findWhere('is_published', true, {
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  async findByTarget(targetId: string, targetType: string): Promise<Result<Row<'reviews'>[]>> {
    try {
      const { data, error } = await (this.client
        .from(this.table) as any)
        .select('*')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }
}
```

## 既存コードの移行例

### 移行前

```typescript
// 直接Supabaseを使用
const { data, error } = await (supabase
  .from('events') as any)
  .select('*')
  .eq('status', 'Upcoming')
  .order('event_date', { ascending: true });

if (error) {
  console.error(error);
  return;
}
setEvents(data);
```

### 移行後

```typescript
// リポジトリを使用
const eventRepo = new EventRepository();
const result = await eventRepo.findUpcoming();

if (result.success) {
  setEvents(result.data);
} else {
  console.error(result.error);
}
```

## 利点

1. **型安全性**: `as any`キャストが不要
2. **再利用性**: 共通ロジックの一元化
3. **保守性**: データアクセスロジックの分離
4. **テスタビリティ**: モックが容易
5. **一貫性**: 統一されたエラーハンドリング

## 次のステップ

- [ ] Reactフック（useQuery, useMutation）の実装
- [ ] ページネーション機能の追加
- [ ] キャッシング機構の実装
- [ ] 既存ページの段階的移行
