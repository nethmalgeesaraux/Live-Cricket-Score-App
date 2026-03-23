const getWeekBounds = (referenceDate = new Date(), weekOffset = 0) => {
  const start = new Date(referenceDate)
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek + weekOffset * 7)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    weekStartMs: start.getTime(),
    weekEndMs: end.getTime(),
  }
}

const getWeekTimestamp = (weekOffset, dayOffset, hour = 14, minute = 0) => {
  const { weekStartMs } = getWeekBounds(new Date(), weekOffset)
  const date = new Date(weekStartMs)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.getTime()
}

const cloneMatch = (match) => ({
  ...match,
  team1: { ...match.team1 },
  team2: { ...match.team2 },
})

const buildThisWeekMatches = () => [
  {
    matchId: 810101,
    matchType: 'International',
    seriesName: 'Asia Cup ODI 2026',
    matchDesc: '1st Match',
    matchFormat: 'ODI',
    status: 'India won by 68 runs',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(0, 0, 14, 30),
    endDateMs: getWeekTimestamp(0, 0, 22, 30),
    venue: 'R. Premadasa Stadium, Colombo',
    team1: { name: 'India', short: 'IND', score: '298/7 (50 ov)' },
    team2: { name: 'Bangladesh', short: 'BAN', score: '230/10 (46.2 ov)' },
  },
  {
    matchId: 810102,
    matchType: 'International',
    seriesName: 'Sri Lanka T20 Tri-Series',
    matchDesc: 'Match 4',
    matchFormat: 'T20',
    status: 'Sri Lanka need 24 runs in 16 balls',
    state: 'Live',
    stateTitle: 'In Progress',
    startDateMs: getWeekTimestamp(0, 1, 19, 0),
    endDateMs: getWeekTimestamp(0, 1, 22, 30),
    venue: 'Pallekele International Stadium, Kandy',
    team1: { name: 'Pakistan', short: 'PAK', score: '172/6 (20 ov)' },
    team2: { name: 'Sri Lanka', short: 'SL', score: '149/5 (17.2 ov)' },
  },
  {
    matchId: 810103,
    matchType: 'International',
    seriesName: 'Ashes Test Championship',
    matchDesc: '2nd Test',
    matchFormat: 'Test',
    status: 'Starts tomorrow at 10:00 local time',
    state: 'Preview',
    stateTitle: 'Upcoming',
    startDateMs: getWeekTimestamp(0, 3, 10, 0),
    endDateMs: getWeekTimestamp(0, 6, 17, 0),
    venue: 'Lord\'s Cricket Ground, London',
    team1: { name: 'England', short: 'ENG', score: 'Yet to bat' },
    team2: { name: 'Australia', short: 'AUS', score: 'Yet to bat' },
  },
  {
    matchId: 810104,
    matchType: 'International',
    seriesName: 'Women ODI Super League',
    matchDesc: '5th Match',
    matchFormat: 'ODI',
    status: 'Australia Women won by 3 wickets',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(0, 4, 15, 0),
    endDateMs: getWeekTimestamp(0, 4, 22, 30),
    venue: 'Sydney Cricket Ground, Sydney',
    team1: { name: 'South Africa Women', short: 'SAW', score: '244/8 (50 ov)' },
    team2: { name: 'Australia Women', short: 'AUSW', score: '245/7 (48.4 ov)' },
  },
  {
    matchId: 810105,
    matchType: 'International',
    seriesName: 'Caribbean T20 Cup',
    matchDesc: 'Final',
    matchFormat: 'T20',
    status: 'Match tied',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(0, 5, 18, 0),
    endDateMs: getWeekTimestamp(0, 5, 21, 45),
    venue: 'Kensington Oval, Bridgetown',
    team1: { name: 'New Zealand', short: 'NZ', score: '168/6 (20 ov)' },
    team2: { name: 'West Indies', short: 'WI', score: '168/8 (20 ov)' },
  },
]

