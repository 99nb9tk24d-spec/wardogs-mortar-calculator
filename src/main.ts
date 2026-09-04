import {
  nudge,
  parseNumber,
  parsePair,
  solve,
  type Cardinal,
} from "./math";
import { loadState, saveState, type Persisted } from "./storage";

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as T;
};

const gunX = $<HTMLInputElement>("gun-x");
const gunY = $<HTMLInputElement>("gun-y");
const tgtX = $<HTMLInputElement>("tgt-x");
const tgtY = $<HTMLInputElement>("tgt-y");
const lockBtn = $<HTMLButtonElement>("lock-gun");
const rangeEl = $("range");
const bearingEl = $("bearing");
const milsEl = $("mils");
const statusEl = $("status");
const installEl = $("install-hint");
const pad = $("nudge-pad");

const inputs = { gunX, gunY, tgtX, tgtY };

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function persist(): void {
  const state: Persisted = {
    gunX: gunX.value,
    gunY: gunY.value,
    tgtX: tgtX.value,
    tgtY: tgtY.value,
    gunLocked: lockBtn.getAttribute("aria-pressed") === "true",
    nudgeM: pad.dataset.step === "50" ? 50 : 10,
    installHintDismissed: installEl.hidden,
  };
  saveState(state);
}

function setLocked(locked: boolean): void {
  lockBtn.setAttribute("aria-pressed", String(locked));
  lockBtn.textContent = locked ? "LOCKED" : "LOCK";
  gunX.readOnly = locked;
  gunY.readOnly = locked;
  document.getElementById("gun-block")?.classList.toggle("locked", locked);
}

function setField(el: HTMLInputElement, value: number): void {
  el.value = String(value);
}

function currentCoords() {
  return {
    gunX: parseNumber(gunX.value),
    gunY: parseNumber(gunY.value),
    tgtX: parseNumber(tgtX.value),
    tgtY: parseNumber(tgtY.value),
  };
}

function render(): void {
  const c = currentCoords();
  const ready = c.gunX !== null && c.gunY !== null && c.tgtX !== null && c.tgtY !== null;

  if (!ready) {
    rangeEl.textContent = "—";
    bearingEl.textContent = "—";
    milsEl.textContent = "—";
    statusEl.textContent = "ENTER ALL FOUR COORDINATES";
    statusEl.dataset.kind = "wait";
    persist();
    return;
  }

  const sol = solve({
    gunX: c.gunX!,
    gunY: c.gunY!,
    tgtX: c.tgtX!,
    tgtY: c.tgtY!,
  });

  rangeEl.textContent = String(Math.round(sol.rangeM));
  bearingEl.textContent = sol.hud;

  if (sol.elevationMil === null) {
    milsEl.textContent = "—";
  } else {
    milsEl.textContent = String(Math.round(sol.elevationMil));
  }

  const labels: Record<typeof sol.status, string> = {
    incomplete: "ENTER ALL FOUR COORDINATES",
    zero: "SAME GRID — PICK A TARGET",
    close: "TOO CLOSE — MIN 132 m",
    ok: "IN RANGE · L81",
    far: "TOO FAR — MAX 684 m",
  };
  statusEl.textContent = labels[sol.status];
  statusEl.dataset.kind = sol.status;
  persist();
}

function pasteInto(
  xEl: HTMLInputElement,
  yEl: HTMLInputElement,
  text: string,
): boolean {
  const pair = parsePair(text);
  if (!pair) return false;
  setField(xEl, pair.x);
  setField(yEl, pair.y);
  render();
  return true;
}

async function pasteCoords(which: "gun" | "tgt"): Promise<void> {
  if (which === "gun" && lockBtn.getAttribute("aria-pressed") === "true") return;
  const xEl = which === "gun" ? gunX : tgtX;
  const yEl = which === "gun" ? gunY : tgtY;
  try {
    const text = await navigator.clipboard.readText();
    if (pasteInto(xEl, yEl, text)) return;
  } catch {
    /* permission */
  }
  const manual = window.prompt("Paste X Y (e.g. 87.45 102.31)");
  if (manual) pasteInto(xEl, yEl, manual);
}

function applyNudge(dir: Cardinal): void {
  const x = parseNumber(tgtX.value);
  const y = parseNumber(tgtY.value);
  if (x === null || y === null) return;
  const step = pad.dataset.step === "50" ? 50 : 10;
  const next = nudge(x, y, dir, step);
  setField(tgtX, next.x);
  setField(tgtY, next.y);
  render();
}

function restore(): void {
  const s = loadState();
  gunX.value = s.gunX;
  gunY.value = s.gunY;
  tgtX.value = s.tgtX;
  tgtY.value = s.tgtY;
  setLocked(s.gunLocked);
  pad.dataset.step = String(s.nudgeM);
  $("step-10").setAttribute("aria-pressed", String(s.nudgeM === 10));
  $("step-50").setAttribute("aria-pressed", String(s.nudgeM === 50));
  if (!s.installHintDismissed && !isStandalone()) {
    installEl.hidden = false;
  }
  render();
}

for (const el of Object.values(inputs)) {
  el.addEventListener("focus", () => el.select());
  el.addEventListener("input", render);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const order = [gunX, gunY, tgtX, tgtY];
      const i = order.indexOf(el);
      order[(i + 1) % order.length].focus();
    }
  });
}

lockBtn.addEventListener("click", () => {
  setLocked(lockBtn.getAttribute("aria-pressed") !== "true");
  persist();
});

$("paste-gun").addEventListener("click", () => void pasteIntoGun());
$("paste-tgt").addEventListener("click", () => void pasteCoords("tgt"));

function pasteIntoGun(): Promise<void> {
  return pasteCoords("gun");
}

$("swap").addEventListener("click", () => {
  const gx = gunX.value;
  const gy = gunY.value;
  if (lockBtn.getAttribute("aria-pressed") === "true") setLocked(false);
  gunX.value = tgtX.value;
  gunY.value = tgtY.value;
  tgtX.value = gx;
  tgtY.value = gy;
  render();
});

$("clear-tgt").addEventListener("click", () => {
  tgtX.value = "";
  tgtY.value = "";
  tgtX.focus();
  render();
});

$("step-10").addEventListener("click", () => {
  pad.dataset.step = "10";
  $("step-10").setAttribute("aria-pressed", "true");
  $("step-50").setAttribute("aria-pressed", "false");
  persist();
});
$("step-50").addEventListener("click", () => {
  pad.dataset.step = "50";
  $("step-10").setAttribute("aria-pressed", "false");
  $("step-50").setAttribute("aria-pressed", "true");
  persist();
});

pad.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-dir]");
  if (!btn) return;
  applyNudge(btn.dataset.dir as Cardinal);
});

$("dismiss-install").addEventListener("click", () => {
  installEl.hidden = true;
  persist();
});

bearingEl.addEventListener("click", async () => {
  const text = bearingEl.textContent;
  if (!text || text === "—") return;
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = `COPIED ${text}`;
    setTimeout(render, 900);
  } catch {
    /* ignore */
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

restore();
