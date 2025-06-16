import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

// サーバーサイドで管理者かどうかをチェックする関数
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const user =  await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    return user?.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// セッションを取得し、管理者権限をチェックする関数
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await checkIsAdmin(session.user.id);

  if (!isAdmin) {
    notFound();
  }

  return { session, isAdmin: true };
}