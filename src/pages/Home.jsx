import React from 'react'
import { homeStyles } from '../assets/dummyStyles'
import Header from '../components/Header'
import Footer from '../components/Footer'

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

            <main className="flex-1" />
            <Footer />
        </div>
    )
}

export default Home
