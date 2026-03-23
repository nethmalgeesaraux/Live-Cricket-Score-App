import React from 'react'

const TeamRankingsCharts = ({ rows }) => {
  if (!rows || rows.length === 0) return null

  const chartRows = rows.slice(0, 8)
  const maxRating = Math.max(...chartRows.map((row) => Number(row?.rating ?? 0)), 1)
  const maxMatches = Math.max(...chartRows.map((row) => Number(row?.matches ?? 0)), 1)

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Team Insights</p>
        <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-900">Team Rankings Charts</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Top {chartRows.length} teams compared by rating and matches.
        </p>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="rounded-xl border border-violet-100 bg-white p-3 sm:p-4">
            <h4 className="text-sm font-semibold text-slate-800">Rating Chart</h4>
            <div className="mt-3 space-y-2.5">
              {chartRows.map((row) => {
                const rating = Number(row?.rating ?? 0)
                const ratingWidth = Math.max((rating / maxRating) * 100, rating > 0 ? 8 : 0)

                return (
                  <div key={`rating-${row.team}-${row.rank}`} className="flex items-center gap-2.5">
                    <span className="w-20 sm:w-24 text-[11px] sm:text-xs text-slate-600 truncate">{row.team}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                        style={{ width: `${ratingWidth}%` }}
                      />
                    </div>
                    <span className="w-9 sm:w-12 text-right text-[11px] sm:text-xs font-semibold text-slate-700">
                      {rating}
                    </span>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="rounded-xl border border-cyan-100 bg-white p-3 sm:p-4">
            <h4 className="text-sm font-semibold text-slate-800">Matches Chart</h4>
            <div className="mt-3 space-y-2.5">
              {chartRows.map((row) => {
                const matches = Number(row?.matches ?? 0)
                const matchesWidth = Math.max((matches / maxMatches) * 100, matches > 0 ? 8 : 0)

                return (
                  <div key={`matches-${row.team}-${row.rank}`} className="flex items-center gap-2.5">
                    <span className="w-20 sm:w-24 text-[11px] sm:text-xs text-slate-600 truncate">{row.team}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        style={{ width: `${matchesWidth}%` }}
                      />
                    </div>
                    <span className="w-9 sm:w-12 text-right text-[11px] sm:text-xs font-semibold text-slate-700">
                      {matches}
                    </span>
                  </div>
                )
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

export default TeamRankingsCharts
