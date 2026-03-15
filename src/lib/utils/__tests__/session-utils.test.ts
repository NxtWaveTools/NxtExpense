import { describe, expect, it } from 'vitest'
import { NextResponse } from 'next/server'

import { copyResponseCookies, sanitizeRedirectPath } from '../session-utils'

describe('copyResponseCookies', () => {
  it('copies all cookies from source to destination response', () => {
    const source = NextResponse.next()
    source.cookies.set('session', 'abc123')
    source.cookies.set('refresh', 'refresh-token')

    const destination = NextResponse.next()
    const result = copyResponseCookies(source, destination)

    expect(result.cookies.get('session')?.value).toBe('abc123')
    expect(result.cookies.get('refresh')?.value).toBe('refresh-token')
  })
})

describe('sanitizeRedirectPath', () => {
  describe('safe paths — allowed through', () => {
    it('allows a simple root path', () => {
      expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
    })

    it('allows a nested path', () => {
      expect(sanitizeRedirectPath('/expenses/new')).toBe('/expenses/new')
    })

    it('allows a path with query string', () => {
      expect(sanitizeRedirectPath('/login?error=test')).toBe(
        '/login?error=test'
      )
    })

    it('allows a single slash', () => {
      expect(sanitizeRedirectPath('/')).toBe('/')
    })
  })

  describe('open-redirect attacks — blocked and replaced with fallback', () => {
    it('blocks an absolute URL (http protocol)', () => {
      expect(sanitizeRedirectPath('http://evil.com/steal')).toBe('/dashboard')
    })

    it('blocks an absolute URL (https protocol)', () => {
      expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
    })

    it('blocks a protocol-relative URL', () => {
      expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
    })

    it('blocks a relative path without leading slash', () => {
      expect(sanitizeRedirectPath('evil.com')).toBe('/dashboard')
    })
  })

  describe('edge cases', () => {
    it('returns fallback for null', () => {
      expect(sanitizeRedirectPath(null)).toBe('/dashboard')
    })

    it('returns fallback for undefined', () => {
      expect(sanitizeRedirectPath(undefined)).toBe('/dashboard')
    })

    it('returns fallback for empty string', () => {
      expect(sanitizeRedirectPath('')).toBe('/dashboard')
    })

    it('respects a custom fallback path when provided', () => {
      expect(sanitizeRedirectPath('evil.com', '/login')).toBe('/login')
    })

    it('uses custom fallback for null with custom fallback', () => {
      expect(sanitizeRedirectPath(null, '/home')).toBe('/home')
    })
  })
})
