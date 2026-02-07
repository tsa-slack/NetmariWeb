/**
 * カスタム軽量ロガー
 *
 * 環境に応じたログレベル制御:
 * - 開発環境 (DEV): debug 以上すべて出力
 * - 本番環境 (PROD): warn 以上のみ出力
 *
 * 使用例:
 *   import { logger } from '../lib/logger';
 *   logger.info('ユーザー登録完了', { userId: '123' });
 *   logger.error('データ取得失敗', { table: 'events', error });
 */

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
}

// 開発環境では debug 以上、本番環境では warn 以上を出力
const currentLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
    const time = entry.timestamp.split('T')[1]?.split('.')[0] ?? entry.timestamp;
    return `[${entry.level.toUpperCase()}] ${time} ${entry.message}`;
}

function createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
        level,
        message,
        timestamp: new Date().toISOString(),
        data,
    };
}

/**
 * アプリケーション全体で使用する軽量ロガー
 *
 * - debug: 開発時のみ出力される詳細な情報（API レスポンス、状態変更等）
 * - info: 重要な処理の完了通知（ユーザー操作、データ保存等）
 * - warn: 潜在的な問題（非推奨API使用、パフォーマンス警告等）
 * - error: エラー情報（API失敗、例外キャッチ等）
 */
export const logger = {
    debug(message: string, data?: unknown): void {
        if (!shouldLog('debug')) return;
        const entry = createLogEntry('debug', message, data);
        console.debug(formatLog(entry), data ?? '');
    },

    info(message: string, data?: unknown): void {
        if (!shouldLog('info')) return;
        const entry = createLogEntry('info', message, data);
        console.info(formatLog(entry), data ?? '');
    },

    warn(message: string, data?: unknown): void {
        if (!shouldLog('warn')) return;
        const entry = createLogEntry('warn', message, data);
        console.warn(formatLog(entry), data ?? '');
    },

    error(message: string, data?: unknown): void {
        // error は常に出力
        const entry = createLogEntry('error', message, data);
        console.error(formatLog(entry), data ?? '');
    },
};

export default logger;
