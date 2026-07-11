/**
 * 音频模块
 * 使用 Web Audio API 生成简单的背景音效和白噪音
 */

const GardenAudio = {
  context: null,
  isPlaying: false,
  oscillators: [],
  noiseNode: null,
  gainNode: null,

  /**
   * 初始化音频上下文
   */
  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 0.3;
    } catch (e) {
      console.error('Audio init error:', e);
    }
  },

  /**
   * 检查音频上下文状态
   */
  checkContext() {
    if (!this.context) {
      this.init();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  },

  /**
   * 播放背景音乐（轻柔的环境音）
   */
  playBackground() {
    this.checkContext();
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    // 创建柔和的和弦背景音
    const frequencies = [261.63, 329.63, 392]; // C-E-G（大三和弦）
    
    frequencies.forEach(freq => {
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // 创建包络，让声音更柔和
      const oscGain = this.context.createGain();
      oscGain.gain.value = 0.1;
      
      osc.connect(oscGain);
      oscGain.connect(this.gainNode);
      
      osc.start();
      this.oscillators.push({ osc, gain: oscGain });
      
      // 添加缓慢的音量变化，营造呼吸感
      this.modulateGain(oscGain, 0.05, 0.15, 4);
    });
    
    // 添加白噪音（模拟风声/水声）
    this.createNoise();
  },

  /**
   * 停止背景音乐
   */
  stopBackground() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    // 停止所有振荡器
    this.oscillators.forEach(({ osc, gain }) => {
      gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 1);
      setTimeout(() => osc.stop(), 1000);
    });
    this.oscillators = [];
    
    // 停止噪音
    if (this.noiseNode) {
      this.noiseNode.stop();
      this.noiseNode = null;
    }
  },

  /**
   * 切换背景音乐
   */
  toggleBackground() {
    if (this.isPlaying) {
      this.stopBackground();
    } else {
      this.playBackground();
    }
    return this.isPlaying;
  },

  /**
   * 创建白噪音（模拟自然环境）
   */
  createNoise() {
    const bufferSize = 2 * this.context.sampleRate;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);
    
    // 生成白噪音
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    this.noiseNode = this.context.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    
    // 添加滤波器，让噪音更柔和
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.05;
    
    this.noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.gainNode);
    
    this.noiseNode.start();
  },

  /**
   * 音量调制（营造呼吸感）
   */
  modulateGain(gainNode, min, max, period) {
    const modulate = () => {
      if (!this.isPlaying) return;
      
      const now = this.context.currentTime;
      gainNode.gain.linearRampToValueAtTime(max, now + period / 2);
      gainNode.gain.linearRampToValueAtTime(min, now + period);
      
      setTimeout(modulate, period * 1000);
    };
    modulate();
  },

  /**
   * 播放呼吸引导音效
   * @param {string} phase 阶段：'inhale', 'hold', 'exhale'
   * @param {number} duration 持续时间（秒）
   */
  playBreathingSound(phase, duration) {
    this.checkContext();
    
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    
    // 不同阶段使用不同频率
    const freqs = {
      inhale: 220,   // 低音，引导吸气
      hold: 330,     // 中音，保持
      exhale: 176    // 更低音，呼气放松
    };
    
    osc.frequency.value = freqs[phase] || 220;
    
    const gain = this.context.createGain();
    gain.gain.value = 0;
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start();
    
    // 音量包络
    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
    
    osc.stop(this.context.currentTime + duration);
  },

  /**
   * 播放任务完成音效
   */
  playCompletionSound() {
    this.checkContext();
    
    // 播放愉悦的和弦
    const notes = [392, 523.25, 659.25]; // G-C-E
    
    notes.forEach((freq, index) => {
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.context.createGain();
      gain.gain.value = 0;
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      const startTime = this.context.currentTime + index * 0.1;
      
      osc.start(startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.5);
      
      osc.stop(startTime + 0.5);
    });
  },

  /**
   * 播放升级庆祝音效
   */
  playLevelUpSound() {
    this.checkContext();
    
    // 上升的音阶
    const notes = [261.63, 329.63, 392, 523.25, 659.25]; // C-E-G-C-E
    
    notes.forEach((freq, index) => {
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.context.createGain();
      gain.gain.value = 0;
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      const startTime = this.context.currentTime + index * 0.15;
      
      osc.start(startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.3);
      
      osc.stop(startTime + 0.3);
    });
  },

  /**
   * 播放情绪选择音效
   */
  playMoodSelectSound() {
    this.checkContext();
    
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    
    const gain = this.context.createGain();
    gain.gain.value = 0;
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start();
    gain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.15);
    
    osc.stop(this.context.currentTime + 0.15);
  },

  /**
   * 设置音量
   * @param {number} value 音量值 0-1
   */
  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }
};