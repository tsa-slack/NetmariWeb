import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  X,
  Mail,
  Ticket,
} from 'lucide-react';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  reservationId: string;
  paymentMethod: 'CreditCard' | 'OnSite';
  userEmail?: string;
}

export default function ReservationSuccessModal({
  isOpen,
  reservationId,
  paymentMethod,
  userEmail,
}: ReservationSuccessModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    navigate('/my-page?tab=reservations&success=true');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            予約が確定しました！
          </h2>
          <p className="text-gray-600">
            ご予約ありがとうございます
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">予約番号</p>
          <p className="text-xl font-bold text-gray-800 font-mono">
            {reservationId.substring(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {paymentMethod === 'CreditCard' && userEmail && (
            <div className="flex items-start space-x-3 text-sm">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 font-medium mb-1">領収書をメールで送信</p>
                <p className="text-gray-600">
                  {userEmail} 宛に領収書が送信されます
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-800 font-medium mb-1">マイページで確認</p>
              <p className="text-gray-600">
                予約内容の詳細はマイページからいつでも確認できます
              </p>
            </div>
          </div>

          {paymentMethod === 'OnSite' && (
            <div className="flex items-start space-x-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Ticket className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium mb-1">現地払い</p>
                <p className="text-yellow-700">
                  車両受取時にお支払いください
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
        >
          マイページで確認する
        </button>
      </div>
    </div>
  );
}
