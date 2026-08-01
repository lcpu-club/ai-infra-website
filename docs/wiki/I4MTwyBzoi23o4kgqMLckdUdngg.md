---
title: "Session 2.1 | Memory Abstraction & Hierarchy"
description: "Session 2.1 | Memory Abstraction & Hierarchy · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 2.1 | Memory Abstraction &amp; Hierarchy</h1>
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

对于这个修改后的 kernel，编译器虽然可以直接判断 a 和 b 的项没有修改，可以直接在 `load c[i1]` 之后执行 `load a[i2]` 和 `load b[i2]`，但是因为对 c 做了修改，所以编译器会卡在 `load c[i2]` 之前。这样两次循环总共需要2011个 cycle，一个循环之比上面节省了0.5个cycle。

<FeishuGrid>

<FeishuGridColumn width="0.40164">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/15ab470edbdddb89541ee2df.png" caption="指令化的kernel" width="1242" height="736" />

</FeishuGridColumn>

<FeishuGridColumn width="0.59836">

<FeishuImage src="/feishu/wiki/I4MTwyBzoi23o4kgqMLckdUdngg/80d8f7c31d803793f188236a.png" width="1688" height="668" />

</FeishuGridColumn>

</FeishuGrid>
