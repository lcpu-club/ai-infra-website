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

CUDA 中 CPU 和 GPU 拥有独立内存，因此需要显式管理数据传输。下面的代码中给出了 CUDA 的内存管理 API：

```C++
int main()
{
    int n = 1000000;
    size_t bytes = n * sizeof(float);
    float *h_a = (float*)maloc(bytes);
    for (int i = 0; i < n; i++) h_a[i] = 1.0f;
    float *d_a;
    cudaMalloc(&d_a, bytes);
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(h_a, d_a, bytes, cudaMemcpyDeviceToHost);
    cudaFree(d_a);
    free(h_a);
}
```

### Kernel 启动参数

Kernel 的调用形式是：

```C++
kernel<<<gridDim, blockDim>>>();
```

其中 grid 的维数就是 block 的数量，block 的维数就是 block 带 thread 数量。可以是 `int` 或者 `dim3` 类型，可以支持1-3维的分块。例如矩阵计算通常使用二维：

```C++
dim3 block(16, 16); // 16x16 共计256个 block
```

### Kernel 中的内置变量

Kernel 中可以直接访问线程和 block 信息：

| 变量 | 含义 |
|-|-|
| `threadIdx` | 当前 thread 在 block 内的位置 |
| `blockIdx` | 当前 block 在 grid 内的位置 |
| `blockDim` | 一个 block 的 thread 数量 |
| `gridDim` | grid 中 block 数量 |

```Java
__global__ void MatAdd(float A[N][N], float B[N][N], float C[N][N])
{
    int i = threadIdx.x;
    int j = threadIdx.y;
    C[i][j] = A[i][j] + B[i][j];
}
int main()
{
    dim3 threadPerBlock(N, N);
    MatAdd<<<1, threadsPerBlock>>>(A, B, C);
}
```

### 使用多个 Block

实际问题中数据规模通常大于一个 block，一个 block 线程数量有限，因此需要多个 block。线程全局编号：$index = blockIdx × blockDim+threadIdx$

```C++
__global__ void MatAdd(float A[N][N], float B[N][N], float C[N][N])
{
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    int j = blockIdx.y * blockDim.y + threadIdx.y;
    if (i < N && j < N)
        C[i][j] = A[i][j] + B[i][j];
}

int main()
{
    dim3 threadsPerBlock(16, 16);
    dim3 numBlocks((N - 1) / threadsPerBlock.x + 1, (N - 1) / threadsPerBlock.y + 1);
    MatAdd<<<numBlocks, threadsPerBlock>>>(A, B, C);
}
```

需要注意的是矩阵大小不一定刚好等于 block 大小，多出来的 thread 需要退出。

## Warp, SIMT 和 SIMD

### 什么是 Warp

一个 warp 是 32 个 thread。这32个 tread 必须执行相同的指令。如果出现了分支，分支路径就会串行化，走当前路径的线程被激活，未走当前路径的线程被 mask 掉。图中的代码就会串行的执行两个分支：

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/389b26f16497cb84df57d9a7.png" caption="warp 中的分支会串行化" width="2650" height="1238" transparent />

同⼀个 block ⾥的 thread 被分到哪个 warp 由如下的 thread ID 决定：`ID = threadIdx.x + threadIdx.y * blockDim.x + threadIdx.z * blockDim.x * blockDim.y`，其中 `ID/32` （向下取整）相同的线程放到一个 wrap 中。

### SIMT 与 SIMD

SIMD: Single Instruction Multiple **Data**

SIMT: Single Instruction Multiple **Thread**

数据是被动的，线程是主动的。从 CC 7.0 起，每个 thread 有自己的 program counter，也就可以执执行不同的指令。而 SIMD 只有一个 program counter。但是，一个 warp 里每次激活的 thread 应该有相同的 program counter。如果条件分支太多，将导致 program counter 的不同取值太多，那么 SIMT 也是低效的。最有利于 SIMT 发挥效率的编程方式仍然是 SIMD。

当然也有资料会说 GPU 本身也是 SIMD 模型，因为 program counter 不本质，可以用软件模拟。

### Warp Divergence 案例

下图代码中 betterKernel 尽量使得所有线程走相同的分支，即数据分布于 warp 边界对齐。`badKernel` 中，偶数下标走 `sqrt`，奇数下标走 `exp`，因此会出现之前所说的一个 warp 中有多个分支，导致执行效率下降。betterKernel 中，重现对 data 中的数据进行编号，使得执行一个分支的 thread 是连续的，数据实现了 warp 边界对齐。

