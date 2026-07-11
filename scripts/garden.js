/**
 * 花园场景渲染模块
 * 管理花园中的植物和场景元素
 */

const Garden = {
  // 植物类型定义
  plantTypes: {
    'flower-1': {
      name: '粉色小花',
      emoji: '🌸',
      size: { width: 40, height: 120 }
    },
    'flower-2': {
      name: '金色花朵',
      emoji: '🌼',
      size: { width: 45, height: 130 },
      unlockLevel: 2
    },
    'flower-3': {
      name: '紫色花朵',
      emoji: '💜',
      size: { width: 50, height: 140 },
      unlockLevel: 3
    },
    'tree-1': {
      name: '小树苗',
      emoji: '🌳',
      size: { width: 70, height: 150 },
      unlockLevel: 2
    },
    'tree-2': {
      name: '大树',
      emoji: '🌲',
      size: { width: 90, height: 180 },
      unlockLevel: 4
    },
    'grass-1': {
      name: '小草',
      emoji: '🌿',
      size: { width: 30, height: 40 }
    }
  },

  currentPlants: [],
  plantState: 'neutral',

  /**
   * 初始化花园
   */
  init() {
    this.container = document.getElementById('plants-container');
    this.grassLayer = document.getElementById('grass-layer');
    
    // 创建草地
    this.createGrass();
    
    // 从存储中恢复植物
    const state = Storage.getGardenState();
    if (state.plants && state.plants.length > 0) {
      this.restorePlants(state.plants);
    } else {
      // 初始化默认植物
      this.addPlant('flower-1');
      this.addPlant('grass-1');
      this.addPlant('flower-1');
    }
    
    // 更新UI
    this.updateUI(state);
  },

  /**
   * 创建草地 blades
   */
  createGrass() {
    if (!this.grassLayer) return;
    
    const count = 30;
    for (let i = 0; i < count; i++) {
      const blade = document.createElement('div');
      blade.className = 'grass-blade';
      blade.style.left = `${(i / count) * 100}%`;
      blade.style.height = `${20 + Math.random() * 15}px`;
      blade.style.animationDelay = `${Math.random() * 2}s`;
      this.grassLayer.appendChild(blade);
    }
  },

  /**
   * 添加植物
   * @param {string} typeId 植物类型ID
   */
  addPlant(typeId) {
    const type = this.plantTypes[typeId];
    if (!type) return;
    
    const plant = this.createPlantElement(typeId);
    if (plant && this.container) {
      this.container.appendChild(plant);
      this.currentPlants.push({ typeId, element: plant });
      
      // 保存到存储
      this.savePlants();
    }
  },

  /**
   * 创建植物元素
   * @param {string} typeId 植物类型ID
   * @returns {HTMLElement} 植元素
   */
  createPlantElement(typeId) {
    const type = this.plantTypes[typeId];
    if (!type) return null;
    
    const plant = document.createElement('div');
    plant.className = 'plant';
    plant.dataset.type = typeId;
    
    if (typeId.startsWith('flower')) {
      plant.classList.add('flower');
      this.createFlowerStructure(plant, type);
    } else if (typeId.startsWith('tree')) {
      plant.classList.add('tree');
      this.createTreeStructure(plant, type);
    } else if (typeId.startsWith('grass')) {
      plant.classList.add('grass');
      this.createGrassStructure(plant, type);
    }
    
    // 添加状态类
    if (this.plantState === 'withered') {
      plant.classList.add('withered');
    }
    
    return plant;
  },

  /**
   * 创建花朵结构
   * @param {HTMLElement} plant 植物容器
   * @param {Object} type 类型定义
   */
  createFlowerStructure(plant, type) {
    // 花茎
    const stem = document.createElement('div');
    stem.className = 'flower-stem';
    plant.appendChild(stem);
    
    // 花头
    const head = document.createElement('div');
    head.className = 'flower-head';
    
    // 花瓣
    for (let i = 0; i < 5; i++) {
      const petal = document.createElement('div');
      petal.className = 'flower-petal';
      head.appendChild(petal);
    }
    
    // 花心
    const center = document.createElement('div');
    center.className = 'flower-center';
    head.appendChild(center);
    
    plant.appendChild(head);
    
    // 设置尺寸
    plant.style.width = `${type.size.width}px`;
    plant.style.height = `${type.size.height}px`;
  },

  /**
   * 创建树结构
   * @param {HTMLElement} plant 植物容器
   * @param {Object} type 类型定义
   */
  createTreeStructure(plant, type) {
    // 树干
    const trunk = document.createElement('div');
    trunk.className = 'tree-trunk';
    plant.appendChild(trunk);
    
    // 树冠
    const leaves = document.createElement('div');
    leaves.className = 'tree-leaves';
    plant.appendChild(leaves);
    
    // 设置尺寸
    plant.style.width = `${type.size.width}px`;
    plant.style.height = `${type.size.height}px`;
  },

  /**
   * 创建草结构
   * @param {HTMLElement} plant 植物容器
   * @param {Object} type 类型定义
   */
  createGrassStructure(plant, type) {
    // 多个草叶
    for (let i = 0; i < 3; i++) {
      const blade = document.createElement('div');
      blade.className = 'grass-blade';
      blade.style.position = 'relative';
      blade.style.height = `${15 + Math.random() * 10}px`;
      blade.style.animationDelay = `${Math.random() * 1}s`;
      plant.appendChild(blade);
    }
    
    plant.style.width = `${type.size.width}px`;
    plant.style.height = `${type.size.height}px`;
  },

  /**
   * 更新植物状态
   * @param {string} state 状态：'blooming', 'healthy', 'neutral', 'withering', 'withered'
   */
  updatePlantState(state) {
    this.plantState = state;
    
    this.currentPlants.forEach(({ element }) => {
      // 清除所有状态类
      element.classList.remove('blooming', 'healthy', 'withering', 'withered');
      
      // 添加新状态类
      if (state !== 'neutral') {
        element.classList.add(state);
      }
      
      // 盛开状态添加额外动画
      if (state === 'blooming') {
        element.style.animation = 'flowerBloom 2s ease-in-out infinite';
      }
    });
    
    // 更新草地颜色
    this.updateGrassColor(state);
  },

  /**
   * 更新草地颜色
   * @param {string} state 状态
   */
  updateGrassColor(state) {
    if (!this.grassLayer) return;
    
    const colors = {
      blooming: 'linear-gradient(180deg, rgba(76, 175, 80, 1) 0%, rgba(76, 175, 80, 0.8) 100%)',
      healthy: 'linear-gradient(180deg, rgba(76, 175, 80, 0.9) 0%, rgba(76, 175, 80, 0.7) 100%)',
      neutral: 'linear-gradient(180deg, rgba(152, 216, 200, 0.8) 0%, rgba(135, 206, 235, 0.6) 100%)',
      withering: 'linear-gradient(180deg, rgba(189, 183, 107, 0.7) 0%, rgba(189, 183, 107, 0.5) 100%)',
      withered: 'linear-gradient(180deg, rgba(139, 119, 101, 0.6) 0%, rgba(139, 119, 101, 0.4) 100%)'
    };
    
    this.grassLayer.style.background = colors[state] || colors.neutral;
    
    // 更新草叶颜色
    const blades = this.grassLayer.querySelectorAll('.grass-blade');
    blades.forEach(blade => {
      blade.classList.remove('withered');
      if (state === 'withered') {
        blade.classList.add('withered');
      }
    });
  },

  /**
   * 恢复植物
   * @param {Array} plants 植物数据数组
   */
  restorePlants(plants) {
    plants.forEach(typeId => {
      const plant = this.createPlantElement(typeId);
      if (plant && this.container) {
        this.container.appendChild(plant);
        this.currentPlants.push({ typeId, element: plant });
      }
    });
  },

  /**
   * 保存植物到存储
   */
  savePlants() {
    const state = Storage.getGardenState();
    state.plants = this.currentPlants.map(p => p.typeId);
    Storage.updateGardenState(state);
  },

  /**
   * 更新UI显示
   * @param {Object} state 花园状态
   */
  updateUI(state) {
    // 更新等级徽章
    const levelBadge = document.getElementById('level-badge');
    if (levelBadge) {
      levelBadge.textContent = state.levelName || '种子';
    }
    
    // 更新阳光值
    const sunshineValue = document.getElementById('sunshine-value');
    const sunshineBar = document.getElementById('sunshine-bar');
    if (sunshineValue) sunshineValue.textContent = state.sunshine || 0;
    if (sunshineBar) sunshineBar.style.width = `${state.sunshine || 0}%`;
    
    // 更新养分值
    const nutrientValue = document.getElementById('nutrient-value');
    const nutrientBar = document.getElementById('nutrient-bar');
    if (nutrientValue) nutrientValue.textContent = state.nutrient || 0;
    if (nutrientBar) nutrientBar.style.width = `${state.nutrient || 0}%`;
    
    // 更新连续打卡
    const streakCount = document.getElementById('streak-count');
    if (streakCount) {
      streakCount.textContent = Storage.getStreak();
    }
  },

  /**
   * 检查是否可以解锁新植物
   * @param {number} level 当前等级
   * @returns {Array} 可解锁的植物类型
   */
  checkUnlocks(level) {
    const unlocked = [];
    
    Object.entries(this.plantTypes).forEach(([typeId, type]) => {
      if (type.unlockLevel && type.unlockLevel <= level) {
        unlocked.push({
          typeId,
          name: type.name,
          emoji: type.emoji
        });
      }
    });
    
    return unlocked;
  },

  /**
   * 升级花园
   * @param {number} newLevel 新等级
   */
  upgradeGarden(newLevel) {
    const state = Storage.getGardenState();
    state.level = newLevel;
    state.levelName = Storage.getLevelName(newLevel);
    
    // 解锁新植物
    const unlocked = this.checkUnlocks(newLevel);
    if (unlocked.length > 0) {
      state.unlockedPlants = [
        ...state.unlockedPlants,
        ...unlocked.map(u => u.typeId)
      ];
      
      // 自动添加一个新植物
      const newPlant = unlocked[unlocked.length - 1];
      this.addPlant(newPlant.typeId);
    }
    
    Storage.updateGardenState(state);
    this.updateUI(state);
    
    return unlocked;
  },

  /**
   * 获取花园状态摘要
   * @returns {Object} 状态摘要
   */
  getStatusSummary() {
    const state = Storage.getGardenState();
    const recentMood = Storage.getRecentMood();
    
    return {
      level: state.level,
      levelName: state.levelName,
      sunshine: state.sunshine,
      nutrient: state.nutrient,
      plantCount: this.currentPlants.length,
      recentMood,
      weatherName: Weather.getWeatherName(),
      streak: Storage.getStreak()
    };
  },

  /**
   * 检查花园是否需要帮助（低能量）
   * @returns {boolean} 是否需要帮助
   */
  needsHelp() {
    const state = Storage.getGardenState();
    return state.sunshine < 30 || state.nutrient < 30;
  },

  /**
   * 获取帮助提示文案
   * @returns {string} 提示文案
   */
  getHelpHint() {
    const state = Storage.getGardenState();
    
    if (state.sunshine < 20 && state.nutrient < 20) {
      return '花园快要枯萎了，快完成一些任务拯救它吧！';
    }
    if (state.sunshine < 30) {
      return '阳光不足，花朵们需要你的关爱~';
    }
    if (state.nutrient < 30) {
      return '养分不够，植物们渴望成长的能量！';
    }
    return '花园正在茁壮成长，继续保持哦~';
  }
};