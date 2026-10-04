# WER Agent 基座实施计划

## 目标

建立一个前后端分离的模块化单体骨架，使 Agent 基座与策划业务扩展可以独立开发、测试和替换。

## 已落地的第一阶段

1. pnpm 工作区与共享 TypeScript 配置。
2. `shared` 共享请求、响应、事件和基础 `Result` 类型。
3. `backend` 模块化单体：runtime、harness、state、memory、retrieval、tool、skill、workflow、planning、evaluation、observability。
4. API 健康检查和聊天演示接口。
5. Web 客户端最小工作台，调用 API 展示 Agent 响应。

## 后续演进顺序

1. 将内存状态替换为持久化 State Store，并接入 checkpoint 与事件表。
2. 接入模型网关和真实工具注册中心。
3. 引入审批、预算、租约、幂等键和取消信号。
4. 扩展多级记忆、知识库检索和网页/外部平台连接器。
5. 增加策划业务 skill 与 workflow。
6. 建立 trace、回放、确定性规则评测和人工/模型评审。
