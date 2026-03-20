import React from 'react'
import { homeStyles } from '../assets/dummyStyles'
import Header from '../components/Header'
import Footer from '../components/Footer'
import bat from '../assets/bat.png'
import ball from '../assets/ball.png'

const Home = () => {
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
                                        <button type="button" className={homeStyles.primaryButton}>
                                            View live matches
                                        </button>
                                        <button type="button" className={homeStyles.secondaryButton}>
                                            Quick details
                                        </button>
                                    </div>

                                    <div className={homeStyles.heroFeatures}>
                                        <span className={homeStyles.featureTag}>Live scorecards</span>
                                        <span className={homeStyles.featureTag}>Match detail</span>
                                        <span className={homeStyles.featureTag}>Team stats</span>
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
            <Footer />
        </div>
    )
}

export default Home
