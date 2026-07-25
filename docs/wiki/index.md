---
title: "Weiming HPC Training Camp x LCPU AI Infrga Seminars Wiki"
description: "Weiming HPC Training Camp x LCPU AI Infrga Seminars Wiki · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <span class="section-index">课程资料</span>
  <h1>Weiming HPC Training Camp x LCPU AI Infrga Seminars Wiki</h1>
</header>

## 文档目录

<table><colgroup><col /><col /><col /><col /></colgroup><tbody><tr><td>Topic</td><td>Session</td><td>日期</td><td>内容</td></tr><tr><td rowspan="10" style="vertical-align: middle">Topic1 GPU Programming：Kernel &amp; ML Compilers</td><td>00 - 从 HPC 到 AI Infra: 并行计算与并行编程<br />01 - GPU编程模型</td><td>7.26</td><td></td></tr><tr><td>02 - GPU体系结构与GPU编程模型<br />03 - CUDA初识：把代码跑到GPU上去<br />04 - CUDA生态：CU{x} CUB与并行算法</td><td></td><td></td></tr><tr><td>05 - GPU的特点与更高效的CUDA代码（上）：Warp divergence 、 bank conflict 与 I/O coalesce<p>06 - GPU的特点与更高效的CUDA代码（中）：Memory hierarchy、TMA 与 Memory  Bound</p><br />07 - GPU的特点与更高效的CUDA代码（下）：专用指令、SIMD、Tensor Core 与 Compute Bound</td><td></td><td></td></tr><tr><td>08 - 写写Kernel（上）：Speed of Light 、Optimization Goal 与 Profiling<br />09 - 写写Kernel（中）：Fusing, Tiling and Prefetch<br />10 - 写写Kernel（下）：Soft pipeline, Warp Specialization and Persistent Kernel</td><td></td><td></td></tr><tr><td>11 - 初识DSL（I）：Triton primitives and Kernels in Triton<br />12 - 初识DSL（II）：Disadvantage of Triton and TileLang primitives</td><td></td><td></td></tr><tr><td>13 - 初识DSL（III）：Kernels in TileLang and CuTeDSL Primitives<br />14 - 初始DSL（IV）：Kernels in CuTeDSL and Trading off in DSL</td><td></td><td></td></tr><tr><td>15 - 硬件侧的演进：Ampere, Hopper and Blackwell</td><td></td><td></td></tr><tr><td>16 - Kernel进阶：SoL GEMM的优化之旅</td><td></td><td></td></tr><tr><td>17 - Kernel进阶：SoL Attention的优化之旅：MHA &amp; MLA</td><td></td><td></td></tr><tr><td>18 - Kernel进阶：SoL MoE的优化之旅 </td><td></td><td></td></tr><tr><td rowspan="11" style="vertical-align: middle">课程理论部分—Topic2 ML Parallelization</td><td>01 - 数据并行 DP：PyTorch DDP &amp; 梯度累加 - 双卡训练初尝试</td><td></td><td></td></tr><tr><td>02 - 数据并行 DP：ZeRo Stage1-3 &amp; FSDP - 显存优化</td><td></td><td></td></tr><tr><td>03 - 张量并行 TP：MLP列切分/行切分、Attention头切分</td><td></td><td></td></tr><tr><td>04 - 流水线并行 PP： GPipe、1F1B</td><td></td><td></td></tr><tr><td>05 - 流水线并行 PP：Interleaved-1F1B</td><td></td><td></td></tr><tr><td>06 - 流水线并行 PP：DualPipe</td><td></td><td></td></tr><tr><td>07 - 序列并行 SP：序列并行与上下文并行原理</td><td></td><td></td></tr><tr><td>08 - 序列并行 SP：FlashAttention与RingAttention</td><td></td><td></td></tr><tr><td>09 - 专家并行 EP：MoE原理</td><td></td><td></td></tr><tr><td>10 - 专家并行 EP：负载均衡、MoE训练&amp;推理特性</td><td></td><td></td></tr><tr><td>11 - 专家并行 EP：DeepEP</td><td></td><td></td></tr><tr><td style="vertical-align: middle">课程理论部分—Topic3 ML Compiler: Automatic! Automatic!</td><td>01 从CUDA到DSL：编译原理速览：DSL → cubin<br />算子部分：<br />CuTe：模板元编程、Layout Algebra<br />Pypto<br />Triton：mlir<br />TileLang：tvm、<br />图编译部分：<br />torch.compile：图捕获、Graph Break、算子融合</td><td></td><td></td></tr><tr><td style="vertical-align: middle">课程理论部分—Topic4 藏在背后的一环：集群通信</td><td><ul><li>从TCP/IP到RDMA</li><li>IB、ROCE、iWarp简介</li><li>RDMA详解（I）</li><li>RDMA详解（II）</li><li>RDMA详解（III）</li><li>RDMA详解（IV）</li><li>从RDMA到NCCL、UCCL：通信库干了什么</li><li>torch.distributed与NCCL Primitives</li><li>高性能带通信Kernels：我要自己写通信！</li></ul></td><td></td><td></td></tr></tbody></table>
