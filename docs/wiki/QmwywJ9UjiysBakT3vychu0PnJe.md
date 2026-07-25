---
title: "推送"
description: "推送 · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

[AI Infra Wiki](/wiki/) / [Topic 1 - Kernel and Compilers](/wiki/E3ltwZcMEiBJy2kusiCcKlk5nzb) / [Session 1 7.23](/wiki/VIJPw24sqiPOhXkfEwXcEvVInhg)

# 推送

[在飞书中查看原文 ↗](https://lcpu-club.feishu.cn/wiki/QmwywJ9UjiysBakT3vychu0PnJe)

当一次训练需要调动成百上千张 GPU，当一个算子几毫秒的差距都会被重复放大，模型背后的系统究竟如何工作？

这个暑假，北京大学未名超算队与北京大学学生 Linux 俱乐部共同推出的 **Weiming HPC Training Camp × LCPU AI Infra Seminars** 将于 **7月26日（星期日）**&ZeroWidthSpace;正式开课！

从 Kernel 到编译器，从分布式系统到集合通信，从模型推理到强化学习系统，我们将在七周时间里，围绕四个 Topic，一起走近大模型训练与推理背后的系统。

现在，准备工作已经就绪。

第一周我们将进入 Topic 1 —— **Kernel & ML Compiler**。从 GPU 的工作方式开始，逐步认识 CUDA 编程模型，并初步接触 Triton、TileLang 等 GPU Kernel DSL。

## Session 00 | 从 HPC 到 AI Infra: 并行计算与并行编程

为什么超算和 AI Infra 息息相关？为什么随着算力增强，人工智能才能越来越强？

为什么大模型在 GPU 上才能运行和训练？

这都归功于大模型的计算和传统的科学计算、气候模拟等问题一样，能够**高度并行**

- 为什么能并行？
- 什么地方并行？
- 如何做并行计算？

这次课希望能给你建立一些直觉上的感受。

## Session 01 | GPU 编程模型

为什么 GPU 上的一个线程不比 CPU 更快，却能完成更大规模的并行计算？

CUDA 为何要把线程组织成 Thread、Block 和 Grid？Wrap 又是什么？

当我们从 CUDA 转向 Triton、TileLang，编程视角为什么会从“一个线程”变成“一块数据”？

- **MLSys on GPU**  
 SIMD 与 SIMT、Throughput 与 Latency，以及 GPU 为何适合大规模并行计算 
- **CUDA Programming Model**  
 Host 与 Device、Kernel Launch、Thread / Block / Grid、Warp，以及线程之间的执行与协作 
- **Triton / TileLang**  
 Program、Block 与 Tile  Level 编程

本次课希望简单介绍上述内容，帮助大家建立后续学习所需的基本视角，为后续深入学习打下基础。

## 丰富的交流与实践

Infra Seminars 不是一套由少数讲者单向输出的课程

无论是课前、课中还是课后，我们都欢迎大家积极交流、提出意见、给出反馈！

此外，在直播课程之外，我们还准备了丰富的实践作业，敬请大家关注！

同时，我们也非常欢迎有独到见解的你来做分享，

## 活动安排

**活动主题**

Session 00 |  从 HPC 到 AI Infra: 并行计算与并行编程

Session 01｜GPU Programming Model

**时间**

2026 年 7 月 26 日（周日）

18:00 - 20:30

**线上参与**

**分享人**

陈嘉骏｜元培学院 25 级本科生，未名超算队成员

郑    熠｜信息科学技术学院 25 级本科生，未名超算队成员

王艺霏｜信息科学技术学院 25 级本科生，未名超算队成员

**本周日（7 月 26 日），Weiming HPC Training Camp × LCPU AI Infra Seminars， 第一课见！**

**主办**

北京大学未名超算队

北京大学学生 Linux 俱乐部

**特别感谢**

腾讯

宽德
