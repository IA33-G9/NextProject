//上映映画の情報を取得するapi
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
    ) {
    const {id} = await params;

    try {
        const showing = await prisma.showing.findUnique({
        where: { id },
        include: {
            movie: true,
            screen: true,
        },
        });

        if (!showing) {
        return NextResponse.json(
            { message: '上映情報が見つかりません。' },
            { status: 404 }
        );
        }

        return NextResponse.json(showing);
    } catch (error) {
        console.error('上映情報取得エラー:', error);
        return NextResponse.json(
        { message: '上映情報の取得に失敗しました。' },
        { status: 500 }
        );
    }
    }
