import {
  calendarWeeks,
  dateKey,
  formatDate,
  formatScheduledTime,
  isValidStudentId,
  makeDate,
  monthFormatter,
  parseScheduledTime,
  sortExams,
  validateScheduleResponse,
} from './schedule.js'

const element = (id) => document.getElementById(id)
const searchForm = element('search-form')
const studentIdInput = element('student-id')
const searchButton = element('search-button')
const searchError = element('search-error')
const searchStatus = element('search-status')
const searchScreen = element('search-screen')
const resultsScreen = element('results-screen')

let examsByDate = new Map()
let selectedDate = null
let displayedMonth = null
let activeRequest = null

function createElement(tag, text, className) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = String(text)
  if (className) node.className = className
  return node
}

function detail(label, value) {
  const group = createElement('div')
  group.append(createElement('dt', label))
  const description = createElement('dd')
  description.dir = 'auto'
  description.append(value instanceof Node ? value : document.createTextNode(String(value)))
  group.append(description)
  return group
}

function renderExamList(target, exams, headingLevel = 'h3') {
  const items = exams.map((exam) => {
    const item = createElement('li')
    const article = createElement('article')
    const details = createElement('dl', undefined, 'exam-details')
    // Unknown date formats remain visible exactly as supplied by the API.
    const parsedTime = parseScheduledTime(exam.scheduled_time)
    const scheduledTime = createElement(parsedTime ? 'time' : 'span', formatScheduledTime(exam.scheduled_time))
    if (parsedTime) scheduledTime.dateTime = exam.scheduled_time.trim().replace(' ', 'T')
    details.append(
      detail('Course code', exam.course_code),
      detail('Scheduled time', scheduledTime),
      detail('Location', exam.location),
      detail('Duration', `${exam.duration} ${exam.duration === 1 ? 'minute' : 'minutes'}`),
    )
    const heading = createElement(headingLevel, exam.course_name)
    heading.dir = 'auto'
    article.append(heading, details)
    item.append(article)
    return item
  })
  target.replaceChildren(...items)
}

function renderSelectedDay() {
  const exams = examsByDate.get(dateKey(selectedDate)) ?? []
  element('selected-day-heading').textContent = `${formatDate(selectedDate)}: ${exams.length} ${exams.length === 1 ? 'exam' : 'exams'}`
  element('no-day-exams').hidden = exams.length > 0
  renderExamList(element('day-exam-list'), exams, 'h4')

  for (const button of element('calendar-days').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.date === dateKey(selectedDate)))
  }
}

function renderCalendar() {
  const year = displayedMonth.getUTCFullYear()
  const month = displayedMonth.getUTCMonth() + 1
  const monthLabel = monthFormatter.format(displayedMonth)
  element('month-label').textContent = monthLabel
  element('calendar-caption').textContent = `Exam calendar for ${monthLabel}`
  element('previous-month').disabled = year === 1 && month === 1
  element('next-month').disabled = year === 9999 && month === 12

  const rows = calendarWeeks(year, month).map((week) => {
    const row = createElement('tr')
    for (const date of week) {
      const cell = createElement('td')
      if (date) {
        const key = dateKey(date)
        const count = examsByDate.get(key)?.length ?? 0
        const button = createElement('button')
        button.type = 'button'
        button.dataset.date = key
        button.setAttribute('aria-pressed', String(key === dateKey(selectedDate)))
        button.setAttribute('aria-label', `${formatDate(date)}, ${count} ${count === 1 ? 'exam' : 'exams'}`)
        button.append(createElement('span', date.getUTCDate()))
        if (count > 0) {
          button.append(createElement('span', `${count} ${count === 1 ? 'exam' : 'exams'}`, 'calendar-exam-count'))
        }
        button.addEventListener('click', () => {
          selectedDate = date
          renderSelectedDay()
        })
        cell.append(button)
      }
      row.append(cell)
    }
    return row
  })
  element('calendar-days').replaceChildren(...rows)
  renderSelectedDay()
}

function changeMonth(offset) {
  displayedMonth = makeDate(displayedMonth.getUTCFullYear(), displayedMonth.getUTCMonth() + 1 + offset)
  const prefix = dateKey(displayedMonth).slice(0, 7)
  const firstExamDay = [...examsByDate.keys()].find((key) => key.startsWith(prefix))
  selectedDate = firstExamDay ? parseScheduledTime(firstExamDay).date : displayedMonth
  renderCalendar()
}

function setView(view) {
  element('list-view').hidden = view !== 'list'
  element('calendar-view').hidden = view !== 'calendar'
}

