import { Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  Users,
  Plus,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type ActivityType = Database['public']['Tables']['activities']['Row'];

interface PartnerActivitiesTabProps {
  activities: ActivityType[];
}

export default function PartnerActivitiesTab({ activities }: PartnerActivitiesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">アクティビティ管理</h2>
        <Link
          to="/admin/activities/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          新規アクティビティ
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            アクティビティがありません
          </h3>
          <p className="text-gray-600 mb-6">
            新しいアクティビティを追加して、ユーザーに体験を提供しましょう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {activity.images && Array.isArray(activity.images) && activity.images.length > 0 ? (
                <img
                  src={activity.images[0] as string}
                  alt={activity.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Activity className="h-16 w-16 text-white opacity-50" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {activity.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {activity.duration || '未設定'}
                  </div>
                  <div className="text-blue-600 font-bold">
                    ¥{activity.price?.toLocaleString() || '0'}
                  </div>
                </div>
                {activity.max_participants && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    最大 {activity.max_participants}名
                  </div>
                )}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.status === 'Active' ? '公開中' : '非公開'}
                  </span>
                  <Link
                    to={`/admin/activities/${activity.id}/edit`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    編集
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
