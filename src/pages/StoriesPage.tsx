import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Heart, Eye, Plus, MapPin, Calendar } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Story = Database['public']['Tables']['stories']['Row'] & {
  users?: { first_name: string; last_name: string };
};

export default function StoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          users!stories_author_id_fkey (first_name, last_name)
        `)
        .eq('status', 'Published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setStories(data as any || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">体験記・コミュニティ</h1>
            <p className="text-xl text-gray-600">
              車中泊愛好家の実体験を共有し、情報交換しましょう
            </p>
          </div>
          {user && (
            <Link
              to="/portal/stories/new"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              新規投稿
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">まだ体験記はありません</p>
            {user && (
              <Link
                to="/portal/stories/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初の投稿を作成
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Link
                key={story.id}
                to={`/portal/stories/${story.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                {story.cover_image ? (
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${story.cover_image})` }}
                  />
                ) : story.images && Array.isArray(story.images) && (story.images as string[]).length > 0 ? (
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${(story.images as string[])[0]})` }}
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-white" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  {story.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{story.excerpt}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {story.users && (
                      <div className="text-sm text-gray-500">
                        投稿者: {story.users.last_name} {story.users.first_name}
                      </div>
                    )}
                    {story.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{story.location}</span>
                      </div>
                    )}
                    {story.published_at && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(story.published_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        <span>{story.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{story.views}</span>
                      </div>
                    </div>
                  </div>

                  {story.tags && Array.isArray(story.tags) && (story.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(story.tags as string[]).slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
