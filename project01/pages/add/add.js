Page({
  data: {
    id: null,
    title: '',
    author: '',
    category: '',
    cover: '',
    status: 'want',
    rating: 0,
    notes: '',
    currentPage: '', 
    totalPages: '', 
    statusItems: [
      {value: 'want', name: '想读'},
      {value: 'reading', name: '在读'},
      {value: 'read', name: '已读'}
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.loadBook(options.id);
      wx.setNavigationBarTitle({ title: '编辑书籍' });
    } else {
      wx.setNavigationBarTitle({ title: '添加书籍' });
    }
  },

  loadBook(id) {
    const books = wx.getStorageSync('myBooks') || [];
    const book = books.find(b => b.id == id);
    if (book) {
      this.setData({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        cover: book.cover || '',
        status: book.status,
        rating: book.rating,
        notes: book.notes,
        // 如果是编辑旧书，且值为0，依然显示0；否则显示真实值
        currentPage: book.currentPage,
        totalPages: book.totalPages
      });
    }
  },
  
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },
  onStatusChange(e) { this.setData({ status: e.detail.value }); },
  onRatingChange(e) { this.setData({ rating: e.detail.value }); },
  chooseCover() {
    wx.chooseImage({
      count: 1, sizeType: ['compressed'],
      success: (res) => { this.saveImageToLocal(res.tempFilePaths[0]); }
    });
  },
  saveImageToLocal(tempPath) {
    const fs = wx.getFileSystemManager();
    const fileName = `cover_${Date.now()}.png`;
    const savePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    fs.saveFile({
      tempFilePath: tempPath, filePath: savePath,
      success: (res) => { this.setData({ cover: res.savedFilePath }); },
      fail: () => { this.setData({ cover: tempPath }); }
    });
  },
  handleStarClick(e) {
    const score = e.currentTarget.dataset.score;
    // 如果点击当前已选的分数，且是1分，再次点击取消评分（变成0）
    if (this.data.rating === score && score === 1) {
       this.setData({ rating: 0 });
    } else {
       this.setData({ rating: score });
    }
  },
  save() {
    const cleanTitle = this.data.title.trim();
    if (!cleanTitle) {
      wx.showToast({ title: '书名不能为空', icon: 'none' });
      return;
    }

    // 逻辑处理：如果用户没填(空字符串)，parseInt会变为NaN，|| 0 会兜底为0
    let current = Math.abs(parseInt(this.data.currentPage) || 0);
    let total = Math.abs(parseInt(this.data.totalPages) || 0);

    if (total > 0 && current > total) {
      wx.showToast({ title: '当前页不能大于总页数', icon: 'none' });
      return;
    }

    const cleanAuthor = this.data.author.trim() || '佚名';
    const cleanCategory = this.data.category.trim() || '未分类';

    let books = wx.getStorageSync('myBooks') || [];
    
    const newBook = {
      id: this.data.id || Date.now(),
      title: cleanTitle,
      author: cleanAuthor,
      category: cleanCategory,
      cover: this.data.cover,
      status: this.data.status,
      rating: this.data.rating,
      notes: this.data.notes.trim(),
      currentPage: current,
      totalPages: total,
      updateTime: new Date().toLocaleString()
    };

    if (this.data.id) {
      const index = books.findIndex(b => b.id == this.data.id);
      if (index !== -1) books[index] = newBook;
    } else {
      books.unshift(newBook);
    }

    wx.setStorageSync('myBooks', books);
    
    wx.showToast({ title: '保存成功' });
    setTimeout(() => wx.navigateBack(), 1500);
  }
});