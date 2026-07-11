/**
 * 统计模块
 * 管理情绪统计和数据可视化
 */

const Stats = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  currentRange: 7,
  canvas: null,
  ctx: null,

  /**
   * 初始化统计模块
   */
  init() {
    this.panel = document.getElementById('stats-panel');
    this.calendarGrid = document.getElementById('calendar-grid');
    this.calendarMonth = document.getElementById('calendar-month');
    this.trendChart = document.getElementById('trend-chart');
    
    // 绑定关闭按钮
    document.getElementById('close-stats-panel')?.addEventListener('click', () => {
      this.hideStatsPanel();
    });
    
    // 绑定月份导航
    document.getElementById('prev-month')?.addEventListener('click', () => {
      this.navigateMonth(-1);
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
      this.navigateMonth(1);
    });
    
    // 绑定范围切换
    document.querySelectorAll('.trend-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentRange = parseInt(tab.dataset.range);
        this.renderTrendChart();
      });
    });
    
    // 初始化 Canvas
    if (this.trendChart) {
      this.canvas = document.createElement('canvas');
      this.trendChart.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }
  },

  /**
   * 显示统计面板
   */
  showStatsPanel() {
    if (this.panel) {
      this.panel.classList.remove('hidden');
    }
    
    // 更新统计数据
    this.updateStats();
    
    // 渲染日历
    this.renderCalendar();
    
    // 渲染趋势图
    this.renderTrendChart();
  },

  /**
   * 隐藏统计面板
   */
  hideStatsPanel() {
    if (this.panel) {
      this.panel.classList.add('hidden');
    }
  },

  /**
   * 更新统计卡片
   */
  updateStats() {
    // 连续打卡
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) {
      streakEl.textContent = Storage.getStreak();
    }
    
    // 总记录数
    const records = Storage.getMoodRecords(365);
    const totalEl = document.getElementById('stat-total');
    if (totalEl) {
      totalEl.textContent = records.length;
    }
    
    // 开心天数比例
    const happyDays = records.filter(r => r.mood >= 4).length;
    const happyPercent = records.length > 0 ? Math.round((happyDays / records.length) * 100) : 0;
    const happyEl = document.getElementById('stat-happy');
    if (happyEl) {
      happyEl.textContent = `${happyPercent}%`;
    }
    
    // 完成任务数
    const tasks = Storage.getTaskHistory();
    const tasksEl = document.getElementById('stat-tasks');
    if (tasksEl) {
      tasksEl.textContent = tasks.length;
    }
  },

  /**
   * 渲染日历
   */
  renderCalendar() {
    if (!this.calendarGrid || !this.calendarMonth) return;
    
    // 更新月份显示
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    this.calendarMonth.textContent = `${this.currentYear}年${monthNames[this.currentMonth]}`;
    
    // 清空日历
    this.calendarGrid.innerHTML = '';
    
    // 获取该月的情绪数据
    const monthMoods = Storage.getMonthMoods(this.currentYear, this.currentMonth);
    
    // 获取该月第一天和总天数
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day empty';
      header.textContent = day;
      this.calendarGrid.appendChild(header);
    });
    
    // 填充空白（第一天之前的）
    const startWeekday = firstDay.getDay();
    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      this.calendarGrid.appendChild(empty);
    }
    
    // 填充日期
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      // 标记今天
      if (dateStr === today) {
        dayEl.classList.add('today');
      }
      
      // 标记情绪
      if (monthMoods[dateStr]) {
        dayEl.classList.add(`mood-${monthMoods[dateStr]}`);
      }
      
      // 点击显示详情
      dayEl.addEventListener('click', () => {
        this.showDayDetail(dateStr);
      });
      
      this.calendarGrid.appendChild(dayEl);
    }
  },

  /**
   * 月份导航
   * @param {number} delta 增量 -1 或 1
   */
  navigateMonth(delta) {
    this.currentMonth += delta;
    
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    
    this.renderCalendar();
  },

  /**
   * 显示某天的详情
   * @param {string} dateStr 日期字符串
   */
  showDayDetail(dateStr) {
    const records = Storage.getMoodRecords(365);
    const record = records.find(r => r.date === dateStr);
    
    if (record) {
      const moodTexts = ['很难过 😢', '低落 😔', '一般 😐', '开心 🙂', '非常开心 😊'];
      App.showToast(`${dateStr}: ${moodTexts[record.mood - 1]}${record.note ? ' - ' + record.note : ''}`);
    }
  },

  /**
   * 渲染趋势图
   */
  renderTrendChart() {
    if (!this.canvas || !this.ctx) return;
    
    // 设置 Canvas 尺寸
    const rect = this.trendChart.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 获取数据
    const records = Storage.getMoodRecords(this.currentRange);
    
    if (records.length === 0) {
      // 没有数据时显示提示
      this.ctx.fillStyle = '#999';
      this.ctx.font = '14px Quicksand';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('暂无数据，快来记录心情吧~', this.canvas.width / 2, this.canvas.height / 2);
      return;
    }
    
    // 绘制背景
    this.drawBackground();
    
    // 绘制数据线
    this.drawLine(records);
    
    // 绘制数据点
    this.drawPoints(records);
    
    // 绘制标签
    this.drawLabels(records);
  },

  /**
   * 绘制背景网格
   */
  drawBackground() {
    const padding = { top: 30, bottom: 40, left: 30, right: 20 };
    const chartWidth = this.canvas.width - padding.left - padding.right;
    const chartHeight = this.canvas.height - padding.top - padding.bottom;
    
    // 绘制水平线（情绪等级）
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    
    for (let i = 1; i <= 5; i++) {
      const y = padding.top + chartHeight * (1 - (i - 1) / 4);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(this.canvas.width - padding.right, y);
      this.ctx.stroke();
      
      // 绘制等级标签
      this.ctx.fillStyle = '#999';
      this.ctx.font = '10px Quicksand';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(i.toString(), padding.left - 5, y + 3);
    }
  },

  /**
   * 绘制数据线
   * @param {Array} records 情绪记录
   */
  drawLine(records) {
    const padding = { top: 30, bottom: 40, left: 30, right: 20 };
    const chartWidth = this.canvas.width - padding.left - padding.right;
    const chartHeight = this.canvas.height - padding.top - padding.bottom;
    
    // 计算点的位置
    const points = records.map((record, index) => {
      const x = padding.left + (index / (records.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - (record.mood - 1) / 4);
      return { x, y, mood: record.mood };
    });
    
    // 绘制渐变线条
    this.ctx.strokeStyle = '#98D8C8';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        // 使用贝塞尔曲线让线条更平滑
        const prev = points[index - 1];
        const midX = (prev.x + point.x) / 2;
        this.ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + point.y) / 2);
        this.ctx.quadraticCurveTo(midX, (prev.y + point.y) / 2, point.x, point.y);
      }
    });
    this.ctx.stroke();
    
    // 绘制渐变填充
    const gradient = this.ctx.createLinearGradient(0, padding.top, 0, this.canvas.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(152, 216, 200, 0.3)');
    gradient.addColorStop(1, 'rgba(152, 216, 200, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, this.canvas.height - padding.bottom);
    points.forEach((point, index) => {
      this.ctx.lineTo(point.x, point.y);
    });
    this.ctx.lineTo(points[points.length - 1].x, this.canvas.height - padding.bottom);
    this.ctx.closePath();
    this.ctx.fill();
  },

  /**
   * 绘制数据点
   * @param {Array} records 情绪记录
   */
  drawPoints(records) {
    const padding = { top: 30, bottom: 40, left: 30, right: 20 };
    const chartWidth = this.canvas.width - padding.left - padding.right;
    const chartHeight = this.canvas.height - padding.top - padding.bottom;
    
    // 情绪对应的颜色
    const moodColors = {
      5: '#FFE066',
      4: '#98D8C8',
      3: '#B8C5D6',
      2: '#7B8FA8',
      1: '#4A5568'
    };
    
    records.forEach((record, index) => {
      const x = padding.left + (index / (records.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - (record.mood - 1) / 4);
      
      // 绘制点
      this.ctx.fillStyle = moodColors[record.mood] || '#98D8C8';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 绘制白色边框
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  },

  /**
   * 绘制日期标签
   * @param {Array} records 情绪记录
   */
  drawLabels(records) {
    const padding = { top: 30, bottom: 40, left: 30, right: 20 };
    const chartWidth = this.canvas.width - padding.left - padding.right;
    
    this.ctx.fillStyle = '#999';
    this.ctx.font = '10px Quicksand';
    this.ctx.textAlign = 'center';
    
    // 只显示部分标签（避免拥挤）
    const step = Math.ceil(records.length / 7);
    
    records.forEach((record, index) => {
      if (index % step === 0 || index === records.length - 1) {
        const x = padding.left + (index / (records.length - 1 || 1)) * chartWidth;
        const date = new Date(record.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        this.ctx.fillText(label, x, this.canvas.height - padding.bottom + 15);
      }
    });
  },

  /**
   * 获取统计摘要
   * @returns {Object} 统计摘要
   */
  getSummary() {
    const records = Storage.getMoodRecords(30);
    const tasks = Storage.getTaskHistory();
    
    if (records.length === 0) {
      return {
        hasData: false,
        message: '开始记录你的心情吧~'
      };
    }
    
    // 计算平均情绪
    const avgMood = records.reduce((sum, r) => sum + r.mood, 0) / records.length;
    
    // 计算情绪分布
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    records.forEach(r => {
      distribution[r.mood]++;
    });
    
    // 计算趋势（最近7天 vs 之前7天）
    const recent7 = records.slice(-7);
    const previous7 = records.slice(-14, -7);
    
    const recentAvg = recent7.reduce((sum, r) => sum + r.mood, 0) / recent7.length;
    const previousAvg = previous7.length > 0 
      ? previous7.reduce((sum, r) => sum + r.mood, 0) / previous7.length 
      : recentAvg;
    
    const trend = recentAvg - previousAvg;
    
    return {
      hasData: true,
      totalRecords: records.length,
      totalTasks: tasks.length,
      avgMood: Math.round(avgMood * 10) / 10,
      streak: Storage.getStreak(),
      distribution,
      trend,
      trendText: trend > 0.5 ? '情绪正在好转 🌈' : trend < -0.5 ? '最近有点低落 🌧' : '情绪稳定 ☁️'
    };
  }
};