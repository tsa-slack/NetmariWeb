# データベーススキーマドキュメント

このドキュメントは、キャンピングカーレンタル＆コミュニティプラットフォームのデータベース構造を説明します。

## 概要

- **合計テーブル数**: 32
- **関数数**: 17
- **インデックス数**: 100+
- **セキュリティ**: 全テーブルでRow Level Security (RLS) 有効

## マイグレーション履歴

以前は37個のマイグレーションファイルがありましたが、管理しやすくするため1つの統合マイグレーションに整理されました。
すべてのデータとスキーマは保持されています。

---

## テーブル構造

### コアテーブル

#### 1. users
ユーザープロフィールと認証データを管理

**主要カラム:**
- `id` (uuid) - ユーザーID（auth.uid()にリンク）
- `email` (text) - メールアドレス
- `first_name`, `last_name` (text) - 氏名
- `phone_number` (text) - 電話番号
- `role` (text) - ユーザー役割（Admin, Staff, Partners, Members）
- `rank` (text) - 会員ランク（Bronze, Silver, Gold, Platinum）
- `email_notifications`, `story_notifications`, `rental_notifications`, `comment_notifications` (boolean) - 通知設定
- `profile_visibility` (text) - プロフィール公開設定
- `account_status` (text) - アカウントステータス（active, suspended, deactivated）

**RLS:**
- ユーザーは自分のデータを読み書き可能
- 管理者は全ユーザーのデータを閲覧・編集可能

#### 2. categories
機器、協力店、お問い合わせの動的カテゴリシステム

**主要カラム:**
- `id` (uuid) - カテゴリID
- `type` (text) - カテゴリタイプ（equipment, partner, contact, vehicle）
- `key` (text) - カテゴリキー
- `label_ja`, `label_en` (text) - 日本語・英語ラベル
- `is_active` (boolean) - アクティブフラグ
- `is_system` (boolean) - システムカテゴリフラグ

**RLS:**
- 全員がアクティブなカテゴリを閲覧可能
- 管理者のみがカテゴリを管理可能

#### 3. vehicles
車両カタログ（販売・レンタル両方）

**主要カラム:**
- `id` (uuid) - 車両ID
- `name` (text) - 車両名
- `type` (text) - 車両タイプ
- `manufacturer` (text) - メーカー
- `year` (integer) - 年式
- `price` (numeric) - 価格
- `purpose` (text) - 用途（sale, rental, both）
- `specs`, `features` (jsonb) - 仕様と機能
- `images` (jsonb) - 画像URL配列
- `status` (text) - ステータス

**RLS:**
- 全員が閲覧可能
- 管理者とスタッフのみが管理可能

#### 4. rental_vehicles
レンタル車両固有のデータと空き状況

**主要カラム:**
- `id` (uuid) - レンタル車両ID
- `vehicle_id` (uuid) - 車両IDへの参照
- `location` (text) - 拠点
- `price_per_day` (numeric) - 1日あたりの料金
- `available_dates`, `unavailable_dates`, `maintenance_dates` (jsonb) - 日付管理
- `status` (text) - ステータス（Available, OnRent, Returned, Maintenance）

**RLS:**
- 全員が閲覧可能
- 管理者とスタッフのみが管理可能

#### 5. equipment
レンタル機器カタログ

**主要カラム:**
- `id` (uuid) - 機器ID
- `name` (text) - 機器名
- `category` (text) - カテゴリ
- `category_id` (uuid) - カテゴリIDへの参照
- `price_per_day` (numeric) - 1日あたりの料金
- `quantity`, `available_quantity` (integer) - 数量管理
- `pricing_type` (text) - 料金タイプ（PerDay, PerUnit）
- `status` (text) - ステータス

**RLS:**
- 全員が閲覧可能
- 管理者とスタッフのみが管理可能

#### 6. partners
協力店情報（RVパーク、レストラン、給油所など）

**主要カラム:**
- `id` (uuid) - 協力店ID
- `name` (text) - 店舗名
- `type` (text) - タイプ
- `category_id` (uuid) - カテゴリIDへの参照
- `address` (text) - 住所
- `latitude`, `longitude` (numeric) - 位置情報
- `contact`, `facilities`, `pricing`, `opening_hours` (jsonb) - 詳細情報
- `rating` (numeric) - 評価
- `review_count` (integer) - レビュー数
- `user_id` (uuid) - 登録ユーザー

**RLS:**
- 全員が閲覧可能
- 管理者のみが管理可能

#### 7. reservations
レンタル予約

