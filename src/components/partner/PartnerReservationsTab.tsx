import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  users?: { email: string; first_name: string | null; last_name: string | null } | null;
  rental_vehicles?: { vehicle_id: string | null } | null;
};

interface PartnerReservationsTabProps {
  reservations: Reservation[];
}

export default function PartnerReservationsTab({ reservations }: PartnerReservationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">予約状況</h2>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            予約がありません
          </h3>
          <p className="text-gray-600">現在進行中の予約はありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {reservation.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {reservation.users
                        ? `${reservation.users.last_name || ''} ${
                            reservation.users.first_name || ''
                          }`.trim() || reservation.users.email
                        : '不明'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(reservation.start_date).toLocaleDateString('ja-JP')} -{' '}
                      {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="text-xs text-gray-500">{reservation.days}日間</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ¥{reservation.total?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${
                        reservation.status === 'Confirmed'
                          ? 'bg-green-100 text-green-800'
                          : reservation.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : reservation.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {reservation.status === 'Confirmed' && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {reservation.status === 'Pending' && (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {reservation.status === 'Cancelled' && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {reservation.status === 'Confirmed'
                        ? '確定'
                        : reservation.status === 'Pending'
                        ? '保留中'
                        : reservation.status === 'Completed'
                        ? '完了'
                        : 'キャンセル'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {reservation.created_at ? new Date(reservation.created_at).toLocaleDateString('ja-JP') : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
