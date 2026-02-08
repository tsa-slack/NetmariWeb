import { toast } from 'sonner';
import { logger } from './logger';

/**
 * 共通エラーハンドリングユーティリティ
 * try/catch ブロック内で使用し、ロギングとユーザー通知を統一
 *
 * @param error - キャッチしたエラーオブジェクト
 * @param userMessage - ユーザーに表示するメッセージ（省略時は汎用メッセージ）
 * @param logContext - ログに出力するコンテキスト情報（省略時はuserMessageと同じ）
 */
export function handleError(
    error: unknown,
    userMessage = '操作に失敗しました',
    logContext?: string
): void {
    const context = logContext || userMessage;

    // Supabase エラーの場合、詳細を含める
    if (error && typeof error === 'object' && 'code' in error) {
        const supaError = error as { code: string; message: string; details?: string };
        logger.error(`${context}:`, {
            code: supaError.code,
            message: supaError.message,
            details: supaError.details,
        });
    } else if (error instanceof Error) {
        logger.error(`${context}:`, error.message);
    } else {
        logger.error(`${context}:`, error);
    }

    // Error インスタンスの場合、より具体的なメッセージを表示
    if (error instanceof Error && error.message && error.message !== userMessage) {
        toast.error(`${userMessage}: ${error.message}`);
    } else {
        toast.error(userMessage);
    }
}
