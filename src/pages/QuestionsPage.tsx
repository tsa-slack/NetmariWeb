import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { MessageCircle, Plus, Eye, CheckCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { QuestionRepository, useQuery, useRepository } from '../lib/data-access';
import LoadingSpinner from '../components/LoadingSpinner';

type Question = Database['public']['Tables']['questions']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
  answer_count?: number;
};

export default function QuestionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // リポジトリインスタンスを作成
  const questionRepo = useRepository(QuestionRepository);

  // すべての質問を取得（著者情報と回答数付き）
  const { data: allQuestions, loading, error, refetch } = useQuery<Question[]>(
    async () => questionRepo.findAllWithAuthorAndAnswerCount(),
    { refetchOnMount: true }
  );

  // クライアント側でフィルタリング
  const questions = useMemo(() => {
    if (!allQuestions) return [];
    
    let filtered = [...allQuestions];

    // ステータスフィルター
    if (filter === 'open') {
      filtered = filtered.filter((q) => q.status === 'Open');
    } else if (filter === 'resolved') {
      filtered = filtered.filter((q) => q.status === 'Resolved');
    }

    // カテゴリフィルター
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((q) => q.category === categoryFilter);
    }

    return filtered;
  }, [allQuestions, filter, categoryFilter]);

  if (authLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              再試行
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const categories = ['レンタル', '車両', 'ルート', '協力店', 'その他'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Q&A</h1>
            <p className="text-gray-600">コミュニティに質問して、知識を共有しよう</p>
          </div>
          {user && (
            <Link
              to="/portal/questions/new"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              質問する
            </Link>
          )}
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 md:px-6 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-6 py-2 rounded-lg transition ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未解決
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-2 rounded-lg transition ${
                filter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              解決済み
            </button>
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全カテゴリ
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  categoryFilter === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (questions?.length || 0) === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">質問がありません</p>
            {user && (
              <Link
                to="/portal/questions/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初の質問を投稿
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(questions || []).map((question) => (
              <Link
                key={question.id}
                to={`/portal/questions/${question.id}`}
                className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {question.status === 'Resolved' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">
                        {question.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {question.answer_count}件の回答
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {question.views}回閲覧
                      </div>
                      <span>
                        {question.author?.first_name} {question.author?.last_name}
                      </span>
                      <span>
                        {question.created_at ? new Date(question.created_at).toLocaleDateString('ja-JP') : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        question.status === 'Open'
                          ? 'bg-blue-100 text-blue-700'
                          : question.status === 'Resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {question.status === 'Open'
                        ? '未解決'
                        : question.status === 'Resolved'
                        ? '解決済み'
                        : 'クローズ'}
                    </span>
                    {question.category && (
                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {question.category}
                      </span>
                    )}
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
