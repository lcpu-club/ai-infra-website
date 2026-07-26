---
title: "Session 01 — GPU Programming Model"
description: "GPU execution, the CUDA programming model, and tile-level abstractions"
outline: deep
lastUpdated: false
---

<header class="session-banner wiki-page-banner">
  <nav class="wiki-breadcrumb" aria-label="Document path"><a href="/en/wiki/">AI Infra Seminars Wiki</a><span aria-hidden="true">/</span><a href="/en/wiki/VWJPwVFTHifeadkE4phc45hOntg">Topic 1 — Kernel and ML Compilers</a></nav>
  <span class="section-index">Course Materials</span>
  <h1>Session 01 — GPU Programming Model</h1>
</header>

Why can a GPU solve large parallel problems even though an individual GPU
thread is not faster than a CPU thread?

Why does CUDA organize threads into threads, blocks, and grids? What is a warp?

When moving from CUDA to Triton or TileLang, why does the programming model
shift from thinking about one thread to thinking about a tile of data?

- **ML systems on GPUs:** SIMD and SIMT, throughput and latency, and why GPUs
  suit massively parallel workloads
- **CUDA programming model:** host and device, kernel launches, threads, blocks,
  grids, warps, and coordination between threads
- **Triton and TileLang:** program-, block-, and tile-level programming

This session introduces the basic viewpoint used throughout the rest of the
seminar.

## Preparation and references

- [CUDA From Correctness to Performance — lecture notes](https://github.com/interestingLSY/CUDA-From-Correctness-To-Performance-Code/blob/master/lecture.md)
- [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/)
- [CUDA C Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)
- [TileLang Documentation](https://tilelang.com/)
- [Triton Documentation](https://triton-lang.org/main/index.html)
