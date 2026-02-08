import { BaseRepository } from '../base/BaseRepository';
import type { Result, Row } from '../base/types';
import type { Json } from '../../database.types';

/**
 * レンタルチェックリストリポジトリ
 * 貸出・返却の業務ロジックを集約
 */

// DB行型のエイリアス
type ReservationRow = Row<'reservations'>;
type ChecklistRow = Row<'rental_checklists'>;

// JOIN付きの予約型
interface ReservationWithDetails extends ReservationRow {
    user?: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string;
    } | null;
    rental_vehicle?: {
        id: string;
        location: string | null;
        vehicle?: {
            name: string;
            manufacturer: string;
            type: string;
        } | null;
    } | null;
}

// チェックリストデータの型
interface ChecklistPayload {
    items?: Array<{ id?: string; label: string; checked: boolean }>;
    notes?: string;
    damageNotes?: string;
    hasDamage?: boolean;
    mileage?: string;
}

export class RentalChecklistRepository extends BaseRepository<'rental_checklists'> {
    constructor() {
        super('rental_checklists');
    }

    /**
     * スタッフ用：予約詳細を取得（ユーザー・車両情報JOIN付き）
     */
    async getReservationWithDetails(reservationId: string): Promise<Result<ReservationWithDetails | null>> {
        try {
            const { data, error } = await this.client
                .from('reservations')
                .select(`
                    *,
                    user:users!reservations_user_id_fkey(first_name, last_name, email, phone_number),
                    rental_vehicle:rental_vehicles(
                        id,
                        location,
                        vehicle:vehicles(name, manufacturer, type)
                    )
                `)
                .eq('id', reservationId)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data: data as ReservationWithDetails | null } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch reservation'),
            } as const;
        }
    }

    /**
     * 予約に紐づくチェックリストを取得
     */
    async getChecklists(reservationId: string): Promise<Result<ChecklistRow[]>> {
        try {
            const { data, error } = await this.client
                .from('rental_checklists')
                .select('*')
                .eq('reservation_id', reservationId);

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch checklists'),
            } as const;
        }
    }

    /**
     * チェックリストをupsert（存在すれば更新、なければ作成）
     */
    async upsertChecklist(
        reservationId: string,
        checklistType: string,
        checklistData: ChecklistPayload,
        notes: string,
        completedBy?: string
    ): Promise<Result<void>> {
        try {
            // 既存チェックリストを検索
            const { data: existing } = await this.client
                .from('rental_checklists')
                .select('id')
                .eq('reservation_id', reservationId)
                .eq('checklist_type', checklistType)
                .maybeSingle();

            const baseData: {
                checklist_data: Json;
                notes: string;
                completed_by?: string;
                completed_at?: string;
            } = {
                checklist_data: checklistData as unknown as Json,
                notes,
            };

            if (completedBy) {
                baseData.completed_by = completedBy;
                baseData.completed_at = new Date().toISOString();
            }

            if (existing) {
                const { error } = await this.client
                    .from('rental_checklists')
                    .update(baseData)
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                const { error } = await this.client
                    .from('rental_checklists')
                    .insert({
                        reservation_id: reservationId,
                        checklist_type: checklistType,
                        ...baseData,
                    });

                if (error) throw error;
            }

            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to upsert checklist'),
            } as const;
        }
    }

    /**
     * 貸出完了：予約ステータスを InProgress に更新
     */
    async completeCheckout(reservationId: string): Promise<Result<void>> {
        try {
            const { error } = await this.client
                .from('reservations')
                .update({ status: 'InProgress' })
                .eq('id', reservationId);

            if (error) throw error;
            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to complete checkout'),
            } as const;
        }
    }

    /**
     * 返却完了：予約を Completed に + 車両を Available に更新
     */
    async completeReturn(reservationId: string, vehicleId: string): Promise<Result<void>> {
        try {
            const { error: reservationError } = await this.client
                .from('reservations')
                .update({ status: 'Completed' })
                .eq('id', reservationId);

            if (reservationError) throw reservationError;

            const { error: vehicleError } = await this.client
                .from('rental_vehicles')
                .update({ status: 'Available' })
                .eq('id', vehicleId);

            if (vehicleError) throw vehicleError;

            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to complete return'),
            } as const;
        }
    }
}
