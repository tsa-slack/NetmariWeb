import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { ReservationForCalendar, RentalVehicleForCalendar } from '../../lib/data-access/base/joinTypes';
import ReservationDetailModal from './ReservationDetailModal';

interface ReservationCalendarMatrixProps {
    reservations: ReservationForCalendar[];
    vehicles: RentalVehicleForCalendar[];
    onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

/** 日付を YYYY-MM-DD 形式に変換 */
function toDateStr(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** 日付列を生成 */
function generateDates(start: Date, days: number): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
}

/** 2つの日付範囲が重複するか */
function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 <= end2 && end1 >= start2;
}

/** バッファ（準備日）かどうか判定 */
function isBufferDay(dateStr: string, resStart: string, resEnd: string): boolean {
    const d = new Date(dateStr);
    const s = new Date(resStart);
    const e = new Date(resEnd);
    const dayBefore = new Date(s);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(e);
    dayAfter.setDate(dayAfter.getDate() + 1);
    return toDateStr(d) === toDateStr(dayBefore) || toDateStr(d) === toDateStr(dayAfter);
}

/** ステータスに応じた色クラス */
function getStatusColors(status: string | null): { bg: string; text: string; border: string } {
    switch (status) {
        case 'Pending':
            return { bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-500' };
        case 'Confirmed':
            return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' };
        case 'InProgress':
            return { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600' };
        case 'Completed':
            return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' };
        default:
            return { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-500' };
    }
}

function getStatusLabel(status: string | null): string {
    switch (status) {
        case 'Pending': return '保留';
        case 'Confirmed': return '確定';
        case 'InProgress': return '貸出中';
        case 'Completed': return '完了';
        default: return status || '不明';
    }
}

const BUFFER_CLASS = 'bg-orange-200 border border-dashed border-orange-400';
const TODAY_HIGHLIGHT = 'bg-blue-50';
const WEEKEND_CLASS = 'bg-gray-50';
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export default function ReservationCalendarMatrix({
    reservations,
    vehicles,
    onUpdateStatus,
}: ReservationCalendarMatrixProps) {
    const [startDate, setStartDate] = useState<Date>(() => {
        const today = new Date();
        today.setDate(today.getDate() - today.getDay()); // 週の始まり（日曜）
        return today;
    });
    const [displayDays] = useState(14);
    const [selectedReservation, setSelectedReservation] = useState<ReservationForCalendar | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const todayStr = toDateStr(new Date());

    const dates = useMemo(() => generateDates(startDate, displayDays), [startDate, displayDays]);
    const dateStrings = useMemo(() => dates.map(d => toDateStr(d)), [dates]);

    // 車両→日付→予約 のマップを構築
    const cellMap = useMemo(() => {
        const map = new Map<string, Map<string, { type: 'booked'; reservation: ReservationForCalendar } | { type: 'buffer'; reservation: ReservationForCalendar }>>();

        for (const vehicle of vehicles) {
            const dayMap = new Map<string, { type: 'booked'; reservation: ReservationForCalendar } | { type: 'buffer'; reservation: ReservationForCalendar }>();
            map.set(vehicle.id, dayMap);
        }

        for (const res of reservations) {
            if (!res.rental_vehicle_id) continue;
            const dayMap = map.get(res.rental_vehicle_id);
            if (!dayMap) continue;

            for (const dateStr of dateStrings) {
                // 予約期間内
                if (datesOverlap(res.start_date, res.end_date, dateStr, dateStr)) {
                    dayMap.set(dateStr, { type: 'booked', reservation: res });
                }
                // バッファ日（既に予約がない場合のみ）
                else if (isBufferDay(dateStr, res.start_date, res.end_date) && !dayMap.has(dateStr)) {
                    dayMap.set(dateStr, { type: 'buffer', reservation: res });
                }
            }
        }

        return map;
    }, [vehicles, reservations, dateStrings]);

    const goToToday = useCallback(() => {
        const today = new Date();
        today.setDate(today.getDate() - today.getDay());
        setStartDate(today);
    }, []);

    const navigateWeek = useCallback((direction: number) => {
        setStartDate(prev => {
            const next = new Date(prev);
            next.setDate(next.getDate() + direction * 7);
            return next;
        });
    }, []);

    // 今日のカラムに自動スクロール（モバイル）
    useEffect(() => {
        if (scrollRef.current) {
            const todayIndex = dateStrings.indexOf(todayStr);
            if (todayIndex > 0) {
                const cellWidth = 56; // min-w-[56px]
                scrollRef.current.scrollLeft = Math.max(0, todayIndex * cellWidth - 56);
            }
        }
    }, [dateStrings, todayStr]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        await onUpdateStatus(id, newStatus);
        setSelectedReservation(null);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* ナビゲーションヘッダー */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateWeek(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        aria-label="前の週"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-800 min-w-[180px] text-center">
                        {dates[0].toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {' 〜 '}
                        {dates[dates.length - 1].toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                    </span>
                    <button
                        onClick={() => navigateWeek(1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        aria-label="次の週"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
                <button
                    onClick={goToToday}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                    <CalendarDays className="h-4 w-4" />
                    今日
                </button>
            </div>

            {/* 凡例 */}
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-4 flex-wrap text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-blue-500"></span>
                    確定
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-amber-400"></span>
                    保留
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-violet-500"></span>
                    貸出中
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-500"></span>
                    完了
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-orange-400 bg-orange-200"></span>
                    準備日
                </span>
            </div>

            {/* マトリックス */}
            <div className="flex overflow-hidden">
                {/* 左固定列: 車両名 */}
                <div className="flex-shrink-0 border-r border-gray-200 z-10 bg-white">
                    {/* 空のヘッダーセル */}
                    <div className="h-16 border-b border-gray-200 flex items-end px-2 sm:px-3 pb-1">
                        <span className="text-xs font-medium text-gray-500">車両</span>
                    </div>
                    {vehicles.map(v => (
                        <div
                            key={v.id}
                            className="h-14 border-b border-gray-100 flex items-center px-2 sm:px-3 w-[90px] sm:w-[160px]"
                        >
                            <div className="truncate">
                                <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                    {v.vehicle?.name || '不明'}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                    {v.license_plate || ''}
                                    <span className="hidden sm:inline">
                                        {v.license_plate && v.vehicle?.type ? ' / ' : ''}
                                        {v.vehicle?.type || ''}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 右スクロール領域: 日付グリッド */}
                <div ref={scrollRef} className="flex-1 overflow-x-auto">
                    <div className="inline-flex flex-col min-w-full">
                        {/* 日付ヘッダー */}
                        <div className="flex border-b border-gray-200">
                            {dates.map((date, i) => {
                                const isToday = dateStrings[i] === todayStr;
                                const dayOfWeek = date.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                return (
                                    <div
                                        key={dateStrings[i]}
                                        className={`min-w-[56px] h-16 flex flex-col items-center justify-end pb-1 border-r border-gray-100 ${
                                            isToday ? 'bg-blue-100' : isWeekend ? 'bg-gray-50' : ''
                                        }`}
                                    >
                                        <span className={`text-[10px] font-medium ${
                                            dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-500'
                                        }`}>
                                            {DAY_NAMES[dayOfWeek]}
                                        </span>
                                        <span className={`text-sm font-bold ${
                                            isToday ? 'text-blue-600 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-700'
                                        }`}>
                                            {date.getDate()}
                                        </span>
                                        {date.getDate() === 1 && (
                                            <span className="text-[9px] text-gray-400">
                                                {date.getMonth() + 1}月
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 車両ごとの予約行 */}
                        {vehicles.map(vehicle => {
                            const dayMap = cellMap.get(vehicle.id);
                            return (
                                <div
                                    key={vehicle.id}
                                    className="flex border-b border-gray-100"
                                >
                                    {dates.map((date, i) => {
                                        const dateStr = dateStrings[i];
                                        const cell = dayMap?.get(dateStr);
                                        const isToday = dateStr === todayStr;
                                        const dayOfWeek = date.getDay();
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                        if (cell?.type === 'booked') {
                                            const colors = getStatusColors(cell.reservation.status);
                                            // 予約開始日かどうか
                                            const isStart = cell.reservation.start_date === dateStr;
                                            return (
                                                <button
                                                    key={dateStr}
                                                    onClick={() => setSelectedReservation(cell.reservation)}
                                                    className={`min-w-[56px] h-14 border-r border-gray-100 ${colors.bg} ${colors.text} flex items-center justify-center transition hover:opacity-80 cursor-pointer ${
                                                        isStart ? 'rounded-l-md' : ''
                                                    } ${cell.reservation.end_date === dateStr ? 'rounded-r-md' : ''}`}
                                                    title={`${getStatusLabel(cell.reservation.status)} - ${cell.reservation.user?.last_name || ''}`}
                                                >
                                                    {isStart && (
                                                        <span className="text-[10px] font-bold truncate px-0.5">
                                                            {getStatusLabel(cell.reservation.status).charAt(0)}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        }

                                        if (cell?.type === 'buffer') {
                                            return (
                                                <div
                                                    key={dateStr}
                                                    className={`min-w-[56px] h-14 border-r border-gray-100 ${BUFFER_CLASS} flex items-center justify-center`}
                                                    title="準備日"
                                                >
                                                    <span className="text-[10px] text-orange-600 font-medium">準</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`min-w-[56px] h-14 border-r border-gray-100 ${
                                                    isToday ? TODAY_HIGHLIGHT : isWeekend ? WEEKEND_CLASS : ''
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 車両がない場合 */}
            {vehicles.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    <p>レンタル車両が登録されていません</p>
                </div>
            )}

            {/* 予約詳細モーダル */}
            {selectedReservation && (
                <ReservationDetailModal
                    reservation={selectedReservation}
                    onClose={() => setSelectedReservation(null)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}
        </div>
    );
}
