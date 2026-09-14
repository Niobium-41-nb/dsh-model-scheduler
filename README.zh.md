# dsh-model-scheduler

[![check](https://github.com/Niobium-41-nb/dsh-model-scheduler/actions/workflows/check.yml/badge.svg)](https://github.com/Niobium-41-nb/dsh-model-scheduler/actions/workflows/check.yml) [![npm](https://img.shields.io/npm/v/dsh-model-scheduler)](https://www.npmjs.com/package/dsh-model-scheduler) [![license](https://img.shields.io/github/license/Niobium-41-nb/dsh-model-scheduler)](https://github.com/Niobium-41-nb/dsh-model-scheduler/blob/master/LICENSE)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件，为 Web 界面新增两个能力：

1. **可搜索的模型选择器。** 输入框选择模型时可按名称/ID 检索 —— 模型数量很多时尤其有用。
2. **高峰 / 空闲时段自动切换。** 为高峰时段和空闲时段各指定一个模型，到达时段边界时自动切换：**所有已打开的会话（下一次请求）** 和 **新会话（保存为部署默认）** 都会用对应时段模型。

> English readme: [README.md](README.md)。

---

## 工作原理

- 时段按 **北京时间（Asia/Shanghai，可在界面修改）** 计算。
- 默认时段：
  - **高峰：** 周一至周五 09:00–12:00 与 14:00–18:00（北京时间）。
  - **空闲：** 上述时段以外的所有时间 —— 周六、周日全天都属于空闲。
- 主进程每 **30 秒** 检查一次当前时段；跨过时段边界时应用对应模型：
  - 更新 `agentDefaultModel`（**新会话** 的默认模型）；
  - 所有已挂载的 **非子代理** 会话写入 `model/selection` 会话事件，该会话的 **下一次请求** 立刻使用对应模型。
- 在面板里修改配置时 **立即生效**（强制应用），无需等待下一轮检查。
- 启动时不覆盖任何已有选择：只记录当前时段作为基线。
- 应用前会用部署的 LLM 路由解析校验模型；路由不可用则记日志警告并跳过。

## 安装

```sh
dsh plugin --profile web add github:Niobium-41-nb/dsh-model-scheduler
```

重启 `dsh web`（或重载 profile），刷新浏览器页面即可。构建产物已提交到本仓库，用户侧无需任何构建步骤。

## 使用方法

1. 在输入框中，模型座旁边有一个时段徽标，显示**当前时段**（高峰 / 空闲）。点击打开调度面板。
2. 面板里可以：
   - **搜索并选择模型** —— 按模型名称、模型 ID 或提供商名称检索；每个模型有两类操作：*立即使用*（切换本会话，同时成为新的默认）与*设为高峰/空闲模型*。
   - **高峰模型 / 空闲模型** —— 自动切换使用的两条路由。
   - **高峰时段（显示时区）** —— 最多两个时间窗口；结束时间早于或等于开始时间表示跨午夜。
   - **高峰日** —— 星期几的开关（默认周一至周五；周末全天空闲）。
   - **启用开关** —— 打开/关闭自动切换。
   - **立即切换到当前时段模型** —— 立刻应用当前时段对应的模型。
3. 所有修改写入共享的 `model-scheduler` 设置命名空间，并立即生效。

## 配置

插件零配置即可使用（默认时段如上）。一切都可以在 GUI 修改，也可以在 `cordis.yml` 里配置同一个命名空间：

```yaml
- id: dsh-model-scheduler
  config:
    enabled: true
    timeZone: Asia/Shanghai
    peakDays: [1, 2, 3, 4, 5]        # 0=周日 … 6=周六
    peakWindows:
      - { start: "09:00", end: "12:00" }
      - { start: "14:00", end: "18:00" }
    peakModel: { provider: "deepseek-official", model: "deepseek-chat" }
    offPeakModel: { provider: "deepseek-official", model: "deepseek-reasoner" }
```

GUI 写入的 `model-scheduler` 设置段会覆盖这份组合配置。

## 开发

```sh
pnpm run host:test     # node --test：lib/tests（时段引擎 + 宿主行为）
pnpm run bundle        # tsdown → lib/client.js（客户端 half）
node scripts/verify-client.mjs  # 校验客户端 bundle 契约
```

目录结构：

- `lib/index.js` —— 宿主插件（`apply`）、设置命名空间 `model-scheduler`、30 秒定时器、默认与会话级切换。
- `lib/period.js` —— 纯时段引擎（IANA 时区、星期窗口、跨午夜窗口）。与 `src/client/period.ts` 保持同步。
- `src/client/*` —— 浏览器 half：可搜索选择器 + 调度面板（`conversation.input.right` 槽位）、词典（`model.scheduler`）、样式表。
- `cordis.patch.yml` —— `dsh plugin add` 使用的 bundle 清单。

发布产物是**已提交的构建输出**（`lib/client.js`），用户通过 git 安装即可，不需要 `prepare` 脚本或 `allowBuilds`。

## 许可证

MIT —— 见 [LICENSE](LICENSE)。