# 向量切片自审

范围：RecipeRegionVectorIndex、RecipeVectorGeneration、SyncCoordinator 及既有 SyncCoordinator 测试。原始目标是收窄真实依赖并清理私有继承桥接；没有新增 exports、删除公共类型、改动检索或持久化策略。

## 范围与兼容性

- 同步函数改用既有 reader 的 listIds/getById 与 writer 的 batchUpsert/remove；检查函数只读两个方法。完整 VectorStore 调用方仍可结构兼容。
- 私有 LifecycleVectorStoreBridge 在三仓源码/测试扫描中仅为原文件内部类；替代为相同 receiver 的四方法闭包。无未实现的 init/search/destroy 继承方法进入同步依赖。
- 保留配置优先级：reader/writer 各自优先显式 port，region 同步与默认终态 remover 优先 aggregate store。live entry_* 退休仍走 writer，不改变这一既有差异。
- 外层两宿主仍由 VectorService 传完整 store，配置、公共 DTO、错误与排序均保持。

## 证据与代码质量

改前四文件 65 tests 通过。新增两组有状态 adapter 场景在产品改动前通过，覆盖 receiver、替换读回、旧 region 清理、aggregate 优先级和无 provider 终态清理；改后四文件 67 tests 通过。窄调用编译探针改前仅两个 TS2345、改后零诊断；完整 Store 调用同步验证。build:check 和四文件 Biome 通过，git diff --check 通过。

初版 probe 未纳入全项目 ambient declarations，产生额外类型错误；已修正为完整 tsconfig roots，正确 RED 以 vector-port-red-corrected.log 为准。初版新增用例错误预期 entry_* 路由，已在产品变更前按真实实现修正；它不是产品 bug 复现。保留初次日志以区分探针问题和接口 RED。

自审未发现 P0/P1/P2 阻断项。没有添加新运行时分叉，不需新增诊断类别；既有失败日志和结果分类保持。类型探针与回归只证明本切片，全量组合检查将在后续 Core 切片完成后运行。

下游无需改接线或 vendor；继续 file 依赖，在本轮最终构建后消费更新的 dist。已删除的私有类没有外部兼容面；未使用公共 API 与请求只读能力保持原状。
