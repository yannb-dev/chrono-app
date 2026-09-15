export type UserRegister = {
  id: string;
  email: string;
};

export type UserLogin = {
  token: string;
};

export type TimerRunner = {
  id: string;
  numberRunner: number;
  endedAt: string;
  duration: number;
  seanceId: string;
};

export type TimerPause = {
  id: string;
  pausedAt: string;
  endedAt: string | null;
  pauseDurationMs: number | null;
  seanceId: string;
  userId: string;
};

export type SeanceResponse = {
  totalRunner: number;
  colorRunner: string;
  id: string;
  createdAt: Date;
  startedAt: Date | null;
  state: string;
  userId: string;
  timerRunners: TimerRunner[];
  timerpauses: TimerPause[];
};
