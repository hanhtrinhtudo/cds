# ANALYTICS_APPS_SCRIPT_PATCH.gs

Paste this additively into the merged Auth + Persistence Apps Script project.

```javascript
const ANALYTICS_SHEET_ = "learning_events";
const ANALYTICS_API_VERSION_ = 1;
const ANALYTICS_SCHEMA_VERSION_ = 1;
const ANALYTICS_BUILD_ = "7.3-analytics-rc1";
const ANALYTICS_HEADERS_ = [
  "EventID","UserID","Username","FullName","Unit","Role","EventType","ResourceType","ResourceID","ResourceTitle",
  "Category","Score","ProgressPercent","DurationSeconds","Status","MetadataJSON","CreatedAt","ClientTime","SessionID","Device","AppVersion"
];
const ANALYTICS_ACTIONS_ = [
  "analytics.health","analytics.event.log","analytics.events.mine","analytics.events.adminList",
  "analytics.summary.admin","analytics.summary.user","analytics.summary.unit","analytics.peqi.user","analytics.peqi.unit"
];
const ANALYTICS_EVENT_TYPES_ = [
  "LOGIN","LOGOUT","APP_OPEN","TAB_OPEN","OPEN_TOPIC","OPEN_DOCUMENT","READ_PROGRESS","MARK_COMPLETE",
  "BOOKMARK_ADD","BOOKMARK_REMOVE","QUIZ_START","QUIZ_SUBMIT","REVIEW_OPEN","REVIEW_COMPLETE",
  "NEWS_VIEW","AI_OPEN","AI_PROMPT","AI_RESPONSE","PROFILE_OPEN","RESULTS_OPEN","ADMIN_OPEN","ADMIN_VIEW_USER","ADMIN_VIEW_REPORT"
];

function analyticsNowIso_() { return new Date().toISOString(); }
function analyticsJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function analyticsSafeJson_(value) {
  try { return JSON.stringify(value == null ? {} : value).slice(0, 5000); } catch (err) { return "{}"; }
}
function analyticsPayload_(e) {
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  try { return JSON.parse(raw || "{}"); } catch (err) { return {}; }
}
function analyticsSheet_() {
  var sheet = getOrCreateSheet_(ANALYTICS_SHEET_);
  ensureHeaders_(sheet, ANALYTICS_HEADERS_);
  return sheet;
}
function analyticsRows_() {
  return makeRowMap_(analyticsSheet_()).rows;
}
function analyticsRequireUser_(payload) {
  return requireAuthUser_(payload);
}
function analyticsIsAdmin_(user) {
  var role = String(user.role || user.Role || "").toLowerCase();
  return ["admin","chi-huy","chỉ huy","political_officer","officer","instructor"].indexOf(role) >= 0;
}
function analyticsAssertAdmin_(user) {
  if (!analyticsIsAdmin_(user)) throw new Error("FORBIDDEN");
}
function analyticsLimit_(value, fallback, max) {
  var n = Number(value || fallback);
  if (!isFinite(n) || n <= 0) n = fallback;
  return Math.min(n, max);
}
function analyticsEventId_() {
  return "event_" + Utilities.getUuid();
}
function analyticsUserField_(user, names) {
  for (var i = 0; i < names.length; i++) {
    if (user && user[names[i]] != null && String(user[names[i]]).trim()) return String(user[names[i]]).trim();
  }
  return "";
}
function analyticsEventMatchesRange_(row, range) {
  if (!range || range === "all") return true;
  var created = Date.parse(row.CreatedAt || row.createdAt || "");
  if (!created) return false;
  var days = range === "today" ? 1 : range === "30d" ? 30 : 7;
  return created >= Date.now() - days * 24 * 60 * 60 * 1000;
}
function analyticsFilterRows_(rows, payload, adminMode) {
  var limit = analyticsLimit_(payload.limit, 100, adminMode ? 500 : 200);
  var unit = String(payload.unit || "").toLowerCase();
  var eventType = String(payload.eventType || "");
  var query = String(payload.query || "").toLowerCase();
  var userId = String(payload.userId || "");
  return rows
    .filter(function(row) { return analyticsEventMatchesRange_(row, payload.range || "7d"); })
    .filter(function(row) { return !unit || String(row.Unit || "").toLowerCase().indexOf(unit) >= 0; })
    .filter(function(row) { return !eventType || String(row.EventType || "") === eventType; })
    .filter(function(row) { return !userId || String(row.UserID || "") === userId; })
    .filter(function(row) {
      if (!query) return true;
      return [row.Username,row.FullName,row.Unit,row.ResourceTitle,row.EventType].join(" ").toLowerCase().indexOf(query) >= 0;
    })
    .sort(function(a,b) { return Date.parse(b.CreatedAt || "") - Date.parse(a.CreatedAt || ""); })
    .slice(0, limit);
}
function analyticsSanitizeMetadata_(eventType, metadata) {
  var meta = metadata && typeof metadata === "object" ? Object.assign({}, metadata) : {};
  if (eventType === "AI_PROMPT" || eventType === "AI_RESPONSE") {
    delete meta.prompt; delete meta.question; delete meta.answer; delete meta.response; delete meta.content;
  }
  return meta;
}
function analyticsHealth_() {
  analyticsSheet_();
  return analyticsJson_({
    ok: true,
    service: "analytics",
    supportsAnalytics: true,
    apiVersion: ANALYTICS_API_VERSION_,
    schemaVersion: ANALYTICS_SCHEMA_VERSION_,
    build: ANALYTICS_BUILD_,
    sheetsReady: true,
    actions: ANALYTICS_ACTIONS_,
    eventTypes: ANALYTICS_EVENT_TYPES_,
    time: analyticsNowIso_()
  });
}
function analyticsEventLog_(user, payload) {
  var eventType = String(payload.eventType || "");
  if (ANALYTICS_EVENT_TYPES_.indexOf(eventType) < 0) throw new Error("INVALID_EVENT_TYPE");
  var eventId = String(payload.eventId || analyticsEventId_());
  var sheet = analyticsSheet_();
  var map = makeRowMap_(sheet);
  var existing = findRowByKey_(map.rows, { EventID: eventId });
  if (existing) return { ok: true, created: false, item: existing.row };
  var meta = analyticsSanitizeMetadata_(eventType, payload.metadata);
  var row = {
    EventID: eventId,
    UserID: analyticsUserField_(user, ["id","userId","UserID","ID"]),
    Username: analyticsUserField_(user, ["username","Username","account","email"]),
    FullName: analyticsUserField_(user, ["fullName","name","FullName","Name"]),
    Unit: analyticsUserField_(user, ["unit","unitId","organizationName","Unit","Đơn vị"]),
    Role: analyticsUserField_(user, ["role","Role"]),
    EventType: eventType,
    ResourceType: String(payload.resourceType || ""),
    ResourceID: String(payload.resourceId || ""),
    ResourceTitle: String(payload.resourceTitle || "").slice(0, 300),
    Category: String(payload.category || ""),
    Score: payload.score == null ? "" : Number(payload.score),
    ProgressPercent: payload.progressPercent == null ? "" : Number(payload.progressPercent),
    DurationSeconds: payload.durationSeconds == null ? "" : Number(payload.durationSeconds),
    Status: String(payload.status || ""),
    MetadataJSON: analyticsSafeJson_(meta),
    CreatedAt: analyticsNowIso_(),
    ClientTime: String(payload.clientTime || ""),
    SessionID: String(payload.sessionId || ""),
    Device: String(payload.device || "web"),
    AppVersion: String(payload.appVersion || "ptkv-static")
  };
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    sheet.appendRow(ANALYTICS_HEADERS_.map(function(h) { return row[h] == null ? "" : row[h]; }));
  } finally {
    lock.releaseLock();
  }
  return { ok: true, created: true, item: row };
}
function analyticsEventsMine_(user, payload) {
  var userId = analyticsUserField_(user, ["id","userId","UserID","ID"]);
  var rows = analyticsFilterRows_(analyticsRows_(), Object.assign({}, payload, { userId: userId }), false);
  return { ok: true, items: rows };
}
function analyticsEventsAdminList_(user, payload) {
  analyticsAssertAdmin_(user);
  return { ok: true, items: analyticsFilterRows_(analyticsRows_(), payload, true) };
}
function analyticsSummarize_(rows) {
  var users = {};
  var units = {};
  var todayRows = rows.filter(function(r) { return analyticsEventMatchesRange_(r, "today"); });
  rows.forEach(function(r) {
    var uid = String(r.UserID || "");
    if (uid) users[uid] = true;
    var unit = String(r.Unit || "Chưa xác định");
    units[unit] = units[unit] || { unit: unit, usersMap: {}, activeUsersMap: {}, completed: 0, scoreTotal: 0, scoreCount: 0, quizAttempts: 0 };
    if (uid) units[unit].usersMap[uid] = true;
    if (analyticsEventMatchesRange_(r, "7d") && uid) units[unit].activeUsersMap[uid] = true;
    if (r.EventType === "MARK_COMPLETE") units[unit].completed++;
    if (r.EventType === "QUIZ_SUBMIT") units[unit].quizAttempts++;
    if (r.Score !== "" && isFinite(Number(r.Score))) { units[unit].scoreTotal += Number(r.Score); units[unit].scoreCount++; }
  });
  var quizRows = rows.filter(function(r) { return r.EventType === "QUIZ_SUBMIT"; });
  var scoreRows = rows.filter(function(r) { return r.Score !== "" && isFinite(Number(r.Score)); });
  var averageScore = scoreRows.length ? Math.round(scoreRows.reduce(function(s,r){return s+Number(r.Score);},0) / scoreRows.length * 10) / 10 : 0;
  return {
    totalUsers: Object.keys(users).length,
    activeToday: Object.keys(todayRows.reduce(function(m,r){ if(r.UserID) m[r.UserID]=true; return m; }, {})).length,
    loggedInToday: todayRows.filter(function(r){return r.EventType === "LOGIN";}).length,
    learningToday: todayRows.filter(function(r){return ["OPEN_TOPIC","READ_PROGRESS","MARK_COMPLETE","QUIZ_SUBMIT"].indexOf(r.EventType)>=0;}).length,
    completedTopics: rows.filter(function(r){return r.EventType === "MARK_COMPLETE";}).length,
    quizSubmissions: quizRows.length,
    averageScore: averageScore,
    weakLearners: 0,
    units: Object.keys(units).map(function(k) {
      var u = units[k];
      return {
        unit: u.unit,
        users: Object.keys(u.usersMap).length,
        activeUsers: Object.keys(u.activeUsersMap).length,
        completionRate: u.usersMap ? Math.min(100, u.completed * 10) : 0,
        averageScore: u.scoreCount ? Math.round(u.scoreTotal / u.scoreCount * 10) / 10 : 0,
        peqiAverage: u.scoreCount ? Math.round(Math.min(100, (u.scoreTotal / u.scoreCount) * 10)) : 0
      };
    }),
    recentEvents: rows.slice(0, 20)
  };
}
function analyticsSummaryAdmin_(user, payload) {
  analyticsAssertAdmin_(user);
  return { ok: true, data: analyticsSummarize_(analyticsFilterRows_(analyticsRows_(), Object.assign({ limit: 500 }, payload), true)) };
}
function analyticsSummaryUser_(user, payload) {
  analyticsAssertAdmin_(user);
  var rows = analyticsFilterRows_(analyticsRows_(), { userId: payload.userId, range: payload.range || "30d", limit: 500 }, true);
  return { ok: true, data: analyticsSummarize_(rows) };
}
function analyticsSummaryUnit_(user, payload) {
  analyticsAssertAdmin_(user);
  var rows = analyticsFilterRows_(analyticsRows_(), { unit: payload.unit, range: payload.range || "30d", limit: 500 }, true);
  return { ok: true, data: analyticsSummarize_(rows) };
}
function analyticsPeqiFromRows_(rows) {
  var summary = analyticsSummarize_(rows);
  var completion = Math.min(100, (summary.completedTopics || 0) * 20);
  var score = Math.min(100, (summary.averageScore || 0) * 10);
  var consistency = Math.min(100, (summary.activeToday || 0) * 25);
  var review = Math.min(100, rows.filter(function(r){return r.EventType.indexOf("REVIEW") === 0;}).length * 20);
  var ai = Math.min(100, rows.filter(function(r){return r.EventType.indexOf("AI_") === 0;}).length * 10);
  var recent = rows.length ? 100 : 0;
  var total = Math.round(completion*.30 + score*.25 + consistency*.15 + review*.10 + ai*.10 + recent*.10);
  var flags = [];
  if (!rows.length) flags.push("NOT_LOGGED_IN_RECENTLY");
  if (completion < 40) flags.push("LOW_COMPLETION");
  if (score > 0 && score < 65) flags.push("LOW_SCORE");
  if (review === 0) flags.push("NO_REVIEW_ACTIVITY");
  var level = total >= 90 ? "Xuất sắc" : total >= 80 ? "Tốt" : total >= 65 ? "Đạt" : total >= 50 ? "Cần hỗ trợ" : "Nguy cơ thấp/chưa tham gia";
  return {
    score: total,
    level: level,
    factors: { completionRate: completion, quizExamScore: score, learningConsistency: consistency, reviewRetention: review, aiEngagement: ai, recentActivity: recent },
    riskFlags: flags,
    recommendation: flags.length ? "Cần chỉ huy theo dõi, giao nhiệm vụ học tập và nhắc ôn lại nội dung còn yếu." : "Tiếp tục duy trì nhịp học tập và ôn luyện định kỳ."
  };
}
function analyticsPeqiUser_(user, payload) {
  analyticsAssertAdmin_(user);
  var rows = analyticsFilterRows_(analyticsRows_(), { userId: payload.userId, range: payload.range || "30d", limit: 500 }, true);
  return { ok: true, data: analyticsPeqiFromRows_(rows) };
}
function analyticsPeqiUnit_(user, payload) {
  analyticsAssertAdmin_(user);
  var rows = analyticsFilterRows_(analyticsRows_(), { unit: payload.unit, range: payload.range || "30d", limit: 500 }, true);
  return { ok: true, data: analyticsPeqiFromRows_(rows) };
}
function handleAnalyticsAction_(action, e) {
  try {
    var payload = analyticsPayload_(e);
    if (action === "analytics.health") return analyticsHealth_();
    var user = analyticsRequireUser_(payload);
    var handlers = {
      "analytics.event.log": analyticsEventLog_,
      "analytics.events.mine": analyticsEventsMine_,
      "analytics.events.adminList": analyticsEventsAdminList_,
      "analytics.summary.admin": analyticsSummaryAdmin_,
      "analytics.summary.user": analyticsSummaryUser_,
      "analytics.summary.unit": analyticsSummaryUnit_,
      "analytics.peqi.user": analyticsPeqiUser_,
      "analytics.peqi.unit": analyticsPeqiUnit_
    };
    if (!handlers[action]) throw new Error("UNKNOWN_ANALYTICS_ACTION");
    return analyticsJson_(handlers[action](user, payload));
  } catch (err) {
    return analyticsJson_({ ok: false, error: String(err && err.message || "ANALYTICS_ERROR") });
  }
}
```

Dispatcher:

```javascript
if (/^(analytics\.health|analytics\.event\.|analytics\.events\.|analytics\.summary\.|analytics\.peqi\.)/.test(action)) {
  return handleAnalyticsAction_(action, e);
}
```

