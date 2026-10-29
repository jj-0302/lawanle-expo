# 拉完了 · Expo 手机应用

从原有 PWA 改写的 React Native 应用，延续深色与绿色视觉，支持 Android / iOS，并提供网页预览。使用官方 Expo SDK 58 模板与 Expo Router，配套独立 Node.js / DeepSeek 服务端。

## 已实现

- 两步排便记录：布里斯托 7 型、顺畅程度、用时、备注、不适选项和可修改时间。
- 记录编辑、删除、连续记录天数；近 7 天频率和近 21 天形态分布。
- 本地持久保存；JSON 导出、导入合并、删除全部记录。
- DeepSeek 分析：近 21 天记录、可选备注与补充问题，发送前明确确认；结果包含观察、日常建议、就医提示和局限。
- 服务端访问码验证、输入验证、请求大小限制、并发限制、每小时调用上限、超时和错误处理。
- 密钥只在服务端；手机访问码保存在 SecureStore，网页预览仅存 sessionStorage。分析结果仅保留在内存中。

这是可继续开发的第一版，尚未发布至应用商店，不包含账号、云同步、付费或多人用户系统。本地记录未额外加密；单访问码与单实例内存限流适合个人测试，不应作为公开多人产品的身份系统。公开运营前需要用户认证、服务端配额、隐私审查和移动端实测。

## 在 VS Code 打开

打开整个 `lawanle-expo` 文件夹，先阅读本说明。需要 Node.js 22.13+（本机验证版本 22.22.3），建议使用 Node.js 22 LTS。

## 先运行手机端

在项目根目录打开终端：

```sh
npm install
npm start
```

使用与 SDK 58 兼容的 Expo Go 扫描终端二维码。电脑和手机需处于同一网络。若手机上的 Expo Go 版本不匹配，请按 [Expo 环境配置](https://docs.expo.dev/get-started/set-up-your-environment/) 使用兼容客户端或开发构建。此工程所用功能无需添加自定义原生代码。

仅电脑预览：

```sh
npm run web
```

不配置 AI 也能记录、统计、备份。

## 连接 DeepSeek

在另一个终端进入 `server` 文件夹：

```sh
npm install
npm run setup
```

`setup` 创建 `server/.env` 并生成随机 `APP_ACCESS_TOKEN`；已有文件不会被覆盖。在 VS Code 中编辑此文件：

```dotenv
DEEPSEEK_API_KEY=填入你自己的DeepSeek密钥
DEEPSEEK_MODEL=deepseek-flash
APP_ACCESS_TOKEN=保留自动生成的访问码
```

不要把真实密钥发到聊天里或提交到 GitHub。`.gitignore` 已排除 `.env` 文件，只提交 `.env.example`。DeepSeek 模型默认名称按 [官方 API 文档](https://api-docs.deepseek.com/) 确认，可由环境变量调整。调用按服务方规则计费，默认不自动重试。

启动服务：

```sh
npm run dev
```

在手机应用「设置」里填写：

- 服务地址：本机网页预览可填 `http://localhost:8787`；手机填 `http://电脑局域网IPv4地址:8787`。可在 Windows 终端运行 `ipconfig` 查看 Wi-Fi 或以太网的 IPv4 地址。手机的 localhost 指手机自己。
- 服务访问码：填 `.env` 中的 `APP_ACCESS_TOKEN`，不要填 DeepSeek 密钥。

点「保存连接设置」「测试连接」，再到「AI 分析」确认发送。本地开发允许 HTTP，局域网仅供可信网络测试；正式安装包只接受 HTTPS，因此发布前需部署服务端并配置 HTTPS 地址。云部署时由平台传入环境变量，运行 `npm run dev`（根目录设为 `server`），平台可覆写 `PORT`，设置 `HOST=0.0.0.0`。当前项目没有自动部署，也没有开通任何付费服务。

服务端不写入健康记录、分析内容或密钥日志；托管平台和 DeepSeek 有独立的数据处理政策。访问码不要放进 `EXPO_PUBLIC_*`，这些变量会随客户端公开。网页部署时把实际来源加入 `ALLOWED_ORIGINS`。当前限流是单进程内存计数，重启会重置；多实例公开部署前应替换成共享存储限流及独立用户配额。

## 备份与旧版数据

设置中可导出 JSON 并通过系统分享保存；导入前会验证文件。相同记录编号保留本机版本，其余合并。支持原 PWA 的 `[{ts,n,smooth,dur}]` 数组格式，但不能自动读取其他网页浏览器里的本地记录。卸载、清理数据或更换设备前请手动备份。导出文件包含健康信息。

## 打包安装包

已提供 `eas.json`，使用自己的 Expo 账号运行：

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

预览配置输出可直接安装的 Android APK；正式配置用于商店构建。iOS 分发还需要 Apple 签名与相应开发者账号。包名目前为 `com.lawanle.app`，正式发布前应更换成你自己的唯一标识。项目没有绑定他人的 Expo 项目 ID，也没有替你提交云构建或上架。

## 检查

先安装根目录和 `server` 的依赖，再运行：

```sh
npm run typecheck
npm run lint
npm test
npm --prefix server run typecheck
npm --prefix server test
npx expo-doctor
npx expo export --platform web
```

测试覆盖日期与窗口边界、连续记录、备份与旧版迁移、最小化发送、接口访问控制、验证、限流、错误脱敏，以及 AI SDK 与 DeepSeek 适配器的模拟请求。模拟响应不等于已验证真实密钥或服务可用额度。

健康信息参考 [NIDDK 便秘症状与原因](https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/symptoms-causes)、[腹泻症状与原因](https://www.niddk.nih.gov/health-information/digestive-diseases/diarrhea/symptoms-causes)。本应用提供记录与一般健康信息，不作诊断或处方。
