---
title: "Session 01｜GPU Programming Model"
description: "Session 01｜GPU Programming Model · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 01｜GPU Programming Model</h1>
</header>

为什么 GPU 上的一个线程不比 CPU 更快，却能完成更大规模的并行计算？

CUDA 为何要把线程组织成 Thread、Block 和 Grid？Warp 又是什么？

当我们从 CUDA 转向 Triton、TileLang，编程视角为什么会从“一个线程”变成“一块数据”？

- **MLSys on GPU**: SIMD 与 SIMT、Throughput 与 Latency，以及 GPU 为何适合大规模并行计算
- **CUDA Programming Model**: Host 与 Device、Kernel Launch、Thread / Block / Grid、Warp，以及线程之间的执行与协作
- **Triton / TileLang**: Program、Block 与 Tile  Level 编程

本次课将简单介绍上述内容，帮助大家建立后续学习所需的基本视角，为后续深入学习打下基础。

### 课前阅读 & 参考资料

- [CUDA-From-Correctness-To-Performance-Code/lecture.md](https://github.com/interestingLSY/CUDA-From-Correctness-To-Performance-Code/blob/master/lecture.md)
- [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/)
- [CUDA C Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)
- [TileLang Documentation](https://tilelang.com/)
- [Triton Documentation](https://triton-lang.org/main/index.html)
