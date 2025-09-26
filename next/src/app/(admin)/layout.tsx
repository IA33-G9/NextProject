import {requireAdmin} from "@/lib/isAdmin/isAdmin";
import Link from "next/link";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // サーバーサイドで管理者権限をチェック
  await requireAdmin();

  return (
    <div className="admin-layout">
      <nav className="admin-nav bg-blue-600 text-white p-4">
        <Link href={"/admin"}><h1 className="text-xl font-bold">管理者パネル</h1></Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}