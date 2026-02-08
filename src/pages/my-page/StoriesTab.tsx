import { Link } from 'react-router-dom';
import { BookOpen, Plus, Heart, Eye } from 'lucide-react';
import type { MyStory } from './types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface StoriesTabProps {
  myStories: MyStory[] | undefined;
  storiesLoading: boolean;
}

export default function StoriesTab({ myStories, storiesLoading }: StoriesTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">自分の投稿</h2>
        <Link
          to="/portal/stories/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規投稿
        </Link>
      </div>

      {storiesLoading ? (
        <LoadingSpinner size="sm" fullPage={false} />
      ) : (myStories?.length || 0) === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">まだ投稿がありません</p>
          <Link
            to="/portal/stories/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            最初の投稿を作成
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(myStories || []).map((story) => (
            <Link
              key={story.id}
              to={`/portal/stories/${story.id}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {story.cover_image ? (
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${story.cover_image})` }} />
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                  <BookOpen className="h-20 w-20 text-white" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 flex-1">{story.title}</h3>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    story.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {story.status === 'Published' ? '公開' : '下書き'}
                  </span>
                </div>
                {story.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{story.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
