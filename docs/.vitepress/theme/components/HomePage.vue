<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { topics } from '../../data/program'
import { localizedCalendarEvents } from '../../data/schedule'
import {
  localizedTopics,
  useSiteLocale
} from '../../data/site-i18n'

const sponsors = [
  {
    name: { zh: '腾讯', en: 'Tencent' },
    logo: '/sponsors/tencent.png'
  },
  {
    name: { zh: '宽德投资', en: 'Wizard Quant' },
    logo: '/sponsors/wizard-quant.jpg'
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

const { locale, copy, href } = useSiteLocale()
const home = computed(() => copy.value.home)
const formatSteps = computed(() =>
  copy.value.formatSteps.map(([number, title, description]) => ({
    number,
    title,
    description
  }))
)
const displayedTopics = computed(() => localizedTopics(topics, locale.value))

function previewDate(date: string) {
  const [year, month, day] = date.split('-')
  return {
    year,
    dateLabel: `${Number(month)}.${day}`
  }
}

function previewEventLabel(type: string) {
  return type === 'workshop'
    ? copy.value.schedule.eventTypes.workshop
    : home.value.calendarEvent
}

const schedulePreview = computed<SchedulePreviewItem[]>(() =>
  localizedCalendarEvents(locale.value)
    .filter((event) => event.status !== 'cancelled')
    .filter((event) => event.display.homepage)
    .map((event) => ({
      key: `event-${event.eventId}`,
      date: event.date,
      ...previewDate(event.date),
      title: event.summary,
      href: event.href,
      label: previewEventLabel(event.type)
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5)
)

function scheduleHref(href?: string) {
  if (!href) return hrefFor('/schedule')
  if (/^https?:\/\//.test(href)) return href
  return hrefFor(href)
}

const hrefFor = href
</script>

<template>
  <main class="home-shell">
    <header class="home-hero">
      <p
        class="home-chip"
        :aria-label="home.organizationsAria"
      >
        <span>
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
          >{{ home.wmhpc }}</a>
        </span>
        <span>
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
          >{{ home.lcpu }}</a>
        </span>
      </p>
      <h1>AI Infrastructure Seminars</h1>
      <p class="home-subtitle">{{ home.subtitle }}</p>
      <p class="home-lead">{{ home.lead }}</p>
      <div class="home-actions">
        <a class="home-button home-button-primary" :href="hrefFor('/schedule')">
          {{ home.scheduleButton }}
        </a>
        <a class="home-button home-button-secondary" :href="hrefFor('/wiki/')">
          {{ home.materialsButton }}
        </a>
        <a
          class="home-button home-button-secondary"
          href="https://lcpu-club.feishu.cn/share/base/form/shrcn8p79S5hUphdZICTHgOafiu"
          target="_blank"
          rel="noreferrer"
        >
          {{ home.registrationButton }}
        </a>
      </div>
    </header>

    <section class="home-section home-schedule-section" aria-labelledby="home-schedule-title">
      <div class="home-section-heading home-section-heading-row">
        <div>
          <h2 id="home-schedule-title">{{ home.upcoming }}</h2>
        </div>
        <a class="home-calendar-link" :href="hrefFor('/schedule')">{{ home.openCalendar }}</a>
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
            <span>{{ item.year }}{{ home.yearSuffix }}</span>
          </time>
          <div>
            <span class="home-schedule-kind">{{ item.label }}</span>
            <h3>{{ item.title }}</h3>
          </div>
          <span class="home-schedule-arrow" aria-hidden="true">→</span>
        </a>
      </div>
      <div v-else class="home-schedule-empty">
        <strong>{{ home.noUpcoming }}</strong>
        <span>{{ home.stayTuned }}</span>
      </div>
    </section>

    <section class="home-section" aria-labelledby="home-topics-title">
      <div class="home-section-heading">
        <h2 id="home-topics-title">{{ home.topicsTitle }}</h2>
      </div>

      <div class="home-topic-list">
        <article
          v-for="topic in displayedTopics"
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
            <ul class="home-tag-list" :aria-label="`${topic.title} ${home.keywords}`">
              <li v-for="tag in topic.tags" :key="tag">{{ tag }}</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <section class="home-section" aria-labelledby="home-format-title">
      <div class="home-section-heading">
        <h2 id="home-format-title">{{ home.formatTitle }}</h2>
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

  <footer class="home-support-footer" :aria-label="home.supportAria">
    <div class="home-support-inner">
      <section
        class="home-support-panel"
        aria-labelledby="home-sponsors-title home-partners-title"
      >
        <div class="home-support-group">
          <h2 id="home-sponsors-title" class="home-support-heading">
            {{ home.sponsorsTitle }}
          </h2>

          <div class="home-support-logo-grid home-support-logo-grid-sponsors">
            <div
              v-for="sponsor in sponsors"
              :key="sponsor.name.zh"
              class="home-support-logo-card"
            >
              <img
                :src="withBase(sponsor.logo)"
                :alt="`${sponsor.name[locale]}${home.logoSuffix}`"
                loading="lazy"
              >
            </div>
          </div>
        </div>

        <div class="home-support-group">
          <h2 id="home-partners-title" class="home-support-heading">
            {{ home.partnersTitle }}
          </h2>

          <div class="home-support-logo-grid home-support-logo-grid-partners">
            <a
              v-for="partner in partners"
              :key="partner.name"
              class="home-support-logo-card"
              :href="partner.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${home.visitWebsite}: ${partner.name}`"
            >
              <img
                :src="withBase(partner.logo)"
                :alt="`${partner.name}${home.logoSuffix}`"
                loading="lazy"
              >
            </a>
          </div>
        </div>
      </section>

      <section class="home-credits-panel" aria-labelledby="home-credits-title">
        <h2 id="home-credits-title" class="home-support-heading">{{ home.coOrganizers }}</h2>

        <div class="home-credits-logos">
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
            :aria-label="`${home.lcpu} ${home.visitWebsite}`"
          >
            <img
              class="home-credit-logo home-credit-logo-lcpu"
              :src="withBase('/lcpu.svg')"
              :alt="`${home.lcpu}${home.logoSuffix}`"
            >
          </a>
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
            :aria-label="`${home.wmhpc} ${home.visitWebsite}`"
          >
            <img
              class="home-credit-logo home-credit-logo-wmhpc"
              :src="withBase('/wmhpc.png')"
              :alt="`${home.wmhpc}${home.logoSuffix}`"
            >
          </a>
          <img
            class="home-credit-logo home-credit-logo-linuxproj"
            :src="withBase('/linuxproj.svg')"
            :alt="`Linux.cn${home.logoSuffix}`"
          >
        </div>

        <p class="home-credits-copy">
          © 2026
          <a
            href="https://lcpu.dev"
            target="_blank"
            rel="noreferrer"
          >{{ home.lcpu }}</a>
          ·
          <a
            href="https://hpc.pku.edu.cn/pkusc/zh-cn/"
            target="_blank"
            rel="noreferrer"
          >{{ home.wmhpc }}</a>
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
