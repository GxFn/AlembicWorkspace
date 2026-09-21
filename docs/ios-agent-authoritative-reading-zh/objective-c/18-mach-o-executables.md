# 从源码到 Mach-O：编译、链接与装载如何接起来

- **Original title**: Mach-O Executables
- **原文链接**: [原文](https://www.objc.io/issue-6/mach-o-executables.html)
- **作者 / 机构**: Daniel Eggert / objc.io
- **年份**: 2013
- **材料类型**: 构建工具 / Mach-O 深度文章
- **文档性质**: 忠实中文精读，不是原文全文翻译

## 文章要解决的问题

在 Xcode 点下 Build 后，`.m`、`.h` 为什么会变成 CPU 能执行的文件；多个目标文件、Foundation 与 Objective-C Runtime 又怎样汇成一个程序？原文不用手工伪造二进制，而是以命令行上的 Hello World 为线索，逐段观察编译器、汇编器、链接器、Mach-O 容器和 `dyld` 的分工。

## 原文论证主线

文章先用 `xcrun` 固定所选 Xcode 与 SDK，再拆开 Clang 一次性完成的流水线：预处理负责宏、头文件展开和行号来源；解析与语义分析形成 AST；LLVM 生成并优化目标相关代码；汇编器把汇编变成 `.o`；链接器合并目标文件和库、处理符号引用，最终生成 Mach-O。通过 `-E`、`-S` 等阶段输出，读者能把一行 C 调用对应到汇编指令、ABI 规定和函数展开信息，而不是把“编译”看成单步黑箱。

接着用 `size`、`otool` 和 `file` 检查结果。Mach Header 描述架构、文件类型和 Load Command 总量；Load Commands 指定各 Segment 在文件与虚拟内存中的位置、大小和权限。`__TEXT` 通常只读可执行，容纳机器码、字符串、stub 与展开信息；`__DATA` 可读写，保存运行期会变化的数据和懒/非懒符号指针；`__PAGEZERO` 则让低地址不可访问。Section 是 Segment 内更细的语义分区，虚拟内存按映射和权限使用它们，并非简单把整个文件一次复制进内存。

最后，文章把 `Foo.m` 与 `helloworld.m` 分别编译成目标文件，再用 `nm` 对照符号表。`helloworld.o` 对 `Foo` 类、`objc_msgSend` 和 autorelease pool 函数只有未定义引用；`Foo.o` 提供类符号，却继续依赖 Foundation。静态链接器能在目标文件之间解析一部分符号，并把仍需动态库提供的名称和依赖路径写进最终映像；程序启动时由 `dyld` 完成运行期解析。系统把大量库预先组合到 dyld shared cache，避免每个进程重复做全部依赖装载与符号绑定。

## 关键机制与结论

可执行文件是多个阶段和多个消费者之间的协议：编译器产出代码与元数据，汇编器形成可重定位目标文件，链接器建立符号和依赖关系，Mach-O 记录布局与权限，虚拟内存和 `dyld` 才把它变成可运行进程。Objective-C 类、方法名和 `objc_msgSend` 也以 section 与 symbol 的形式进入这条链，因此 Runtime 不是脱离构建系统、在启动后凭空出现的另一层。

文章还建立了实用的排查顺序：用阶段化 Clang 输出定位生成问题，用 `nm` 判断符号是定义、外部引用还是未解析，用 `otool -L` 查看动态库依赖，用 Load Commands 与 Section 内容核对文件布局。工具输出是证据，不能只凭 Xcode 的一条笼统错误猜测故障所在。

## 准确性 / 版本边界

原文基于 2013 年 OS X、x86-64、当时的 Clang、Mach-O 与 dyld，示例路径、命令输出、Section 名称、Objective-C 符号和 shared cache 组织都属于历史快照。现代 Apple Silicon、arm64e、代码签名、chained fixups、现代 dyld 与 Xcode 工具链已有显著演进；尤其不能照抄旧地址、依赖路径或断言某个符号必在某一动态库。稳定的是阶段职责、Segment/Section、符号解析和静态/动态链接之间的关系，当前细节应以本机工具输出和现行格式定义为准。

## 在知识体系中的位置

本篇位于源码语言与运行时机制的下方：它把 Objective-C 类、selector、IMP、Framework 依赖落到目标文件和装载链上。适合在 Runtime 主干之后阅读，用于建立包体、启动、链接错误、崩溃符号化和二进制分析的共同底图。
