# 接口对接层研究入口

- [架构、问题证据与整理方案](architecture.md)
- [接口族清单 JSON](interface-map.json) / [CSV](interface-map.csv)
- [工具链研究](reports/tool-ports.json)
- [AI链研究](reports/ai-ports.json)
- [腾讯本地项目研究](reports/tencent-ports.json)
- [宿主资源scope探针](reports/scope-probe.json)
- [上下文与重复compactor探针](reports/context-probe.json)
- [探针编译输入核对](reports/probe-input-verification.json)
- [现有分层图统计](reports/layer-census.txt)
- [研究验证摘要](verification.json)

报告中的`AlembicAgent/…`、`Alembic/…`、`AlembicCore/…`、`TencentDB-Agent-Memory/…`为仓库逻辑路径。对应本地参考根：

| 仓库 | 相对本研究目录 |
| --- | --- |
| AlembicAgent | ../../../AlembicAgent |
| Alembic | ../../../Alembic |
| AlembicCore | ../../../AlembicCore |
| TencentDB-Agent-Memory | ../../../../TencentDB-Agent-Memory |

部分工具研究条目以Agent仓库为referenceBase记录`src/…`或`../Alembic/…`；AI研究使用repo/path/line三元组。均保留了读码位置和证据边界。

本轮是只读研究与可执行迁移建议，未把跨仓改动、旧接口删除或未来能力标成已实现。
