# 本地阅读与自行复现

原服务已停止，项目不再维护。以下是基于源码的独立环境入口，不是原线上环境的恢复指南。需要自行安装工具与依赖；本次整理未启动服务器，也未做微信真机/云端验收。

## Web

### 前端

使用支持 Vite 6 的 Node.js 环境，进入 web：

```bash
npm ci
npm run dev
```

Vite 本地 /api 代理目标是 http://localhost:8000。只有前端时可看导览；账号、记录等功能需要自己的本地后端。构建命令为 npm run build。

### 后端

进入 web/backend，建立自己的 Python 虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，为 JWT_SECRET 设置自己的随机值
uvicorn main:app --env-file .env --host 127.0.0.1 --port 8000
```

config.py 从进程环境读取配置；上面的 --env-file 显式加载样例文件。SQLite 默认路径相对于后端启动目录，首次初始化会建立空库，公开仓库不带原用户数据。健康检查路径为 /api/health。

seed_data.py 是原开发时的合成演示数据工具，包含固定演示账号密码；不会自动执行，不含原用户数据库。仅需空库时不用它。

## 微信小程序

用微信开发者工具导入 miniprogram。project.config.json 的 touristappid 是公开占位；云开发功能需要换成自己的小程序 AppID，在 config/env.js 中设置自己的环境或使用工具的默认环境。

原结构使用 users、actions、trees、challengeClaims 集合及 8 个业务云函数。各云函数的 package.json 声明所需依赖；common.js 副本由 scripts/sync-cloud-common.js 同步。读取源码不需要连接原云环境，公开仓库也不提供该访问能力。

原有检查可直接在 miniprogram 中运行：

```bash
npm test
```

这组检查覆盖共享业务规则与同步队列，不涵盖真实微信身份、订阅消息、云数据库权限与真机界面。

## 项目状态

无需为展示而启动服务。自行复现属于读者的独立环境，本仓库没有维护、部署或线上支持承诺。实际完成过的本次检查见 validation.md。
