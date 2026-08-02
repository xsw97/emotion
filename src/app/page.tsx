"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

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
      } catch {
        // Supabase 环境变量未配置，使用本地模式
        const localUser = localStorage.getItem('garden_local_user');
        if (localUser) {
          router.replace("/garden");
        } else {
          router.replace("/auth/login");
        }
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🌱</div>
        <p className="text-gray-500">花园正在苏醒...</p>
      </div>
    </div>
  );
}