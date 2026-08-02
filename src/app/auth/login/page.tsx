"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/garden");
      router.refresh();
    } catch (err) {
      setError("登录失败，请检查网络连接");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            空中花园
          </h1>
          <p className="text-gray-500 mt-2">欢迎回到你的云端世界</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            登录
          </h2>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="text-center text-sm text-gray-500">
            还没有账号？{" "}
            <Link
              href="/auth/register"
              className="text-purple-400 hover:text-purple-500 font-medium"
            >
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}