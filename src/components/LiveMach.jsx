import React, { useEffect, useState } from 'react'

const BASE_MATCH = {
  series: 'Asia Cup 2026 - Super 4',
  matchLabel: 'Match 08',
  venue: 'R. Premadasa Stadium, Colombo',
  toss: 'Sri Lanka won the toss and chose to bowl first',
  battingTeam: 'India',
  bowlingTeam: 'Sri Lanka',
  target: 289,
  firstInningsScore: '288/8',
  firstInningsOvers: '50.0',
  firstInningsRR: '5.76',
  teamMeta: [
    {
      name: 'India',
      short: 'IND',
      flagUrl: 'https://flagcdn.com/w40/in.png',
      flagAlt: 'India flag',
    },
    {
      name: 'Sri Lanka',
      short: 'SL',
      flagUrl: 'https://flagcdn.com/w40/lk.png',
      flagAlt: 'Sri Lanka flag',
    },
  ],
}

const LIVE_EVENTS = [
  { runs: 1, wicket: false, bowler: 'Hasaranga', batter: 'KL Rahul', outcome: '1 run' },
  { runs: 2, wicket: false, bowler: 'Hasaranga', batter: 'Axar Patel', outcome: '2 runs' },
  { runs: 0, wicket: false, bowler: 'Hasaranga', batter: 'KL Rahul', outcome: 'Dot' },
  { runs: 4, wicket: false, bowler: 'Madushanka', batter: 'Axar Patel', outcome: 'Four' },
  { runs: 1, wicket: false, bowler: 'Madushanka', batter: 'Axar Patel', outcome: '1 run' },
  { runs: 0, wicket: true, bowler: 'Madushanka', batter: 'Shardul Thakur', outcome: 'Wicket' },
  { runs: 3, wicket: false, bowler: 'Hasaranga', batter: 'KL Rahul', outcome: '3 runs' },
  { runs: 1, wicket: false, bowler: 'Asalanka', batter: 'Axar Patel', outcome: '1 run' },
  { runs: 0, wicket: false, bowler: 'Asalanka', batter: 'KL Rahul', outcome: 'Dot' },
  { runs: 4, wicket: false, bowler: 'Hasaranga', batter: 'KL Rahul', outcome: 'Four' },
  { runs: 1, wicket: false, bowler: 'Hasaranga', batter: 'Axar Patel', outcome: '1 run' },
  { runs: 2, wicket: false, bowler: 'Madushanka', batter: 'KL Rahul', outcome: '2 runs' },
]

const INITIAL_TIMELINE = [
  { over: '37.6', bowler: 'Hasaranga', batter: 'Axar Patel', outcome: '1 run' },
  { over: '37.5', bowler: 'Hasaranga', batter: 'Axar Patel', outcome: '2 runs' },
  { over: '37.4', bowler: 'Hasaranga', batter: 'Hardik Pandya', outcome: 'Wicket' },
  { over: '37.3', bowler: 'Hasaranga', batter: 'KL Rahul', outcome: 'Dot' },
  { over: '37.2', bowler: 'Hasaranga', batter: 'KL Rahul', outcome: 'Four' },
  { over: '37.1', bowler: 'Hasaranga', batter: 'KL Rahul', outcome: '1 run' },
]

