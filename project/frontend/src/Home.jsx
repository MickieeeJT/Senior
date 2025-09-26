import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-green-100">
      <h1 className="mb-8 text-4xl font-bold">Welcome Home! 🎉</h1>

      <div className="flex gap-6">
        <Link
          to="/play"
          className="rounded-2xl bg-green-500 px-8 py-3 text-white text-lg font-semibold shadow-lg transition hover:bg-green-600"
        >
          Play
        </Link>

        <Link
          to="/score-history"
          className="rounded-2xl bg-blue-500 px-8 py-3 text-white text-lg font-semibold shadow-lg transition hover:bg-blue-600"
        >
          Score History
        </Link>
      </div>
    </div>
  );
}
