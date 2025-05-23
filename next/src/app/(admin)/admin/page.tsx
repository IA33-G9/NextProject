import Link from "next/link";

export default  function AdminDashboardPage() {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>管理者用のダッシュボードです。</p>
            <Link href={`/admin/movie`}>movie一覧</Link>
        </div>
    );
}