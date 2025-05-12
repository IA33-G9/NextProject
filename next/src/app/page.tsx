import Image from "next/image";
import Link  from "next/link";

export default function Home() {
  return (
    <div>
      top
              <Link
                href={`/movie`}
              >
                映画一覧
              </Link>
    </div>
  );
}
