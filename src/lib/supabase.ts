// 本地用户存储 key
const LOCAL_USER_KEY = 'garden_local_user';

export interface LocalUser {
  id: string;
  email: string;
  username: string;
}

// 检查 Supabase 是否已配置（支持 COZE_ 前缀和 NEXT_PUBLIC_ 前缀）
function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
  if (url && key) return { url, key };
  return null;
}

// 生成本地用户 ID
function generateLocalId(): string {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// 获取本地存储的用户
function getLocalUser(): LocalUser | null {
  try {
    const data = localStorage.getItem(LOCAL_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// 保存本地用户
function saveLocalUser(user: LocalUser): void {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

// 清除本地用户
function clearLocalUser(): void {
  localStorage.removeItem(LOCAL_USER_KEY);
}

// ============ 导出统一客户端 ============

export const createClient = () => {
  // 如果 Supabase 已配置，使用真实的 Supabase 客户端
  const config = getSupabaseConfig();
  if (config) {
    // 动态导入避免在未配置时崩溃
    const { createBrowserClient } = require('@supabase/ssr');
    return createBrowserClient(config.url, config.key);
  }

  // 本地模式：返回一个兼容 Supabase Auth API 的 mock 对象
  return {
    auth: {
      // 获取当前用户（本地模式）
      getUser: async () => {
        const user = getLocalUser();
        return { data: { user }, error: null };
      },

      // 邮箱密码注册（本地模式）
      signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string } } }) => {
        // 先登出当前用户
        clearLocalUser();

        // 检查是否已注册（本地存储里记录已注册的邮箱）
        const registered = JSON.parse(localStorage.getItem('garden_registered_users') || '{}');
        if (registered[email]) {
          return { data: { user: null }, error: { message: '该邮箱已注册' } };
        }

        const newUser: LocalUser = {
          id: generateLocalId(),
          email,
          username: options?.data?.username || email.split('@')[0],
        };

        // 保存注册信息
        registered[email] = { password, user: newUser };
        localStorage.setItem('garden_registered_users', JSON.stringify(registered));

        // 自动登录
        saveLocalUser(newUser);

        return { data: { user: newUser, session: { access_token: 'local_' + newUser.id } }, error: null };
      },

      // 邮箱密码登录（本地模式）
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const registered = JSON.parse(localStorage.getItem('garden_registered_users') || '{}');
        const record = registered[email];

        if (!record) {
          return { data: { user: null }, error: { message: '该邮箱未注册' } };
        }

        if (record.password !== password) {
          return { data: { user: null }, error: { message: '密码错误' } };
        }

        // 登录成功
        saveLocalUser(record.user);

        return { data: { user: record.user, session: { access_token: 'local_' + record.user.id } }, error: null };
      },

      // 登出（本地模式）
      signOut: async () => {
        clearLocalUser();
        return { error: null };
      },

      // 获取会话（本地模式）
      getSession: async () => {
        const user = getLocalUser();
        return { data: { session: user ? { access_token: 'local_' + user.id, user } : null }, error: null };
      },

      // 订阅认证状态变化（本地模式-空实现）
      onAuthStateChange: () => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    // 其他 Supabase 方法
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { code: 'PGRST116', message: 'Local mode' } }),
          order: () => ({ data: [], error: null }),
        }),
        single: async () => ({ data: null, error: { code: 'PGRST116', message: 'Local mode' } }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
  };
};

// 获取当前用户（供页面组件使用）
export const getCurrentUser = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};