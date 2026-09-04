const KEY = "wd-mortar-v1";

export type Persisted = {
  gunX: string;
  gunY: string;
  tgtX: string;
  tgtY: string;
  gunLocked: boolean;
  nudgeM: 10 | 50;
  installHintDismissed: boolean;
};

const defaults: Persisted = {
  gunX: "",
  gunY: "",
  tgtX: "",
  tgtY: "",
  gunLocked: false,
  nudgeM: 10,
  installHintDismissed: false,
};

export function loadState(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function saveState(state: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}
