import { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { MessageCircle, Eye, Edit, Trash2, CheckCircle, ThumbsUp } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { QuestionRepository, AnswerRepository, useQuery, useRepository } from '../lib/data-access';
import { toast } from 'sonner';
import { logger } from '../lib/logger';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

type Question = Database['public']['Tables']['questions']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

type Answer = Database['public']['Tables']['answers']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isStaff } = useAuth();
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isAdminOrStaff = isAdmin || isStaff;

  // リポジトリインスタンスを作成
  const questionRepo = useRepository(QuestionRepository);
  const answerRepo = useRepository(AnswerRepository);

  // 質問を取得
  const { data: question, loading: questionLoading, error, refetch: refetchQuestion } = useQuery<Question | null>(
    async () => questionRepo.findByIdWithAuthor(id!),
    { enabled: !!id }
  );

  // 回答を取得
  const { data: answers, refetch: refetchAnswers } = useQuery<Answer[]>(
    async () => answerRepo.findByQuestionWithAuthor(id!),
    { enabled: !!id }
  );

  // ローディング状態（初回取得完了前はtrue）
  const loading = questionLoading || (!question && !error);

  // ビュー数増加（初回のみ実行）
  useEffect(() => {
    const incrementViews = async () => {
      if (!id) return;
      try {
        const { data: current } = await supabase
          .from('questions')
          .select('views')
          .eq('id', id)
          .single();

        const newViews = (current?.views || 0) + 1;

        await supabase
          .from('questions')
          .update({ views: newViews })
          .eq('id', id);
      } catch (error) {
        logger.error('Error incrementing views:', error);
      }
    };

    if (id && user) {
      incrementViews();
    }
  }, [id, user]);


  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answerContent.trim()) {
      toast.warning('回答を入力してください');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await (supabase
        .from('answers'))
        .insert({
          question_id: id,
          content: answerContent.trim(),
          author_id: user!.id,
        });

      if (error) throw error;

      setAnswerContent('');
      refetchAnswers(); // useQueryのrefetchを使用
      toast.success('回答を投稿しました');
    } catch (error) {
      handleError(error, '回答の投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await (supabase
        .from('questions'))
        .update({ status: newStatus })
        .eq('id', id!);

      if (error) throw error;

      refetchQuestion();
      const statusLabels: Record<string, string> = { 'Resolved': '解決済み', 'Open': '未解決', 'Closed': 'クローズ' };
      toast.success(`質問を${statusLabels[newStatus] || newStatus}にしました`);
    } catch (error) {
      handleError(error, '更新に失敗しました');
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await (supabase
        .from('answers'))
        .update({ is_accepted: false })
        .eq('question_id', id!);

      const { error } = await (supabase
        .from('answers'))
        .update({ is_accepted: true })
        .eq('id', answerId!);

      if (error) throw error;

      refetchAnswers(); // useQueryのrefetchを使用
      handleUpdateStatus('Resolved');
    } catch (error) {
      handleError(error, 'ベストアンサーの設定に失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id!);

      if (error) throw error;

      toast.success('質問を削除しました');
      navigate(isAdminOrStaff ? '/admin/questions' : '/portal/questions');
    } catch (error) {
      handleError(error, '質問の削除に失敗しました');
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <Link
              to="/portal/questions"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-block"
            >
              Q&A一覧に戻る
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!question) {
    return <Navigate to="/portal/questions" replace />;
  }

  const isAuthor = user && question.author_id === user.id;
  const canManage = isAuthor || isAdminOrStaff;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/portal/questions" className="text-blue-600 hover:text-blue-700">
            ← Q&A一覧に戻る
          </Link>
          {isAdminOrStaff && (
            <Link to="/admin/questions" className="text-gray-500 hover:text-gray-700 text-sm">
              ← 質問管理に戻る
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
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
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                    {question.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">{question.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                <span>
                  投稿者: {question.author?.first_name} {question.author?.last_name}
                </span>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {question.views}回閲覧
                </div>
                <span>{question.created_at ? new Date(question.created_at).toLocaleDateString('ja-JP') : ''}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canManage && (
                <>
                  {question.status === 'Open' && (
                    <button
                      onClick={() => handleUpdateStatus('Resolved')}
                      className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      title="解決済みにする"
                    >
                      <CheckCircle className="h-6 w-6" />
                    </button>
                  )}
                  {question.status === 'Resolved' && isAdminOrStaff && (
                    <button
                      onClick={() => handleUpdateStatus('Open')}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      title="未解決に戻す"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </button>
                  )}
                  {isAuthor && (
                    <Link
                      to={`/portal/questions/${question.id}/edit`}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit className="h-6 w-6" />
                    </Link>
                  )}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {question.content}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <MessageCircle className="h-6 w-6 mr-2" />
            回答 ({answers?.length || 0}件)
          </h2>

          {(answers?.length || 0) === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
              まだ回答がありません。最初の回答を投稿しましょう！
            </div>
          ) : (
            <div className="space-y-4">
              {(answers || []).map((answer) => (
                <div
                  key={answer.id}
                  className={`bg-white rounded-xl shadow-lg p-6 ${
                    answer.is_accepted ? 'border-2 border-green-500' : ''
                  }`}
                >
                  {answer.is_accepted && (
                    <div className="flex items-center text-green-600 font-semibold mb-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      ベストアンサー
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                        {answer.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {answer.author?.first_name} {answer.author?.last_name}
                        </span>
                        <span>
                          {answer.created_at ? new Date(answer.created_at).toLocaleDateString('ja-JP') : ''}
                        </span>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {answer.helpful_count}
                        </div>
                      </div>
                    </div>
                    {canManage && !answer.is_accepted && question.status === 'Open' && (
                      <button
                        onClick={() => handleAcceptAnswer(answer.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        ベストアンサーにする
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (question.status === 'Open' || isAdminOrStaff) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isAdminOrStaff && question.status !== 'Open' ? '管理者として回答を投稿' : '回答を投稿'}
            </h2>
            {isAdminOrStaff && question.status !== 'Open' && (
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                この質問は{question.status === 'Resolved' ? '解決済み' : 'クローズ'}ですが、管理者として回答できます。
              </p>
            )}
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="回答を入力してください"
                rows={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '投稿中...' : '回答を投稿'}
              </button>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="質問を削除"
        message="本当にこの質問を削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Layout>
  );
}
