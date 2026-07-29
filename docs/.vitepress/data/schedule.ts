import scheduleSnapshot from './generated/schedule.json'

export type ScheduleLocale = 'zh' | 'en'
export type TopicKey = 'kernel' | 'comm' | 'serving' | 'rl'
export type CalendarStatus = 'tentative' | 'confirmed' | 'cancelled'
export type ScheduleAccent = TopicKey | 'neutral'

export interface LocalizedText {
  zh: string
  en?: string
}

export interface ScheduleResourceLink {
  label: string
  href: string
}

export interface ScheduleLink extends ScheduleResourceLink {
  type: string
}

export interface ScheduleLocation {
  label: string
  href?: string
}

export interface AssignmentReference {
  id: string
  title: string
  href: string
}

export interface CalendarEvent {
  eventId: string
  type: string
  topic?: TopicKey
  sessionIds?: string[]
  summary: string
  description?: string
  date: string
  endDate: string
  startAt: string
  endAt: string
  allDay: boolean
  timeLabel: string
  timezone: string
  status: CalendarStatus
  speakers?: string[]
  locations: ScheduleLocation[]
  links: ScheduleResourceLink[]
  assignmentIds: string[]
  assignments: AssignmentReference[]
  href?: string
  display: {
    homepage: boolean
    calendar: boolean
    accent: ScheduleAccent
  }
}

export interface AssignmentMoment {
  allDay: boolean
  date: string
  at?: string
  boundaryAt: string
}

export interface CourseAssignment {
  id: string
  title: string
  description?: string
  release?: AssignmentMoment
  due?: AssignmentMoment
  links: ScheduleLink[]
  eventIds: string[]
  href?: string
}

interface RawSpeaker {
  name: LocalizedText
  role?: LocalizedText
  href?: string
}

interface RawLink {
  type: string
  label: LocalizedText
  href: string
}

interface RawResourceLink {
  label: LocalizedText
  href: string
}

interface RawLocation {
  label: LocalizedText
  href?: string
}

interface RawEvent {
  eventId: string
  type: string
  topic?: TopicKey
  sessionIds?: string[]
  title: LocalizedText
  description?: LocalizedText
  date: string
  endDate: string
  startAt: string
  endAt: string
  allDay: boolean
  timeLabel?: string
  timezone: string
  status: CalendarStatus
  speakers?: RawSpeaker[]
  locations: RawLocation[]
  links: RawResourceLink[]
  assignmentIds: string[]
  display: {
    homepage: boolean
    calendar: boolean
    accent: ScheduleAccent
  }
}

interface RawAssignment {
  id: string
  title: LocalizedText
  description?: LocalizedText
  release?: AssignmentMoment
  due?: AssignmentMoment
  links: RawLink[]
  eventIds: string[]
}

interface ScheduleSnapshot {
  version: number
  timezone: string
  siteUrl: string
  events: RawEvent[]
  assignments: RawAssignment[]
}

const snapshot = scheduleSnapshot as ScheduleSnapshot
const rawAssignmentById = new Map(
  snapshot.assignments.map((assignment) => [assignment.id, assignment])
)

export const calendarTimezone = snapshot.timezone
export const scheduleSiteUrl = snapshot.siteUrl
export const scheduleEventCount = snapshot.events.length
export const assignmentCount = snapshot.assignments.length

export function localizedCalendarEvents(
  locale: ScheduleLocale
): CalendarEvent[] {
  return snapshot.events.map((event) => {
    const locations = event.locations.map((location) => ({
      label: localizeText(location.label, locale),
      ...(location.href ? { href: location.href } : {})
    }))
    const links = event.links.map((link) => ({
      label: localizeText(link.label, locale),
      href: link.href
    }))
    const assignments = event.assignmentIds
      .map((id) => rawAssignmentById.get(id))
      .filter((assignment): assignment is RawAssignment => Boolean(assignment))
      .map((assignment) => ({
        id: assignment.id,
        title: localizeText(assignment.title, locale),
        href: `/assignments#assignment-${assignment.id}`
      }))
    return {
      eventId: event.eventId,
      type: event.type,
      ...(event.topic ? { topic: event.topic } : {}),
      ...(event.sessionIds ? { sessionIds: event.sessionIds } : {}),
      summary: localizeText(event.title, locale),
      ...(event.description
        ? { description: localizeText(event.description, locale) }
        : {}),
      date: event.date,
      endDate: event.endDate,
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: event.allDay,
      timeLabel:
        event.allDay
          ? locale === 'en'
            ? 'All day'
            : '全天'
          : event.timeLabel ?? '',
      timezone: event.timezone,
      status: event.status,
      ...(event.speakers?.length
        ? {
            speakers: event.speakers.map((speaker) => {
              const name = localizeText(speaker.name, locale)
              const role = speaker.role
                ? localizeText(speaker.role, locale)
                : ''
              return role
                ? locale === 'en'
                  ? `${name} (${role})`
                  : `${name}（${role}）`
                : name
            })
          }
        : {}),
      locations,
      links,
      assignmentIds: event.assignmentIds,
      assignments,
      ...(links[0] ? { href: links[0].href } : {}),
      display: event.display
    }
  })
}

export function localizedAssignments(
  locale: ScheduleLocale
): CourseAssignment[] {
  return snapshot.assignments.map((assignment) => {
    const links = assignment.links.map((link) =>
      localizeLink(link, locale)
    )
    return {
      id: assignment.id,
      title: localizeText(assignment.title, locale),
      ...(assignment.description
        ? { description: localizeText(assignment.description, locale) }
        : {}),
      ...(assignment.release ? { release: assignment.release } : {}),
      ...(assignment.due ? { due: assignment.due } : {}),
      links,
      eventIds: assignment.eventIds,
      ...(links[0] ? { href: links[0].href } : {})
    }
  })
}

function localizeLink(link: RawLink, locale: ScheduleLocale): ScheduleLink {
  return {
    type: link.type,
    label: localizeText(link.label, locale),
    href: link.href
  }
}

function localizeText(text: LocalizedText, locale: ScheduleLocale) {
  return locale === 'en' ? text.en ?? text.zh : text.zh
}
