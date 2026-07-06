import assert from "node:assert/strict";
import fs from "node:fs";
import bcrypt from "bcryptjs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const server = read("server.ts");
const schema = read("schema.sql");
const seed = read("seed.sql");
const frontend = [
  read("src/services/apiClient.ts"),
  read("src/services/authService.ts"),
  read("src/components/Auth.tsx")
].join("\n");
const userRepository = read("src/db/repositories/userRepository.ts");

assert.match(schema, /CREATE TABLE IF NOT EXISTS users\s*\(/);
assert.match(schema, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
assert.match(schema, /unit_id UUID REFERENCES units\(id\)/);
assert.match(schema, /password_hash TEXT NOT NULL/);
assert.match(schema, /account_status TEXT NOT NULL DEFAULT 'pending' CHECK/);
assert.match(schema, /must_change_password BOOLEAN NOT NULL DEFAULT false/);
assert.doesNotMatch(schema, /users_profile/);

assert.match(server, /bcrypt\.hash\(password, 12\)/);
assert.match(server, /bcrypt\.compare\(password, authUser\.passwordHash\)/);
assert.match(server, /jwt\.sign\(/);
assert.match(server, /jwt\.verify\(/);
assert.match(server, /algorithms: \["HS256"\]/);
assert.match(server, /accountStatus: user\.accountStatus/);
assert.match(server, /expiresIn: JWT_EXPIRES_IN/);
assert.match(server, /const JWT_EXPIRES_IN = "7d"/);
assert.match(server, /req\.user =/);
assert.match(server, /\/api\/users\/:id\/reactivate/);
assert.match(server, /\/api\/users\/:id\/reset-password/);
assert.match(server, /\/api\/users\/:id\/change-role/);
assert.doesNotMatch(server, /dev-only-change-me-jwt-secret/);
assert.doesNotMatch(`${server}\n${frontend}`, /supabase\.auth|auth\.admin/);
assert.doesNotMatch(frontend, /SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET/);
assert.match(userRepository, /const USER_COLUMNS = "id,full_name,email,phone,unit_id,role,account_status,must_change_password,created_at,updated_at,last_login_at"/);
assert.doesNotMatch(userRepository.match(/const USER_COLUMNS = ([^;]+)/)?.[1] || "", /password_hash/);

const adminHash = seed.match(/'admin@example\.com'.*?'(\$2[aby]\$[^']+)'/s)?.[1];
const demoHash = seed.match(/'cuong@example\.com'.*?'(\$2[aby]\$[^']+)'/s)?.[1];
assert.ok(adminHash && await bcrypt.compare("Admin@123456", adminHash));
assert.ok(demoHash && await bcrypt.compare("Demo@123456", demoHash));

for (const account of ["admin@example.com", "cuong@example.com", "instructor@example.com", "member@example.com"]) {
  assert.ok(seed.includes(`'${account}'`), `Missing seed account: ${account}`);
}

console.log("App-managed auth checks passed.");
