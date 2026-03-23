import React from 'react'

const TopRankedTeams = ({ rows }) => {
  const topRows = rows.slice(0, 3)

  if (topRows.length === 0) return null

  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {topRows.map((team, index) => (
        <article
          key={`${team.team}-${team.rank}`}
          className={`rounded-xl border px-3 py-3 ${
            index === 0
              ? 'border-amber-200 bg-amber-50'
              : index === 1
                ? 'border-slate-300 bg-slate-50'
                : 'border-orange-200 bg-orange-50'
          }`}
        >
          <p className="text-xs text-slate-500">#{team.rank}</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{team.team}</p>
          <p className="text-xs text-slate-600 mt-1">Rating: {team.rating || '-'}</p>
          <p className="text-xs text-slate-500">Matches: {team.matches || '-'}</p>
        </article>
      ))}
    </div>
  )
}

export default TopRankedTeams
