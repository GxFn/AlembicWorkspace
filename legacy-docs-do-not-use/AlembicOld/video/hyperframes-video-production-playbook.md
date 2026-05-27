# HyperFrames 视频生成流程复盘与复用手册

> 记录 Alembic 介绍视频从失败稿到 V2 稳定稿的完整经验。下次做类似技术介绍视频时，先按本文准备内容，再进入 HTML / GSAP / HyperFrames 实现。

## 适用场景

这份手册适合：

- 用 Codex + HyperFrames 制作技术介绍视频、产品功能短片、代码架构解说。
- 视频内容需要从真实代码和文档提取证据，而不是做泛泛的营销片。
- 多个画面需要严格按时间轴切换，不能出现长空白、错位、布局溢出。
- 需要把 `lint`、`inspect`、渲染、抽帧和像素检查变成固定门禁。

当前参考产物：

- V2 项目：`video/alembic-short-intro-v2/`
- V2 QA：`video/alembic-short-intro-v2/QA.md`
- V2 草稿视频：`video/alembic-short-intro-v2/renders/alembic-short-intro-v2-draft.mp4`
- V2 抽帧拼图：`video/alembic-short-intro-v2/renders/frames/qa-contact-sheet.jpg`

## 本次踩坑结论

第一版视频主要有两个问题：

1. 每个画面之间出现很长的无效空画面。
2. 子场景布局和预期不一致，有些画面只剩局部文字或大面积暗底。

根因不是单个 CSS 小问题，而是制作链路不够隔离：

- 先写视频 HTML，而不是先写内容 brief、证据矩阵、脚本、分镜和 QA 门禁。
- 对 HyperFrames 子 composition 的真实时长理解不够严谨，误以为父级时间能兜住短 timeline。
- 子场景 CSS / GSAP selector 绑定在不稳定的挂载结构上，导致渲染时样式和动画失效。
- 没有在渲染前做 hero frame 精确采样，也没有在渲染后做抽帧和像素门禁。

V2 的稳定做法：

- 新建隔离项目，不在失败稿上继续堆补丁。
- 每个场景一个外部 composition，场景 timeline 明确持续完整时长。
- 先静态 hero frame，再加 entrance 和 ambient motion。
- 前 5 个场景不提前淡出，由根转场处理切换；最后一个场景才允许 fade out。
- `lint`、`inspect --samples`、`inspect --at` 通过后才渲染。
- 渲染后用 `ffprobe`、抽帧拼图和像素统计确认没有空画面。

## 插件与 Skill 链路

| 阶段 | 使用能力 | 作用 |
|---|---|---|
| 前期研究 | Web / 本地文档读取 | 补行业流程、确认技术约束、提取代码证据 |
| 前期制作 | 普通 Markdown 文档 | 内容 brief、证据矩阵、旁白、分镜、制作规格 |
| 视频实现 | HyperFrames skill | HTML composition、GSAP timeline、转场、布局规则 |
| 验证 | HyperFrames CLI skill | `lint`、`inspect`、`render`、`ffprobe`、抽帧 |
| 浏览预览 | Browser Use | 需要交互式预览或截图时使用 |
| 可选图像 | imagegen | 仅当需要真实 bitmap key art / 封面图时使用 |

原则：不要把“视频实现”提前到“内容准备”之前。技术介绍视频最容易失败的地方不是动画，而是没有把每一帧要表达什么讲清楚。

## 推荐目录结构

建议将长期复用文档放到 `docs/`，将具体视频工程放到独立 `video/<name>/`。

```text
docs/
  hyperframes-video-production-playbook.md

video/<project-name>/
  DESIGN.md
  README.md
  QA.md
  hyperframes.json
  index.html
  compositions/
    01-problem.html
    02-cold-start.html
    03-panorama.html
    04-governance.html
    05-mcp-ide.html
    06-feedback-loop.html
  preproduction/
    README.md
    01-content-brief.md
    02-evidence-map.md
    03-shooting-script.md
    04-storyboard-shotlist.md
    05-production-spec.md
  renders/
    <draft>.mp4
    frames/
      qa-01.jpg
      qa-contact-sheet.jpg
```

注意：本仓库当前 `.gitignore` 忽略了 `video/`，所以可复用流程文档应放在 `docs/`。如果需要提交视频工程，需要调整 `.gitignore` 或显式 `git add -f`。

## 标准阶段流程

### Phase 0：研究与复盘

目标：先确定“为什么做”和“上次为什么失败”。

输出：

