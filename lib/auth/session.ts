// ============================================================================
// Session Management
// ============================================================================
// Simple JWT-based session management for our custom auth system
// ============================================================================

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const SESSION_COOKIE_NAME = 'gymbo_session'
const SESSION_DURATION = 30 * 24 * 60 * 60 // 30 days in seconds

export interface SessionData {
  trainerId: string
  phone: string
}

// Create a new session
export async function createSession(data: SessionData): Promise<string> {
  const token = jwt.sign(data, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  return token
}

// Get session from cookie
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as SessionData
    return decoded
  } catch (error) {
    return null
  }
}

// Get session from request (for middleware)
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as SessionData
    return decoded
  } catch (error) {
    return null
  }
}

// Delete session
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
