'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard, FileScan, Activity, LogOut, LogIn, ShieldCheck,
  BookOpen, FlaskConical, Swords, Scale, Key, Bell, Award, Menu, X, ChevronDown, BarChart2, GitBranch
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { DevHubModal } from '@/components/DevHubModal'
import { Logo } from '@/components/Logo'

export function Nav() {
  const pathname = usePathname()
  const { user, logOut, loading, setShowAuthModal } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDevHub, setShowDevHub] = useState(false)

  const navGroups = [
    { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    {
      label: 'Scans', icon: FileScan,
      items: [
        { href: '/audit', label: 'Run Audit', icon: FileScan },
        { href: '/preflight', label: 'Pre-Flight', icon: FlaskConical },
      ]
    },
    {
      label: 'Monitoring', icon: Activity,
      items: [
        { href: '/monitor', label: 'Live Monitor', icon: Activity },
        { href: '/sandbox', label: 'Sandbox', icon: Swords },
        { href: '/firewall', label: 'Fairness Firewall', icon: ShieldCheck },
      ]
    },
    {
      label: 'Benchmarks', icon: BookOpen,
      items: [
        { href: '/benchmark-lab', label: 'Benchmark Lab', icon: FlaskConical },
        { href: '/fairness-index', label: 'Fairness Index', icon: BarChart2 },
      ]
    },
    {
      label: 'Governance', icon: ShieldCheck,
      items: [
        { href: '/constitution', label: 'Constitution', icon: Scale },
        { href: '/compliance', label: 'Compliance Reports', icon: ShieldCheck },
        { href: '/cicd', label: 'CI/CD Gate', icon: GitBranch },
      ]
    },
    { label: 'Guide', icon: BookOpen, href: '/guide' },
    {
      label: 'Settings', icon: Key,
      items: [
        { href: '/settings/integrations', label: 'Webhook Alerts', icon: Bell },
        { href: '/settings/api-keys', label: 'API Keys', icon: Key },
        { href: '/badge', label: 'Transparency Badge', icon: Award },
      ]
    }
  ]

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  return (
    <>
      <AuthModal />
      {showDevHub && <DevHubModal onClose={() => setShowDevHub(false)} />}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 800, textDecoration: 'none', color: 'var(--navy)' }}>
            <Logo size={36} />
            FairSight
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links-container">
            {navGroups.map(grp => {
              const Icon = grp.icon
              if (grp.href) {
                const active = pathname?.startsWith(grp.href)
                return (
                  <Link
                    key={grp.label}
                    href={grp.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={() => setActiveDropdown(null)}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    {grp.label}
                  </Link>
                )
              }
              const active = grp.items?.some(i => pathname?.startsWith(i.href))
              return (
                <div key={grp.label} style={{ position: 'relative', display: 'flex', height: '100%', alignItems: 'center' }} onMouseEnter={() => setActiveDropdown(grp.label)} onMouseLeave={() => setActiveDropdown(null)}>
                  <button
                    className={`nav-link ${active ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', height: '100%' }}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    {grp.label}
                    <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: activeDropdown === grp.label ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {activeDropdown === grp.label && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 12, zIndex: 100 }}>
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        {grp.items?.map(l => {
                          const ItemIcon = l.icon
                          const isActive = pathname?.startsWith(l.href)
                          return (
                            <Link key={l.href} href={l.href} onClick={() => setActiveDropdown(null)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, textDecoration: 'none', color: isActive ? 'var(--teal)' : 'var(--navy)', fontWeight: isActive ? 700 : 500, fontSize: 13, background: isActive ? 'rgba(13,148,136,0.05)' : 'transparent' }}
                            >
                              <ItemIcon size={15} />
                              {l.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="nav-right-actions">
            <div className="live-badge" title="Live Engine Active">
              <div className="live-dot" /> LIVE
            </div>


            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0d9488&color=fff&bold=true`}
                    alt="avatar"
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', objectFit: 'cover' }}
                  />
                  <button onClick={logOut} className="btn btn-outline" style={{ padding: '6px 10px' }} title="Log out">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="btn btn-outline" style={{ gap: 7 }}>
                  <LogIn size={14} /> Sign in
                </button>
              )
            )}
            
            <button
              onClick={() => setShowDevHub(true)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: 12, gap: 6, fontWeight: 700, fontFamily: 'DM Mono, monospace', background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' }}
            >
              &lt;/&gt; SDK Code
            </button>
            <Link href="/audit" className="btn btn-teal" style={{ fontSize: 13, padding: '9px 18px' }}>
              Start Audit →
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)} className="mobile-menu-btn">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navGroups.flatMap(g => g.items ? g.items : [g]).map(l => {
              const Icon = l.icon
              const active = l.href ? pathname?.startsWith(l.href) : false
              return (
                <Link key={l.label + (l.href || '')} href={l.href || '#'} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', color: active ? 'var(--teal)' : 'var(--navy)', fontWeight: active ? 700 : 500, fontSize: 14, background: active ? 'rgba(13,148,136,0.05)' : 'transparent' }}
                >
                  <Icon size={16} /> {l.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>
    </>
  )
}
