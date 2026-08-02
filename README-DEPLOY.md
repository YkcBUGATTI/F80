# FERRARI F80 展示站 · 部署与维护说明

> **FERRARI F80** — 跃马的全新超级跑车 · 中英双语展示站(非官方)
> 版本: v3.0 · 2026-08 · 设计语言参照 tourbillon.hypercar.site · 素材与数据基于 ferrari.com 官方车型页与媒体中心发布稿(2024-10-17 发布)

---

## 一、站点结构

```
f80-site/
├── index.html        中文版(默认入口)
├── en.html           英文版(语言切换按钮互跳)
├── manifest.json     PWA 清单(可安装到桌面)
├── sw.js             Service Worker(离线缓存)
├── css/style.css     设计系统(黑场 · 法拉利黄点缀 · 品牌字体)
├── js/main.js        交互(原生 JS,无框架)
├── fonts/            法拉利官方字体(本地化):
│   ├── Ferrari-SansRegular.woff2 / Ferrari-SansMedium.woff2(品牌字体)
│   └── NotoSans-Regular.woff2 / NotoSans-Bold.woff2(正文/中文回退)
├── assets/
│   ├── img/          72 张官方图(WebP,约 5MB)
│   └── video/        16 段官方视频(mp4,约 70MB)
└── favicon-32.png    站点图标
```

