# Surge 自动签到模块 — 使用说明

## 📦 模块文件清单

| 文件 | 说明 |
|------|------|
| `JD_Taobao_Xianyu.sgmodule` | **主模块文件**（安装到 Surge） |
| `JD_Sign.js` | 京东每日签到脚本 |
| `JD_Goose.js` | 京东金融养大鹅（签到+喂食） |
| `JD_Pig.js` | 京东养猪猪（签到+喂食） |
| `TB_Coin.js` | 淘宝淘金币（签到+领金币） |
| `XY_Checkin.js` | 闲鱼（签到+得骰子） |
| `JD_Cookie.js` | 京东 Cookie 获取 |
| `JDJR_Cookie.js` | 京东金融 Cookie 获取 |
| `TB_Cookie.js` | 淘宝 Cookie 获取 |
| `XY_Cookie.js` | 闲鱼 Cookie 获取 |

---

## 🚀 安装步骤

### 第一步：部署脚本

将所有 `.js` 文件上传到可公开访问的位置（推荐以下任一方式）：

**方式 A — GitHub 仓库（推荐）**
1. 创建一个 GitHub 仓库（建议 Private）
2. 将所有 `.js` 文件推送到仓库
3. 使用 `raw.githubusercontent.com` 链接

**方式 B — 本地 Web 服务器**
1. 在路由器/NAS/电脑上启动一个简单的 HTTP 服务
2. 将 `.js` 文件放到 web 目录下
3. 确保内网可访问

**方式 C — iCloud/本地文件**
1. 将所有文件放到 iCloud Drive
2. 在模块中引用本地路径

### 第二步：修改模块中的脚本路径

打开 `JD_Taobao_Xianyu.sgmodule`，将所有 `script-path=` 后面的路径替换为你的实际脚本 URL：

```ini
# 如果使用 GitHub（替换 YOUR_USERNAME 和 REPO_NAME）
script-path=https://raw.githubusercontent.com/YOUR_USERNAME/REPO_NAME/main/JD_Sign.js

# 如果使用本地文件
script-path=/Users/你的用户名/Library/Mobile Documents/iCloud~com~nssurge~surge/scripts/JD_Sign.js
```

### 第三步：安装模块到 Surge

1. 打开 Surge APP → **模块** → **安装新模块**
2. 粘贴模块文件的 URL（或选择本地文件）
3. 启用模块

### 第四步：开启 MITM

1. Surge → ** MitM** → 确保 **MITM for HTTP/2** 已开启
2. **配置 MITM 主机名**，确保包含以下域名：
   ```
   api.m.jd.com
   ms.jr.jd.com
   h5api.m.taobao.com
   ```
3. **安装并信任 CA 证书**（Surge → 其他设置 → CA 证书）

### 第五步：获取 Cookie

首次使用需要手动获取各平台的 Cookie：

#### 京东 Cookie
1. 打开 Safari 浏览器
2. 访问 `https://bean.m.jd.com`
3. **手动登录**京东账号（推荐手动输入密码，不要粘贴）
4. 登录成功后，Cookie 会自动捕获
5. 收到 Surge 通知 "✅ Cookie 获取成功" 即可

#### 京东金融 Cookie
1. 打开京东金融 APP
2. 进入 **养大鹅** 或 **养猪猪** 页面
3. 等待页面加载完成
4. Cookie 自动捕获

#### 淘宝 Cookie
1. 打开淘宝 APP
2. 进入 **淘金币** 页面
3. 等待页面加载完成
4. Cookie 自动捕获

#### 闲鱼 Cookie
1. 打开闲鱼 APP
2. 进入 **我的** 页面
3. 等待页面加载完成
4. Cookie 自动捕获

---

## ⏰ 定时任务时间表

| 任务 | Cron 表达式 | 执行时间 |
|------|-------------|----------|
| 京东签到 | `5 7 * * *` | 每天 07:05 |
| 京东金融养大鹅 | `0 8 * * *` | 每天 08:00 |
| 京东养猪猪 | `15 8 * * *` | 每天 08:15 |
| 淘宝淘金币 | `30 7 * * *` | 每天 07:30 |
| 闲鱼签到 | `30 8 * * *` | 每天 08:30 |

> 如需修改时间，编辑 `.sgmodule` 文件中对应的 `cronexp` 参数即可。

---

## 🔧 调试指南

### 查看日志
Surge → **工具箱** → **最近请求** → 搜索 "cron" 或查看 **Surge Dashboard** 的 **脚本日志**

### 常见问题

**Q: 通知显示 "Cookie 缺失"**
- 重新打开对应 APP 获取 Cookie
- 检查 MITM 是否正确配置
- 确认 CA 证书已安装并信任

**Q: 签到返回 "今日已签到"**
- 正常现象，说明当天已签到过

**Q: 签到返回 "网络请求失败"**
- 检查网络连接
- 确认脚本 URL 可正常访问
- 查看 Surge 日志中的具体错误信息

**Q: Cookie 失效**
- Cookie 通常 7-30 天失效
- 失效后重新打开 APP 刷新 Cookie 即可
- 京东金融 Cookie 失效较快，建议定期刷新

**Q: 修改定时执行时间**
- 编辑 `.sgmodule` 文件中的 `cronexp` 参数
- Surge cron 使用标准 5 位格式：`分 时 日 月 周`

---

## ⚠️ 免责声明

1. 本模块仅用于 **学习研究**，请勿用于任何商业或非法目的
2. 使用本模块产生的任何后果由使用者自行承担
3. 脚本中涉及的接口可能随平台更新而失效，请关注更新
4. 建议低调使用，频繁调用可能触发风控
