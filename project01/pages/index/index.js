Page({
  data: {
    books: [],
    displayBooks: [],
    currentTab: 'all',
    searchKey: '',
    
    isTiming: false,
    timerStr: '00:00:00',
    seconds: 0
  },

  timerInterval: null,

  onShow() {
    this.loadData();
    // 检查是否有后台正在进行的计时
    this.checkBackgroudTimer();
  },

  onHide() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  checkBackgroudTimer() {
    const startTime = wx.getStorageSync('timer_start_time');
    if (startTime) {
      // 说明正在计时中
      this.setData({ isTiming: true });
      // 立即刷新一次 UI
      this.updateTimerUI(startTime);
      // 恢复定时器，每秒刷新 UI
      this.timerInterval = setInterval(() => {
        this.updateTimerUI(startTime);
      }, 1000);
    }
  },

  updateTimerUI(startTime) {
    const now = Date.now();
    const diffSeconds = Math.floor((now - startTime) / 1000);
    this.setData({
      seconds: diffSeconds,
      timerStr: this.formatTime(diffSeconds)
    });
  },

  // 开始/停止 计时
  toggleTimer() {
    if (this.data.isTiming) {
      // === 停止计时 ===
      // 1. 清除 UI 定时器
      clearInterval(this.timerInterval);
      
      // 2. 清除后台开始时间标记
      wx.removeStorageSync('timer_start_time');

      // 3. 结算时长
      const durationMinutes = Math.ceil(this.data.seconds / 60); 
      this.saveReadingLog(durationMinutes);

      // 4. 重置 UI
      this.setData({ 
        isTiming: false, 
        timerStr: '00:00:00', 
        seconds: 0 
      });
      
      wx.showModal({
        title: '打卡成功',
        content: `本次专注阅读 ${durationMinutes} 分钟，已记录到日历！`,
        showCancel: false
      });

    } else {
      // === 开始计时 ===
      // 1. 记录当前时间戳到 Storage
      const now = Date.now();
      wx.setStorageSync('timer_start_time', now);

      this.setData({ isTiming: true, seconds: 0, timerStr: '00:00:00' });
      
      // 2. 启动 UI 刷新
      this.timerInterval = setInterval(() => {
        this.updateTimerUI(now);
      }, 1000);
    }
  },

  formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  saveReadingLog(minutes) {
    if (minutes <= 0) return;
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    let logs = wx.getStorageSync('reading_duration') || {};
    logs[dateKey] = (logs[dateKey] || 0) + minutes;
    wx.setStorageSync('reading_duration', logs);
  },

  showSettings() {
    wx.showActionSheet({
      itemList: ['📤 导出数据 (备份)', '📥 导入数据 (恢复)', '🗑️ 清空所有数据'],
      success: (res) => {
        if (res.tapIndex === 0) { this.exportData(); } 
        else if (res.tapIndex === 1) { this.importData(); } 
        else if (res.tapIndex === 2) { this.clearData(); }
      }
    });
  },
  exportData() {
    const backup = {
      version: '1.0',
      timestamp: new Date().getTime(),
      myBooks: wx.getStorageSync('myBooks') || [],
      reading_duration: wx.getStorageSync('reading_duration') || {}
    };
    wx.setClipboardData({
      data: JSON.stringify(backup),
      success: () => { wx.showModal({ title: '备份成功', content: '数据已复制到剪贴板！', showCancel: false }); }
    });
  },
  importData() {
    wx.showModal({
      title: '准备导入',
      content: '请先复制备份的 JSON 文本，确定将覆盖当前数据！',
      success: (res) => {
        if (res.confirm) {
          wx.getClipboardData({
            success: (clipboard) => { this.processImport(clipboard.data); }
          });
        }
      }
    });
  },
  processImport(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.myBooks || !data.reading_duration) throw new Error('格式错误');
      wx.setStorageSync('myBooks', data.myBooks);
      wx.setStorageSync('reading_duration', data.reading_duration);
      this.loadData();
      wx.showToast({ title: '恢复成功', icon: 'success' });
    } catch (e) {
      wx.showModal({ title: '导入失败', content: '剪贴板内容无效。', showCancel: false });
    }
  },
  clearData() {
    wx.showModal({
      title: '危险操作', content: '确定清空所有数据？', confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          clearInterval(this.timerInterval);
          this.setData({ isTiming: false, timerStr: '00:00:00', seconds: 0 });
          this.loadData();
          wx.showToast({ title: '已清空' });
        }
      }
    });
  },

  loadData() {
    const books = wx.getStorageSync('myBooks') || [];
    this.setData({ books });
    this.filterBooks(); 
  },
  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.type });
    this.filterBooks();
  },
  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value });
    this.filterBooks();
  },
  clearSearch() {
    this.setData({ searchKey: '' });
    this.filterBooks();
  },
  filterBooks() {
    const { books, currentTab, searchKey } = this.data;
    let list = books;
    if (currentTab !== 'all') {
      list = list.filter(item => item.status === currentTab);
    }
    if (searchKey) {
      const key = searchKey.toLowerCase();
      list = list.filter(item => 
        (item.title && item.title.toLowerCase().includes(key)) || 
        (item.author && item.author.toLowerCase().includes(key)) ||
        (item.category && item.category.toLowerCase().includes(key))
      );
    }
    this.setData({ displayBooks: list });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },
  goCalendar() {
    wx.navigateTo({ url: '/pages/ca/ca' });
  }
});