import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PrismaClient } from '@/generated/prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// QRコードに含めるデータの構造
interface QRCodeData {
  bookingId: string;
  bookingReference: string;
  movieTitle: string;
  showingId: string;
  startTime: string;
  seats: string[];
  totalPrice: number;
  timestamp: number; // QRコード生成時刻
  hash: string; // 改ざん防止用ハッシュ
}

// ハッシュ生成関数
function generateHash(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Booking ID is required' },
      { status: 400 }
    );
  }

  try {
    // 予約情報を取得
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showing: {
          include: {
            movie: true,
            screen: {
              include: {
                cinema: true
              }
            }
          }
        },
        seats: {
          include: {
            seat: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 予約が確定済みかチェック
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Booking is not confirmed' },
        { status: 400 }
      );
    }

    // 座席情報を文字列形式に変換
    const seatLabels = booking.seats.map(bs => `${bs.seat.row}${bs.seat.column}`);

    // QRコードに含めるデータを準備
    const qrData: QRCodeData = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      movieTitle: booking.showing.movie.title,
      showingId: booking.showingId,
      startTime: booking.showing.startTime.toISOString(),
      seats: seatLabels,
      totalPrice: booking.totalPrice,
      timestamp: Date.now(),
      hash: '' // 後で設定
    };

    // ハッシュを生成（環境変数から秘密鍵を取得）
    const secret = process.env.QR_SECRET_KEY || 'default-secret-key';
    const { hash, ...dataWithoutHash } = qrData;
    qrData.hash = generateHash(JSON.stringify(dataWithoutHash), secret);

    // QRコードを生成
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // レスポンスを返す
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      bookingReference: booking.bookingReference,
      movieTitle: booking.showing.movie.title,
      startTime: booking.showing.startTime.toISOString(),
      seats: seatLabels,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後に期限切れ
    });

  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 他のHTTPメソッドを無効化
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}