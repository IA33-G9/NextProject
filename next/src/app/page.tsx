import Link  from "next/link";
import ClientSession from "@/app/_components/ClientSession/ClientSession";

export default function Home() {
  return (
    <div>
      top
      <Link
        href={`/movie`}
      >
        映画一覧
      </Link>
      <ClientSession/>
    </div>
  );
}
