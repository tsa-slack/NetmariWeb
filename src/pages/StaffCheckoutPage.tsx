import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RentalChecklistRepository } from '../lib/data-access/repositories';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  Send,
  Car,
  User,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useQuery } from '../lib/data-access';
import type { Database } from '../lib/database.types';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

type ChecklistRow = Database['public']['Tables']['rental_checklists']['Row'];

interface ChecklistData {
  items?: { label: string; checked: boolean }[];
  notes?: string;
}

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  user?: { first_name: string; last_name: string; email: string; phone_number?: string } | null;
  rental_vehicle?: {
    id: string;
    location: string | null;
    vehicle?: {
      name: string;
      manufacturer: string;
      type: string;
    } | null;
  } | null;
};

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

const PRE_RENTAL_ITEMS: ChecklistItem[] = [
  { id: 'exterior_clean', label: '外装の清掃確認', checked: false },
  { id: 'interior_clean', label: '内装の清掃確認', checked: false },
  { id: 'fuel_level', label: '燃料レベル確認', checked: false },
  { id: 'tire_pressure', label: 'タイヤ空気圧確認', checked: false },
  { id: 'lights_check', label: 'ライト類動作確認', checked: false },
  { id: 'fluid_levels', label: '各種オイル・液類確認', checked: false },
  { id: 'equipment_check', label: '付属装備品確認', checked: false },
  { id: 'scratches_record', label: '傷・凹み記録', checked: false },
  { id: 'interior_condition', label: '内装状態確認', checked: false },
  { id: 'emergency_kit', label: '緊急用具確認', checked: false },
];

const HANDOVER_ITEMS: ChecklistItem[] = [
  { id: 'id_verification', label: '本人確認書類チェック', checked: false },
  { id: 'license_verification', label: '運転免許証確認', checked: false },
  { id: 'contract_explanation', label: '契約内容説明', checked: false },
  { id: 'insurance_explanation', label: '保険内容説明', checked: false },
  { id: 'vehicle_operation', label: '車両操作説明', checked: false },
  { id: 'equipment_usage', label: '装備使用方法説明', checked: false },
  { id: 'emergency_contact', label: '緊急連絡先案内', checked: false },
  { id: 'return_procedure', label: '返却手順説明', checked: false },
  { id: 'fuel_policy', label: '燃料返却ルール説明', checked: false },
  { id: 'damage_policy', label: '損傷時の対応説明', checked: false },
  { id: 'key_handover', label: '鍵の受け渡し', checked: false },
  { id: 'document_handover', label: '書類の受け渡し', checked: false },
];

const checklistRepo = new RentalChecklistRepository();

