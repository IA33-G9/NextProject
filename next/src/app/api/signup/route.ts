import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { UserIdGenerator } from '@/lib/generateId/id';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const snowflake = new UserIdGenerator(
  new Date('2024-01-01'), // エポック時間の開始日
  1  // インスタンスID
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // バリデーション
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスは必須です' },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        id: snowflake.generate(), // 既にstring型で生成される
        email,
        username,
        password: hashedPassword,
      }
    });

    return NextResponse.json(
      {
        message: 'ユーザーが正常に作成されました',
        user: {
          id: user.id, // toStringの変換は不要
          email: user.email,
          username: user.username
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error: In signup user ', error);
    return NextResponse.json(
      { error: 'ユーザー作成中にエラーが発生しました' },
      { status: 500 }
    );

  }
  finally {
    await prisma.$disconnect();
  }
}