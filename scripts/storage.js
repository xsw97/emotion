/**
 * 数据存储模块
 * 管理 localStorage 中的所有数据
 */

const Storage = {
  // 存储键名
  KEYS: {
    MOOD_RECORDS: 'skygarden_mood_records',
    TASK_HISTORY: 'skygarden_task_history',
    GARDEN_STATE: 'skygarden_garden_state',
    SETTINGS: 'skygarden_settings',
    STREAK: 'skygarden_streak'
  },

  /**
   * 初始化存储，检查并创建默认数据
   */
  init() {
    if (!this.get(this.KEYS.MOOD_RECORDS)) {
      this.set(this.KEYS.MOOD_RECORDS, []);
    }
    if (!this.get(this.KEYS.TASK_HISTORY)) {
      this.set(this.KEYS.TASK_HISTORY, []);
    }
    if (!this.get(this.KEYS.GARDEN_STATE)) {
      this.set(this.KEYS.GARDEN_STATE, {
        level: 1,
        levelName: '种子',
        sunshine: 0,
        nutrient: 0,
        plants: [],
        unlockedPlants: ['flower-1', 'grass-1']
      });
    }
    if (!this.get(this.KEYS.SETTINGS)) {
      this.set(this.KEYS.SETTINGS, {
        soundEnabled: false,
        lastCheckIn: null
      });
    }
    if (!this.get(this.KEYS.STREAK)) {
      this.set(this.KEYS.STREAK, {
        count: 0,
        lastDate: null
      });
    }
  },

  /**
   * 获取数据
   * @param {string} key 存储键
   * @returns {any} 数据
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  /**
   * 设置数据
   * @param {string} key 存储键
   * @param {any} value 数据
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  /**
   * 添加情绪记录
   * @param {Object} record 情绪记录
   */
  addMoodRecord(record) {
    const records = this.get(this.KEYS.MOOD_RECORDS) || [];
    records.push({
      ...record,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
    this.set(this.KEYS.MOOD_RECORDS, records);
    this.updateStreak();
    return records;
  },

  /**
   * 获取情绪记录
   * @param {number} days 天数
   * @returns {Array} 情绪记录数组
   */
  getMoodRecords(days = 30) {
    const records = this.get(this.KEYS.MOOD_RECORDS) || [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return records.filter(r => r.timestamp >= cutoff);
  },

  /**
   * 获取今天的情绪记录
   * @returns {Object|null} 今天的情绪记录
   */
  getTodayMood() {
    const today = new Date().toISOString().split('T')[0];
    const records = this.get(this.KEYS.MOOD_RECORDS) || [];
    return records.find(r => r.date === today);
  },

  /**
   * 获取最近的情绪（用于天气系统）
   * @returns {number} 情绪值 1-5
   */
  getRecentMood() {
    const records = this.get(this.KEYS.MOOD_RECORDS) || [];
    if (records.length === 0) return 3; // 默认一般
    
    // 取最近3条记录的平均值
    const recent = records.slice(-3);
    const avg = recent.reduce((sum, r) => sum + r.mood, 0) / recent.length;
    return Math.round(avg);
  },

  /**
   * 添加任务完成记录
   * @param {Object} task 任务对象
   * @param {number} reward 奖励值
   */
  addTaskCompletion(task, reward) {
    const history = this.get(this.KEYS.TASK_HISTORY) || [];
    history.push({
      taskId: task.id,
      taskName: task.name,
      reward,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
    this.set(this.KEYS.TASK_HISTORY, history);
    
    // 更新花园状态
    this.addEnergy(reward.sunshine || 0, reward.nutrient || 0);
    return history;
  },

  /**
   * 获取任务完成历史
   * @returns {Array} 任务历史数组
   */
  getTaskHistory() {
    return this.get(this.KEYS.TASK_HISTORY) || [];
  },

  /**
   * 获取今日完成的任务数
   * @returns {number} 任务数量
   */
  getTodayTaskCount() {
    const today = new Date().toISOString().split('T')[0];
    const history = this.get(this.KEYS.TASK_HISTORY) || [];
    return history.filter(h => h.date === today).length;
  },

  /**
   * 获取花园状态
   * @returns {Object} 花园状态对象
   */
  getGardenState() {
    return this.get(this.KEYS.GARDEN_STATE) || {
      level: 1,
      levelName: '种子',
      sunshine: 0,
      nutrient: 0,
      plants: [],
      unlockedPlants: ['flower-1', 'grass-1']
    };
  },

  /**
   * 更新花园状态
   * @param {Object} state 新状态
   */
  updateGardenState(state) {
    this.set(this.KEYS.GARDEN_STATE, state);
  },

  /**
   * 添加能量值
   * @param {number} sunshine 阳光值
   * @param {number} nutrient 养分值
   */
  addEnergy(sunshine, nutrient) {
    const state = this.getGardenState();
    state.sunshine = Math.min(100, state.sunshine + sunshine);
    state.nutrient = Math.min(100, state.nutrient + nutrient);
    
    // 检查升级
    const totalEnergy = state.sunshine + state.nutrient;
    const newLevel = this.calculateLevel(totalEnergy);
    
    if (newLevel > state.level) {
      state.level = newLevel;
      state.levelName = this.getLevelName(newLevel);
      // 保存更新后的状态
      this.updateGardenState(state);
      // 返回升级信息
      return { upgraded: true, newLevel, levelName: state.levelName };
    }
    
    this.updateGardenState(state);
    return { upgraded: false };
  },

  /**
   * 计算等级
   * @param {number} totalEnergy 总能量
   * @returns {number} 等级
   */
  calculateLevel(totalEnergy) {
    // 等级阈值：0, 50, 150, 300, 500
    if (totalEnergy >= 500) return 5;
    if (totalEnergy >= 300) return 4;
    if (totalEnergy >= 150) return 3;
    if (totalEnergy >= 50) return 2;
    return 1;
  },

  /**
   * 获取等级名称
   * @param {number} level 等级
   * @returns {string} 等级名称
   */
  getLevelName(level) {
    const names = ['种子', '发芽', '成长', '茂盛', '花园王国'];
    return names[level - 1] || '种子';
  },

  /**
   * 更新连续打卡
   */
  updateStreak() {
    const streak = this.get(this.KEYS.STREAK) || { count: 0, lastDate: null };
    const today = new Date().toISOString().split('T')[0];
    
    if (streak.lastDate === today) {
      // 今天已经打卡，不更新
      return streak.count;
    }
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (streak.lastDate === yesterday) {
      // 连续打卡
      streak.count++;
    } else if (streak.lastDate !== today) {
      // 断签，重新开始
      streak.count = 1;
    }
    
    streak.lastDate = today;
    this.set(this.KEYS.STREAK, streak);
    return streak.count;
  },

  /**
   * 获取连续打卡数
   * @returns {number} 连续打卡天数
   */
  getStreak() {
    const streak = this.get(this.KEYS.STREAK) || { count: 0, lastDate: null };
    
    // 检查是否过期
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (streak.lastDate && streak.lastDate < yesterday) {
      streak.count = 0;
      streak.lastDate = null;
      this.set(this.KEYS.STREAK, streak);
    }
    
    return streak.count;
  },

  /**
   * 获取设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || {
      soundEnabled: false,
      lastCheckIn: null
    };
  },

  /**
   * 更新设置
   * @param {Object} settings 新设置
   */
  updateSettings(settings) {
    const current = this.getSettings();
    this.set(this.KEYS.SETTINGS, { ...current, ...settings });
  },

  /**
   * 获取某月的情绪数据
   * @param {number} year 年份
   * @param {number} month 月份
   * @returns {Object} 以日期为键的映射
   */
  getMonthMoods(year, month) {
    const records = this.get(this.KEYS.MOOD_RECORDS) || [];
    const monthMoods = {};
    
    records.forEach(record => {
      const d = new Date(record.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        monthMoods[record.date] = record.mood;
      }
    });
    
    return monthMoods;
  },

  /**
   * 清除所有数据（用于测试）
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// 初始化存储
Storage.init();