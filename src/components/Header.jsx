import React, { useState } from 'react'
import { headerStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react'

const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const { isSignedIn } = useUser()

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch?.(query.trim())
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

          <div className={headerStyles.navContainer}>
            <nav className="flex items-center gap-5">
              <button className={headerStyles.navButtons}>Live</button>
              <button className={headerStyles.navButtons}>Fixtures</button>
              <button className={headerStyles.navButtons}>Teams</button>
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
        </div>
      </div>
    </header>
  )
}

export default Header
