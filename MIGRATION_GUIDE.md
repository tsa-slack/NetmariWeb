# データベースマイグレーションガイド

このガイドでは、Netomariプロジェクトのデータベースを新しいSupabaseプロジェクトにセットアップする方法を説明します。

## 前提条件

- Supabase CLI がインストールされていること
- 新しいSupabaseプロジェクトが作成されていること
- PostgreSQL の基本的な知識

## 方法1: Supabase CLIでスキーマをエクスポート・インポート（推奨）

### ステップ1: 現在のプロジェクトからスキーマをエクスポート

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# 現在のプロジェクトにリンク
supabase link --project-ref YOUR_CURRENT_PROJECT_REF

# スキーマをエクスポート（構造のみ）
supabase db dump --data-only=false -f schema.sql

# スキーマをエクスポート（データを含む）
supabase db dump -f complete_dump.sql
```

### ステップ2: 新しいプロジェクトにインポート

```bash
# 新しいプロジェクトにリンクを切り替え
supabase link --project-ref YOUR_NEW_PROJECT_REF

# スキーマをインポート
supabase db reset
psql \
  "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f schema.sql
```

## 方法2: Supabaseダッシュボード経由

### ステップ1: 現在のスキーマを取得

1. 現在のSupabaseプロジェクトのダッシュボードを開く
2. 「SQL Editor」に移動
3. 以下のSQLを実行してスキーマ情報を取得：

```sql
-- テーブル一覧を取得
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 各テーブルのCREATE文を生成するには、pg_dumpを使用
```

### ステップ2: 新しいプロジェクトでスキーマを作成

1. 新しいSupabaseプロジェクトのダッシュボードを開く
2. 「SQL Editor」に移動
3. エクスポートしたSQLファイルの内容を貼り付けて実行

## 方法3: ローカル開発環境を使用

### ステップ1: ローカルSupabaseを初期化

```bash
# プロジェクトディレクトリで実行
supabase init

# ローカルSupabaseを起動
supabase start
```

### ステップ2: 本番環境からスキーマを取得

```bash
# 本番環境にリンク
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# ローカルにマイグレーションを生成
supabase db remote commit

# または、差分からマイグレーションを生成
supabase db diff -f initial_schema
```

### ステップ3: 新しい本番環境にデプロイ

```bash
# 新しいプロジェクトにリンク
supabase link --project-ref YOUR_NEW_PROJECT_REF

# マイグレーションを適用
supabase db push
```

## データベース構造の概要

### テーブル一覧（32テーブル）

#### コアテーブル
- `users` - ユーザープロフィール
- `categories` - 動的カテゴリシステム
- `vehicles` - 車両カタログ（販売・レンタル）
- `rental_vehicles` - レンタル車両情報
- `equipment` - レンタル機器
- `partners` - 協力店情報
- `activities` - アクティビティカタログ

#### 予約関連
- `reservations` - 予約情報
- `reservation_equipment` - 予約に含まれる機器
- `reservation_activities` - 予約に含まれるアクティビティ

#### コミュニティ
- `stories` - 体験記
- `story_questions` - 体験記への質問
- `story_answers` - 体験記の回答
- `story_likes` - いいね
- `story_favorites` - ブックマーク
- `vehicle_favorites` - 車両ブックマーク
- `partner_favorites` - 協力店ブックマーク
- `questions` - Q&A質問
- `answers` - Q&A回答
- `reviews` - レビュー
- `review_helpfuls` - レビューの役立った投票

#### イベント・通知
- `events` - イベント情報
- `event_participants` - イベント参加者
- `announcements` - お知らせ
- `notifications` - 通知

#### ルート
- `routes` - 保存されたルート
- `route_stops` - ルートの経由地

#### スタッフ管理
- `rental_checklists` - レンタルチェックリスト
- `equipment_preparations` - 機器準備管理

#### システム管理
- `contacts` - お問い合わせ
- `admin_logs` - 管理者ログ
- `system_settings` - システム設定

### 重要な機能

#### 1. Row Level Security (RLS)
すべてのテーブルでRLSが有効化されています：
- 認証済みユーザーのみアクセス可能
- ユーザーは自分のデータのみ編集可能
- 管理者・スタッフは全データにアクセス可能

#### 2. 関数とトリガー
- `handle_new_user()` - 新規ユーザー作成時の自動処理
- `update_*_updated_at()` - updated_at自動更新
- `sync_equipment_preparations()` - 機器準備の自動同期
- `calculate_total_spent()` - 累計利用金額計算
- `calculate_total_likes()` - いいね数計算
- `calculate_total_posts()` - 投稿数計算
- `determine_user_rank()` - ランク判定
- `update_user_rank()` - ランク更新
- `trigger_update_rank_on_*()` - ランク自動更新トリガー

#### 3. 会員ランクシステム
- Bronze（初期）: 割引なし
- Silver: ¥50,000以上 or いいね10以上 or 投稿3以上、5%割引
- Gold: ¥200,000以上 or いいね30以上 or 投稿10以上、10%割引
- Platinum: ¥500,000以上 or いいね100以上 or 投稿30以上、15%割引

## サンプルデータのインポート

スキーマ作成後、以下のサンプルデータをインポートできます：

```bash
# サンプルデータをエクスポート
supabase db dump --data-only -f sample_data.sql

# 新しいプロジェクトにインポート
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" -f sample_data.sql
```

## トラブルシューティング

### エラー: 権限不足

```
ERROR: permission denied for schema public
```

**解決方法**: PostgreSQLのスーパーユーザー権限が必要です。Supabaseダッシュボードの「SQL Editor」から実行してください。

### エラー: テーブルが既に存在

```
ERROR: relation "users" already exists
```

**解決方法**: `CREATE TABLE IF NOT EXISTS` を使用するか、既存のテーブルを削除してください。

### エラー: 外部キー制約違反

```
ERROR: foreign key constraint failed
```

**解決方法**: テーブルを正しい順序で作成してください。依存関係のないテーブルから順に作成します。

## 検証

マイグレーション後、以下を確認してください：

```sql
-- テーブル数を確認（32個あるはず）
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- RLSが有効化されているか確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 関数が存在するか確認
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

## 参考資料

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [DATABASE_SCHEMA.md](./supabase/DATABASE_SCHEMA.md) - 詳細なスキーマ情報

## サポート

問題が発生した場合：
1. GitHub Issuesで報告
2. Supabase Discordコミュニティで質問
3. プロジェクトのDiscussionsで議論

---

**最終更新**: 2026-02-07
