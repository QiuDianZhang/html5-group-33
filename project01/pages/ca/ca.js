Page({
  data: {
    year: 0,
    month: 0,
    days: [],
    emptyGrids: [],
    monthTotalMinutes: 0
  },

  onShow() {
    const now = new Date();
    if (this.data.year === 0) {
      this.setData({
        year: now.getFullYear(),
        month: now.getMonth() + 1
      });
    }
    this.generateCalendar();
  },

  prevMonth() {
    let { year, month } = this.data;
    if (month === 1) { year--; month = 12; } else { month--; }
    this.setData({ year, month }); this.generateCalendar();
  },
  nextMonth() {
    let { year, month } = this.data;
    if (month === 12) { year++; month = 1; } else { month++; }
    this.setData({ year, month }); this.generateCalendar();
  },

  generateCalendar() {
    const { year, month } = this.data;
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const logs = wx.getStorageSync('reading_duration') || {};

    let days = [];
    let totalMin = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${month}-${i}`;
      const minutes = logs[dateKey] || 0; // 获取当天的分钟数
      
      if (minutes > 0) totalMin += minutes;

      // 根据时长设置颜色深浅
      let level = 0;
      if (minutes > 0) level = 1;      // 读了
      if (minutes >= 30) level = 2;    // 读了半小时以上
      if (minutes >= 60) level = 3;    // 读了一小时以上

      days.push({
        day: i,
        date: dateKey,
        minutes: minutes, // 存入数据
        level: level
      });
    }

    const emptyGrids = new Array(firstDayOfWeek).fill(0);

    this.setData({
      days,
      emptyGrids,
      monthTotalMinutes: totalMin
    });
  },

  // 点击日期显示详情
  showTip(e) {
    const minutes = e.currentTarget.dataset.minutes;
    const day = e.currentTarget.dataset.day;
    const {year, month} = this.data;

    if (minutes > 0) {
      wx.showModal({
        title: `${year}年${month}月${day}日`,
        content: `今日专注阅读共 ${minutes} 分钟`,
        showCancel: false
      });
    }
  }
});