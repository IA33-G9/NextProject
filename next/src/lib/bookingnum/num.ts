/**
 * ランダムな予約番号を生成する
 * 形式: アルファベット3文字 + 数字3桁（例: ABC123）
 */
export function generateBookingReference(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let reference = '';

  // アルファベット3文字
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    reference += characters[randomIndex];
  }

  // 数字3桁
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    reference += numbers[randomIndex];
  }

  return reference;
}

/**
 * 日時をフォーマットする
 * @param dateString ISO形式の日時文字列
 * @returns フォーマットされた日時（例: 2023年5月1日 14:30）
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * 上映時間を分で計算
 * @param startTime 開始時間
 * @param endTime 終了時間
 * @returns 上映時間（分）
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const durationMs = end.getTime() - start.getTime();
  return Math.round(durationMs / (1000 * 60));
}