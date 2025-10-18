import { Link } from "react-router-dom";

export default function Play() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-yellow-100">
      <h1 className="text-4xl font-bold mb-6">🎮 Play Page</h1>
      <p className="text-lg text-gray-700 mb-10">
        Choose an option to get started!
      </p>

      <div className="flex gap-6">
        <Link
          to="/Tutorial"
          className="rounded-2xl bg-green-500 px-8 py-3 text-white text-lg font-semibold shadow-lg transition hover:bg-green-600"
        >
          Tutorial
        </Link>

        <Link
          to="/Invest"
          className="rounded-2xl bg-blue-500 px-8 py-3 text-white text-lg font-semibold shadow-lg transition hover:bg-blue-600"
        >
          Start Invest
        </Link>
      </div>
    </div>
  );
}
