---
title: "Session 1.0 | 并行计算与并行编程"
description: "Session 1.0 | 并行计算与并行编程 · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 1.0 | 并行计算与并行编程</h1>
  <div class="session-banner-meta wiki-page-banner-meta"><span class="session-banner-meta-item"><b>主讲：</b>@陈嘉骏</span><span class="session-banner-meta-item"><b>回放：</b><a href="https://www.bilibili.com/video/BV1u83w6DEfG" target="_blank" rel="noreferrer">Session 1.0-活动简介 &amp; From HPC To AI Infra</a></span></div>
</header>

为什么超算和 AI Infra 息息相关？为什么随着算力增强，人工智能才能越来越强？

为什么大模型在 GPU 上才能运行和训练？

这都归功于大模型的计算和传统的科学计算、气候模拟等问题一样，能够**高度并行**

- 为什么能并行？
- 什么地方并行？
- 如何做并行计算？
- 为什么大模型 Infra 要写 Kernel？为什么普通 CPU 编程不叫写 Kernel？

这次课将给你建立一些直觉上的感受。

## 课前阅读和参考资料

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial)
- [Parallel Computing](https://en.wikipedia.org/wiki/Parallel_computing) on Wikipedia

## 活动简介

活动通过4个 topics，在这个暑假叫你大模型如何训练更快，推理更省、运行更好。在活动中我们希望大家可以学习和实践 AI Infra！本 次活动中，我们：

- 提供算力：国内国外算力价格高，社团和超算队联系赞助提供为大家实践 AI Infra 提供保障。
- 内容设计：4个 topics，包含理论知识、实践内容和来自业界的观点交流。
- 实践练习：我们设计了和大家学习内容关联的实践练习，让大家可以上手把自己学到的知识用起来。
- 评测排行：使用 HPC Game 平台，检验大家作业的完成成果。
- 交流讨论：我们给大家提供了交流学习的平台，欢迎大家分享自己的学习过程。
- 业界交流：获得国内头部企业支持。

## 计算

### 是什么

计算是一种将**输入**值按照**特定规则**转换为**输出**的过程。包括加减乘除、乘方、开根、指数、对数、比较以及矩阵乘法等。

其中**输入和输出**需要涉及到数据和数据的搬运，**特定规则**&ZeroWidthSpace;则涉及计算单元。

### 如何计算

用计算机进行计算，用程序秒速计算。计算机程序是由处理器执行的一串指令流，时钟周期是处理器执行指令的基本单位。在冯诺伊曼架构下，执行一个指令需要进行取指、译码、执⾏、访存、写回这一系列流水线，也就是说在这一意义上5个时钟周期才能执行一套完整的流程。IPC 性能（Instructions Per Cycle）是指一个时钟周期可以执行的指令数量，对于下图，IPC 性能只有1/5。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/9d4b2e50044a3ab90aa8c06e.png" caption="处理器的 IPC 性能是1/5" width="876" height="157" transparent />

下图展示了一个典型的串行计算流程。计算机同时只能执行一条指令。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/750234eba2659e0b1b7fddc9.png" caption="串行计算" width="604" height="250" />

通过让处理器在同时时间执行指令的不同阶段，可以在一个时钟周期内完成取指、译码、执⾏、访存、写回五个环节，也就是其 IPC 性能达到1。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/0dc9b6380a3a47caf0cc482e.png" caption="IPC 性能达到1" width="972" height="282" />

### 并行计算

在有不止一个处理器的时候，我们可以同时执行多条指令，也就是把不同的指令分配到不同的计算单元。如果我们有n个处理器，我们可以同时执行n条指令，我们处理任务的效率也就提升了n倍。这时候处理器的 IPC 性能就超过了1，我们说这样的处理器有超标量性能。

<FeishuGrid>

<FeishuGridColumn width="0.51745">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/8dbca1339495a6e3d7084bbf.png" caption="并行计算" width="660" height="359" />

</FeishuGridColumn>

<FeishuGridColumn width="0.48255">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/c7f510ecc4578cd7553760aa.png" caption="IPC &gt; 1" width="1920" height="1121" transparent />

</FeishuGridColumn>

</FeishuGrid>

并行计算出现在各个尺度：处理器内部、多个处理器之间、不同设备之间乃至一整个集群里都存在并行计算。

<FeishuGrid>

<FeishuGridColumn width="0.460881">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/fc770da5bee278a8bf96967d.png" caption="一个多核处理器芯片，有多个核心，每个都可以作为“处理器”" width="450" height="453" />

</FeishuGridColumn>

<FeishuGridColumn width="0.539119">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/d722fa1d40e8a60cf328288f.png" caption="机房中一个机柜有多个节点，一个节点有多个处理器" width="934" height="802" />

</FeishuGridColumn>

</FeishuGrid>

影响并行计算的指标有延迟（Latency）和吞吐（Throughput）。延迟是一个计算单元的运算速度，也就是完成一次计算需要的时间，通常由计算单元设计、时钟频率、流水线深度以及内存层次等共同决定。延迟越低，每个计算单元的性能越强，每次计算算的更快。吞吐（Throughput）表示单位时间内完成的计算量。当任务具有足够并行性且计算资源能够被充分利用时，增加计算单元数量通常可以提高吞吐。

并行化（parallelization）是把一个原本串行的问题改造成可以并行执行的形式，是一种方法或过程。并行度（degree of parallelism, DOP）是某一时刻实际同时执行的任务数量，是一种指标。

在并行计算中，除了计算资源本身，数据访问效率同样重要。较高的数据局部性和缓存复用率能够减少内存访问开销，提高计算单元利用率，从而获得更高性能。

## 从串行计算到并行计算

### 什么样的计算可并行？

并不是所有计算都适合并行执行。一个计算过程能否并行，主要取决于：

#### 数据依赖关系（Data Dependency）

判断不同计算之间是否存在输入/输出依赖关系。如果一个计算需要另一个计算的结果，则必须按顺序执行；如果多个计算只依赖已有输入，则可以同时执行。第一段代码具有数据依赖，而第二段不具有，因而第二段代码的 c、d、e 的值可以并行计算得到，而第一段不可以。

<FeishuGrid>

<FeishuGridColumn width="0.5">

```Plain Text
function Dep(a, b)
c := a * b
d := 3 * c
e := c + d
end function
```


</FeishuGridColumn>

<FeishuGridColumn width="0.5">

```Plain Text
function NoDep(a, b)
c := a * b
d := 3 * b
e := a + b
end function
```


</FeishuGridColumn>

</FeishuGrid>

#### 竞争、互斥与锁（Race, Mutual Exclusion & Lock）

多个任务访问共享资源时，可能产生竞争。例如多个线程同时修改同一个变量或者多个任务同时写入同一块内存。这时需要通过锁（Lock）、原子操作（Atomic Operation）和同步机制（Synchronization）保证计算结果正确。

#### 通信与同步（Communication & Synchronization）

并行任务之间通常需要交换数据或等待其他任务完成。如果通信量过大或者同步等待时间过长都会降低并行效率。高性能并行程序需要尽量减少通信，提高计算与通信比例。

### 那些计算需要并行？

- 科学计算：气候模拟、物理模拟、生物模拟……
- 矩阵计算、逐元素计算：**深度学习和人工智能**

<FeishuGrid>

<FeishuGridColumn width="0.430779">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/a136621e199b6d598f854ae2.png" caption="科学计算" width="660" height="302" />

</FeishuGridColumn>

<FeishuGridColumn width="0.569221">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/e766b9fe1f84ba20f64ff3f4.png" caption="矩阵计算" width="403" height="139" transparent />

</FeishuGridColumn>

</FeishuGrid>

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/7e78dc77116e1ce3d1b8dc98.png" caption="深度学习和人工智能" width="2616" height="614" />

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/1361ec5448a45539746ff1d0.png" caption="NVIDIA GPU的矩阵并行计算" width="2871" height="1209" />

### 如何将任务切分到不同计算单元？

为了充分发挥并行计算的优势，我们需要充分并行化、打满并行度。为了充分利用多个计算单元，需要将原始任务进行合理划分。根据划分对象的不同，常见的并行方式包括：数据并行（Data Parallelism）、模型并行（Model Parallelism）、流水线并行（Pipeline Parallelism）和张量并行（Tensor Parallelism）。

在实际的大规模 AI 模型训练中，通常会结合多种并行方式形成混合并行（3D Parallelism）。

#### 数据并行

将输入数据划分成多个子集，每个计算单元使用相同的模型处理不同的数据。

**域切分**：下图展示了对于一块任务数据，有着多种不同的划分方式。不同的切分方式对于任务的计算可能产生影响，需要根据任务类型、硬件特点等多种影响因素共同设计最佳方案。

**功能切分**：按照功能将任务进行拆分，把相同类型的计算放到一起。

<FeishuGrid>

<FeishuGridColumn width="0.63537">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/cbaa7f602426d490b1123d1e.png" caption="域切分（Domain Decomposition）" width="1192" height="408" />

</FeishuGridColumn>

<FeishuGridColumn width="0.36463">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/c80158862882e88fa6033030.png" caption="功能切分（Functional Decomposition）" width="587" height="353" />

</FeishuGridColumn>

</FeishuGrid>

Transformer 中，我们将输入的数据切分后输入不同的 GPU，在不同的 GPU 上进行一部分计算，从而实现数据并行化。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/073bdf2c2281ae02eb679a8b.png" caption="Transformer 模型中的数据并行" width="2482" height="1234" />

#### 模型并行

将一个模型拆分成多个部分，分别放到不同计算单元执行，不同 GPU 保存不同的模型参数。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/6b4e102be3e544b13ba8919b.png" caption="模型并行" width="2382" height="1272" />

#### 流水线并行

将模型按阶段划分，让不同计算单元负责不同阶段，并让多个输入同时流动。通过类似生产线的方式，避免 GPU 空闲。可以类比 CPU 中的指令级并行。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/4e80a26a98810dd2ff9385fa.png" caption="流水并行" width="2474" height="1268" />

#### 张量并行

将单个计算操作内部的数据进行切分，让多个计算单元共同完成一次计算。张量并行的通讯频繁，要求 GPU 之间有高速互联。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/8fd01bf8f5efdd8972ce648f.png" caption="张量并行" width="2470" height="1228" />

#### 三维并行

对于一个超大规模的模型训练，应对于数据、模型和张量计算任务都进行切分，实现组合多种并行方式。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/9c6d6df25367d2d1508028a1.png" caption="三维并行" width="2608" height="1234" />

## 并行计算机

### 如何实现并行计算？——指令与数据的组织方式（by Flynn）

并行计算的核心问题是多个计算单元如何组织指令执行，以及如何处理数据。根据 指令流（Instruction Stream） 和 数据流（Data Stream） 的数量，Flynn 将计算机体系结构分为四类：

- SISD（Single Instruction Single Data） 
- SIMD（Single Instruction Multiple Data） 
- MISD（Multiple Instruction Single Data） 
- MIMD（Multiple Instruction Multiple Data）

#### SIMD：单指令单数据

传统串行计算模型。特点是一个处理单元 、一条指令流、一组数据流。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/dff3d67ed7dbfc91d7d16965.png" caption="SISD：单指令单数据" width="946" height="412" />

#### SIMD：单指令多数据

同一条指令同时作用于多个数据。例如数组计算中可以把多条相同操作变成一条指令：

<FeishuGrid>

<FeishuGridColumn width="0.5">

```Plain Text
c[0]=a[0]+b[0]
c[1]=a[1]+b[1]
c[2]=a[2]+b[2]
c[3]=a[3]+b[3]
```


</FeishuGridColumn>

<FeishuGridColumn width="0.5">

```Plain Text
load a
load b
c = a + b
store c
```


</FeishuGridColumn>

</FeishuGrid>

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/8f7f7dda43e403dcc736333e.png" width="1026" height="560" />

#### MISD：多指令单数据

多个计算单元对同一个数据执行不同操作。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/eaa70cb069a72eec9b7bb50d.png" caption="MISD" width="1194" height="436" />

应用非常少，只有某些专用硬件使用。

#### MIMD：多指令多数据

多个计算单元可以执行不同指令，同时处理不同数据，是现代并行计算最常见的模型。包括：

-  多核 CPU 
-  多节点 HPC 
-  GPU（通常抽象为 MIMD + SIMT）

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/99158267689e4755ff541a13.png" caption="MIMD" width="1200" height="474" />

### 如何实现并行计算？——并行编程模型（by Programmers）

我们用计算机进行计算，**用程序描述计算**。要充分利用计算资源，需要通过编程模型合理描述并行任务。并行编程模型关注的问题是程序员如何将任务、数据以及计算过程映射到多个计算单元上。

常见的并行编程模型包括：

-  Shared Memory（共享内存） 
-  Threads（线程模型） 
-  Distributed Memory / Message Passing（分布式内存 / 消息传递） 
-  Data Parallel / Partitioned Global Address Space（数据并行 / 全局地址空间划分） 
-  Hybrid（混合模型） 
-  SPMD（Single Program Multiple Data） 
-  MPMD（Multiple Program Multiple Data）

<FeishuGrid>

<FeishuGridColumn width="0.417824">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/d464a314a3f90cf4b5059248.png" caption="消息传递模型" width="352" height="245" />

</FeishuGridColumn>

<FeishuGridColumn width="0.582176">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/000c53359c8b479286596cd5.png" caption="MPI 模型" width="352" height="175" />

</FeishuGridColumn>

</FeishuGrid>

### 如何实现并行计算？——“SIMT”模型 & CUDA（by NVIDIA）

为了更好的发挥硬件性能，充分配合硬件设计，我们既要考虑用程序描述好计算，也要考虑计算机进行计算的方式。GPU 编程是一种特殊的并行模型。CUDA 使用**SIMT（Single Instruction Multiple Threads）**思想：程序员编写线程级程序，由 GPU 自动组织大量线程执行。

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/b9940567d8cda6324e2f9a38.png" caption="CUDA 计算模型" width="1058" height="502" />

### 如何实现并行计算？—— Tile 模型 & Block 编程（by DSLs）

随着 AI 加速需求增加，出现了更高层的编程抽象，例如 Triton 和 TileLang。与 CUDA thread-level 编程不同，CUDA 关注线程，而 Tile 关注数据块（Tile）和计算块（Block）。

<FeishuGrid>

<FeishuGridColumn width="0.601892">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/0772c750962331b8b43efd8b.png" caption="SIMT vs Tile" width="1376" height="768" />

</FeishuGridColumn>

<FeishuGridColumn width="0.398108">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/6b242fbace3f3912f113078f.png" caption="CUDA vs Triton" width="1840" height="1562" />

</FeishuGridColumn>

</FeishuGrid>

### 不同层次的并行抽象

| 层次 | 关注问题 | 代表 |
|-|-|-|
| 硬件层 | 如何执行指令和数据 | SIMD / SIMT / MIMD |
| 编程模型层 | 如何描述并行任务 | MPI / OpenMP / CUDA |
| 高级抽象层 | 如何表达计算结构 | Tile / Triton / DSL |

第一性原理：我们要用合适的抽象描述计算，使程序能够充分利用硬件并行能力，同时降低开发和优化成本。需要各位在学习过程中形成自己的认识和视角，这样才能灵活的把各种技术加以运用。

## 结语

好了，去研究有趣的并行计算吧！

### AI 中的并行计算

<FeishuGrid>

<FeishuGridColumn width="0.695431">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/82a17faa08b079e163ac437b.png" caption="算子" width="2622" height="1006" transparent />

</FeishuGridColumn>

<FeishuGridColumn width="0.304569">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/367f82d7ef890a6ee8fef1bc.png" caption="集群通信" width="996" height="884" transparent />

</FeishuGridColumn>

</FeishuGrid>

<FeishuGrid>

<FeishuGridColumn width="0.353404">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/23995a477b75c0dcb78c8c44.png" caption="分布式训练" width="1706" height="1206" />

</FeishuGridColumn>

<FeishuGridColumn width="0.323273">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/9dba658b4a1a8a0231240df1.png" caption="强化学习" width="1072" height="830" />

</FeishuGridColumn>

<FeishuGridColumn width="0.323323">

<FeishuImage src="/feishu/wiki/F9oKw4GUgi30lQkgWScckzjfnfd/54403bf4a6d1041fa706732f.png" caption="推理框架" width="1036" height="802" />

</FeishuGridColumn>

</FeishuGrid>

好了，去研究有趣的 AI Infra 吧！
