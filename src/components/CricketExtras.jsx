import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchLastWeekMatches,
  fetchLiveCommentary,
  fetchLiveMatchBundle,
  fetchPlayerRankings,
  fetchThisWeekMatches,
} from '../api/cricketapi'
import {
  getDemoCommentaryRows,
  getDemoLiveMatchBundle,
  getDemoPlayerRankings,
  getDemoPointsMatches,
} from '../assets/demoData'
import TeamFlag from './TeamFlag'

const COMMENTARY_POLL_INTERVAL_MS = 20000

const buildStateBadge = (state, status) => {
  const text = `${state} ${status}`.toLowerCase()

  if (text.includes('live') || text.includes('in progress') || text.includes('innings')) return 'Live'
  if (
    text.includes('complete') ||
    text.includes('won') ||
    text.includes('draw') ||
    text.includes('abandon') ||
    text.includes('stumps')
  ) {
    return 'Complete'
  }

  return 'Upcoming'
}

const formatDateTime = (timestampMs) => {
  if (!timestampMs) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestampMs))
}

const parseMatchResult = (match) => {
  const status = String(match?.status ?? '').toLowerCase()
  const team1Name = String(match?.team1?.name ?? '').toLowerCase()
  const team2Name = String(match?.team2?.name ?? '').toLowerCase()
  const team1Short = String(match?.team1?.short ?? '').toLowerCase()
  const team2Short = String(match?.team2?.short ?? '').toLowerCase()

  if (status.includes('abandon') || status.includes('no result') || status.includes('nr')) {
    return { type: 'nr' }
  }

  if (status.includes('draw') || status.includes('tie')) {
    return { type: 'draw' }
  }

  if (status.includes('won')) {
    const isTeam1Winner =
      status.includes(team1Name) || (team1Short && status.includes(` ${team1Short} `))
    const isTeam2Winner =
      status.includes(team2Name) || (team2Short && status.includes(` ${team2Short} `))

    if (isTeam1Winner) {
      return { type: 'win', winner: match.team1.name, loser: match.team2.name }
    }

    if (isTeam2Winner) {
      return { type: 'win', winner: match.team2.name, loser: match.team1.name }
    }
  }

  return { type: 'unknown' }
}

const computeTeamResultCode = (match, teamName) => {
  const result = parseMatchResult(match)
  if (result.type === 'nr') return 'NR'
  if (result.type === 'draw') return 'D'
  if (result.type === 'win') return result.winner === teamName ? 'W' : 'L'
  return '-'
}

const initPointsRow = (teamName) => ({
  team: teamName,
  played: 0,
  won: 0,
  lost: 0,
  draw: 0,
  noResult: 0,
  points: 0,
  lastFive: [],
})

const buildPointsTable = (matches) => {
  const completedMatches = matches
    .filter((match) => buildStateBadge(match.state, match.status) === 'Complete')
    .sort((a, b) => Number(a.startDateMs ?? 0) - Number(b.startDateMs ?? 0))

  const rowsByTeam = new Map()

  const ensureTeam = (teamName) => {
    if (!rowsByTeam.has(teamName)) {
      rowsByTeam.set(teamName, initPointsRow(teamName))
    }
    return rowsByTeam.get(teamName)
  }

  completedMatches.forEach((match) => {
    const teamA = match?.team1?.name
    const teamB = match?.team2?.name
    if (!teamA || !teamB) return

    const rowA = ensureTeam(teamA)
    const rowB = ensureTeam(teamB)

    rowA.played += 1
    rowB.played += 1

    const result = parseMatchResult(match)

    if (result.type === 'win') {
      const winnerRow = ensureTeam(result.winner)
      const loserRow = ensureTeam(result.loser)
      winnerRow.won += 1
      loserRow.lost += 1
      winnerRow.points += 2
    } else if (result.type === 'draw') {
      rowA.draw += 1
      rowB.draw += 1
      rowA.points += 1
      rowB.points += 1
    } else if (result.type === 'nr') {
      rowA.noResult += 1
      rowB.noResult += 1
      rowA.points += 1
      rowB.points += 1
    }
  })

  const completedDesc = [...completedMatches].sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0))

  rowsByTeam.forEach((row, teamName) => {
    row.lastFive = completedDesc
      .filter((match) => match?.team1?.name === teamName || match?.team2?.name === teamName)
      .slice(0, 5)
      .map((match) => computeTeamResultCode(match, teamName))
  })

  return Array.from(rowsByTeam.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.won !== a.won) return b.won - a.won
    return a.team.localeCompare(b.team)
  })
}

