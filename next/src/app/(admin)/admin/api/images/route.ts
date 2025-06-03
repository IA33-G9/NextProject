//画像をアップロード,削除するAPIエンドポイント
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
     const file: File | null = (data.get('image') || data.get('file')) as unknown as File;

    if (!file) {
      return NextResponse.json(
        { message: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: '画像ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // アップロードディレクトリの準備
    const uploadDir = join(process.cwd(), 'public','uploads', 'image', 'movies'); // パスを変更

    // ディレクトリが存在しない場合は作成
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイル名を生成（タイムスタンプ + 拡張子）
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

    // 安全なファイル名を生成
    const safeName = originalName
      .replace(/\.[^/.]+$/, '') // 拡張子を除去
      .replace(/[^a-zA-Z0-9]/g, '_') // 英数字以外をアンダースコアに
      .substring(0, 50); // 長さを制限

    const fileName = `${timestamp}-${safeName}.${extension}`;

    // ファイルを保存
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 公開URLを生成
    const url = `/uploads/image/movies/${fileName}`

    return NextResponse.json({
      message: '画像が正常にアップロードされました',
      imageUrl: url,
      url, // フロントエンドが期待するキー名
      fileName
    });

  } catch (error: any) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json(
      { message: '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}



export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ message: '削除対象の画像URLが指定されていません' }, { status: 400 });
    }

    // public ディレクトリ以下のファイルパスに変換
    const publicPath = join(process.cwd(), 'public');
    const imagePath = join(publicPath, url);

    // ファイルの存在確認
    if (!existsSync(imagePath)) {
      return NextResponse.json({ message: '指定された画像ファイルが存在しません' }, { status: 404 });
    }

    // ファイル削除
    await unlink(imagePath);

    return NextResponse.json({ message: '画像が正常に削除されました' }, { status: 200 });

  } catch (error: any) {
    console.error('画像削除エラー:', error);
    return NextResponse.json({ message: '画像の削除に失敗しました' }, { status: 500 });
  }
}