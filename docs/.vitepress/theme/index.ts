import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AssignmentBoard from './components/AssignmentBoard.vue'
import HomePage from './components/HomePage.vue'
import ScheduleBoard from './components/ScheduleBoard.vue'
import SessionHeader from './components/SessionHeader.vue'
import '@schedule-x/theme-default/dist/index.css'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AssignmentBoard', AssignmentBoard)
    app.component('HomePage', HomePage)
    app.component('ScheduleBoard', ScheduleBoard)
    app.component('SessionHeader', SessionHeader)
  }
} satisfies Theme