const buildLastWeekMatches = () => [
  {
    matchId: 810201,
    matchType: 'International',
    seriesName: 'Asia Cup ODI 2026',
    matchDesc: 'Warm-up',
    matchFormat: 'ODI',
    status: 'Pakistan won by 2 wickets',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(-1, 0, 14, 30),
    endDateMs: getWeekTimestamp(-1, 0, 22, 20),
    venue: 'National Stadium, Karachi',
    team1: { name: 'India', short: 'IND', score: '276/9 (50 ov)' },
    team2: { name: 'Pakistan', short: 'PAK', score: '277/8 (49.4 ov)' },
  },
  {
    matchId: 810202,
    matchType: 'International',
    seriesName: 'Sri Lanka T20 Tri-Series',
    matchDesc: 'Match 1',
    matchFormat: 'T20',
    status: 'Sri Lanka won by 6 wickets',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(-1, 2, 19, 0),
    endDateMs: getWeekTimestamp(-1, 2, 22, 20),
    venue: 'R. Premadasa Stadium, Colombo',
    team1: { name: 'India', short: 'IND', score: '161/7 (20 ov)' },
    team2: { name: 'Sri Lanka', short: 'SL', score: '162/4 (18.5 ov)' },
  },
  {
    matchId: 810203,
    matchType: 'International',
    seriesName: 'Sri Lanka T20 Tri-Series',
    matchDesc: 'Match 2',
    matchFormat: 'T20',
    status: 'India won by 12 runs',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(-1, 3, 19, 0),
    endDateMs: getWeekTimestamp(-1, 3, 22, 20),
    venue: 'Pallekele International Stadium, Kandy',
    team1: { name: 'India', short: 'IND', score: '182/5 (20 ov)' },
    team2: { name: 'Sri Lanka', short: 'SL', score: '170/8 (20 ov)' },
  },
  {
    matchId: 810204,
    matchType: 'International',
    seriesName: 'Women\'s T20 Invitational',
    matchDesc: 'Match 3',
    matchFormat: 'T20',
    status: 'No result due to rain',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(-1, 4, 16, 30),
    endDateMs: getWeekTimestamp(-1, 4, 20, 0),
    venue: 'County Ground, Bristol',
    team1: { name: 'England Women', short: 'ENGW', score: '88/3 (11.2 ov)' },
    team2: { name: 'Sri Lanka Women', short: 'SLW', score: 'Yet to bat' },
  },
  {
    matchId: 810205,
    matchType: 'International',
    seriesName: 'Trans-Tasman Test Series',
    matchDesc: '1st Test',
    matchFormat: 'Test',
    status: 'Match drawn',
    state: 'Complete',
    stateTitle: 'Result',
    startDateMs: getWeekTimestamp(-1, 5, 10, 0),
    endDateMs: getWeekTimestamp(-1, 6, 17, 10),
    venue: 'Melbourne Cricket Ground, Melbourne',
    team1: { name: 'Australia', short: 'AUS', score: '389 & 202/4 decl' },
    team2: { name: 'New Zealand', short: 'NZ', score: '355 & 144/2' },
  },
]

const DEMO_TEAM_RANKINGS = {
  men: [
    { team: 'India', rating: 126, matches: 44 },
    { team: 'Australia', rating: 121, matches: 39 },
    { team: 'England', rating: 117, matches: 42 },
    { team: 'South Africa', rating: 113, matches: 37 },
    { team: 'New Zealand', rating: 111, matches: 36 },
    { team: 'Pakistan', rating: 109, matches: 40 },
    { team: 'Sri Lanka', rating: 101, matches: 38 },
    { team: 'West Indies', rating: 97, matches: 35 },
    { team: 'Bangladesh', rating: 92, matches: 39 },
    { team: 'Afghanistan', rating: 89, matches: 31 },
  ],
  women: [
    { team: 'Australia Women', rating: 132, matches: 35 },
    { team: 'England Women', rating: 124, matches: 33 },
    { team: 'India Women', rating: 121, matches: 34 },
    { team: 'South Africa Women', rating: 113, matches: 31 },
    { team: 'New Zealand Women', rating: 109, matches: 30 },
    { team: 'Sri Lanka Women', rating: 104, matches: 29 },
    { team: 'West Indies Women', rating: 98, matches: 28 },
    { team: 'Pakistan Women', rating: 95, matches: 27 },
    { team: 'Bangladesh Women', rating: 90, matches: 26 },
    { team: 'Ireland Women', rating: 84, matches: 24 },
  ],
}

