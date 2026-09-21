# 术语表、知识归属与学习线路

本篇不是词典式终点，而是把概念重新挂回执行主干：

```text
类型与声明
→ 名称查找 / 重载
→ 四种方法派发
→ 所有权与内存
→ 同步 / 异步 / 并发
→ 返回、错误与资源
→ Module / ABI / Runtime
```

## 1. 从一个调用开始

看到：

```swift
let value = try await service.load(id: id)
```

按顺序回答：

1. `service` 的静态类型是什么？
2. 哪些 `load` 声明在作用域和 access control 上可见？
3. 参数标签、类型和 generic constraint 选中了哪个声明？
4. 该声明落在 direct、class vtable、protocol witness，还是 Objective-C message？
5. Receiver、参数、metadata 和 conformance 怎样跨调用边界？
6. `await` 处是否可能挂起，当前 isolation 是什么？
7. 错误、取消和资源清理有哪些出口？
8. Module / resilience 允许优化器知道多少？
9. 当前构建最终是否特化、去虚化或 inline？

若这九问能回答，Swift 的多数“神奇行为”都能落回可验证模型。

## 2. 四条方法派发词汇

| 术语 | 精确定义 | 不等于 |
| --- | --- | --- |
| Name lookup | 在作用域、类型、extension、module 中寻找可见声明 | 运行时选 override |
| Overload resolution | 根据静态类型、标签、上下文和约束选声明 | Dynamic dispatch |
| Dispatch | 已选声明存在多个合法实现时确定实际入口 | 搜索同名函数 |
| Direct dispatch | 没有可观察运行时替换点，目标已知 | 一定 inline / 零成本 |
| Static dispatch | 广义上在运行前已确定目标的模型 | Swift `static` 关键字 |
| Dynamic type | class object 在运行时的真实 class 身份 | 变量的静态可见接口 |
| Override family | superclass 声明及其 subclass override 组成的实现族 | overload set |
| Vtable | class override 映射的常见实现表 | 语言公开可操作容器 |
| Dispatch thunk | 稳定入口到内部 table / calling convention 的转接 | 第五种派发 |
| Protocol requirement | protocol 主声明要求 conformer 提供的能力 | extension 中任意 member |
| Conformance | 某具体类型满足某协议的一致关系 | 每个实例可替换策略 |
| Witness | conformance 为某 requirement 选择的实现 | value 的复制函数总称 |
| Witness table | requirement 到 witness 的常见运行时映射 | value witness table |
| Selector | Objective-C message 的方法身份 | Swift 完整函数类型 |
| IMP | Objective-C Runtime 找到的方法实现入口 | 任意 Swift closure |
| `@objc` | 建立 Objective-C 可表示入口 | 强制所有 Swift 调用发消息 |
| `dynamic` | 强制成员访问使用 Objective-C Runtime 动态派发 | 仅仅暴露 selector |
| Devirtualization | 优化器证明动态目标唯一并消除间接选择 | 改变源码多态合同 |
| Inline | 在调用点展开实现以继续优化 | 语言保证更快 |
| Specialization | 为具体 generic context 生成 / 优化版本 | Generic 的唯一实现方式 |

## 3. 类型与抽象词汇

| 术语 | 精确定义 | 易错点 |
| --- | --- | --- |
| Static type | 编译期给表达式的类型 | 不一定是对象动态 class |
| Concrete type | 完整具体的类型身份 | 不一定公开实现细节 |
| Value semantics | 复制后的值可观察状态彼此独立 | 不等于栈存储 |
| Reference semantics | 多个引用可观察同一对象身份 | 不等于所有操作都动态派发 |
| Metatype | 类型本身作为值，例如 `T.Type` | 不是普通 instance |
| Generic parameter | 调用者提供并受约束的类型参数 | 不自动装入 existential |
| Associated type | 每个 conformance 确定的关联类型 | 不是 protocol 的普通泛型参数值 |
| `T: P` | 命名 generic type 与 conformance 约束 | 不保证一定特化 |
| 参数 `some P` | 匿名 generic parameter，调用者选类型 | 不是 `any P` |
| 返回 `some P` | 实现者选一个固定但隐藏的类型 | 不能每次任意换 conformer |
| `any P` | 能容纳不同 conformer 的 existential type | 不保证堆分配 |
| Existential opening | 暂时把 payload 作为隐藏 concrete type 使用 | 不表示 existential 自身普通符合 P |
| Type erasure | 隐藏 concrete type 身份，保留一组操作 | 不等于删除全部 runtime type info |
| Conditional conformance | 只有 generic argument 满足条件时才存在 conformance | 不是调用时临时猜测 |
| Retroactive conformance | 在类型与协议所有者之外添加 conformance | 有未来冲突风险 |

## 4. 内存与所有权词汇

