import React, { useState } from 'react'
import { headerStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'

const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('')

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
        </div>
      </div>
    </header>
  )
}

export default Header
