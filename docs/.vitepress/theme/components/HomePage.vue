<script setup lang="ts">
import { withBase } from 'vitepress'
import {
  calendarEvents,
  sessions,
  topics
} from '../../data/program'

const facts = [
  { label: '课程场次', value: `${sessions.length} 场系列研讨` },
  { label: '主题方向', value: `${topics.length} 大主题方向` },
  { label: '活动时间', value: '2026 暑期' }
]

const formatSteps = [
  {
    number: '01',
    title: '主题分享',
    description: '每场围绕一个系统主题，由队内同学系统讲解核心原理与工程取舍。'
  },
  {
    number: '02',
    title: '现场讨论',
    description: '分享后开放提问与延伸讨论，串联论文、源码与真实工程经验。'
  },
  {
    number: '03',
    title: '代码实践',
    description: '结合 CUDA、Triton 与推理框架，提供可复现的动手环节与示例。'
  },
  {
    number: '04',
    title: '讲义沉淀',
    description: '讲义与资料统一同步到课程 Wiki，持续更新、长期可查。'
  }
]

const sponsors = [
  {
    name: '腾讯',
    logo: '/sponsors/tencent.png',
    description:
      '腾讯成立于1998年，总部位于中国深圳。公司一直秉承科技向善的宗旨。我们的通信和社交服务连接全球逾10亿人，帮助他们与亲友联系，畅享便捷的出行、支付和娱乐生活。腾讯发行多款风靡全球的电子游戏及其他优质数字内容，为全球用户带来丰富的互动娱乐体验。腾讯还提供云计算、营销、金融科技等一系列企业服务，支持合作伙伴实现数字化转型，促进业务发展。'
  },
  {
    name: '宽德投资',
    logo: '/sponsors/wizard-quant.jpg',
    description:
      '宽德投资是一家国内领先、业务全面的量化对冲基金。基于先进高效的研究和交易构架，以及完善的资产管理系统，宽德投资在国内期货、股票、期权等主流市场具有良好的盈利能力。宽德智能学习实验室（Will）是宽德投资独立孵化的创业型实验室，致力于实现超级科技助手（ASI for Sci-Tech）。Will 将汇聚顶尖 AI 人才，专注于研发通用性超级科技助手，追求技术复利与持续性领先。'
  }
]

const partners = [
  {
    name: 'vLLM',
    logo: '/partners/vllm.svg',
    href: 'https://vllm.ai/'
  }
]

interface SchedulePreviewItem {
  key: string
  date: string
  year: string
  dateLabel: string
  title: string
  href?: string
  label: string
}

function previewDate(date: string) {
  const [year, month, day] = date.split('-')
  return {
    year,
    dateLabel: `${Number(month)}.${day}`
  }
}

const schedulePreview: SchedulePreviewItem[] = calendarEvents
  .filter((event) => event.status !== 'cancelled')
  .map((event) => ({
    key: `event-${event.eventId}`,
    date: event.date,
    ...previewDate(event.date),
    title: event.summary,
    href: event.href,
    label: '日历活动'
  }))
  .sort((left, right) => left.date.localeCompare(right.date))
  .slice(0, 5)