- 研究链接和结论。
- 失败根因复盘。
- 本次不用什么做法。

本次采用的行业/工具原则：

- 专业视频制作先做 brief、脚本、storyboard、shot list，再进 production。
- 程序化视频要显式管理 composition duration、timeline、layout、sample check。
- HyperFrames 中 HTML 是视频源代码，`data-*`、GSAP timeline 和 CSS 都是视频行为的一部分。

### Phase 1：内容 Brief

必须回答：

- 受众是谁？
- 一句话信息是什么？
- 目标时长是多少？
- CTA 是什么？
- 哪些点必须讲，哪些点不能讲？

示例：

```text
One sentence:
Alembic turns a codebase into local project memory: it extracts patterns, routes them through review and governance, injects them into IDE agents through MCP, and uses Guard plus signals to keep that memory accurate.
```

经验：

- 技术短片每个 beat 只讲一个问题。
- 90 秒以内比 2 分钟更容易保持信息密度。
- 不要把安装命令塞进主视频，放 description 或 README。

### Phase 2：证据矩阵

每一个画面 claim 都要能指向本地文档或源码。

建议格式：

```markdown
| Claim | Screen Evidence | Local Source |
|---|---|---|
| Panorama builds project structure map | AST, CallGraph, Roles, 11 dimensions | docs/technical-reference.md, lib/service/panorama/PanoramaService.ts |
```

好处：

- 防止视频变成泛泛的产品广告。
- 避免展示无法证明的 benchmark 或夸大表述。
- 后续 UI 标签、代码路径、工具名都能直接从证据矩阵取。

### Phase 3：旁白脚本

旁白原则：

- 每段 1-2 句。
- 屏幕只放关键词，不把旁白全文贴上去。
- 技术名词可以保留英文标签，旁白用中文解释。
- 先做 silent visual draft，再考虑 TTS 或配音。音频会掩盖 timing 问题。

### Phase 4：Storyboard / Shot List

每个场景必须定义：

- 起止时间。
- scene duration。
- hero frame 时间点。
- 画面主视觉。
- 运动方式。
- 转场方式。
- 画面失败标准。

示例：

```markdown
| Scene | Time | Duration | Hero Frame | Transition |
|---|---:|---:|---:|---|
| S01 Problem | 0-10s | 10s | 6s | 0.35s scan wipe into S02 |
```

经验：

- 第一帧 0.5 秒内必须出现非背景内容。
- 任何转场不得制造超过 0.2 秒的全暗画面。
- hero frame 是 inspect 的精确采样点，不只是分镜备注。

### Phase 5：Production Spec

Production spec 是给实现阶段看的硬规则，不是创意文案。

必须写清：

- composition 架构。
- 每个 scene 的 `composition-id`、start、duration。
- root timeline 如何转场。
- scene timeline 如何撑满。
- lint / inspect / render 命令。
- 抽帧时间点。
- pixel QA 阈值。

本次 V2 的时长表：

```text
S01 scene-problem        0s   10s
S02 scene-cold-start    10s   14s
S03 scene-panorama      24s   14s
S04 scene-governance    38s   16s
S05 scene-mcp-ide       54s   14s
S06 scene-feedback-loop 68s   16s
Total: 84s
```

## HyperFrames 实现规则

### 1. 先有 DESIGN.md

必须先定义：

- 风格描述。
- 颜色。
- 字体。
- motion rules。
- 禁止事项。

不要一边写 CSS 一边随手发明颜色。否则多个场景会变成几套 UI。

### 2. Root composition 只负责挂载和转场

Root `index.html`：

- 不用 `<template>`。
- 有顶层 `data-composition-id`。
- 有全片 `data-duration`。
- 挂载各 scene composition。
- 管理少量全局 transition overlay。

V2 的稳定做法是让 scene mount 只声明：

```html
<div
  id="scene-01"
  data-composition-id="scene-problem"
  data-composition-src="compositions/01-problem.html"
  data-start="0"
  data-track-index="1"
  data-width="1920"
  data-height="1080"
></div>
```

不要依赖父级某个 `data-duration` 去“延长”一个很短的子 timeline。scene 自己的 timeline 必须完整持续到自己的结束时间。

### 3. 子 composition 用 `<template>`

结构：

```html
<template id="scene-example-template">
  <div data-composition-id="scene-example" data-width="1920" data-height="1080">
    <div class="scene-canvas scene-example">
      <!-- visible content -->
    </div>
    <style>
      .scene-example {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["scene-example"] = tl;
    </script>
  </div>
</template>
```

