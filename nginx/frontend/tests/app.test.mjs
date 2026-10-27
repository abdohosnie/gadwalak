import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createDocument } from './dom-fixture.mjs'

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const course = { course_name: 'Database Systems', course_code: 'CS301' }
const schedule = {
  student: { id: 2023170461, full_name: 'Example Student', level: '3', department: 'Computer Science' },
  courses: [course],
  schedule: [{ ...course, scheduled_time: '2026-06-10 14:05:00', duration: 120, location: 'Room A12' }],
}
let instance = 0

async function loadApp(t, fetch) {
  const fixture = createDocument(html)
  for (const [name, value] of Object.entries({ ...fixture, fetch })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original)
      else delete globalThis[name]
    })
  }
  await import(`../js/app.js?test=${++instance}`)
  const element = (id) => fixture.document.getElementById(id)
  return { ...fixture, element }
}

test('successful search renders the actual page without the removed note or header', async (t) => {
  const { document, element } = await loadApp(t, async (url) => {
    assert.equal(url, '/api/get/2023170461')
    return new Response(JSON.stringify(schedule))
  })
  assert.equal(element('exam-note'), null)
  assert.equal(element('home-link'), null)
  element('student-id').value = '2023170461'
  await element('search-form').dispatch('submit')

  assert.equal(element('search-error').textContent, '')
  assert.equal(element('results-screen').hidden, false)
  assert.equal(element('search-screen').hidden, true)
  assert.match(element('student-details').textContent, /Example Student/)
  assert.match(element('exam-list').textContent, /2:05 PM/)
  assert.match(element('exam-list').textContent, /120 minutes/)
  assert.match(element('course-list').textContent, /Database Systems.*CS301/)
  assert.equal(document.activeElement, element('student-heading'))

  const calendarRadio = document.querySelector('input[name="exam-view"][value="calendar"]')
  await element('view-controls').dispatch('change', calendarRadio)
  assert.equal(element('calendar-view').hidden, false)
  assert.equal(element('list-view').hidden, true)
  assert.match(element('day-exam-list').textContent, /Room A12/)
  await element('next-month').dispatch('click')
  assert.match(element('month-label').textContent, /July 2026/)
  await element('previous-month').dispatch('click')
  assert.match(element('month-label').textContent, /June 2026/)

  await element('search-again').dispatch('click')
  assert.equal(element('results-screen').hidden, true)
  assert.equal(element('search-screen').hidden, false)
  assert.equal(element('student-details').textContent, '')
  assert.equal(document.activeElement, element('student-id'))
})

test('an empty schedule renders successfully without the removed note', async (t) => {
  const data = { ...schedule, courses: [], schedule: [] }
  const { element } = await loadApp(t, async () => new Response(JSON.stringify(data)))
  element('student-id').value = '2023170461'
  await element('search-form').dispatch('submit')
  assert.equal(element('results-screen').hidden, false)
  assert.equal(element('no-exams').hidden, false)
  assert.equal(element('no-courses').hidden, false)
  assert.equal(element('search-error').textContent, '')
})

test('a failed fetch reports a connection error', async (t) => {
  const { element } = await loadApp(t, async () => { throw new TypeError('Failed to fetch') })
  element('student-id').value = '2023170461'
  await element('search-form').dispatch('submit')
  assert.match(element('search-error').textContent, /Could not connect/)
  assert.equal(element('search-button').disabled, false)
})

test('a rendering TypeError after HTTP 200 is not reported as a connection error', async (t) => {
  const { document, element } = await loadApp(t, async () => new Response(JSON.stringify(schedule)))
  const getElementById = document.getElementById
  document.getElementById = (id) => id === 'course-count' ? null : getElementById(id)
  element('student-id').value = '2023170461'
  await element('search-form').dispatch('submit')
  assert.match(element('search-error').textContent, /schedule loaded, but we could not display it/)
  assert.doesNotMatch(element('search-error').textContent, /Could not connect/)
})
