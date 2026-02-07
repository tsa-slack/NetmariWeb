import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Eye, MapPin, Calendar, User, Send, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  StoryRepository,
  StoryQuestionRepository,
  StoryLikeRepository,
  useQuery,
  useRepository,
} from '../lib/data-access';
import { logger } from '../lib/logger';


export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // リポジトリインスタンスを作成
  const storyRepo = useRepository(StoryRepository);
  const questionRepo = new StoryQuestionRepository();
  const likeRepo = new StoryLikeRepository();

  // ストーリー詳細を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: storyData, loading } = useQuery<any>(
    async () => storyRepo.findByIdWithAuthor(id!),
    { enabled: !!id }
  );

  const story = storyData || null;
  const author = storyData?.users as { first_name: string; last_name: string } | null;

  // 質問一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions, refetch: refetchQuestions } = useQuery<any[]>(
    async () => questionRepo.findByStoryWithAnswers(id!),
    { enabled: !!id }
  );

  // いいね状況を確認
  const { data: likedData } = useQuery<boolean>(
    async () => likeRepo.checkLiked(id!, user!.id),
    { enabled: !!(id && user) }
  );

  useEffect(() => {
    if (likedData !== null && likedData !== undefined) {
      setLiked(likedData);
    }
  }, [likedData]);

  useEffect(() => {
    if (id) {
      incrementViews();
    }
  }, [id]);

  const incrementViews = async () => {
    if (!id) return;

    const viewedKey = `story_viewed_${id}`;
    const lastViewed = localStorage.getItem(viewedKey);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastViewed && now - parseInt(lastViewed) < oneHour) {
      return;
    }

    try {
      await supabase.rpc('increment_story_views' as never, { story_id: id } as Record<string, unknown>);
      localStorage.setItem(viewedKey, now.toString());
    } catch (error) {
      logger.error('Error incrementing views:', error);
    }
  };

  const toggleLike = async () => {
    if (!user || !story) return;

    try {
      if (liked) {
        await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', story.id!)
          .eq('user_id', user.id);

        setLiked(false);
      } else {
        await (supabase

          .from('story_likes'))

          .insert({ story_id: story.id, user_id: user.id });

        setLiked(true);
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase

        .from('story_questions'))

        .insert({
          story_id: id!,
          user_id: user.id,
          content: newQuestion.trim(),
        });

      if (error) throw error;
      setNewQuestion('');
      refetchQuestions();
    } catch (error) {
      logger.error('Error submitting question:', error);
      toast.error('質問の投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    if (!user || !newAnswer[questionId]?.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase

        .from('story_answers'))

        .insert({
          question_id: questionId,
          user_id: user.id,
          content: newAnswer[questionId].trim(),
        });

      if (error) throw error;
      setNewAnswer({ ...newAnswer, [questionId]: '' });
      refetchQuestions();
    } catch (error) {
      logger.error('Error submitting answer:', error);
      toast.error('回答の投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id!);

      if (error) throw error;
      navigate('/portal/stories');
    } catch (error) {
      logger.error('Error deleting story:', error);
      toast.error('投稿の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!story) {
    return null;
  }

  const isAuthor = user?.id === story.author_id;

  return (
    <Layout>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="投稿を削除"
        message="本当にこの投稿を削除しますか？この操作は取り消せません。"
        confirmText="削除する"
        cancelText="キャンセル"
        type="danger"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {story.cover_image && (
            <img
              src={story.cover_image}
              alt={story.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl font-bold text-gray-800 flex-1">
                {story.title}
              </h1>
              {isAuthor && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/portal/stories/${id}/edit`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="編集"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="削除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div className="flex items-center space-x-6 text-gray-600">
                {author && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span>{author.last_name} {author.first_name}</span>
                  </div>
                )}
                {story.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{story.location}</span>
                  </div>
                )}
                {story.published_at && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{new Date(story.published_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleLike}
                  disabled={!user}
                  className={`flex items-center px-4 py-2 rounded-lg transition ${
                    liked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${!user && 'opacity-50 cursor-not-allowed'}`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${liked && 'fill-current'}`} />
                  <span>{story.likes}</span>
                </button>
                <div className="flex items-center text-gray-600">
                  <Eye className="h-5 w-5 mr-2" />
                  <span>{story.views}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {story.content}
              </div>
            </div>

            {story.images && Array.isArray(story.images) && (story.images as string[]).length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">画像</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(story.images as string[]).map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`${story.title} - 画像 ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {story.tags && Array.isArray(story.tags) && (story.tags as string[]).length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex flex-wrap gap-2">
                  {(story.tags as string[]).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <MessageCircle className="h-6 w-6 mr-2" />
            質問・コメント
          </h2>

          {user ? (
            <form onSubmit={submitQuestion} className="mb-8">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="質問やコメントを投稿..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newQuestion.trim() || submitting}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  投稿する
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">
                質問やコメントを投稿するには
                <a href="/login" className="text-blue-600 hover:underline ml-1">
                  ログイン
                </a>
                してください
              </p>
            </div>
          )}

          <div className="space-y-6">
            {!questions || questions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                まだ質問やコメントはありません
              </p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              questions.map((question: any) => (
                <div key={question.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {question.user?.last_name} {question.user?.first_name}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(question.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{question.content}</p>

                  {question.answers && question.answers.length > 0 && (
                    <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-6">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {question.answers.map((answer: any) => (
                        <div key={answer.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">
                              {answer.user?.last_name} {answer.user?.first_name}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              {new Date(answer.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-gray-700">{answer.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {user && (
                    <div className="mt-4 ml-8">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAnswer[question.id] || ''}
                          onChange={(e) =>
                            setNewAnswer({ ...newAnswer, [question.id]: e.target.value })
                          }
                          placeholder="回答を入力..."
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => submitAnswer(question.id)}
                          disabled={!newAnswer[question.id]?.trim() || submitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
