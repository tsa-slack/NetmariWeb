# useQuery 移行ガイド

## 移行パターン

### パターン1: 基本的なuseEffect → useQuery

**移行前:**
```typescript
const [data, setData] = useState<Event[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('events').select('*');
      if (error) throw error;
      setData(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**移行後:**
```typescript
const { data, loading } = useQuery<Event[]>(
  async () => {
    const { data, error } = await supabase
      .from('events').select('*');
    if (error) throw error;
    return { success: true, data: data || [] };
  }
);
```

### パターン2: 条件付きフェッチ

**移行前:**
```typescript
useEffect(() => {
  if (!user) { navigate('/login'); return; }
  loadData();
}, [user]);
```

**移行後:**
```typescript
// 認証リダイレクトはuseEffectに残す
useEffect(() => {
  if (!loading && !user) navigate('/login');
}, [user, loading]);

// データフェッチはuseQueryに移行
const { data } = useQuery<Data>(
  async () => { /* ... */ },
  { enabled: !!user }  // userがある場合のみ実行
);
```

### パターン3: フォームの初期値読み込み（編集モード）

**移行前:**
```typescript
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (id && user) loadFormData();
}, [id, user]);

const loadFormData = async () => {
  setLoading(true);
  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  if (data) { setTitle(data.title); setDescription(data.description); }
  setLoading(false);
};
```

**移行後:**
```typescript
const { loading } = useQuery<any>(
  async () => {
    const { data, error } = await supabase
      .from('events').select('*').eq('id', id!).single();
    if (error) throw error;
    if (data) { setTitle(data.title); setDescription(data.description); }
    return { success: true, data };
  },
  { enabled: !!(id && user) }
);
```

## チェックリスト

移行時に確認するポイント:

- [ ] `useState`の`loading`/`setLoading`を削除し、`useQuery`の`loading`を使用
- [ ] `useEffect`内の`loadData()`呼び出しを削除
- [ ] クエリ関数が`{ success: true, data }`を返すようにする
- [ ] エラー時は`throw error`でuseQueryに処理を任せる
- [ ] `enabled`オプションで条件付き実行を制御
- [ ] 認証リダイレクトなど副作用は`useEffect`に残す
- [ ] TypeScriptコンパイルが通ることを確認
