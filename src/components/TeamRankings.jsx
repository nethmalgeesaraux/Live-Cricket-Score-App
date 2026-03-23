import React, { useEffect, useMemo, useState } from 'react'
import { fetchTeamRankings } from '../api/cricketapi'
import RankingFilters from './RankingFilters'
import TopRankedTeams from './TopRankedTeams'
import TeamRankingsCharts from './TeamRankingsCharts'

const TeamRankings = ({ searchQuery = '' }) => {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formatType, setFormatType] = useState('t20')
  const [women, setWomen] = useState('1')
  const [lastUpdated, setLastUpdated] = useState('Waiting for first update')

  const loadRankings = async (selectedFormat, selectedWomen) => {
    try {
      const response = await fetchTeamRankings({
        formatType: selectedFormat,
        women: selectedWomen,
      })
      setRows((response ?? []).slice(0, 10))
      setError('')
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (fetchError) {
      setError(fetchError?.message ?? 'Failed to fetch rankings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRankings(formatType, women)
  }, [formatType, women])

  const categoryLabel = `${women === '1' ? 'Women' : 'Men'} ${formatType.toUpperCase()}`
  const normalizedSearch = String(searchQuery).trim().toLowerCase()
  const isSearchActive = normalizedSearch.length > 0

  const filteredRows = useMemo(() => {
    if (!isSearchActive) return rows

    return rows.filter((row) => {
      const teamName = String(row?.team ?? '').toLowerCase()
      const rankText = String(row?.rank ?? '')
      const ratingText = String(row?.rating ?? '')

      return (
        teamName.includes(normalizedSearch) ||
        rankText.includes(normalizedSearch) ||
        ratingText.includes(normalizedSearch)
      )
    })
  }, [rows, isSearchActive, normalizedSearch])

  const onRefresh = () => {
    setIsLoading(true)
    loadRankings(formatType, women)
  }

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">ICC Rankings</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Team Rankings</h2>
            <p className="text-sm text-slate-600 mt-1">Category: {categoryLabel}</p>
            {isSearchActive && (
              <p className="text-xs text-violet-700 mt-2">
                Search filter: "{searchQuery.trim()}"
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 min-w-[230px]">
            <p className="text-xs text-violet-700 font-semibold uppercase tracking-wide">Rankings Snapshot</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {isSearchActive
                ? `${filteredRows.length}/${rows.length} teams match search`
                : `${rows.length} teams loaded`}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Last update: {lastUpdated}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-700 hover:bg-violet-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Loading rankings...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            API error: {error}
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            No rankings data available.
          </div>
        )}

        <div className="mt-4">
          <RankingFilters
            formatType={formatType}
            women={women}
            onFormatChange={setFormatType}
            onWomenChange={setWomen}
            disabled={isLoading}
          />
        </div>

        {isSearchActive && !isLoading && !error && rows.length > 0 && filteredRows.length === 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            No teams found for "{searchQuery.trim()}" in this rankings category.
          </div>
        )}

        <TopRankedTeams rows={filteredRows} />

        {filteredRows.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="text-left px-4 py-3">Rank</th>
                  <th className="text-left px-4 py-3">Team</th>
                  <th className="text-right px-4 py-3">Rating</th>
                  <th className="text-right px-4 py-3">Matches</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.team}-${row.rank}`} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.rank}</td>
                    <td className="px-4 py-3 text-slate-800">{row.team}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.rating || '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.matches || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TeamRankingsCharts rows={filteredRows} />
      </div>
    </section>
  )
}

export default TeamRankings