**主要カラム:**
- `id` (uuid) - 予約ID
- `user_id` (uuid) - ユーザーID
- `rental_vehicle_id` (uuid) - レンタル車両ID
- `start_date`, `end_date` (date) - レンタル期間
- `days` (integer) - 日数
- `status` (text) - ステータス（Pending, Confirmed, InProgress, Cancelled, Completed）
- `subtotal`, `tax`, `total` (numeric) - 料金
- `options` (jsonb) - オプション情報
- `payment_method`, `payment_status` (text) - 支払い情報

**RLS:**
- ユーザーは自分の予約を閲覧・管理可能
- 管理者とスタッフは全予約を閲覧・管理可能

#### 8. reservation_equipment
予約に含まれる機器

**主要カラム:**
- `id` (uuid) - ID
- `reservation_id` (uuid) - 予約ID
- `equipment_id` (uuid) - 機器ID
- `quantity` (integer) - 数量
- `days` (integer) - 日数
- `price_per_day` (numeric) - 1日あたりの料金
- `subtotal` (numeric) - 小計

**RLS:**
- ユーザーは自分の予約機器を閲覧可能
- 管理者とスタッフは全機器を管理可能

#### 9. reservation_activities
予約に含まれるアクティビティ

**主要カラム:**
- `id` (uuid) - ID
- `reservation_id` (uuid) - 予約ID
- `activity_id` (uuid) - アクティビティID
- `date` (date) - 日付
- `participants` (integer) - 参加者数
- `price` (numeric) - 料金

**RLS:**
- ユーザーは自分の予約アクティビティを閲覧可能
- 管理者とスタッフは全アクティビティを管理可能

#### 10. activities
利用可能なアクティビティカタログ

**主要カラム:**
- `id` (uuid) - アクティビティID
- `name` (text) - 名前
- `description` (text) - 説明
- `price` (numeric) - 料金
- `price_type` (text) - 料金タイプ
- `duration` (text) - 所要時間
- `location` (text) - 場所
- `provider` (text) - 提供者
- `min_participants`, `max_participants` (integer) - 参加者数
- `status` (text) - ステータス

**RLS:**
- 全員が閲覧可能
- 管理者とスタッフのみが管理可能

---

### コミュニティ機能

#### 11. stories
ユーザーの旅行記・体験記

**主要カラム:**
- `id` (uuid) - ストーリーID
- `author_id` (uuid) - 著者ID
- `title` (text) - タイトル
- `content` (text) - 本文
- `excerpt` (text) - 要約
- `cover_image` (text) - カバー画像URL
- `images` (jsonb) - 画像URL配列
- `location` (text) - 場所
- `latitude`, `longitude` (numeric) - 位置情報
- `tags` (jsonb) - タグ配列
- `status` (text) - ステータス（Draft, Published, Archived）
- `likes`, `views` (integer) - いいね数、閲覧数

**RLS:**
- 公開されたストーリーは全員が閲覧可能
- 著者は自分のストーリーを管理可能

#### 12. story_questions
ストーリーへの質問

**RLS:**
- 全員が閲覧可能
- 認証済みユーザーが質問を投稿可能

#### 13. story_answers
ストーリーの質問への回答

**RLS:**
- 全員が閲覧可能
- 認証済みユーザーが回答を投稿可能

#### 14. story_likes
ストーリーのいいね

**RLS:**
- 全員が閲覧可能
- ユーザーは自分のいいねを管理可能

#### 15. story_favorites
ストーリーのブックマーク

**RLS:**
- ユーザーは自分のブックマークのみ閲覧・管理可能

#### 16. vehicle_favorites
車両のブックマーク

**RLS:**
- ユーザーは自分のブックマークのみ閲覧・管理可能

#### 17. partner_favorites
協力店のブックマーク

**RLS:**
- 全員が閲覧可能
- ユーザーは自分のブックマークを管理可能

#### 18. questions
コミュニティQ&Aの質問

**主要カラム:**
- `id` (uuid) - 質問ID
- `title` (text) - タイトル
- `content` (text) - 内容
- `category` (text) - カテゴリ
- `author_id` (uuid) - 著者ID
- `status` (text) - ステータス（Open, Closed）
- `views` (integer) - 閲覧数

**RLS:**
- 全員が閲覧可能
- 認証済みユーザーが質問を投稿可能

#### 19. answers
Q&Aの回答

**主要カラム:**
- `id` (uuid) - 回答ID
- `question_id` (uuid) - 質問ID
- `content` (text) - 内容
- `author_id` (uuid) - 著者ID
- `is_accepted` (boolean) - ベストアンサーフラグ
- `helpful_count` (integer) - 役立った数

**RLS:**
- 全員が閲覧可能
- 認証済みユーザーが回答を投稿可能

