/**
 * JOINクエリの戻り値型定義
 * Supabaseのリレーション付きSELECTの結果を型安全にするための型
 */
import type { Row } from './types';

// =========================================================================
// 共通パーツ
// =========================================================================

/** ユーザー基本情報（著者・主催者等のJOIN用） */
export type UserBasicInfo = {
    first_name: string | null;
    last_name: string | null;
};

/** ユーザー基本情報 + メール */
export type UserBasicInfoWithEmail = UserBasicInfo & {
    email: string | null;
};

/** 管理用フォーマット済み著者情報 */
export type FormattedAuthor = {
    full_name: string;
    email: string;
};

// =========================================================================
// Review
// =========================================================================

export type ReviewWithAuthor = Row<'reviews'> & {
    author: UserBasicInfo | null;
};

export type ReviewForAdmin = Pick<Row<'reviews'>, 'id' | 'target_type' | 'target_id' | 'rating' | 'title' | 'content' | 'is_published' | 'created_at'> & {
    author: FormattedAuthor;
};

// =========================================================================
// Story
// =========================================================================

export type StoryWithAuthor = Row<'stories'> & {
    users: UserBasicInfo | null;
};

export type StoryForAdmin = Pick<Row<'stories'>, 'id' | 'title' | 'excerpt' | 'content' | 'cover_image' | 'location' | 'status' | 'likes' | 'views' | 'created_at'> & {
    author: FormattedAuthor;
};

// =========================================================================
// Question
// =========================================================================

export type QuestionWithAuthorAndCount = Row<'questions'> & {
    author: UserBasicInfo | null;
    answers: Array<{ count: number }>;
    answer_count: number;
};

export type QuestionForAdmin = Row<'questions'> & {
    author: FormattedAuthor;
    answer_count: number;
};

// =========================================================================
// Answer
// =========================================================================

export type AnswerWithAuthor = Row<'answers'> & {
    author: UserBasicInfo | null;
};

// =========================================================================
// Event
// =========================================================================

export type EventWithOrganizer = Row<'events'> & {
    organizer: UserBasicInfo | null;
};

export type EventWithParticipantCount = Row<'events'> & {
    participants: Array<{ count: number }>;
};

// =========================================================================
// EventParticipant
// =========================================================================

export type EventParticipantWithUser = {
    id: string;
    status: string;
    created_at: string;
    user: UserBasicInfo | null;
};

// =========================================================================
// Announcement
// =========================================================================

export type AnnouncementWithAuthor = Row<'announcements'> & {
    author: UserBasicInfo | null;
};

// =========================================================================
// Activity
// =========================================================================

export type ActivityWithPartner = Row<'activities'> & {
    partner: { name: string | null } | null;
};

export type ActivityWithPartnerAddress = Row<'activities'> & {
    partner: { name: string | null; address: string | null } | null;
};

// =========================================================================
// Reservation
// =========================================================================

export type ReservationWithDetails = Row<'reservations'> & {
    user: UserBasicInfoWithEmail | null;
    rental_vehicle: {
        price_per_day: number | null;
        location: string | null;
        vehicle: { name: string | null; type: string | null } | null;
    } | null;
    reservation_equipment: Array<{
        id: string;
        quantity: number;
        days: number;
        price_per_day: number;
        subtotal: number;
        equipment: { name: string | null; category: string | null } | null;
    }>;
    reservation_activities: Array<{
        id: string;
        date: string;
        participants: number;
        price: number;
        activity: { name: string | null; duration: number | null } | null;
    }>;
};

/** カレンダーマトリックス用：予約データ */
export type ReservationForCalendar = Row<'reservations'> & {
    user: UserBasicInfoWithEmail | null;
    rental_vehicle: {
        license_plate: string | null;
        vehicle: { name: string | null; type: string | null } | null;
    } | null;
    reservation_equipment: Array<{
        id: string;
        quantity: number;
        days: number;
        price_per_day: number;
        subtotal: number;
        equipment: { name: string | null; category: string | null } | null;
    }>;
    reservation_activities: Array<{
        id: string;
        date: string;
        participants: number;
        price: number;
        activity: { name: string | null; duration: number | null } | null;
    }>;
};

/** カレンダーマトリックス用：レンタル車両（車両JOIN付き） */
export type RentalVehicleForCalendar = Row<'rental_vehicles'> & {
    vehicle: { name: string | null; type: string | null } | null;
};

// =========================================================================
// User (admin)
// =========================================================================

export type UserForAdmin = Pick<Row<'users'>, 'id' | 'email' | 'first_name' | 'last_name' | 'phone_number' | 'role' | 'created_at'>;

// =========================================================================
// StoryQuestion
// =========================================================================

export type StoryQuestionWithAnswers = {
    id: string;
    story_id: string;
    user_id: string;
    content: string;
    created_at: string;
    users: UserBasicInfo | null;
    story_answers: Array<{
        id: string;
        content: string;
        created_at: string;
        users: UserBasicInfo | null;
    }>;
};

// =========================================================================
// Dashboard
// =========================================================================

export type DashboardCounts = {
    pendingStories: number;
    pendingReviews: number;
    openQuestions: number;
    activeRentals: number;
};
