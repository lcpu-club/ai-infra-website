<script setup lang="ts">
import { withBase } from 'vitepress'
import {
  calendarEvents,
  topics
} from '../../data/program'

const formatSteps = [
  {
    number: '01',
    title: '主题分享',
    description: '每场围绕一个系统主题，由专业同学进行系统讲解和分享。'
  },
  {
    number: '02',
    title: '现场讨论',
    description: '分享后开放提问与延伸讨论，串联论文、源码与真实工程经验。'
  },
  {
    number: '03',
    title: "Guest Lecture",
    description: '邀请业界专家进行专题讲座，分享前沿技术与实践经验。'
  },
  {
    number: '04',
    title: '代码实践',
    description: '结合 CUDA、TileLang 与训推框架，提供高质量的作业练习、评测环境与测试实例。'
  },
  {
    number: '05',
    title: '资料开源',
    description: '讲义与资料统一同步开源，持续更新。'
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
      <p
        class="home-chip"
        aria-label="北京大学未名超算队与北京大学学生 Linux 俱乐部"
      >
        <span>
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
          >北京大学未名超算队</a>
        </span>
        <span>
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
          >北京大学学生 Linux 俱乐部</a>
        </span>
      </p>
      <h1>AI Infrastructure Seminars</h1>
      <p class="home-subtitle">大模型如何训更快、跑更好、推更省？</p>
      <p class="home-lead">
        从 Kernel 到编译器、从分布式系统到集合通信、从模型推理到强化学习系统，社团骨干与超算队倾力设计打造课程设计，力求向你揭示工业界大规模模型训练与推理的最前沿！
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

    <section class="home-section home-schedule-section" aria-labelledby="home-schedule-title">
      <div class="home-section-heading home-section-heading-row">
        <div>
          <h2 id="home-schedule-title">近期安排</h2>
        </div>
        <a class="home-calendar-link" :href="withBase('/schedule')">打开课程日历 →</a>
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
        <span>敬请期待</span>
      </div>
    </section>

    <section class="home-section" aria-labelledby="home-topics-title">
      <div class="home-section-heading">
        <h2 id="home-topics-title">四个 Topics，四个 Level</h2>
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
  </main>

  <footer class="home-support-footer" aria-label="支持单位与版权信息">
    <div class="home-support-inner">
      <section class="home-support-panel" aria-labelledby="home-support-title">
        <h2 id="home-support-title" class="home-support-heading">
          赞助商与合作伙伴
        </h2>

        <div class="home-support-logo-grid">
          <div
            v-for="sponsor in sponsors"
            :key="sponsor.name"
            class="home-support-logo-card"
          >
            <img
              :src="withBase(sponsor.logo)"
              :alt="`${sponsor.name}标志`"
              loading="lazy"
            >
          </div>
          <a
            v-for="partner in partners"
            :key="partner.name"
            class="home-support-logo-card"
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

      <section class="home-credits-panel" aria-labelledby="home-credits-title">
        <h2 id="home-credits-title" class="home-support-heading">联合发起</h2>

        <div class="home-credits-logos">
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
            aria-label="北京大学学生 Linux 俱乐部官网"
          >
            <img
              class="home-credit-logo home-credit-logo-lcpu"
              :src="withBase('/lcpu.svg')"
              alt="北京大学学生 Linux 俱乐部标志"
            >
          </a>
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
            aria-label="北京大学未名超算队官网"
          >
            <img
              class="home-credit-logo home-credit-logo-wmhpc"
              :src="withBase('/wmhpc.png')"
              alt="北京大学未名超算队标志"
            >
          </a>
          <img
            class="home-credit-logo home-credit-logo-linuxproj"
            :src="withBase('/linuxproj.svg')"
            alt="Linux 中国开源社区标志"
          >
        </div>

        <p class="home-credits-copy">
          © 2026
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
          >北京大学学生 Linux 俱乐部</a>
          ·
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
          >北京大学未名超算队</a>
          · Licensed under
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="license noreferrer"
          >CC BY-NC-SA 4.0</a>
        </p>
      </section>
    </div>
  </footer>
</template>
