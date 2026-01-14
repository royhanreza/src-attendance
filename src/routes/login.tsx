import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { API_ENDPOINTS } from "../lib/api";
import type { LoginCredentials, LoginResponse } from "../lib/auth";
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const credentials: LoginCredentials = {
        username,
        password,
      };

      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN_EMPLOYEE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await response.json();

      if (data.error || !data.data) {
        setError(data.message || "Login gagal. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      login(data.data);
      navigate({ to: "/" });
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="p-8 bg-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-fuchsia-600 tracking-tight mb-2">
              Magenta Activity
            </h1>
            <p className="text-gray-500 text-sm">
              Silakan masuk untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-200" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all duration-200 bg-gray-50/50 focus:bg-white shadow-sm hover:border-gray-300"
                    placeholder="Masukkan username Anda"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="relative group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-200" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all duration-200 bg-gray-50/50 focus:bg-white shadow-sm hover:border-gray-300"
                    placeholder="Masukkan password Anda"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-fuchsia-600 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-700 font-medium flex-1">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-fuchsia-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} Magenta HRD. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
