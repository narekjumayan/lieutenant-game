import { useMemo, useState } from "react";
import { chooseEnding, initialStats, scenes } from "./data/scenes";
import type { Choice, Ending, GameStats, Scene } from "./types";

const statKeys: Array<keyof GameStats> = [
  "suspicion",
  "authority",
  "humanity",
  "shame",
  "truth",
];

const statLabels: Record<keyof GameStats, string> = {
  suspicion: "Կասկած",
  authority: "Իշխանություն",
  humanity: "Մարդկայնություն",
  shame: "Ամոթ",
  truth: "Ճշմարտություն",
};

const sceneMap = new Map<string, Scene>(scenes.map((scene) => [scene.id, scene]));

function clampStat(value: number) {
  return Math.max(0, Math.min(12, value));
}

function applyEffects(stats: GameStats, effects: Partial<GameStats>): GameStats {
  return statKeys.reduce<GameStats>((nextStats, key) => {
    nextStats[key] = clampStat(stats[key] + (effects[key] ?? 0));
    return nextStats;
  }, { ...stats });
}

function effectText(effects: Partial<GameStats>) {
  return statKeys
    .filter((key) => effects[key])
    .map((key) => {
      const value = effects[key] ?? 0;
      const sign = value > 0 ? "+" : "";
      return `${statLabels[key]} ${sign}${value}`;
    })
    .join(" · ");
}

function App() {
  const [started, setStarted] = useState(false);
  const [sceneId, setSceneId] = useState("office-1");
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [lastConsequence, setLastConsequence] = useState<string>("");
  const [lastEffects, setLastEffects] = useState<string>("");
  const [visitedCount, setVisitedCount] = useState(1);

  const scene = sceneMap.get(sceneId) ?? scenes[0];

  const availableChoices = useMemo(
    () => scene.choices.filter((choice) => !choice.condition || choice.condition(stats)),
    [scene, stats]
  );

  const pressureLevel = Math.max(stats.suspicion, stats.shame);
  const visualClasses = [
    "game",
    `bg-${scene.background}`,
    stats.suspicion >= 7 ? "highSuspicion" : "",
    stats.shame >= 7 ? "highShame" : "",
    stats.authority >= 8 ? "coldAuthority" : "",
    pressureLevel >= 10 ? "breaking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleChoice(choice: Choice) {
    const nextStats = applyEffects(stats, choice.effects);
    setStats(nextStats);
    setLastConsequence(choice.consequence ?? "");
    setLastEffects(effectText(choice.effects));

    if (choice.nextScene === "ending") {
      setEnding(chooseEnding(nextStats));
      return;
    }

    setSceneId(choice.nextScene);
    setVisitedCount((count) => count + 1);
  }

  function restartGame() {
    setStarted(false);
    setSceneId("office-1");
    setStats(initialStats);
    setEnding(null);
    setLastConsequence("");
    setLastEffects("");
    setVisitedCount(1);
  }

  if (!started) {
    return (
      <main className="game bg-office startScreen">
        <div className="atmosphere" />
        <section className="startCard">
          <p className="eyebrow">հոգեբանական պատմողական խաղ</p>
          <h1>Լեյտենանտը</h1>
          <p className="startText">
            Գյուղական գործը թվում է պարզ․ ոչխար, մեղադրանք, ցուցմունք, դատարան։ Բայց այս պատմության մեջ
            իրական հարցաքննությունը սկսվում է այն պահին, երբ պաշտոն ունեցող մարդը վախենում է, որ իրեն կարող են ծիծաղել։
          </p>
          <p className="startNote">
            Դու չես խաղում պարզապես «չար» մարդու դերը։ Դու խաղում ես մարդու դերը, որը փորձում է չերևալ թույլ։
          </p>
          <button className="primaryButton" onClick={() => setStarted(true)}>
            Սկսել հարցաքննությունը
          </button>
        </section>
      </main>
    );
  }

  if (ending) {
    return (
      <main className="game bg-ending endingScreen">
        <div className="atmosphere" />
        <section className="endingCard">
          <p className="eyebrow">ավարտ</p>
          <h1>{ending.title}</h1>
          <h2>{ending.subtitle}</h2>
          <p>{ending.text}</p>

          <div className="finalStats" aria-label="Վերջնական ներքին վիճակներ">
            {statKeys.map((key) => (
              <div className="statLine" key={key}>
                <span>{statLabels[key]}</span>
                <meter min="0" max="12" value={stats[key]} />
                <strong>{stats[key]}</strong>
              </div>
            ))}
          </div>

          <button className="primaryButton" onClick={restartGame}>
            Սկսել նորից
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={visualClasses}>
      <div className="atmosphere" />
      {stats.suspicion >= 6 && (
        <div className="laughterFragments" aria-hidden="true">
          <span>ծիծաղ՞</span>
          <span>հիմա՞</span>
          <span>քո վրա՞</span>
        </div>
      )}

      <aside className="statsPanel" aria-label="Ներքին վիճակներ">
        {statKeys.map((key) => (
          <div className="compactStat" key={key} title={statLabels[key]}>
            <span>{statLabels[key]}</span>
            <i style={{ width: `${(stats[key] / 12) * 100}%` }} />
          </div>
        ))}
      </aside>

      <section className="narrativePanel">
        <div className="sceneMeta">
          <span>{scene.title}</span>
          <span>{scene.location}</span>
        </div>

        <h1>{scene.title}</h1>
        <p className="sceneText">{scene.text}</p>

        {scene.innerThought && (
          <p className="innerThought">
            <span>Ներքին ձայն․</span> {scene.innerThought}
          </p>
        )}

        {scene.pressureText && <p className="pressureText">{scene.pressureText}</p>}

        {(lastConsequence || lastEffects) && (
          <div className="consequenceBox">
            {lastConsequence && <p>{lastConsequence}</p>}
            {lastEffects && <small>{lastEffects}</small>}
          </div>
        )}

        <div className="choices" aria-label="Ընտրություններ">
          {availableChoices.map((choice, index) => (
            <button key={`${choice.text}-${index}`} onClick={() => handleChoice(choice)}>
              {choice.text}
            </button>
          ))}
        </div>

        <footer className="panelFooter">
          <span>Քայլ {visitedCount}</span>
          <button onClick={restartGame}>Վերսկսել</button>
        </footer>
      </section>
    </main>
  );
}

export default App;