function scheduleHref(href?: string) {
  if (!href) return withBase('/schedule')
  if (/^https?:\/\//.test(href)) return href
  return withBase(href)
}
</script>

<template>
  <main class="home-shell">
    <header class="home-hero">
      <p class="home-chip">北京大学学生 Linux 俱乐部 · 未名超算</p>
      <h1>AI Infrastructure Seminars</h1>
      <p class="home-subtitle">从 GPU Kernel 到分布式训推系统的系列研讨</p>
      <p class="home-lead">
        面向对 AI 系统底层感兴趣的同学，沿着 Kernel 与编译器、分布式并行与通信、
        LLM 推理，以及分布式强化学习系统四条主线，构建一套可动手、可复现的知识路径。
      </p>
      <div class="home-actions">
        <a class="home-button home-button-primary" :href="withBase('/schedule')">
          查看课程日历
        </a>
        <a class="home-button home-button-secondary" :href="withBase('/wiki/')">
          浏览课程资料
        </a>
      </div>
    </header>

    <section class="home-facts" aria-label="课程概览">
      <article v-for="fact in facts" :key="fact.label" class="home-fact-card">
        <p>{{ fact.label }}</p>
        <strong>{{ fact.value }}</strong>
      </article>
    </section>

    <section class="home-section" aria-labelledby="home-topics-title">
      <div class="home-section-heading">
        <p class="home-chip">主题方向</p>
        <h2 id="home-topics-title">四条主线，一套系统视角</h2>
      </div>

      <div class="home-topic-list">
        <article
          v-for="topic in topics"
          :key="topic.key"
          class="home-topic-card"
          :class="`home-topic-${topic.key}`"
        >
          <span class="home-topic-number">{{ topic.number }}</span>
          <div class="home-topic-title">
            <h3>{{ topic.title }}</h3>
            <p>{{ topic.shortTitle }}</p>
          </div>
          <div class="home-topic-copy">
            <p>{{ topic.description }}</p>
            <ul class="home-tag-list" :aria-label="`${topic.title} 关键词`">
              <li v-for="tag in topic.tags" :key="tag">{{ tag }}</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <section class="home-section" aria-labelledby="home-format-title">
      <div class="home-section-heading">
        <p class="home-chip">活动形式</p>
        <h2 id="home-format-title">如何进行</h2>
      </div>

      <ol class="home-format-grid">
        <li v-for="step in formatSteps" :key="step.number" class="home-format-card">
          <span>{{ step.number }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
    </section>

    <section class="home-section home-schedule-section" aria-labelledby="home-schedule-title">
      <div class="home-section-heading home-section-heading-row">
        <div>
          <p class="home-chip">课程安排</p>
          <h2 id="home-schedule-title">近期安排</h2>
        </div>
        <a class="home-calendar-link" :href="withBase('/schedule')">打开完整日历 →</a>
      </div>

      <div v-if="schedulePreview.length" class="home-schedule-list">
        <a
          v-for="item in schedulePreview"
          :key="item.key"
          class="home-schedule-card"
          :href="scheduleHref(item.href)"
        >
          <time :datetime="item.date">
            <strong>{{ item.dateLabel }}</strong>
            <span>{{ item.year }} 年</span>
          </time>
          <div>
            <span class="home-schedule-kind">{{ item.label }}</span>
            <h3>{{ item.title }}</h3>
          </div>
          <span class="home-schedule-arrow" aria-hidden="true">→</span>
        </a>
      </div>
      <div v-else class="home-schedule-empty">
        <strong>近期暂无公开安排</strong>
        <span>飞书日历新增活动后会自动显示在这里。</span>
      </div>
    </section>

    <section class="home-section home-sponsor-section" aria-labelledby="home-sponsor-title">
      <div class="home-section-heading">
        <p class="home-chip">赞助支持</p>
        <h2 id="home-sponsor-title">感谢赞助商支持</h2>
      </div>

      <div class="home-sponsor-grid">
        <article
          v-for="sponsor in sponsors"
          :key="sponsor.name"
          class="home-sponsor-card"
        >
          <div class="home-sponsor-logo">
            <img
              :src="withBase(sponsor.logo)"
              :alt="`${sponsor.name}标志`"
              loading="lazy"
            >
          </div>
          <p>{{ sponsor.description }}</p>
        </article>
      </div>
    </section>

    <section class="home-section home-partner-section" aria-labelledby="home-partner-title">
      <div class="home-section-heading">
        <p class="home-chip">合作支持</p>
        <h2 id="home-partner-title">合作伙伴</h2>
      </div>

      <div class="home-partner-list">
        <a
          v-for="partner in partners"
          :key="partner.name"
          class="home-partner-card"
          :href="partner.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`访问 ${partner.name} 官网`"
        >
          <img
            :src="withBase(partner.logo)"
            :alt="`${partner.name}标志`"
            loading="lazy"
          >
        </a>
      </div>
    </section>
  </main>
</template>