#### 20. reviews
車両・協力店・アクティビティのレビュー

**主要カラム:**
- `id` (uuid) - レビューID
- `target_type` (text) - 対象タイプ（Vehicle, RentalVehicle, Partner, Activity）
- `target_id` (uuid) - 対象ID
- `author_id` (uuid) - 著者ID
- `reservation_id` (uuid) - 予約ID（レンタルレビューの場合）
- `rating` (integer) - 評価（1-5）
- `title` (text) - タイトル
- `content` (text) - 内容
- `pros`, `cons` (jsonb) - 良い点・悪い点
- `images` (jsonb) - 画像URL配列
- `is_published` (boolean) - 公開フラグ

**RLS:**
- 公開されたレビューは全員が閲覧可能
- 著者は自分のレビューを管理可能
- 協力店オーナーは自店舗のレビューを閲覧可能

#### 21. review_helpfuls
レビューの役立った投票

**RLS:**
- 全員が閲覧可能
- ユーザーは自分の投票を管理可能

---

### イベントとコミュニケーション

#### 22. events
コミュニティイベント

**主要カラム:**
- `id` (uuid) - イベントID
- `title` (text) - タイトル
- `description` (text) - 説明
- `event_date`, `end_date` (timestamptz) - 開催日時
- `location` (text) - 場所
- `location_type` (text) - 場所タイプ（Online, Offline）
- `max_participants` (integer) - 最大参加者数
- `organizer_id` (uuid) - 主催者ID

**RLS:**
- 全員が閲覧可能
- 主催者と管理者が管理可能

#### 23. event_participants
イベント参加登録

**RLS:**
- 全員が閲覧可能
- ユーザーは自分の参加を管理可能

#### 24. announcements
システムお知らせ

**主要カラム:**
- `id` (uuid) - お知らせID
- `title` (text) - タイトル
- `content` (text) - 内容
- `category` (text) - カテゴリ
- `priority` (text) - 優先度
- `author_id` (uuid) - 著者ID
- `published` (boolean) - 公開フラグ

**RLS:**
- 公開されたお知らせは全員が閲覧可能
- 管理者とスタッフのみが管理可能

#### 25. notifications
ユーザー通知

**主要カラム:**
- `id` (uuid) - 通知ID
- `user_id` (uuid) - ユーザーID
- `type` (text) - 通知タイプ
- `message` (text) - メッセージ
- `read_at` (timestamptz) - 既読日時
- `story_id`, `question_id`, `answer_id` (uuid) - 関連オブジェクトID

**RLS:**
- ユーザーは自分の通知のみ閲覧・更新可能

---

### ルート計画

#### 26. routes
保存された旅行ルート

**主要カラム:**
- `id` (uuid) - ルートID
- `user_id` (uuid) - ユーザーID
- `name` (text) - ルート名
- `origin`, `destination` (text) - 出発地・目的地
- `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` (numeric) - 位置情報
- `description` (text) - 説明
- `is_public` (boolean) - 公開フラグ

**RLS:**
- 公開ルートは全員が閲覧可能
- ユーザーは自分のルートを管理可能

#### 27. route_stops
ルート上の経由地

**主要カラム:**
- `id` (uuid) - 経由地ID
- `route_id` (uuid) - ルートID
- `partner_id` (uuid) - 協力店ID（該当する場合）
- `stop_order` (integer) - 順序
- `name`, `address` (text) - 名前・住所
- `latitude`, `longitude` (numeric) - 位置情報
- `notes` (text) - メモ

**RLS:**
- 公開ルートの経由地は全員が閲覧可能
- ユーザーは自分のルートの経由地を管理可能

---

### スタッフ管理

#### 28. rental_checklists
レンタルチェックリスト（貸出前・引渡・返却）

**主要カラム:**
- `id` (uuid) - チェックリストID
- `reservation_id` (uuid) - 予約ID
- `checklist_type` (text) - タイプ（pre_rental, handover, return）
- `checklist_data` (jsonb) - チェックリストデータ
- `completed_by` (uuid) - 完了者ID
- `completed_at` (timestamptz) - 完了日時
- `notes` (text) - メモ

**RLS:**
- スタッフのみが管理可能
- ユーザーは自分の予約のチェックリストを閲覧可能

#### 29. equipment_preparations
機器準備トラッキング

**主要カラム:**
- `id` (uuid) - ID
- `reservation_id` (uuid) - 予約ID
- `equipment_id` (text) - 機器ID
- `equipment_name` (text) - 機器名
- `quantity` (integer) - 数量
- `prepared` (boolean) - 準備完了フラグ
- `prepared_at` (timestamptz) - 準備完了日時
- `prepared_by` (uuid) - 準備者ID

