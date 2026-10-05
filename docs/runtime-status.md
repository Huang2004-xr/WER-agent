# 当前运行状态

## 已确认决策

项目不再保留内存状态、内存事件、内存记忆或内存队列实现作为最终结果。正式运行基础设施采用：

```text
PostgreSQL + Redis + BullMQ
```

## 当前行为

- `pnpm typecheck`：可通过。
- `pnpm --filter @wer/backend test`：仅运行不依赖持久化实现的配置、Agent Runtime、Harness 和 Planning 测试。
- `pnpm build`：可通过。
- `pnpm dev`：在 PostgreSQL StateStore 和 EventSink 尚未注入时，必须明确失败并提示缺少正式基础设施。

## 下一步实现顺序

1. 定义 PostgreSQL schema 和迁移：Run、RunStep、Checkpoint、Event、Approval、ToolCall、MemoryItem。
2. 实现 `PostgresStateStore` 和 `PostgresEventStore`，满足版本更新、幂等查询和事务边界。
3. 定义 Redis 连接、租约和幂等辅助端口。
4. 实现 `BullMQQueueAdapter` 和 Worker 消费入口。
5. 在 `app/container` 中通过配置注入正式适配器。
6. 增加持久化集成测试、Worker 恢复测试和重复投递测试。

在正式适配器完成前，开发者不能把 API 启动成功、任务可恢复或生产可用作为已完成能力。
