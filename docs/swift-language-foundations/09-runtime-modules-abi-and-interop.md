# Runtime、模块、ABI 与互操作：四条派发线路的运行边界

本篇解释 Swift 源语言之外、但理解真实程序必须知道的边界：

```text
源文件
→ Module 与类型检查
→ SIL 与所有权语义
→ 优化和 specialization
→ LLVM IR / 机器码
→ 符号与 ABI
→ Swift / Objective-C / 系统 Runtime
→ 目标平台执行
```

重点不是记内部布局，而是知道哪些事实可跨版本依赖。

## 1. 三层事实

| 层 | 例子 | 稳定性 |
| --- | --- | --- |
| 语言语义 | override 选择动态类型实现；protocol requirement 由 conformance 满足 | 源码可以依赖 |
| ABI / Runtime 模型 | metadata、vtable、witness table、thunk、calling convention | 受平台、工具链和稳定 ABI 约束 |
| 优化产物 | 某次调用被 inline，某个 box 被消除 | 仅当前构建成立 |

“当前 Apple 平台 ABI 使用 witness table”不等于 Swift 语言要求所有未来 backend 都
保持相同字段偏移；“优化后没有表查询”也不改变源代码的 witness 语义。

## 2. Module 是编译与可见性边界

一个 module 是独立构建和导入的声明集合。它影响：

- 名称空间；
- access control；
- 哪些实现体对优化器可见；
- public API；
- generic specialization 与 inline 的机会；
- library evolution 和 binary distribution。

```swift
import Networking
```

Import 暴露 module 的公开接口，不等于把所有源码实现复制进调用者。

## 3. Access Control 与继承边界

Swift 常见级别：

- `private`：限定声明及相关词法范围；
- `fileprivate`：当前文件；
- `internal`：默认，当前 module；
- `package`：同一 package 的模块边界；
- `public`：跨 module 使用；
- `open`：class / class member 允许跨 module subclass / override。

`public` 与 `open` 的差异直接影响 class 派发可观察替换点。与此同时，编译器是否最终
去虚化，还要看调用点、whole-module information 和 library evolution。

## 4. API、ABI 与 Module Stability

### 4.1 API

源代码层可见的类型、函数、语义和行为合同。API 变化可能要求客户端重新改源码。

### 4.2 ABI

已经编译的调用者和库之间的二进制合同，包括：

- calling convention；
- symbol；
- type metadata 访问；
- layout / offset 的可发现方式；
- vtable / witness / thunk 协议；
- 错误与 async 调用约定。

### 4.3 Module Stability

让不同编译器版本可以读取已发布 module 的稳定接口表示。它与 ABI stability 相关，
但一个解决编译器理解接口，一个解决已编译二进制如何交互。

### 4.4 Library Evolution

库在不破坏已编译客户端的前提下演进的能力。它要求客户端少假设内部布局，将一部分
信息通过 metadata accessor、field offset、dispatch thunk 等机制延迟到运行时。

## 5. Resilience Boundary

跨可演进库边界时，客户端不能假设：

- non-frozen struct 永远只有当前字段；
- resilient class 的 method slot 固定在当前 offset；
- protocol requirement 永远保持当前内部表顺序；
- 属性当前是 stored 就永远可直接读字段。

因此常见实现会增加间接层：

```text
client
→ stable symbol / accessor / dispatch thunk
→ library 内部知道当前布局
→ 实际 field / method / witness
```

这不是编译器“多此一举”，而是用间接换二进制演进空间。

## 6. `@frozen` 与布局合同

公开 enum / struct 标注 `@frozen`，会让其布局对客户端具有更强可知性，并限制未来
增加 stored property 或 enum case 的演进方式。

`@frozen` 是库设计和 ABI 承诺，不是普通性能注解。使用前要确定类型结构真的能长期
冻结。

## 7. `@inlinable` 与实现可见性

`@inlinable` 把函数实现的一种可序列化表示暴露给 client compiler，使跨 module
inline 和 specialization 成为可能。

代价：

- 实现体成为兼容合同的一部分；
- 只能引用足够公开或特别暴露的声明；
- 修改实现要考虑旧客户端已经内联的行为；
- 代码体积可能增加；
- 不保证优化器一定 inline。

Swift 6.3 还增加了更细的库优化控制能力；无论使用哪种属性，都应把“允许客户端看见”
与“保证更快”分开。

## 8. Type Metadata

当具体类型在编译点不完全已知时，Runtime 需要 metadata 描述类型相关操作或结构。
概念上可能包含或指向：

- 类型种类和身份；
- size、alignment、stride；
- generic arguments；
- field / enum case 信息；
- class superclass 与动态派发信息；
- protocol conformance 查询所需 descriptor；
- copy、move、destroy 等 value operation。

具体字段布局因 ABI 与类型种类而异。源码层应依赖反射 / Runtime 的公开接口，而不是
硬编码 metadata 内存偏移。

## 9. 三种容易混淆的 Table

