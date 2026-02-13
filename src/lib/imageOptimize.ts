/**
 * 画像最適化ユーティリティ
 *
 * ブラウザの Canvas API を使用して、アップロード前に画像をリサイズ・WebP圧縮する。
 * 外部ライブラリ不要。
 */

export interface OptimizeOptions {
    /** 最大幅（px）。アスペクト比を維持して縮小。デフォルト: 1920 */
    maxWidth?: number;
    /** 最大高さ（px）。アスペクト比を維持して縮小。デフォルト: 1920 */
    maxHeight?: number;
    /** WebP品質 (0〜1)。デフォルト: 0.85 */
    quality?: number;
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
};

/**
 * 画像ファイルをリサイズ・WebP圧縮して最適化する。
 *
 * - GIF はアニメーション保持のためスキップ（元ファイルをそのまま返す）
 * - 元画像が maxWidth/maxHeight 以下の場合、拡大せず WebP 変換のみ実施
 *
 * @returns 最適化後の File オブジェクト
 */
export async function optimizeImage(
    file: File,
    options: OptimizeOptions = {}
): Promise<File> {
    // GIF はアニメーション保持のためスキップ
    if (file.type === 'image/gif') {
        return file;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    // 画像を読み込み
    const img = await loadImage(file);

    // リサイズ後のサイズを計算（アスペクト比維持）
    const { width, height } = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        opts.maxWidth,
        opts.maxHeight
    );

    // Canvas に描画してリサイズ
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        // Canvas 非対応（通常は発生しない）→ 元ファイルを返す
        return file;
    }

    ctx.drawImage(img, 0, 0, width, height);

    // WebP に変換
    const blob = await canvasToBlob(canvas, 'image/webp', opts.quality);

    // 最適化後のファイルが元より大きい場合は元ファイルを返す
    if (blob.size >= file.size) {
        return file;
    }

    // ファイル名の拡張子を .webp に変更
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const optimizedFile = new File([blob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
    });

    return optimizedFile;
}

/**
 * File → HTMLImageElement に変換
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('画像の読み込みに失敗しました'));
        };

        img.src = url;
    });
}

/**
 * アスペクト比を維持したリサイズ後のサイズを計算
 */
function calculateDimensions(
    origWidth: number,
    origHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = origWidth;
    let height = origHeight;

    // 横幅が超過 → 横幅基準で縮小
    if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
    }

    // 高さが超過 → 高さ基準で縮小
    if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
    }

    return { width, height };
}

/**
 * Canvas → Blob に変換（Promise ラッパー）
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('画像の変換に失敗しました'));
                }
            },
            type,
            quality
        );
    });
}
