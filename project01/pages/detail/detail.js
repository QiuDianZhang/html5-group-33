Page({
  data: {
    book: {}
  },

  onLoad(options) {
    this.bookId = options.id;
  },

  onShow() {
    this.loadDetail();
  },

  loadDetail() {
    const books = wx.getStorageSync('myBooks') || [];
    const book = books.find(b => b.id == this.bookId);
    
    if (book) {
      const statusMap = { want: '想读', reading: '在读', read: '已读' };
      book.statusText = statusMap[book.status];
      
      const rPages = parseInt(book.currentPage) || 0;
      const tPages = parseInt(book.totalPages) || 0;

      if (tPages > 0) {
        book.percent = Math.floor((rPages / tPages) * 100);
        if (book.percent > 100) book.percent = 100;
      } else {
        book.percent = 0;
      }
      
      // 重新赋值给临时对象用于展示，不修改 storage
      book.displayCurrentPage = rPages;
      book.displayTotalPages = tPages;

      this.setData({ book });
    }
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/add/add?id=${this.data.book.id}` });
  },

  handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这本书吗？',
      success: (res) => {
        if (res.confirm) {
          let books = wx.getStorageSync('myBooks') || [];
          books = books.filter(b => b.id != this.bookId);
          wx.setStorageSync('myBooks', books);
          wx.showToast({ title: '已删除' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});