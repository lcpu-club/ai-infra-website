---
title: "Session 1.1｜CUDA  Programming Model"
description: "Session 1.1｜CUDA  Programming Model · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 1.1｜CUDA  Programming Model</h1>
</header>

为什么 GPU 上的一个线程不比 CPU 更快，却能完成更大规模的并行计算？

CUDA 为何要把线程组织成 Thread、Block 和 Grid？Warp 又是什么？

当我们从 CUDA 转向 Triton、TileLang，编程视角为什么会从“一个线程”变成“一块数据”？

- **MLSys on GPU**: SIMD 与 SIMT、Throughput 与 Latency，以及 GPU 为何适合大规模并行计算
- **CUDA Programming Model**: Host 与 Device、Kernel Launch、Thread / Block / Grid、Warp，以及线程之间的执行与协作
- **Triton / TileLang**: Program、Block 与 Tile  Level 编程

本次课将简单介绍上述内容，帮助大家建立后续学习所需的基本视角，为后续深入学习打下基础。

## 课前阅读 & 参考资料

- [CUDA-From-Correctness-To-Performance-Code/lecture.md](https://github.com/interestingLSY/CUDA-From-Correctness-To-Performance-Code/blob/master/lecture.md)
- [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/)
- [CUDA C Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)
- [TileLang Documentation](https://tilelang.com/)
- [Triton Documentation](https://triton-lang.org/main/index.html)

## 为什么要用 GPU？

- CPU 大量控制，少量计算；GPU 少量控制，大量计算。（写代码的体验是相反的：CPU 编程更多的侧重计算，GPU 编程更多的侧重控制）

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/740c8a71fa710d8b26ce501d.png" caption="CPU 和 GPU 对比" width="1612" height="796" transparent />

- 更大的吞吐量：GPU 标称的算力是吞吐量。从硬件厂商的角度说，提高吞吐量比降低延迟容易。GPU 不擅长降低延迟，但它非常擅长隐藏延迟。GPU 的设计思路是：“既然延迟降不下来，那我就同时处理足够多的任务，让计算单元在等待数据的时候总有别的活干。”

| 概念 | 含义 | GPU |
|-|-|-|
| 延迟 | 完成一个任务从开始到结束所需的时间 | 😭 |
| 吞吐量 | 单位时间内能完成的任务数量 | 😀️ |

- 更高的内存访问速度：GPU 的主存通常是 HBM（High Bandwidth Memory）。一条 HBM3E 的带宽可以达到 DDR5 的 20 倍。要达到 HBM 标称的访问速度，必须做地址连续的大块访问（coalesced access）。随机小粒度访问会浪费带宽。

### “N 方过百万”实现了吗

| 递推式 | GPU |
|-|-|
| $a_{n+1} = \frac{a_n}{1+\sqrt{a_n}}$ | 😭️ |
| $a_{n,m} = a_{n-1, m} + a_{n-1, m-1}$ | 🤔️ |
| $a_n = \sum_{i<n}\frac{1}{a_i+n}$ | 😀️ |

第一个递推式必须先计算前一项才能计算后一项，不能使用 GPU 实现高速的并行计算；第二个递推式虽然可以进行并行优化，但其瓶颈可能是潜在的 memory bound，需要消耗很多资源读取和写回内存；第三个递推式比较适合 GPU 进行并行计算，需要注意的是对于 GPU，除法运算开销较大，可能只有标称的1/8左右。

## CUDA 是什么？

### CUDA（Compute Unified Device Architecture）

CUDA 是 NVIDIA 提出的通用 GPU 计算平台和编程模型。

2006 年，NVIDIA 发布 CUDA，使程序员能够不依赖图形 API，直接利用 GPU 的高吞吐计算能力执行通用计算任务（GPGPU）。CUDA 旨在将计算任务划分为大量线程，并通过 GPU 硬件调度这些线程，实现高吞吐并行计算。

### CUDA 执行模型

CUDA 使用 SIMT（Single Instruction Multiple Threads）模型， 程序员编写线程级代码，GPU 将大量线程组织起来执行，多个线程执行相同 kernel，但处理不同数据。CUDA 的层次结构为 thread ⊂ warp ⊂ block ⊂ SM ⊂ grid。

#### Thread（线程）

Thread 是 CUDA 程序执行的基本单位。每个 thread 执行一份 kernel 代码，每个 thread 拥有自己的寄存器、Thread ID 和局部状态。

#### Warp（线程束）

Warp 是 GPU 调度和执行的基本单位。一个 warp 通常包含 **32 个 thread**， 一个 warp 内的 thread 执行相同指令。如果同一个 warp 中线程执行不同分值，可能产生分支发散（Branch Divergence），执行一个分支的线程会等待不执行这个分支的线程，造成执行效率降低。

#### Block（线程块）

Block（也称 CTA, Cooperative Thread Array）是线程协作的基本单位。一个 block 包含多个 warp，block 内线程可以共享 Shared Memory，使用同步机制。Block 是程序员组织线程协作的主要单位。

#### SM（Streaming Multiprocessor）

SM 是 GPU 中实际执行 block 的硬件单元，负责调度 warp、执行计算和管理共享资源。

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/4932e6102a884cc984ae0add.png" caption="SM 示意图" width="1966" height="924" />

#### Grid（线程网格）

Grid 是一次 kernel 启动产生的所有 block 的集合。block 数量可以远大于 GPU 中 SM 数量，不应假设 block 之间具有特定的相对顺序，block 之间应当相互独立。

<FeishuGrid>

<FeishuGridColumn width="0.672133">

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/b219b627960812f5f000d1bf.png" caption="https://developer-blogs.nvidia.com/wp-content/uploads/2020/06/kernel-execution-on-gpu-1.png" width="713" height="500" transparent />

</FeishuGridColumn>

<FeishuGridColumn width="0.327867">

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/97bf3214c1e4d9782a14a162.png" caption="Grid 和 SM" width="807" height="1173" />

</FeishuGridColumn>

</FeishuGrid>

### CUDA 的自动可扩展性（Scalability）

CUDA 的一个重要设计：程序员只需要描述 grid/block 结构，不需要关心具体 GPU 有多少 SM。每个 block 都是可以独立执行的程序，block 之间没有数据依赖。Block 可以按照任意顺序调度到任意多个 SM 上，程序（员）不用关心总共有几个 SM。

例如对于一个有8个 block 的程序，在有2个 SM 的 GPU 上，将被分成每个 SM 4个 block；在4个 SM 的 GPU 上，则会被分成每个 SM 2个 block。这一过程不需要修改代码，也不需要重新编译。

### CUDA 编译流程

CUDA 扩展了 C/C++ 的语法，代码要保存为 `.cu` 格式，使用 `nvcc` 编译器进行编译。`.cu` 文件中，在 CPU 上运行的称为 Host Code，在 GPU 上运行的成为 Device Code。

PTX（Parallel Thread Execution）是 GPU 的中间表示（IR），也就是所谓高级汇编，具有良好的向后兼容性。CUBIN（CUDA Binary） 是 GPU 的可执行文件，里面包含特定架构机器码，可以直接运行在 GPU 上。

CUDA的编译流程如下图：

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/fe741702f607b249a85b87cd.png" caption="CUDA 编译流程" width="3395" height="3065" transparent />

### CUDA 工作流程概览

CUDA 程序通常采用 CPU + GPU 协同执行模式，CPU 负责控制流程和准备数据（Host），GPU 负责执行大规模并行计算（Device）一次 CUDA 计算任务通常包含以下步骤：

- 在 CPU 上准备数据（Host）：程序首先在 CPU 内存（Host Memory）中分配输入数据、初始化数据、设置计算参数。
- 将数据从 CPU 内存拷贝到 GPU 内存：GPU 拥有独立显存（Device Memory），需要将数据从 CPU 内存通过 PCIe / NVLink 等接口复制。
- 配置 Kernel 启动参数：CUDA Kernel 由大量线程执行，启动时需要指定 grid 和 block 大小（`<<<grid, block>>>`）。
- GPU 并行执行 Kernel：GPU 根据定义的 grid、block、warp 和 thread 组织线程执行。
- 将结果从 GPU 传回 CPU：Kernel 完成后，将结果从 GPU 显存复制回 CPU，CPU 得到运行结果。

## Kernel：运行在 GPU 上的函数

CUDA 编程的核心是 **Kernel**。Kernel 是运行在 GPU 上的函数，由 CPU（Host）调用，并由大量 GPU thread 并行执行。

### 新的关键字

在 CUDA 编程中，CPU 是 host，GPU 是 device。我们通过下面的三个关键字来修饰限定函数执行的位置：

- `__host__`：这类函数和正常函数没有区别，只能被 host 上执行的函数调用。
- `__global__`：这类函数可以被任何函数调用，并在 device 上执行。
- `__device__`：这类函数只能被 device 上执行的函数调用，并在 device 上执行。

更多请参考 [Execution Space Specifier](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html)。

### 定义 Kernel

CUDA Kernel 使用 `__global__` 修饰，返回类型必须为 `void`，由 CPU 调用，在 GPU 上由多个 thread 并行执行。下面的代码是 N 个 CUDA thread 并行计算向量加法：

```C++
__global__ void VecAdd(float* A, float* B, float* C)
{
    int i = threadIdx.x;
    C[i] = A[i] + B[i];
}
```

调用时使用：

```C++
VecAdd<<<1, N>>>(A, B, C);
```

### CUDA 内存管理 API
