# 碳迹绿行 · 微信小程序 v6.7

历史项目源码；原服务已停止，不再维护。产品动机和双端脉络见 [根 README](../README.md)。

原生 JavaScript / WXML / WXSS，配合微信云开发；13 个页面、8 个业务云函数与共享模块。原 AppID、云环境及本机私有配置未公开。

阅读入口：app.js → pages/record → cloudfunctions/saveAction → cloudfunctions/common → 统计与森林云函数。原有检查：npm test。

需要自己的 AppID 与云环境才能复现云功能。见 [本地说明](../docs/local-development.md) 与 [架构](../docs/architecture.md)。
