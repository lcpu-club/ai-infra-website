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

这个暑假，北京大学未名超算队与北京大学学生 Linux 俱乐部共同推出的 **Weiming HPC Training Camp × LCPU AI Infra Seminars** 将于 **7月25日（星期六）**&ZeroWidthSpace;正式开课！

从 Kernel 到编译器，从分布式系统到集合通信，从模型推理到强化学习系统，我们将在七周时间里，围绕四个 Topic，一起走近大模型训练与推理背后的系统。

现在，准备工作已经就绪。

第一周我们将进入 Topic 1 —— **Kernel & ML Compiler**。从 GPU 的工作方式开始，逐步认识 CUDA 编程模型，并初步接触 Triton、TileLang 等 GPU Kernel DSL。

## Session 01 | GPU 编程模型

为什么 GPU 上的一个线程不比 CPU 更快，却能完成更大规模的并行计算？

CUDA 为何要把线程组织成 Tread、Block 和 Grid？Wrap 又是什么？

当我们从 CUDA 转向 Triton、TileLang，编程视角为什么会从“一个线程”变成“一块数据”？

第一课将围绕三个部分展开：

- **MLSys on GPU**  
 SIMD 与 SIMT、Throughput 与 Latency，以及 GPU 为何适合大规模并行计算 
- **CUDA Programming Model**  
 Host 与 Device、Kernel Launch、Thread / Block / Grid、Warp，以及线程之间的执行与协作 
- **Triton / TileLang**  
 Program、Block 与 Tile Abstraction，并通过简单的 Elementwise Kernel 对比不同编程模型

更重要的是，本 Session 旨在帮助大家建立后续学习所需的基本视角，为后续深入学习打下基础。

## 这不是一场坐着听完的讲座

AI Infra 不是一套由少数讲者单向输出的课程！每周，我们将围绕具体问题集中组织若干次活动：

- **知识分享交流**：提前发放预习材料与参考资料、由不同同学进行若干次 20～40 分钟的分享、安排充足的现场提问与讨论 。
- **动手实践探索**：提供配套代码、实践任务与讲义，并为大家配备充足的算力资源、搭建测试平台，让大家把学到的知识用起来！
- **主动交流分享**：如果刚好有你感兴趣的、有一定了解的模块，我们非常欢迎你成为讲者！

听众不需要每次都发言，分享者也不需要在认领内容时就已经掌握全部知识。

你可以先来听听，找到自己感兴趣的问题；也可以在学习后认领一小节，把自己的理解带回现场讨论。

## 活动安排

**活动主题**

Session 01｜GPU Programming Model

**时间**

2026 年 7 月 25 日（周六）

 〈开始时间—结束时间〉

**线上参与**

〈腾讯会议、直播链接或“活动群内发布”〉

**Session 安排**

-  〈时间〉　签到与开场 
-  〈时间〉　1.1 MLSys on GPU 
-  〈时间〉　1.2 CUDA Programming Model 
-  〈时间〉　休息 
-  〈时间〉　1.3 Triton / TileLang 
-  〈时间〉　提问与自由讨论

**分享人**

〈姓名〉｜〈院系、年级或相关经历〉

〈姓名〉｜〈院系、年级或相关经历〉

〈姓名〉｜〈院系、年级或相关经历〉

## 第一课见！

从 GPU 为什么追求高吞吐，到 CUDA 如何组织成千上万个线程；从 Thread-level Programming，到 Triton、TileLang 所采用的 Tile-level Abstraction——

这个暑假，我们从第一个 Kernel 开始。

**7 月 25 日，Weiming HPC Training Camp × LCPU AI Infra Seminars 第一课见！**

**主办**

北京大学未名超算队

北京大学学生 Linux 俱乐部

**特别感谢**
