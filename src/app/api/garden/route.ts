import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 创建服务端 Supabase 客户端（用于验证 token）
function createSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
}

// 获取当前用户
async function getUserId(request: NextRequest) {
  const session = request.headers.get("x-session");
  if (session) {
    // 通过 token 验证
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
        auth: { persistSession: false },
      }
    );
    const { data } = await supabase.auth.getUser(session);
    return data.user?.id;
  }

  // 通过 cookie 验证
  const supabase = createSupabaseClient(request);
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

// GET /api/garden - 获取用户花园数据
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const supabase = createSupabaseClient(request);
    const { data, error } = await supabase
      .from("user_gardens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ garden: data || null });
  } catch (err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/garden - 创建或更新用户花园数据
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createSupabaseClient(request);

    // 检查是否已有花园数据
    const { data: existing } = await supabase
      .from("user_gardens")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from("user_gardens")
        .update(body)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ garden: data });
    } else {
      // 创建
      const { data, error } = await supabase
        .from("user_gardens")
        .insert({ user_id: userId, ...body })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ garden: data });
    }
  } catch (err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}