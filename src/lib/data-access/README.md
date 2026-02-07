# 共通データアクセス層 - 使用例とドキュメント

## 概要

型安全で再利用可能なデータアクセス層。`useQuery` / `useMutation` フックとリポジトリパターンにより、全ページのデータアクセスを統一しています。

## ディレクトリ構成

```
src/lib/data-access/
├── base/
│   ├── types.ts              # 共通型定義 (Result, DataAccessError)
│   ├── BaseRepository.ts     # 基本リポジトリクラス (CRUD)
│   ├── QueryBuilder.ts       # クエリビルダー
│   ├── __tests__/             # ユニットテスト
│   └── index.ts
├── hooks/
│   ├── useQuery.ts           # データフェッチ用フック
│   ├── useMutation.ts        # データ更新用フック
│   ├── useRepository.ts      # リポジトリインスタンス生成
│   ├── __tests__/             # ユニットテスト
│   └── index.ts
├── repositories/             # テーブル固有リポジトリ (14個)
└── index.ts
```

## 使用方法

### 1. useQuery - データフェッチ（推奨）

```typescript
import { useQuery } from '../lib/data-access';
import { supabase } from '../lib/supabase';

function EventsPage() {
  const { data: events, loading, error, refetch } = useQuery<Event[]>(
    async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    },
    { enabled: !!user }  // 条件付き実行
  );

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return <div>{events?.map(e => <div key={e.id}>{e.title}</div>)}</div>;
}
```

### 2. リポジトリ + useQuery

```typescript
import { EventRepository, useQuery, useRepository } from '../lib/data-access';

function EventsPage() {
  const eventRepo = useRepository(EventRepository);

  const { data: events, loading, refetch } = useQuery(
    () => eventRepo.findUpcoming()
  );

  // useMutationと組み合わせ
  const { mutate: createEvent } = useMutation(
    (data) => eventRepo.create(data),
    { onSuccess: () => refetch() }
  );
}
```

### 3. useQuery オプション

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enabled` | `boolean` | `true` | `false`の場合クエリを実行しない |
| `refetchOnMount` | `boolean` | `true` | マウント時に再フェッチ |
| `onSuccess` | `(data) => void` | - | 成功時コールバック |
| `onError` | `(error) => void` | - | エラー時コールバック |

### 4. useMutation オプション

| オプション | 型 | 説明 |
|---|---|---|
| `onSuccess` | `(data, variables) => void` | 成功時コールバック |
| `onError` | `(error, variables) => void` | エラー時コールバック |
| `onSettled` | `(data, error, variables) => void` | 完了時コールバック |

### 5. エラーハンドリング

```typescript
const result = await eventRepo.findById('event-id');

if (result.success) {
  console.log(result.data);  // 型安全にアクセス
} else {
  console.error(result.error.message);
}
```

## カスタムリポジトリの作成

```typescript
import { BaseRepository } from '../base/BaseRepository';
import type { Result, Row } from '../base/types';

export class ReviewRepository extends BaseRepository<'reviews'> {
  constructor() {
    super('reviews');
  }

  async findPublished(): Promise<Result<Row<'reviews'>[]>> {
    return this.findWhere('is_published', true, {
      orderBy: { column: 'created_at', ascending: false },
    });
  }
}
```

## テスト

```bash
npm test         # テスト実行
npm run test:watch  # ウォッチモード
```

テスト構成:
- `base/__tests__/types.test.ts` - Result型、DataAccessError
- `base/__tests__/BaseRepository.test.ts` - CRUD操作（モック）
- `hooks/__tests__/useQuery.test.tsx` - useQueryフック
- `hooks/__tests__/useMutation.test.tsx` - useMutationフック

## 利点

1. **型安全性**: `as any`キャストが不要
2. **再利用性**: 共通ロジックの一元化
3. **保守性**: データアクセスロジックの分離
4. **テスタビリティ**: モックが容易
5. **一貫性**: 統一されたエラーハンドリング