const ballStyleMap = {
  Dot: 'bg-slate-100 text-slate-700 border border-slate-200',
  Wicket: 'bg-rose-100 text-rose-700 border border-rose-200',
  Four: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  '1 run': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  '2 runs': 'bg-blue-100 text-blue-700 border border-blue-200',
  '3 runs': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const formatOver = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`

const calculateRunRate = (runs, balls) => {
  if (balls === 0) return '0.00'
  return (runs / (balls / 6)).toFixed(2)
}

const buildStatusText = (requiredRuns, ballsLeft, wickets) => {
  if (requiredRuns === 0) {
    return `India won by ${Math.max(10 - wickets, 0)} wickets`
  }
  if (ballsLeft === 0 || wickets >= 10) {
    return `Sri Lanka won by ${requiredRuns} runs`
  }
  return `India need ${requiredRuns} runs in ${ballsLeft} balls`
}

const buildWinChance = (requiredRuns, ballsLeft, wickets) => {
  if (requiredRuns === 0) {
    return { india: 100, sriLanka: 0 }
  }

  if (ballsLeft === 0 || wickets >= 10) {
    return { india: 0, sriLanka: 100 }
  }

  const pressure = requiredRuns / ballsLeft
  const indiaChanceRaw = 82 - pressure * 18 - wickets * 2 + ballsLeft / 20
  const india = clamp(Math.round(indiaChanceRaw), 8, 92)

  return {
    india,
    sriLanka: 100 - india,
  }
}

const buildBallChip = (event) => {
  if (event.wicket) return 'W'
  if (event.runs === 0) return '0'
  return String(event.runs)
}

const LiveMach = () => {
  const [liveState, setLiveState] = useState({
    runs: 235,
    wickets: 5,
    ballsBowled: 228,
    ballsLeft: 72,
    recentBalls: ['1', '4', '0', 'W', '2', '1'],
    timeline: INITIAL_TIMELINE,
    players: {
      'KL Rahul': { runs: 82, balls: 73 },
      'Axar Patel': { runs: 26, balls: 17 },
    },
    tick: 0,
    isComplete: false,
    lastUpdateLabel: 'Simulation started',
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveState((previous) => {
        if (previous.isComplete) return previous

        const event = LIVE_EVENTS[previous.tick % LIVE_EVENTS.length]
        const ballsBowled = previous.ballsBowled + 1
        const ballsLeft = Math.max(previous.ballsLeft - 1, 0)
        const wickets = clamp(previous.wickets + (event.wicket ? 1 : 0), 0, 10)
        const runs = previous.runs + event.runs
        const requiredRuns = Math.max(BASE_MATCH.target - runs, 0)

        const players = { ...previous.players }
        if (players[event.batter]) {
          const current = players[event.batter]
          players[event.batter] = {
            runs: current.runs + event.runs,
            balls: current.balls + 1,
          }
        }

        const nextOver = formatOver(ballsBowled)
        const nextTimeline = [
          {
            over: nextOver,
            bowler: event.bowler,
            batter: event.batter,
            outcome: event.outcome,
          },
          ...previous.timeline,
        ].slice(0, 6)

        const nextRecentBalls = [...previous.recentBalls.slice(1), buildBallChip(event)]
        const matchComplete = requiredRuns === 0 || ballsLeft === 0 || wickets >= 10

        return {
          ...previous,
          runs,
          wickets,
          ballsBowled,
          ballsLeft,
          players,
          timeline: nextTimeline,
          recentBalls: nextRecentBalls,
          tick: previous.tick + 1,
          isComplete: matchComplete,
          lastUpdateLabel: `Over ${nextOver} updated`,
        }
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const currentScore = `${liveState.runs}/${liveState.wickets}`
  const currentOvers = formatOver(liveState.ballsBowled)
  const currentRR = calculateRunRate(liveState.runs, liveState.ballsBowled)
  const requiredRuns = Math.max(BASE_MATCH.target - liveState.runs, 0)
  const requiredRR =
    liveState.ballsLeft > 0 ? ((requiredRuns * 6) / liveState.ballsLeft).toFixed(2) : '0.00'
  const status = buildStatusText(requiredRuns, liveState.ballsLeft, liveState.wickets)
  const winChance = buildWinChance(requiredRuns, liveState.ballsLeft, liveState.wickets)

  const teamCards = [
    {
      ...BASE_MATCH.teamMeta[0],
      score: currentScore,
      overs: `${currentOvers} ov`,
      runRate: `CRR ${currentRR}`,
    },
    {
      ...BASE_MATCH.teamMeta[1],
      score: BASE_MATCH.firstInningsScore,
      overs: `${BASE_MATCH.firstInningsOvers} ov`,
      runRate: `RR ${BASE_MATCH.firstInningsRR}`,
    },
  ]

  const chaseStats = [
    { label: 'Required Runs', value: String(requiredRuns) },
    { label: 'Balls Left', value: String(liveState.ballsLeft) },
    { label: 'Required RR', value: requiredRR },
    { label: 'Current RR', value: currentRR },
  ]

  const keyPlayers = {
    batting: [
      {
        name: 'KL Rahul',
        score: `${liveState.players['KL Rahul'].runs} (${liveState.players['KL Rahul'].balls})`,
      },
      {
        name: 'Axar Patel',
        score: `${liveState.players['Axar Patel'].runs} (${liveState.players['Axar Patel'].balls})`,
      },
    ],
    bowling: [
      { name: 'Wanindu Hasaranga', figures: '2/42 (8)' },
      { name: 'Dilshan Madushanka', figures: '2/54 (8.3)' },
    ],
  }

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Live Match Center</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{BASE_MATCH.series}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {BASE_MATCH.matchLabel} | {BASE_MATCH.venue}
            </p>
            <p className="text-sm text-slate-500 mt-2">{BASE_MATCH.toss}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 min-w-[230px]">
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Live Chase</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{status}</p>
            <p className="text-xs text-slate-600 mt-1">
              Target {BASE_MATCH.target} | {currentScore} ({currentOvers} ov)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Batting: {BASE_MATCH.battingTeam} | Bowling: {BASE_MATCH.bowlingTeam}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Last update: {liveState.lastUpdateLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {teamCards.map((team) => (
            <article key={team.short} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{team.short}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
                </div>
                <span className="inline-flex h-8 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <img src={team.flagUrl} alt={team.flagAlt} className="h-5 w-7 rounded-sm object-cover" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">{team.score}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{team.overs}</span>
                <span>{team.runRate}</span>
              </div>
            </article>
          ))}

          <article className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4">
            <p className="text-xs uppercase tracking-wide text-cyan-200">Win Chance</p>
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>India</span>
                  <span>{winChance.india}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 mt-1 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${winChance.india}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Sri Lanka</span>
                  <span>{winChance.sriLanka}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 mt-1 overflow-hidden">
                  <div className="h-full bg-blue-300" style={{ width: `${winChance.sriLanka}%` }} />
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {chaseStats.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Recent Balls</h3>
              <p className="text-xs text-slate-500">{currentOvers} over stage</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveState.recentBalls.map((ball, idx) => (
                <span
                  key={`${ball}-${idx}`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                    ball === 'W'
                      ? 'bg-rose-100 text-rose-700'
                      : ball === '4'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ball === '0'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">Key Players</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Batting</p>
                {keyPlayers.batting.map((player) => (
                  <p key={player.name} className="text-slate-700 mt-2">
                    {player.name} <span className="text-slate-500">{player.score}</span>
                  </p>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bowling</p>
                {keyPlayers.bowling.map((player) => (
                  <p key={player.name} className="text-slate-700 mt-2">
                    {player.name} <span className="text-slate-500">{player.figures}</span>
                  </p>
                ))}
              </div>
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Ball-by-Ball Detail</h3>
            <p className="text-xs text-slate-500">Auto simulation every 3.5s</p>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {liveState.timeline.map((event) => (
              <div key={`${event.over}-${event.bowler}-${event.batter}`} className="rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{event.over}</p>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      ballStyleMap[event.outcome] ?? 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {event.outcome}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-2">
                  {event.bowler} to {event.batter}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default LiveMach
