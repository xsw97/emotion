/**
 * 天气系统模块
 * 根据情绪状态渲染花园的天气效果
 */

const Weather = {
  // 情绪对应的天气配置
  weatherConfigs: {
    5: {
      name: '阳光灿烂',
      bgGradient: 'linear-gradient(180deg, #FFB7C5 0%, #87CEEB 50%, #FFE4B5 100%)',
      showSun: true,
      showRainbow: true,
      showButterflies: true,
      showRain: false,
      showLightning: false,
      particles: 'sparkle',
      cloudOpacity: 0.5,
      plantState: 'blooming'
    },
    4: {
      name: '晴朗舒适',
      bgGradient: 'linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)',
      showSun: false,
      showRainbow: false,
      showButterflies: false,
      showRain: false,
      showLightning: false,
      particles: 'petal',
      cloudOpacity: 0.7,
      plantState: 'healthy'
    },
    3: {
      name: '多云微阴',
      bgGradient: 'linear-gradient(180deg, #D3DCE6 0%, #B8C5D6 100%)',
      showSun: false,
      showRainbow: false,
      showButterflies: false,
      showRain: false,
      showLightning: false,
      particles: 'none',
      cloudOpacity: 0.8,
      plantState: 'neutral'
    },
    2: {
      name: '细雨绵绵',
      bgGradient: 'linear-gradient(180deg, #6B7B8C 0%, #8C9CAF 100%)',
      showSun: false,
      showRainbow: false,
      showButterflies: false,
      showRain: true,
      showLightning: false,
      particles: 'rain',
      cloudOpacity: 0.9,
      plantState: 'withering'
    },
    1: {
      name: '暴风雨',
      bgGradient: 'linear-gradient(180deg, #2D3748 0%, #4A5568 100%)',
      showSun: false,
      showRainbow: false,
      showButterflies: false,
      showRain: true,
      showLightning: true,
      particles: 'rain',
      cloudOpacity: 1,
      plantState: 'withered'
    }
  },

  currentMood: 3,
  rainDrops: [],
  butterflies: [],
  lightningTimer: null,

  /**
   * 初始化天气系统
   */
  init() {
    this.skyLayer = document.getElementById('sky-layer');
    this.rainContainer = document.getElementById('rain-container');
    this.lightning = document.getElementById('lightning');
    this.rainbow = document.getElementById('rainbow');
    this.sunlight = document.getElementById('sunlight');
    this.butterfliesContainer = document.getElementById('butterflies-container');
    this.particlesLayer = document.getElementById('particles-layer');
    this.cloudsLayer = document.getElementById('clouds-layer');
    
    // 初始化云朵颜色
    this.updateClouds(3);
    
    // 创建初始粒子
    this.createParticles('petal', 10);
  },

  /**
   * 根据情绪更新天气
   * @param {number} mood 情绪值 1-5
   */
  updateWeather(mood) {
    const config = this.weatherConfigs[mood] || this.weatherConfigs[3];
    this.currentMood = mood;
    
    // 更新天空背景
    this.updateSky(config.bgGradient);
    
    // 更新云朵
    this.updateClouds(mood);
    
    // 更新阳光
    this.toggleSun(config.showSun);
    
    // 更新彩虹
    this.toggleRainbow(config.showRainbow);
    
    // 更新蝴蝶
    this.toggleButterflies(config.showButterflies);
    
    // 更新雨
    this.toggleRain(config.showRain, mood);
    
    // 更新雷电
    this.toggleLightning(config.showLightning);
    
    // 更新粒子
    this.updateParticles(config.particles);
    
    // 更新植物状态
    Garden.updatePlantState(config.plantState);
  },

  /**
   * 更新天空背景
   * @param {string} gradient 渐变值
   */
  updateSky(gradient) {
    if (this.skyLayer) {
      this.skyLayer.style.background = gradient;
    }
  },

  /**
   * 更新云朵颜色和透明度
   * @param {number} mood 情绪值
   */
  updateClouds(mood) {
    const clouds = this.cloudsLayer?.querySelectorAll('.cloud');
    if (!clouds) return;
    
    // 根据情绪调整云朵颜色
    const cloudColors = {
      5: 'rgba(255, 255, 255, 0.85)',
      4: 'rgba(255, 255, 255, 0.75)',
      3: 'rgba(200, 200, 210, 0.7)',
      2: 'rgba(150, 160, 170, 0.8)',
      1: 'rgba(80, 90, 100, 0.9)'
    };
    
    const color = cloudColors[mood] || cloudColors[3];
    
    clouds.forEach(cloud => {
      cloud.style.background = color;
      // 同时更新伪元素颜色
      cloud.style.setProperty('--cloud-color', color);
    });
  },

  /**
   * 切换阳光显示
   * @param {boolean} show 是否显示
   */
  toggleSun(show) {
    if (this.sunlight) {
      this.sunlight.style.display = show ? 'block' : 'none';
      this.sunlight.style.opacity = show ? '0.8' : '0';
    }
  },

  /**
   * 切换彩虹显示
   * @param {boolean} show 是否显示
   */
  toggleRainbow(show) {
    if (this.rainbow) {
      this.rainbow.style.display = show ? 'block' : 'none';
      this.rainbow.style.opacity = show ? '0.6' : '0';
    }
  },

  /**
   * 切换蝴蝶显示
   * @param {boolean} show 是否显示
   */
  toggleButterflies(show) {
    if (!this.butterfliesContainer) return;
    
    if (show) {
      this.butterfliesContainer.style.display = 'block';
      if (this.butterflies.length === 0) {
        this.createButterflies(5);
      }
    } else {
      this.butterfliesContainer.style.display = 'none';
      this.butterflies.forEach(b => b.remove());
      this.butterflies = [];
    }
  },

  /**
   * 创建蝴蝶
   * @param {number} count 数量
   */
  createButterflies(count) {
    for (let i = 0; i < count; i++) {
      const butterfly = document.createElement('div');
      butterfly.className = 'butterfly';
      butterfly.style.left = `${Math.random() * 80 + 10}%`;
      butterfly.style.top = `${Math.random() * 40 + 10}%`;
      butterfly.style.animationDelay = `${Math.random() * 5}s`;
      butterfly.style.animationDuration = `${6 + Math.random() * 4}s`;
      
      // 创建翅膀
      const leftWing = document.createElement('div');
      leftWing.className = 'butterfly-wing left';
      const rightWing = document.createElement('div');
      rightWing.className = 'butterfly-wing right';
      
      // 随机颜色
      const colors = ['#FFB7C5', '#FFE066', '#98D8C8', '#E6E6FA'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      leftWing.style.background = color;
      rightWing.style.background = color;
      
      butterfly.appendChild(leftWing);
      butterfly.appendChild(rightWing);
      this.butterfliesContainer.appendChild(butterfly);
      this.butterflies.push(butterfly);
    }
  },

  /**
   * 切换雨显示
   * @param {boolean} show 是否显示
   * @param {number} mood 情绪值（影响雨量）
   */
  toggleRain(show, mood) {
    if (!this.rainContainer) return;
    
    if (show) {
      this.rainContainer.style.display = 'block';
      // 暴风雨时雨量更大
      const intensity = mood === 1 ? 80 : 40;
      if (this.rainDrops.length === 0) {
        this.createRain(intensity);
      }
    } else {
      this.rainContainer.style.display = 'none';
      this.rainDrops.forEach(drop => drop.remove());
      this.rainDrops = [];
    }
  },

  /**
   * 创建雨滴
   * @param {number} count 数量
   */
  createRain(count) {
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 1}s`;
      drop.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
      this.rainContainer.appendChild(drop);
      this.rainDrops.push(drop);
    }
  },

  /**
   * 切换雷电显示
   * @param {boolean} show 是否显示
   */
  toggleLightning(show) {
    if (!this.lightning) return;
    
    if (show) {
      this.lightning.style.display = 'block';
      this.startLightningTimer();
    } else {
      this.lightning.style.display = 'none';
      if (this.lightningTimer) {
        clearInterval(this.lightningTimer);
        this.lightningTimer = null;
      }
    }
  },

  /**
   * 启动雷电定时器
   */
  startLightningTimer() {
    if (this.lightningTimer) return;
    
    this.lightningTimer = setInterval(() => {
      this.triggerLightning();
    }, 3000 + Math.random() * 2000);
  },

  /**
   * 触发一次雷电闪烁
   */
  triggerLightning() {
    if (!this.lightning) return;
    
    // 随机位置
    this.lightning.style.left = `${Math.random() * 80 + 10}%`;
    
    // 闪烁效果
    this.lightning.classList.add('flash');
    setTimeout(() => {
      this.lightning.classList.remove('flash');
    }, 200);
  },

  /**
   * 更新粒子类型
   * @param {string} type 粒子类型：'sparkle', 'petal', 'rain', 'none'
   */
  updateParticles(type) {
    // 清除现有粒子
    this.clearParticles();
    
    if (type === 'none') return;
    
    let count = 0;
    switch (type) {
      case 'sparkle':
        count = 15;
        break;
      case 'petal':
        count = 10;
        break;
      case 'rain':
        count = 0; // 雨滴已有单独系统
        break;
    }
    
    if (count > 0) {
      this.createParticles(type, count);
    }
  },

  /**
   * 清除所有粒子
   */
  clearParticles() {
    if (this.particlesLayer) {
      this.particlesLayer.innerHTML = '';
    }
  },

  /**
   * 创建粒子
   * @param {string} type 类型
   * @param {number} count 数量
   */
  createParticles(type, count) {
    if (!this.particlesLayer) return;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = `particle ${type}`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 3}s`;
      particle.style.animationDuration = `${3 + Math.random() * 2}s`;
      
      // 星星粒子随机大小
      if (type === 'sparkle') {
        particle.style.width = `${3 + Math.random() * 4}px`;
        particle.style.height = particle.style.width;
      }
      
      this.particlesLayer.appendChild(particle);
    }
  },

  /**
   * 创建任务完成庆祝粒子
   * @param {number} x 中心X坐标
   * @param {number} y 中心Y坐标
   */
  createCelebrationBurst(x, y) {
    const container = document.getElementById('particle-burst-container');
    if (!container) return;
    
    const colors = ['#FFE066', '#FFB7C5', '#98D8C8', '#87CEEB', '#E6E6FA'];
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'burst-particle';
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      
      // 随机方向
      const angle = (Math.PI * 2 * i) / 20;
      const distance = 50 + Math.random() * 100;
      particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
      
      container.appendChild(particle);
      
      // 动画结束后移除
      setTimeout(() => particle.remove(), 1000);
    }
  },

  /**
   * 获取当前天气名称
   * @returns {string} 天气名称
   */
  getWeatherName() {
    const config = this.weatherConfigs[this.currentMood];
    return config ? config.name : '多云微阴';
  }
};