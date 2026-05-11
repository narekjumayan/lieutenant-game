export type GameStats = {
  suspicion: number;
  authority: number;
  humanity: number;
  shame: number;
  truth: number;
};

export type Choice = {
  text: string;
  nextScene: string;
  effects: Partial<GameStats>;
  condition?: (stats: GameStats) => boolean;
  consequence?: string;
};

export type Scene = {
  id: string;
  title: string;
  location: string;
  background: "office" | "interrogation" | "general" | "report" | "court" | "ending";
  text: string;
  innerThought?: string;
  pressureText?: string;
  choices: Choice[];
};

export type Ending = {
  id: string;
  title: string;
  subtitle: string;
  text: string;
};
