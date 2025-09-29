'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ShowingSchedule from '@/app/_components/ShowingSchedule/ShowingSchedule';

export type Movie = {
  id: string;
  title: string;
  releaseDate: string;
  duration: number;
  genre: string;
  description?: string;
  director: string;
  casts: string;
  imageUrl?: string;
  trailerUrl?: string;
  showings: any[];
  showingCount: number;
};

// スクリーンの型定義
interface Screen {
  id: string;
  number: string;
  cinema: {
    id: string;
    name: string;
  };
}

export default function MovieDetailPage({
  params: paramsPromise
}: {
  params: Promise<{ id: string }>;
}) {
  // React.use()を使ってparamsを解決する
  const params = use(paramsPromise);
  const movieId = params.id;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMovie, setEditedMovie] = useState<Movie | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);

  // 画像アップロード関連の状態
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // 元の画像URLを保存

  const router = useRouter();

  // スクリーン一覧を取得
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const response = await fetch('/api/screens');
        if (response.ok) {
          const screensData = await response.json();
          setScreens(screensData);
        }
      } catch (err) {
        console.error('スクリーン取得エラー:', err);
      }
    };

    if (isEditing) {
      fetchScreens();
    }
  }, [isEditing]);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/movies/${movieId}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/not-found');
            return;
          }
          throw new Error('映画情報の取得に失敗しました');
        }

        const data = await response.json();
        console.log('Fetched movie data:', data);
        setMovie(data);
        setEditedMovie(data);
        setPreviewUrl(data.imageUrl); // プレビュー画像も設定
        setOriginalImageUrl(data.imageUrl); // 元の画像URLを保存
        setLoading(false);
      } catch (err) {
        console.error('映画取得エラー:', err);
        setError('映画情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, router]);

  // 既存画像を削除する関数
  const deleteExistingImage = async (imageUrl: string) => {
    try {
      const response = await fetch('/admin/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        console.error('既存画像の削除に失敗しました:', await response.text());
        // 削除に失敗してもアップロードは継続する
      }
    } catch (err) {
      console.error('既存画像削除エラー:', err);
      // エラーが発生してもアップロードは継続する
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズ制限 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルを選択してください');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // 既存の画像がある場合は削除
      if (previewUrl && previewUrl !== originalImageUrl) {
        await deleteExistingImage(previewUrl);
      } else if (originalImageUrl && originalImageUrl !== previewUrl) {
        await deleteExistingImage(originalImageUrl);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/admin/api/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ファイルのアップロードに失敗しました');
      }

      const data = await response.json();
      const imageUrl = data.url;

      // プレビューと編集中のデータを更新
      setPreviewUrl(imageUrl);
      setEditedMovie(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          imageUrl: imageUrl
        };
      });

    } catch (err) {
      console.error('アップロードエラー:', err);
      setUploadError(err instanceof Error ? err.message : 'ファイルのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setPreviewUrl(movie?.imageUrl || null);
    setOriginalImageUrl(movie?.imageUrl || null);
  };

  const handleDeleteClick = async　() => {
    if (!window.confirm(`「${movie?.title}」を削除してもよろしいですか？\nこの操作は取り消すことができません。`)) {
        return
    }

    try {
      const response = await fetch(`/admin/api/movies/${movieId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.bookingCount) {
          throw new Error(
              `この映画には${data.bookingCount}件の予約が存在するため削除できません。\n`
          );
        }
        throw new Error(data.error || '映画の削除に失敗しました');
      }

      alert('映画を削除しました。');
      router.push('/admin/movie');

    } catch (err) {
      console.error('映画情報削除エラー:', err);
      // エラーが発生してもアップロードは継続する
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMovie(movie);
    setPreviewUrl(movie?.imageUrl || null);
    setOriginalImageUrl(movie?.imageUrl || null);
    setSaveError(null);
    setUploadError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedMovie(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });

    // 画像URLが手動で変更された場合、プレビューも更新
    if (name === 'imageUrl') {
      setPreviewUrl(value);
    }
  };

  // 画像を削除する関数
  const handleImageDelete = async () => {
    if (previewUrl) {
      try {
        // アップロードされた画像の場合は物理削除も実行
        if (previewUrl !== originalImageUrl) {
          await deleteExistingImage(previewUrl);
        }
      } catch (err) {
        console.error('画像削除エラー:', err);
      }
    }

    setPreviewUrl(null);
    setEditedMovie(prev => prev ? {...prev, imageUrl: ''} : prev);
  };

  const handleSaveClick = async () => {
    if (!editedMovie) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      // 保存時に、元の画像と異なる場合は元の画像を削除
      if (originalImageUrl &&
          originalImageUrl !== editedMovie.imageUrl &&
          editedMovie.imageUrl !== '') {
        await deleteExistingImage(originalImageUrl);
      }

      const movieData = {
        ...editedMovie,
        showings: editedMovie.showings?.map(showing => ({
          startTime: showing.startTime,
          screenId: showing.screenId,
          uniformPrice: showing.uniformPrice
        })) || []
      };

      const response = await fetch(`/admin/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);

        if (errorData.error?.includes('screen')) {
          throw new Error('スクリーン情報が見つかりません。管理者にお問い合わせください。');
        } else if (errorData.error?.includes('Foreign key')) {
          throw new Error('データベースの関連性エラーが発生しました。管理者にお問い合わせください。');
        } else {
          throw new Error(errorData.error || '映画情報の更新に失敗しました');
        }
      }

      const updatedMovie = await response.json();
      setMovie(updatedMovie);
      setEditedMovie(updatedMovie);
      setOriginalImageUrl(updatedMovie.imageUrl); // 新しい画像URLを元のURLとして保存
      setIsEditing(false);
      setIsSaving(false);

    } catch (err) {
      console.error('映画更新エラー:', err);
      setSaveError(err instanceof Error ? err.message : '映画情報の更新に失敗しました。もう一度お試しください。');
      setIsSaving(false);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!movie) return <div>映画情報が見つかりません</div>;

  const hasShowings = movie.showings && movie.showings.length > 0;

  // 表示モード
  if (!isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin/movie" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            映画一覧に戻る
          </Link>

          <button
            onClick={handleDeleteClick}
            className="bg-red-400 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
          >
            削除する
          </button>

          <button
            onClick={handleEditClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            編集する
          </button>

        </div>

        <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:w-1/3 lg:w-1/4">
            <div className="relative w-full h-96 md:h-full">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">画像なし</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>

            <div className="flex flex-wrap text-sm text-gray-600 mb-4">
              <span className="mr-4">{new Date(movie.releaseDate).toLocaleDateString('ja-JP')} 公開</span>
              <span className="mr-4">{movie.duration}分</span>
              <span>{movie.genre}</span>
            </div>

            {movie.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">あらすじ</h2>
                <p className="text-gray-700">{movie.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">スタッフ・キャスト</h2>
              <p className="mb-1"><span className="font-medium">監督:</span> {movie.director}</p>
              <p><span className="font-medium">出演:</span> {movie.casts}</p>
            </div>

            {movie.trailerUrl && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">予告編</h2>
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  予告編を見る
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>

        {hasShowings ? (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">上映スケジュール</h2>
            <ShowingSchedule showings={movie.showings} />
          </div>
        ) : (
          <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-700">現在この映画の上映予定はありません。</p>
          </div>
        )}
      </div>
    );
  }

  // 編集モード
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleCancelEdit}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          キャンセル
        </button>

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className={`${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white font-medium py-2 px-4 rounded`}
        >
          {isSaving ? '保存中...' : '変更を保存'}
        </button>
      </div>

      {saveError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {saveError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
                type="text"
                name="title"
                value={editedMovie?.title || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公開日
              </label>
              <input
                  type="date"
                  name="releaseDate"
                  value={editedMovie?.releaseDate ? new Date(editedMovie.releaseDate).toISOString().split('T')[0] : ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上映時間（分）
              </label>
              <input
                  type="number"
                  name="duration"
                  value={editedMovie?.duration || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ジャンル
              </label>
              <input
                  type="text"
                  name="genre"
                  value={editedMovie?.genre || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 画像アップロード機能 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              映画ポスター画像
            </label>

            <div className="space-y-4">
              {/* ファイルアップロード */}
              <div>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-blue-500">アップロード中...</span>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">クリックしてファイルを選択</span> またはドラッグ&ドロップ
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (最大5MB)</p>
                          {previewUrl && (
                            <p className="text-xs text-orange-600 mt-1">
                              ※ 新しい画像を選択すると既存の画像は削除されます
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {uploadError && (
                  <div className="mt-2 text-sm text-red-600">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* URLでの直接入力 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  または画像URLを直接入力
                </label>
                <input
                    type="text"
                    name="imageUrl"
                    value={editedMovie?.imageUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 画像プレビュー */}
            {previewUrl && (
                <div className="mt-4">
                  <div className="relative w-32 h-48 border border-gray-200 rounded overflow-hidden">
                    <Image
                        src={previewUrl}
                        alt="映画ポスタープレビュー"
                        fill
                        className="object-cover"
                        onError={() => {
                          setPreviewUrl(null);
                          setUploadError('画像の読み込みに失敗しました');
                        }}
                    />
                  </div>
                  <button
                    onClick={handleImageDelete}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    画像を削除
                  </button>
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              あらすじ
            </label>
            <textarea
                name="description"
                value={editedMovie?.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              監督
            </label>
            <input
                type="text"
                name="director"
                value={editedMovie?.director || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              出演者
            </label>
            <input
                type="text"
                name="casts"
                value={editedMovie?.casts || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予告編URL
            </label>
            <input
                type="text"
                name="trailerUrl"
                value={editedMovie?.trailerUrl || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              上映スケジュール
            </label>

            {editedMovie?.showings?.map((showing, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">上映時間</label>
                    <input
                        type="datetime-local"
                        value={new Date(showing.startTime).toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const updated = [...(editedMovie.showings || [])];
                          updated[index] = {
                            ...updated[index],
                            startTime: new Date(e.target.value).toISOString()
                          };
                          setEditedMovie(prev => prev ? {...prev, showings: updated} : prev);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="w-48">
                    <label className="block text-xs text-gray-500 mb-1">スクリーン</label>
                    <select
                        value={showing.screenId || ''}
                        onChange={(e) => {
                          const updated = [...(editedMovie.showings || [])];
                          updated[index] = {
                            ...updated[index],
                            screenId: e.target.value
                          };
                          setEditedMovie(prev => prev ? {...prev, showings: updated} : prev);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">スクリーンを選択</option>
                      {screens.map((screen) => (
                        <option key={screen.id} value={screen.id}>
                          {screen.cinema.name} - {screen.number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">料金（円）</label>
                    <input
                        type="number"
                        value={showing.uniformPrice || ''}
                        onChange={(e) => {
                          const updated = [...(editedMovie.showings || [])];
                          updated[index] = {
                            ...updated[index],
                            uniformPrice: e.target.value === '' ? null : parseInt(e.target.value) || null
                          };
                          setEditedMovie(prev => prev ? {...prev, showings: updated} : prev);
                        }}
                        placeholder="空間可"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      { showing.uniformPrice ? `一律${showing.uniformPrice}円` : 'デフォルト料金体系' }
                    </div>
                  </div>
                  <button
                      onClick={() => {
                        const updated = editedMovie.showings?.filter((_, i) => i !== index) || [];
                        setEditedMovie(prev => prev ? {...prev, showings: updated} : prev);
                      }}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
            ))}

            <button
                onClick={() => {
                  const newShowing = {
                    startTime: new Date().toISOString(),
                    screenId: screens.length > 0 ? screens[0].id : '',
                    uniformPrice: null
                  };
                  setEditedMovie(prev => prev ? {
                    ...prev,
                    showings: [...(prev.showings || []), newShowing]
                  } : prev);
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              スケジュールを追加
            </button>
          </div>

        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
            onClick={handleCancelEdit}
            className="mr-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
        >
          キャンセル
        </button>

        <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`${
                isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
            } text-white font-medium py-2 px-4 rounded`}
        >
          {isSaving ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </div>
  );
}