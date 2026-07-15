import { useState } from 'react'
import { Menu, X, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react'
import type { Page, User } from '../App'

function SignOutButton({
  onConfirm,
  variant,
}: {
  onConfirm: () => void
  variant: 'desktop' | 'mobile'
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === 'desktop'
            ? 'flex items-center gap-1.5 text-sm tracking-wider uppercase transition-opacity hover:opacity-70'
            : 'text-sm tracking-wider uppercase text-left'
        }
        style={{
          color: variant === 'desktop' ? 'rgba(246,241,233,0.6)' : 'rgba(246,241,233,0.5)',
        }}
      >
        {variant === 'desktop' ? <LogOut size={14} /> : null}
        {variant === 'desktop' ? 'Sign out' : 'Sign Out'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <div
            className="relative w-full max-w-sm border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-semibold">Confirmation</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Sign out now?
              </p>
            </div>
            <div className="flex gap-3 px-5 py-4">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
                style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}
              >
                No
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  onConfirm()
                }}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-red-500 text-red-500"
                style={{ backgroundColor: 'transparent' }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


interface Props {
  page: Page
  navigate: (p: Page) => void
  user: User | null
  setUser: (u: User | null) => void
}

export default function Navbar({ page, navigate, user, setUser }: Props) {
  const [open, setOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const handleSignOut = () => {
  setIsSigningOut(true)
  setOpen(false)

  setTimeout(() => {
    setUser(null)
    navigate('home')

    setTimeout(() => {
      setIsSigningOut(false)
    }, 400)
  }, 1200)
}

  return (
    <>
  {isSigningOut && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center signout-overlay">
      <div className="text-center signout-content">
        <div
          className="w-16 h-16 mx-auto mb-6 flex items-center justify-center text-xl font-bold tracking-widest signout-logo"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-outfit)',
          }}
        >
          V
        </div>

        <h2
          className="font-display italic text-3xl mb-2"
          style={{ color: '#f6f1e9' }}
        >
          Vernay
        </h2>

        <p
          className="text-xs tracking-[0.5em] uppercase mb-8"
          style={{ color: 'rgba(246,241,233,0.5)' }}
        >
          Hotels
        </p>

        <div className="signout-line mx-auto mb-6" />

        <p
          className="text-sm tracking-[0.25em] uppercase"
          style={{ color: 'rgba(246,241,233,0.75)' }}
        >
          Signing you out...
        </p>

        <p
          className="text-xs mt-3"
          style={{ color: 'rgba(246,241,233,0.4)' }}
        >
          Thank you for visiting Vernay
        </p>
      </div>
    </div>
  )}

    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--primary)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-3 group"
        >
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold tracking-widest"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--font-outfit)',
            }}
          >
            V
          </div>
          <span
            className="text-lg tracking-wide font-display italic"
            style={{ color: 'var(--primary-foreground)', fontWeight: 300 }}
          >
            Vernay
          </span>
          <span
            className="text-xs tracking-[0.3em] uppercase hidden sm:block"
            style={{ color: 'rgba(246,241,233,0.45)', marginTop: '2px' }}
          >
            Hotels
          </span>
        </button>

      {/* Desktop nav */}
<div className="hidden md:flex items-center gap-8">
  {user?.role === 'admin' ? (
    <>
      <button
        onClick={() => navigate('admin')}
        className="flex items-center gap-2 text-sm"
        style={{ color: 'var(--accent)' }}
      >
        <LayoutDashboard size={15} />
        <span className="tracking-wider uppercase">
          Admin
        </span>
      </button>

      <SignOutButton
        variant="desktop"
        onConfirm={() => {
          setUser(null)
        }}
      />
    </>
  ) : (
    <>
      {[
        { label: 'Rooms', page: 'search' as Page },
        { label: 'About', page: 'home' as Page },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.page)}
          className="text-sm tracking-wider uppercase transition-colors duration-200"
          style={{
            color:
              page === item.page
                ? 'var(--accent)'
                : 'rgba(246,241,233,0.6)',
            fontFamily: 'var(--font-outfit)',
          }}
        >
          {item.label}
        </button>
      ))}

      {user ? (
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('my-bookings')}
            className="flex items-center gap-2 text-sm"
            style={{
              color: 'rgba(246,241,233,0.8)',
            }}
          >
            <CalendarCheck size={15} />

            <span className="tracking-wider uppercase">
              My bookings
            </span>
          </button>

          <span
            className="text-sm"
            style={{
              color: 'rgba(246,241,233,0.5)',
            }}
          >
            {user.name}
          </span>

          <SignOutButton
  variant="desktop"
  onConfirm={handleSignOut}
/>
        </div>
      ) : (
        <button
          onClick={() => navigate('auth')}
          className="text-sm tracking-wider uppercase px-5 py-2"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-outfit)',
          }}
        >
          Sign In
        </button>
      )}
    </>
  )}
</div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          style={{ color: 'var(--primary-foreground)' }}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={{
            backgroundColor: 'var(--secondary)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <button
            onClick={() => { navigate('search'); setOpen(false) }}
            className="text-sm tracking-wider uppercase text-left"
            style={{ color: 'rgba(246,241,233,0.7)' }}
          >
            Rooms
          </button>
          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  onClick={() => { navigate('admin'); setOpen(false) }}
                  className="text-sm tracking-wider uppercase text-left"
                  style={{ color: 'var(--accent)' }}
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => { navigate('my-bookings'); setOpen(false) }}
                className="text-sm tracking-wider uppercase text-left"
                style={{ color: 'rgba(246,241,233,0.8)' }}
              >
                My Bookings
              </button>
              <SignOutButton
                  variant="mobile"
                  onConfirm={handleSignOut}
              />
            </>
          ) : (
            <button
              onClick={() => { navigate('auth'); setOpen(false) }}
              className="text-sm tracking-wider uppercase text-left"
              style={{ color: 'var(--accent)' }}
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
</>
  )
}