| 结构 | 服务对象 | 核心问题 |
| --- | --- | --- |
| Class vtable | class 的 override family | 这个动态 class 应执行哪个 override？ |
| Protocol witness table | `Type: Protocol` conformance | 这个类型用哪个实现满足 requirement？ |
| Value witness table | 未知布局值的基本操作 | 这个值怎样 copy、move、destroy、分配 buffer？ |

Protocol witness 与 value witness 都叫 witness，但不是同一张表。Existential / generic
代码可能同时需要 type metadata、value witness operation 和一个或多个 protocol
witness。

## 10. 四条派发在线路中的位置

### 10.1 直接

```text
已知声明
→ 已知 symbol / function entry
→ call 或 inline
```

跨 module 仍可能经过稳定 symbol、back-deployment thunk 或其他 ABI 间接；“直接语义”
不等于机器码零间接。

### 10.2 Class vtable

```text
receiver
→ 动态 class metadata
→ override family slot / dispatch thunk
→ implementation
```

Resilient class 可通过 thunk 避免客户端固定 slot。

### 10.3 Protocol witness

```text
concrete type / existential payload
+ conformance information
→ requirement entry / dispatch thunk
→ witness implementation
```

泛型特化或 existential devirtualization 可能把它化成已知目标。

### 10.4 Objective-C message

```text
receiver + selector
→ Objective-C Runtime cache / lookup
→ IMP
→ implementation
```

`dynamic` 要求通过 Objective-C Runtime 保留动态访问；`@objc` 只建立 Objective-C
表示和可见性，不足以断言所有 Swift 调用都发消息。

## 11. Dispatch Thunk 的角色

Thunk 是编译器生成的适配入口，可承担：

- 隔离调用者和内部 table layout；
- 把稳定 symbol 映射到当前 slot；
- 调整 `self`、参数或返回 calling convention；
- bridge Swift 与 Objective-C 表示；
- 把 witness 调用转接到 class override；
- 适配 async、throws 或 generic context。

“经过 thunk”不是第五种派发语义；它是实现边界上的转接。

## 12. SIL：观察 Swift 语义的中间层

常用命令：

```bash
swiftc -emit-silgen Example.swift
swiftc -emit-sil Example.swift
swiftc -O -emit-sil Example.swift
swiftc -emit-ir Example.swift
```

可观察的典型概念：

- `function_ref`：已知函数引用；
- `class_method`：class 动态成员查找；
- `witness_method`：protocol requirement；
- `partial_apply`：形成捕获上下文的函数值；
- `strong_retain` / `strong_release` 等所有权操作；
- async continuation / executor 相关 lowering。

不要对某个指令名字过度承诺。比较 `-Onone` 与 `-O`、同 module 与跨 module，才能看见
去虚化和 specialization；输出仍只属于该工具链。

## 13. Symbol 与 Name Mangling

Swift 需要把 module、类型、generic signature、函数标签等编码到链接 symbol。Mangling
支持重载和类型丰富的 ABI。

Demangle 工具可辅助诊断：

```bash
swift-demangle '$s...'
nm -gU Binary | swift-demangle
```

不要把编译器生成 symbol spelling 当公共 API，除非对应平台 ABI 明确稳定。对 C /
Objective-C 出口使用它们的命名和导出合同。

## 14. Dynamic Cast 与 Runtime Type

```swift
if let service = value as? Service {
    service.run()
}
```

Dynamic cast 先询问运行时值能否按目标类型使用。成功后，新的静态视角影响后续名称
查找；若成员可 override，派发再依据动态对象选择实现。

```text
cast：值是否具有目标类型关系
dispatch：已选声明执行哪个实现
```

对 existential cast，还可能查询协议 conformance；对 class cast，利用继承 metadata；
对 bridgeable Foundation type，可能进入桥接规则。

## 15. Metatype

`T.Type` 是类型自身的值：

```swift
func make<T: DefaultConstructible>(_ type: T.Type) -> T {
    type.init()
}
```

Class dynamic metatype 可以保留 subclass 身份，`class` type method 或 required
initializer 的选择可能具有动态语义。`type(of:)` 取得运行时类型值，不等于普通
generic parameter 的静态类型拼写。

## 16. Reflection 的边界

`Mirror` 提供调试和有限结构观察，不是完整稳定的业务序列化或任意调用 Runtime：

- 字段标签和显示风格不是数据库 schema；
- private layout 会演进；
- Mirror 不提供类型安全的任意 method invocation；
- 性能和可用信息不适合替代 Codable / 明确协议。

Macro 是编译期语法变换，也不是 Runtime reflection。

## 17. Objective-C 互操作分层

### 17.1 可表示性

并非所有 Swift 类型都能直接表达为 Objective-C：

- Objective-C 对象和兼容 class member 最自然；
- Swift struct/enum/generic/tuple/纯 Swift function feature 可能需要桥接或不支持；
- async / throws 可能由 importer/exporter 按受支持 convention 转换；
- optional、nullability、selector 名称要按生成接口复核。

### 17.2 `@objc`

为声明建立 Objective-C 可见表示 / selector。它是互操作属性，不自动把全部 Swift
调用固定为 message dispatch。

