---
title: "Session 2.1  Memory Abstraction & Hierarchy"
description: "Session 2.1  Memory Abstraction & Hierarchy · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 2.1  Memory Abstraction &amp; Hierarchy</h1>
  <div class="session-banner-meta wiki-page-banner-meta"><span class="session-banner-meta-item is-replay"><b>回放：</b><a href="https://www.bilibili.com/video/BV1gqGA6ZEfg" target="_blank" rel="noreferrer">2.1-Memory Abstraction &amp; Hierarchy</a></span><span class="session-banner-meta-item is-presenter"><b>主讲：</b>林若瑜</span></div>
</header>

## GPU 的性能限制

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/c2b629ab592b8191496122bb.png" caption="GPU 的结构" width="2120" height="950" />

在一个 kernel 进行运算的过程中，我们需要把数据从 HBM 中移到 SM 中，然后在 SM 的运算单元中进行计算，最后在把运算结果从 SM 移回 HBM 中。这样实际上 kernel 的性能受限于计算单元的计算速度和内存带宽。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/2b4691bb10faccd0f26c57c5.png" caption="性能限制 roofline model" width="1280" height="558" transparent />

在 GPU 的 flops 达到一定程度以后，内存带宽满载，这时继续提升 flops 就不会带来实际性能提升。上图的拐点 I 即计算性能 / 内存带宽。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/f87b75a4d451138f2cc96f63.png" caption="一些典型的 GPU 的性能数据" width="1263" height="480" />

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/e6409c6733cf9862f6aff725.png" caption="常见 kernel 的算存比" width="1534" height="280" />

可以看出，以上 kernel 中，GEMM 是一个 compute bound 的 kernel，其余均为 memory bound。

<FeishuGrid>

<FeishuGridColumn width="0.446195">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/8f2adf22e2fc98ad028e88de.png" caption="GEMM" width="1178" height="484" />

</FeishuGridColumn>

<FeishuGridColumn width="0.553805">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/b57b97f54dce663a8f1b00db.png" width="1206" height="398" />

</FeishuGridColumn>

</FeishuGrid>

## 用满内存带宽

对于 roofline model给出的上限性能，在实际情况中也是不容易达到的。下面将介绍如何打满内存的带宽，从而优化 kernel 性能。

```C++
template <typename scalar_t>
__global__ void axpy_naive(scalar_t a, const scalar_t * x, scalar_t * y, int n) {
    int tid = threadIdx.x + blockIdx.x * blockDim.x;
    if (tid < n) {
        y[tid] = a * x[tid] + y[tid];
    }
}
```

上图 kernel 有完美的 coalesced、没有divergence，没有同步、100% occupancy 而且 embarrassingly parallel，没有数据依赖。但在实际情况下，这样的 kernel 也无法跑满内存带宽。下图显示，使用不同的数据类型，这个 kernel 的内存带宽利用率有明显区别，而且和显卡的最大内存带宽（stream）也有明显差距。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/a140e7c4b034a7eb7927ef8c.png" caption="kernel 在不同显卡、不同数据类型时的内存带宽利用率" width="1688" height="990" />

我们这样来分析上述的问题：想象有一个20级台阶的扶梯，扶梯的每个台阶站1个人，扶梯运行的速度是2s一个台阶，那么我们可以算出这个扶梯的带宽是0.5人/s，延迟是40s。但是如果整个扶梯上只有一个人，那么相当于在40s的延迟里，扶梯一共才运输了一个人，这时的实际带宽只有1/40 人/s，而且扶梯上的位置大部分也是空的。我们需要带宽\*延迟，也就是20个人站在扶梯上，才能跑满这个扶梯的理论带宽。（**Little's law** in Queueing Theory）

<FeishuGrid>

<FeishuGridColumn width="0.479345">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/843d340efc5e0812a0e4db8d.png" caption="只有一个人，带宽没有跑满" width="1105" height="945" />

</FeishuGridColumn>

