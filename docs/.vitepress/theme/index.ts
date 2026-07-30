import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AssignmentBoard from './components/AssignmentBoard.vue'
import FeishuGrid from './components/FeishuGrid.vue'
import FeishuGridColumn from './components/FeishuGridColumn.vue'
import FeishuImage from './components/FeishuImage.vue'
import HomePage from './components/HomePage.vue'
import ScheduleBoard from './components/ScheduleBoard.vue'
import SessionHeader from './components/SessionHeader.vue'
import '@schedule-x/theme-default/dist/index.css'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AssignmentBoard', AssignmentBoard)
    app.component('FeishuGrid', FeishuGrid)
    app.component('FeishuGridColumn', FeishuGridColumn)
    app.component('FeishuImage', FeishuImage)
    app.component('HomePage', HomePage)
    app.component('ScheduleBoard', ScheduleBoard)
    app.component('SessionHeader', SessionHeader)
  }
} satisfies Theme