关键点：

- timeline key 必须和 `data-composition-id` 一致。
- 所有 timeline 都 `{ paused: true }`。
- timeline 必须同步构建，不能放在 `setTimeout`、Promise、async 里。
- 不要忘记 `window.__timelines["..."] = tl`。

### 4. 选择器绑定到稳定 class

失败稿里曾经把 CSS/GSAP 绑定在某些 root id 或父挂载结构上，渲染时 selector 没命中，导致画面只剩裸文字或空底。

稳定做法：

```html
<div class="scene-canvas scene-panorama">
```

```css
.scene-panorama .graph-panel { ... }
```

```js
tl.from(".scene-panorama .graph-panel", { opacity: 0, duration: 0.46 }, 0.72);
```

不要让子场景依赖父级 mount id，例如 `#scene-03`。父级结构可能不是最终渲染时的 DOM 形态。

### 5. 先做静态 hero frame，再做动画

实现顺序：

1. 写 HTML 和 CSS。
2. 不加 GSAP，看 hero frame 能否成立。
3. 只用 `gsap.from()` 加入场动画。
4. 加 ambient motion 撑满时长。
5. 只在最后场景加 exit / fade out。

布局规则：

- `.scene-canvas` 填满画布。
- 主内容优先用 grid / flex。
- primary content container 不要绝对定位。
- absolute 只用于 glow、scanline、decorative grid 等装饰。
- 长路径、工具名、代码 token 要 `overflow-wrap: anywhere`。
- 装饰元素加 `data-layout-ignore`。

### 6. Timeline 必须撑满完整 scene duration

长空屏最常见根因：

```js
// 只做 2 秒入场动画，scene 却计划显示 14 秒。
// 后续采样可能看到空或不完整状态。
tl.from(".title", { opacity: 0, duration: 0.5 }, 0);
tl.from(".panel", { opacity: 0, duration: 0.5 }, 0.5);
```

稳定做法：

```js
const duration = 14;
tl.from(".scene .title", { y: 36, opacity: 0, duration: 0.46 }, 0.1);
tl.from(".scene .panel", { y: 28, opacity: 0, duration: 0.46 }, 0.6);

// 用真实可见的 ambient motion 承载剩余时间。
tl.to(".scene .glow", {
  x: 120,
  scale: 1.08,
  duration: duration - 0.2,
  ease: "sine.inOut"
}, 0.1);
```

不要用空 tween 只为了撑时长。它不解释画面，也容易掩盖 timeline 设计问题。

### 7. 转场用少量持久 overlay

失败风险：

- 多个 timed transition div 容易触发 `timeline_track_too_dense`。
- timed div 没有 `class="clip"` 会被 lint 提醒可能整片可见。

V2 做法：

- root 放一个持久 `#transition-scan`。
- 用 root GSAP timeline 在绝对时间点触发同一个 scan line。
- overlay 加 `data-layout-ignore`。

示例：

```js
[
  9.75,
  23.75,
  37.75,
  53.75,
  67.75
].forEach((at) => {
  tl.fromTo(
    "#transition-scan span",
    { x: 0 },
    { x: 2300, duration: 0.48, ease: "power2.inOut" },
    at
  );
});
```

### 8. 避免 GSAP 属性冲突

`lint` 会提示同一个元素同一个属性的 tween overlap，例如：

```text
overlapping_gsap_tweens: GSAP tweens overlap on ".radar-shape" for rotation
```

修法：

- 入场动画不要同时动 `rotation`。
- 或把 ambient rotation 放到入场动画结束之后。
- 或明确错开时间。

好例子：

```js
tl.from(".radar-shape", { scale: 0.74, opacity: 0, duration: 0.48 }, 1.9);
tl.to(".radar-shape", { rotation: 36, duration: 11.4, ease: "none" }, 2.45);
```

## 固定验证流程

### 1. Lint

```bash
npx hyperframes lint
```

目标：

```text
0 errors, 0 warnings
```

常见 warning / error：

| 问题 | 含义 | 修法 |
|---|---|---|
| `timed_element_missing_clip_class` | timed div 可能整片可见 | 给 timed div 加 `class="clip"`，或改成持久 overlay |
| `timeline_track_too_dense` | root 同轨元素太多 | 合并 overlay 或拆 composition |
| `overlapping_gsap_tweens` | 同元素同属性动画重叠 | 错开 timeline 或移除冲突属性 |
| missing timeline | 没注册 `window.__timelines` | 注册 key，且 key 与 composition id 一致 |

### 2. 均匀布局采样

