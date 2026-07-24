---
title: "Weiming HPC Training Camp x LCPU AI Infra Seminars 暑期活动方案"
description: "Weiming HPC Training Camp x LCPU AI Infra Seminars 暑期活动方案 · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

[AI Infra Wiki](/wiki/)

# Weiming HPC Training Camp x LCPU AI Infra Seminars 暑期活动方案

[在飞书中查看原文 ↗](https://lcpu-club.feishu.cn/wiki/UuLEwoEJRiSaBak8gdnc7UfPn9c)

## 活动形式

**活动频率：**&ZeroWidthSpace;半周一次（具体时间：周五&周一？）

**活动时间：**&ZeroWidthSpace;1h/2h

**活动周期：**&ZeroWidthSpace;7.17～9.3

**重要时间节点：**&ZeroWidthSpace;topic投票（7.13）、活动预热推送（7.15）、第一次活动开始（7.23晚上）

**活动类型：**

**（1）常规活动**

**课程形式：**&ZeroWidthSpace;课前预习+20～40min分享+互动讨论

**（2）前沿讲座**

专题讲座，穿插在周活动之间。

**活动地点：**&ZeroWidthSpace;线上腾讯会议 & 线下活动地点（燕园大厦308）

## Timeline

**各个session的introduction写作要求**：（有任何好的想法和建议，随时comment～）

**（1）内容要求**

- 形式类似大纲（包括感觉一定要讲的、可有可无的、可作为补充的、有趣的等等）
- 给出参考资料（包括论文、blog、repo等等）
- 最好能发到推送里（预告推送x）

**（2）材料&作业要求（作业可选，但建议）**

- 需要有文档和内容（参考cs336作业）
- 尽量有可测试性（例如框架类的给pytest、kernel给固定 test case和参考实现的latency/mem bw/TFLOPS 啥的）
- 与评测平台对接（hpcgame/ ...）

<table><colgroup><col /><col /><col /><col /><col /><col /></colgroup><tbody><tr><td rowspan="19" style="vertical-align: middle"><b>活动timeline</b></td><td style="vertical-align: middle"><b>时间</b></td><td style="vertical-align: middle"><b>session</b></td><td style="vertical-align: middle"><b>负责人</b></td><td><b>作业设计</b></td><td style="vertical-align: middle"><b>备注</b></td></tr><tr><td style="vertical-align: middle">第一周<br />7.23</td><td>（GPU &amp; GPU Programming）<br />1.1 - MLSys on GPU (SIMD/SIMT、throughput   vs latency) <br />1.2 - CUDA Programming Model：thread coordination   &amp; execution ( grid/block/thread、kernel launch、host/device、warp )<br />1.3 - Triton/TileLang: CTA Level Programming (program/block、tile abstraction、elementwise kernel)</td><td style="vertical-align: middle">超算队同学</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第一周<br />7.26</td><td>（Memory Abstraction）<br />1.4 - Optimizing a Kernel(roofline intuition、global/shared/register hierarchy)<br />1.5 - Data reuse in shared memory (gemm tiling、 DSL shared tiling)<br />1.6 - Careful data movement(coalescing、bank   conflict、padding/swizzle)</td><td style="vertical-align: middle">@周宇轩</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第二周<br />7.30</td><td>（Tensor Core）<br />1.7 - Under T.gemm:  What is Tensor   Core (MMA tile shape, Why shape matter, Comparing with CUDA Core) <br />1.8 - Tensor Core and Layout  (Operand   fragment layout、A/B/C Layout)<br />1.9 – Describing Tensor Core capability with Layout (CuTe Layout   Algebra、shared memory swizzle for TC)</td><td style="vertical-align: middle">@孙远航<br />@周宇轩</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第二周<br />8.2</td><td>（Pipeline Ordering）<br />1.10 - Double   buffer： Space-time trading off (multi-buffer = shared memory -&gt; dependence   distance)<br />1.11 - TMA：Async date movement with   hardware (TMA copy、descriptor、in-flight、comparing with cp.async) <br />1.12- Warp specialization： producer/consumer   warpgroup</td><td style="vertical-align: middle">@孙远航<br />@周宇轩</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第三周<br />8.6</td><td>（DSL &amp; ML Compiler ）<br />1.13 - DSL in Fisrt Principle: What DSL, Why DSL, and How DSL<br />1.14 – Evo-Devo of GPU DSL and ML Compiler<br />1.15 - Auto pipelining (TileLang autoschedule：Input task graph = schedule + barrier + buffer)<br />1.16 – Graph Level：fusion , graph compiler, and   more</td><td style="vertical-align: middle">@周宇轩</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第三周<br />8.9</td><td>(Hardware &amp; SoL Kernel Explained)<br />1.17 - Hardware Evo-Devo: From Volta to Blackwell<br />1.18 - Domain Specific Accelerator: NPU<br />1.19 - SoL GEMM Explained<br />1.20 - SoL Attn Explained</td><td style="vertical-align: middle">@周宇轩<br />@孙远航</td><td></td><td></td></tr><tr><td colspan="5" style="vertical-align: middle">Guest Lecture – Topic1</td></tr><tr><td style="vertical-align: middle">第四周<br />8.13</td><td>(Communication Hardware Architecture)<br />2.0 From Circuits to Modern Computing Systems: A   Unified, Forward-Looking Perspective</td><td style="vertical-align: middle">AnterX</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第四周<br />8.16</td><td>2.1 Interconnect Design Inside AI Servers<br />2.2 Network Infrastructure: NIC, Switch and   Network Topology<br />2.3 Scale-Up vs. Scale-Out Communication<br />2.4 Reduction Offloading: SHARP vs. CCU<br />(Communication Software Stack)<br />2.5 Collective Communication Library<br />2.6 P2P Communication<br />2.7 EP and MoE Communication<br />(Communication Optimization)<br />2.8 Compute–Communication Overlap (including   Distributed Kernel)<br />2.9 Communication–Memory–Storage Co-design</td><td style="vertical-align: middle">@孔昊然</td><td></td><td></td></tr><tr><td colspan="5">Guest Lecture - Topic2</td></tr><tr><td style="vertical-align: middle">第五周<br />8.20</td><td>3.1 推理系统的核心：目标、指标、benchmark<br />3.2 PD 分离与计算过程</td><td style="vertical-align: middle">@孙远航</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第五周<br />8.23</td><td>3.3 以 KV Cache 为核心的系统<br />3.4 Batching</td><td style="vertical-align: middle">@孙远航</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第六周<br />8.27</td><td>3.5 Kernel 层：attention 与 MoE<br />3.6 MTP 和投机解码</td><td style="vertical-align: middle">@孙远航</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第六周<br />8.30</td><td>3.7 并行策略<br />3.8 常见框架介绍，目前的推理演进</td><td style="vertical-align: middle">@孙远航</td><td></td><td></td></tr><tr><td colspan="5">Guest Lecture - Topic3</td></tr><tr><td style="vertical-align: middle">第七周<br />9.3</td><td>4.1 RL 算法初识：PPO，XXPO，OPD<br />4.2 RL 框架演进：OpenRLHF、veRL<br />4.3 RL 中的长尾问题（一）：请求调度与资源分配<br />4.4 RL 中的长尾问题（二）：从同步到异步</td><td style="vertical-align: middle">@黄翟</td><td></td><td></td></tr><tr><td style="vertical-align: middle">第七周<br />9.6</td><td>4.5 RL 中的投机解码：面向 Rollout 的系统性加速<br />4.6 RL 中的训练稳定性：训推一致性与容错<br />4.7 Agentic RL：环境、沙箱与异构硬件的系统工程</td><td style="vertical-align: middle">@黄翟</td><td></td><td></td></tr><tr><td colspan="5">Guest Lecture - Topic4</td></tr></tbody></table>

## 活动推送

| **推送** | **时间** | **负责人** | **链接** |
|-|-|-|-|
| **topic投票推送** | 7.13 |  |  |
| **活动预热推送** | 7.15 |  |  |
| **活动期间阶段性总结推送** |  |  |  |
| **活动总结推送** |  |  |  |

## 团队分工
