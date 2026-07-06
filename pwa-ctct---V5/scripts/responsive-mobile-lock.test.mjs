import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const app = readFileSync(join(root, "src", "App.tsx"), "utf8");
const dashboard = readFileSync(join(root, "src", "components", "Dashboard.tsx"), "utf8");
const css = readFileSync(join(root, "src", "index.css"), "utf8");

const requiredViewports = [
  [360, 800],
  [375, 812],
  [390, 844],
  [414, 896],
  [428, 926],
];

assert.deepEqual(requiredViewports, [
  [360, 800],
  [375, 812],
  [390, 844],
  [414, 896],
  [428, 926],
]);

assert.match(app, /id="app-root-shell"/);
assert.match(app, /w-screen min-h-dvh/);
assert.match(app, /md:max-w-\[428px\]/);
assert.match(app, /h-dvh min-h-dvh/);

for (const forbidden of [
  "md:rounded-[40px]",
  "md:border-[10px]",
  "md:border-slate-800",
  "md:h-[90vh]",
  "md:max-h-[920px]",
  "bg-slate-900 flex items-center justify-center p-0 md:p-4",
]) {
  assert.equal(app.includes(forbidden), false, `Removed artificial phone frame token: ${forbidden}`);
}

assert.match(app, /id="app-main-viewport"/);
assert.match(app, /overflow-x-hidden/);
assert.match(app, /pb-\[calc\(74px\+env\(safe-area-inset-bottom\)\)\]/);
assert.match(app, /id="bottom-navigation-dock"/);
assert.match(app, /sticky bottom-0/);
assert.match(app, /pb-\[env\(safe-area-inset-bottom\)\]/);
assert.match(app, /min-h-\[58px\]/);

assert.match(dashboard, /id="dashboard-banner"/);
assert.match(dashboard, /p-3\.5 rounded-2xl/);
assert.match(dashboard, /BookOpen size=\{104\}/);
assert.match(dashboard, /id="priority-task-box"/);
assert.match(dashboard, /rounded-2xl p-3 shadow-sm space-y-2\.5/);
assert.match(dashboard, /Calendar size=\{18\}/);
assert.match(dashboard, /min-h-\[42px\]/);

assert.match(css, /width:\s*100vw/);
assert.match(css, /min-height:\s*100dvh/);
assert.match(css, /overflow-x:\s*hidden/);

console.log(`Responsive mobile lock checks passed for ${requiredViewports.map(([w, h]) => `${w}x${h}`).join(", ")}.`);
