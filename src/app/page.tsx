"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace("/garden");
        } else {
          router.replace("/auth/login");
        }
      } catch (err) {
        // Supabase 环境变量未配置，显示手动入口
        setError("数据库服务未配置");
      }
    };
    checkAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-6">🌸</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            空中花园
          </h1>
          <p className="text-gray-500 mb-8">欢迎来到你的云端世界</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
            >
              登录
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 rounded-xl bg-white/80 backdrop-blur-md text-gray-700 font-medium hover:bg-white transition-all shadow border border-gray-200"
            >
              注册
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🌱</div>
        <p className="text-gray-500">花园正在苏醒...</p>
      </div>
    </div>
  );
}