/**
 * 主应用控制器
 * 管理应用的整体流程和状态
 */

const App = {
  // 情绪文本和表情映射
  moodConfig: {
    5: { emoji: '😊', text: '非常开心', weather: '阳光灿烂' },
    4: { emoji: '🙂', text: '开心', weather: '晴朗舒适' },
    3: { emoji: '😐', text: '一般', weather: '多云微阴' },
    2: { emoji: '😔', text: '低落', weather: '细雨绵绵' },
    1: { emoji: '😢', text: '很难过', weather: '暴风雨' }
  },

  selectedMood: null,
  toastTimer: null,

  /**
   * 初始化应用
   */
  init() {
    console.log('空中花园正在苏醒...');
    
    // 初始化各模块
    Storage.init();
    GardenAudio.init();
    Weather.init();
    Garden.init();
    Tasks.init();
    Stats.init();
    
    // 绑定事件
    this.bindEvents();
    
    // 检查初始状态
    this.checkInitialState();
    
    // 隐藏加载状态
    this.hideLoading();
    
    console.log('花园已准备好迎接你~');
  },

  /**
   * 绑定所有事件
   */
  bindEvents() {
    // 情绪打卡按钮
    document.getElementById('btn-checkin')?.addEventListener('click', () => {
      this.showMoodPanel();
    });
    
    // 关闭情绪面板
    document.getElementById('close-mood-panel')?.addEventListener('click', () => {
      this.hideMoodPanel();
    });
    
    // 情绪选择
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectMood(parseInt(btn.dataset.mood));
        GardenAudio.playMoodSelectSound();
      });
    });
    
    // 提交情绪
    document.getElementById('submit-mood')?.addEventListener('click', () => {
      this.submitMood();
    });
    
    // 开始任务按钮
    document.getElementById('btn-start-task')?.addEventListener('click', () => {
      Tasks.showTaskPanel();
    });
    
    // 统计按钮
    document.getElementById('btn-stats')?.addEventListener('click', () => {
      Stats.showStatsPanel();
    });
    
    // 音乐开关
    document.getElementById('btn-sound')?.addEventListener('click', () => {
      this.toggleSound();
    });
    
    // 底部导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });
    
    // 关闭庆祝面板
    document.getElementById('close-celebration')?.addEventListener('click', () => {
      this.hideCelebration();
    });
  },

  /**
   * 检查初始状态
   */
  checkInitialState() {
    // 检查今天是否已打卡
    const todayMood = Storage.getTodayMood();
    if (todayMood) {
      this.updateMoodDisplay(todayMood.mood);
      Weather.updateWeather(todayMood.mood);
    } else {
      // 使用最近的情绪或默认
      const recentMood = Storage.getRecentMood();
      this.updateMoodDisplay(recentMood);
      Weather.updateWeather(recentMood);
      
      // 显示打卡提示
      this.updateTaskHint('今天还没记录心情，来打个卡吧~');
    }
    
    // 检查花园状态
    if (Garden.needsHelp()) {
      this.updateTaskHint(Garden.getHelpHint());
    }
    
    // 更新UI
    Garden.updateUI(Storage.getGardenState());
    
    // 检查音乐设置
    const settings = Storage.getSettings();
    if (settings.soundEnabled) {
      document.getElementById('btn-sound')?.textContent = '🔊';
    }
  },

  /**
   * 显示情绪打卡面板
   */
  showMoodPanel() {
    const panel = document.getElementById('mood-panel');
    if (panel) {
      panel.classList.remove('hidden');
      
      // 如果今天已打卡，显示当前情绪
      const todayMood = Storage.getTodayMood();
      if (todayMood) {
        this.selectMood(todayMood.mood);
        document.getElementById('mood-note-input')?.value = todayMood.note || '';
      }
    }
  },

  /**
   * 隐藏情绪打卡面板
   */
  hideMoodPanel() {
    const panel = document.getElementById('mood-panel');
    if (panel) {
      panel.classList.add('hidden');
    }
  },

  /**
   * 选择情绪
   * @param {number} mood 情绪值 1-5
   */
  selectMood(mood) {
    this.selectedMood = mood;
    
    // 更新按钮状态
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (parseInt(btn.dataset.mood) === mood) {
        btn.classList.add('selected');
      }
    });
  },

  /**
   * 提交情绪记录
   */
  submitMood() {
    if (!this.selectedMood) {
      this.showToast('请选择你的心情哦~');
      return;
    }
    
    const note = document.getElementById('mood-note-input')?.value || '';
    
    // 保存情绪记录
    Storage.addMoodRecord({
      mood: this.selectedMood,
      note: note.trim()
    });
    
    // 更新天气和显示
    Weather.updateWeather(this.selectedMood);
    this.updateMoodDisplay(this.selectedMood);
    
    // 检查是否需要任务提示
    if (this.selectedMood <= 2) {
      this.updateTaskHint('心情不太好？试试完成任务来调节情绪吧~');
    } else {
      this.updateTaskHint('花园喜欢你的好心情~继续保持哦！');
    }
    
    // 更新连续打卡
    Garden.updateUI(Storage.getGardenState());
    
    // 关闭面板并显示提示
    this.hideMoodPanel();
    this.showToast(`心情已记录！${this.moodConfig[this.selectedMood].emoji}`);
    
    // 清空选择
    this.selectedMood = null;
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    document.getElementById('mood-note-input')?.value = '';
    
    // 播放音效
    GardenAudio.playMoodSelectSound();
  },

  /**
   * 更新情绪显示
   * @param {number} mood 情绪值
   */
  updateMoodDisplay(mood) {
    const config = this.moodConfig[mood] || this.moodConfig[3];
    
    const emojiEl = document.getElementById('current-mood-emoji');
    const textEl = document.getElementById('current-mood-text');
    
    if (emojiEl) emojiEl.textContent = config.emoji;
    if (textEl) textEl.textContent = `今天${config.text} · ${config.weather}`;
  },

  /**
   * 更新任务提示
   * @param {string} text 提示文本
   */
  updateTaskHint(text) {
    const hintEl = document.getElementById('hint-text');
    if (hintEl) {
      hintEl.textContent = text;
    }
    
    // 控制提示区域显示/隐藏
    const taskHint = document.getElementById('task-hint');
    if (taskHint) {
      if (Tasks.shouldShowTaskHint() || text.includes('心情不太好')) {
        taskHint.style.display = 'flex';
      } else if (Tasks.getTodayCompletedCount() >= 3) {
        taskHint.style.display = 'none';
      }
    }
  },

  /**
   * 切换视图
   * @param {string} view 视图名：'garden', 'tasks', 'stats'
   */
  switchView(view) {
    // 更新导航状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });
    
    // 显示对应面板
    switch (view) {
      case 'garden':
        Tasks.hideTaskPanel();
        Stats.hideStatsPanel();
        break;
      case 'tasks':
        Tasks.showTaskPanel();
        Stats.hideStatsPanel();
        break;
      case 'stats':
        Tasks.hideTaskPanel();
        Stats.showStatsPanel();
        break;
    }
  },

  /**
   * 切换背景音乐
   */
  toggleSound() {
    const isPlaying = GardenAudio.toggleBackground();
    const btn = document.getElementById('btn-sound');
    
    if (btn) {
      btn.textContent = isPlaying ? '🔊' : '🎵';
      btn.title = isPlaying ? '关闭音乐' : '开启音乐';
    }
    
    // 保存设置
    Storage.updateSettings({ soundEnabled: isPlaying });
    
    this.showToast(isPlaying ? '音乐已开启 🎵' : '音乐已关闭');
  },

  /**
   * 显示升级庆祝
   * @param {number} level 新等级
   * @param {string} levelName 等级名称
   * @param {Array} unlocked 解锁的植物
   */
  showCelebration(level, levelName, unlocked) {
    const panel = document.getElementById('celebration-panel');
    const title = document.getElementById('celebration-title');
    const desc = document.getElementById('celebration-desc');
    const unlockInfo = document.getElementById('unlock-info');
    
    if (title) title.textContent = `恭喜升级！`;
    if (desc) desc.textContent = `你的花园已成长到「${levelName}」阶段`;
    
    // 显示解锁信息
    if (unlockInfo && unlocked.length > 0) {
      unlockInfo.innerHTML = `
        <p style="font-size: 14px; color: #666;">解锁了新植物：</p>
        <p style="font-size: 24px;">${unlocked.map(u => u.emoji).join(' ')}</p>
      `;
    } else if (unlockInfo) {
      unlockInfo.innerHTML = '<p style="font-size: 14px; color: #666;">继续努力，解锁更多植物！</p>';
    }
    
    // 显示面板
    if (panel) {
      panel.classList.remove('hidden');
    }
    
    // 播放升级音效
    GardenAudio.playLevelUpSound();
    
    // 创建庆祝粒子
    const rect = document.body.getBoundingClientRect();
    Weather.createCelebrationBurst(rect.width / 2, rect.height / 2);
    Weather.createCelebrationBurst(rect.width / 3, rect.height / 3);
    Weather.createCelebrationBurst(rect.width * 2 / 3, rect.height / 2);
  },

  /**
   * 隐藏升级庆祝
   */
  hideCelebration() {
    const panel = document.getElementById('celebration-panel');
    if (panel) {
      panel.classList.add('hidden');
    }
  },

  /**
   * 显示提示消息
   * @param {string} message 消息内容
   */
  showToast(message) {
    // 创建或更新 toast
    let toast = document.getElementById('app-toast');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        color: #666;
        z-index: 1000;
        transition: all 0.3s ease;
        opacity: 0;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // 清除之前的定时器
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    
    // 3秒后消失
    this.toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  },

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.classList.add('hidden');
    }
  },

  /**
   * 显示加载状态
   * @param {string} text 加载文本
   */
  showLoading(text = '花园正在苏醒...') {
    const loading = document.getElementById('loading-overlay');
    const loadingText = document.querySelector('.loading-text');
    
    if (loading) {
      loading.classList.remove('hidden');
    }
    if (loadingText) {
      loadingText.textContent = text;
    }
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// 处理页面关闭/切换时的数据保存
window.addEventListener('beforeunload', () => {
  // 如果任务正在执行，保存进度
  if (Tasks.isExecuting) {
    Tasks.cancelTask();
  }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时暂停音乐（节省资源）
    if (GardenAudio.isPlaying) {
      GardenAudio.stopBackground();
    }
  } else {
    // 页面显示时恢复音乐（如果设置开启了）
    const settings = Storage.getSettings();
    if (settings.soundEnabled) {
      GardenAudio.playBackground();
    }
  }
});