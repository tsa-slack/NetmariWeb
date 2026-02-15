import { useState } from 'react';
import { X, User, Clock, Car, ChevronDown, Package, MapPin } from 'lucide-react';
import type { ReservationForCalendar } from '../../lib/data-access/base/joinTypes';

type StatusType = 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';

interface ReservationDetailModalProps {
    reservation: ReservationForCalendar;
    onClose: () => void;
    onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: StatusType; label: string; color: string }[] = [
    { value: 'Pending', label: '保留中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Confirmed', label: '確定', color: 'bg-blue-100 text-blue-800' },
    { value: 'InProgress', label: '貸出中', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'Completed', label: '完了', color: 'bg-green-100 text-green-800' },
    { value: 'Cancelled', label: 'キャンセル', color: 'bg-red-100 text-red-800' },
];

function getStatusOption(status: string) {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

export default function ReservationDetailModal({
    reservation,
    onClose,
    onUpdateStatus,
}: ReservationDetailModalProps) {
    const [newStatus, setNewStatus] = useState(reservation.status || 'Pending');
    const [updating, setUpdating] = useState(false);

    const currentStatus = getStatusOption(reservation.status || 'Pending');
    const userName = reservation.user?.first_name && reservation.user?.last_name
        ? `${reservation.user.last_name} ${reservation.user.first_name}`
        : reservation.user?.email || '不明';

    const vehicleName = reservation.rental_vehicle?.vehicle?.name || '不明';
    const vehicleType = reservation.rental_vehicle?.vehicle?.type || '';
    const licensePlate = reservation.rental_vehicle?.license_plate || '';

    const equipment = reservation.reservation_equipment || [];
    const activities = reservation.reservation_activities || [];

    const handleUpdate = async () => {
        if (newStatus === reservation.status) return;
        setUpdating(true);
        try {
            await onUpdateStatus(reservation.id, newStatus);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
                    {/* ヘッダー */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">予約詳細</h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-white/20 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-sm text-white/80 mt-1">
                            #{reservation.id.slice(0, 8)}
                        </p>
                    </div>

                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {/* ステータス */}
                        <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ステータス
                            </span>
                            <div className="mt-1">
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
                                    {currentStatus.label}
                                </span>
                            </div>
                        </div>

                        {/* ユーザー */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    利用者
                                </span>
                                <p className="text-gray-800 font-medium">{userName}</p>
                                {reservation.user?.email && (
                                    <p className="text-sm text-gray-500">{reservation.user.email}</p>
                                )}
                            </div>
                        </div>

                        {/* 車両 */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Car className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    車両
                                </span>
                                <p className="text-gray-800 font-medium">{vehicleName}</p>
                                {(licensePlate || vehicleType) && (
                                    <p className="text-sm text-gray-500">
                                        {licensePlate}{licensePlate && vehicleType ? ' / ' : ''}{vehicleType}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* レンタル期間 */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    レンタル期間
                                </span>
                                <p className="text-gray-800 font-medium">
                                    {new Date(reservation.start_date).toLocaleDateString('ja-JP')}
                                    {' 〜 '}
                                    {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                                </p>
                                <p className="text-sm text-gray-500">{reservation.days}日間</p>
                            </div>
                        </div>

                        {/* ギヤ（装備品） */}
                        {equipment.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Package className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ギヤ（装備品）
                                    </span>
                                    <div className="mt-1 space-y-1">
                                        {equipment.map(eq => (
                                            <div key={eq.id} className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {eq.equipment?.name || '不明'}
                                                    <span className="text-gray-400 ml-1">
                                                        ×{eq.quantity} / {eq.days}日
                                                    </span>
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    ¥{eq.subtotal.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* アクティビティ */}
                        {activities.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg">
                                    <MapPin className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        アクティビティ
                                    </span>
                                    <div className="mt-1 space-y-1">
                                        {activities.map(act => (
                                            <div key={act.id} className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {act.activity?.name || '不明'}
                                                    <span className="text-gray-400 ml-1">
                                                        {act.participants}名
                                                        {act.activity?.duration ? ` / ${act.activity.duration}分` : ''}
                                                    </span>
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    ¥{act.price.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 金額 */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">小計</span>
                                <span>¥{reservation.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">税</span>
                                <span>¥{reservation.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>合計</span>
                                <span className="text-blue-600">¥{reservation.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* ステータス変更 */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ステータスを変更
                            </label>
                            <div className="relative">
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white pr-10"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* フッター */}
                    <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition text-sm font-medium"
                        >
                            閉じる
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={newStatus === reservation.status || updating}
                            className={`px-5 py-2 rounded-xl text-white text-sm font-medium transition ${
                                newStatus === reservation.status || updating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : newStatus === 'Cancelled'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {updating ? '更新中...' : 'ステータスを更新'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