```C++
__global__ void badKernel(float* data, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        if (i % 2) data[i] = sqrt(data[i]);
        else data[i] = exp(data[i]);
    }
}

__global__ void betterKernel(float* data, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    int half = (N + 1) / 2;
    if (i < half) {
        int target = 2 * i;
        data[target] = exp(data[target]);
    } else if (i < N) {
        int target = 2 * (i - half) + 1;
        data[target] = sqrt(data[target]);
    }
}
```

在 CPU 中，上述奇偶交替的操作会被分支预测命中，从而实现更高效的指令执行；而 GPU 中没有分支预测能力，所以需要手动对齐。

### Warp-Level Primitives

Warp 是一个比较底层的概念，很多基础的 GPU 编程不需要在意。但是把 warp 用好才能更好地使用 GPU 的全面性能。Warp 内可以高效地进行数据交换和同步，这段代码实现了 reduce 操作，操作后 `lane 0` 的 `val` 是操作前的32个 lane 的 `val` 只和，其他的 lane 的 `val` 未定义。

`__shfl_down_sync` 函数第一个参数是指一个 warp 中的32个类，哪些需要进入接下来的操作中。下图展示的 `0xffffffff` 表示32个类全部需要执行。第二个参数 val 是需要共享的变量，第三个参数是类下标（thread ID / 32的余数） 的偏移。可以借助下图理解第三个参数的作用。

```C++
#define FULL_MASK 0xffffffff

for (int offset = 16; offset > 0; offset /= 2)
    val += __shfl_down_sync(FULL_MASK, val, offset);
```

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/9ff1f01fffa641fa42b6db5d.png" caption="warp level primitives" width="1138" height="501" transparent />

需要注意的是，例如在上图第一次操作以后，lane 4会试图从 lane 8获取一个值，这样操作完成之后，lane 4的值是未定义的。因此循环结束后，只有 lane 0的值有定义（其数值是之前32个lane的数值之和）。

如果在 block 层面实现 reduce，需要使用 shared memory。在 warp 层面进行这些操作更加高效。

## Thread Block

### Block 协作

Block 内的 thread 比较类似 CPU 的 thread，可以用 shared memory，也有原子操作、内存屏障，线程同步等指令。

```C++
__global__ void syncthreads_valid_behavior(int* input_data, int* output_data) {
    __shared__ int shared_data[128];

    shared_data[threadIdx.x] = input_data[threadIdx.x];
    if (blockIdx.x > 0) { // CORRECT, uniform condition across all block threads
        __syncthreads();
        output_data[threadIdx.x] = shared_data[127 - threadIdx.x];
    }
}

__global__ void syncthreads_invalid_behavior(int* input_data, int* output_data) {
    __shared__ int shared_data[128];

    shared_data[threadIdx.x] = input_data[threadIdx.x];
    for (int i = 0; i < blockDim.x; ++i) {
        if (i == threadIdx.x) { // WRONG, non-uniform condition
            __syncthreads();    // Undefined Behavior
        }
    }
    output_data[threadIdx.x] = shared_data[127 - threadIdx.x];
}
```

`__syncthread` 只能在这个 block 里所有线程都会运行到的分支中进行，否则是未定义的行为。下面那个错误的函数中每个 thread `__syncthread` 的时机不一致，是未定义行为。

### Thread Block Cluster

从 CC 9.0 开始，CUDA 引入了⼀个可选的中间层次：Thread Block Cluster。Cluster 中的 block 保证在同⼀个 GPC（Graphics Processing Cluster）上调度，可以实现跨 block 通信。

## 内存层次结构

### 内存层次结构一览

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/110889978b5afc64f95b0cab.png" caption="整体视图" width="2425" height="1842" transparent />

| 内存类型 | Scope | 生命周期 | 位置 |
|-|-|-|-|
| Global | Grid | Application | Device |
| Constant | Grid | Application | Device |
| Shared | Block | Kernel | SM |
| Local | Thread | Kernel | Device |
| Register | Thread | Kernel | SM |

### Shared Memory

Shared Memory 与 L1 Cache 是同一块物理存储器的不同划分，可配置比例。以下代码为使用 shared memory 分块矩阵乘法。

`__restrict__` 修饰符表示通过这个指针访问的内存和别的变量没有关系，指针之间不会重叠。**restrict**