const DEMO_PLAYER_POOLS = {
  men: {
    batsman: [
      { player: 'Virat Kohli', country: 'India', rating: 783 },
      { player: 'Babar Azam', country: 'Pakistan', rating: 774 },
      { player: 'Travis Head', country: 'Australia', rating: 761 },
      { player: 'Jos Buttler', country: 'England', rating: 744 },
      { player: 'Pathum Nissanka', country: 'Sri Lanka', rating: 731 },
      { player: 'Rassie van der Dussen', country: 'South Africa', rating: 724 },
    ],
    bowler: [
      { player: 'Rashid Khan', country: 'Afghanistan', rating: 721 },
      { player: 'Shaheen Afridi', country: 'Pakistan', rating: 706 },
      { player: 'Jasprit Bumrah', country: 'India', rating: 697 },
      { player: 'Adil Rashid', country: 'England', rating: 688 },
      { player: 'Maheesh Theekshana', country: 'Sri Lanka', rating: 674 },
      { player: 'Mitchell Starc', country: 'Australia', rating: 669 },
    ],
    allrounder: [
      { player: 'Shakib Al Hasan', country: 'Bangladesh', rating: 413 },
      { player: 'Hardik Pandya', country: 'India', rating: 398 },
      { player: 'Marcus Stoinis', country: 'Australia', rating: 389 },
      { player: 'Sam Curran', country: 'England', rating: 377 },
      { player: 'Wanindu Hasaranga', country: 'Sri Lanka', rating: 371 },
      { player: 'Aiden Markram', country: 'South Africa', rating: 360 },
    ],
  },
  women: {
    batsman: [
      { player: 'Smriti Mandhana', country: 'India', rating: 762 },
      { player: 'Beth Mooney', country: 'Australia', rating: 756 },
      { player: 'Nat Sciver-Brunt', country: 'England', rating: 744 },
      { player: 'Chamari Athapaththu', country: 'Sri Lanka', rating: 731 },
      { player: 'Laura Wolvaardt', country: 'South Africa', rating: 723 },
      { player: 'Sophie Devine', country: 'New Zealand', rating: 716 },
    ],
    bowler: [
      { player: 'Sophie Ecclestone', country: 'England', rating: 745 },
      { player: 'Megan Schutt', country: 'Australia', rating: 731 },
      { player: 'Deepti Sharma', country: 'India', rating: 719 },
      { player: 'Ayabonga Khaka', country: 'South Africa', rating: 703 },
      { player: 'Inoka Ranaweera', country: 'Sri Lanka', rating: 689 },
      { player: 'Amelia Kerr', country: 'New Zealand', rating: 681 },
    ],
    allrounder: [
      { player: 'Amelia Kerr', country: 'New Zealand', rating: 427 },
      { player: 'Hayley Matthews', country: 'West Indies', rating: 413 },
      { player: 'Nat Sciver-Brunt', country: 'England', rating: 408 },
      { player: 'Marizanne Kapp', country: 'South Africa', rating: 401 },
      { player: 'Chamari Athapaththu', country: 'Sri Lanka', rating: 392 },
      { player: 'Deepti Sharma', country: 'India', rating: 384 },
    ],
  },
}

const FORMAT_RATING_OFFSET = {
  t20: 0,
  odi: -7,
  test: -14,
}

const LIVE_DEMO_MATCH_ID = 890001

export const getDemoThisWeekMatchesPayload = () => {
  const bounds = getWeekBounds(new Date(), 0)

  return {
    ...bounds,
    matches: buildThisWeekMatches().map(cloneMatch),
  }
}

