/*
  # ランクシステムの実装

  1. 変更内容
    - system_settings に rank_settings カラムを追加
    - ランク自動更新関数を作成
    - 累計利用金額計算関数を作成
    - 予約完了時の自動ランク更新トリガーを追加

  2. ランク設定
    - Bronze: 初期ランク、割引なし
    - Silver: 累計¥50,000以上 or いいね10以上 or 投稿3以上、5%割引
    - Gold: 累計¥200,000以上 or いいね30以上 or 投稿10以上、10%割引
    - Platinum: 累計¥500,000以上 or いいね100以上 or 投稿30以上、15%割引

  3. セキュリティ
    - 管理者のみがランク設定を変更可能
    - ランク更新は自動実行（ユーザーは変更不可）
*/

-- system_settings に rank_settings を追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'rank_settings'
  ) THEN
    ALTER TABLE system_settings
    ADD COLUMN rank_settings JSONB DEFAULT '{
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
    }'::jsonb;
  END IF;
END $$;

-- 累計利用金額を計算する関数
CREATE OR REPLACE FUNCTION calculate_total_spent(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  SELECT COALESCE(SUM(r.total), 0)
  INTO total_amount
  FROM reservations r
  WHERE r.user_id = user_uuid
    AND r.status = 'Completed';

  RETURN total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- いいね獲得数を計算する関数
CREATE OR REPLACE FUNCTION calculate_total_likes(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_likes_count INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0)
  INTO total_likes_count
  FROM story_likes sl
  JOIN stories s ON sl.story_id = s.id
  WHERE s.author_id = user_uuid;

  RETURN total_likes_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 投稿数を計算する関数
CREATE OR REPLACE FUNCTION calculate_total_posts(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_posts_count INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0)
  INTO total_posts_count
  FROM stories
  WHERE author_id = user_uuid
    AND status = 'Published';

  RETURN total_posts_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ランクを判定する関数
CREATE OR REPLACE FUNCTION determine_user_rank(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  total_spent NUMERIC;
  total_likes INTEGER;
  total_posts INTEGER;
  rank_settings JSONB;
  new_rank TEXT := 'Bronze';
BEGIN
  -- 現在の累計値を取得
  total_spent := calculate_total_spent(user_uuid);
  total_likes := calculate_total_likes(user_uuid);
  total_posts := calculate_total_posts(user_uuid);

  -- ランク設定を取得
  SELECT ss.rank_settings
  INTO rank_settings
  FROM system_settings ss
  LIMIT 1;

  -- ランク判定（上位から順にチェック）
  -- Platinum判定
  IF (rank_settings->'ranks'->'Platinum'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Platinum'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Platinum'->>'min_posts')::INTEGER <= total_posts
  THEN
    new_rank := 'Platinum';
  -- Gold判定
  ELSIF (rank_settings->'ranks'->'Gold'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Gold'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Gold'->>'min_posts')::INTEGER <= total_posts
  THEN
    new_rank := 'Gold';
  -- Silver判定
  ELSIF (rank_settings->'ranks'->'Silver'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Silver'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Silver'->>'min_posts')::INTEGER <= total_posts
  THEN
    new_rank := 'Silver';
  END IF;

  RETURN new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーのランクを更新する関数
CREATE OR REPLACE FUNCTION update_user_rank(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  new_rank TEXT;
BEGIN
  new_rank := determine_user_rank(user_uuid);

  UPDATE users
  SET rank = new_rank,
      updated_at = NOW()
  WHERE id = user_uuid
    AND rank != new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 予約完了時にランクを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_update_rank_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- 予約が完了ステータスに変更された場合
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    PERFORM update_user_rank(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 予約テーブルのトリガー
DROP TRIGGER IF EXISTS on_reservation_completed ON reservations;
CREATE TRIGGER on_reservation_completed
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_rank_on_reservation();

-- ストーリー投稿時にランクを更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_update_rank_on_story()
RETURNS TRIGGER AS $$
BEGIN
  -- ストーリーが公開された場合
  IF NEW.status = 'Published' AND (OLD.status IS NULL OR OLD.status != 'Published') THEN
    PERFORM update_user_rank(NEW.author_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ストーリーテーブルのトリガー
DROP TRIGGER IF EXISTS on_story_published ON stories;
CREATE TRIGGER on_story_published
  AFTER INSERT OR UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_rank_on_story();

-- いいね追加時にランクを更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_update_rank_on_like()
RETURNS TRIGGER AS $$
DECLARE
  story_author UUID;
BEGIN
  -- いいねされたストーリーの著者を取得
  SELECT author_id INTO story_author
  FROM stories
  WHERE id = NEW.story_id;

  -- 著者のランクを更新
  IF story_author IS NOT NULL THEN
    PERFORM update_user_rank(story_author);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- いいねテーブルのトリガー
DROP TRIGGER IF EXISTS on_story_liked ON story_likes;
CREATE TRIGGER on_story_liked
  AFTER INSERT ON story_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_rank_on_like();

-- 割引率を取得する関数
CREATE OR REPLACE FUNCTION get_rank_discount_rate(user_rank TEXT)
RETURNS NUMERIC AS $$
DECLARE
  rank_settings JSONB;
  discount_rate NUMERIC;
BEGIN
  -- ランク設定を取得
  SELECT ss.rank_settings
  INTO rank_settings
  FROM system_settings ss
  LIMIT 1;

  -- 割引率を取得
  discount_rate := (rank_settings->'ranks'->user_rank->>'discount_rate')::NUMERIC;

  RETURN COALESCE(discount_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のシステム設定レコードにrank_settingsを追加（存在する場合）
UPDATE system_settings
SET rank_settings = '{
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
}'::jsonb
WHERE rank_settings IS NULL;

-- 全ユーザーのランクを初期化（既存データ用）
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users
  LOOP
    PERFORM update_user_rank(user_record.id);
  END LOOP;
END $$;
