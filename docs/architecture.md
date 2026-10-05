# WER Agent 架构

## 设计原则

- **单体部署**：所有后端模块运行在同一个进程，由 `app` 统一装配。
- **前后端分离**：Web 只依赖 `shared` 契约和 HTTP API，不引用后端内部实现。
- **高内聚、低耦合**：模块通过端口（接口）通信，基础设施适配器放在 `infrastructure`。
- **可恢复执行**：运行状态、检查点和事件由 PostgreSQL 持久化，Redis 提供短期协调，BullMQ 负责长任务调度。
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

API 只负责协议和传输，业务决策在模块中完成。生产运行必须注入 PostgreSQL、Redis 和 BullMQ 适配器；未配置正式适配器时应用应拒绝启动，不得回退到内存状态。

正式基础设施选型和替换条件见 [`adr/0001-runtime-infrastructure.md`](./adr/0001-runtime-infrastructure.md)。