- 内容组织:00 序章 → 01 缘起(谱系卡 + **滚动车身亮点模块**)→ 02 设计 → 03 内饰 → 04 动力 → 05 混动 → 06 性能(表盘/eManettino/Boost Optimization)→ 07 空气动力学(全宽视频 + 热点交互)→ 08 底盘与动态(ADAS)→ 09 技术规格(视频开场 + 单表全列)→ 10 图库 → 11 总结
- 双语方案:`index.html` 中文(自撰叙事,忠于官方资料),`en.html` 英文(官方原文措辞);两页共用同一套 css/js/fonts。
- 数据口径:车型页(1200 cv、1050 kg 下压力 claim)与发布稿(1000 kg @ 250 km/h)两处官方表述均如实呈现,未做归一化。
- 设计系统(参照 tourbillon.hypercar.site):
  - **章节分隔页**:每章前独立分隔页(编号 + 章节名 + CHAPTER x/11 + 导语,入场动画)
  - **阅读进度**:顶部导航进度条 + 右下环形进度表盘 + 右侧章节索引栏(悬停展开,进度百分比)
  - **当前章节提示**:导航左上角实时显示"01 · 缘起"等
  - **法拉利红点缀**(#dc0000):标签、细线、数字、表盘、进度,克制使用
  - 品牌字体 Ferrari Sans(自官网提取本地化)+ 降饱和影像滤镜 + 1px 细线 + 三级文字层次
  - 交互:逐字标题入场、自定义光标、鼠标光斑、卡片 3D 倾斜、点击波纹、亮度脉冲、视口视频播放暂停、图片缩放揭示、视差
  - **车身亮点滚动模块**(参照官方 CarHighlights):滚动经过时,右侧车身图(悬挂/座舱/动力/外形)与左侧介绍文字同步切换 + 红色进度条
  - **全宽视频区 ×6**:内饰 / 发动机 / 制动 / 空气动力学 / 底盘 / 技术规格,均为视频背景 + 大标题 + 左下文字

## 二、本地预览

任选其一:

```powershell
# 方式一:Python 自带服务器(推荐)
cd f80-site
python -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二:直接双击 index.html(注意:SW/PWA 功能仅在 http(s) 下生效,file:// 下不影响浏览)
```

## 三、部署(免费方案三选一)

### 方案 A:Cloudflare Pages(推荐,全球 CDN,自带 HTTPS)

1. 注册 [Cloudflare](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Upload assets
2. 把 `f80-site/` 整个文件夹拖入上传,Framework preset 选 **None**
3. 部署完成后,自定义域名:Pages → Custom domains → 添加你的域名(如 `f80.example.com`)
4. 若使用 hypercar.site 域名:在 Cloudflare DNS 添加 CNAME 记录指向 Pages 域名即可

### 方案 B:GitHub Pages

1. 建仓库,把 `f80-site/` 内容推到 `gh-pages` 分支(或主分支 + Pages 设置指向目录)
2. Settings → Pages → Source 选对应分支,Save
3. 访问 `https://<用户名>.github.io/<仓库名>/`
4. 注意:子路径部署时,若资源相对路径(本项目已全部使用相对路径 `assets/...`,无需改动)

### 方案 C:国内访问(腾讯云 COS + CDN)

1. 开通 COS 桶(建议选广州/上海区域)→ 上传 `f80-site/` 内容
2. 桶设置 → 静态网站托管:索引文档填 `index.html`
3. 绑定已备案域名 → CDN 加速 → HTTPS 证书
4. 视频约 70MB,建议开启 CDN 分片缓存;若流量敏感,可改用视频直链托管(R2/OSS)

### 部署后必做

1. 修改两页 `<meta property="og:url">`(如有)与 `og:image` 为线上绝对地址(目前为相对路径,不影响功能,仅社交分享卡片需要)
2. 若换域名,`sw.js` 无需改动(缓存策略按同源);首次发布建议把 `sw.js` 顶部 `const CACHE = 'f80-v1'` 的版本号 +1,强制旧访客更新

## 四、维护规范

| 想改什么 | 改哪里 |
| --- | --- |
| 文案/章节内容 | `index.html` / `en.html` 对应 `<section>`(中英两处都改) |
| 配色/字体/间距 | `css/style.css` 顶部 `:root` 变量 |
| 动效/交互 | `js/main.js`(注释分段:菜单/灯箱/热点/tabs...) |
| 图库图片 | `js/main.js` 的 `GALLERY_IMGS` 数组(图片放 `assets/img/`) |
| 新增章节 | HTML 加 `<section>` + 章节导航按钮 + `js/main.js` 高亮逻辑自动覆盖 |
| 技术参数 | 09 章节规格表(中英两处),数据须与官方一致 |

**改完验证**:本地起服务 → 打开控制台无报错 → 逐个点击:语言切换/菜单/热点/规格 tab/图库/视频,确认页面不跳动。

## 五、常见问题 FAQ

- **视频不播放?** 视频为本地 mp4,确认 `assets/video/` 完整上传;部分浏览器需 HTTPS 才允许自动播放(静音背景视频不受限,点击播放的模态不受限)。
- **手机上看不到右侧章节导航?** 移动端已隐藏,使用顶部菜单按钮。
- **PWA 安装提示?** 桌面 Chrome/Edge 地址栏右侧安装图标;需要 HTTPS。
- **想禁用动效?** 系统开启"减弱动态效果"(prefers-reduced-motion),站点自动降级为无动画。
- **图片放大模糊?** 官方原图宽度 1920,已按需下载;如需更高清,可用 `cdn.ferrari.com/cms/network/media/img/resize/{ID}?width=2560` 重新取(部分 ID 在 1920+ 会返回 502,属官方 CDN 限制,用 1600 安全)。

## 六、合规提醒

- 本站为**粉丝自制非官方展示站**,与 Ferrari S.p.A. 无任何关联;页脚已保留免责声明。
- 全部文字、图片、视频版权归 Ferrari S.p.A. 所有,仅供学习与个人展示,请勿用于商业用途。
- 建议在 `robots.txt` 中禁止搜索引擎收录(如 `User-agent: *` + `Disallow: /`),并在页面保留页脚声明。
- 数据截至 2026-08;若官方更新车型信息,请以官方页面为准并及时更新本站。

## 七、素材来源

- 车型页: https://www.ferrari.com/en-EN/auto/f80
- 发布稿: https://www.ferrari.com/en-EN/media-centre/articles/f80-ferraris-new-supercar
- 图片:官方 CDN `cdn.ferrari.com`(WebP 压缩,质量 82)
- 视频:官方 THRON 流媒体 `ferrari-cdn.thron.com`(HLS → mp4,原码率)