export default function StaffCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isStaff, isAdmin } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<'pre_rental' | 'handover'>('pre_rental');
  const [preRentalItems, setPreRentalItems] = useState<ChecklistItem[]>(PRE_RENTAL_ITEMS);
  const [handoverItems, setHandoverItems] = useState<ChecklistItem[]>(HANDOVER_ITEMS);
  const [preRentalNotes, setPreRentalNotes] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // 予約データを取得
  const { loading } = useQuery<Reservation | null>(
    async () => {
      if (!id) return { success: true, data: null };

      const reservationResult = await checklistRepo.getReservationWithDetails(id);
      if (!reservationResult.success) throw reservationResult.error;

      if (!reservationResult.data) {
        toast.error('予約が見つかりません');
        navigate('/staff');
        return { success: true, data: null };
      }

      setReservation(reservationResult.data);

      const checklistResult = await checklistRepo.getChecklists(id);
      if (checklistResult.success && checklistResult.data) {
        const preRentalChecklist = checklistResult.data.find((c: ChecklistRow) => c.checklist_type === 'pre_rental');
        const handoverChecklist = checklistResult.data.find((c: ChecklistRow) => c.checklist_type === 'handover');

        if (preRentalChecklist) {
          const items = preRentalChecklist.checklist_data as ChecklistData;
          if (items.items) {
            setPreRentalItems(items.items as ChecklistItem[]);
          }
          if (items.notes) {
            setPreRentalNotes(items.notes);
          }
        }

        if (handoverChecklist) {
          const items = handoverChecklist.checklist_data as ChecklistData;
          if (items.items) {
            setHandoverItems(items.items as ChecklistItem[]);
          }
          if (items.notes) {
            setHandoverNotes(items.notes);
          }
        }
      }

      return { success: true, data: reservationResult.data };
    },
    { enabled: !!(user && (isStaff || isAdmin) && id) }
  );

  const togglePreRentalItem = (itemId: string) => {
    setPreRentalItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleHandoverItem = (itemId: string) => {
    setHandoverItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const saveChecklist = async (type: 'pre_rental' | 'handover', complete: boolean = false) => {
    if (!id || !user) return;

    setSaving(true);
    try {
      const items = type === 'pre_rental' ? preRentalItems : handoverItems;
      const notes = type === 'pre_rental' ? preRentalNotes : handoverNotes;

      const checklistData = {
        items,
        notes,
      };

      const result = await checklistRepo.upsertChecklist(
        id,
        type,
        checklistData,
        notes,
        complete ? user.id : undefined
      );

      if (!result.success) throw result.error;

      if (complete) {
        if (type === 'handover') {
          const checkoutResult = await checklistRepo.completeCheckout(id);
          if (!checkoutResult.success) throw checkoutResult.error;

          toast.success('引き渡しが完了しました');
          navigate('/staff');
        } else {
          setActiveTab('handover');
          toast.success('貸出前チェックを保存しました');
        }
      } else {
        toast.success('チェックリストを保存しました');
      }
    } catch (error) {
      handleError(error, '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <LoadingSpinner fullPage />
    );
  }

  if (!user || (!isStaff && !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">予約が見つかりません</p>
      </div>
    );
  }

  const vehicleName = reservation.rental_vehicle?.vehicle?.name || '不明な車両';
  const manufacturer = reservation.rental_vehicle?.vehicle?.manufacturer || '';
  const vehicleType = reservation.rental_vehicle?.vehicle?.type || '';
  const userName = reservation.user
    ? `${reservation.user.last_name} ${reservation.user.first_name}`
    : '不明';
  const userEmail = reservation.user?.email || '';
  const userPhone = reservation.user?.phone_number || '';
  const location = reservation.rental_vehicle?.location || '';

  const preRentalProgress = preRentalItems.filter((item) => item.checked).length;
  const preRentalTotal = preRentalItems.length;
  const handoverProgress = handoverItems.filter((item) => item.checked).length;
  const handoverTotal = handoverItems.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/staff')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            戻る
          </button>

          <div className="space-y-3">
            <div className="flex items-start">
              <Car className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900">{manufacturer} {vehicleName}</p>
                <p className="text-sm text-gray-600">{vehicleType}</p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
                {userPhone && <p className="text-sm text-gray-600">{userPhone}</p>}
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900">
                  {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                  {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                </p>
                <p className="text-sm text-gray-600">{reservation.days}日間</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900">{location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex border-b border-gray-200 mb-6 -mx-4 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pre_rental')}
            className={`flex-1 min-w-max px-4 py-3 text-sm font-medium transition ${
              activeTab === 'pre_rental'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            貸出前チェック
            <span className="ml-2 text-xs">
              {preRentalProgress}/{preRentalTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('handover')}
            className={`flex-1 min-w-max px-4 py-3 text-sm font-medium transition ${
              activeTab === 'handover'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            引き渡しチェック
            <span className="ml-2 text-xs">
              {handoverProgress}/{handoverTotal}
            </span>
          </button>
        </div>

        {activeTab === 'pre_rental' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">車両状態確認</h3>
              <div className="space-y-3">
                {preRentalItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => togglePreRentalItem(item.id)}
                    className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    {item.checked ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                    )}
                    <span
                      className={`flex-1 ${
                        item.checked ? 'text-gray-700' : 'text-gray-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                メモ・備考
              </label>
              <textarea
                value={preRentalNotes}
                onChange={(e) => setPreRentalNotes(e.target.value)}
                placeholder="特記事項があれば記入してください"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => saveChecklist('pre_rental', false)}
                disabled={saving}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                保存
              </button>
              <button
                onClick={() => saveChecklist('pre_rental', true)}
                disabled={saving || preRentalProgress < preRentalTotal}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="h-5 w-5 mr-2" />
                完了
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">お客様への説明・確認</h3>
              <div className="space-y-3">
                {handoverItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleHandoverItem(item.id)}
                    className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    {item.checked ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                    )}
                    <span
                      className={`flex-1 ${
                        item.checked ? 'text-gray-700' : 'text-gray-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                メモ・備考
              </label>
              <textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="特記事項があれば記入してください"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => saveChecklist('handover', false)}
                disabled={saving}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                保存
              </button>
              <button
                onClick={() => saveChecklist('handover', true)}
                disabled={saving || handoverProgress < handoverTotal}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="h-5 w-5 mr-2" />
                引き渡し完了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
