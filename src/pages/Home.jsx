import React, { useEffect, useRef, useState } from 'react'
import { homeStyles } from '../assets/dummyStyles'
import Header from '../components/Header'
import Footer from '../components/Footer'
import bat from '../assets/bat.png'
import ball from '../assets/ball.png'
import LiveMach from '../components/LiveMach'
import MachHistory from '../components/MachHistory'
import TeamRankings from '../components/TeamRankings'

const Home = () => {
  const [isHomeLoading, setIsHomeLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('live')

  const loadingTimerRef = useRef(null)
  const liveSectionRef = useRef(null)
  const fixturesSectionRef = useRef(null)
  const teamsSectionRef = useRef(null)

  const getSectionRef = (sectionKey) => {
    if (sectionKey === 'fixtures') return fixturesSectionRef
    if (sectionKey === 'teams') return teamsSectionRef
    return liveSectionRef
  }

  const scrollToSection = (sectionKey) => {
    const sectionRef = getSectionRef(sectionKey)
    if (!sectionRef?.current) return

    sectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const navigateToSection = (sectionKey) => {
    setActiveSection(sectionKey)
    scrollToSection(sectionKey)
  }

  const triggerHomeLoading = () => {
    setIsHomeLoading(true)

    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }

    loadingTimerRef.current = setTimeout(() => {
      setIsHomeLoading(false)
    }, 1800)
  }

  const handleHeroAction = (sectionKey) => {
    triggerHomeLoading()
    navigateToSection(sectionKey)
  }

  const handleSearch = (query) => {
    const normalizedQuery = query.trim()
    setSearchQuery(normalizedQuery)

    if (!normalizedQuery) return

    const loweredQuery = normalizedQuery.toLowerCase()
    let targetSection = 'live'

    if (
      loweredQuery.includes('team') ||
      loweredQuery.includes('rank') ||
      loweredQuery.includes('women') ||
      loweredQuery.includes('men')
    ) {
      targetSection = 'teams'
    } else if (
      loweredQuery.includes('fixture') ||
      loweredQuery.includes('history') ||
      loweredQuery.includes('week') ||
      loweredQuery.includes('result')
    ) {
      targetSection = 'fixtures'
    }

    navigateToSection(targetSection)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleSection) return

        const sectionKey = visibleSection.target.getAttribute('data-section-key')
        if (!sectionKey) return
        setActiveSection(sectionKey)
      },
      {
        threshold: [0.25, 0.45, 0.7],
        rootMargin: '-25% 0px -45% 0px',
      }
    )

    ;[liveSectionRef, fixturesSectionRef, teamsSectionRef].forEach((sectionRef) => {
      if (sectionRef.current) {
        observer.observe(sectionRef.current)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`${homeStyles.root} flex flex-col`}>
      <div
        className={homeStyles.blob1}
        style={{
          background: homeStyles.blob1Gradient,
        }}
      />

      <div
        className={homeStyles.blob2}
        style={{
          background: homeStyles.blob2Gradient,
        }}
      />

      <div className={homeStyles.headerContainer}>
        <Header onSearch={handleSearch} onNavigate={navigateToSection} activeSection={activeSection} />
      </div>

      <main className={homeStyles.main}>
        <section className={homeStyles.section}>
          <div className={homeStyles.heroWrapper}>
            <div className={homeStyles.heroBox}>
              <div
                className={homeStyles.heroSpotlight}
                style={{ background: homeStyles.heroSpotlightGradient }}
              />

              <div className={homeStyles.heroContent}>
                <div className={homeStyles.heroText}>
                  <h1 className={homeStyles.heroTitle}>
                    Follow every match.
                    <br />
                    Real-time scores, classy
                    <br />
                    insights.
                  </h1>

                  <p className={homeStyles.heroSubtitle}>
                    Live scorecards, upcoming fixtures and match analytics - Fast live score,
                    schedule tracking and compact analysis.
                  </p>

                  <div className={homeStyles.heroButtons}>
                    <button
                      type="button"
                      className={`${homeStyles.primaryButton} ${
                        isHomeLoading ? homeStyles.heroButtonDisabled : ''
                      }`}
                      onClick={() => handleHeroAction('live')}
                    >
                      View live matches
                    </button>
                    <button
                      type="button"
                      className={`${homeStyles.secondaryButton} ${
                        isHomeLoading ? homeStyles.heroButtonDisabled : ''
                      }`}
                      onClick={() => handleHeroAction('fixtures')}
                    >
                      Quick details
                    </button>
                  </div>

                  <div className={homeStyles.heroFeatures}>
                    <button
                      type="button"
                      className={`${homeStyles.featureButton} ${
                        isHomeLoading ? homeStyles.heroButtonDisabled : ''
                      }`}
                      onClick={() => handleHeroAction('live')}
                    >
                      Live scorecards
                    </button>
                    <button
                      type="button"
                      className={`${homeStyles.featureButton} ${
                        isHomeLoading ? homeStyles.heroButtonDisabled : ''
                      }`}
                      onClick={() => handleHeroAction('fixtures')}
                    >
                      Match detail
                    </button>
                    <button
                      type="button"
                      className={`${homeStyles.featureButton} ${
                        isHomeLoading ? homeStyles.heroButtonDisabled : ''
                      }`}
                      onClick={() => handleHeroAction('teams')}
                    >
                      Team stats
                    </button>
                  </div>

                  {searchQuery && (
                    <div className="mt-4 rounded-xl border border-white/30 bg-white/15 backdrop-blur-sm px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-white">Showing results for: "{searchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={homeStyles.heroMedia}>
                  <img src={bat} alt="Cricket bat" className={homeStyles.heroBat} />
                  <img src={ball} alt="Cricket ball" className={homeStyles.heroBall} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div ref={liveSectionRef} data-section-key="live" className="scroll-mt-36">
        <LiveMach searchQuery={searchQuery} />
      </div>

      <div ref={fixturesSectionRef} data-section-key="fixtures" className="scroll-mt-36">
        <MachHistory searchQuery={searchQuery} />
      </div>

      <div ref={teamsSectionRef} data-section-key="teams" className="scroll-mt-36">
        <TeamRankings searchQuery={searchQuery} />
      </div>

      <Footer />

      {isHomeLoading && (
        <div className={homeStyles.pageLoadingOverlay} role="status" aria-live="polite">
          <div className={homeStyles.pageLoadingCard}>
            <div className={homeStyles.pageLoadingTop}>
              <span className={homeStyles.pageLoadingDot} />
              <p className={homeStyles.pageLoadingLabel}>Loading...</p>
            </div>
            <p className={homeStyles.pageLoadingSub}>Please wait while we prepare content</p>
            <div className={homeStyles.pageLoadingLine}>
              <div className={homeStyles.pageLoadingFill} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