| 术语 | 精确定义 | 易错点 |
| --- | --- | --- |
| Lifetime | 值或对象保持有效的时间范围 | 不等于词法变量名字可见期 |
| Ownership | 谁负责保持、转移和最终销毁值 | 不等于是否 `var` |
| Borrow | 有限期使用但不取得销毁责任 | 不代表绝不会产生任何 retain |
| Consume | 把所有权转给被调用方 | 不只是性能提示 |
| ARC | 管理引用对象强引用生命周期 | 不能自动回收强引用环 |
| Strong reference | 保持对象存活的引用 | `let` strong 仍允许对象内部修改 |
| Weak reference | 不保持存活，销毁后置 nil | 不是消除所有 closure cycle 的模板 |
| Unowned reference | 不保持存活并假设使用时仍有效 | 假设错误会失败 |
| COW | 修改前确保唯一存储的值语义优化 | 不等于自动线程安全 |
| Exclusivity | 对同一存储的冲突访问不能非法重叠 | 不等于 actor isolation |
| `inout` | 在独占访问中允许修改并写回 | 不应依赖固定传地址实现 |
| `Copyable` | 允许产生独立副本的能力 | 与 `Sendable` 不同 |
| `~Copyable` | 不默认允许复制的值类型约束 | 不等于 class identity |
| `Sendable` | 值可安全跨并发隔离域的合同 | 不决定方法派发 |
| `sending` | 跨隔离边界转移值及后续访问权限 | 不等于普通 copy |

## 5. 同步、异步与并发词汇

| 术语 | 精确定义 | 不等于 |
| --- | --- | --- |
| Synchronous | 调用者在普通控制流中等到完成 | 必然阻塞 I/O |
| Asynchronous | 函数 / 操作允许稍后完成或挂起 | 后台线程 |
| Blocking | 等待时占住当前 OS thread | 同步的同义词 |
| Suspension | 保存 Task 状态并让出执行线程 | Thread sleep |
| Serial | 工作之间不同时推进相应临界执行 | 同步 API |
| Concurrent | 多项工作允许时间上重叠推进 | 一定多核 |
| Parallel | 多项工作同一时刻真实执行 | 一定 async |
| Task | 异步工作的逻辑生命周期与上下文 | 固定 Thread |
| Job | Task 中一段可由 executor 运行的工作 | 完整业务任务 |
| Executor | 安排可运行 job 的抽象 | 语言保证一线程一队列 |
| Actor | 隔离可变状态的并发类型 | GCD serial queue |
| Global actor | 跨声明共享的全局隔离域 | 某条固定线程名字 |
| Reentrancy | Actor task 挂起后其他工作可进入同一 actor | 同时执行隔离片段 |
| Continuation | 挂起工作的一次性恢复桥梁 | 可重复 completion |
| Cancellation | “工作不再需要”的协作信号 | 强制线程终止 |
| Task group | 词法作用域内动态子任务结构 | 自动限流器 |
| `async let` | 固定数量结构化子任务 binding | 结果已经立即计算完 |
| Data race | 未同步冲突内存访问 | 所有业务逻辑顺序错误 |
| Logical race | 合法同步仍因事件顺序产生错误结果 | 编译器一定能发现 |

## 6. 错误与资源词汇

| 术语 | 精确定义 | 易错点 |
| --- | --- | --- |
| Optional | 值可能合法缺席 | 不保留失败原因 |
| `throws` | 函数可沿错误路径退出 | 不处理崩溃 exception |
| Typed throws | 静态保留具体错误类型 | 扩大公开错误合同 |
| `rethrows` | 只因传入 throwing function 而抛错 | 自己可任意制造错误 |
| `Result` | 把成功 / 失败保存为值 | Async API 必须再包一层 Result |
| `defer` | 当前同步作用域退出时执行清理 | 能任意 await |
| `deinit` | class 实例生命周期终点钩子 | 可靠远程事务触发器 |
| Assertion | 开发期内部假设检查 | 用户输入错误处理 |
| Precondition | 调用者必须满足的程序合同 | 可恢复网络错误 |
| Idempotency | 重复执行仍保持规定效果 | 所有操作天然可重试 |
| Compensation | 外部副作用后的业务补偿动作 | 自动数据库 rollback |

## 7. Module、ABI 与 Runtime 词汇

| 术语 | 精确定义 | 易错点 |
| --- | --- | --- |
| Module | 独立构建、导入和可见性单元 | 仅文件夹 |
| API | 源码可使用的接口与行为 | ABI symbol 全集 |
| ABI | 已编译组件间二进制合同 | 内部实现全部冻结 |
| Module stability | 不同编译器读取稳定 module interface | 运行时 ABI 本身 |
| Library evolution | 库在二进制兼容下继续演进 | 任意改变语义 |
| Resilience | 限制客户端对可演进布局的假设 | 一定明显更慢 |
| Metadata | Runtime 描述具体类型的信息 | 只有 reflection 用 |
| Value witness | 未知布局值的 copy/move/destroy 等操作 | Protocol requirement witness |
| Mangling | 把 Swift 类型化名字编码成 symbol | 公共人类 API 名 |
| Bridge | 在语言 / Runtime 表示之间转换 | 一定零拷贝 |
| Thunk | 适配 ABI、派发或表示的生成入口 | 新业务实现 |
| Back deployment | 在旧系统上提供新能力的兼容机制 | 所有 SDK API 自动可用 |

