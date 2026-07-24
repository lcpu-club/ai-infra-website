---
title: "Weiming HPC Training Camp x LCPU AI Infra Seminars (筹)"
description: "Weiming HPC Training Camp x LCPU AI Infra Seminars (筹) · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

[AI Infra Wiki](/wiki/)

# Weiming HPC Training Camp x LCPU AI Infra Seminars (筹)

[在飞书中查看原文 ↗](https://lcpu-club.feishu.cn/wiki/BtqywAZHNiA38KkEwb0cNvTUnNf)

> 暂时考虑GPU Programming和集群、环境、通信、Linux & Tools等部分也许可以合并 （好像没想到不能合并的部分、似乎即使CPU上的优化也可以在AI Infra的scope里
> 
> 暂时考虑的形式是讨论会形式，每周一到两次活动，每次活动一组同学讲同一个Topic相关的一些sessions, sessions可以动态补充，大体要有条理顺序，但可以按照兴趣发散。要求所有报名参加的同学至少讲一次、pkusc的同学至少讲两次；讲完之后大家讨论、提意见。 除了大伙讲的之外， 可以多几次Guest Lectures, （对接赞助？）以及超算队学长们、等等。
> 
> 每个session：20-40min，最好有配套的代码和handout、exercises，需要有质量要求，肯定是比较精致比较好，别全部都是vibe出来的就好。
> 
> 每次的session发布到bilibili、youtube， handout / execrcises发布到社团公众号、官网、hpcwiki、（也许）社团知乎。允许同学们转载
> 
> 考虑找赞助商给Lectures & 课题 & 算力，给大家一些GPU开发节点用，每次配套的小练习也许可以上hpcgame评测，这些内容对社团infra开发压力较大
> 
> 考虑给Lecturers发劳务？ 300-600 可以收集评价分档次发放？给handout、exercises也发？

**飞书群：** AI Infra学习小组

# Topics & Sessions (暂)

### GPU Programming：怎么写Kernel

- 01 - GPU体系结构与GPU编程模型 （上）
- 02 - GPU体系结构与GPU编程模型（下）
- 03 - CUDA初识：把代码跑到GPU上去
- 04 - CUDA生态：CU{x} CUB与并行算法
- 05 - GPU的特点与更高效的CUDA代码（上）：Warp divergence 、 bank conflict 与 I/O coalesce
- 06 - GPU的特点与更高效的CUDA代码（中）：Memory hierarchy、TMA 与 Memory  Bound
- 07 - GPU的特点与更高效的CUDA代码（下）：专用指令、SIMD、Tensor Core 与 Compute Bound
- 08 - 写写Kernel（上）：Speed of Light 、Optimization Goal 与 Profiling
- 09 - 写写Kernel（中）：Fusing, Tiling and Prefetch
- 10 - 写写Kernel（下）：Soft pipeline, Warp Specialization and Persistent Kernel
- 11 - 初识DSL（I）：Triton primitives and Kernels in Triton
- 12 - 初识DSL（II）：Disadvantage of Triton and TileLang primitives
- 13 - 初识DSL（III）：Kernels in TileLang and CuTeDSL Primitives
- 14 - 初始DSL（IV）：Kernels in CuTeDSL and Trading off in DSL
- 15 - 硬件侧的演进：Ampere, Hopper and Blackwell
- 16 - Kernel进阶：SoL GEMM的优化之旅
- 17 - Kernel进阶：SoL Attention的优化之旅：MHA & MLA
- 18 - Kernel进阶：SoL MoE的优化之旅 

### **ML Compilation & Parallelization**

- 01 - 数据并行 DP：PyTorch DDP & 梯度累加 - 双卡训练初尝试
- 02 - 数据并行 DP：ZeRo Stage1-3 & FSDP - 显存优化
- 03 - 张量并行 TP：MLP列切分/行切分、Attention头切分
- 04 - 流水线并行 PP： GPipe、1F1B
- 05 - 流水线并行 PP：Interleaved-1F1B
- 05 - 流水线并行 PP：DualPipe
- 07 - 序列并行 SP：序列并行与上下文并行原理
- 08 - 序列并行 SP：FlashAttention与RingAttention
- 09 - 专家并行 EP：MoE原理
- 10 - 专家并行 EP：负载均衡、MoE训练&推理特性
- 11 - 专家并行 EP：DeepEP07 - （Advanced ML Parallelization）Automated ML Parallelization：FlexFlow & Alpa

> sifer: 我感觉Parallelization没必要和ML Compilie在一块讲？
> 
> richwei：感觉可以拆开，当时一起想到的，就写一起了

### ML Compiler: Automatic! Automatic!

- 从CUDA到DSL：天下人苦CUDA久矣！
- 编译原理速览：DSL → cubin
- … 待zyx补充 

### LLM Training Framework：我要训练！

- 01 - 梯度下降、反向传播与模型训练简介
- 02 - 我不止一张卡（上）：怎么训得更快 — Data Parallelism
- 03 - 我不止一张卡（中）：模型好像有点大 — Model Parallelism(TP, EP, SP, CP, PP)
- 04 - 我不止一张卡（下）： 
- 05 - （
- 

### LLM Inference and Serving Framework：再推快一点！

- 01 - 从KV Cache说起：Paged Attention, Radix Cache & Prefix Cache
- 02 - 推理侧也有并行：推理框架下的TP, EP, SP, CP, PP
- 03 - 专门的人干专门的事：PD分离、KV Cache Transfer、AF分离
- 04 - 公平的推理：Continuous Batching & Chunked Prefill
- 05 - 想占点便宜：Speculative Decoding
- 06 - 

### RL Framework：既要推理又要训练怎么办

- 01 -

字节开源框架：[VeRL](https://github.com/verl-project/verl)

阿里开源框架：[ROLL](https://github.com/alibaba/ROLL)

### 藏在背后的一环：集群通信

- 从TCP/IP到RDMA
- IB、ROCE、iWarp简介
- RDMA详解（I）
- RDMA详解（II）
- RDMA详解（III）
- RDMA详解（IV）
- 从RDMA到NCCL、UCCL：通信库干了什么
- torch.distributed与NCCL Primitives
- xxx
- xxx
- 高性能带通信Kernels：我要自己写通信！
- 

### Generative AI（LLM 算法基础）

Generative models of text：RNN LMs / Autodiff & Transformer LMs & Learning LLMs / Decoding & Pre-training, fine-tuning / Modern Transformers

Generative models of images：CNN/Encoder-only Transformers/ViT & GAN/PGM & Diffusion models

Applying and adapting foundation models：VAE & In-Context Learning / Prompt Engineering / Instruction Fine-tuning / Reinforcement learning with human feedback (RLHF)

Multimodal foundation models：Direct Preference Optimization (DPO) / Text-to-image generation / Latent diffusion model & VLM & Cross-Attention / Diffusion Transformer / Prompt-to-Prompt

Scaling Up：Querying Transformer / Scaling Laws & Mixture of Experts & Distributed training & Flash Attention / Efficient decoding strategies

Advanced Topics：Long Context in LLM & Reasoning Models & State Space Models / Hybrid Models & Code Generation / Autonomous Agents & Audio understanding and synthesis & Generative Models for Videos & Interactive World Models + Science of Alignment

# 时间线（暂）

频率：每周1-2次

## 重要时间节点

**北大暑假**

校本部：6月29日起

医学部：7月6日起

**北大秋季学期开学**

校本部：9 月 7 日

医学部：

- 在校本科生：8 月 31 日
- 本科新生、研究生：9 月 7 日

# TODO List

## Timeline确定

频率：每周1-2次

07.08-07.15 前期筹备

宣发预热（07.15）

活动正式开始（07.17/07.20）（？）

正式活动周期：07.17-09.07

每次活动一个topic的一个子主题？暑假以2-3个模块为目标（？）

## 组织形式

线上：腾讯会议

线下：提前预约活动教室（maybe社团活动教室？）

## 课程设计

待完善的topics：

ML Compiler: Automatic! Automatic 部分

LLM Training Framework：我要训练！部分

LLM Inference and Serving Framework：再推快一点！部分

RL Framework：既要推理又要训练怎么办

藏在背后的一环：集群通信 部分

## 赞助

**赞助形式？**

暂时考虑的赞助形式是：

- 给卡，容器  / VM / Baremetal
- 给钱 

权益：

- Guest Lectures
- 联系方式
- 内推 / hiring

### （待补充）

## 参考资料

Generative AI：[https://www.cs.cmu.edu/~mgormley/courses/10423/schedule.html](https://www.cs.cmu.edu/~mgormley/courses/10423/schedule.html)

（15-779）Advanced Topics in Machine Learning Systems：[https://www.cs.cmu.edu/~zhihaoj2/15-779/schedule.html](https://www.cs.cmu.edu/~zhihaoj2/15-779/schedule.html)

## 关联会议：

<table><colgroup><col /><col /><col /></colgroup><tbody><tr><td>日期</td><td>会议主题</td><td>记录</td></tr><tr><td>2026.07.10</td><td>Weiming HPC Training Camp x LCPU AI Infra Seminars 筹备启动会</td><td>《Weiming HPC Training Camp x LCPU AI Infra Seminars (筹)——0710会议议程》</td></tr></tbody></table>
