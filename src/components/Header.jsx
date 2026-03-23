import React, { useState } from 'react'
import { headerStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react'

const NAV_ITEMS = [
  { key: 'live', label: 'Live' },
  { key: 'fixtures', label: 'Fixtures' },
  { key: 'teams', label: 'Teams' },
]

const Header = ({ onSearch, onNavigate, activeSection = 'live' }) => {
  const [query, setQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  const navigateTo = (sectionKey) => {
    onNavigate?.(sectionKey)
    setIsMobileMenuOpen(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch?.(query.trim())
    setIsMobileMenuOpen(false)
  }

  return (
    <header className={headerStyles.container}>
      <div className="max-w-6xl mx-auto">
        <div className={headerStyles.mainWrapper}>
          <div className={headerStyles.logoContainer}>
            <div className={headerStyles.logoImage}>
              <img src={logo} alt="Cricket Fever" className={headerStyles.logoImg} />
            </div>
            <div className={headerStyles.logoText}>
              <p className={headerStyles.logoTitle}>Matchzone</p>
              <span className="text-xs text-slate-500">Instant match updates</span>
            </div>
          </div>

          <form className={headerStyles.searchForm} onSubmit={handleSubmit}>
            <div className={`${headerStyles.searchWrapper} relative`}>
              <input
                className={headerStyles.searchInput}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
              />
              <button className={headerStyles.searchButton} type="submit">
                Search
              </button>
            </div>
          </form>

          <div className={headerStyles.mobileMenuButton}>
            <button
              type="button"
              className={headerStyles.menuToggleButton}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" className={headerStyles.menuIcon}>
                {isMobileMenuOpen ? (
                  <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>

          <div className={headerStyles.navContainer}>
            <nav className={headerStyles.nav}>
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${headerStyles.navButtons} ${
                      isActive ? 'text-indigo-700 font-semibold' : ''
                    }`}
                    onClick={() => navigateTo(item.key)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className={headerStyles.authContainer}>
              {!isSignedIn && (
                <>
                  <SignInButton mode="modal">
                    <button className={headerStyles.loginButton}>Log in</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className={headerStyles.signupButton}>Sign up</button>
                  </SignUpButton>
                </>
              )}
              {isSignedIn && <UserButton afterSignOutUrl="/" />}
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className={headerStyles.mobileMenu}>
              <nav className={headerStyles.mobileNav}>
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`${headerStyles.mobileNavButton} ${
                        isActive ? 'font-semibold text-indigo-700' : ''
                      }`}
                      onClick={() => navigateTo(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              {!isSignedIn && (
                <div className={headerStyles.mobileAuthContainer}>
                  <SignInButton mode="modal">
                    <button
                      className={`${headerStyles.mobileAuthButton} ${headerStyles.mobileLogin}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className={`${headerStyles.mobileAuthButton} ${headerStyles.mobileSignup}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isSignedIn && (
                <div className="mt-3 flex justify-end">
                  <UserButton afterSignOutUrl="/" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
