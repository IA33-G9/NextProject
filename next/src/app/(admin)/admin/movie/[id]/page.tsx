'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ShowingSchedule from '@/app/_components/ShowingSchedule/ShowingSchedule';
import { Movie } from '@/type/movie/movie';

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
        console.log('Fetched movie data:', data); // デバッグ用
        setMovie(data);
        setEditedMovie(data); // 編集用の状態も初期化
        setLoading(false);
      } catch (err) {
        console.error('映画取得エラー:', err);
        setError('映画情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, router]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 編集内容を破棄して元の状態に戻す
    setEditedMovie(movie);
    setSaveError(null);
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
  };

  const handleSaveClick = async () => {
    if (!editedMovie) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      // showingsデータを適切な形式に変換
      const movieData = {
        ...editedMovie,
        showings: editedMovie.showings?.map(showing => ({
          startTime: showing.startTime,
          screenId: showing.screenId, // フロント側で選択されたscreenIdを使用
          price: showing.price
        })) || []
      };


      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);

        // より詳細なエラーメッセージを表示
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
      setIsEditing(false);
      setIsSaving(false);

      // 成功メッセージなどを表示できる
    } catch (err) {
      console.error('映画更新エラー:', err);
      setSaveError(err instanceof Error ? err.message : '映画情報の更新に失敗しました。もう一度お試しください。');
      setIsSaving(false);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>{error}</div>;
  if (!movie) return <div>映画情報が見つかりません</div>;

  // showingsがあるかチェック（undefined、null、空配列の場合に対応）
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画像URL
            </label>
            <input
                type="text"
                name="imageUrl"
                value={editedMovie?.imageUrl || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />

            {editedMovie?.imageUrl && (
                <div className="mt-2 relative w-32 h-48">
                  <Image
                      src={editedMovie.imageUrl}
                      alt="映画ポスタープレビュー"
                      fill
                      className="object-cover rounded"
                  />
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
                        value={showing.price || 1800}
                        onChange={(e) => {
                          const updated = [...(editedMovie.showings || [])];
                          updated[index] = {
                            ...updated[index],
                            price: parseInt(e.target.value) || 1800
                          };
                          setEditedMovie(prev => prev ? {...prev, showings: updated} : prev);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
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
                    screenId: screens.length > 0 ? screens[0].id : '', // 最初のスクリーンをデフォルトに
                    price: 1800 // デフォルト価格
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