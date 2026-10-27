import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calendarWeeks,
  dateKey,
  formatScheduledTime,
  isValidStudentId,
  makeDate,
  parseScheduledTime,
  sortExams,
  validateScheduleResponse,
} from '../js/schedule.js'

test('Student IDs follow the backend integer range and reject non-digit input', () => {
  for (const id of ['1', '123456', '999999999999', '000001']) {
    assert.equal(isValidStudentId(id), true, id)
  }
  for (const id of ['', '0', '0000', '-1', '1.5', '1e5', '1000000000000', '12/34', '123abc']) {
    assert.equal(isValidStudentId(id), false, id)
  }
})

test('SQLite and ISO dates keep the exam wall-clock day across timezones', () => {
  assert.equal(parseScheduledTime('2026-06-10 09:30:00').key, '2026-06-10')
  assert.equal(parseScheduledTime('2026-06-10T00:30:00+03:00').key, '2026-06-10')
  assert.equal(parseScheduledTime('2026-06-10T23:30:00-03:00').key, '2026-06-10')
  assert.equal(parseScheduledTime('2026-06-10T09:30:00.123Z').hour, '09')
})

test('invalid dates are not silently rolled into a different calendar day', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-06-00', '0000-01-01', '2026-06-10 24:00:00', '2026-06-10T09:60:00', '2026-06-10T09:00:00+24:00', 'To be announced']) {
    assert.equal(parseScheduledTime(date), null, date)
  }
  assert.equal(parseScheduledTime('2028-02-29').key, '2028-02-29')
})

test('readable time labels preserve offsets and unknown strings', () => {
  assert.equal(formatScheduledTime('2026-06-10 09:30:00'), 'Wednesday, 10 June 2026 at 9:30 AM')
  assert.equal(formatScheduledTime('2026-06-10T09:30:00+03:00'), 'Wednesday, 10 June 2026 at 9:30 AM (UTC+03:00)')
  assert.equal(formatScheduledTime('2026-06-10T09:30:00Z'), 'Wednesday, 10 June 2026 at 9:30 AM UTC')
  assert.equal(formatScheduledTime('To be announced'), 'To be announced')
})

test('12-hour times handle midnight, noon, afternoon, and seconds', () => {
  assert.equal(formatScheduledTime('2026-06-10 00:00:00'), 'Wednesday, 10 June 2026 at 12:00 AM')
  assert.equal(formatScheduledTime('2026-06-10 12:00:00'), 'Wednesday, 10 June 2026 at 12:00 PM')
  assert.equal(formatScheduledTime('2026-06-10 14:05:00'), 'Wednesday, 10 June 2026 at 2:05 PM')
  assert.equal(formatScheduledTime('2026-06-10 23:59:30'), 'Wednesday, 10 June 2026 at 11:59:30 PM')
  assert.equal(formatScheduledTime('2026-06-10'), 'Wednesday, 10 June 2026')
})

test('a calendar includes every day once, with correct weekday alignment', () => {
  for (let month = 1; month <= 12; month++) {
    const weeks = calendarWeeks(2028, month)
    const dates = weeks.flat().filter(Boolean)
    assert.ok(weeks.every((week) => week.length === 7))
    assert.equal(dates.length, makeDate(2028, month + 1, 0).getUTCDate())
    assert.equal(new Set(dates.map(dateKey)).size, dates.length)
    assert.equal(weeks[0].findIndex(Boolean), makeDate(2028, month).getUTCDay())
    assert.equal(dateKey(dates[0]), `2028-${String(month).padStart(2, '0')}-01`)
    assert.equal(dates.at(-1).getUTCMonth() + 1, month)
  }
})

test('calendar navigation crosses year boundaries and handles years below 100', () => {
  assert.equal(dateKey(makeDate(2026, 13)), '2027-01-01')
  assert.equal(dateKey(makeDate(2026, 0)), '2025-12-01')
  assert.equal(dateKey(makeDate(1, 1)), '0001-01-01')
  assert.equal(parseScheduledTime('0001-01-01').key, '0001-01-01')
})

test('exam ordering retains same-day exams and puts unknown dates last', () => {
  const source = [
    { course_code: 'TBD', scheduled_time: 'To be announced' },
    { course_code: 'PM', scheduled_time: '2026-06-10 14:00:00' },
    { course_code: 'LATER', scheduled_time: '2026-07-01T08:00:00' },
    { course_code: 'AM', scheduled_time: '2026-06-10T09:00:00' },
    { course_code: 'AM2', scheduled_time: '2026-06-10 09:00:00' },
  ]
  assert.deepEqual(sortExams(source).map((exam) => exam.course_code), ['AM', 'AM2', 'PM', 'LATER', 'TBD'])
  assert.equal(source[0].course_code, 'TBD')
  assert.deepEqual(sortExams([]), [])
})

test('the current backend response is accepted, including empty schedules', () => {
  const course = { course_name: 'Database Systems', course_code: 'CS301' }
  const data = {
    student: { id: 123456, full_name: 'Example Student', level: '', department: 'Computer Science' },
    courses: [course],
    schedule: [{ ...course, scheduled_time: '2026-06-10 09:00:00', duration: 120, location: 'Room A12' }],
  }
  assert.equal(validateScheduleResponse(data), data)
  assert.doesNotThrow(() => validateScheduleResponse({ ...data, courses: [], schedule: [] }))
  assert.throws(() => validateScheduleResponse({ ...data, schedule: [{ ...course, scheduled_time: null }] }))
  assert.throws(() => validateScheduleResponse({ ...data, courses: null }))
  assert.throws(() => validateScheduleResponse(null))
  assert.throws(() => validateScheduleResponse({ detail: 'Not found' }))
})