## 8. 语言扩展词汇

| 术语 | 编译期模型 | 最终落点 |
| --- | --- | --- |
| Property wrapper | 合成 storage、`wrappedValue` 与 projection access | 普通 property / accessor |
| Result builder | 把 closure statement 转为 build calls | 普通 static function calls |
| Macro | 根据语法生成额外受检查代码 | 普通 declarations / expressions |
| Dynamic member lookup | 未找到普通 member 时改写为 subscript | 普通 subscript 派发 |
| Dynamic callable | 调用语法改写为指定 method | 普通 method 派发 |
| `callAsFunction` | 实例获得调用语法 | 普通强类型 method |
| Key path | 类型化属性访问路径变成值 | accessor / projection |
| Operator | 特殊拼写和 precedence 的 function | overload + 普通调用 |

## 9. 按问题选择文档

| 现象 / 问题 | 首先阅读 |
| --- | --- |
| “同名函数为什么选了这个？” | [声明、函数与控制流](02-declarations-functions-and-control-flow.md) |
| “父类引用为何调用子类实现？” | [Class vtable](03-method-dispatch/02-class-vtable-dispatch.md) |
| “协议默认实现为何没有被替换？” | [Protocol witness](03-method-dispatch/03-protocol-witness-dispatch.md) |
| “`@objc` 与 `dynamic` 到底差什么？” | [Objective-C message](03-method-dispatch/04-objective-c-message-dispatch.md) |
| “为何 generic 和 any P 行为不同？” | [协议、泛型与多态](05-protocols-generics-and-polymorphism.md) |
| “struct 为什么仍会 retain / 分配？” | [内存、生命周期与所有权](04-memory-lifetime-and-ownership.md) |
| “async 为什么仍会卡界面？” | [同步、异步与并发](06-sync-async-concurrency/README.md) |
| “Actor 为什么 await 后状态变了？” | [Task、Actor 与 Executor](06-sync-async-concurrency/04-task-actor-and-executor.md) |
| “取消后为什么任务还在跑？” | [错误、取消与资源](07-errors-cancellation-and-resources.md) |
| “String 为什么不能整数下标？” | [集合、序列与文本](08-collections-sequences-and-text.md) |
| “SIL 里为何有 thunk / witness？” | [Runtime、模块与 ABI](09-runtime-modules-abi-and-interop.md) |
| “Macro / wrapper 生成了什么？” | [语言扩展机制](10-language-extension-mechanisms.md) |

## 10. 三条完整学习线路

### 10.1 从源码语义到底层实现

```text
00 全景
→ 01 类型和值
→ 02 声明、函数、重载
→ 03 四条派发
→ 09 Runtime / Module / ABI
```

### 10.2 从数据模型到泛型抽象

```text
01 值与引用
→ 04 生命周期 / Ownership
→ 05 Protocol / Generic / Existential
→ 03 Witness
→ 08 Collection / String
```

### 10.3 从调用到并发安全

```text
03 先确定具体实现
→ 06 同步 / 异步 / 挂起
→ Task / Actor / Executor
→ Sendable / Ownership
→ 07 Error / Cancellation / Cleanup
```

## 11. 实验式学习

为同一小例子分别观察：

```bash
swiftc -typecheck Example.swift
swiftc -emit-silgen Example.swift
swiftc -emit-sil Example.swift
swiftc -O -emit-sil Example.swift
swiftc -emit-ir Example.swift
```

建议每次只改变一个变量：

```text
struct → class
non-final → final
concrete → T: P
T: P → any P
protocol extension-only → requirement
@objc → @objc dynamic
same module → module boundary
-Onone → -O
sync → async
nonisolated → actor-isolated
```

记录：

- 源码可观察行为是否变化；
- SIL 的调用指令怎样变化；
- 优化后间接是否消失；
- 哪个结论属于语义，哪个只属于当前构建。

## 12. 反口诀清单

遇到这些句子立即补充条件：

```text
“Struct 都在栈上”
“Class 方法都查 vtable”
“Protocol 都会 box”
“Generic 永远静态派发”
“@objc 就是 objc_msgSend”
“Async 就是后台线程”
“Actor 就是串行队列”
“COW 自动线程安全”
“Weak 永远能解决内存泄漏”
“@inlinable 就一定 inline”
```

把每个绝对句改写为：

```text
在哪个静态类型上下文？
哪个 Swift language mode？
哪个 module / resilience 边界？
哪种运行时表示？
哪个优化级别和工具链？
语言保证了什么可观察行为？
```

## 13. 最终心智模型

Swift 的“安全”和“高性能”不是一个魔法开关，而是多层证据协作：

```text
静态类型排除非法调用
→ Protocol / generic 保留关系
→ 派发选择符合语义的实现
→ Ownership 保证值与对象有效
→ Isolation / Sendable 约束并发访问
→ Error / cancellation 封闭退出路径
→ Module / ABI 保持组件可演进
→ Optimizer 在这些合同内消除间接与复制
```

回到 [Swift 语言基础全景入口](README.md)。
