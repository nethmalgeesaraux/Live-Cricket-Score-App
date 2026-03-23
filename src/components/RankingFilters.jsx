import React from 'react'

const RankingFilters = ({ formatType, women, onFormatChange, onWomenChange, disabled }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
        {['t20', 'odi', 'test'].map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onFormatChange(format)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-full transition ${
              formatType === format
                ? 'bg-violet-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onWomenChange('0')}
          disabled={disabled}
          className={`px-3 py-1 text-xs rounded-full transition ${
            women === '0' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          Men
        </button>
        <button
          type="button"
          onClick={() => onWomenChange('1')}
          disabled={disabled}
          className={`px-3 py-1 text-xs rounded-full transition ${
            women === '1' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          Women
        </button>
      </div>
    </div>
  )
}

export default RankingFilters