### 17.3 `dynamic`

要求对成员的访问使用 Objective-C Runtime 动态派发，并要求它可由 Objective-C 表示。
这为 KVO、swizzling 等 Runtime 观察保留替换点，同时限制 Swift inline /
devirtualization。

### 17.4 `NSObject`

继承 NSObject 提供 Objective-C 对象身份和 Runtime 基础能力，但不能据此断言类中
每个纯 Swift member 都必然以 Objective-C selector 发送。

## 18. Foundation Bridging

常见桥接：

- String ↔ NSString；
- Array ↔ NSArray；
- Dictionary ↔ NSDictionary；
- Set ↔ NSSet；
- Swift Error ↔ NSError；
- Swift value 与 `id` / AnyObject 边界。

桥接可能：

- 保留共享存储；
- 复制 / 转换元素；
- 创建 wrapper；
- 触发 ARC / autorelease 约定；
- 在强制类型转换时失败。

具体是否零拷贝受类型、元素和平台实现影响，不能从 `as` 拼写断言。

## 19. C 互操作

C 没有 Swift generic、ARC object model 或 protocol witness。边界通常需要：

- C-compatible scalar、pointer、struct / enum 表示；
- 明确 ownership 和 allocation / deallocation 配对；
- nullability；
- function pointer / callback context；
- error code；
- module map / header。

Swift 6.3 引入更直接的 `@c` 导出能力，但具体类型可表示范围和部署工具链仍需查对应
版本资料。跨 C 边界的设计应使用清晰的 C ABI，而不是暴露 Swift 内部 mangled symbol。

## 20. C++ 互操作

C++ interop 能力持续演进，涉及：

- value / reference 类型映射；
- template import；
- move / copy 与生命周期；
- exception 边界；
- virtual method；
- Swift API 向 C++ 暴露的限制。

不要把 Objective-C bridging 经验直接套用到 C++。以目标 Swift / Clang 版本的
[C++ Interop Guide](https://www.swift.org/documentation/cxx-interop/) 和
[Status](https://www.swift.org/documentation/cxx-interop/status/) 为准。

## 21. Async ABI 与 Runtime

Async function 的调用不仅传普通参数，还需要保存 continuation 与任务上下文。实现
可能生成：

- async entry；
- resume function；
- task frame；
- executor hop；
- error / result continuation。

具体布局属于 ABI / Runtime；语言合同是局部值、错误、取消和 isolation 在挂起恢复
后保持正确。

这解释了为什么不能把 Swift async function 直接当“返回之前调用 completion 的普通
C 函数”。跨语言需要 importer/exporter 或显式桥接。

## 22. Back Deployment 与 Availability

```swift
if #available(iOS 18, *) {
    useNewAPI()
} else {
    useFallback()
}
```

Availability 是源语言和 SDK 合同。某些 Swift / SDK 特性可 back deploy，编译器可能
插入兼容实现和运行时选择层。最终是否直接调用系统 symbol，取决于最低部署版本和
特性支持。

因此：

```text
源码看起来直接调用
≠
二进制一定只有一个固定入口
```

## 23. 性能诊断顺序

不要先按“direct < witness < vtable < objc”给性能排序。正确流程：

```text
真实场景与数据
→ Instruments / benchmark 找热点
→ 算法和分配
→ ARC / COW / cache locality
→ specialization / inline / devirtualization
→ 最后确认派发间接是否可测
```

检查构建参数：

```text
-Onone / -O / -Osize
whole-module optimization
module boundary
library evolution
@inlinable / implementation visibility
generic concrete type 是否可见
Objective-C dynamic boundary
```

## 24. 常见误区

### “ABI stable 表示所有内部布局公开不变”

错误。稳定 ABI 经常通过 accessor 和 thunk 隐藏可演进布局。

### “直接派发一定没有 thunk”

错误。back deployment、resilience 和互操作都可能增加转接入口。

### “Protocol witness table 就负责复制值”

错误。Protocol witness 满足 requirements；value witness 处理未知布局值的基本操作。

### “NSObject 子类所有调用都走 objc_msgSend”

错误。要看成员是否 Objective-C 可见和调用是否保留消息派发语义。

### “@inlinable 保证 inline”

错误。它允许客户端看到实现；是否 inline 仍由优化器决定。

### “Mirror 是 Swift 版 Objective-C Runtime”

错误。Mirror 是有限反射视图，不提供任意动态消息系统。

### “SIL 输出就是 ABI”

错误。SIL 是编译中间表示；ABI 是已编译组件间的二进制合同。

## 25. 总结

```text
Module 决定源码可见边界
→ Resilience 限制客户端可做的静态假设
→ Metadata / table / thunk 把未知信息留到运行时
→ 四种派发在线路上选择实现
→ SIL 优化可消除部分间接层
→ ABI 保证已编译组件仍能协作
→ 互操作把 Swift 合同转换为 C / Objective-C / C++ 合同
```

一级资料与版本基线见 [资料、研究方法与版本边界](references.md)。
