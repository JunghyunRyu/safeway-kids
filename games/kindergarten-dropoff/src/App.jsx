import { useMemo, useState } from 'react';
import { START, JOURNEY, scenes, endings, parentType } from './data/cases.js';
import Gauges from './components/Gauges.jsx';

const clamp = (n) => Math.max(0, Math.min(100, n));

function applyDelta(g, delta) {
  return {
    mood: clamp(g.mood + (delta.mood || 0)),
    time: clamp(g.time + (delta.time || 0)),
    heart: clamp(g.heart + (delta.heart || 0)),
  };
}

function decideEnding(g) {
  if (g.time <= 12) return endings.late;
  if (g.mood >= 58) return endings.proud;
  return endings.cry;
}

export default function App() {
  const [phase, setPhase] = useState('title'); // title | scene | result | ending
  const [index, setIndex] = useState(0);
  const [gauges, setGauges] = useState(START);
  const [pending, setPending] = useState(null); // { result, delta }

  const scene = scenes[index];
  const progress = phase === 'ending' ? JOURNEY.length : index;

  const ending = useMemo(
    () => (phase === 'ending' ? decideEnding(gauges) : null),
    [phase, gauges]
  );

  function start() {
    setGauges(START);
    setIndex(0);
    setPending(null);
    setPhase('scene');
  }

  function choose(choice) {
    setGauges((g) => applyDelta(g, choice.delta));
    setPending({ result: choice.result, delta: choice.delta });
    setPhase('result');
  }

  function next() {
    if (index + 1 >= scenes.length) {
      setPhase('ending');
    } else {
      setIndex((i) => i + 1);
      setPending(null);
      setPhase('scene');
    }
  }

  return (
    <div className={`app phase-${phase}`}>
      <div className="sky" aria-hidden="true">
        <span className="sun">☀️</span>
        <span className="cloud c1">☁️</span>
        <span className="cloud c2">☁️</span>
      </div>

      <main className="stage">
        {phase === 'title' && <Title onStart={start} />}

        {(phase === 'scene' || phase === 'result') && (
          <>
            <TopBar progress={progress} place={scene.place} icon={scene.icon} />
            <Gauges gauges={gauges} flash={phase === 'result' ? pending?.delta : null} />
            {phase === 'scene' ? (
              <SceneCard scene={scene} onChoose={choose} />
            ) : (
              <ResultCard result={pending.result} onNext={next} last={index + 1 >= scenes.length} />
            )}
          </>
        )}

        {phase === 'ending' && (
          <EndingCard ending={ending} gauges={gauges} onReplay={start} />
        )}
      </main>

      <footer className="foot">정답은 없습니다. 매일 아침, 부모는 그 사이에서 저울질합니다.</footer>
    </div>
  );
}

function Title({ onStart }) {
  return (
    <section className="card title-card">
      <div className="emoji-big">🏫</div>
      <h1>
        유치원 등원<span className="sub-title">— 부모의 마음</span>
      </h1>
      <p className="lede">
        집 식탁부터 유치원 정문까지. 짧은 등원길에 벌어지는 아홉 가지 변수 앞에서
        당신은 매번 무언가를 고르고, 무언가를 내려놓습니다.
      </p>
      <ul className="legend">
        <li><b>😊 아이 기분</b> · 떼와 공감 사이</li>
        <li><b>⏰ 시간 여유</b> · 지각과 기다림 사이</li>
        <li><b>❤️ 안심</b> · 보내는 마음과 지키는 마음 사이</li>
      </ul>
      <button className="primary" onClick={onStart}>
        오늘 아침, 시작하기
      </button>
    </section>
  );
}

function TopBar({ progress, place, icon }) {
  return (
    <div className="topbar">
      <div className="path">
        {JOURNEY.map((step, i) => (
          <span key={i} className={`step ${i < progress ? 'done' : ''} ${i === progress ? 'now' : ''}`}>
            {step}
          </span>
        ))}
      </div>
      <div className="place">
        <span className="place-icon">{icon}</span> {place}
      </div>
    </div>
  );
}

function SceneCard({ scene, onChoose }) {
  return (
    <section className={`card scene-card ${scene.crisis ? 'crisis' : ''}`}>
      <div className="emoji-big">{scene.icon}</div>
      <h2>{scene.title}</h2>
      <p className="scene-text">{scene.scene}</p>
      <p className="inner">💭 {scene.inner}</p>
      <div className="choices">
        {scene.choices.map((c, i) => (
          <button key={i} className="choice" onClick={() => onChoose(c)}>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultCard({ result, onNext, last }) {
  return (
    <section className="card result-card">
      <p className="result-text">{result}</p>
      <button className="primary" onClick={onNext}>
        {last ? '유치원 정문으로 →' : '계속 가기 →'}
      </button>
    </section>
  );
}

function EndingCard({ ending, gauges, onReplay }) {
  const type = parentType(gauges);
  return (
    <section className="card ending-card">
      <div className="emoji-big">{ending.icon}</div>
      <h2>{ending.title}</h2>
      <p className="scene-text">{ending.scene}</p>
      <blockquote className="ending-line">{ending.line}</blockquote>

      <div className="final-gauges">
        <Gauges gauges={gauges} compact />
      </div>

      <div className="parent-type">
        <div className="pt-label">오늘의 당신은</div>
        <div className="pt-name">{type.name}</div>
        <div className="pt-desc">{type.desc}</div>
      </div>

      <button className="primary" onClick={onReplay}>
        다른 아침을 살아보기
      </button>
    </section>
  );
}
