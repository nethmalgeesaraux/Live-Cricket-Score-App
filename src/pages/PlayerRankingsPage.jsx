import React from 'react'
import { Link } from 'react-router-dom'
import CricketExtras from '../components/CricketExtras'

const PlayerRankingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Cricket Dashboard</p>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Player Rankings Page</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>
            <Link
              to="/points-table"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100"
            >
              Points Table
            </Link>
            <Link
              to="/live-commentary"
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-100"
            >
              Live Commentary
            </Link>
          </div>
        </div>
      </div>

      <CricketExtras initialTab="players" showTabSwitcher={false} />
    </div>
  )
}

export default PlayerRankingsPage
