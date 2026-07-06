import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const engine = read("src/db/dbEngine.ts");
const server = read("server.ts");
const schema = read("schema.sql");
const packageJson = JSON.parse(read("package.json"));

assert.doesNotMatch(engine, /node:fs|db_store|mockData|readFileSync|writeFileSync|seedUsers|seedTopics/);
for (const repository of ["user", "unit", "learning", "quiz", "exam", "news", "notification", "report", "audit", "ai"]) {
  assert.match(engine, new RegExp(`${repository}Repository`), `Missing ${repository} repository delegation`);
}

const repositoryFiles = fs.readdirSync(new URL("../src/db/repositories", import.meta.url))
  .filter(file => file.endsWith(".ts"));
const repositorySource = repositoryFiles.map(file => read(`src/db/repositories/${file}`)).join("\n");
const usedTables = [...repositorySource.matchAll(/\.from\("([a-z_]+)"\)/g)].map(match => match[1]);
const schemaTables = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g)].map(match => match[1]);
for (const table of new Set(usedTables)) {
  assert.ok(schemaTables.includes(table), `Repository table is missing from schema.sql: ${table}`);
}

assert.match(server, /getAssignmentsForUser\(user\.id, user\.unitId\)/);
assert.match(server, /getQuizAttemptsForUser\(user\.id\)/);
assert.match(server, /getExamAttemptsForUser\(user\.id\)/);
assert.match(server, /addExamAnswers\(answerRows\)/);
assert.match(server, /markNotificationRead\(req\.params\.id, req\.user!\.id\)/);
assert.match(server, /app\.get\("\/api\/rankings", requireActiveUser/);
assert.doesNotMatch(server, /\(await getAuthUser\(req\)\)!/);

assert.equal(fs.existsSync(new URL("../db_store.json", import.meta.url)), false);
assert.equal(fs.existsSync(new URL("../src/data/mockData.ts", import.meta.url)), false);
assert.ok(packageJson.scripts["test:repositories"]);

console.log(`Supabase repository checks passed for ${new Set(usedTables).size} tables.`);