```C++
constexpr int TILE_SIZE = 32;
__global__ void gemm_gpu_tiling_kernel(
    int* __restrict__ C,        // [n, m], on gpu
    const int* __restrict__ A,  // [n, k], on gpu
    const int* __restrict__ B,  // [k, m], on gpu
    int n, int m, int k         // multiples of TILE_SIZE
) {
    __shared__ int a_tile[TILE_SIZE][TILE_SIZE];
    __shared__ int b_tile[TILE_SIZE][TILE_SIZE];
    int my_c_result = 0;
    for (int tile_index = 0; tile_index < k / TILE_SIZE; ++tile_index) {
        a_tile[threadIdx.y][threadIdx.x] = A[(blockIdx.x*TILE_SIZE + threadIdx.y)*k + (tile_index*TILE_SIZE + threadIdx.x)];
        b_tile[threadIdx.y][threadIdx.x] = B[(tile_index*TILE_SIZE + threadIdx.y)*m + (blockIdx.y*TILE_SIZE + threadIdx.x)];
        __syncthreads();
        for (int i = 0; i < TILE_SIZE; ++i) {
            my_c_result += a_tile[threadIdx.y][i] * b_tile[i][threadIdx.x];
        }

        __syncthreads();
    }

    C[(blockIdx.x*TILE_SIZE + threadIdx.y)*m + (blockIdx.y*TILE_SIZE + threadIdx.x)] = my_c_result;
}
```

### 全局内存访问的 coalescing

全局内存的访问效率取决于访问模式。GPU 会将 warp 中的32个线程的访存请求合并为尽量少的 transcactions。一次transaction 是32字节，起始地址是32字节的倍数。这有点像 CPU 的缓存⾏机制，不过 GPU ⾃⼰的缓存⾏还要复杂⼀点：L1 缓存⾏ 128 字节，L2 缓存⾏ 32 字节。 

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/cd0776c90c3fd88031bd562e.png" caption="全局内存访问" width="2028" height="390" />

## GPU 的硬件实现

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/248c216c23c743514ed5b7db.png" caption="GPU的整体结构" width="2680" height="2718" transparent />

### SM 的内部结构——以 Blackwell Ultra 为例

- SFU：Special Function Units（**近似**&ZeroWidthSpace;倒数、平方根倒数、sin……）
- Tex：Texture（GPU 的本职工作，纹理相关信息，和我们的主题关系不大）
- 共128个 CUDA Cores 用于32位及更低精度计算

<FeishuGrid>

<FeishuGridColumn width="0.540364">

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/bda7c6cf393584d1498a3fa8.png" width="526" height="622" />

</FeishuGridColumn>

<FeishuGridColumn width="0.459636">

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/1dd8b0233ce411cf39f947d1.png" width="1435" height="1999" />

</FeishuGridColumn>

</FeishuGrid>

### Warp 调度

**问题**：CUDA Core 的运算速度极快，但 Global Memory 的延迟是几百个周期。如果 warp 发了一个访存请求后就干等着，计算单元就空闲了。

**解决方案**：Warp 调度器维护着比计算单元多得多的 warp。

- 当一个 warp 因为访存被阻塞时，调度器立即切换到另一个可执行的 warp
- 硬件维护了所有 warp 的寄存器状态，上下文切换开销很低
- 这使得计算单元和内存带宽都能尽量保持满负载
- 用吞吐量掩盖延迟

<FeishuImage src="/feishu/wiki/WHFXw13vEiD8Hikfp3ScU33JnXe/8179564db89971e053124477.png" caption="warp 调度" width="780" height="244" />

## Occupancy：GPU 资源利用率

CUDA 程序执行效率不仅取决于线程数量，还取决于 GPU 中资源的利用情况。GPU 的执行单位是 SM。一个 SM 可以同时驻留多个 Block、Warp 和 Thread，但是 SM 内部资源有限，因此，一个 Kernel 能同时运行多少线程受到资源限制。

Occupancy 是**活动的 warp 数量**与 **SM 最大支持的 warp 数量**&ZeroWidthSpace;的比值（0-1之间）。Occupancy 表征了 GPU 程序的实际使用率。高 Occupancy 可以隐藏 Memory Latency、提高计算资源利用率，并减少等待时间。

### SM 的资源限制

一个 SM 能容纳的 block 数量受到多个因素限制：

- 最大线程数量 `maxThreadsPerMultiProcessor`
- 最大 Block 数量 `maxBlocksPerMultiProcessor`
- Shared Memory 限制 `sharedMemPerMultiprocessor`
- Register 限制 `regsPerMultiprocessor`

