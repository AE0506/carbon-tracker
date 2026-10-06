// pages/learn/learn.js  低碳知识学院
const { getToday, getQuizKey } = require('../../utils/storage');
const { ARTICLE_LIST, QUIZ_DATA } = require('../../data/learn-data');

Page({
  data: {
    articles: ARTICLE_LIST,
    selArticle: null,
    showQuiz: false,
    quizIndex: 0,
    quizAnswered: false,
    quizCorrect: false,
    quizScore: 0,
    showResult: false,
    quizData: QUIZ_DATA,
    selAnswerIdx: -1,
  },

  onLoad() {
    this._checkQuizState();
  },

  _checkQuizState() {
    const today = getToday();
    try {
      const quizDone = wx.getStorageSync(getQuizKey(today)) || false;
      if (quizDone) {
        const score = wx.getStorageSync(getQuizKey(today, true)) || 0;
        this.setData({ quizScore: score, showResult: true });
      }
    } catch (e) {}
  },

  onArticleTap(e) {
    const article = this.data.articles.find((a) => a.id === e.currentTarget.dataset.id);
    if (article) {
      this.setData({ selArticle: article });
    }
  },

  onCloseArticle() {
    this.setData({ selArticle: null });
  },

  onCloseQuiz() {
    this.setData({ showQuiz: false });
  },

  onCloseAll() {
    if (this.data.selArticle) this.setData({ selArticle: null });
    if (this.data.showQuiz) this.setData({ showQuiz: false });
  },

  onStartQuiz() {
    this.setData({ showQuiz: true, quizIndex: 0, quizAnswered: false, quizCorrect: false, selAnswerIdx: -1 });
  },

  onAnswer(e) {
    if (this.data.quizAnswered) return;
    const idx = e.currentTarget.dataset.idx;
    const correct = idx === QUIZ_DATA[this.data.quizIndex].answer;
    this.setData({ quizAnswered: true, quizCorrect: correct, selAnswerIdx: idx });
  },

  onNextQuiz() {
    const next = this.data.quizIndex + 1;
    if (next >= QUIZ_DATA.length) {
      const today = getToday();
      const newScore = this.data.quizCorrect ? this.data.quizScore + 10 : this.data.quizScore;
      try {
        wx.setStorageSync(getQuizKey(today), true);
        wx.setStorageSync(getQuizKey(today, true), newScore);
      } catch (e) {}
      this.setData({ showQuiz: false, showResult: true, quizScore: newScore });
    } else {
      this.setData({ quizIndex: next, quizAnswered: false, quizCorrect: false, selAnswerIdx: -1 });
    }
  },

  onShareAppMessage() {
    return { title: '碳迹 · 低碳知识学院', path: '/pages/learn/learn' };
  },
});
