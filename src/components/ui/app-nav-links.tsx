'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavLink = {
  href: string
  label: string
}

type AppNavLinksProps = {
  links: NavLink[]
}

export function AppNavLinks({ links }: AppNavLinksProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-0.5">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'))

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-foreground/10 text-foreground'
                : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
