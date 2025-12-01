import Link from "next/link";

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
                    <p className="text-gray-800 text-xl font-medium">管理者用のダッシュボードです。</p>
                </div>
                
                <div className="flex flex-col gap-6">
                    <Link 
                        href={`/admin/movie`}
                        className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-8 px-8 rounded-lg text-center transition-all shadow-md hover:shadow-lg border border-gray-200"
                    >
                        <div className="text-xl mb-2">映画一覧画面</div>
                        <div className="text-sm text-gray-600 font-normal">
                            すべての映画一覧を表示し、<br />
                            各映画の編集・削除を行えます
                        </div>
                    </Link>
                    
                    <Link 
                        href={`/admin/movie/add`}
                        className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-8 px-8 rounded-lg text-center transition-all shadow-md hover:shadow-lg border border-gray-200"
                    >
                        <div className="text-xl mb-2">映画情報登録画面</div>
                        <div className="text-sm text-gray-600 font-normal">
                            新規映画情報と<br />
                            上映スケジュールの登録を行えます
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
