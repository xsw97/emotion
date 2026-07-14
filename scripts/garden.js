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
    this.lawnGrid = document.getElementById('lawn-grid');
    
    // 创建网格草坪
    this.createLawnGrid();
    
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
    
    // 初始化种植功能
    this.initPlanting();
  },

  /**
   * 创建网格草坪（植物大战僵尸风格）
   */
  createLawnGrid() {
    if (!this.lawnGrid) return;
    
    // 清空现有内容
    this.lawnGrid.innerHTML = '';
    
    // 创建15个格子 (5列3行)
    for (let i = 0; i < 15; i++) {
      const cell = document.createElement('div');
      cell.className = 'lawn-cell';
      cell.dataset.index = i;
      cell.dataset.row = Math.floor(i / 5);
      cell.dataset.col = i % 5;
      
      // 点击格子种植
      cell.addEventListener('click', (e) => {
        if (this.plantingMode && this.selectedPlantType) {
          this.plantInCell(cell, i);
        }
      });
      
      this.lawnGrid.appendChild(cell);
    }
  },

  /**
   * 在格子中种植植物
   * @param {HTMLElement} cell 格子元素
   * @param {number} index 格子索引
   */
  plantInCell(cell, index) {
    if (cell.classList.contains('planted')) {
      // 如果已有植物，提示用户
      if (typeof GardenAudio !== 'undefined') {
        GardenAudio.play('error');
      }
      return;
    }
    
    const typeId = this.selectedPlantType;
    const type = this.plantTypes[typeId];
    if (!type) return;
    
    // 标记格子为已种植
    cell.classList.add('planted');
    
    // 创建植物元素
    const plant = document.createElement('div');
    plant.className = 'plant plant-animation';
    plant.dataset.typeId = typeId;
    plant.dataset.cellIndex = index;
    plant.style.width = '100%';
    plant.style.height = '100%';
    plant.innerHTML = `<span class="plant-emoji">${type.emoji}</span>`;
    
    cell.appendChild(plant);
    
    // 创建粒子效果
    const rect = cell.getBoundingClientRect();
    const platformRect = this.platform.getBoundingClientRect();
    const x = rect.left - platformRect.left + rect.width / 2;
    const y = rect.top - platformRect.top + rect.height / 2;
    this.createPlantParticles(x, y);
    
    // 保存到存储
    this.savePlantedFlower(typeId, index, 'cell');
    
    // 播放音效
    if (typeof GardenAudio !== 'undefined') {
      GardenAudio.play('plant');
    }
    
    // 退出种植模式
    this.exitPlantingMode();
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
  },

  // ========== 种植功能 ==========
  
  /**
   * 种植模式状态
   */
  plantMode: {
    active: false,
    selectedPlant: null
  },
  
  // 兼容旧属性
  get plantingMode() {
    return this.plantMode.active;
  },
  
  get selectedPlantType() {
    return this.plantMode.selectedPlant;
  },

  /**
   * 初始化种植功能
   */
  initPlanting() {
    this.plantBtn = document.getElementById('plant-btn');
    this.plantPanel = document.getElementById('plant-panel');
    this.plantPanelClose = document.getElementById('plant-panel-close');
    this.plantGrid = document.getElementById('plant-grid');
    this.plantModeIndicator = document.getElementById('plant-mode-indicator');
    this.selectedPlantName = document.getElementById('selected-plant-name');
    
    if (!this.plantBtn || !this.plantPanel) return;
    
    // 绑定事件
    this.plantBtn.addEventListener('click', () => this.openPlantPanel());
    this.plantPanelClose.addEventListener('click', () => this.closePlantPanel());
    
    // 点击其他区域关闭种植模式
    document.addEventListener('click', (e) => {
      if (this.plantMode.active && 
          !this.plantPanel.contains(e.target) && 
          !this.plantBtn.contains(e.target) &&
          !e.target.closest('.lawn-grid')) {
        this.exitPlantMode();
      }
    });
    
    // 生成植物选项
    this.renderPlantOptions();
  },

  /**
   * 渲染植物选项
   */
  renderPlantOptions() {
    if (!this.plantGrid) return;
    
    const state = Storage.getGardenState();
    const unlockedPlants = state.unlockedPlants || ['flower-1', 'grass-1'];
    
    this.plantGrid.innerHTML = '';
    
    Object.keys(this.plantTypes).forEach(typeId => {
      const type = this.plantTypes[typeId];
      const isUnlocked = unlockedPlants.includes(typeId);
      const isLocked = type.unlockLevel && type.unlockLevel > state.level;
      
      const item = document.createElement('div');
      item.className = `plant-item ${!isUnlocked || isLocked ? 'locked' : ''}`;
      item.dataset.typeId = typeId;
      
      item.innerHTML = `
        <div class="plant-item-emoji">${type.emoji}</div>
        <div class="plant-item-name">${type.name}</div>
      `;
      
      if (isUnlocked && !isLocked) {
        item.addEventListener('click', () => this.selectPlant(typeId));
      }
      
      this.plantGrid.appendChild(item);
    });
  },

  /**
   * 打开种植面板
   */
  openPlantPanel() {
    if (this.plantPanel) {
      this.plantPanel.classList.add('active');
    }
    this.renderPlantOptions();
  },

  /**
   * 关闭种植面板
   */
  closePlantPanel() {
    if (this.plantPanel) {
      this.plantPanel.classList.remove('active');
    }
    this.exitPlantMode();
  },

  /**
   * 选择植物
   * @param {string} typeId 植物类型ID
   */
  selectPlant(typeId) {
    const type = this.plantTypes[typeId];
    if (!type) return;
    
    this.plantMode.active = true;
    this.plantMode.selectedPlant = typeId;
    
    // 更新UI
    if (this.selectedPlantName) {
      this.selectedPlantName.textContent = type.name;
    }
    if (this.plantModeIndicator) {
      this.plantModeIndicator.classList.add('active');
    }
    
    // 高亮选中的植物
    const items = this.plantGrid.querySelectorAll('.plant-item');
    items.forEach(item => {
      item.classList.toggle('selected', item.dataset.typeId === typeId);
    });
    
    // 关闭面板
    this.closePlantPanel();
  },

  /**
   * 退出种植模式
   */
  exitPlantMode() {
    this.plantMode.active = false;
    this.plantMode.selectedPlant = null;
    
    if (this.plantModeIndicator) {
      this.plantModeIndicator.classList.remove('active');
    }
    
    // 取消高亮
    const items = this.plantGrid.querySelectorAll('.plant-item');
    items.forEach(item => item.classList.remove('selected'));
  },

  /**
   * 处理种植点击
   * @param {Event} e 点击事件
   */
  handlePlantClick(e) {
    if (!this.plantMode.active || !this.plantMode.selectedPlant) return;
    
    // 获取点击位置
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 种植植物
    this.plantAt(this.plantMode.selectedPlant, x, y);
    
    // 退出种植模式
    this.exitPlantMode();
  },

  /**
   * 在指定位置种植
   * @param {string} typeId 植物类型ID
   * @param {number} x X坐标
   * @param {number} y Y坐标
   */
  plantAt(typeId, x, y) {
    const type = this.plantTypes[typeId];
    if (!type) return;
    
    // 创建植物元素
    const plant = document.createElement('div');
    plant.className = 'plant plant-animation';
    plant.dataset.typeId = typeId;
    plant.style.left = `${x - type.size.width / 2}px`;
    plant.style.top = `${y - type.size.height / 2}px`;
    plant.style.width = `${type.size.width}px`;
    plant.style.height = `${type.size.height}px`;
    plant.innerHTML = `<span class="plant-emoji">${type.emoji}</span>`;
    
    if (this.container) {
      this.container.appendChild(plant);
      
      // 创建粒子效果
      this.createPlantParticles(x, y);
      
      // 保存到存储
      this.savePlantedFlower(typeId, x, y);
      
      // 播放音效
      if (typeof GardenAudio !== 'undefined') {
        GardenAudio.play('plant');
      }
    }
  },

  /**
   * 创建种植粒子效果
   * @param {number} x X坐标
   * @param {number} y Y坐标
   */
  createPlantParticles(x, y) {
    const colors = ['#FFE066', '#FFB7C5', '#98D8C8', '#87CEEB'];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'plant-particle';
      particle.style.left = `${x}px`;
      particle.style.bottom = `${y}px`;
      particle.style.background = colors[i % colors.length];
      
      // 随机方向
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
      
      if (this.container) {
        this.container.appendChild(particle);
        
        // 动画结束后移除
        setTimeout(() => particle.remove(), 1000);
      }
    }
  },

  /**
   * 保存种植的花朵
   * @param {string} typeId 植物类型ID
   * @param {number} cellIndex 格子索引
   * @param {string} positionType 位置类型 ('cell' 或 'free')
   */
  savePlantedFlower(typeId, cellIndex, positionType = 'cell') {
    const state = Storage.getGardenState();
    if (!state.plants) {
      state.plants = [];
    }
    
    state.plants.push({
      typeId: typeId,
      cellIndex: cellIndex,
      positionType: positionType,
      plantedAt: Date.now()
    });
    
    Storage.set(Storage.KEYS.GARDEN_STATE, state);
  }
};