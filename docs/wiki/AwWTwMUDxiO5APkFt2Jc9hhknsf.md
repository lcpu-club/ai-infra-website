---
title: "Session 2.2  FP32 GEMM Quick Walkthrough"
description: "Session 2.2  FP32 GEMM Quick Walkthrough · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 2.2  FP32 GEMM Quick Walkthrough</h1>
  <div class="session-banner-meta wiki-page-banner-meta"><span class="session-banner-meta-item is-replay"><b>回放：</b><a href="https://www.bilibili.com/video/BV1L8GA6YEAH" target="_blank" rel="noreferrer">2.2-FP32 GEMM Quick Walkthrough</a></span><span class="session-banner-meta-item is-presenter"><b>主讲：</b>周宇轩</span></div>
</header>

## 矩阵乘法 （GEMM）

计算$C = A\times B, A\in \mathbb{R}^{M\times K},B\in \mathbb{R}^{K\times N},C\in \mathbb{R}^{M\times N}$

我们如何计算这样的矩阵乘法呢？按照并行计算的思路，我们需要拆分计算和数据。我们需要使用数据并行的思路进行数据拆分，把数据拆分到 thread 尺度。

在传统的深度学习中，我们一般使用 FP16 甚至 FP8 这类低精度的运算，但是科学计算中，仍然会涉及到32位精度浮点数的矩阵乘法。这时我们没有办法使用矩阵运算的专用硬件 tensor core，需要自己设计一个并行化的 kernel。

<FeishuGrid>

<FeishuGridColumn width="0.469502">

<FeishuImage src="/feishu/wiki/AwWTwMUDxiO5APkFt2Jc9hhknsf/4fe2fde86a589a2f311e9e51.png" width="956" height="888" />

</FeishuGridColumn>

<FeishuGridColumn width="0.530498">

<FeishuImage src="/feishu/wiki/AwWTwMUDxiO5APkFt2Jc9hhknsf/e42635b554c395f31b14f0b3.png" width="1464" height="1202" />

</FeishuGridColumn>

</FeishuGrid>
