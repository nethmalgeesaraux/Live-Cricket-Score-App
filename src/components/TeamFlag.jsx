import React, { useMemo, useState } from 'react'
import { getTeamFlagUrl, getTeamInitials } from '../utils/teamFlags'

const TeamFlag = ({ name = '', size = 18, className = '' }) => {
  const [failed, setFailed] = useState(false)
  const flagUrl = useMemo(() => getTeamFlagUrl(name, Math.max(size * 2, 24)), [name, size])
  const height = Math.round(size * 0.72)

  if (!flagUrl || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-slate-200 text-[9px] font-semibold text-slate-600 ${className}`}
        style={{ width: size, height }}
        aria-label={`${name || 'Team'} flag`}
      >
        {getTeamInitials(name)}
      </span>
    )
  }

  return (
    <img
      src={flagUrl}
      alt={`${name || 'Team'} flag`}
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`inline-block rounded-sm object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

export default TeamFlag
