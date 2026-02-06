import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';

export default function QuestionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (id && user) {
      loadQuestion();
    }
  }, [id, user]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .eq('author_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category || '');
      }
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      const questionData = {
        title: title.trim(),
        content: content.trim(),
        category: category || null,
        author_id: user!.id,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', id);

        if (error) throw error;

        alert('質問を更新しました');
        navigate(`/portal/questions/${id}`);
      } else {
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select()
          .single();

        if (error) throw error;

        alert('質問を投稿しました');
        navigate(`/portal/questions/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('質問の保存に失敗しました');
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

  const categories = ['レンタル', '車両', 'ルート', '協力店', 'その他'];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/portal/questions" className="text-blue-600 hover:text-blue-700">
            ← Q&A一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {id ? '質問を編集' : '質問を投稿'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：初めてのキャンピングカーレンタルで注意すべきことは？"
                required
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">{title.length}/200文字</p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                質問内容 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="質問の詳細を入力してください&#10;&#10;例：&#10;- 現在の状況&#10;- 困っていること&#10;- 試したこと"
                rows={12}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">{content.length}文字</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">質問のコツ</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>具体的で明確なタイトルをつける</li>
                <li>問題の詳細を丁寧に説明する</li>
                <li>すでに試したことがあれば記載する</li>
                <li>画像や例があれば説明に含める</li>
              </ul>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : id ? '更新する' : '投稿する'}
              </button>
              <Link
                to="/portal/questions"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title={id ? '質問を更新しますか？' : '質問を投稿しますか？'}
        message="この内容でよろしいですか？"
      />
    </Layout>
  );
}
