# 集合、序列与文本：Swift 标准库的协议化数据线路

Swift 集合不是一组彼此孤立的容器 API。它们建立在协议、泛型、值语义和索引合同上，
是前面几条主干的综合应用：

```text
具体存储
→ Sequence / Collection requirement
→ Generic algorithm
→ Witness 或 specialization
→ 值语义与 COW
→ Complexity 与索引保证
```

## 1. Sequence：能按顺序产出元素

`Sequence` 的核心能力是生成 iterator 并依次取得元素。最小心智模型：

```text
makeIterator()
→ next()
→ Element?
→ nil 表示结束
```

Sequence 不自动保证：

- 能从头再次遍历；
- 多个 iterator 相互独立；
- 有稳定索引；
- 已知元素个数；
- 遍历不会消费外部资源。

某些 sequence 是一次性的，例如包装流、文件读取器或状态机。Generic algorithm 若
需要多次遍历，应要求 `Collection`，而不是先遍历一个任意 `Sequence` 再假设可重来。

## 2. Collection：稳定的多遍索引视图

`Collection` 在 Sequence 之上增加：

- `startIndex`、`endIndex`；
- 通过 index 访问元素；
- 从一个 index 前进到下一个；
- 多遍遍历的一致性；
- 在未发生允许的 mutation 时，index 与元素关系遵守协议合同。

Index 不要求是整数，也不要求底层连续。算法应写：

```swift
let next = collection.index(after: index)
```

而不是假设：

```swift
// index + 1
```

## 3. Collection 能力阶梯

```text
Sequence
└─ Collection
   ├─ BidirectionalCollection
   │  └─ RandomAccessCollection
   ├─ MutableCollection
   └─ RangeReplaceableCollection
```

这些协议增加的是**语义和复杂度保证**：

- Bidirectional：可以高效向前一个 index 移动；
- RandomAccess：任意 index 距离和偏移具有更强复杂度保证；
- MutableCollection：可替换现有位置的 element，长度通常不因此变化；
- RangeReplaceableCollection：可插入、删除和替换范围，长度可变化。

一个类型可以同时符合多个能力协议。不要用具体类型名字推断算法要求；让泛型约束只
请求真正需要的最小能力。

## 4. Generic Algorithm 与 Witness

```swift
func firstMatch<C: Collection>(
    in values: C,
    where predicate: (C.Element) throws -> Bool
) rethrows -> C.Element? {
    for value in values {
        if try predicate(value) {
            return value
        }
    }
    return nil
}
```

算法依赖：

- `C: Collection` 的 conformance；
- `C.Element` 的 associated type；
- iterator / index / subscript requirements；
- throwing predicate 的函数值。

未特化实现可通过 metadata 与 witness 操作未知 `C`；调用点 concrete type 可见时，
specialization 和 inline 可能把迭代降成具体指针或索引操作。

因此标准库协议同时提供：

```text
抽象正确性
+
优化器可利用的静态关系
```

## 5. Array：有序、整数索引、值语义

Array 提供：

- 保持元素顺序；
- 从零开始的整数 index；
- random access；
- 末尾追加的摊销复杂度合同；
- 值语义。

Array 常用 COW 缓冲区：

```swift
var first = [1, 2, 3]
var second = first
second.append(4)
```

`first` 仍观察为 `[1, 2, 3]`。底层可先共享，在 `second` 修改前确保唯一。不要从
值语义推断“赋值一定立刻复制整个缓冲区”，也不要从 COW 推断“复制永远免费”。

### 5.1 Capacity 与摊销

反复 append 可能偶尔扩容和搬迁。已知规模时 `reserveCapacity(_:)` 可以减少扩容，
但不改变逻辑 count，也不保证某个固定增长因子。

### 5.2 Index 失效

结构性修改可能使旧 index 不再合法。不要跨 insert/remove/replace 保存并重用 index，
除非具体 API 明确保证。

## 6. ArraySlice 与长寿命切片

