import React from 'react'
import { homeStyles } from '../assets/dummyStyles'
import Header from '../components/Header'

const Home = () => {
    return (
        <div className={homeStyles.root}>
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



        </div>
    )
}

export default Home