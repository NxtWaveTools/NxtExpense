import Link from 'next/link'

import { getCurrentUser } from '@/features/auth/queries'
import {
  getEmployeeByEmail,
  hasApproverAssignments,
} from '@/features/employees/queries'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AppNavLinks } from '@/components/ui/app-nav-links'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function AppHeader() {
  const user = await getCurrentUser()
  if (!user?.email) return null

  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email)
  if (!employee) return null

  const isFinance = employee.designation === 'Finance'
  const canViewClaims =
    employee.designation !== 'Finance' && employee.designation !== 'Admin'
  const canViewFinance = isFinance
  const canViewApprovals = await hasApproverAssignments(
    supabase,
    employee.employee_email
  )

  type NavLink = { href: string; label: string }
  const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(canViewClaims ? [{ href: '/claims', label: 'My Claims' }] : []),
    ...(canViewApprovals ? [{ href: '/approvals', label: 'Approvals' }] : []),
    ...(canViewFinance ? [{ href: '/finance', label: 'Finance' }] : []),
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/50 hover:text-foreground/80 transition-colors"
          >
            NxtExpense
          </Link>
          <div className="hidden sm:block w-px h-5 bg-border" />
          <div className="hidden sm:block">
            <AppNavLinks links={navLinks} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-right text-sm sm:block mr-1">
            <p className="font-medium leading-tight text-foreground">
              {employee.employee_name}
            </p>
            <p className="text-xs text-foreground/55 leading-tight">
              {employee.designation}
            </p>
          </div>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Mobile nav — shown below the main header row */}
      <div className="sm:hidden border-t border-border px-4 py-2">
        <AppNavLinks links={navLinks} />
      </div>
    </header>
  )
}