Slice 保留原 collection 的 index 空间，`startIndex` 不一定为零：

```swift
let values = [10, 20, 30, 40]
let tail = values.dropFirst(2)
print(tail.startIndex) // 不应假设为 0
```

常见实现可能让 slice 共享原存储，因此一个很小但长寿命的切片可能让较大缓冲区继续
存活。跨层长期保存时，可根据真实内存需求显式构造新 Array；不要把这一常见优化写成
所有版本固定布局。

## 7. Dictionary：Key 到 Value 的映射

Dictionary 的核心合同：

- Key 必须 `Hashable`；
- 每个相等 key 对应一个 value；
- 平均查找行为依赖良好 hash 分布；
- 遍历顺序不应作为稳定序列化或业务排序合同。

更新语义要区分：

```swift
dictionary[key] = value
dictionary[key, default: initial] += 1
dictionary.updateValue(value, forKey: key)
```

Subscript 返回 optional 是因为 key 可能缺席；若 Value 本身也是 optional，还要区分
“没有 key”与“key 映射到 nil”的 API 语义。

## 8. Set：只保留唯一元素

Set 使用 `Hashable` 判断元素身份。适合：

- membership；
- 去重；
- 交、并、差；
- 不关心顺序的集合关系。

若业务需要稳定顺序，Set 本身不是排序容器。可在展示边界排序，或选择同时维护顺序
和 membership 的结构。

## 9. Hashable 与 Equatable 合同

必须满足：

```text
a == b
→
a.hash(into:) 与 b.hash(into:) 向同一个 Hasher 组合相同等价信息
```

反方向不成立：hash 相同不代表相等，容器仍需处理碰撞。

参与 hash/equality 的字段在作为 Dictionary key 或 Set element 期间不应以破坏身份
的方式变化。尤其不要用可变 class 对象中会变化的字段定义 hash，然后在插入后修改。

Swift 的 Hasher 可能使用随机种子；不要把 `hashValue` 持久化、跨进程比较或当业务 ID。

## 10. Lazy：延迟组合，不是自动缓存

```swift
let result = values.lazy
    .map(transform)
    .filter(predicate)
    .prefix(10)
```

Lazy view 可以把操作融合到实际迭代，避免不必要的中间 collection。但：

- 每次重新遍历可能重新执行 transform；
- closure 仍可能有副作用和捕获；
- 最终 `Array(result)` 会 materialize；
- 并不自动并行；
- 对小数据，额外抽象未必带来可测收益。

如果需要 memoization，应显式设计 cache 和失效策略，不能把 lazy 当缓存。

## 11. Eager、Lazy 与 Async Sequence

| 模型 | 产出时机 | 典型资源 |
| --- | --- | --- |
| Eager collection | 先构造全部元素 | 内存中的 Array |
| Lazy sequence/view | 消费时同步计算下一项 | CPU 变换、现有集合视图 |
| AsyncSequence | 下一项可能需要等待 | 网络事件、通知、异步流 |

AsyncSequence 的 iterator `next()` 是 async requirement，因此同时涉及：

- protocol witness；
- suspension；
- cancellation；
- buffering/backpressure；
- element 的 Sendable / isolation 边界。

## 12. String 不是 `[Character]`

Swift `String` 的 `Character` 表示扩展字形簇，用户看到的一个字符可能由多个 Unicode
scalar 和多个 UTF-8 code unit 组成。

因此：

- `String.Index` 不是简单整数；
- `count` 可能需要按字形边界遍历；
- 从一个 index 前进的成本受编码和表示影响；
- 不同 Unicode scalar 序列可能规范等价；
- “第 N 个字符”不是天然 O(1) 的随机访问。

```swift
let text = "Cafe\u{301}" // e + combining acute accent
let first = text.startIndex
let next = text.index(after: first)
```

处理协议或文件格式时常应明确使用 `utf8` / `unicodeScalars` view；处理用户可见文本时
使用 Character / locale-aware 平台 API。不要在错误抽象层上反复转换。

