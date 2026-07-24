---
title: "1.1 & 1.2"
description: "1.1 & 1.2 · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

[AI Infra Wiki](/wiki/) / [Topic 1 - Kernel and Compilers](/wiki/E3ltwZcMEiBJy2kusiCcKlk5nzb) / [Session 1 7.23](/wiki/VIJPw24sqiPOhXkfEwXcEvVInhg)

# 1.1 & 1.2

[在飞书中查看原文 ↗](https://lcpu-club.feishu.cn/wiki/I6BFwTffUiAKGUk8TgncV6DIn1b)

## 为什么要用 GPU？

### GPU 一胜

CPU 被设计为尽量快地执行单一线程的指令序列，它有大量晶体管用于缓存和分支预测等控制逻辑，仅少数晶体管用于实际运算。

GPU 被设计为并行执行成千上万个线程。它把更多晶体管投入到运算单元，而大幅减少了缓存和控制逻辑。

GPU 单线程性能不如 CPU，但通过并行，总体吞吐量可以高出几个数量级。

!

### GPU 二胜

| 概念 | 含义 | GPU |
|-|-|-|
| **延迟** | 完成一个任务从开始到结束所需的时间 | 😭 |
| **吞吐量** | 单位时间内能完成的任务数量 | 😊 |

GPU 标称的算力是吞吐量。从硬件厂商的角度说，提高吞吐量比降低延迟容易。

GPU 不擅长降低延迟，但它非常擅长**隐藏延迟**。GPU 的设计思路是：“既然延迟降不下来，那我就同时处理足够多的任务，让计算单元在等待数据的时候总有别的活干。”

### GPU 三胜

GPU 的主存通常是 HBM（High Bandwidth Memory）。一条 HBM3E 的带宽可以达到 DDR5 的 20 倍。

要达到 HBM 标称的访问速度，必须做地址连续的大块访问（coalesced access）。随机小粒度访问会浪费带宽。

### “N 方过百万”实现了吗？

| 递推式 | GPU |
|-|-|
| $a_{n+1}=a_n/(1+\sqrt{a_n})$ | 😭 |
| $a_{n,m}=a_{n-1,m}+a_{n-1,m-1}$ | 🤔 |
| $a_{n}=\sum_{i<n}1/(a_i+n)$ | 😊 |

## CUDA 是什么？

> In 2006, NVIDIA introduced the *Compute Unified Device Architecture* (CUDA) to enable any computational workload to use the throughput capability of GPUs independent of graphics APIs.

### 核心概念

$$\rm thread\subset warp\subset block\subset SM\subset grid$$

- 1 个 warp 是 32 个 thread，这 32 个 thread 执行相同的指令
- block 又叫 CTA（Cooperative Thread Array），是线程间合作的范围
- SM（Streaming Multiprocessor）是执行 block/warp 的硬件
- grid 是 block 的集合

### 自动可扩展性

- 每个 block 都是可以独立执行的程序，block 之间没有数据依赖
- block 可以按任意顺序调度到任意多的 SM 上，程序不用关心总共有几个 SM
- 不需要重新编译，不需要改代码\~\~，方便 NVIDIA 开发 Compute Capability 相同的阉割卡\~\~

!

### 工作流程概览

1. 在 CPU 上准备数据
2. 将数据从 CPU 内存拷贝到 GPU 内存
3. 配置 kernel 启动参数（`<<<grid, block>>>`）
4. 在 GPU 上并行执行 kernel
5. 将结果从 GPU 内存拷回 CPU 内存

## Kernel：在 GPU 上运行的函数

### 新的关键字

CPU 是 host，GPU 是 device。

- `__host__`: 这类函数与正常的函数没有区别。其只能被 host 上执行的函数（`__host__`）调用，并在 host 上执行。
- `__global__`: 这类函数可以被任何函数调用，并在 device 上执行。
- `__device__`: 这类函数只能被 device 上执行的函数（`__device__` 或 `__global__`）调用，并在 device 上执行。

### 定义 Kernel

Kernel 应当用 `__global__` 修饰，返回类型必须是 `void`。以下代码产生 N 个 CUDA thread 并行计算向量加法。

```C++
__global__ void VecAdd(float* A, float* B, float* C)
{
    int i = threadIdx.x;
    C[i] = A[i] + B[i];
}
int main()
{
    VecAdd<<<1, N>>>(A, B, C);
}
```


### 内存管理 API

```C++
int main()
{
    int n = 1000000;
    size_t bytes = n * sizeof(float);
    float *h_a = (float*)malloc(bytes);
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

`<<<gridDim, blockDim>>>`

- grid 的维数就是 block 的数量
- block 的维数就是每个 block 的 thread 数量
- 可以是 `int` 或 `dim3` 类型，以支持 1\~3 维的分块

### Kernel 中的内置变量

| 变量 | 含义 |
|-|-|
| `threadIdx` | 当前 thread 在 block 内的下标 |
| `blockIdx` | 当前 block 在 grid 内的下标 |
| `blockDim` | block 的维数 |
| `gridDim` | grid 的维数 |

!

### 矩阵加法

```C++
__global__ void MatAdd(float A[N][N], float B[N][N], float C[N][N])
{
    int i = threadIdx.x;
    int j = threadIdx.y;
    C[i][j] = A[i][j] + B[i][j];
}
int main()
{
    dim3 threadsPerBlock(N, N);
    MatAdd<<<1, threadsPerBlock>>>(A, B, C);
}
```


### 使用多个 block

这里加入了边界处理。矩阵大小经常不是块长的整数倍，处理方式就是粗暴地加个 if。

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
    dim3 numBlocks(N / threadsPerBlock.x, N / threadsPerBlock.y);
    MatAdd<<<numBlocks, threadsPerBlock>>>(A, B, C);
}
```


## Warp, SIMT 与 SIMD

### 什么是 warp？

1 个 warp 是 32 个 thread。这 32 个 thread 必须执行相同的指令。如果出现了分支，分支的路径会串行化，走当前路径的线程被激活，未走当前路径的线程被 mask 掉。

同一个 block 里的 thread 被分到哪个 warp 由如下的 thread ID 决定：

`ID=threadIdx.x+threadIdx.y*blockDim.x+threadIdx.z*blockDim.x*blockDim.y`

`ID/32`（下取整）相同的线程就在同一个 warp。

### SIMT 与 SIMD

SIMD: Single Instruction Multiple **Data**

SIMT: Single Instruction Multiple **Thread**

数据是被动的，线程是主动的。从 CC 7.0 起，每个 thread 有自己的 program counter，也就可以执行不同的指令。而 SIMD 只有一个 program counter。

但是，一个 warp 里每次激活的 thread 应该有相同的 program counter。如果条件分支太多，将导致 program counter 的不同取值太多，那么 SIMT 也是低效的。最有利于 SIMT 发挥效率的编程方式仍然是 SIMD。

~~你也可以 argue 说 program counter 不本质，因为可以软件模拟，用 gather load 造出一个 SIMD 虚拟机。~~

### Warp Divergence 案例

优化方法：尽量使 warp 内的所有线程走相同的分支，即让数据分布与 warp 边界对齐。

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


### Warp-Level Primitives

来源：[Using CUDA Warp-Level Primitives](https://developer.nvidia.com/blog/using-cuda-warp-level-primitives/)

CUDA 9 introduced three categories of new or updated warp-level primitives.

1. Synchronized data exchange: exchange data between threads in warp.

   - `__all_sync`, `__any_sync`, `__uni_sync`, `__ballot_sync`
   - `__shfl_sync`, `__shfl_up_sync`, `__shfl_down_sync`, `__shfl_xor_sync`
   - `__match_any_sync`, `__match_all_sync`
2. Active mask query: returns a 32-bit mask indicating which threads in a warp are active with the current executing thread.

   - `__activemask`
3. Thread synchronization: synchronize threads in a warp and provide a memory fence.

   - `__syncwarp`

## Thread Block

### Block 内协作

Block 内的 thread 比较类似 CPU 的 thread，可以用 shared memory，也有原子操作、内存屏障、线程同步等指令。

- 线程同步：`__syncthreads()`

### Thread Block Cluster

从 CC 9.0 开始，CUDA 引入了一个可选的中间层次：Thread Block Cluster。Cluster 中的 block 被保证在同一个 Graphics Processing Cluster (GPC) 上协同调度，可以实现跨 block 通信。

## 内存层次结构

### 整体视图

!

### 各层内存一览

来源：[2.3. Writing SIMT Kernels — CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#writing-cuda-kernels-memory-types-scopes-lifetimes)

| Memory Type | Scope | Lifetime | Location |
|-|-|-|-|
| Global | Grid | Application | Device |
| Constant | Grid | Application | Device |
| Shared | Block | Kernel | SM |
| Local | Thread | Kernel | Device |
| Register | Thread | Kernel | SM |

### Shared Memory

Shared Memory 与 L1 Cache 是同一块物理存储器的不同划分，可配置比例。以下代码为使用 shared memory 的分块矩阵乘法。来源：[CUDA-From-Correctness-To-Performance-Code/gemm_gpu_tiling.cu](https://github.com/interestingLSY/CUDA-From-Correctness-To-Performance-Code/blob/master/gemm_gpu_tiling.cu)

- `__restrict__`
- `__share__`
- x y 转置

```C++
constexpr int TILE_SIZE = 32;
__global__ void gemm_gpu_tiling_kernel(
        int* __restrict__ C,                // [n, m], on gpu
        const int* __restrict__ A,        // [n, k], on gpu
        const int* __restrict__ B,        // [k, m], on gpu
        int n, int m, int k                        // multiples of TILE_SIZE
) {
        __shared__ int a_tile[TILE_SIZE][TILE_SIZE];
        __shared__ int b_tile[TILE_SIZE][TILE_SIZE];
        int my_c_result = 0;
        for (int tile_index = 0; tile_index < k/TILE_SIZE; ++tile_index) {
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

全局内存的访问效率取决于访问模式。GPU 会将 warp 中 32 个线程的访存请求合并为尽量少的 transactions。一次 transaction 是 32 字节，起始地址是 32 字节的倍数。这有点像 CPU 的缓存行机制，不过 GPU 自己的缓存行还要复杂一点：L1 缓存行 128 字节，L2 缓存行 32 字节。 

## GPU 的硬件实现

### GPU 的整体结构

!

### SM 的内部结构——以 Blackwell Ultra 为例

- SFU：Special Function Units（exp, sin, ...）
- Tex：Texture
- 共 128 个 CUDA Cores 用于 fp32/int32 及更低精度计算

!

### Warp 调度

**问题**：CUDA Core 的运算速度极快，但 Global Memory 的延迟是几百个周期。如果 warp 发了一个访存请求后就干等着，计算单元就空闲了。

**解决方案**：Warp 调度器维护着比计算单元多得多的 warp。

```Plain Text
时间轴 →
warp 0:  [计算] [ 等待内存数据 ]     [计算]
warp 1:        [计算] [ 等待内存数据 ]
warp 2:              [计算] [ 等待内存数据 ]
warp 3:                    [计算] [ 等待...]
```


- 当一个 warp 因为访存被阻塞时，调度器立即切换到另一个可执行的 warp
- 硬件维护了所有 warp 的寄存器状态，上下文切换开销很低
- 这使得计算单元和内存带宽都能尽量保持满负载
- 用吞吐量掩盖延迟

## Occupancy

### 一个 SM 的资源是有限的

| 资源 | 对 occupancy 的限制 |
|-|-|
| **寄存器** | 每个 thread 用的寄存器越多，能容纳的 thread 越少 |
| **Shared Memory** | 每个 block 用的 shared memory 越多，能容纳的 block 越少 |
| **Warp 数量上限** | 每个 SM 有最大 warp 数（如 64） |
| **Block 数量上限** | 每个 SM 有最大 block 数（如 32） |

**Occupancy** = 实际活动 warp 数 / 最大支持 warp 数

**Occupancy 不是越高越好**

- 对于访存密集型（memory-bound）的 kernel，高 occupancy 有助于隐藏延迟
- 对于计算密集型（compute-bound）的 kernel，高 occupancy 可能有害，因为 warp 之间争抢资源

### 科学调块长

```C++
int minGridSize, blockSize;
cudaOccupancyMaxPotentialBlockSize(&minGridSize, &blockSize, myKernel, 0, 0);
int numBlocks;
cudaOccupancyMaxActiveBlocksPerMultiprocessor(&numBlocks, myKernel, blockSize, 0);
```


### 优化方向

1. **最大化并行执行**：足够的 thread/block 来利用全部 SM
2. **优化内存访问**：合并访问（coalescing）、使用 shared memory
3. **最小化 warp divergence**：保持 warp 内控制流一致
4. **利用专用硬件**：Tensor Core

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
#define CUDA_CHECK(expr_to_check) do {            \
    cudaError_t result  = expr_to_check;          \
    if(result != cudaSuccess)                     \
    {                                             \
        fprintf(stderr,                           \
                "CUDA Runtime Error: %s:%i:%d = %s\n", \
                __FILE__,                         \
                __LINE__,                         \
                result,\
                cudaGetErrorString(result));      \
    }                                             \
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
printf("Kernel time: %f ms\n", milliseconds);

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
kernel2<<<grid, block, 0, stream2>>>(...);  // 可能与 kernel1 并发
// 第三个启动参数是动态 shared memory 大小
cudaStreamSynchronize(stream1);
cudaStreamSynchronize(stream2);

cudaStreamDestroy(stream1);
cudaStreamDestroy(stream2);
```


### 统一内存

通过 `cudaMallocManaged` 分配统一内存，CPU 和 GPU 自动共享数据，无需手动 `cudaMemcpy`。

```C++
float *x;
cudaMallocManaged(&x, N * sizeof(float));
cudaFree(x);
```


### 多卡编程

```C++
cudaSetDevice(0);                   // Set device 0 as current
float* p0;
size_t size = 1024 * sizeof(float);
cudaMalloc(&p0, size);              // Allocate memory on device 0

cudaSetDevice(1);                   // Set device 1 as current
float* p1;
cudaMalloc(&p1, size);              // Allocate memory on device 1

cudaSetDevice(0);                   // Set device 0 as current
MyKernel<<<1000, 128>>>(p0);        // Launch kernel on device 0

cudaSetDevice(1);                   // Set device 1 as current
cudaMemcpyPeer(p1, 1, p0, 0, size); // Copy p0 to p1
MyKernel<<<1000, 128>>>(p1);        // Launch kernel on device 1
```


```C++
cudaSetDevice(0);                   // Set device 0 as current
float* p0;
size_t size = 1024 * sizeof(float);
cudaMalloc(&p0, size);              // Allocate memory on device 0
MyKernel<<<1000, 128>>>(p0);        // Launch kernel on device 0

cudaSetDevice(1);                   // Set device 1 as current
cudaDeviceEnablePeerAccess(0, 0);   // Enable peer-to-peer access
                                    // with device 0

// Launch kernel on device 1
// This kernel launch can access memory on device 0 at address p0
MyKernel<<<1000, 128>>>(p0);
```


## 高级概念简介

### CUDA Graphs

将一系列 kernel 启动和内存操作构建为一个有向无环图，一次性提交给 GPU。减少 launch 开销，适合重复执行的固定工作流。

### Dynamic Parallelism

允许 GPU kernel 在设备端动态启动新的 kernel。不再需要 CPU 的介入。

### NVLink

GPU 之间的高速互联，提供比 PCIe 高数倍的带宽。

### MIG（Multi-Instance GPU）

将一张 GPU 切分为多个独立实例，每个实例有隔离的内存、缓存和计算单元。

### 与图形 API 互操作

CUDA 可以与 OpenGL、DirectX、Vulkan 共享数据，无需经过 CPU 拷贝。

## 参考资料

1. [CUDA-From-Correctness-To-Performance-Code/lecture.md](https://github.com/interestingLSY/CUDA-From-Correctness-To-Performance-Code/blob/master/lecture.md)
2. [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/)
3. [CUDA C++ Programming Guide (Legacy)](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
4. [CUDA Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)

## 草稿

我来给大家讲一些 GPU 的入门知识。首先为什么要用 GPU 呢？大家知道吧，这个 GPU 比 CPU 要快很多，那么这个快是哪个方面的快呢？一个比较显而易见的答案是 GPU 的计算单元比 CPU 多。当然代价是控制单元比 CPU 少。

前些年有一个说法叫“N 方过百万”。给没听过的同学们解释一下：他说一个程序跑得快啊，我一个运算量有一百万的平方这么多的程序，大概几秒钟就跑完了。那么请问我们现在有没有做到“N 方过百万”呢？ 严格来说并没有。你算算计算量，区区 1 TFLOPs，对现在的 GPU 都是小菜一碟。但如果你设计的是串行算法，它的要求实际上是 1 THz 的计算频率。现在地球上应该还没有这种计算设备。也就是说，对于那种严格的强制在线的算法来说，“N 方过百万”是做不到的。如果你设计的算法真的能并行，但是还是跑不到“N 方过百万”，那么多半是 memory bound，先按下不表。

高考压轴很喜欢出的那种没有通项的数列递推，这个就是强制在线的问题。你只能知道了前一项才能算后一项，没有办法跳。更一般的问题常常被叫做迭代。迭代问题基本上都是非常困难的问题。我们要迭代一百步，就必须得算一百遍，迭代步数这个维度一般是并行不了一点。这就引出了延迟和吞吐量的概念。延迟是串行的能力，吞吐是并行的能力。对于迭代问题来说，我们必须要优化延迟。优化吞吐量是没有用的。只有每一步的延迟低了，整个算法才会快。不过有一种非常草台班子的迭代是神经网络的训练。这个可能后面会另说。

不过往好处想，还是有很多问题是可以并行的。比如说，最基本的线性代数运算，像是向量加法、矩阵乘法。而在机器学习领域或者在商业推销的时候，我们讲的往往就是吞吐量。我们说一个 GPU，它的算力有成百上千 TFLOPs，那说的都是吞吐量，不要指望吞吐量的倒数是它的延迟。再比如 GPU 的显存有时候叫 HBM（High Bandwidth Memory），那带宽很明显就是跟吞吐量是近义词。你要是想达到 HBM 标称的那个访问速度，你就应该做地址连续的大块的访问。应该没有人卖“low-latency memory”或者“LLM”吧？

从硬件厂商的角度想，我想让吞吐量变大，只需要复制粘贴硬件就可以了。减少延迟要考虑的就多了，基本都要大改电路结构。你得把那些数据流动经过的节点给非常紧密地排在一小块电路上，搞不好三维空间还排不下。

下面介绍一下 NVIDIA GPU 的编程模型。这里面的概念基本都是 NVIDIA 原创，没有什么实际意义。每家显卡厂商都有自己的术语体系。我们先从 thread 开始说吧，这个大家可能比较熟悉，因为 CPU 也有 thread。首先你当然可以跟 CPU 的并行计算做一样的事情，比如说，你可以用原子操作、内存屏障、线程同步之类的指令，只是线程交流通常局限在 block 内。GPU 为了实现更大规模的并行肯定是有牺牲的。它的 thread 被包裹在了一个叫做 Warp 的概念下面。一个 Warp 指的是 32 个 thread。这 32 个 thread 必须执行相同的指令。当然有些情况下，你可以 mask 掉，就是这 32 个线程里面可能有的线程被激活，有的线程在空闲，可以这么理解。一份的指令控制单元搭配上 32 份的计算单元，这样子 FLOPS 的数据就好看了。目前为止我说的 warp 的功能，其实用 CPU 上的 SIMD 都可以实现。但是 NVIDIA 官方的说法是，这个 Warp 应该是 SIMT。为什么会有这个区分呢？

我觉得 thread 跟 data 的本质区别是，thread 有自己的 program counter，也就是指向它要执行的指令的那个地址。在 compute capacity 7.0 之后，SIMT 并不是真正意义上的 single instruction，每个 thread 指向的指令可以不一样。而 SIMD 肯定只有一个 program counter，对吧？当然在一个 warp 里激活的 thread，它的 program counter 应该是一样的。也就是说，虽然这些 thread 可以自由地执行它想执行的指令，但是如果 program counter 的不同取值太多，那么这个 SIMT 也是低效的。所以说，最有利于 SIMT 发挥效率的编程方式还是 SIMD。

刚才我提了一嘴 block，block 又叫 CTA (Cooperative Thread Array)。这个名字很好地说明了 block 和 thread 的关系。block 可以申请 shared memory，它下面的每个 thread 都能看到。执行 block 的硬件是 SM（Streaming Multiprocessor）。Shared Memory 和 L1 缓存也在 SM 上，它们是同一块存储器的划分。shared memory 完全是手动管理，这对提高性能很有用。

GPU 就是由很多个 SM 堆出来的东西。SM 不仅堆了很多的计算单元，还堆了更多的远超计算单元承载能力的 WARP，因为这些计算单元非常容易 Memory Bound，也就是发了一堆内存请求，但是数据来不了。这个时候 SM 就会把这些阻塞的 Warp 给换下来，然后换能跑的 Warp，接着跑，使得计算单元可以尽量一直满负载地运行，同时内存也满负载地运行。这是一种养蛊 pipeline，单个线程的延迟大概会因此上升。如果一切顺利，延迟的矛盾会转移到吞吐量上，但是计算的吞吐量可能是访存的几百倍，还是很容易 memory bound。

最后一个概念是 grid，它的意思是许多个 block 的集合。

$$\rm thread\subset warp\subset block\subset SM\subset grid$$

性能优化：

- 刺激编译器优化，`__restrict__` 指针告诉编译器改变一个指针指向的地址的数据，不会影响到通过其他指针读取的数据，对 CPU 编程也有用
- Memory coalescing，Session 1.6 再说
- Shared memory
- Profiling Tool

找 ai 造一个向量加法代码

```C
#include <stdio.h>
#include <stdlib.h>
#include <cuda_runtime.h>

// __host__：host（CPU）调用，host 执行
// __device__：device（GPU）调用，device 执行
// __global__：任意调用，device 执行，核函数（kernel）属于此类
__global__ void vectorAdd(const float *a, const float *b, float *c, int n)
{
    // 计算全局索引（一维网格 + 一维线程块）
    int idx = threadIdx.x + blockIdx.x * blockDim.x;

    // 边界保护（guard）：防止越界，因为总线程数可能大于实际元素个数
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}

int main()
{
    int n = 1000000;                 // 向量元素个数
    size_t bytes = n * sizeof(float);

    // ---------- 1. Host 端内存分配 ----------
    float *h_a = (float*)malloc(bytes);
    float *h_b = (float*)malloc(bytes);
    float *h_c = (float*)malloc(bytes);

    // 初始化 Host 数据
    for (int i = 0; i < n; i++) {
        h_a[i] = 1.0f;
        h_b[i] = 2.0f;
    }

    // ---------- 2. Device 端内存分配（cudaMalloc） ----------
    float *d_a, *d_b, *d_c;
    cudaMalloc(&d_a, bytes);
    cudaMalloc(&d_b, bytes);
    cudaMalloc(&d_c, bytes);

    // ---------- 3. 数据传输 Host → Device（cudaMemcpy） ----------
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, bytes, cudaMemcpyHostToDevice);

    // ---------- 4. 核函数启动（Kernel Launch） ----------
    int threadsPerBlock = 256;       // 每个线程块含 256 个线程
    int blocksPerGrid = (n + threadsPerBlock - 1) / threadsPerBlock; // 向上取整
    vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_a, d_b, d_c, n);

    // 可选：显式同步，确保核函数执行完毕（cudaMemcpy 会隐式同步，此处为了演示）
    cudaDeviceSynchronize();

    // ---------- 5. 结果拷贝回 Host（cudaMemcpy Device → Host） ----------
    cudaMemcpy(h_c, d_c, bytes, cudaMemcpyDeviceToHost);

    // ---------- 6. 验证结果 ----------
    for (int i = 0; i < n; i++) {
        if (h_c[i] != 3.0f) {
            printf("❌ 验证失败：h_c[%d] = %f，期望 3.0\n", i, h_c[i]);
            return 1;
        }
    }
    printf("✅ 向量加法成功！所有结果均为 3.0\n");

    // ---------- 7. 释放内存 ----------
    cudaFree(d_a);
    cudaFree(d_b);
    cudaFree(d_c);
    free(h_a);
    free(h_b);
    free(h_c);

    return 0;
}
```
