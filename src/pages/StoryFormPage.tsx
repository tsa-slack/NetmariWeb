import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import ImageUpload from '../components/ImageUpload';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Story = Database['public']['Tables']['stories']['Row'];

export default function StoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    location: '',
    tags: '',
    status: 'Draft' as 'Draft' | 'Published',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      loadStory();
    }
  }, [id, user]);

  const loadStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        navigate('/portal/stories');
        return;
      }

      if (data.author_id !== user?.id) {
        alert('この投稿を編集する権限がありません');
        navigate('/portal/stories');
        return;
      }

      setFormData({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || '',
        cover_image: data.cover_image || '',
        location: data.location || '',
        tags: Array.isArray(data.tags) ? (data.tags as string[]).join(', ') : '',
        status: data.status as 'Draft' | 'Published',
      });

      // Load existing images
      if (data.images && Array.isArray(data.images)) {
        setUploadedImages(data.images as string[]);
      }
    } catch (error) {
      console.error('Error loading story:', error);
      alert('投稿の読み込みに失敗しました');
      navigate('/portal/stories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...imageUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/images/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from('images').remove([filePath]);
      }
      setUploadedImages(uploadedImages.filter((url) => url !== imageUrl));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('画像の削除に失敗しました');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと本文は必須です');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const storyData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        location: formData.location.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        status: formData.status,
        published_at: formData.status === 'Published' ? new Date().toISOString() : null,
      };

      if (id) {
        const { error } = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', id);

        if (error) throw error;
        navigate(`/portal/stories/${id}`);
      } else {
        const { data, error } = await supabase
          .from('stories')
          .insert({
            ...storyData,
            author_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        navigate(`/portal/stories/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('投稿の保存に失敗しました');
    } finally {
      setSubmitting(false);
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

  return (
    <Layout>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        title={id ? '投稿を更新しますか？' : '投稿を作成しますか？'}
        message={
          formData.status === 'Published'
            ? 'この内容で公開します。よろしいですか？'
            : 'この内容で下書きとして保存します。よろしいですか？'
        }
        confirmText={id ? '更新する' : '投稿する'}
        cancelText="キャンセル"
        type="info"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {id ? '投稿を編集' : '新規投稿'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="体験記のタイトルを入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                抜粋
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="投稿の簡単な説明（一覧ページに表示されます）"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="体験記の内容を入力"
                rows={15}
                required
              />
            </div>

            <ImageUpload
              value={formData.cover_image}
              onChange={(url) => setFormData({ ...formData, cover_image: url })}
              bucket="images"
              folder={user?.id}
              label="カバー画像"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像をアップロード
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <Upload className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'アップロード中...' : '画像を選択'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500">複数選択可能</p>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imageUrl)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="flex items-center justify-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        アップロードした画像がここに表示されます
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                場所
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="訪問した場所"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タグ
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="キャンプ, 温泉, 北海道（カンマ区切り）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'Draft' | 'Published' })
                }
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Draft">下書き</option>
                <option value="Published">公開</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {submitting ? '保存中...' : id ? '更新する' : '投稿する'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <X className="h-5 w-5 inline mr-2" />
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
