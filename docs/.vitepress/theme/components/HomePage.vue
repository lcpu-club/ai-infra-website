<script setup lang="ts">
import { withBase } from 'vitepress'
import { topics } from '../../data/program'
import ScheduleTable from './ScheduleTable.vue'
</script>

<template>
  <main class="course-site">
    <header class="course-hero">
      <p class="hero-kicker">Weiming HPC Training Camp × LCPU</p>
      <h1>AI Infrastructure Seminars</h1>
      <p class="hero-title-cn">从 Kernel 到大模型系统</p>
      <p class="hero-lead">
        北京大学未名超算队与北京大学学生 Linux 俱乐部共同组织的暑期课程。
        从 GPU 编程、分布式通信到模型推理与强化学习系统，一起理解一次 API 调用背后的计算。
      </p>
      <div class="hero-actions">
        <a :href="withBase('/calendar')">查看活动日历 <span>→</span></a>
        <a :href="withBase('/sessions/01')">阅读 Session 01 <span>→</span></a>
      </div>

      <dl class="hero-facts">
        <div><dt>日期</dt><dd>07.23 — 09.06</dd></div>
        <div><dt>频率</dt><dd>每周两次 · 1–2 小时</dd></div>
        <div><dt>地点</dt><dd>腾讯会议 · 燕园大厦 308</dd></div>
      </dl>
    </header>

    <section class="site-section about-section" id="about">
      <div class="section-heading">
        <span>ABOUT</span>
        <h2>模型背后的系统，究竟怎样运作？</h2>
      </div>

      <div class="about-layout">
        <div class="about-copy">
          <p class="about-lead">
            模型一张卡放不下怎么办？几千张 GPU
            一起计算时怎样通信与同步？同一个 Attention 为什么换一个 Kernel
            就能快很多？大量长短不一的请求进入时，系统应该先算谁？
          </p>
          <p>
            这些问题都属于 AI Infra。我们不追求在七周内覆盖所有内容，而是希望建立一组能够持续使用的系统直觉：写出第一个
            Kernel、看懂一次集合通信、跑起一个推理框架，并找到值得继续研究的问题。
          </p>
          <p>
            听众不需要每次发言，讲者也不需要一开始就什么都会。你可以先听、再动手，最后认领一个小问题共同讨论。
          </p>
        </div>

        <aside class="course-info">
          <h3>Course Information</h3>
          <dl>
            <div><dt>Period</dt><dd>2026.07.23 — 09.06</dd></div>
            <div><dt>Format</dt><dd>预习、分享、讨论与实践</dd></div>
            <div><dt>Language</dt><dd>中文分享，英文技术资料</dd></div>
            <div><dt>Organizers</dt><dd>未名超算队 × LCPU</dd></div>
          </dl>
        </aside>
      </div>
    </section>

    <section class="site-section topics-section" id="topics">
      <div class="section-heading section-heading-row">
        <div>
          <span>TOPICS</span>
          <h2>四个主题，一条系统路径</h2>
        </div>
        <p>
          从单卡上的 Kernel 出发，沿着通信与服务系统向上，最后进入训练、推理和环境同时运行的分布式 RL 系统。
        </p>
      </div>

      <div class="topic-list">
        <article
          v-for="topic in topics"
          :key="topic.key"
          class="topic-row"
        >
          <span class="topic-row-index">{{ topic.number }}</span>
          <div class="topic-row-title">
            <h3>{{ topic.title }}</h3>
          </div>
          <div class="topic-row-copy">
            <p>{{ topic.description }}</p>
            <p class="topic-keywords">{{ topic.tags.join(' · ') }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="site-section format-section">
      <div class="section-heading">
        <span>FORMAT</span>
        <h2>每次活动如何进行</h2>
      </div>
      <ol class="format-steps">
        <li>
          <span>01</span>
          <div><strong>课前预习</strong><p>提前发放阅读材料与问题。</p></div>
        </li>
        <li>
          <span>02</span>
          <div><strong>主题分享</strong><p>数次 20–40 分钟的短分享。</p></div>
        </li>
        <li>
          <span>03</span>
          <div><strong>互动讨论</strong><p>充分提问、争论和现场补充。</p></div>
        </li>
        <li>
          <span>04</span>
          <div><strong>实践评测</strong><p>配套讲义、算力、测试与性能指标。</p></div>
        </li>
      </ol>
    </section>

    <section class="site-section schedule-section" id="schedule">
      <div class="section-heading section-heading-row">
        <div>
          <span>SCHEDULE</span>
          <h2>活动日历</h2>
        </div>
        <p>
          以下内容直接来自 AI Infra 共享飞书日历，时间、地点、说明与活动状态会自动更新。
        </p>
      </div>
      <ScheduleTable compact :limit="4" />
      <p class="schedule-more-link">
        <a :href="withBase('/calendar')">查看完整活动日历 →</a>
      </p>
    </section>

    <section class="join-section" id="registration">
      <div>
        <span>JOIN US</span>
        <h2>这个暑假，一起把系统跑起来。</h2>
        <p>报名问卷、活动群二维码和腾讯会议入口将在确认后更新。</p>
      </div>
      <a :href="withBase('/sessions/01')">先阅读课程资料 <span>→</span></a>
    </section>

    <section class="partners-section">
      <div>
        <span>HOSTED BY</span>
        <strong>北京大学未名超算队</strong>
        <strong>北京大学学生 Linux 俱乐部</strong>
      </div>
      <div>
        <span>SPECIAL THANKS</span>
        <strong>腾讯</strong>
        <strong>宽德投资 · Will</strong>
      </div>
    </section>
  </main>
</template>
