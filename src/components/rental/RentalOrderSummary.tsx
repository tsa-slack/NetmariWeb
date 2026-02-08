import {
  Calendar,
  Car,
  Package,
  Ticket,
  Award,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type RentalVehicle = Database['public']['Tables']['rental_vehicles']['Row'] & {
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null;
};
type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  pricing_type?: string | null;
};
type Activity = Database['public']['Tables']['activities']['Row'];

interface Totals {
  vehicleTotal: number;
  equipmentTotal: number;
  activityTotal: number;
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  tax: number;
  total: number;
}

interface RentalOrderSummaryProps {
  startDate: string;
  endDate: string;
  days: number;
  vehiclePrice: number;
  rentalVehicle: RentalVehicle;
  equipment: Array<Equipment & { quantity: number; price: number }>;
  activities: Array<Activity & { date: string; participants: number; price: number }>;
  totals: Totals;
  userRank: string;
  discountRate: number;
}

export default function RentalOrderSummary({
  startDate,
  endDate,
  days,
  vehiclePrice,
  rentalVehicle,
  equipment,
  activities,
  totals,
  userRank,
  discountRate,
}: RentalOrderSummaryProps) {
  const vehicle = rentalVehicle.vehicle;
  const images = vehicle?.images as string[] || [];

  return (
    <>
      {/* 利用期間 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">利用期間</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">利用開始日</p>
            <p className="font-semibold text-gray-800">
              {new Date(startDate).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">返却日</p>
            <p className="font-semibold text-gray-800">
              {new Date(endDate).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">利用日数</p>
            <p className="font-semibold text-gray-800">{days}日間</p>
          </div>
        </div>
      </div>

      {/* レンタル車両 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Car className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">レンタル車両</h2>
        </div>
        <div className="flex items-center">
          {images.length > 0 ? (
            <div
              className="w-32 h-32 bg-cover bg-center rounded-lg flex-shrink-0"
              style={{ backgroundImage: `url(${images[0]})` }}
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car className="h-16 w-16 text-white" />
            </div>
          )}
          <div className="ml-6 flex-1">
            <h3 className="text-xl font-semibold text-gray-800">{vehicle?.name}</h3>
            {vehicle?.manufacturer && (
              <p className="text-gray-600">{vehicle.manufacturer}</p>
            )}
            {rentalVehicle.location && (
              <p className="text-sm text-gray-600 mt-2">場所: {rentalVehicle.location}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">¥{vehiclePrice.toLocaleString()} x {days}日</p>
            <p className="text-2xl font-bold text-blue-600">
              ¥{totals.vehicleTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ギア・装備 */}
      {equipment.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Package className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">ギア・装備</h2>
          </div>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {equipment.map((eq: any) => {
              const pricingType = eq.pricing_type || 'PerDay';
              const itemTotal = pricingType === 'PerUnit'
                ? eq.price * eq.quantity
                : eq.price * eq.quantity * days;
              const priceLabel = pricingType === 'PerUnit' ? '/個' : '/日';

              return (
                <div key={eq.id} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-800">{eq.name}</h3>
                    <p className="text-sm text-gray-600">
                      ¥{eq.price.toLocaleString()}{priceLabel} x {eq.quantity}個
                      {pricingType === 'PerDay' && ` x ${days}日`}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">
                    ¥{itemTotal.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* アクティビティ */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Ticket className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">アクティビティ</h2>
          </div>
          <div className="space-y-3">
            {activities.map((act, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-semibold text-gray-800">{act.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(act.date).toLocaleDateString('ja-JP')} - {act.participants}名
                  </p>
                </div>
                <p className="font-bold text-gray-800">
                  ¥{(act.price * act.participants).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 料金詳細 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">料金詳細</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>小計</span>
            <span className="font-semibold">¥{totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                {userRank}会員割引（{discountRate}%）
              </span>
              <span className="font-semibold">-¥{totals.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>消費税（10%）</span>
            <span className="font-semibold">¥{totals.tax.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-xl font-bold text-gray-800">合計金額</span>
            <span className="text-3xl font-bold text-blue-600">
              ¥{totals.total.toLocaleString()}
            </span>
          </div>
          {discountRate > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
              <Award className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">
                {userRank}会員として、レンタル料金から{discountRate}%の割引が適用されています。
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
