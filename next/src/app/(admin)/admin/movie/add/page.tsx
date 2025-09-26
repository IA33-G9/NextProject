'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 映画の初期データ
const initialMovieData = {
  title: '',
  description: '',
  releaseDate: '',
  imageUrl: '',
  trailerUrl: '',
  genre: '',
  director: '',
  casts: '',
  duration: 0
};

// 上映時間の初期データ
const initialShowingData = {
  startTime: '',
  uniformPrice: null,
  screenId: '',
  duration: 0
};

export default function AddMoviePage() {
  const [movieData, setMovieData] = useState(initialMovieData);
  const [showings, setShowings] = useState<Array<{
    startTime: string;
    uniformPrice: number | null;
    screenId: string;
  }>>([]);
  const [newShowing, setNewShowing] = useState(initialShowingData);
  const [screens, setScreens] = useState<Array<{ id: string; number: string; cinema :{name:string}}>>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingScreens, setFetchingScreens] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  // スクリーン情報を取得
  useState(() => {
    const fetchScreens = async () => {
      try {
        const response = await fetch('/api/screens');
        if (!response.ok) {
          throw new Error('スクリーン情報の取得に失敗しました');
        }
        const data = await response.json();
        setScreens(data);
      } catch (err) {
        console.error('スクリーン取得エラー:', err);
        setError('スクリーン情報の読み込みに失敗しました');
      } finally {
        setFetchingScreens(false);
      }
    };

    fetchScreens();
  });

  // 映画情報入力ハンドラ
  const handleMovieInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMovieData({
      ...movieData,
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    });

    // 上映時間の初期データを更新
    if (name === 'duration') {
      setNewShowing({
        ...newShowing,
        duration: parseInt(value) || 0
      });
    }
  };

  // 画像ファイル選択ハンドラ
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルタイプの検証
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      // ファイルサイズの検証（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      setImageFile(file);

      // プレビュー画像を作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // URLフィールドをクリア
      setMovieData({
        ...movieData,
        imageUrl: ''
      });
    }
  };

  // 画像アップロード関数
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/admin/api/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '画像のアップロードに失敗しました');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  // 上映情報入力ハンドラ
  const handleShowingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewShowing({
      ...newShowing,
      [name]: name === 'uniformPrice' ? (value === '' ? null : parseInt(value) || 0) : value
    });
  };

  // 上映時間追加ハンドラ
  const handleAddShowing = () => {
    if (!newShowing.startTime || !newShowing.screenId) {
      alert('上映開始時間とスクリーンを選択してください');
      return;
    }

    // 映画の長さを基に終了時間を計算
    const startDateTime = new Date(newShowing.startTime);
    const endDateTime = new Date(startDateTime.getTime() + movieData.duration * 60 * 1000);

    // 上映時間の重複チェック
    const isOverlapping = showings.some(showing => {
      const showingStart = new Date(showing.startTime);
      const showingEnd = new Date(showingStart.getTime() + movieData.duration * 60 * 1000);

      return showing.screenId === newShowing.screenId &&
        ((startDateTime >= showingStart && startDateTime < showingEnd) ||
         (endDateTime > showingStart && endDateTime <= showingEnd));
    });

    if (isOverlapping) {
      alert('同じスクリーンで上映時間が重複しています');
      return;
    }

    setShowings([...showings, { ...newShowing }]);
    setNewShowing({ ...initialShowingData, duration: movieData.duration });
  };

  // 上映時間削除ハンドラ
  const handleRemoveShowing = (index: number) => {
    const newShowings = [...showings];
    newShowings.splice(index, 1);
    setShowings(newShowings);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showings.length === 0) {
      alert('少なくとも1つの上映時間を設定してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let finalImageUrl = movieData.imageUrl;

      // 画像ファイルがある場合はアップロード
      if (imageFile) {
        setUploadingImage(true);
        try {
          finalImageUrl = await uploadImage(imageFile);
        } catch (uploadError: any) {
          throw new Error(`画像アップロードエラー: ${uploadError.message}`);
        } finally {
          setUploadingImage(false);
        }
      }

      // 映画と上映時間を含むデータを準備
      const movieWithShowings = {
        ...movieData,
        imageUrl: finalImageUrl,
        showings: showings.map(showing => ({
          startTime: showing.startTime,
          uniformPrice: showing.uniformPrice,
          screenId: showing.screenId,
          // 終了時間を計算
          endTime: new Date(new Date(showing.startTime).getTime() + movieData.duration * 60 * 1000).toISOString()
        }))
      };

      // API呼び出し
      const response = await fetch('/admin/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieWithShowings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '映画の登録に失敗しました');
      }

      const data = await response.json();
      router.push(`/admin/movie/${data.id}`);
    } catch (err: any) {
      console.error('映画登録エラー:', err);
      setError(err.message || '映画の登録処理中にエラーが発生しました');
      setLoading(false);
    }
  };

  // 画面表示
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/movie" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        映画一覧に戻る
      </Link>

      <h1 className="text-3xl font-bold mb-8">新しい映画を追加</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 映画基本情報セクション */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">映画情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={movieData.title}
                onChange={handleMovieInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">あらすじ</label>
              <textarea
                name="description"
                value={movieData.description}
                onChange={handleMovieInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公開日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="releaseDate"
                value={movieData.releaseDate}
                onChange={handleMovieInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上映時間（分） <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="duration"
                value={movieData.duration}
                onChange={handleMovieInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="genre"
                value={movieData.genre}
                onChange={handleMovieInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">監督 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="director"
                value={movieData.director}
                onChange={handleMovieInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">出演者 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="casts"
                value={movieData.casts}
                onChange={handleMovieInputChange}
                required
                placeholder="例: 山田太郎, 佐藤花子, 田中次郎"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ポスター画像セクション */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ポスター画像</label>

              {/* ファイルアップロード */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">画像ファイルをアップロード</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">対応形式: JPG, PNG, GIF など（最大5MB）</p>
              </div>

              {/* 区切り線 */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-sm text-gray-500">または</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* URL入力 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">画像URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={movieData.imageUrl}
                  onChange={handleMovieInputChange}
                  placeholder="https://example.com/movie-poster.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!imageFile}
                />
              </div>

              {/* 画像プレビュー */}
              {(imagePreview || movieData.imageUrl) && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-2">プレビュー</label>
                  <div className="w-48 h-64 border border-gray-300 rounded-md overflow-hidden">
                    <img
                      src={imagePreview || movieData.imageUrl}
                      alt="プレビュー"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('画像の読み込みに失敗しました:', e.currentTarget.src);
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDE5MiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik05NiAxMjhMMTI4IDk2TDE2MCA1NC0zMiA5NloiIGZpbGw9IiNEMUQ1REIiLz4KPGV5Y2xlIGN4PSI3MiIgY3k9Ijc4IiByPSI2IiBmaWxsPSIjRDFENURCIi8+Cjx0ZXh0IHg9Ijk2IiB5PSIxNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiI+5pCs5ZGV44Od44K544K/44O8PC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      ファイルを削除
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">予告編URL</label>
              <input
                type="url"
                name="trailerUrl"
                value={movieData.trailerUrl}
                onChange={handleMovieInputChange}
                placeholder="https://youtube.com/watch?v=xxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 上映スケジュールセクション */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">上映スケジュール</h2>

          {/* スケジュール追加フォーム */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">スクリーン <span className="text-red-500">*</span></label>
              <select
                name="screenId"
                value={newShowing.screenId}
                onChange={handleShowingInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={fetchingScreens}
              >
                <option value="">スクリーンを選択</option>
                {screens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.cinema.name} - スクリーン{screen.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上映開始時間 <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                name="startTime"
                value={newShowing.startTime}
                onChange={handleShowingInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  一律料金（円）
              <span className="text-xs text-gray-500 ml-2">※空欄の場合はデフォルト料金体系</span>
              </label>
              <input
                type="number"
                name="uniformPrice"
                value={newShowing.uniformPrice || ''}
                onChange={handleShowingInputChange}
                min="0"
                step="100"
                placeholder="例: 1000（空欄可）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                空欄の場合: 一般1800円/大学生1600円/中高生1400円/小学生・幼児1000円
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddShowing}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
              disabled={!movieData.duration}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              上映時間を追加
            </button>
          </div>

          {/* 上映スケジュール一覧 */}
          {showings.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">登録済み上映スケジュール</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スクリーン</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">終了時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">料金</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {showings.map((showing, index) => {
                      // スクリーン情報を取得
                      const screen = screens.find(s => s.id === showing.screenId);

                      // 開始・終了時間を計算
                      const startTime = new Date(showing.startTime);
                      const endTime = new Date(startTime.getTime() + movieData.duration * 60 * 1000);

                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {screen ? `${screen.cinema.name} - スクリーン${screen.number}` : '不明なスクリーン'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {startTime.toLocaleString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {endTime.toLocaleString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {showing.uniformPrice ? (
                              <span className="text-blue-600 font-medium">
                              一律 {showing.uniformPrice.toLocaleString()}円
                            </span>
                            ) : (
                              <span className="text-gray-600">
                              デフォルト料金体系
                            </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleRemoveShowing(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <p className="text-yellow-700">上映スケジュールが登録されていません。少なくとも1つの上映時間を追加してください。</p>
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md flex items-center disabled:bg-blue-300"
          >
            {uploadingImage ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                画像アップロード中...
              </>
            ) : loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                処理中...
              </>
            ) : (
              <>
                映画を登録する
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}