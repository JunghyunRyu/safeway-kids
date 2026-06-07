const META = {
  mood: { icon: '😊', label: '아이 기분', color: '#ffb454' },
  time: { icon: '⏰', label: '시간 여유', color: '#5ec8e0' },
  heart: { icon: '❤️', label: '안심', color: '#ff7a85' },
};

function sign(n) {
  if (!n) return null;
  return n > 0 ? `+${n}` : `${n}`;
}

export default function Gauges({ gauges, flash, compact = false }) {
  return (
    <div className={`gauges ${compact ? 'compact' : ''}`}>
      {['mood', 'time', 'heart'].map((key) => {
        const m = META[key];
        const v = gauges[key];
        const d = flash ? flash[key] : 0;
        return (
          <div className="gauge" key={key}>
            <div className="gauge-head">
              <span className="gauge-icon">{m.icon}</span>
              {!compact && <span className="gauge-label">{m.label}</span>}
              {d ? (
                <span className={`gauge-delta ${d > 0 ? 'up' : 'down'}`}>{sign(d)}</span>
              ) : null}
            </div>
            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{ width: `${v}%`, background: m.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
