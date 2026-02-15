-- route_stops テーブルに INSERT/UPDATE/DELETE の RLS ポリシーを追加
-- 自分のルートの経由地を管理できるようにする

CREATE POLICY "Users manage own route stops" ON route_stops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  );
