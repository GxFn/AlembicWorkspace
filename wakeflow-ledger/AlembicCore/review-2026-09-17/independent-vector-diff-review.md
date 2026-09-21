# 主线程向量/持久化独立复核

已读 AsyncPersistence、HnswVectorAdapter、BinaryPersistence 与 IndexingPipeline 最终核心差异和其实际调用关系。

- WAL只有完整snapshot成功后确认，保存期间追加的尾部单独保留；recover只恢复内存不提前删WAL。后台异常有诊断且延迟重试。
- 字符串ID、metadata/contents的Map转换保持ASVEC v1格式；own __proto__ 键不被对象原型吞掉。
- 非WAL路径原存在保存期间新增数据被dirty=false覆盖的漏写，独立指出并经真实ASVEC重启RED；revision+串行persist、显式flush drain、有界同步destroy补存已修，见intelligence-hnsw-no-wal-*日志。
- flush先等待在途保存，再检查未覆盖revision；save错误保dirty并传给调用者。destroy保持原同步void，可靠调用次序仍是await flush再destroy；destroy后不启动timer或无限重试。
- 空向量替换会移除旧ANN召回，metadata/content保留，避免关键词更新仍命中旧embedding。
- pipeline旧ID仅按可读sourcePath/旧chunk归属保留，新ID是路径无损编码；marker持久化沿原metadata通道，无公共DTO/WAL新版本。
- 完整扫描、明确ENOENT、当前scan scope和producer marker共同限定删除；权限/读取错误和归属不明历史条目保留。批量写入成功后再移除旧owned块。
- useAST/auto在需要时初始化既有parser，未新增外部provider调用；撤销provider同步清batcher。未执行真实AI请求。

当前已审差异未发现未处理P0/P1回归。旧未标记且源已删除的残留因无法证明producer归属继续保留，需要单独可审查迁移；不得作为“已清干净所有历史向量”的结论。