<FeishuGridColumn width="0.520655">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/7e72e0e60d3f12bef7441bb1.png" width="796" height="626" />

</FeishuGridColumn>

</FeishuGrid>

所以 GPU 中，我们需要 带宽\*延迟 这个数量的 infly 字节（即在请求队列里），下表给出了常见 GPU 的带宽和延迟数（估计），从而可以知道我们需要的 infly 字节数。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/3a8aeab8d6c74272accc4b3d.png" width="1491" height="736" transparent />

如果想提高在飞字节数，一般有两种方法：instruction level parallelism 和 thread level parallelism。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/04b6dca0bfb5ccbaffaf5762.png" caption="提高在飞字节数的方法" width="2253" height="850" transparent />

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/e12449004519e9b3cb3aee9a.png" caption="提升上述三个指标都可以提升在飞字节数" width="2445" height="304" transparent />

### 提高在飞字节数——展开

```C++
__global__
void kernel(const float * __restrict__ a,
            const float * __restrict__ b,
            float * __restrict__ c)
{
    int idx = blockIdx.x * blockDim.x + threadIdx.x;

    c[idx] += a[idx] * b[idx];
}
```

我们假设 load 指令的延迟是1000个 cycle，每个 cycle 可以发出1条指令，那么在执行完前2个 cycle 时（三个 load 指令），之后我们需要等待1000个 cycle的数据才能等到计算开始！这样一次循环需要1006个 cycle。

<FeishuGrid>

<FeishuGridColumn width="0.416415">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/b1830367f867129b265a230f.png" caption="指令化的 kernel" width="1475" height="675" />

</FeishuGridColumn>

<FeishuGridColumn width="0.583585">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/b1830367f867129b265a230f.png" caption="我们需要等待1000个 cycle！" width="1475" height="675" />

</FeishuGridColumn>

</FeishuGrid>

```C++
__global__
void kernel(const float * __restrict__ a,
            const float * __restrict__ b,
            float * __restrict__ c)
{
    int tid = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = blockDim.x * gridDim.x;

    #pragma unroll 2
    for (int i = 0; i < 2; i++) {
        const int idx = tid + i * stride;
        c[idx] += a[idx] * b[idx];
    }
}
```

对于这个修改后的 kernel，编译器虽然可以直接判断 a 和 b 的项没有修改，可以直接在 `load c[i1]` 之后执行 `load a[i2]` 和 `load b[i2]`。但是因为对 c 做了修改，而且编译器不能确定 `stride` 是一个编译期常量，如果 `stride = 0`，那么对 c 的修改只能顺序执行。所以编译器会卡在 `load c[i2]` 之前。这样两次循环总共需要2011个 cycle，一个循环比上面节省了0.5个cycle。

<FeishuGrid>

<FeishuGridColumn width="0.40164">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/15ab470edbdddb89541ee2df.png" caption="指令化的kernel" width="1242" height="736" />

</FeishuGridColumn>

<FeishuGridColumn width="0.59836">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/80d8f7c31d803793f188236a.png" width="1688" height="668" />

</FeishuGridColumn>

</FeishuGrid>

```C++
#define THREAD_BLOCK_DIM 128

__global__
void kernel(const float * __restrict__ a,
            const float * __restrict__ b,
            float * __restrict__ c)
{
    int tid = blockIdx.x * blockDim.x + threadIdx.x;
    int off = 2 * THREAD_BLOCK_DIM * blockIdx.x + threadIdx.x;

    #pragma unroll 2
    for (int i = 0; i < 2; i++) {
        const int idx = off + i * THREAD_BLOCK_DIM;
        c[idx] += a[idx] * b[idx];
    }
}
```

在这次修改中，我们使用了编译期常量，才将问题得到解决。这次，我们在1008个 cycle 中执行了2个循环，相比之下效率提升了2倍。

<FeishuGrid>

<FeishuGridColumn width="0.438473">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/64f68ba54fcf145d280b364c.png" caption="可以提前执行所有 load" width="1218" height="682" />

</FeishuGridColumn>

