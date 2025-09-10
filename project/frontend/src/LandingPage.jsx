import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-lg text-center space-y-6">
                <h1 className="text-3xl font-bold">Welcome</h1>
                <p className="text-gray-600">Choose an option to continue</p>
                <div className="flex gap-4 justify-center">
                    <Link
                        to="/login"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/signup"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