```bash
npx hyperframes inspect --samples 20
```

目标：

```text
0 layout issues
```

它能发现：

- 文字溢出容器。
- 子元素逃出裁剪容器。
- 内容超出 canvas。
- 某些时间点布局被动画带坏。

### 3. Hero frame 精确采样

根据 storyboard 的 hero frame 时间运行：

```bash
npx hyperframes inspect --at 6,18,32,47,62,78
```

这比均匀采样更重要，因为它检查的是每个场景最该好看的那一帧。

### 4. Draft 渲染

```bash
npx hyperframes render --quality draft --output renders/<name>-draft.mp4
```

注意：

- `draft` 用于迭代。
- `standard` 用于评审。
- `high` 用于最终交付。
- HyperFrames render summary 里的“完成时长”可能是 wall-clock 或摘要异常，不一定等于视频真实时长。

### 5. 用 ffprobe 确认真实媒体信息

```bash
ffprobe -hide_banner renders/<name>-draft.mp4
```

检查：

- Duration 是否符合 production spec。
- 分辨率是否 `1920x1080`。
- fps 是否 `30 fps`。

本次 V2：

```text
Duration: 00:01:24.00
Video: h264, 1920x1080, 30 fps
```

### 6. 抽关键帧

如果是 30fps，把时间秒数乘以 30 得到帧号。

V2 采样点：

```text
0.5, 6, 10.5, 18, 24.5, 32, 39, 47, 54.5, 62, 68, 78, 83.5
```

对应帧：

```text
15, 180, 315, 540, 735, 960, 1170, 1410, 1635, 1860, 2040, 2340, 2505
```

命令：

```bash
ffmpeg -hide_banner -y \
  -i renders/<name>-draft.mp4 \
  -vf "select='eq(n\,15)+eq(n\,180)+eq(n\,315)+eq(n\,540)+eq(n\,735)+eq(n\,960)+eq(n\,1170)+eq(n\,1410)+eq(n\,1635)+eq(n\,1860)+eq(n\,2040)+eq(n\,2340)+eq(n\,2505)',scale=960:-1" \
  -vsync 0 \
  renders/frames/qa-%02d.jpg
```

### 7. 生成 contact sheet

```bash
ffmpeg -hide_banner -y \
  -framerate 1 \
  -i renders/frames/qa-%02d.jpg \
  -vf "scale=480:-1,tile=4x4:padding=12:margin=12:color=0x07100f" \
  -frames:v 1 \
  renders/frames/qa-contact-sheet.jpg
```

看 contact sheet 时重点检查：

- 每个采样点是否是预期场景。
- 是否有接近全黑/全背景的空帧。
- 转场前后是否有无效暗屏。
- 文字是否太小或太挤。
- 场景节奏是否和 storyboard 对上。

### 8. 像素门禁

用简单像素统计避免只靠肉眼。

V2 规则：

- 取背景色 `#07100F`。
- 统计接近背景色的像素比例。
- 抽帧中若任一帧 `near_bg > 0.85`，判定为疑似空画面，需要人工复查。

脚本：

```bash
python3 - <<'PY'
from pathlib import Path
from PIL import Image

bg = (7, 16, 15)
threshold = 18

for p in sorted(Path('renders/frames').glob('qa-[0-9][0-9].jpg')):
    im = Image.open(p).convert('RGB').resize((160, 90))
    total = im.width * im.height
    near = 0
    bright = 0
    for r, g, b in im.getdata():
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) <= threshold:
            near += 1
        if r + g + b > 120:
            bright += 1
    print(f'{p.name}: near_bg={near / total:.3f} bright={bright / total:.3f}')
PY
```

V2 结果：

```text
Highest near_bg = 0.841
Threshold = 0.85
Result = pass
```

## QA 文档模板

每次视频都应该写 `QA.md`。

````markdown
# <Project> QA

Date: YYYY-MM-DD

## HyperFrames Checks

```text
npx hyperframes lint
-> 0 errors, 0 warnings

npx hyperframes inspect --samples 20
-> 0 layout issues

npx hyperframes inspect --at ...
-> 0 layout issues
```

## Render

```text
npx hyperframes render --quality draft --output renders/<name>-draft.mp4
```

Output:

```text
1920x1080 / 30fps / duration / size
```

## Frame QA

Sampled timestamps:

```text
...
```

Contact sheet:

```text
renders/frames/qa-contact-sheet.jpg
```

Pixel gate:

- Failure threshold:
- Highest sampled ratio:
- Result:
````