function renderResults(data) {
  const { student, courses } = data
  const exams = sortExams(data.schedule)
  element('student-details').replaceChildren(
    detail('Full name', student.full_name),
    detail('Student ID', student.id),
    detail('Level', student.level.at(-1) || 'Not provided'),
    detail('Department', student.department),
  )

  element('exam-count').textContent = `(${exams.length})`
  element('no-exams').hidden = exams.length > 0
  element('view-controls').hidden = exams.length === 0
  renderExamList(element('exam-list'), exams)

  examsByDate = new Map()
  const undatedExams = []
  for (const exam of exams) {
    const parsed = parseScheduledTime(exam.scheduled_time)
    if (parsed) {
      if (!examsByDate.has(parsed.key)) examsByDate.set(parsed.key, [])
      examsByDate.get(parsed.key).push(exam)
    } else {
      undatedExams.push(exam)
    }
  }

  element('calendar-dated').hidden = examsByDate.size === 0
  element('undated-exams').hidden = undatedExams.length === 0
  renderExamList(element('undated-exam-list'), undatedExams, 'h4')
  if (examsByDate.size > 0) {
    selectedDate = parseScheduledTime(examsByDate.keys().next().value).date
    displayedMonth = makeDate(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1)
    renderCalendar()
  }

  document.querySelector('input[name="exam-view"][value="list"]').checked = true
  setView('list')

  element('course-count').textContent = `(${courses.length})`
  element('no-courses').hidden = courses.length > 0
  element('course-list').replaceChildren(...courses.map((course) => {
    const item = createElement('li')
    item.dir = 'auto'
    item.append(createElement('strong', course.course_name), document.createTextNode(` ${course.course_code}`))
    return item
  }))

  searchScreen.hidden = true
  resultsScreen.hidden = false
  document.title = 'Your exam schedule | Gadwalak'
  element('student-heading').focus()
}

function setLoading(loading) {
  searchForm.setAttribute('aria-busy', String(loading))
  studentIdInput.readOnly = loading
  searchButton.disabled = loading
  searchButton.textContent = loading ? 'Searching…' : 'Search'
  searchStatus.textContent = loading ? 'Searching for your schedule…' : ''
}

function showSearchError(message, invalidId = false) {
  searchError.textContent = message
  studentIdInput.setAttribute('aria-invalid', String(invalidId))
  if (invalidId) studentIdInput.focus()
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (activeRequest) return

  const studentId = studentIdInput.value.trim()
  searchError.textContent = ''
  studentIdInput.removeAttribute('aria-invalid')
  if (!isValidStudentId(studentId)) {
    showSearchError('Enter a Student ID from 1 to 999999999999 using digits only.', true)
    return
  }

  const request = new AbortController()
  activeRequest = request
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    request.abort()
  }, 20000)
  setLoading(true)

  try {
    let response
    try {
      response = await fetch(`/api/get/${Number(studentId)}`, {
        headers: { Accept: 'application/json' },
        signal: request.signal,
        cache: 'no-store',
      })
    } catch (error) {
      if (activeRequest !== request) return
      if (timedOut) {
        showSearchError('The search took too long. Please try again.')
      } else if (error.name !== 'AbortError') {
        showSearchError('Could not connect to the schedule service. Check your connection and try again.')
      }
      return
    }

    if (response.status === 404) {
      throw new Error('No student was found for this Student ID. Check the number and try again.')
    }
    if (response.status === 422) {
      showSearchError('This Student ID is not valid. Check the number and try again.', true)
      return
    }
    if (!response.ok) {
      throw new Error('The schedule service is unavailable. Please try again later.')
    }

    let data
    try {
      data = await response.json()
    } catch {
      throw new Error('We could not read your schedule. Please try again later.')
    }
    if (activeRequest === request) renderResults(validateScheduleResponse(data))
  } catch (error) {
    if (activeRequest !== request) return
    if (timedOut) {
      showSearchError('The search took too long. Please try again.')
    } else if (error.name !== 'AbortError') {
      const message = error instanceof TypeError
        ? 'Your schedule loaded, but we could not display it. Please reload and try again.'
        : error.message || 'Something went wrong. Please try again.'
      showSearchError(message)
    }
  } finally {
    clearTimeout(timeout)
    if (activeRequest === request) {
      activeRequest = null
      setLoading(false)
    }
  }
})

studentIdInput.addEventListener('input', () => {
  searchError.textContent = ''
  studentIdInput.removeAttribute('aria-invalid')
})

function showSearch() {
  activeRequest?.abort()
  activeRequest = null
  setLoading(false)
  resultsScreen.hidden = true
  searchScreen.hidden = false
  searchForm.reset()
  searchError.textContent = ''
  studentIdInput.removeAttribute('aria-invalid')
  examsByDate.clear()
  for (const id of ['student-details', 'exam-list', 'calendar-days', 'day-exam-list', 'undated-exam-list', 'course-list']) {
    element(id).replaceChildren()
  }
  document.title = 'Gadwalak | Exam schedules'
  studentIdInput.focus()
}

element('search-again').addEventListener('click', showSearch)
element('previous-month').addEventListener('click', () => changeMonth(-1))
element('next-month').addEventListener('click', () => changeMonth(1))
element('view-controls').addEventListener('change', (event) => {
  if (event.target.matches('input[name="exam-view"]')) setView(event.target.value)
})
