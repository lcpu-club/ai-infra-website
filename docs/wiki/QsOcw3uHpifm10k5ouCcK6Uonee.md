---
title: "Session 3  Tensor Core"
description: "Session 3  Tensor Core · AI Infra Wiki"
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="文档路径"><a href="/wiki/">AI Infra Wiki</a><span aria-hidden="true">/</span><a href="/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 - Kernel and ML Compilers</a></nav>
  <h1>Session 3  Tensor Core</h1>
  <div class="session-banner-meta wiki-page-banner-meta"><span class="session-banner-meta-item is-presenter"><b>主讲：</b>孙远航</span></div>
</header>

## 课前阅读

- https://docs.nvidia.com/cuda/parallel-thread-execution/#warp-level-matrix-instructions-mma 只需要看m16n8k16 那一节，重点是 A 和 B 的 fragment 布局
- https://docs.nvidia.com/cuda/cuda-c-programming-guide/#shared-memory 复习 bank 的划分和 conflict 的成因
- DeepSeek-V3 Technical Report，只读 FP8 训练小节