## 常见问题速查

### 问题：画面之间出现长空白

高概率原因：

- 子 composition timeline 只有入场动画，没有撑满 scene duration。
- 场景提前 fade out。
- 父级和子级 duration 理解不一致。

修法：

- 每个 scene timeline 都有持续到结尾的真实 motion。
- 不要让前 5 个 scene 自己 fade out。
- 用 root transition 覆盖切换。
- 用 `inspect --at` 和抽帧验证每个 hero frame。

### 问题：渲染后样式丢失，只剩裸文字

高概率原因：

- CSS selector 绑定了不稳定的父级 mount id。
- 子 composition 被挂载后 DOM 结构和本地预想不同。

修法：

- 给子场景内的主画布加稳定 class。
- CSS/GSAP 都绑定 `.scene-name ...`。

### 问题：lint 提示 timed element 没有 clip class

原因：

- 带 `data-start` / `data-duration` 的普通 div 需要 `class="clip"`。

修法：

- 给普通 timed div 加 `class="clip"`。
- 或者把多个 timed overlay 改成一个持久 overlay，用 root GSAP 在不同时间触发。

### 问题：文字溢出

修法：

- 缩小字号。
- 增大 column width。
- 给长 token 加 `overflow-wrap: anywhere`。
- 减少屏幕文字，不要把旁白全文放进去。

### 问题：GSAP target not found

原因：

- selector 没命中。
- timeline 构建时元素还不在当前 composition 内。
- selector 使用了父级结构或错误 id。

修法：

- 统一使用 scene-local class。
- 保证元素在同一个 template 内。
- lint 后再渲染，渲染日志出现大量 target not found 要停下来修，不要继续交付。

### 问题：Render 里出现 non-blocking 404

可能原因：

- favicon 或浏览器默认资源。
- 某个外部 media / script / asset 缺失。

处理：

- 如果项目依赖外部媒体，必须查清。
- 如果没有外部媒体，且抽帧完整，可以记录在 QA notes。

### 问题：HyperFrames summary 时长和 ffprobe 不一致

处理：

- 以 `ffprobe` 的媒体 duration 为准。
- 在 QA 里备注 HyperFrames summary 的异常。

### 问题：自动 worker 降到 1 个，渲染很慢

原因：

- 画面捕获成本高，Chrome compositor 压力大。

处理：

- draft 阶段可以接受。
- 若最终很慢，减少大面积 filter blur、复杂阴影、超大 SVG、过多透明层。

## 最终交付前 Checklist

前期内容：

- [ ] 有 `DESIGN.md`。
- [ ] 有 content brief。
- [ ] 有 evidence map。
- [ ] 有 shooting script。
- [ ] 有 storyboard / shot list。
- [ ] 有 production spec。

实现：

- [ ] root composition 不使用 `<template>`。
- [ ] sub-composition 使用 `<template>`。
- [ ] 每个 scene 有稳定 `.scene-canvas scene-name`。
- [ ] 每个 timeline `{ paused: true }`。
- [ ] 每个 timeline 注册 key 和 composition id 一致。
- [ ] 场景内容 0.5 秒内可见。
- [ ] 前 5 个场景不提前 fade out。
- [ ] 最后一场可以 fade out。
- [ ] 没有 `repeat: -1`。
- [ ] 没有 `Math.random()` / `Date.now()`。
- [ ] 没有 `data-layer` / `data-end`。

验证：

- [ ] `npx hyperframes lint` 为 0 errors / 0 warnings。
- [ ] `npx hyperframes inspect --samples 20` 为 0 issues。
- [ ] `npx hyperframes inspect --at <hero frames>` 为 0 issues。
- [ ] `ffprobe` 确认真实时长、分辨率、fps。
- [ ] 抽帧覆盖首帧、hero frames、转场边界、结尾。
- [ ] contact sheet 无空画面。
- [ ] 像素门禁通过。
- [ ] QA.md 已记录命令、输出和已知 warning。

## 下次执行建议

1. 不要直接复制旧视频工程改。先复制这份流程，重新建隔离目录。
2. 把 storyboard 的 hero frame 时间作为 `inspect --at` 的输入。
3. 每完成 2 个场景就可以先跑一次 `lint`，不要等 6 个场景全写完。
4. 渲染前必须通过 `inspect --samples` 和 `inspect --at`。
5. 渲染后必须抽帧，视频能播放不代表没有空帧。
6. 如果用户反馈“节奏不对”或“画面不符合预期”，先回到 preproduction，不要急着调 CSS。