**RLS:**
- スタッフのみが管理可能
- ユーザーは自分の予約の機器準備状況を閲覧可能

---

### システム管理

#### 30. contacts
お問い合わせフォーム送信

**主要カラム:**
- `id` (uuid) - お問い合わせID
- `user_id` (uuid) - ユーザーID（ログイン済みの場合）
- `name`, `email`, `phone_number` (text) - 連絡先情報
- `subject`, `message` (text) - 件名・メッセージ
- `category` (text) - カテゴリ
- `category_id` (uuid) - カテゴリIDへの参照
- `status` (text) - ステータス（pending, reviewing, resolved, closed）
- `priority` (text) - 優先度（low, normal, high, urgent）
- `admin_notes` (text) - 管理者メモ
- `assigned_to` (uuid) - 担当者ID

**RLS:**
- 誰でも作成可能
- ユーザーは自分のお問い合わせを閲覧可能
- 管理者とスタッフは全お問い合わせを管理可能

#### 31. admin_logs
管理者アクションログ

**主要カラム:**
- `id` (uuid) - ログID
- `admin_id` (uuid) - 管理者ID
- `action` (text) - アクション
- `target_table`, `target_id` (text/uuid) - 対象テーブルとID
- `details` (jsonb) - 詳細情報

**RLS:**
- 管理者のみが閲覧・作成可能

#### 32. system_settings
システム全体の設定

**主要カラム:**
- `id` (uuid) - 設定ID
- `key` (text) - 設定キー
- `value` (text) - 設定値
- `description` (text) - 説明
- `updated_by` (uuid) - 更新者ID
- `rank_settings` (jsonb) - ランクシステム設定

**デフォルト設定:**
- `rental_enabled` - レンタル機能の有効/無効
- `partner_registration_enabled` - 協力店登録機能の有効/無効
- `user_registration_enabled` - ユーザー登録機能の有効/無効

**ランク設定 (rank_settings):**
```json
{
  "ranks": {
    "Bronze": {
      "name": "Bronze",
      "min_amount": 0,
      "min_likes": 0,
      "min_posts": 0,
      "discount_rate": 0
    },
    "Silver": {
      "name": "Silver",
      "min_amount": 50000,
      "min_likes": 10,
      "min_posts": 3,
      "discount_rate": 5
    },
    "Gold": {
      "name": "Gold",
      "min_amount": 200000,
      "min_likes": 30,
      "min_posts": 10,
      "discount_rate": 10
    },
    "Platinum": {
      "name": "Platinum",
      "min_amount": 500000,
      "min_likes": 100,
      "min_posts": 30,
      "discount_rate": 15
    }
  }
}
```

**RLS:**
- 全員が閲覧可能
- 管理者のみが更新可能

---

## 重要な関数

### 1. check_user_role(allowed_roles text[])
ユーザーの役割をチェックする関数。RLSポリシーで使用され、無限再帰を防ぐためにSECURITY DEFINERで実行されます。

### 2. handle_new_user()
Supabase Authで新規ユーザーが作成された際、自動的にpublic.usersテーブルにレコードを作成するトリガー関数。

### 3. increment_story_views(story_id uuid)
ストーリーの閲覧数をインクリメントする関数。

### 4. increment_question_views(question_id uuid)
質問の閲覧数をインクリメントする関数。

### 5. suspend_account(reason text)
ユーザーが自分のアカウントを一時停止する関数。

### 6. reactivate_account()
停止されたアカウントを再アクティブ化する関数。

### 7. sync_equipment_preparations()
予約作成時に機器準備レコードを自動作成するトリガー関数。

### 8. sync_equipment_category(), sync_partners_category(), sync_contacts_category()
カテゴリの自動同期トリガー関数。

### 9. update_*_updated_at()
各テーブルのupdated_atカラムを自動更新するトリガー関数。

---

## ランクシステム関数

### 10. calculate_total_spent(user_uuid uuid)
ユーザーの累計利用金額を計算する関数。完了ステータス（Completed）の予約のみが対象。

**戻り値**: NUMERIC - 累計金額

### 11. calculate_total_likes(user_uuid uuid)
ユーザーが投稿した体験記の合計いいね数を計算する関数。

**戻り値**: INTEGER - いいね獲得数

### 12. calculate_total_posts(user_uuid uuid)
ユーザーが公開した体験記の数を計算する関数。公開ステータス（Published）の投稿のみが対象。

**戻り値**: INTEGER - 投稿数

### 13. determine_user_rank(user_uuid uuid)
ユーザーの現在の実績に基づいてランクを判定する関数。