export const getDemoLastWeekMatchesPayload = () => {
  const bounds = getWeekBounds(new Date(), -1)

  return {
    ...bounds,
    matches: buildLastWeekMatches().map(cloneMatch),
  }
}

export const getDemoPointsMatches = () =>
  [...buildThisWeekMatches(), ...buildLastWeekMatches()]
    .map(cloneMatch)
    .sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0))

export const getDemoTeamRankings = ({ formatType = 't20', women = '0' } = {}) => {
  const genderKey = women === '1' ? 'women' : 'men'
  const offset = FORMAT_RATING_OFFSET[formatType] ?? 0

  return DEMO_TEAM_RANKINGS[genderKey]
    .map((row, index) => ({
      rank: index + 1,
      team: row.team,
      rating: Math.max(row.rating + offset, 1),
      matches: row.matches,
    }))
    .slice(0, 10)
}

export const getDemoPlayerRankings = ({ formatType = 't20', women = '0', roleType = 'batsman' } = {}) => {
  const genderKey = women === '1' ? 'women' : 'men'
  const selectedRole = DEMO_PLAYER_POOLS[genderKey][roleType] ? roleType : 'batsman'
  const offset = FORMAT_RATING_OFFSET[formatType] ?? 0

  return DEMO_PLAYER_POOLS[genderKey][selectedRole].map((row, index) => ({
    rank: index + 1,
    player: row.player,
    country: row.country,
    rating: Math.max(row.rating + offset, 1),
  }))
}

export const getDemoLiveMatchBundle = () => ({
  matchId: LIVE_DEMO_MATCH_ID,
  meta: {
    seriesname: 'Sri Lanka T20 Tri-Series',
    matchdesc: 'Match 4',
    venueinfo: {
      ground: 'Pallekele International Stadium',
      city: 'Kandy',
    },
    tossstatus: 'Sri Lanka won the toss and elected to field',
    status: 'Sri Lanka need 24 runs in 16 balls',
    state: 'Live',
    matchformat: 'T20',
    team1: {
      teamname: 'Pakistan',
      teamsname: 'PAK',
    },
    team2: {
      teamname: 'Sri Lanka',
      teamsname: 'SL',
    },
  },
  scorecard: {
    status: 'Sri Lanka need 24 runs in 16 balls',
    scorecard: [
      {
        inningsid: 1,
        batteamname: 'Pakistan',
        batteamsname: 'PAK',
        score: 172,
        wickets: 6,
        overs: 20,
        runrate: 8.6,
        ballnbr: 120,
        batsman: [],
        bowler: [],
        fow: { fow: [] },
      },
      {
        inningsid: 2,
        batteamname: 'Sri Lanka',
        batteamsname: 'SL',
        score: 149,
        wickets: 5,
        overs: 17.2,
        runrate: 8.6,
        ballnbr: 104,
        batsman: [],
        bowler: [],
        fow: { fow: [] },
      },
    ],
  },
})

export const getDemoCommentaryRows = (matchId = LIVE_DEMO_MATCH_ID) => {
  const now = Date.now()

  return [
    {
      id: Number(`${matchId}01`),
      over: '17.2',
      text: 'Four! Back-foot punch through cover. Sri Lanka keep the chase alive.',
      timestampMs: now - 1 * 60 * 1000,
    },
    {
      id: Number(`${matchId}02`),
      over: '17.1',
      text: 'Single to long-on. 24 needed from 16 deliveries.',
      timestampMs: now - 2 * 60 * 1000,
    },
    {
      id: Number(`${matchId}03`),
      over: '16.6',
      text: 'Wicket! Slower ball, miscued to deep mid-wicket.',
      timestampMs: now - 4 * 60 * 1000,
    },
    {
      id: Number(`${matchId}04`),
      over: '16.4',
      text: 'Two runs. Excellent running between the wickets.',
      timestampMs: now - 5 * 60 * 1000,
    },
    {
      id: Number(`${matchId}05`),
      over: '16.1',
      text: 'Driven hard, but straight to extra cover. Dot ball.',
      timestampMs: now - 6 * 60 * 1000,
    },
  ]
}
