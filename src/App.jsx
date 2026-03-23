import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PlayerRankingsPage from './pages/PlayerRankingsPage.jsx'
import PointsTablePage from './pages/PointsTablePage.jsx'
import LiveCommentaryPage from './pages/LiveCommentaryPage.jsx'


const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/player-rankings' element={<PlayerRankingsPage />} />
      <Route path='/points-table' element={<PointsTablePage />} />
      <Route path='/live-commentary' element={<LiveCommentaryPage />} />
    </Routes>
  )
}

export default App
