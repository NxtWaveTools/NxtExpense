const DDMMYYYY_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/

export function parseDateDDMMYYYY(raw: string): Date {
  const match = DDMMYYYY_REGEX.exec(raw.trim())
  if (!match) {
    throw new Error('Date must be in DD/MM/YYYY format.')
  }

  const [, dayString, monthString, yearString] = match
  const day = Number(dayString)
  const month = Number(monthString)
  const year = Number(yearString)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('Invalid calendar date.')
  }

  return parsed
}

function getUTCDateParts(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value.')
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
  }
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDate(value: Date | string): string {
  const parts = getUTCDateParts(value)
  return `${padTwo(parts.day)}/${padTwo(parts.month)}/${parts.year}`
}

export function formatDatetime(value: Date | string): string {
  const parts = getUTCDateParts(value)
  return `${padTwo(parts.day)}/${padTwo(parts.month)}/${parts.year} ${padTwo(parts.hours)}:${padTwo(parts.minutes)}`
}

export function toISODate(value: Date): string {
  const parts = getUTCDateParts(value)
  return `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`
}

export function isValidClaimDate(value: Date): boolean {
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  )
  const inputUtc = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  )

  return inputUtc.getTime() <= todayUtc.getTime()
}