**ロジック**:
1. 累計利用金額、いいね獲得数、投稿数を取得
2. system_settingsからrank_settingsを取得
3. 上位ランクから順にチェック（Platinum → Gold → Silver → Bronze）
4. 各ランクの条件はOR条件（いずれか1つ満たせば昇格）

**戻り値**: TEXT - ランク名（Bronze, Silver, Gold, Platinum）

### 14. update_user_rank(user_uuid uuid)
ユーザーのランクを再計算して更新する関数。`determine_user_rank()`を呼び出し、ランクが変更された場合のみusersテーブルを更新。

### 15. get_rank_discount_rate(user_rank text)
指定されたランクの割引率を取得する関数。

**戻り値**: NUMERIC - 割引率（パーセント）

---

## ランクシステムトリガー

### trigger_update_rank_on_reservation()
予約が完了ステータス（Completed）に変更された際に自動的にユーザーのランクを更新するトリガー関数。

**トリガー**: reservationsテーブルのINSERTまたはUPDATE後

### trigger_update_rank_on_story()
体験記が公開ステータス（Published）に変更された際に自動的にユーザーのランクを更新するトリガー関数。

**トリガー**: storiesテーブルのINSERTまたはUPDATE後

### trigger_update_rank_on_like()
体験記にいいねが追加された際、その体験記の著者のランクを自動更新するトリガー関数。

**トリガー**: story_likesテーブルのINSERT後

---

## インデックス戦略

パフォーマンス最適化のため、以下の箇所にインデックスが設定されています：

- **外部キー**: すべての外部キー関係にインデックス
- **検索フィールド**: status, category, type などの頻繁に検索されるフィールド
- **日付フィールド**: created_at, start_date, end_date など
- **位置情報**: latitude, longitude の複合インデックス
- **ユニーク制約**: email, key, 複合ユニークキー

合計100以上のインデックスが設定され、クエリパフォーマンスが最適化されています。

---

## セキュリティポリシー

### 基本原則

1. **デフォルトで拒否**: RLS有効化後、明示的にポリシーで許可されない限りアクセス不可
2. **最小権限の原則**: 必要最小限のアクセス権限のみ付与
3. **役割ベースアクセス制御**: Admin, Staff, Partners, Members の4つの役割
4. **所有権チェック**: ユーザーは自分のデータのみアクセス可能

### 役割の説明

- **Admin**: すべてのデータにアクセス可能、システム設定の変更可能
- **Staff**: 予約管理、機器管理、顧客サポート業務に必要なアクセス権限
- **Partners**: 自分の協力店情報の管理、自店舗のレビュー閲覧
- **Members**: 一般ユーザー、自分のデータと公開データにアクセス可能

---

## サンプルデータ

開発・デモ用に以下のサンプルデータが含まれています：

- **車両**: 3台（キャンパー デラックス、コンパクト キャンパー、ラグジュアリー RV）
- **レンタル車両**: 2台
- **機器**: 20種類（テント、寝袋、調理器具、照明、家具など）
- **協力店**: 5店舗（道の駅、温泉、カフェ、給油所、展望台）
- **アクティビティ**: 10種類（トレッキング、カヤック、釣り、温泉巡りなど）
- **カテゴリ**: 17カテゴリ（機器6、協力店5、お問い合わせ6）

---

## メンテナンスガイド

### 新しいテーブルを追加する場合

1. テーブル定義を作成
2. 必要なインデックスを追加
3. RLSを有効化: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
4. 適切なRLSポリシーを作成
5. 外部キー制約を設定
6. 必要に応じてトリガーを設定

### カラムを追加する場合

1. `ALTER TABLE` で既存のテーブルにカラムを追加
2. デフォルト値を設定
3. 必要に応じてインデックスを追加
4. RLSポリシーを更新（必要な場合）

### パフォーマンスチューニング

1. `EXPLAIN ANALYZE` でクエリプランを確認
2. 頻繁に使用されるクエリにインデックスを追加
3. 複雑なクエリはマテリアライズドビューの使用を検討
4. 定期的に `VACUUM ANALYZE` を実行

---

## 今後の拡張可能性

このスキーマは以下の機能追加に対応可能です：

- **メッセージング機能**: ユーザー間のダイレクトメッセージ
- **予約カレンダー**: 空き状況の視覚化
- **支払いゲートウェイ統合**: Stripe統合
- **ポイントシステム**: 会員ランクに基づくポイント付与
- **レコメンデーション**: 機械学習による推薦システム
- **多言語対応**: 翻訳テーブルの追加

---

## 関連ドキュメント

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**最終更新日**: 2026-02-07
