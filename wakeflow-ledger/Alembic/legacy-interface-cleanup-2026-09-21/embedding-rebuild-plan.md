# Embedding 与重建接线清理

本项为主线程直接授权的 Main 子任务，不执行 Wakeflow 派发、控制状态或提交。Main 基线 615e4c47b37a74dc13b84afebae5eafafb3b8615；Core 516e05ac11210505eb7fa2d36e87e270391ecdfa 只读。

1. 运行 CommandsFileRoutesAo3、IndexingPipeline integration、RecipeVectorGenerationRuntime、EmbeddingIsolation 当前基线，记录旧增量 fixture 的已知失败。
2. 在既有 Commands HTTP 测试要求两种装配路径均收到 `{ clear, force }`，涵盖默认清理与显式不清理；先记录旧实现违反参数契约的 RED，再使用 Core fullBuild 的现有 clear 支持，删除宿主手工 clear 和重复结果投影。保留缺 embedding 在解析服务/写入前失败及既有六字段结果。
3. 只修复旧 integration fixture：真实 JsonVectorAdapter 首次写入、再次无变化、内容变更后重建，验证第二次不 embed/不 upsert；不放宽 Core 的 sourcePath、producer、完整 chunk 集校验。
4. ServiceMap.vectorStore 对齐真实 GenerationRoutingVectorStore；两处装配调用现有 profile 方法，不再重复 instanceof/duck 检查。若两 Profiled 包装可直接使用同一个 typed store，则删除额外 callback 参数；对应测试仍覆盖 profile mismatch、本地读失败、sparse 回退、恢复后调用 query、固定实例与增量显式迁移。
5. 对上述限定测试、相关 recipe generation 命令/消费方执行回归；运行 Main no-emit、变更文件 Biome、层级/仓库/Core 导入边界及 diff-check。不构建或改 Core，不合并文件索引与 Recipe generation 入口，不改配置、阈值、权限、取消或错误回执。

RED 计划：HTTP 参数契约由真实 commandsRouter → Dashboard handler 观测；旧增量 fixture 的既有失败作为测试适配证据。Typed store 为结构收敛，沿用真实 profile/本地故障/恢复和 DI 生命周期负例，不新增实现镜像测试。完成后记录命令、日志、源 hash、两阶段自审及无提交理由。
