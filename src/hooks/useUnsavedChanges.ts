import { useEffect, useRef } from 'react';

/**
 * 未保存データの離脱警告フック
 * 
 * フォームに未保存の変更がある場合:
 * 1. ブラウザタブを閉じる / リロード時に警告（beforeunload）
 * 
 * @param isDirty - フォームが変更されている場合 true
 * @param message - 離脱時の確認メッセージ（beforeunloadではブラウザ標準メッセージ）
 */
export function useUnsavedChanges(
    isDirty: boolean,
    message = '入力内容が保存されていません。このページを離れますか？'
) {
    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    // ブラウザの閉じる / リロード時の警告
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            // 最新のブラウザでは returnValue 設定が必須
            e.returnValue = message;
            return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [message]);
}
