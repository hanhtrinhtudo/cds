# Organization Apps Script Patch

Paste this patch into the existing Auth Apps Script project and route the listed actions from the existing `doGet` / `doPost` dispatcher. It is designed to preserve existing actions such as `register`, `login`, `me`, `admin_list_users`, `admin_set_role` and `admin_set_status`.

```javascript
const ORG_SHEETS = {
  organizations: "Organizations",
  aliases: "OrganizationAliases",
  userOrganizations: "UserOrganizations",
  audit: "OrganizationAudit",
  users: "Users"
};

const ORG_HEADERS = {
  Organizations: ["OrganizationID","ParentOrganizationID","Level","Path","Code","CanonicalName","DisplayName","ShortName","OrganizationType","ScopeLevel","Status","SortOrder","CreatedAt","UpdatedAt"],
  OrganizationAliases: ["Alias","NormalizedAlias","OrganizationID","Confidence","Status","CreatedAt","UpdatedAt"],
  UserOrganizations: ["UserID","OrganizationID","RoleInOrganization","IsPrimary","Status","CreatedAt","UpdatedAt"],
  OrganizationAudit: ["Time","ActorUserID","ActorUsername","Action","OrganizationID","DetailJSON"]
};

const ORG_SEED = [
  ["ORG_QK1","",1,"ORG_QK1","QK1","Quân khu 1","Quân khu 1","QK1","MILITARY_REGION","MILITARY_REGION","active",10],
  ["ORG_BCHQS_BN","ORG_QK1",2,"ORG_QK1/ORG_BCHQS_BN","BCHQS_BN","Bộ CHQS tỉnh Bắc Ninh","Bộ CHQS tỉnh Bắc Ninh","BCHQS Bắc Ninh","PROVINCIAL_COMMAND","PROVINCE","active",20],
  ["ORG_PTKV3","ORG_BCHQS_BN",3,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3","PTKV3","Ban Chỉ huy PTKV3","Ban Chỉ huy PTKV3","PTKV3","AREA_COMMAND","AREA","active",30],
  ["ORG_YENTHE","ORG_PTKV3",4,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE","YENTHE","Ban CHQS xã Yên Thế","Ban CHQS xã Yên Thế","Yên Thế","COMMUNE_COMMAND","COMMUNE","active",40],
  ["ORG_CHINHTRI","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_CHINHTRI","CHINHTRI","Phòng Chính trị","Phòng Chính trị","Chính trị","DEPARTMENT","DEPARTMENT","active",50],
  ["ORG_THAMMUU","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_THAMMUU","THAMMUU","Phòng Tham mưu","Phòng Tham mưu","Tham mưu","DEPARTMENT","DEPARTMENT","active",60],
  ["ORG_HCKT","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_HCKT","HCKT","Phòng HC-KT","Phòng HC-KT","HC-KT","DEPARTMENT","DEPARTMENT","active",70],
  ["ORG_BCHQS_XA","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_BCHQS_XA","BCHQS_XA","Ban CHQS xã Yên Thế","Ban CHQS xã Yên Thế","BCHQS xã","COMMUNE_COMMAND","COMMUNE","active",80],
  ["ORG_DQCD","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_DQCD","DQCD","Dân quân cơ động","Dân quân cơ động","DQCĐ","TEAM","TEAM","active",90],
  ["ORG_DQTV","ORG_YENTHE",5,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE/ORG_DQTV","DQTV","Dân quân tự vệ","Dân quân tự vệ","DQTV","TEAM","TEAM","active",100],
  ["ORG_TUDO","ORG_PTKV3",4,"ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_TUDO","TUDO","Tự do / Chưa xác định","Tự do / Chưa xác định","Tự do","CUSTOM","SELF","active",999]
];

const ORG_ALIAS_SEED = [
  ["Phòng HC-KT","ORG_HCKT",1],["Phòng HCKT","ORG_HCKT",1],["HCKT","ORG_HCKT",1],["HC-KT","ORG_HCKT",1],
  ["Phòng Hậu cần - Kỹ thuật","ORG_HCKT",0.98],["Phòng hậu cần kỹ thuật","ORG_HCKT",0.98],["Phòng Hậu Cần - Kỹ Thuật","ORG_HCKT",0.98],
  ["Phòng Hậu cần -KT","ORG_HCKT",0.96],["phòng hậu cần, kỹ thuật","ORG_HCKT",0.96],["Phòng hậu cần","ORG_HCKT",0.9],["Ban HC-KT","ORG_HCKT",0.9],
  ["Phòng Tham mưu","ORG_THAMMUU",1],["Phòng Tham Mưu","ORG_THAMMUU",1],["Phòng tham mưu","ORG_THAMMUU",1],["phong thammuu","ORG_THAMMUU",1],["thammuu","ORG_THAMMUU",1],["tham mưu","ORG_THAMMUU",1],["Tham mưu","ORG_THAMMUU",1],
  ["Phòng Chính trị","ORG_CHINHTRI",1],["Phòng chính trị","ORG_CHINHTRI",1],["phong chinh tri","ORG_CHINHTRI",1],["Chính trị","ORG_CHINHTRI",0.95],["chính trị","ORG_CHINHTRI",0.95],["CT","ORG_CHINHTRI",0.85],
  ["Ban CHQS xã Yên Thế","ORG_YENTHE",1],["Ban CHQS xã","ORG_YENTHE",0.9],["BCHQS xã Yên Thế","ORG_YENTHE",1],["Ban chỉ huy quân sự xã Yên Thế","ORG_YENTHE",1],
  ["Dân quân","ORG_DQTV",0.7],["Dân quân tự vệ","ORG_DQTV",1],["DQTV","ORG_DQTV",1],["Dân quân cơ động","ORG_DQCD",1],["DQCĐ","ORG_DQCD",1],["DQCD","ORG_DQCD",1]
];

function orgNormalize(value) {
  return String(value || "")
    .trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[–—_/.,;:()]+/g, " ").replace(/\s+/g, " ")
    .replace(/\bhc kt\b/g, "hckt").replace(/\bhau can ky thuat\b/g, "hckt")
    .replace(/\btham muu\b/g, "thammuu").replace(/\bchinh tri\b/g, "chinhtri")
    .trim();
}

function orgSheet(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const headers = ORG_HEADERS[name];
  if (headers && sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function orgRows(name) {
  const sh = orgSheet(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(r => r.some(Boolean)).map(row => {
    const o = {};
    headers.forEach((h, i) => o[h] = row[i]);
    return o;
  });
}

function orgAppendIfMissing(sheetName, keyHeaders, rowObject) {
  const sh = orgSheet(sheetName);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const rows = orgRows(sheetName);
  const exists = rows.some(r => keyHeaders.every(k => String(r[k]) === String(rowObject[k])));
  if (exists) return false;
  sh.appendRow(headers.map(h => rowObject[h] == null ? "" : rowObject[h]));
  return true;
}

function organization_install_seed() {
  Object.keys(ORG_HEADERS).forEach(orgSheet);
  const ts = new Date().toISOString();
  ORG_SEED.forEach(r => orgAppendIfMissing("Organizations", ["OrganizationID"], {
    OrganizationID:r[0], ParentOrganizationID:r[1], Level:r[2], Path:r[3], Code:r[4], CanonicalName:r[5], DisplayName:r[6], ShortName:r[7], OrganizationType:r[8], ScopeLevel:r[9], Status:r[10], SortOrder:r[11], CreatedAt:ts, UpdatedAt:ts
  }));
  ORG_ALIAS_SEED.forEach(r => orgAppendIfMissing("OrganizationAliases", ["NormalizedAlias"], {
    Alias:r[0], NormalizedAlias:orgNormalize(r[0]), OrganizationID:r[1], Confidence:r[2], Status:"active", CreatedAt:ts, UpdatedAt:ts
  }));
}

function orgListOrganizations(activeOnly) {
  organization_install_seed();
  return orgRows("Organizations").filter(r => !activeOnly || String(r.Status || "").toLowerCase() === "active");
}

function orgBuildTree() {
  const rows = orgListOrganizations(true).sort((a,b) => Number(a.SortOrder || 0) - Number(b.SortOrder || 0));
  const byId = {};
  rows.forEach(r => byId[r.OrganizationID] = Object.assign({}, r, { children: [] }));
  const roots = [];
  rows.forEach(r => {
    const node = byId[r.OrganizationID];
    const parent = byId[r.ParentOrganizationID];
    if (parent) parent.children.push(node); else roots.push(node);
  });
  return roots;
}

function organization_resolve_impl(input) {
  organization_install_seed();
  const normalized = orgNormalize(input);
  const orgs = orgListOrganizations(false);
  const exactOrg = orgs.find(o => orgNormalize(o.CanonicalName) === normalized || orgNormalize(o.DisplayName) === normalized || orgNormalize(o.Code) === normalized);
  if (exactOrg) return { organizationId: exactOrg.OrganizationID, canonicalName: exactOrg.CanonicalName, displayName: exactOrg.DisplayName, confidence: 1, source: "canonical", status: "resolved", originalInput: input };
  const alias = orgRows("OrganizationAliases").find(a => String(a.Status || "active") === "active" && String(a.NormalizedAlias) === normalized);
  const target = alias && orgs.find(o => o.OrganizationID === alias.OrganizationID);
  if (target) return { organizationId: target.OrganizationID, canonicalName: target.CanonicalName, displayName: target.DisplayName, confidence: Number(alias.Confidence || 0.9), source: "alias", status: "resolved", originalInput: input };
  const fallback = orgs.find(o => o.OrganizationID === "ORG_TUDO");
  return { organizationId: "ORG_TUDO", canonicalName: fallback ? fallback.CanonicalName : "Tự do / Chưa xác định", displayName: fallback ? fallback.DisplayName : "Tự do / Chưa xác định", confidence: 0, source: "fallback", status: "pending", originalInput: input };
}

function orgAudit(actor, action, organizationId, detail) {
  orgAppendIfMissing("OrganizationAudit", ["Time","Action","OrganizationID"], {
    Time:new Date().toISOString(), ActorUserID:actor && actor.id || "", ActorUsername:actor && actor.username || "", Action:action, OrganizationID:organizationId || "", DetailJSON:JSON.stringify(detail || {})
  });
}

function migrateUserOrganizations(actor) {
  organization_install_seed();
  const users = orgRows(ORG_SHEETS.users);
  const links = orgRows("UserOrganizations");
  let createdLinks = 0, skippedExisting = 0;
  const unresolved = {};
  users.forEach(u => {
    const userId = u.UserID || u.ID || u.id || u.username || u.Username || u["Tài khoản"];
    const unitText = u["Đơn vị"] || u.Unit || u.unit || u.donVi || "";
    if (!userId) return;
    const resolved = organization_resolve_impl(unitText);
    if (resolved.status !== "resolved") unresolved[unitText || "(trống)"] = true;
    const exists = links.some(l => String(l.UserID) === String(userId) && String(l.OrganizationID) === String(resolved.organizationId) && String(l.IsPrimary).toLowerCase() !== "false");
    if (exists) { skippedExisting++; return; }
    orgAppendIfMissing("UserOrganizations", ["UserID","OrganizationID","IsPrimary"], {
      UserID:userId, OrganizationID:resolved.organizationId, RoleInOrganization:u.Role || u.role || "member", IsPrimary:true, Status:"active", CreatedAt:new Date().toISOString(), UpdatedAt:new Date().toISOString()
    });
    createdLinks++;
  });
  const result = { ok:true, createdLinks, skippedExisting, unresolvedUnits:Object.keys(unresolved), message:"Đồng bộ tổ chức hoàn tất." };
  orgAudit(actor, "admin_migrate_user_organizations", "", result);
  return result;
}

function handleOrganizationAction(action, payload, actor) {
  if (action === "organization_tree") return { ok:true, tree:orgBuildTree(), organizations:orgListOrganizations(true) };
  if (action === "organization_search") {
    const q = orgNormalize(payload.query || payload.q || "");
    return { ok:true, items:orgListOrganizations(true).filter(o => orgNormalize([o.CanonicalName,o.ShortName,o.Code].join(" ")).indexOf(q) >= 0) };
  }
  if (action === "organization_resolve") return { ok:true, result:organization_resolve_impl(payload.input || payload.name || "") };
  if (action === "organization_alias_list") return { ok:true, items:orgRows("OrganizationAliases") };
  if (action === "organization_alias_add") {
    assertAdmin_(actor);
    const alias = payload.alias;
    const organizationId = payload.organizationId;
    const item = { Alias:alias, NormalizedAlias:orgNormalize(alias), OrganizationID:organizationId, Confidence:1, Status:"active", CreatedAt:new Date().toISOString(), UpdatedAt:new Date().toISOString() };
    orgAppendIfMissing("OrganizationAliases", ["NormalizedAlias"], item);
    orgAudit(actor, action, organizationId, item);
    return { ok:true, alias:item };
  }
  if (action === "organization_stats") {
    const users = orgRows(ORG_SHEETS.users);
    const links = orgRows("UserOrganizations");
    const items = orgListOrganizations(true).map(o => {
      const linked = links.filter(l => String(l.OrganizationID) === String(o.OrganizationID));
      return { organizationId:o.OrganizationID, memberCount:linked.length, activeCount:linked.length, pendingCount:0 };
    });
    return { ok:true, items };
  }
  if (action === "organization_members") {
    const orgId = payload.organizationId;
    const links = orgRows("UserOrganizations").filter(l => String(l.OrganizationID) === String(orgId));
    const users = orgRows(ORG_SHEETS.users);
    return { ok:true, items:links.map(l => users.find(u => String(u.UserID || u.ID || u.username || u["Tài khoản"]) === String(l.UserID))).filter(Boolean) };
  }
  if (action === "admin_migrate_user_organizations") {
    assertAdmin_(actor);
    return migrateUserOrganizations(actor);
  }
  if (action === "organization_merge") {
    assertAdmin_(actor);
    throw new Error("organization_merge cần quy trình phê duyệt dữ liệu trước khi bật trên production.");
  }
  return null;
}

// Add this to your existing dispatcher before the default unknown-action branch:
// const orgResult = handleOrganizationAction(action, payload, currentUser);
// if (orgResult) return json_(orgResult);
//
// Existing project helpers expected:
// - json_(object)
// - assertAdmin_(currentUser)
// - currentUser resolved from token for admin-only actions
```
