const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function isValidStudentId(value) {
  return /^[0-9]{1,12}$/.test(value) && Number(value) > 0
}

export function makeDate(year, month, day = 1) {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}

export function dateKey(date) {
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

// Keep the supplied wall-clock date and time. The API has no timezone contract.
export function parseScheduledTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(value.trim())
  if (!match) return null

  const [, year, month, day, hour, minute, second, zone] = match
  const date = makeDate(Number(year), Number(month), Number(day))
  const key = `${year}-${month}-${day}`
  if (dateKey(date) !== key || Number(year) < 1) return null
  if (hour !== undefined && (Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59)) return null
  if (zone && zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)) return null

  return { date, key, hour, minute, second, zone }
}

export function formatDate(date) {
  return dateFormatter.format(date)
}

export function formatScheduledTime(value) {
  const parsed = parseScheduledTime(value)
  if (!parsed) return value

  let label = formatDate(parsed.date)
  if (parsed.hour !== undefined) {
    const hour = Number(parsed.hour)
    label += ` at ${hour % 12 || 12}:${parsed.minute}`
    if (parsed.second && parsed.second !== '00') label += `:${parsed.second}`
    label += hour >= 12 ? ' PM' : ' AM'
    if (parsed.zone) label += parsed.zone === 'Z' ? ' UTC' : ` (UTC${parsed.zone})`
  }
  return label
}

export function calendarWeeks(year, month) {
  const firstDay = makeDate(year, month)
  const daysInMonth = makeDate(year, month + 1, 0).getUTCDate()
  const cells = Array(firstDay.getUTCDay()).fill(null)

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(makeDate(year, month, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7))
}

export function sortExams(exams) {
  return [...exams].sort((left, right) => {
    const a = parseScheduledTime(left.scheduled_time)
    const b = parseScheduledTime(right.scheduled_time)
    if (!a || !b) return Number(Boolean(b)) - Number(Boolean(a))
    return `${a.key} ${a.hour ?? '00'}:${a.minute ?? '00'}:${a.second ?? '00'}`
      .localeCompare(`${b.key} ${b.hour ?? '00'}:${b.minute ?? '00'}:${b.second ?? '00'}`)
  })
}

export function validateScheduleResponse(data) {
  const isText = (value) => typeof value === 'string' && value.trim().length > 0
  const isCourse = (course) => course && isText(course.course_name) && isText(course.course_code)

  if (!data || !data.student || !Number.isSafeInteger(data.student.id)
    || !isText(data.student.full_name) || typeof data.student.level !== 'string'
    || !isText(data.student.department) || !Array.isArray(data.courses)
    || !data.courses.every(isCourse) || !Array.isArray(data.schedule)
    || !data.schedule.every((exam) => isCourse(exam) && isText(exam.scheduled_time)
      && Number.isInteger(exam.duration) && isText(exam.location))) {
    throw new Error('We could not read your schedule. Please try again later.')
  }

  return data
}