<FeishuGridColumn width="0.561527">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/5834e762ce2d959e20f913d3.png" width="1528" height="666" />

</FeishuGridColumn>

</FeishuGrid>

### 提高内存带宽——Occupancy

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/3b4c0bf1b82a76f968b65da9.png" caption="SM结构示意图" width="799" height="1118" />

一个 SM 内部有4个 SMSP， 每个 SMSP 都有自己独立的算术单元、寄存器和一个 warp scheduler。一个 SMSP 上最多驻留16个 warp，每个 cycle 都可以选择一个 warp 从中发射。因为每个 SMSP 有自己的寄存器，所以不需要类似 CPU 的上下文切换。所以理论上发射的 warp 越多，occupancy 越高，理论上内存带宽利用率就越高。

Shared memory 的大小和寄存器数量会限制 occupancy。shared memory 的典型大小是每个 SM 164KB（A100）或228KB（H100、B200）；每个 SM 有65536个32 bit 寄存器。

下图呈现了 A100 上实测的 occupancy 和 MLP 对于内存带宽的影响。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/a60f1388026809b6cd5f3449.png" caption="A100 的实测内存带宽" width="962" height="572" />

### 提高内存带宽——向量化访存

我们可以使用 `float4` 类型，使得一次 load 可以加载4个 float（128 bytes）。相当于每一个 load 指令的效率都提高了4倍。

```C++
// x and y must be 16-byte aligned (cudaMalloc allocations satisfy this).
__global__ void saxpy_vectorized(const float4* __restrict__ x,
                                 float4* __restrict__ y, float a, int n) {
    const int i = blockIdx.x * blockDim.x + threadIdx.x;
    const int n4 = n / 4;

    if (i < n4) {
        const float4 xv = x[i];
        const float4 yv = y[i];

        y[i] = make_float4(a * xv.x + yv.x,
                           a * xv.y + yv.y,
                           a * xv.z + yv.z,
                           a * xv.w + yv.w);
    }
}
```

### 提高内存带宽——coalescing

多个线程的内存访问尽可能合并（Coalescing），即让一个 warp 中多个线程访问连续地址的数据，可以减少实际的内存事务数量。

GPU 的内存访问具有固定的粒度。以 NVIDIA GPU 为例，最小的内存访问单位通常是 32 Bytes 的 sector。从 L1 Cache 到 L2 Cache 时，一个 sector 为 32 Bytes；而从 L2 Cache 到 Global Memory 时，通常以多个 sector 组成更大的访问粒度。Cache 管理的基本单位则是 128 Bytes 的 Cache Line，一个 Cache Line 由 4 个连续的 32 Bytes sector 组成。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/442f35cfa5361aa3b4ec2173.png" caption="cache line" width="1170" height="296" />

我们要尽量让一个 warp 读取的数据位于连续4个 sector 的内存上：

<FeishuGrid>

<FeishuGridColumn width="0.50007">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/5b47f2912c9482c1f02d62ba.png" width="1171" height="555" />

</FeishuGridColumn>

<FeishuGridColumn width="0.49993">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/8db2b327f0df802f34433300.png" width="1042" height="494" />

</FeishuGridColumn>

</FeishuGrid>

如果没有以32个 byte 对齐、读取集中在一个 sector 或数据离得很远，都会影响内存效率。

<FeishuGrid>

<FeishuGridColumn width="0.346019">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/8d5e23b7c05132857ba831be.png" width="944" height="402" />

</FeishuGridColumn>

<FeishuGridColumn width="0.314876">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/d1df0918792f5a767debd976.png" width="1026" height="481" />

</FeishuGridColumn>

<FeishuGridColumn width="0.339105">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/6d2689a80e7ec4509a45aa30.png" width="957" height="416" />

</FeishuGridColumn>

</FeishuGrid>

```C++
struct Coefficients
{
    float u, v, w;
    float x[8], y[8], z;
};

__global__ void kernel(Coefficients *data)
{
    int i = cg::this_grid().thread_rank();

    data[i].u = data[i].u + 10.f;
    data[i].y[0] = data[i].y[0] + 10.f;
}
```