const fallbackHint = (activeTab) => {
  if (activeTab === 'players') return 'Try format T20/ODI/Test or switch Men/Women.'
  if (activeTab === 'points') return 'Try selecting a different series.'
  return 'Live commentary not available right now. Keep auto refresh on.'
}

const CricketExtras = ({ searchQuery = '', initialTab = 'players', showTabSwitcher = true }) => {
  const [activeTab, setActiveTab] = useState(initialTab)

  const [playerRows, setPlayerRows] = useState([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState('')
  const [playersNotice, setPlayersNotice] = useState('')
  const [playersUsingDemoData, setPlayersUsingDemoData] = useState(false)
  const [playerFormat, setPlayerFormat] = useState('t20')
  const [playerWomen, setPlayerWomen] = useState('0')
  const [playerRole, setPlayerRole] = useState('batsman')
  const [playerSearch, setPlayerSearch] = useState('')

  const [pointsMatches, setPointsMatches] = useState([])
  const [pointsLoading, setPointsLoading] = useState(true)
  const [pointsError, setPointsError] = useState('')
  const [pointsNotice, setPointsNotice] = useState('')
  const [pointsUsingDemoData, setPointsUsingDemoData] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState('all')

  const [bundle, setBundle] = useState(null)
  const [commentaryRows, setCommentaryRows] = useState([])
  const [commentaryEvents, setCommentaryEvents] = useState([])
  const [commentaryLoading, setCommentaryLoading] = useState(true)
  const [commentaryError, setCommentaryError] = useState('')
  const [commentaryNotice, setCommentaryNotice] = useState('')
  const [commentaryUsingDemoData, setCommentaryUsingDemoData] = useState(false)
  const [lastCommentarySync, setLastCommentarySync] = useState('Waiting for first update')
  const previousStatusRef = useRef('')

  const normalizedSearchQuery = String(searchQuery).trim().toLowerCase()

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      setPlayersLoading(true)
      try {
        const rows = await fetchPlayerRankings({
          formatType: playerFormat,
          women: playerWomen,
          roleType: playerRole,
        })
        if (!mounted) return
        const liveRows = rows ?? []

        if (liveRows.length > 0) {
          setPlayerRows(liveRows)
          setPlayersNotice('')
          setPlayersUsingDemoData(false)
        } else {
          setPlayerRows(
            getDemoPlayerRankings({
              formatType: playerFormat,
              women: playerWomen,
              roleType: playerRole,
            })
          )
          setPlayersNotice('Live API returned no player rankings. Showing demo data.')
          setPlayersUsingDemoData(true)
        }

        setPlayersError('')
      } catch {
        if (!mounted) return
        setPlayerRows(
          getDemoPlayerRankings({
            formatType: playerFormat,
            women: playerWomen,
            roleType: playerRole,
          })
        )
        setPlayersError('')
        setPlayersNotice('Player rankings unavailable right now. Showing demo data.')
        setPlayersUsingDemoData(true)
      } finally {
        if (mounted) setPlayersLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [playerFormat, playerWomen, playerRole])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      setPointsLoading(true)
      try {
        const [thisWeek, lastWeek] = await Promise.all([fetchThisWeekMatches(), fetchLastWeekMatches()])
        if (!mounted) return
        const merged = [...(thisWeek?.matches ?? []), ...(lastWeek?.matches ?? [])]
        if (merged.length > 0) {
          setPointsMatches(merged.sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0)))
          setPointsNotice('')
          setPointsUsingDemoData(false)
        } else {
          setPointsMatches(getDemoPointsMatches())
          setPointsNotice('Live API returned no points-table rows. Showing demo data.')
          setPointsUsingDemoData(true)
        }

        setPointsError('')
      } catch (error) {
        if (!mounted) return
        setPointsMatches(getDemoPointsMatches())
        setPointsError('')
        setPointsNotice(`${error?.message ?? 'Unable to load points data'}. Showing demo data.`)
        setPointsUsingDemoData(true)
      } finally {
        if (mounted) setPointsLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let refreshing = false

    const refresh = async () => {
      if (refreshing) return
      refreshing = true

      try {
        const apiBundle = await fetchLiveMatchBundle()
        if (!mounted) return

        const liveBundle = apiBundle?.matchId ? apiBundle : getDemoLiveMatchBundle()
        const useDemoBundle = !apiBundle?.matchId

        setBundle(liveBundle)
        setCommentaryError('')
        setCommentaryNotice(
          useDemoBundle ? 'Live API returned empty live match details. Showing demo feed.' : ''
        )
        setCommentaryUsingDemoData(useDemoBundle)

        const liveStatus = liveBundle?.meta?.status ?? ''
        if (liveStatus && liveStatus !== previousStatusRef.current) {
          previousStatusRef.current = liveStatus
          setCommentaryEvents((prev) => [
            {
              id: `status-${Date.now()}`,
              timestampMs: Date.now(),
              over: '',
              text: liveStatus,
              source: 'status',
            },
            ...prev,
          ].slice(0, 20))
        }

        if (useDemoBundle) {
          setCommentaryRows(getDemoCommentaryRows(liveBundle?.matchId))
          setCommentaryEvents([])
        } else {
          try {
            const rows = await fetchLiveCommentary(liveBundle?.matchId)
            if (!mounted) return

            if ((rows ?? []).length > 0) {
              setCommentaryRows(rows.slice(0, 25))
              setCommentaryNotice('')
              setCommentaryUsingDemoData(false)
            } else {
              setCommentaryRows(getDemoCommentaryRows(liveBundle?.matchId))
              setCommentaryNotice('Live commentary is empty right now. Showing demo feed.')
              setCommentaryUsingDemoData(true)
            }
          } catch {
            if (!mounted) return
            setCommentaryRows(getDemoCommentaryRows(liveBundle?.matchId))
            setCommentaryNotice('Live commentary endpoint unavailable. Showing demo feed.')
            setCommentaryUsingDemoData(true)
          }
        }

        setLastCommentarySync(new Date().toLocaleTimeString())
      } catch (error) {
        if (!mounted) return
        const demoBundle = getDemoLiveMatchBundle()
        setBundle(demoBundle)
        setCommentaryRows(getDemoCommentaryRows(demoBundle.matchId))
        setCommentaryEvents([])
        setCommentaryError('')
        setCommentaryNotice(`${error?.message ?? 'Unable to load live commentary'}. Showing demo feed.`)
        setCommentaryUsingDemoData(true)
        setLastCommentarySync(new Date().toLocaleTimeString())
      } finally {
        if (mounted) setCommentaryLoading(false)
        refreshing = false
      }
    }

    refresh()
    const id = setInterval(refresh, COMMENTARY_POLL_INTERVAL_MS)

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const playerSuggestions = useMemo(() => {
    const keyword = playerSearch.trim().toLowerCase()
    if (!keyword) return []

    const candidates = [
      ...new Set(
        playerRows.flatMap((row) => [row?.player, row?.country]).filter(Boolean)
      ),
    ]
    return candidates
      .filter((item) => String(item).toLowerCase().includes(keyword))
      .slice(0, 6)
  }, [playerRows, playerSearch])

  const filteredPlayerRows = useMemo(() => {
    const keyword = playerSearch.trim().toLowerCase()
    if (!keyword) return playerRows

    return playerRows.filter((row) =>
      `${row?.player} ${row?.country} ${row?.rank} ${row?.rating}`.toLowerCase().includes(keyword)
    )
  }, [playerRows, playerSearch])

  const seriesOptions = useMemo(() => {
    const list = [...new Set(pointsMatches.map((match) => match?.seriesName).filter(Boolean))]
    return list.sort((a, b) => a.localeCompare(b))
  }, [pointsMatches])

  useEffect(() => {
    if (selectedSeries === 'all') return
    if (!seriesOptions.includes(selectedSeries)) {
      setSelectedSeries('all')
    }
  }, [seriesOptions, selectedSeries])

  const filteredPointsMatches = useMemo(() => {
    const bySeries =
      selectedSeries === 'all'
        ? pointsMatches
        : pointsMatches.filter((match) => match?.seriesName === selectedSeries)

    if (!normalizedSearchQuery) return bySeries

    return bySeries.filter((match) =>
      `${match?.seriesName} ${match?.team1?.name} ${match?.team2?.name} ${match?.venue} ${match?.status}`
        .toLowerCase()
        .includes(normalizedSearchQuery)
    )
  }, [pointsMatches, selectedSeries, normalizedSearchQuery])

  const pointsTable = useMemo(() => buildPointsTable(filteredPointsMatches), [filteredPointsMatches])

  const renderedCommentary = useMemo(() => {
    if (commentaryRows.length > 0) {
      return commentaryRows.map((row) => ({
        ...row,
        source: 'api',
      }))
    }
    return commentaryEvents
  }, [commentaryRows, commentaryEvents])

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12 anim-section-enter">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)] anim-card-lift">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Advanced Center</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Player Rankings, Points Table & Commentary
            </h2>
            <p className="text-sm text-slate-600 mt-1">Extended analytics powered by API + smart fallback</p>
          </div>
          {showTabSwitcher && (
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab('players')}
                className={`px-3 py-1 rounded-full text-xs ${
                  activeTab === 'players' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Player Rankings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('points')}
                className={`px-3 py-1 rounded-full text-xs ${
                  activeTab === 'points' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Points Table
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('commentary')}
                className={`px-3 py-1 rounded-full text-xs ${
                  activeTab === 'commentary' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Live Commentary
              </button>
            </div>
          )}
        </div>

        {activeTab === 'players' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={playerRole}
                onChange={(event) => setPlayerRole(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
              >
                <option value="batsman">Batsmen</option>
                <option value="bowler">Bowlers</option>
                <option value="allrounder">All-Rounders</option>
              </select>
              <select
                value={playerFormat}
                onChange={(event) => setPlayerFormat(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
              >
                <option value="t20">T20</option>
                <option value="odi">ODI</option>
                <option value="test">Test</option>
              </select>
              <select
                value={playerWomen}
                onChange={(event) => setPlayerWomen(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
              >
                <option value="0">Men</option>
                <option value="1">Women</option>
              </select>
              <input
                type="text"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Search player or country"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs min-w-[220px]"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Source: {playersUsingDemoData ? 'Demo fallback data' : 'Live API data'}
            </p>

            {playerSuggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {playerSuggestions.map((item) => (
                  <button
                    key={`ps-${item}`}
                    type="button"
                    onClick={() => setPlayerSearch(String(item))}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {playersNotice && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                {playersNotice}
              </div>
            )}

            {playersLoading && (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                Loading player rankings...
              </div>
            )}

            {playersError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                API error: {playersError}
              </div>
            )}

            {!playersLoading && !playersError && filteredPlayerRows.length === 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No player ranking rows found. {fallbackHint('players')}
              </div>
            )}

            {filteredPlayerRows.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <thead className="bg-slate-100 text-slate-700 text-sm">
                    <tr>
                      <th className="text-left px-4 py-3">Rank</th>
                      <th className="text-left px-4 py-3">Player</th>
                      <th className="text-left px-4 py-3">Country</th>
                      <th className="text-right px-4 py-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayerRows.map((row) => (
                      <tr key={`${row.player}-${row.rank}`} className="border-t border-slate-100 text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.rank}</td>
                        <td className="px-4 py-3 text-slate-800">{row.player}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <TeamFlag name={row.country} size={16} />
                            <span>{row.country}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.rating || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'points' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-600">Series</label>
              <select
                value={selectedSeries}
                onChange={(event) => setSelectedSeries(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs min-w-[220px]"
              >
                <option value="all">All Series</option>
                {seriesOptions.map((series) => (
                  <option key={series} value={series}>
                    {series}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Source: {pointsUsingDemoData ? 'Demo fallback data' : 'Live API data'}
            </p>

            {pointsNotice && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                {pointsNotice}
              </div>
            )}

            {pointsLoading && (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                Loading points table...
              </div>
            )}

            {pointsError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                API error: {pointsError}
              </div>
            )}

            {!pointsLoading && !pointsError && pointsTable.length === 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No points-table data found. {fallbackHint('points')}
              </div>
            )}

            {pointsTable.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <thead className="bg-slate-100 text-slate-700 text-sm">
                    <tr>
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">Team</th>
                      <th className="text-right px-4 py-3">P</th>
                      <th className="text-right px-4 py-3">W</th>
                      <th className="text-right px-4 py-3">L</th>
                      <th className="text-right px-4 py-3">D</th>
                      <th className="text-right px-4 py-3">NR</th>
                      <th className="text-right px-4 py-3">Pts</th>
                      <th className="text-left px-4 py-3">Last 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsTable.map((row, index) => (
                      <tr key={`pts-${row.team}`} className="border-t border-slate-100 text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-800">{index + 1}</td>
                        <td className="px-4 py-3 text-slate-800">
                          <span className="inline-flex items-center gap-1.5">
                            <TeamFlag name={row.team} size={16} />
                            <span>{row.team}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.played}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.won}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.lost}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.draw}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.noResult}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.points}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {row.lastFive.length === 0 && <span className="text-xs text-slate-400">-</span>}
                            {row.lastFive.map((code, idx) => (
                              <span
                                key={`lf-${row.team}-${idx}`}
                                className={`inline-flex h-5 min-w-5 items-center justify-center rounded text-[10px] font-semibold ${
                                  code === 'W'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : code === 'L'
                                      ? 'bg-rose-100 text-rose-700'
                                      : code === 'NR'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commentary' && (
          <div className="mt-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Live Commentary Panel</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {bundle?.meta?.seriesname ?? 'Live match'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Match ID: {bundle?.matchId ?? '-'} | Last sync: {lastCommentarySync}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Source: {commentaryUsingDemoData ? 'Demo fallback data' : 'Live API data'}
              </p>
            </div>

            {commentaryNotice && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                {commentaryNotice}
              </div>
            )}

            {commentaryLoading && (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                Loading commentary...
              </div>
            )}

            {commentaryError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                API error: {commentaryError}
              </div>
            )}

            {!commentaryLoading && renderedCommentary.length === 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No commentary rows found. {fallbackHint('commentary')}
              </div>
            )}

            {renderedCommentary.length > 0 && (
              <div className="mt-4 space-y-2">
                {renderedCommentary.map((row) => (
                  <article
                    key={`com-${row.id}-${row.timestampMs}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 anim-card-lift"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        {row.over ? `Over ${row.over}` : 'Live update'} | {formatDateTime(row.timestampMs)}
                      </p>
                      <span
                        className={`text-[10px] uppercase tracking-wide font-semibold ${
                          row.source === 'api' ? 'text-cyan-700' : 'text-emerald-700'
                        }`}
                      >
                        {row.source === 'api' ? 'API Feed' : 'Status Feed'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{row.text}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default CricketExtras
