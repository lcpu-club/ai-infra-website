import type { Directive } from 'vue'

const VISIBLE_CLASS = 'is-visible'

function applyDelay(el: HTMLElement, delay: unknown) {
  const ms = typeof delay === 'number' && delay > 0 ? delay : 0
  if (ms > 0) el.style.setProperty('--reveal-delay', `${ms}ms`)
}

/**
 * v-reveal — fade-up an element the first time it scrolls into view.
 * Usage: v-reveal or v-reveal="120" (stagger delay in ms).
 * Runs client-side only; elements are fully visible without JS.
 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    applyDelay(el, binding.value)
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal', VISIBLE_CLASS)
      return
    }
    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(VISIBLE_CLASS)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    observer.observe(el)
  }
}
