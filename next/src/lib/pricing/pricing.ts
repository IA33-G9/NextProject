import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// デフォルト料金設定
export const DEFAULT_PRICES = {
  GENERAL: 1800,
  STUDENT: 1600,
  YOUTH: 1400,
  CHILD: 1000,
} as const;

// 座席区画による料金調整（基本料金への乗数）
export const SECTION_MULTIPLIERS = {
  REGULAR: 1.0,
  PREMIUM: 1.2,
  VIP: 1.5,
} as const;

export type TicketType = 'GENERAL' | 'STUDENT' | 'YOUTH' | 'CHILD';
export type SeatSection = 'REGULAR' | 'PREMIUM' | 'VIP';

/**
 * 座席の料金を計算する
 * @param showingId 上映ID
 * @param seatId 座席ID
 * @param ticketType チケットタイプ
 * @returns 料金
 */
export async function calculateSeatPrice(
  showingId: string,
  seatId: string,
  ticketType: TicketType
): Promise<number> {
  try {
    // 上映情報と座席情報を取得
    const showing = await prisma.showing.findUnique({
      where: { id: showingId },
      select: { uniformPrice: true },
    });

    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!showing || !seat) {
      throw new Error('上映または座席が見つかりません');
    }

    // 一律料金が設定されている場合
    if (showing.uniformPrice !== null) {
      return showing.uniformPrice;
    }

    // デフォルト料金を使用する場合
    const basePrice = DEFAULT_PRICES[ticketType];

    return basePrice;
  } catch (error) {
    console.error('料金計算エラー:', error);
    throw error;
  }
}

/**
 * 予約の合計料金を計算する
 * @param showingId 上映ID
 * @param seatTickets 座席とチケットタイプの配列
 * @returns 合計料金
 */
export async function calculateTotalPrice(
  showingId: string,
  seatTickets: Array<{ seatId: string; ticketType: TicketType }>
): Promise<{
  totalPrice: number;
  seatPrices: Array<{ seatId: string; ticketType: TicketType; price: number }>;
}> {
  try {
    const seatPrices = await Promise.all(
      seatTickets.map(async ({ seatId, ticketType }) => {
        const price = await calculateSeatPrice(showingId, seatId, ticketType);
        return { seatId, ticketType, price };
      })
    );

    const totalPrice = seatPrices.reduce((sum, seat) => sum + seat.price, 0);

    return { totalPrice, seatPrices };
  } catch (error) {
    console.error('合計料金計算エラー:', error);
    throw error;
  }
}

/**
 * 座席情報を取得（区画情報を含む）
 * @param seatIds 座席ID配列
 * @returns 座席情報
 */
export async function getSeatsWithSection(seatIds: string[]) {
  try {
    return await prisma.seat.findMany({
      where: { id: { in: seatIds } },
      select: {
        id: true,
        row: true,
        column: true,
      },
    });
  } catch (error) {
    console.error('座席情報取得エラー:', error);
    throw error;
  }
}