我们可以使用下面的方法科学调块长：

```C++
int minGridSize, blockSize;
cudaOccupancyMaxPotentialBlockSize(&minGridSize, &blockSize, myKernel, 0, 0);

int numBlocks;
cudaOccupancyMaxActiveBlocksPerMultiprocessor(&numBlocks, myKernel, blockSize, 0);
```

### 优化方向

CUDA Kernel 的性能优化目标是充分利用 GPU 的并行计算能力，同时减少计算和访存中的瓶颈。主要优化方向包括：

- 最大化并行执行：GPU 的计算能力来自大量 thread 并行执行。我们需要提供足够数量的 thread/block，充分利用 SM 计算资源以提高 Occupancy。
- 优化内存访问：GPU 中计算速度远高于全局内存访问速度。合并访问（Memory Coalescing）和使用 Shared Memory 都可以优化访问速度。
- 减少 Warp Divergence：保持 warp 内控制流一致。
- 利用专用硬件：Tensor Core

## CUDA API 选讲

### 错误检查

```C++
cudaError_t err = cudaMalloc(&d_A, N * sizeof(float));
if (err != cudaSuccess) {
    fprintf(stderr, "CUDA error: %s\n", cudaGetErrorString(err));
    exit(EXIT_FAILURE);
}
```

```C++
#define CUDA_CHECK(expr_to_check) do {                        \
    cudaError_t result = expr_to_check;                       \
    if(result != cudaSuccess)                                 \
    {                                                         \
        fprintf(stderr,                                       \
                "CUDA Runtime Error: %s:%i:%d = %s\n",        \
                __FILE__,                                     \
                __LINE__,                                     \
                result,                                       \
                cudaGetErrorString(result));                  \
    }                                                         \
} while(0)
```

### 事件计时

```C++
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

cudaEventRecord(start);
myKernel<<<grid, block>>>(d_A, d_B, d_C);
cudaEventRecord(stop);

cudaEventSynchronize(stop);
float milliseconds = 0;
cudaEventElapsedTime(&milliseconds, start, stop);
printf("kernel time: %f ms\n", milliseconds);

cudaEventDestroy(start);
cudaEventDestroy(stop);
```

### Stream

CUDA Stream 是一种命令队列。不同 Stream 的 kernel 可以并发执行，只要 SM 有资源。

```C++
cudaStream_t stream1, stream2;
cudaStreamCreate(&stream1);
cudaStreamCreate(&stream2);

kernel1<<<grid, block, 0, stream1>>>(...);
kernel2<<<grid, block, 0, stream2>>>(...); // 可能与 kernel1 并发
// 第三个启动参数是动态 shared memory 大小

cudaStreamSynchronize(stream1);
cudaStreamSynchronize(stream2);

cudaStreamDestroy(stream1);
cudaStreamDestroy(stream2);
```

### 统一内存

通过 `cudaMallocManaged` 分配统一内存，CPU 和 GPU 自动共享数据，无需手动 `cudaMemcpy`。也可以用 `__managed__` 修饰变量，但存在一些限制。

```C++
float *x;
cudaMallocManaged(&x, N * sizeof(float));
cudaFree(x);
```

### 多卡编程

```C++
cudaSetDevice(0);                         // Set device 0 as current
float* p0;
size_t size = 1024 * sizeof(float);
cudaMalloc(&p0, size);                    // Allocate memory on device 0

cudaSetDevice(1);                         // Set device 1 as current
float* p1;
cudaMalloc(&p1, size);                    // Allocate memory on device 1

cudaSetDevice(0);                         // Set device 0 as current
MyKernel<<<1000, 128>>>(p0);              // Launch kernel on device 0

cudaSetDevice(1);                         // Set device 1 as current
cudaMemcpyPeer(p1, 1, p0, 0, size);       // Copy p0 to p1
MyKernel<<<1000, 128>>>(p1);              // Launch kernel on device 1
```

```C++
cudaSetDevice(0);                         // Set device 0 as current
float* p0;
size_t size = 1024 * sizeof(float);
cudaMalloc(&p0, size);                    // Allocate memory on device 0
MyKernel<<<1000, 128>>>(p0);              // Launch kernel on device 0

cudaSetDevice(1);                         // Set device 1 as current
cudaDeviceEnablePeerAccess(0, 0);         // Enable peer-to-peer access
                                         // with device 0

// Launch kernel on device 1
// This kernel launch can access memory on device 0 at address p0
MyKernel<<<1000, 128>>>(p0);
```
