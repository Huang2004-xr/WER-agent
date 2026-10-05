# WER Agent

WER Agent 是面向策划人员的前后端分离、模块化单体 Agent。它把模型循环、执行约束、状态恢复、记忆、检索、技能、工作流和评测拆成可独立开发的模块，但仍由一个后端进程统一装配，避免过早拆成微服务。

## 快速开始

```bash
pnpm install
pnpm dev
```

API 默认监听 `http://localhost:8787`。前端单独启动：

```bash
pnpm dev:web
```

## 目录

```text
apps/
  api/              后端 HTTP 进程入口
  web/              前端 Web 进程入口
packages/
  shared/           前后端共享的类型、请求响应和基础内核
  backend/          模块化单体后端
```

后端内部边界见 [`packages/backend/src`](./packages/backend/src)，详细说明见 [`docs/architecture.md`](./docs/architecture.md)。

## 开发约定

Git 提交信息统一使用 `类型:中文描述` 格式，例如 `feat:增加策划需求解析`。完整规则见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

所有开发约束见 [`AGENTS.md`](./AGENTS.md) 和 [`docs/development-constraints.md`](./docs/development-constraints.md)。后续代码、接口、数据、Agent 行为和部署变更都必须遵循这些约束。

当前运行边界见 [`docs/runtime-status.md`](./docs/runtime-status.md)。正式运行需要 PostgreSQL、Redis 和 BullMQ 适配器。
