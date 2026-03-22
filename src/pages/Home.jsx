import React, { useEffect, useRef, useState } from 'react'
import { homeStyles } from '../assets/dummyStyles'
import Header from '../components/Header'
import Footer from '../components/Footer'
import bat from '../assets/bat.png'
import ball from '../assets/ball.png'
import LiveMach from '../components/LiveMach'

const Home = () => {
    const [isHomeLoading, setIsHomeLoading] = useState(false)
    const loadingTimerRef = useRef(null)

    const triggerHomeLoading = () => {
        setIsHomeLoading(true)

        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current)
        }

        loadingTimerRef.current = setTimeout(() => {
            setIsHomeLoading(false)
        }, 1800)
    }

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
            ></div>

            <div
                className={homeStyles.blob2}
                style={{
                    background: homeStyles.blob2Gradient,
                }}
            ></div>

            <div className={homeStyles.headerContainer}>
                <Header onSearch={(q) => console.log("search", q)} />
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
                                            className={`${homeStyles.primaryButton} ${isHomeLoading ? homeStyles.heroButtonDisabled : ''}`}
                                            onClick={triggerHomeLoading}
                                        >
                                            View live matches
                                        </button>
                                        <button
                                            type="button"
                                            className={`${homeStyles.secondaryButton} ${isHomeLoading ? homeStyles.heroButtonDisabled : ''}`}
                                            onClick={triggerHomeLoading}
                                        >
                                            Quick details
                                        </button>
                                    </div>

                                    <div className={homeStyles.heroFeatures}>
                                        <button
                                            type="button"
                                            className={`${homeStyles.featureButton} ${isHomeLoading ? homeStyles.heroButtonDisabled : ''}`}
                                            onClick={triggerHomeLoading}
                                        >
                                            Live scorecards
                                        </button>
                                        <button
                                            type="button"
                                            className={`${homeStyles.featureButton} ${isHomeLoading ? homeStyles.heroButtonDisabled : ''}`}
                                            onClick={triggerHomeLoading}
                                        >
                                            Match detail
                                        </button>
                                        <button
                                            type="button"
                                            className={`${homeStyles.featureButton} ${isHomeLoading ? homeStyles.heroButtonDisabled : ''}`}
                                            onClick={triggerHomeLoading}
                                        >
                                            Team stats
                                        </button>
                                    </div>
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
            <LiveMach />
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
