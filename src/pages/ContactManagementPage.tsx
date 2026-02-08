import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

import type { Database } from '../lib/database.types';
import { useQuery, useRepository, ContactRepository } from '../lib/data-access';
import {
  Mail,
  Phone,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';

type Contact = Database['public']['Tables']['contacts']['Row'];

export default function ContactManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const contactRepo = useRepository(ContactRepository);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // お問い合わせ一覧を取得
  const { loading: loadingContacts } = useQuery<Contact[]>(
    async () => {
      const result = await contactRepo.findAllOrdered();
      if (result.success) {
        setContacts(result.data);
      }
      return result;
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  useEffect(() => {
    filterContacts();
  }, [contacts, statusFilter, categoryFilter]);

  const filterContacts = () => {
    let filtered = [...contacts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredContacts(filtered);
  };

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updates: any = { status: newStatus }; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const result = await contactRepo.update(contactId, updates);
      if (!result.success) throw result.error;

      setContacts(
        contacts.map((c) =>
          c.id === contactId ? { ...c, ...updates } : c
        )
      );

      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, ...updates });
      }
    } catch (error) {
      handleError(error, 'ステータスの更新に失敗しました');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateAdminNotes = async () => {
    if (!selectedContact) return;

    try {
      const result = await contactRepo.update(selectedContact.id, { admin_notes: adminNotes });
      if (!result.success) throw result.error;

      setContacts(
        contacts.map((c) =>
          c.id === selectedContact.id ? { ...c, admin_notes: adminNotes } : c
        )
      );

      setSelectedContact({ ...selectedContact, admin_notes: adminNotes });
      toast.success('メモを保存しました');
    } catch (error) {
      handleError(error, 'メモの保存に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <Eye className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '未対応';
      case 'reviewing':
        return '対応中';
      case 'resolved':
        return '解決済み';
      case 'closed':
        return 'クローズ';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general':
        return '一般';
      case 'rental':
        return 'レンタル';
      case 'partner':
        return '協力店';
      case 'technical':
        return '技術的問題';
      case 'other':
        return 'その他';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
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
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
            お問い合わせ管理
          </h1>
          <p className="text-gray-600">ユーザーからのお問い合わせを管理</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">フィルター</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ステータス
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="pending">未対応</option>
                    <option value="reviewing">対応中</option>
                    <option value="resolved">解決済み</option>
                    <option value="closed">クローズ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="general">一般</option>
                    <option value="rental">レンタル</option>
                    <option value="partner">協力店</option>
                    <option value="technical">技術的問題</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 max-h-[600px] overflow-y-auto">
              {loadingContacts ? (
                <LoadingSpinner size="sm" fullPage={false} />
              ) : filteredContacts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  お問い合わせがありません
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact);
                        setAdminNotes(contact.admin_notes || '');
                      }}
                      className={`w-full text-left p-4 rounded-lg hover:bg-gray-50 transition ${
                        selectedContact?.id === contact.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">
                          {contact.subject}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            contact.status || ''
                          )}`}
                        >
                          {getStatusIcon(contact.status || '')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {contact.name} ({getCategoryLabel(contact.category || '')})
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(contact.created_at || '').toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedContact ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedContact.subject}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {selectedContact.name}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(selectedContact.created_at || '').toLocaleDateString(
                          'ja-JP'
                        )}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                      selectedContact.status || ''
                    )}`}
                  >
                    {getStatusIcon(selectedContact.status || '')}
                    <span className="ml-1.5">{getStatusLabel(selectedContact.status || '')}</span>
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">メールアドレス</p>
                        <p className="text-sm text-gray-800 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedContact.email}
                        </p>
                      </div>
                      {selectedContact.phone_number && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">電話番号</p>
                          <p className="text-sm text-gray-800 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedContact.phone_number}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">カテゴリー</p>
                      <p className="text-sm text-gray-800">
                        {getCategoryLabel(selectedContact.category || '')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      お問い合わせ内容
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {selectedContact.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ステータス更新
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateContactStatus(selectedContact.id, 'pending')
                        }
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50"
                      >
                        未対応
                      </button>
                      <button
                        onClick={() =>
                          updateContactStatus(selectedContact.id, 'reviewing')
                        }
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                      >
                        対応中
                      </button>
                      <button
                        onClick={() =>
                          updateContactStatus(selectedContact.id, 'resolved')
                        }
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
                      >
                        解決済み
                      </button>
                      <button
                        onClick={() =>
                          updateContactStatus(selectedContact.id, 'closed')
                        }
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        クローズ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      管理者メモ
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="内部メモを記入..."
                    />
                    <button
                      onClick={updateAdminNotes}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      メモを保存
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  左側のリストからお問い合わせを選択してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
