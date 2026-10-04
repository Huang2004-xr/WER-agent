# WER Agent 架构

## 设计原则

- **单体部署**：所有后端模块运行在同一个进程，由 `app` 统一装配。
- **前后端分离**：Web 只依赖 `shared` 契约和 HTTP API，不引用后端内部实现。
- **高内聚、低耦合**：模块通过端口（接口）通信，基础设施适配器放在 `infrastructure`。
- **可恢复执行**：运行状态、检查点和事件都由 `state` 管理，后续可接 MySQL、Redis 或队列。
- **可控 Agent**：`harness` 在模型循环和工具执行外层提供权限、预算、审批、取消和审计约束。

## 包级结构

```text
WER Agent
├── apps
│   ├── api                 # 后端 HTTP 进程
│   └── web                 # 前端 Web 进程
├── packages
│   ├── shared              # 跨端契约与基础类型
│   └── backend             # 模块化单体后端
│       └── src
│           ├── app         # 模块装配、HTTP 应用
│           ├── modules     # Agent 领域模块
│           ├── infrastructure # 数据库、模型、队列等适配器
│           └── interfaces  # HTTP、Worker、Scheduler 入口协议
└── docs
```

## 一次请求的边界

`web -> api -> app -> harness -> agent-runtime -> skill/tool/workflow -> state/memory/retrieval -> api -> web`

API 只负责协议和传输，业务决策在模块中完成。默认实现使用内存存储和演示模型，目的是让骨架立即可运行；生产环境通过 `infrastructure` 替换为真实模型、数据库、缓存和外部平台连接器。
