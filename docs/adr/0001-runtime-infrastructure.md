# ADR 0001：运行时基础设施选型

- 状态：已确认
- 日期：2026-10-05
- 范围：WER Agent Agent Run、Checkpoint、事件、审计和异步任务

## 决策

当前正式基础设施采用：

```text
PostgreSQL + Redis + BullMQ
```

- **PostgreSQL**：保存用户、项目、Session、Run、RunStep、Checkpoint、审批、工具调用、记忆索引、评测结果和审计事件等正式数据。
- **Redis**：提供缓存、分布式锁、Worker 租约、短期协调状态，并作为 BullMQ 的底层存储。
- **BullMQ**：负责 Agent 长任务、研究任务、文件处理、评测任务和定时任务的投递、重试、延迟、并发与失败管理。

业务模块只依赖 `StateStore`、`EventStore`、`QueuePort` 等端口，不直接依赖 PostgreSQL、Redis 或 BullMQ。基础设施实现必须放在 `infrastructure` 适配层。

## 约束

1. PostgreSQL 是业务事实和运行状态的权威存储，Redis 或 BullMQ 不得替代正式状态记录。
2. 每个可重试任务必须具备稳定的 `jobId`/幂等键，重复投递不能重复产生外部副作用。
3. Worker 必须使用租约、心跳、超时、重试和死信策略；未知的外部结果进入人工核对状态。
4. Checkpoint 和事件需要事务边界，能够支持进程重启后的恢复和审计回放。
5. BullMQ 是当前阶段的实现选择，业务代码不得直接绑定其 API；未来可通过同一端口替换为其他队列。

## 不选择其他方案的原因

- RabbitMQ 适合复杂服务间路由，但当前主要需求是 Node.js Agent 长任务调度，引入后会增加 Broker 和路由运维成本。
- Kafka 适合高吞吐事件流、多消费者和长期回放，当前 WER 的核心问题是可靠任务执行，不是大规模事件流。
- 只使用数据库队列可以减少组件，但不利于长任务的延迟、重试、租约和并发调度。

## 重新评估条件

出现以下情况时重新评估 RabbitMQ、Kafka 或其他方案：多语言服务大量互通、事件流吞吐显著增长、需要跨系统长期回放，或 BullMQ/Redis 的可靠性和运维成本不再满足目标。
