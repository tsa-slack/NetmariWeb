import type { Database, Json } from '../../lib/database.types';
import type { Row } from '../../lib/data-access/base/types';

export type Review = Database['public']['Tables']['reviews']['Row'] & {
    partner_name?: string;
};
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Reservation = Database['public']['Tables']['reservations']['Row'] & {
    rental_vehicle?: {
        location?: string | null;
        vehicle?: {
            name?: string;
            manufacturer?: string | null;
            images?: Json;
        } | null;
    } | null;
};
export type PartnerFavorite = Database['public']['Tables']['partner_favorites']['Row'] & {
    partner?: {
        name?: string;
        description?: string | null;
        address?: string | null;
        images?: Json;
        type?: string | null;
    } | null;
};

export type VehicleFavorite = {
    id: string;
    user_id: string | null;
    rental_vehicle_id: string | null;
    created_at: string | null;
    rental_vehicle?: {
        id: string;
        location?: string | null;
        vehicle?: {
            name?: string;
            manufacturer?: string | null;
            type?: string | null;
            images?: Json;
            price?: number | null;
            status?: string | null;
        } | null;
    } | null;
};

export type StoryFavorite = {
    id: string;
    user_id: string;
    story_id: string;
    created_at: string;
    story?: {
        title?: string;
        excerpt?: string;
        cover_image?: string;
        author_id?: string;
    };
};

export type UserRoute = Database['public']['Tables']['routes']['Row'];

export type RankProgress = {
    totalSpent: number;
    totalLikes: number;
    totalPosts: number;
    currentRank: string;
    nextRank: string | null;
    discountRate: number;
    nextRequirements: {
        min_amount: number;
        min_likes: number;
        min_posts: number;
    } | null;
};

export type MyStory = Row<'stories'>;
