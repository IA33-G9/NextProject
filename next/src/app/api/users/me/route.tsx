// app/api/users/me/route.js - NextAuth.js用
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';


const prisma = new PrismaClient();

async function getSessionUserId() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
}

async function getUserWithBookings(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            showing: {
              include: {
                screen: true,
                movie:true,
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

    // パスワードを除外
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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