例如把数据放到一个结构体里，每一个结构体里的 u 会离得很远。第11行对 u 的访问操作就会跨不同的 sector，效率低下。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/93b3b599a734b921be1a1f24.png" caption="对 u 的访问跨越了不同 sector" width="1650" height="502" />

```C++
struct Coefficients
{
    float *u, *v, *w;
    float *x0, ..., *x7, *y0, ..., *y7, *z;
};

__global__ void kernel(Coefficients data)
{
    int i = cg::this_grid().thread_rank();

    data.u[i] = data.u[i] + 10.f;
    data.y0[i] = data.y0[i] + 10.f;
}
```

但是如果稍作修改，把原先的 struct 改成 struct of arrays，那么可以看到访问的内存就便连续了，实际测试中可以提升大约8倍的性能。

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/ca872f6f5e5ad97706db4bd3.png" caption="u 位于连续的内存上" width="1530" height="584" />

### 例子：优化 reduce

对于给定长度 N 的数组，对其中每项进行求和：$out = \sum_{i=0}^{N-1}x_i$。我们将以这个算法为例，给大家展示如何进行优化。

```C++
__global__ void reduce_v1(
    const float* x, float* out, int n)
{
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n)
        atomicAdd(out, x[i]);
}
```

第一个版本的 reduce 中，所有变量朴素的通过一个循环相加。这样所有的请求都会串行的发送给 L2 slice。实测的执行时间是 197ms，内存带宽是1.4GB/s。

<FeishuGrid>

<FeishuGridColumn width="0.558921">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/99d464c7226be4370c4f28d4.png" width="961" height="541" />

</FeishuGridColumn>

<FeishuGridColumn width="0.441079">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/0bffef01d0e26f652e4d77ee.png" width="1181" height="845" />

</FeishuGridColumn>

</FeishuGrid>

我们可以把输入数组放到 shared memory 中，防止重复访问 global memory；每个 block 可以在内部进行一个树形的 reduce 操作，优化后的reduce：

```C++
__global__ void reduce_v2(
    const float* x, float* out, int n)
{
    __shared__ float s[BLOCK];

    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + tid;

    s[tid] = (i < n) ? x[i] : 0.0f;
    __syncthreads();

    for (int stride = 1; stride < blockDim.x; stride *= 2)
    {
        if (tid % (2*stride) == 0)
            s[tid] += s[tid + stride];
        __syncthreads();
    }

    if (tid == 0) atomicAdd(out, s[0]);
}
```

这样经过实际测试，一次 reduce 耗时1.67ms，内存带宽 160GB/s，执行效率提高了118倍。但是可以看的，并不是 warp 里连续的线程在执行操作，也就是 warp 中一半的线程被浪费了。

<FeishuGrid>

<FeishuGridColumn width="0.36236">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/4bfa3fe802db51a02b870cef.png" width="1953" height="1778" />

</FeishuGridColumn>

<FeishuGridColumn width="0.63764">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/aee529f045cf25e7d7bdfdc9.png" width="1406" height="722" />

</FeishuGridColumn>

</FeishuGrid>

再次优化后，我们让连续的线程负责相邻的相加。这样可以再次得到2倍的加速。

```C++
__global__ void reduce_v2(
    const float* x, float* out, int n)
{
    __shared__ float s[BLOCK];
    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + tid;

    s[tid] = (i < n) ? x[i] : 0.0f;
    __syncthreads();

    for (int stride = 1; stride < blockDim.x; stride *= 2)
    {
        int idx = 2 * stride * tid;
        if (idx < blockDim.x)
            s[idx] += s[idx + stride];
        __syncthreads();
    }

    if (tid == 0) atomicAdd(out, s[0]);
}
```

### 提高内存带宽——bank conflict 

Shared memory 分为多个 bank，连续的4个 byte 是一个 bank。
