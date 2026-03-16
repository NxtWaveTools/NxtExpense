import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { mswServer } from '@/test/msw/server'

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  mswServer.resetHandlers()
  cleanup()
})

afterAll(() => {
  mswServer.close()
})
