// app/api/users/me/route.js - NextAuth.js用
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// 会員ランクの設定
const MEMBERSHIP_TIERS = [
  {
    rank: 'BRONZE',
    displayName: 'ブロンズ',
    minBookings: 0,
    minSpent: 0,
    benefits: ['基本予約機能', 'メール通知'],
    color: '#CD7F32'
  },
  {
    rank: 'SILVER',
    displayName: 'シルバー',
    minBookings: 5,
    minSpent: 15000,
    benefits: ['優先予約', '5%割引', 'SMS通知'],
    color: '#C0C0C0'
  },
  {
    rank: 'GOLD',
    displayName: 'ゴールド',
    minBookings: 15,
    minSpent: 45000,
    benefits: ['プレミア先行予約', '10%割引', 'ポイント2倍'],
    color: '#FFD700'
  },
  {
    rank: 'PLATINUM',
    displayName: 'プラチナ',
    minBookings: 30,
    minSpent: 100000,
    benefits: ['VIP席無料アップグレード', '15%割引', '専用サポート'],
    color: '#E5E4E2'
  }
];

// 予約データから統計を計算する関数
function calculateUserStats(bookings: any[]) {
  const completedBookings = bookings.filter(booking =>
    booking.status === 'COMPLETED' || booking.status === 'CONFIRMED'
  );

  const totalBookings = completedBookings.length;

  const totalSpent = completedBookings.reduce((sum, booking) => {
    // booking.totalPrice が存在する場合はそれを使用
    // そうでない場合は seats の数 × 基本料金で計算（例：1800円/席）
    const bookingPrice = booking.totalPrice || (booking.seats?.length || 1) * 1800;
    return sum + bookingPrice;
  }, 0);

  return {
    totalBookings,
    totalSpent
  };
}

// 会員ランクを決定する関数
function determineMembershipRank(totalBookings:number, totalSpent:number) {
  // 条件を満たす最高ランクを逆順で検索
  for (let i = MEMBERSHIP_TIERS.length - 1; i >= 0; i--) {
    const tier = MEMBERSHIP_TIERS[i];
    if (totalBookings >= tier.minBookings && totalSpent >= tier.minSpent) {
      return tier;
    }
  }
  // デフォルトはブロンズ
  return MEMBERSHIP_TIERS[0];
}

// 次のランクまでの進捗を計算する関数
function calculateRankProgress(currentRank:string, totalBookings:number, totalSpent:number) {
  const currentIndex = MEMBERSHIP_TIERS.findIndex(tier => tier.rank === currentRank);
  const nextTier = MEMBERSHIP_TIERS[currentIndex + 1];

  if (!nextTier) {
    return null; // 最高ランクの場合
  }

  const bookingsProgress = Math.min((totalBookings / nextTier.minBookings) * 100, 100);
  const spentProgress = Math.min((totalSpent / nextTier.minSpent) * 100, 100);

  return {
    nextRank: nextTier,
    bookingsNeeded: Math.max(0, nextTier.minBookings - totalBookings),
    spentNeeded: Math.max(0, nextTier.minSpent - totalSpent),
    bookingsProgress: Math.round(bookingsProgress),
    spentProgress: Math.round(spentProgress),
    overallProgress: Math.round(Math.min(bookingsProgress, spentProgress))
  };
}

async function getSessionUserId() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
}

async function getUserWithBookings(userId:string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          // 統計計算のために全ての予約を取得（表示は別途制限）
          include: {
            showing: {
              include: {
                screen: true,
                movie: true,
              }
            },
            seats: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 統計を計算
    const stats = calculateUserStats(user.bookings);

    // 会員ランクを決定
    const membershipTier = determineMembershipRank(stats.totalBookings, stats.totalSpent);

    // 次のランクへの進捗を計算
    const rankProgress = calculateRankProgress(membershipTier.rank, stats.totalBookings, stats.totalSpent);

    // パスワードを除外
    const { password, ...userWithoutPassword } = user;

    // 表示用に最新10件の予約のみに制限
    const recentBookings = user.bookings.slice(0, 10);

    // ユーザー情報を拡張して返す
    return {
      ...userWithoutPassword,
      bookings: recentBookings, // 表示用の制限された予約履歴
      // 統計情報を追加
      totalBookings: stats.totalBookings,
      totalSpent: stats.totalSpent,
      membershipLevel: membershipTier.displayName,
      membershipRank: membershipTier.rank,
      membershipColor: membershipTier.color,
      membershipBenefits: membershipTier.benefits,
      rankProgress: rankProgress
    };

  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const user = await getUserWithBookings(userId);
    return NextResponse.json(user);

  } catch (error) {
    console.error('API /users/me エラー:', error);

    return NextResponse.json(
      { error: 'ユーザーが見つかりません' },
      { status: 404 }
    );
  } finally {
    await prisma.$disconnect();
  }
}