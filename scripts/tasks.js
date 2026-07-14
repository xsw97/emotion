/**
 * 任务系统模块
 * 管理情绪调节任务
 */

const Tasks = {
  // 任务定义
  taskTypes: [
    {
      id: 'breathing',
      name: '深呼吸练习',
      icon: '🫁',
      desc: '放松身心，跟随呼吸节奏',
      duration: 30,
      reward: { sunshine: 15, nutrient: 10 },
      execute: 'executeBreathing'
    },
    {
      id: 'gratitude',
      name: '感恩日记',
      icon: '📝',
      desc: '记录今天感恩的3件小事',
      duration: 60,
      reward: { sunshine: 20, nutrient: 15 },
      execute: 'executeGratitude'
    },
    {
      id: 'meditation',
      name: '正念冥想',
      icon: '🧘',
      desc: '5分钟放松冥想',
      duration: 300,
      reward: { sunshine: 30, nutrient: 25 },
      execute: 'executeMeditation'
    },
    {
      id: 'affirmation',
      name: '自我对话',
      icon: '💬',
      desc: '给自己一些积极的肯定',
      duration: 20,
      reward: { sunshine: 12, nutrient: 8 },
      execute: 'executeAffirmation'
    },
    {
      id: 'music',
      name: '音乐放松',
      icon: '🎵',
      desc: '聆听自然的宁静',
      duration: 120,
      reward: { sunshine: 18, nutrient: 12 },
      execute: 'executeMusic'
    }
  ],

  // 积极肯定的语句
  affirmations: [
    '我值得被爱和被关心',
    '每一天都是新的开始',
    '我有能力面对任何挑战',
    '我的感受很重要',
    '我正在变得越来越好',
    '我允许自己休息和放松',
    '我接纳自己的所有情绪',
    '我值得拥有美好的事物',
    '我的存在本身就是有意义的',
    '我正在学习更好地照顾自己'
  ],

  currentTask: null,
  isExecuting: false,
  timerInterval: null,
  progress: 0,

  /**
   * 初始化任务系统
   */
  init() {
    this.panel = document.getElementById('task-panel');
    this.executionPanel = document.getElementById('task-execution-panel');
    this.taskList = document.getElementById('task-list');
    this.taskContent = document.getElementById('task-execution-content');
    this.progressRing = document.getElementById('task-progress-ring');
    this.progressText = document.getElementById('task-progress-text');
    
    // 绑定关闭按钮
    document.getElementById('close-task-panel')?.addEventListener('click', () => {
      this.hideTaskPanel();
    });
    
    document.getElementById('close-execution-panel')?.addEventListener('click', () => {
      this.cancelTask();
    });
    
    // 渲染任务列表
    this.renderTaskList();
  },

  /**
   * 渲染任务列表
   */
  renderTaskList() {
    if (!this.taskList) return;
    
    this.taskList.innerHTML = '';
    
    this.taskTypes.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.dataset.taskId = task.id;
      
      card.innerHTML = `
        <span class="task-icon">${task.icon}</span>
        <span class="task-name">${task.name}</span>
        <span class="task-desc">${task.desc}</span>
        <div class="task-reward">
          <span>☀️ +${task.reward.sunshine}</span>
          <span>🌱 +${task.reward.nutrient}</span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        this.startTask(task);
      });
      
      this.taskList.appendChild(card);
    });
  },

  /**
   * 显示任务面板
   */
  showTaskPanel() {
    if (this.panel) {
      this.panel.classList.remove('hidden');
    }
  },

  /**
   * 隐藏任务面板
   */
  hideTaskPanel() {
    if (this.panel) {
      this.panel.classList.add('hidden');
    }
  },

  /**
   * 开始任务
   * @param {Object} task 任务对象
   */
  startTask(task) {
    this.currentTask = task;
    this.isExecuting = true;
    this.progress = 0;
    
    // 隐藏任务列表，显示执行面板
    this.hideTaskPanel();
    this.showExecutionPanel();
    
    // 设置标题
    const title = document.getElementById('task-execution-title');
    if (title) title.textContent = task.name;
    
    // 执行任务
    this[task.execute](task);
  },

  /**
   * 显示执行面板
   */
  showExecutionPanel() {
    if (this.executionPanel) {
      this.executionPanel.classList.remove('hidden');
    }
  },

  /**
   * 隐藏执行面板
   */
  hideExecutionPanel() {
    if (this.executionPanel) {
      this.executionPanel.classList.add('hidden');
    }
  },

  /**
   * 取消任务
   */
  cancelTask() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.isExecuting = false;
    this.currentTask = null;
    this.progress = 0;
    
    this.hideExecutionPanel();
    
    // 清空内容
    if (this.taskContent) {
      this.taskContent.innerHTML = '';
    }
  },

  /**
   * 更新进度
   * @param {number} progress 进度百分比 0-100
   */
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
    
    if (this.progressRing) {
      // stroke-dasharray = 2 * PI * r = 2 * 3.14 * 45 ≈ 283
      const offset = 283 - (283 * this.progress / 100);
      this.progressRing.style.strokeDashoffset = offset;
    }
    
    if (this.progressText) {
      this.progressText.textContent = `${Math.round(this.progress)}%`;
    }
  },

  /**
   * 完成任务
   */
  completeTask() {
    if (!this.currentTask) return;
    
    // 记录任务完成
    const result = Storage.addTaskCompletion(this.currentTask, this.currentTask.reward);
    
    // 播放完成音效
    GardenAudio.playCompletionSound();
    
    // 创建庆祝粒子
    const rect = this.executionPanel.getBoundingClientRect();
    Weather.createCelebrationBurst(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    
    // 检查升级
    if (result.upgraded) {
      const unlocked = Garden.upgradeGarden(result.newLevel);
      App.showCelebration(result.newLevel, result.levelName, unlocked);
    }
    
    // 更新花园UI
    Garden.updateUI(Storage.getGardenState());
    
    // 保存奖励信息（在 cancelTask 之前）
    const reward = this.currentTask ? this.currentTask.reward : { sunshine: 10, nutrient: 10 };
    
    // 清理
    this.cancelTask();
    
    // 显示成功提示
    App.showToast(`任务完成！获得 ☀️${reward.sunshine} 🌱${reward.nutrient}`);
  },

  /**
   * 执行深呼吸练习
   * @param {Object} task 任务对象
   */
  executeBreathing(task) {
    if (!this.taskContent) return;
    
    // 创建呼吸动画
    this.taskContent.innerHTML = `
      <div class="breathing-circle">
        <span class="breathing-text" id="breathing-text">吸气</span>
      </div>
      <p style="font-size: 14px; color: #999;">跟随圆圈的节奏，放松呼吸</p>
    `;
    
    const breathingText = document.getElementById('breathing-text');
    const phases = ['吸气', '屏气', '呼气'];
    const durations = [4, 4, 6]; // 秒
    const totalDuration = durations.reduce((a, b) => a + b, 0); // 14秒一轮
    const rounds = Math.ceil(task.duration / totalDuration); // 需要的轮数
    
    let currentRound = 0;
    let phaseIndex = 0;
    let elapsed = 0;
    
    this.timerInterval = setInterval(() => {
      elapsed++;
      
      // 计算当前阶段
      const phaseElapsed = elapsed % totalDuration;
      let sum = 0;
      for (let i = 0; i < durations.length; i++) {
        if (phaseElapsed < sum + durations[i]) {
          phaseIndex = i;
          break;
        }
        sum += durations[i];
      }
      
      // 更新文字和音效
      if (breathingText) {
        breathingText.textContent = phases[phaseIndex];
      }
      
      // 播放音效（每阶段开始时）
      if (phaseElapsed === 0 || phaseElapsed === 4 || phaseElapsed === 8) {
        GardenAudio.playBreathingSound(phases[phaseIndex], durations[phaseIndex]);
      }
      
      // 计算轮数
      currentRound = Math.floor(elapsed / totalDuration);
      
      // 更新进度
      const progressPercent = (elapsed / task.duration) * 100;
      this.updateProgress(progressPercent);
      
      // 完成
      if (elapsed >= task.duration) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.completeTask();
      }
    }, 1000);
  },

  /**
   * 执行感恩日记
   * @param {Object} task 任务对象
   */
  executeGratitude(task) {
    if (!this.taskContent) return;
    
    this.taskContent.innerHTML = `
      <div class="gratitude-input">
        <p style="font-size: 16px; color: #666; margin-bottom: 16px;">写下今天感恩的3件小事：</p>
        <div class="gratitude-item">
          <span style="font-size: 20px;">1.</span>
          <input type="text" id="gratitude-1" placeholder="例如：早晨的阳光很温暖" />
        </div>
        <div class="gratitude-item">
          <span style="font-size: 20px;">2.</span>
          <input type="text" id="gratitude-2" placeholder="例如：喝了一杯好喝的咖啡" />
        </div>
        <div class="gratitude-item">
          <span style="font-size: 20px;">3.</span>
          <input type="text" id="gratitude-3" placeholder="例如：和朋友聊了天" />
        </div>
      </div>
      <button class="btn-primary" id="submit-gratitude" style="margin-top: 24px;">完成记录</button>
    `;
    
    // 获取输入框
    const inputs = [
      document.getElementById('gratitude-1'),
      document.getElementById('gratitude-2'),
      document.getElementById('gratitude-3')
    ];
    
    // 绑定提交按钮
    document.getElementById('submit-gratitude')?.addEventListener('click', () => {
      // 检查是否填写
      const filledCount = inputs.filter(i => i && i.value.trim()).length;
      
      if (filledCount >= 3) {
        this.updateProgress(100);
        this.completeTask();
      } else {
        App.showToast('请填写所有3件感恩的事情哦~');
      }
    });
    
    // 初始进度为0
    this.updateProgress(0);
    
    // 监听输入，动态更新进度
    inputs.forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          const filledCount = inputs.filter(i => i && i.value.trim()).length;
          this.updateProgress((filledCount / 3) * 100);
        });
      }
    });
  },

  /**
   * 执行正念冥想
   * @param {Object} task 任务对象
   */
  executeMeditation(task) {
    if (!this.taskContent) return;
    
    // 5分钟 = 300秒
    const duration = task.duration;
    let elapsed = 0;
    
    this.taskContent.innerHTML = `
      <div class="meditation-timer" id="meditation-time">5:00</div>
      <p style="font-size: 14px; color: #999;">闭上眼睛，放松身体，专注于呼吸...</p>
      <p style="font-size: 14px; color: #999; margin-top: 8px;">让思绪自然流动，不评判，只是观察</p>
    `;
    
    const timeDisplay = document.getElementById('meditation-time');
    
    // 开启背景音乐
    const settings = Storage.getSettings();
    if (!settings.soundEnabled) {
      GardenAudio.playBackground();
    }
    
    this.timerInterval = setInterval(() => {
      elapsed++;
      
      // 更新时间显示
      const remaining = duration - elapsed;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      if (timeDisplay) {
        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // 更新进度
      this.updateProgress((elapsed / duration) * 100);
      
      // 完成
      if (elapsed >= duration) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        // 如果之前没开音乐，关闭它
        if (!settings.soundEnabled) {
          GardenAudio.stopBackground();
        }
        
        this.completeTask();
      }
    }, 1000);
  },

  /**
   * 执行自我对话（积极肯定）
   * @param {Object} task 任务对象
   */
  executeAffirmation(task) {
    if (!this.taskContent) return;
    
    // 随机选择一条肯定语
    const affirmation = this.affirmations[Math.floor(Math.random() * this.affirmations.length)];
    
    this.taskContent.innerHTML = `
      <p class="affirmation-text">"${affirmation}"</p>
      <p style="font-size: 14px; color: #999;">深呼吸，对自己说出这句话</p>
      <p style="font-size: 14px; color: #999; margin-top: 8px;">感受这句话带给你的力量</p>
      <button class="btn-primary" id="accept-affirmation" style="margin-top: 24px;">我接受这句话</button>
    `;
    
    // 绑定按钮
    document.getElementById('accept-affirmation')?.addEventListener('click', () => {
      this.updateProgress(100);
      GardenAudio.playMoodSelectSound();
      this.completeTask();
    });
    
    // 初始进度
    this.updateProgress(50);
  },

  /**
   * 执行音乐放松
   * @param {Object} task 任务对象
   */
  executeMusic(task) {
    if (!this.taskContent) return;
    
    const duration = task.duration; // 120秒 = 2分钟
    let elapsed = 0;
    
    this.taskContent.innerHTML = `
      <div style="font-size: 48px;">🎵</div>
      <p style="font-size: 18px; color: #666;">聆听自然的宁静</p>
      <p style="font-size: 14px; color: #999; margin-top: 8px;">让音乐带走你的烦恼...</p>
      <div class="meditation-timer" id="music-time" style="font-size: 24px; margin-top: 24px;">2:00</div>
    `;
    
    const timeDisplay = document.getElementById('music-time');
    
    // 开启背景音乐
    GardenAudio.playBackground();
    
    this.timerInterval = setInterval(() => {
      elapsed++;
      
      // 更新时间
      const remaining = duration - elapsed;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      if (timeDisplay) {
        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // 更新进度
      this.updateProgress((elapsed / duration) * 100);
      
      // 完成
      if (elapsed >= duration) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        GardenAudio.stopBackground();
        this.completeTask();
      }
    }, 1000);
  },

  /**
   * 获取今日已完成任务数
   * @returns {number} 任务数
   */
  getTodayCompletedCount() {
    return Storage.getTodayTaskCount();
  },

  /**
   * 检查是否需要提示任务
   * @returns {boolean} 是否需要
   */
  shouldShowTaskHint() {
    // 花园能量低
    if (Garden.needsHelp()) {
      return true;
    }
    
    // 今天还没完成任务
    if (this.getTodayCompletedCount() === 0) {
      return true;
    }
    
    return false;
  },

  /**
   * 获取推荐任务
   * @returns {Object} 推荐的任务
   */
  getRecommendedTask() {
    const state = Storage.getGardenState();
    
    // 根据当前状态推荐
    if (state.sunshine < 20) {
      return this.taskTypes.find(t => t.id === 'breathing');
    }
    if (state.nutrient < 20) {
      return this.taskTypes.find(t => t.id === 'gratitude');
    }
    if (Storage.getRecentMood() < 3) {
      return this.taskTypes.find(t => t.id === 'affirmation');
    }
    
    // 随机推荐
    return this.taskTypes[Math.floor(Math.random() * this.taskTypes.length)];
  }
};