## 13. Substring 与所有权

`Substring` 是 String 的 slice 视图，适合解析过程中的短期窗口。长期存储或放进模型
时通常显式转换：

```swift
let field: String = String(substring)
```

这清楚表达模型拥有独立 String 值，也避免依赖 slice 与原存储的共享实现。是否发生
立即复制仍由具体实现和优化决定。

## 14. Codable 不是 Collection 协议

`Encodable` / `Decodable` 通过 protocol conformance 描述编码能力，不等同于具体 JSON
格式，也不自动提供 schema evolution。

需要单独设计：

- key 命名；
- 缺失与 null；
- 版本迁移；
- 日期、浮点与二进制表示；
- 未知字段；
- 不可信输入的大小和深度限制；
- 错误上下文。

合成 Codable implementation 是 witness 来源之一，不表示 wire format 永远稳定。

## 15. Mutation、Exclusivity 与迭代

遍历 collection 时修改同一 collection 可能违反访问或使 index 失效：

```swift
// for value in values {
//     values.append(value)
// }
```

常用安全方式：

- 遍历快照，写入另一个 collection；
- 先收集要修改的 indices，再按安全顺序处理；
- 使用 `removeAll(where:)` 等表达整体操作的 API；
- 确认具体 collection 对 iterator invalidation 的合同。

多任务同时修改一个 Array 还涉及数据竞争，COW 不自动让共享变量线程安全。

## 16. Collection 与并发

值类型 collection 在跨 isolation 边界时是否 Sendable，取决于 Element 和具体类型的
conformance。即使一个 Array 值安全发送：

- 两个任务共享的同一个可变变量仍需隔离；
- Element 若包含非线程安全引用，不能只看外层是 Array；
- 并行 map 需要限流、顺序、错误和取消策略；
- 大数组复制或跨 actor 传递要测量，不凭语法推断成本。

## 17. 类型擦除

`AnySequence<Element>` 等 wrapper 隐藏 concrete sequence type，方便异构 API 边界，
但会丢失某些静态能力和优化信息。

使用前问：

```text
调用者是否需要 concrete Collection 能力？
→ 是否只需要一次遍历？
→ generic return / some Protocol 能否保留更多类型信息？
→ existential / type erasure 是否真正简化边界？
```

## 18. 复杂度是 API 合同，不是一次跑分

常见符号：

- O(1)：输入规模增长时操作次数上界保持常数；
- O(log n)：规模倍增只增加固定步骤；
- O(n)：随元素数线性增长；
- amortized O(1)：少数昂贵扩容摊到多次操作。

同一复杂度下，常数、内存布局、ARC、cache locality、Unicode 数据和 closure 成本都
会影响性能。先选正确算法与协议约束，再用目标数据测量。

## 19. 常见误区

### “Sequence 可以随便遍历多次”

错误。只有更强合同或具体类型保证多遍。

### “Collection.Index 就是 Int”

错误。Index 是 associated type；String 是最明显反例。

### “Array 赋值一定复制全部元素”

错误。语言保证值语义，COW 和优化可以延迟或消除物理复制。

### “Lazy 会缓存结果”

错误。Lazy 通常延迟和融合，每次遍历仍可重新计算。

### “Dictionary 迭代顺序可持久化”

错误。需要稳定顺序就显式排序或使用有相应合同的结构。

### “Hash 相同就是相等”

错误。相等必须同 hash，碰撞仍然允许。

### “String.count 是固定 O(1)”

不能无条件依赖。用户可见 Character 边界可能需要遍历。

## 20. 总结

```text
Sequence 定义产出元素
→ Collection 增加稳定索引与多遍合同
→ 更强协议增加方向、随机访问和 mutation 能力
→ 泛型算法通过 conformance 工作
→ specialization 可能消除 witness 间接
→ Array / Dictionary / Set / String 用值语义隐藏存储优化
→ Unicode、复杂度、所有权和并发决定真实边界
```
