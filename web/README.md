# 碳迹绿行 · Web v5.0

历史项目源码；原服务已停止，不再维护。产品动机和演进见 [根 README](../README.md)。

React + TypeScript + Vite 前端与 FastAPI + SQLite 后端。账号、记录、统计、森林和排行通过独立 Web 后端组织，与微信小程序没有身份绑定或数据同步。

阅读入口：src/App.tsx → src/pages/Record.tsx → src/services/records.ts → backend/routers/records.py → backend/carbon_algorithm.py / models.py。

本地环境和构建方式见 [本地说明](../docs/local-development.md)。公开版本没有原数据库、部署凭据或外部装饰视频。
