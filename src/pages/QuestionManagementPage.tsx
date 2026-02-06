import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  MessageCircle,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  Filter,
  Search,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  author: {
    full_name: string;
    email: string;
  };
  answer_count: number;
}

export default function QuestionManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Open' | 'Resolved' | 'Closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadQuestions();
    }
  }, [user, isAdmin, isStaff, filter]);

  const loadQuestions = async () => {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          author:users!questions_author_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: questionsData, error: questionsError } = await query;

      if (questionsError) throw questionsError;

      const { data: answerCounts, error: answersError } = await supabase
        .from('answers')
        .select('question_id');

      if (answersError) throw answersError;

      const answerCountMap: Record<string, number> = {};
      answerCounts?.forEach((answer) => {
        answerCountMap[answer.question_id] = (answerCountMap[answer.question_id] || 0) + 1;
      });

      const questionsWithCounts = (questionsData || []).map((q) => ({
        ...q,
        answer_count: answerCountMap[q.id] || 0,
      }));

      setQuestions(questionsWithCounts);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const updateStatus = async (questionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: newStatus })
        .eq('id', questionId);

      if (error) throw error;
      loadQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      alert('ステータスの変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', selectedQuestion.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('質問の削除に失敗しました');
    }
  };

  const filteredQuestions = questions.filter((question) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      question.title.toLowerCase().includes(searchLower) ||
      question.content.toLowerCase().includes(searchLower) ||
      question.author.full_name.toLowerCase().includes(searchLower) ||
      question.category?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Open':
        return '未解決';
      case 'Resolved':
        return '解決済み';
      case 'Closed':
        return 'クローズ';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    if (!category) return '未分類';
    switch (category) {
      case 'General':
        return '一般';
      case 'Technical':
        return '技術的';
      case 'Rental':
        return 'レンタル';
      case 'Vehicle':
        return '車両';
      case 'Route':
        return 'ルート';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <MessageCircle className="h-10 w-10 mr-3 text-blue-600" />
            質問管理
          </h1>
          <p className="text-gray-600">コミュニティ質問の確認と対応</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                フィルター
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="Open">未解決</option>
                <option value="Resolved">解決済み</option>
                <option value="Closed">クローズ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="タイトル、内容、投稿者で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingQuestions ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              質問がありません
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? '検索条件に一致する質問が見つかりません'
                : 'まだ質問が投稿されていません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredQuestions.length}件の質問
            </div>

            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition ${
                  question.status === 'Open' ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          question.status
                        )}`}
                      >
                        {getStatusLabel(question.status)}
                      </span>
                      {question.category && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {getCategoryLabel(question.category)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {question.title}
                    </h3>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {question.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {question.author.full_name}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {question.views}回閲覧
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {question.answer_count}件の回答
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(question.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    to={`/questions/${question.id}`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    詳細を見る
                  </Link>

                  {question.status === 'Open' && (
                    <button
                      onClick={() => updateStatus(question.id, 'Resolved')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      解決済みにする
                    </button>
                  )}

                  {question.status === 'Resolved' && (
                    <>
                      <button
                        onClick={() => updateStatus(question.id, 'Open')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center text-sm"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        未解決に戻す
                      </button>
                      <button
                        onClick={() => updateStatus(question.id, 'Closed')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center text-sm"
                      >
                        クローズ
                      </button>
                    </>
                  )}

                  {question.status === 'Closed' && (
                    <button
                      onClick={() => updateStatus(question.id, 'Open')}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center text-sm"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      再オープン
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedQuestion(question);
                        setDeleteModalOpen(true);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedQuestion(null);
        }}
        onConfirm={handleDelete}
        title="質問を削除"
        message={`「${selectedQuestion?.title}」を削除してもよろしいですか？この操作は取り消せません。`}
      />
    </AdminLayout>
  );
}
