import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * 車両リポジトリ
 */
export class VehicleRepository extends BaseRepository<'vehicles'> {
    constructor() {
        super('vehicles');
    }

    /**
     * 販売用車両を取得
     */
    async findForSale(): Promise<Result<Row<'vehicles'>[]>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table)
            .whereIn('purpose', ['sale', 'both'])
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * レンタル用車両を取得
     */
    async findForRental(): Promise<Result<Row<'vehicles'>[]>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table)
            .whereIn('purpose', ['rental', 'both'])
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 目的別に車両を取得
     */
    async findByPurpose(purpose: string): Promise<Result<Row<'vehicles'>[]>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table)
            .whereIn('purpose', [purpose, 'both'])
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 車両総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table);
        return query.count();
    }

    /**
     * メーカーで車両を検索
     */
    async findByManufacturer(manufacturer: string): Promise<Result<Row<'vehicles'>[]>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table)
            .whereEqual('manufacturer', manufacturer)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 管理用：フィルタ付きで車両一覧を取得
     */
    async findAllFiltered(purposeFilter?: string): Promise<Result<Row<'vehicles'>[]>> {
        const query = new QueryBuilder<Row<'vehicles'>>(this.table)
            .orderBy('created_at', 'desc');

        if (purposeFilter && purposeFilter !== 'all') {
            query.whereEqual('purpose', purposeFilter);
        }

        return query.execute();
    }
}
