import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  Users,
  Shield,
  User,
  Search,
  Filter,
  Calendar,
  Mail,
  Edit,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  created_at: string;
}

export default function UserManagementPage() {
  const { user, loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Members' | 'Admin' | 'Staff' | 'Partners'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin, filter]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('users')
        .select('id, email, first_name, last_name, phone_number, role, created_at')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('role', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      setNewRole('');
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('ロールの変更に失敗しました');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${u.last_name} ${u.first_name}`.trim();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.phone_number?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Staff':
        return 'bg-blue-100 text-blue-800';
      case 'Partners':
        return 'bg-green-100 text-green-800';
      case 'Members':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin':
        return '管理者';
      case 'Staff':
        return 'スタッフ';
      case 'Partners':
        return '協力店';
      case 'Members':
        return 'ユーザー';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-5 w-5" />;
      case 'Staff':
        return <Users className="h-5 w-5" />;
      case 'Partners':
        return <Users className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
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

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Users className="h-10 w-10 mr-3 text-blue-600" />
            ユーザー管理
          </h1>
          <p className="text-gray-600">ユーザー情報とロールの管理</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                ロール
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="Members">ユーザー</option>
                <option value="Partners">協力店</option>
                <option value="Staff">スタッフ</option>
                <option value="Admin">管理者</option>
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
                placeholder="名前、メール、電話番号で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              ユーザーが見つかりません
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? '検索条件に一致するユーザーが見つかりません'
                : 'ユーザーがいません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredUsers.length}人のユーザー
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        連絡先
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ロール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {`${u.last_name} ${u.first_name}`.trim() || u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center mb-1">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {u.email}
                          </div>
                          {u.phone_number && (
                            <div className="text-sm text-gray-500">{u.phone_number}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser?.id === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">選択</option>
                                <option value="Members">ユーザー</option>
                                <option value="Partners">協力店</option>
                                <option value="Staff">スタッフ</option>
                                <option value="Admin">管理者</option>
                              </select>
                              <button
                                onClick={updateUserRole}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setNewRole('');
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                              >
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                                u.role
                              )}`}
                            >
                              {getRoleIcon(u.role)}
                              <span className="ml-2">{getRoleLabel(u.role)}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingUser?.id !== u.id && u.id !== user.id && (
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setNewRole(u.role);
                              }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              ロール変更
                            </button>
                          )}
                          {u.id === user.id && (
                            <span className="text-xs text-gray-500">現在のユーザー</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">ロールの説明</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>管理者:</strong>{' '}
                すべての機能にアクセス可能。ユーザー管理、システム設定などを実行できます。
              </span>
            </li>
            <li className="flex items-start">
              <Users className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>スタッフ:</strong>{' '}
                レビュー管理、投稿管理などの運営業務を実行できます。
              </span>
            </li>
            <li className="flex items-start">
              <Users className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>協力店:</strong>{' '}
                自分の店舗情報を管理でき、レンタル車両の登録が可能です。
              </span>
            </li>
            <li className="flex items-start">
              <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>ユーザー:</strong>{' '}
                一般ユーザー。レンタル予約、体験記投稿などが可能です。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
