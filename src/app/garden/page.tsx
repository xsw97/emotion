'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase';

// ============ 情绪数据 ============
const MOODS = [
  { emoji: '😊', label: '非常开心', value: 5, color: '#FFD700' },
  { emoji: '🙂', label: '开心', value: 4, color: '#87CEEB' },
  { emoji: '😐', label: '一般', value: 3, color: '#B0C4DE' },
  { emoji: '😔', label: '低落', value: 2, color: '#778899' },
  { emoji: '😢', label: '很难过', value: 1, color: '#483D8B' },
];

const WEATHERS = {
  5: { name: 'sunny', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', particles: 'sunshine' },
  4: { name: 'clear', bg: 'linear-gradient(135deg, #87CEEB, #98FB98)', particles: 'cloud' },
  3: { name: 'cloudy', bg: 'linear-gradient(135deg, #B0C4DE, #D3D3D3)', particles: 'wind' },
  2: { name: 'rainy', bg: 'linear-gradient(135deg, #778899, #A9A9A9)', particles: 'rain' },
  1: { name: 'stormy', bg: 'linear-gradient(135deg, #483D8B, #4A0080)', particles: 'storm' },
};

const TASKS = [
  { id: 'breath', name: '深呼吸', icon: '🫁', desc: '引导式呼吸练习', reward: { sunshine: 15, nutrient: 10 } },
  { id: 'gratitude', name: '感恩日记', icon: '📝', desc: '写下今天感恩的事', reward: { sunshine: 20, nutrient: 15 } },
  { id: 'meditation', name: '正念冥想', icon: '🧘', desc: '5分钟冥想计时', reward: { sunshine: 30, nutrient: 25 } },
  { id: 'affirmation', name: '自我对话', icon: '💬', desc: '积极自我肯定', reward: { sunshine: 12, nutrient: 8 } },
  { id: 'music', name: '音乐放松', icon: '🎵', desc: '聆听放松音乐', reward: { sunshine: 18, nutrient: 12 } },
];

const LEVELS = [
  { level: 1, name: '种子', threshold: 0 },
  { level: 2, name: '发芽', threshold: 50 },
  { level: 3, name: '成长', threshold: 150 },
  { level: 4, name: '茂盛', threshold: 300 },
  { level: 5, name: '花园王国', threshold: 500 },
];

const PLANTS = [
  { id: 'flower-1', name: '粉色小花', icon: '🌸', unlockLevel: 1 },
  { id: 'grass-1', name: '小草', icon: '🌿', unlockLevel: 1 },
  { id: 'flower-2', name: '金色花朵', icon: '🌼', unlockLevel: 2 },
  { id: 'tree-1', name: '小树苗', icon: '🌳', unlockLevel: 2 },
  { id: 'flower-3', name: '紫色花朵', icon: '💜', unlockLevel: 3 },
  { id: 'tree-2', name: '大树', icon: '🌲', unlockLevel: 4 },
];

export default function GardenPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState<number>(3);
  const [moodRecords, setMoodRecords] = useState<any[]>([]);
  const [gardenState, setGardenState] = useState({
    level: 1, sunshine: 0, nutrient: 0, plants: [] as any[]
  });
  const [showMoodPanel, setShowMoodPanel] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showPlantPanel, setShowPlantPanel] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [plantMode, setPlantMode] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [taskProgress, setTaskProgress] = useState<string>('');
  const [streak, setStreak] = useState(0);
  const [rainDrops, setRainDrops] = useState<{left: number; delay: number; duration: number}[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gardenRef = useRef<HTMLDivElement>(null);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // 加载花园数据 - 先声明后使用
  const loadGardenData = useCallback(async (userId: string) => {
    const saved = localStorage.getItem(`garden_${userId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setGardenState(data.gardenState || { level: 1, sunshine: 0, nutrient: 0, plants: [] });
      setMoodRecords(data.moodRecords || []);
      setStreak(data.streak || 0);
      // 计算最近情绪
      const records = data.moodRecords || [];
      if (records.length > 0) {
        const lastMood = records[records.length - 1];
        setMood(lastMood.value);
      }
    } else {
      // 新用户：重置为默认花园状态
      setGardenState({ level: 1, sunshine: 0, nutrient: 0, plants: [] });
      setMoodRecords([]);
      setStreak(0);
      setMood(3);
    }
  }, []);

  // 初始化加载花园数据
  useEffect(() => {
    if (user) {
      loadGardenData(user.id);
    }
  }, [user, loadGardenData]);

  // 生成雨滴位置（在 useEffect 中调用 Math.random，不在渲染中）
  useEffect(() => {
    if (mood <= 2) {
      const drops = Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 0.5,
      }));
      setRainDrops(drops);
    }
  }, [mood]);

  // 保存花园数据
  const saveGardenData = useCallback((data: any) => {
    if (!user) return;
    localStorage.setItem(`garden_${user.id}`, JSON.stringify(data));
  }, [user]);

  // 情绪打卡
  const checkInMood = useCallback((value: number) => {
    const record = {
      date: new Date().toISOString().split('T')[0],
      value,
      timestamp: new Date().getTime()
    };
    const newRecords = [...moodRecords, record];
    setMood(value);
    setMoodRecords(newRecords);
    setShowMoodPanel(false);

    // 更新连续打卡
    const today = new Date().toISOString().split('T')[0];
    let newStreak = streak;
    if (moodRecords.length > 0) {
      const lastDate = moodRecords[moodRecords.length - 1].date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = lastDate === yesterday ? streak + 1 : lastDate === today ? streak : 1;
    } else {
      newStreak = 1;
    }
    setStreak(newStreak);

    saveGardenData({
      gardenState,
      moodRecords: newRecords,
      streak: newStreak
    });
  }, [user, moodRecords, streak, gardenState, saveGardenData]);

  // 完成任务
  const completeTask = (task: any) => {
    const newState = {
      ...gardenState,
      sunshine: gardenState.sunshine + task.reward.sunshine,
      nutrient: gardenState.nutrient + task.reward.nutrient,
    };

    // 检查升级
    let newLevel = gardenState.level;
    const totalEnergy = newState.sunshine + newState.nutrient;
    for (const l of LEVELS) {
      if (totalEnergy >= l.threshold) newLevel = l.level;
    }
    newState.level = newLevel;

    setGardenState(newState);
    setCurrentTask(null);
    setTaskProgress('');

    saveGardenData({
      gardenState: newState,
      moodRecords,
      streak
    });
  };

  // 种植
  const plantFlower = (plantId: string) => {
    setPlantMode(plantId);
    setShowPlantPanel(false);
  };

  const handleGardenClick = (e: React.MouseEvent) => {
    if (!plantMode || !gardenRef.current) return;
    const rect = gardenRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newPlant = { id: plantMode, x, y, plantedAt: Date.now(), size: 1.5 + Math.random() * 0.8 };
    const newState = {
      ...gardenState,
      plants: [...gardenState.plants, newPlant]
    };
    setGardenState(newState);
    setPlantMode(null);

    saveGardenData({
      gardenState: newState,
      moodRecords,
      streak
    });
  };

  // 渲染天气
  const getWeather = () => {
    const w = WEATHERS[mood as keyof typeof WEATHERS] || WEATHERS[3];
    return w;
  };

  // 计算等级
  const getLevel = () => {
    const totalEnergy = gardenState.sunshine + gardenState.nutrient;
    let levelIdx = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalEnergy >= LEVELS[i].threshold) {
        levelIdx = i;
        break;
      }
    }
    return LEVELS[levelIdx];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-white text-2xl animate-pulse">🌸 空中花园正在苏醒...</div>
      </div>
    );
  }

  const weather = getWeather();
  const level = getLevel();
  const unlockedPlants = PLANTS.filter(p => p.unlockLevel <= gardenState.level);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: weather.bg }}>
      {/* 天空背景 */}
      <div className="absolute inset-0 transition-all duration-1000">
        <div className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 60%)'
          }}
        />
        {/* 云朵 */}
        <div className="absolute top-[10%] left-[10%] w-24 h-10 bg-white/30 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-[15%] right-[20%] w-32 h-12 bg-white/25 rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[8%] left-[40%] w-20 h-8 bg-white/20 rounded-full blur-sm animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 天气特效 */}
      {mood <= 2 && (
        <div className="absolute inset-0 pointer-events-none">
          {rainDrops.map((drop, i) => (
            <div key={i} className="absolute w-0.5 h-4 bg-blue-400/40 animate-rain"
              style={{
                left: `${drop.left}%`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`
              }}
            />
          ))}
        </div>
      )}
      {mood <= 1 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 animate-flash" />
        </div>
      )}
      {mood >= 5 && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #FF6B6B, transparent, #4ECDC4, transparent)',
            filter: 'blur(1px)',
            opacity: 0.6
          }}
        />
      )}

      {/* 顶部导航 */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
            <span className="text-lg">{level.name}</span>
            <span className="text-sm text-white/80">Lv.{level.level}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
            <span>☀️ {gardenState.sunshine}</span>
            <span>🌱 {gardenState.nutrient}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
            <span>🔥 连续 {streak} 天</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-white hover:bg-white/30 transition"
        >
          退出
        </button>
      </div>

      {/* 侧边栏 */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
        <button onClick={() => setShowMoodPanel(true)}
          className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform hover:shadow-xl">
          😊
        </button>
        <button onClick={() => setShowTaskPanel(true)}
          className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform hover:shadow-xl">
          🎯
        </button>
        <button onClick={() => setShowPlantPanel(true)}
          className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform hover:shadow-xl">
          🌱
        </button>
        <button onClick={() => setShowStats(true)}
          className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform hover:shadow-xl">
          📈
        </button>
      </div>

      {/* 花园场景 */}
      <div
        className="relative z-10 mx-auto w-[90%] max-w-3xl flex flex-col justify-end"
        style={{ minHeight: '70vh' }}
      >
        {/* 浮岛 */}
        <div className="relative mx-auto w-[85%] max-w-2xl mb-8 cursor-pointer"
          ref={gardenRef}
          onClick={handleGardenClick}
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 浮岛光晕 */}
          <div className="absolute -inset-20 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(126,200,80,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              animation: 'pulseGlow 4s ease-in-out infinite',
            }}
          />
          <div className="relative rounded-[50%_50%_45%_45%] overflow-visible"
            style={{
              height: '200px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 悬浮阴影 */}
            <div className="absolute -bottom-8 left-[-10%] w-[120%] h-12 rounded-[50%]"
              style={{
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
                transform: 'rotateX(5deg)',
                animation: 'shadowPulse 3s ease-in-out infinite',
              }}
            />
            {/* 草坪主体 */}
            <div className="relative w-full h-full rounded-[50%_50%_45%_45%] overflow-hidden cursor-pointer"
              style={{
                background: `
                  radial-gradient(ellipse at 25% 25%, #8de060 0%, #7ec850 20%, #5da83a 50%, #3d8a2a 75%, #2d6a1a 100%)
                `,
                boxShadow: `
                  0 -8px 40px rgba(126,200,80,0.2),
                  inset 0 15px 40px rgba(255,255,255,0.25),
                  inset 0 -10px 30px rgba(0,0,0,0.15),
                  0 15px 50px rgba(0,0,0,0.2)
                `,
                transform: 'rotateX(6deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 草地高光纹理 */}
              <div className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 15% 30%, rgba(255,255,255,0.35) 1px, transparent 1px),
                    radial-gradient(circle at 50% 60%, rgba(255,255,255,0.15) 1px, transparent 1px),
                    radial-gradient(circle at 80% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: '18px 18px, 22px 22px, 14px 14px',
                }}
              />
              {/* 草叶装饰 */}
              <div className="absolute top-[15%] left-[20%] text-2xl opacity-40 select-none" style={{transform: 'rotate(-10deg)'}}>🌿</div>
              <div className="absolute top-[60%] right-[10%] text-2xl opacity-35 select-none" style={{transform: 'rotate(15deg)'}}>🌿</div>
              <div className="absolute top-[30%] right-[25%] text-xl opacity-30 select-none" style={{transform: 'rotate(5deg)'}}>🌱</div>
              {/* 种植的植物 */}
              {gardenState.plants.map((plant: any, i: number) => {
                const p = PLANTS.find(p => p.id === plant.id);
                return (
                  <div key={i} className="absolute transition-all duration-700 animate-grow"
                    style={{
                      left: `${plant.x}%`,
                      bottom: `${plant.y}%`,
                      fontSize: `${plant.size}rem`,
                      transform: 'translateX(-50%)',
                      animationDelay: `${i * 0.1}s`,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    }}
                  >
                    {p?.icon || '🌸'}
                  </div>
                );
              })}
              {/* 边缘水滴效果 */}
              <div className="absolute bottom-0 left-[20%] w-1 h-3 rounded-full bg-white/20"
                style={{animation: 'waterDrop 2.5s ease-in-out infinite'}} />
              <div className="absolute bottom-0 left-[45%] w-1 h-2 rounded-full bg-white/15"
                style={{animation: 'waterDrop 2.5s ease-in-out 0.8s infinite'}} />
              <div className="absolute bottom-0 right-[25%] w-1 h-2.5 rounded-full bg-white/18"
                style={{animation: 'waterDrop 2.5s ease-in-out 1.6s infinite'}} />
            </div>
            {/* 岩石底部 - 分层 */}
            <div className="absolute -bottom-1 left-[-8%] w-[116%] h-10 rounded-[50%]"
              style={{
                background: 'linear-gradient(180deg, #8B7355 0%, #7A6548 30%, #6B5335 60%, #4A3728 100%)',
                boxShadow: '0 5px 20px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.1)',
                transform: 'rotateX(-8deg) translateZ(-15px)',
              }}
            />
            <div className="absolute -bottom-2 left-[-12%] w-[124%] h-6 rounded-[50%]"
              style={{
                background: 'linear-gradient(180deg, #6B5335 0%, #4A3728 50%, #3A2A1A 100%)',
                boxShadow: '0 3px 15px rgba(0,0,0,0.3), inset 0 1px 4px rgba(255,255,255,0.08)',
                transform: 'rotateX(-6deg) translateZ(-25px)',
              }}
            />
            {/* 岩石纹理 */}
            <div className="absolute -bottom-1 left-[5%] w-[30%] h-2 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(ellipse, #9B8365 0%, transparent 70%)',
                transform: 'translateZ(-10px)',
              }}
            />
            <div className="absolute -bottom-1 right-[10%] w-[20%] h-1.5 rounded-full opacity-15"
              style={{
                background: 'radial-gradient(ellipse, #9B8365 0%, transparent 70%)',
                transform: 'translateZ(-10px)',
              }}
            />
            {/* 藤蔓装饰 */}
            <div className="absolute -bottom-1 left-[5%] text-lg select-none"
              style={{transform: 'rotate(20deg) translateZ(-5px)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'}}>
              🌿
            </div>
            <div className="absolute -bottom-1 right-[8%] text-base select-none"
              style={{transform: 'rotate(-15deg) translateZ(-5px)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'}}>
              🌿
            </div>
          </div>
        </div>

        {/* 种植模式提示 */}
        {plantMode && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-6 py-3 rounded-full backdrop-blur-md animate-bounce">
            🌱 点击花园中的任意位置种植！
          </div>
        )}
      </div>

      {/* 情绪打卡面板 */}
      {showMoodPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowMoodPanel(false)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-[90%] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              你今天感觉怎么样？
            </h2>
            <p className="text-gray-500 text-center mb-6 text-sm">选择你的情绪状态</p>
            <div className="flex flex-col gap-3">
              {MOODS.map(m => (
                <button key={m.value}
                  onClick={() => checkInMood(m.value)}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: mood === m.value ? `${m.color}30` : '#f5f5f5',
                    border: mood === m.value ? `2px solid ${m.color}` : '2px solid transparent'
                  }}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="font-medium text-lg">{m.label}</span>
                  <span className="ml-auto text-sm text-gray-400">{m.value}/5</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 任务面板 */}
      {showTaskPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { setShowTaskPanel(false); setCurrentTask(null); }}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-[90%] shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              🎯 情绪调节任务
            </h2>
            {!currentTask ? (
              <div className="flex flex-col gap-3">
                {TASKS.map(t => (
                  <button key={t.id}
                    onClick={() => setCurrentTask(t)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all hover:scale-102"
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.desc}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-yellow-600">☀️ +{t.reward.sunshine}</div>
                      <div className="text-green-600">🌱 +{t.reward.nutrient}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-4">{currentTask.icon}</div>
                <h3 className="text-xl font-bold mb-2">{currentTask.name}</h3>
                <p className="text-gray-500 mb-6">{currentTask.desc}</p>

                {currentTask.id === 'breath' && (
                  <div className="space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse flex items-center justify-center text-white font-bold">
                      呼吸
                    </div>
                    <button onClick={() => completeTask(currentTask)}
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition">
                      完成练习
                    </button>
                  </div>
                )}

                {currentTask.id === 'gratitude' && (
                  <div className="space-y-4">
                    <textarea placeholder="写下今天感恩的3件事..."
                      className="w-full p-4 rounded-2xl border border-gray-200 resize-none h-32"
                    />
                    <button onClick={() => completeTask(currentTask)}
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition">
                      完成记录
                    </button>
                  </div>
                )}

                {currentTask.id === 'meditation' && (
                  <div className="space-y-4">
                    <div className="text-4xl animate-pulse">🧘</div>
                    <p className="text-gray-400">闭上眼睛，深呼吸，放松身心</p>
                    <button onClick={() => completeTask(currentTask)}
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition">
                      完成冥想
                    </button>
                  </div>
                )}

                {currentTask.id === 'affirmation' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-2xl">
                      <p className="text-lg italic text-gray-700">
                        "我值得被爱，我有能力创造美好的一切"
                      </p>
                    </div>
                    <button onClick={() => completeTask(currentTask)}
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition">
                      我已阅读
                    </button>
                  </div>
                )}

                {currentTask.id === 'music' && (
                  <div className="space-y-4">
                    <div className="text-4xl animate-spin-slow">🎵</div>
                    <p className="text-gray-400">聆听放松音乐，让心灵平静</p>
                    <button onClick={() => completeTask(currentTask)}
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition">
                      完成聆听
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 种植面板 */}
      {showPlantPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowPlantPanel(false)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-[90%] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              🌱 选择植物
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {unlockedPlants.map(p => (
                <button key={p.id}
                  onClick={() => plantFlower(p.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-b from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all hover:scale-105"
                >
                  <span className="text-3xl">{p.icon}</span>
                  <span className="text-xs font-medium">{p.name}</span>
                </button>
              ))}
              {PLANTS.filter(p => p.unlockLevel > gardenState.level).map(p => (
                <div key={p.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-100 opacity-50"
                >
                  <span className="text-3xl">🔒</span>
                  <span className="text-xs font-medium text-gray-400">Lv.{p.unlockLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 统计面板 */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowStats(false)}>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-[90%] shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              📈 情绪统计
            </h2>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-blue-600">{moodRecords.length}</div>
                <div className="text-xs text-gray-500">总打卡</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-green-600">{streak}</div>
                <div className="text-xs text-gray-500">连续天数</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-yellow-600">{gardenState.level}</div>
                <div className="text-xs text-gray-500">花园等级</div>
              </div>
            </div>

            {/* 情绪趋势图 */}
            {moodRecords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">情绪趋势</h3>
                <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                  <div className="flex items-end gap-1 h-full">
                    {moodRecords.slice(-14).map((r: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-xs">{MOODS[5 - r.value]?.emoji}</div>
                        <div className="w-full rounded-t"
                          style={{
                            height: `${(r.value / 5) * 100}%`,
                            background: MOODS[5 - r.value]?.color || '#ccc',
                            minHeight: '4px',
                            transition: 'height 0.5s'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 情绪日历 */}
            {moodRecords.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">最近打卡</h3>
                <div className="flex flex-wrap gap-2">
                  {moodRecords.slice(-30).reverse().map((r: any, i: number) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: `${MOODS[5 - r.value]?.color}40` }}
                      title={r.date}
                    >
                      {MOODS[5 - r.value]?.emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 全局样式 */}
      <style jsx>{`
        @keyframes rain {
          0% { transform: translateY(-10px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        @keyframes grow {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        .animate-rain { animation: rain linear infinite; }
        .animate-flash { animation: flash 0.3s ease-in-out 3; }
        .animate-grow { animation: grow 0.6s ease-out forwards; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
}