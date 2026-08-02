import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 如果 Supabase 环境变量未配置，跳过所有认证检查（本地模式）
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 保护花园页面
    if (!user && request.nextUrl.pathname.startsWith("/garden")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // 已登录用户访问登录/注册页面时重定向到花园
    if (
      user &&
      (request.nextUrl.pathname === "/auth/login" ||
        request.nextUrl.pathname === "/auth/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/garden";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.warn("Supabase middleware bypassed:", err instanceof Error ? err.message : err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/garden/:path*", "/auth/login", "/auth/register"],
};