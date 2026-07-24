import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomePage from './components/HomePage.vue'
import ScheduleBoard from './components/ScheduleBoard.vue'
import SessionHeader from './components/SessionHeader.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('ScheduleBoard', ScheduleBoard)
    app.component('SessionHeader', SessionHeader)
  }
} satisfies Theme
