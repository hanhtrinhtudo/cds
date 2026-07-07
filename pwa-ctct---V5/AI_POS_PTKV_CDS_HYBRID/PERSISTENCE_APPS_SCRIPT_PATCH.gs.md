# Persistence Apps Script Patch

Paste the source below into the existing authenticated Apps Script project. It is additive and does not replace `doGet`, `doPost`, login, register, news, exam, bank, or result handlers.

```javascript
const PERSISTENCE_SHEETS_ = {
  progress: "learning_progress",
  quizAttempts: "quiz_attempts",
  reviews: "review_history",
  bookmarks: "bookmarks"
};

const PERSISTENCE_HEADERS_ = {
  learning_progress: ["ProgressID","UserID","TopicID","Status","ProgressPercent","NeedReview","StartedAt","CompletedAt","LastAccessedAt","UpdatedAt","Version"],
  quiz_attempts: ["AttemptID","UserID","QuizType","TopicID","StartedAt","SubmittedAt","Score","Correct","Wrong","Skip","Total","AnswersJSON","Status","Device","CreatedAt"],
  review_history: ["ReviewID","AttemptID","UserID","SourceType","Title","SubmittedAt","Score","Total","Correct","Wrong","Skip","AnswersJSON","CreatedAt","UpdatedAt"],
  bookmarks: ["BookmarkID","UserID","ResourceType","ResourceID","Active","CreatedAt","UpdatedAt"]
};

const PROGRESS_STATUSES_ = ["NOT_STARTED","IN_PROGRESS","COMPLETED","NEED_REVIEW"];
const QUIZ_TYPES_ = ["practice","learningQuiz"];
const REVIEW_SOURCE_TYPES_ = ["practice","learningQuiz","mock","official"];
const BOOKMARK_RESOURCE_TYPES_ = ["learning_topic"];
const PERSISTENCE_API_VERSION_ = 1;
const PERSISTENCE_SCHEMA_VERSION_ = 1;
const PERSISTENCE_BUILD_ = "7.1A-rc1";
const PERSISTENCE_ACTIONS_ = [
  "persistence.health", "progress.get", "progress.upsert",
  "quizAttempt.save", "quizAttempt.listMine", "review.save",
  "review.listMine", "bookmark.list", "bookmark.toggle"
];
const PERSISTENCE_MIGRATION_ = {
  localRecoverySupported: true,
  requiresUserConfirmationForLegacyImport: true,
  migrationKeyPrefix: "ptkv_persistence_migration_"
};

function nowIso_() {
  return new Date().toISOString();
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeJsonStringify_(value) {
  try {
    const text = JSON.stringify(value == null ? null : value);
    if (text.length > 200000) throw new Error("PAYLOAD_TOO_LARGE");
    return text;
  } catch (error) {
    throw new Error("INVALID_JSON_DATA");
  }
}

function parseJsonPayload_(event) {
  let payload = {};
  if (event && event.postData && event.postData.contents) {
    try { payload = JSON.parse(event.postData.contents) || {}; }
    catch (error) { throw new Error("INVALID_REQUEST_JSON"); }
  }
  if (payload && payload.payload && typeof payload.payload === "object") {
    payload = Object.assign({}, payload, payload.payload);
    delete payload.payload;
  }
  const params = event && event.parameter ? event.parameter : {};
  return Object.assign({}, params, payload);
}

function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  ensureHeaders_(sheet, PERSISTENCE_HEADERS_[name]);
  return sheet;
}

function ensureHeaders_(sheet, requiredHeaders) {
  if (!requiredHeaders || !requiredHeaders.length) throw new Error("INVALID_SHEET_SCHEMA");
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
    : [];
  const normalized = {};
  current.forEach(function(header, index) {
    const key = String(header || "").trim().toLowerCase();
    if (key) normalized[key] = index + 1;
  });
  // Canonicalize matched header casing so downstream row objects stay stable.
  requiredHeaders.forEach(function(header) {
    const column = normalized[String(header).toLowerCase()];
    if (column && current[column - 1] !== header) {
      sheet.getRange(1, column).setValue(header);
      current[column - 1] = header;
    }
  });
  const missing = requiredHeaders.filter(function(header) {
    return !normalized[String(header).toLowerCase()];
  });
  if (!current.some(Boolean)) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else if (missing.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
}

function makeRowMap_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) return { headers: [], headerIndex: {}, rows: [] };
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function(value) { return String(value || "").trim(); });
  const headerIndex = {};
  headers.forEach(function(header, index) { headerIndex[header.toLowerCase()] = index; });
  const rows = values.slice(1).map(function(row, index) {
    const object = { _rowNumber: index + 2 };
    headers.forEach(function(header, column) { if (header) object[header] = row[column]; });
    return object;
  }).filter(function(row) {
    return headers.some(function(header) { return header && row[header] !== ""; });
  });
  return { headers: headers, headerIndex: headerIndex, rows: rows };
}

function findRowByKey_(rowMap, keyObject) {
  return rowMap.rows.find(function(row) {
    return Object.keys(keyObject).every(function(key) {
      return String(row[key] == null ? "" : row[key]) === String(keyObject[key] == null ? "" : keyObject[key]);
    });
  }) || null;
}

function persistenceToken_(event, payload) {
  return String((payload && (payload.token || payload.sessionToken || payload.session)) ||
    (event && event.parameter && (event.parameter.token || event.parameter.sessionToken)) || "").trim();
}

function requireAuthUser_(event, payload) {
  const token = persistenceToken_(event, payload);
  if (!token) throw new Error("AUTH_REQUIRED");

  // Connect exactly one of these adapters to the existing auth implementation.
  let user = null;
  if (typeof getUserByToken_ === "function") user = getUserByToken_(token);
  else if (typeof validateToken_ === "function") user = validateToken_(token);
  else if (typeof getSessionUser_ === "function") user = getSessionUser_(token);
  else throw new Error("AUTH_ADAPTER_NOT_CONFIGURED");

  const source = user && user.user ? user.user : user;
  const userId = source && (source.id || source.userId || source.UserID || source.username);
  if (!source || !userId) throw new Error("INVALID_SESSION");
  return {
    id: String(userId),
    username: String(source.username || source.Username || ""),
    name: String(source.name || source.fullName || source.Name || "")
  };
}

function persistenceInstall_() {
  Object.keys(PERSISTENCE_HEADERS_).forEach(function(name) { getOrCreateSheet_(name); });
}

function persistenceId_(prefix) {
  return prefix + "_" + Utilities.getUuid();
}

function validateEnum_(value, allowed, field) {
  const text = String(value || "");
  if (allowed.indexOf(text) < 0) throw new Error("INVALID_" + field.toUpperCase());
  return text;
}

function validateNumber_(value, field, min, max) {
  const number = Number(value);
  if (!isFinite(number) || number < min || (max != null && number > max)) {
    throw new Error("INVALID_" + field.toUpperCase());
  }
  return number;
}

function requireText_(value, field, maxLength) {
  const text = String(value == null ? "" : value).trim();
  if (!text || text.length > (maxLength || 500)) throw new Error("INVALID_" + field.toUpperCase());
  return text;
}

function toBoolean_(value) {
  return value === true || String(value).toLowerCase() === "true" || String(value) === "1";
}

function writeObjectRow_(sheet, rowNumber, object) {
  const rowMap = makeRowMap_(sheet);
  const values = rowMap.headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : "";
  });
  if (rowNumber) sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
}

function updateObjectRow_(sheet, rowNumber, existing, changes) {
  writeObjectRow_(sheet, rowNumber, Object.assign({}, existing, changes, { _rowNumber: undefined }));
}

function publicRow_(row) {
  const result = {};
  Object.keys(row || {}).forEach(function(key) { if (key !== "_rowNumber") result[key] = row[key]; });
  return result;
}

function limit_(payload) {
  const value = Number(payload.limit || 50);
  return Math.max(1, Math.min(isFinite(value) ? Math.floor(value) : 50, 200));
}

function progressGet_(user, payload) {
  const rows = makeRowMap_(getOrCreateSheet_(PERSISTENCE_SHEETS_.progress)).rows
    .filter(function(row) { return String(row.UserID) === user.id && (!payload.topicId || String(row.TopicID) === String(payload.topicId)); })
    .sort(function(a, b) { return String(b.UpdatedAt).localeCompare(String(a.UpdatedAt)); })
    .slice(0, limit_(payload)).map(publicRow_);
  return { ok: true, items: rows };
}

function progressUpsert_(user, payload) {
  const topicId = requireText_(payload.topicId || payload.TopicID, "topicId", 300);
  const status = validateEnum_(payload.status || payload.Status, PROGRESS_STATUSES_, "status");
  const percent = validateNumber_(payload.progressPercent == null ? payload.ProgressPercent : payload.progressPercent, "progressPercent", 0, 100);
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const sheet = getOrCreateSheet_(PERSISTENCE_SHEETS_.progress);
    const map = makeRowMap_(sheet);
    const existing = findRowByKey_(map, { UserID: user.id, TopicID: topicId });
    const now = nowIso_();
    if (existing) {
      const wasCompleted = String(existing.Status) === "COMPLETED";
      const explicitRegression = toBoolean_(payload.allowCompletionRegression);
      const finalStatus = wasCompleted && status !== "COMPLETED" && !explicitRegression ? "COMPLETED" : status;
      const finalPercent = finalStatus === "COMPLETED" && !explicitRegression ? Math.max(100, Number(existing.ProgressPercent || 0)) : percent;
      const changes = {
        Status: finalStatus,
        ProgressPercent: finalPercent,
        NeedReview: toBoolean_(payload.needReview),
        CompletedAt: finalStatus === "COMPLETED" ? (existing.CompletedAt || now) : "",
        LastAccessedAt: now,
        UpdatedAt: now,
        Version: Number(existing.Version || 0) + 1
      };
      updateObjectRow_(sheet, existing._rowNumber, existing, changes);
      return { ok: true, created: false, item: publicRow_(Object.assign({}, existing, changes)) };
    }
    const item = {
      ProgressID: persistenceId_("progress"), UserID: user.id, TopicID: topicId, Status: status,
      ProgressPercent: status === "COMPLETED" ? 100 : percent, NeedReview: toBoolean_(payload.needReview),
      StartedAt: payload.startedAt || now, CompletedAt: status === "COMPLETED" ? now : "",
      LastAccessedAt: now, UpdatedAt: now, Version: 1
    };
    writeObjectRow_(sheet, null, item);
    return { ok: true, created: true, item: item };
  } finally { lock.releaseLock(); }
}

function quizAttemptSave_(user, payload) {
  const attemptId = requireText_(payload.attemptId || payload.AttemptID, "attemptId", 300);
  const quizType = validateEnum_(payload.quizType || payload.QuizType, QUIZ_TYPES_, "quizType");
  const score = validateNumber_(payload.score, "score", 0, 10);
  const correct = validateNumber_(payload.correct, "correct", 0, null);
  const wrong = validateNumber_(payload.wrong, "wrong", 0, null);
  const skip = validateNumber_(payload.skip || 0, "skip", 0, null);
  const total = validateNumber_(payload.total, "total", 0, null);
  if (correct + wrong + skip !== total) throw new Error("INVALID_ATTEMPT_COUNTS");
  const lock = LockService.getDocumentLock(); lock.waitLock(20000);
  try {
    const sheet = getOrCreateSheet_(PERSISTENCE_SHEETS_.quizAttempts);
    const existing = findRowByKey_(makeRowMap_(sheet), { AttemptID: attemptId });
    if (existing) {
      if (String(existing.UserID) !== user.id) throw new Error("ATTEMPT_ID_CONFLICT");
      return { ok: true, created: false, item: publicRow_(existing) };
    }
    const now = nowIso_();
    const item = {
      AttemptID: attemptId, UserID: user.id, QuizType: quizType, TopicID: String(payload.topicId || ""),
      StartedAt: payload.startedAt || now, SubmittedAt: payload.submittedAt || now, Score: score,
      Correct: correct, Wrong: wrong, Skip: skip, Total: total,
      AnswersJSON: safeJsonStringify_(payload.answers || []), Status: "submitted",
      Device: String(payload.device || "").slice(0, 200), CreatedAt: now
    };
    writeObjectRow_(sheet, null, item);
    return { ok: true, created: true, item: item };
  } finally { lock.releaseLock(); }
}

function quizAttemptListMine_(user, payload) {
  const items = makeRowMap_(getOrCreateSheet_(PERSISTENCE_SHEETS_.quizAttempts)).rows
    .filter(function(row) { return String(row.UserID) === user.id; })
    .sort(function(a, b) { return String(b.SubmittedAt).localeCompare(String(a.SubmittedAt)); })
    .slice(0, limit_(payload)).map(publicRow_);
  return { ok: true, items: items };
}

function reviewSave_(user, payload) {
  const attemptId = requireText_(payload.attemptId || payload.AttemptID, "attemptId", 300);
  const sourceType = validateEnum_(payload.sourceType || payload.SourceType, REVIEW_SOURCE_TYPES_, "sourceType");
  const score = validateNumber_(payload.score, "score", 0, 10);
  const total = validateNumber_(payload.total, "total", 0, null);
  const correct = validateNumber_(payload.correct, "correct", 0, null);
  const wrong = validateNumber_(payload.wrong, "wrong", 0, null);
  const skip = validateNumber_(payload.skip || 0, "skip", 0, null);
  if (correct + wrong + skip !== total) throw new Error("INVALID_REVIEW_COUNTS");
  if (!payload.submittedAt) throw new Error("REVIEW_REQUIRES_SUBMISSION");
  const lock = LockService.getDocumentLock(); lock.waitLock(20000);
  try {
    const sheet = getOrCreateSheet_(PERSISTENCE_SHEETS_.reviews);
    const map = makeRowMap_(sheet);
    const existing = findRowByKey_(map, { UserID: user.id, AttemptID: attemptId });
    const now = nowIso_();
    const changes = {
      SourceType: sourceType, Title: String(payload.title || "").slice(0, 500), SubmittedAt: payload.submittedAt,
      Score: score, Total: total, Correct: correct, Wrong: wrong, Skip: skip,
      AnswersJSON: safeJsonStringify_(payload.answers || []), UpdatedAt: now
    };
    if (existing) {
      updateObjectRow_(sheet, existing._rowNumber, existing, changes);
      return { ok: true, created: false, item: publicRow_(Object.assign({}, existing, changes)) };
    }
    const item = Object.assign({ ReviewID: persistenceId_("review"), AttemptID: attemptId, UserID: user.id, CreatedAt: now }, changes);
    writeObjectRow_(sheet, null, item);
    return { ok: true, created: true, item: item };
  } finally { lock.releaseLock(); }
}

function reviewListMine_(user, payload) {
  const items = makeRowMap_(getOrCreateSheet_(PERSISTENCE_SHEETS_.reviews)).rows
    .filter(function(row) { return String(row.UserID) === user.id && (!payload.sourceType || String(row.SourceType) === String(payload.sourceType)); })
    .sort(function(a, b) { return String(b.SubmittedAt).localeCompare(String(a.SubmittedAt)); })
    .slice(0, limit_(payload)).map(function(row) {
      const item = publicRow_(row);
      try { item.answers = JSON.parse(String(item.AnswersJSON || "[]")); } catch (error) { item.answers = []; }
      delete item.AnswersJSON;
      return item;
    });
  return { ok: true, items: items };
}

function bookmarkList_(user, payload) {
  const items = makeRowMap_(getOrCreateSheet_(PERSISTENCE_SHEETS_.bookmarks)).rows
    .filter(function(row) { return String(row.UserID) === user.id && toBoolean_(row.Active); })
    .sort(function(a, b) { return String(b.UpdatedAt).localeCompare(String(a.UpdatedAt)); })
    .slice(0, limit_(payload)).map(publicRow_);
  return { ok: true, items: items };
}

function bookmarkToggle_(user, payload) {
  const resourceType = validateEnum_(payload.resourceType || payload.ResourceType, BOOKMARK_RESOURCE_TYPES_, "resourceType");
  const resourceId = requireText_(payload.resourceId || payload.ResourceID, "resourceId", 300);
  const desired = payload.active == null ? null : toBoolean_(payload.active);
  const lock = LockService.getDocumentLock(); lock.waitLock(20000);
  try {
    const sheet = getOrCreateSheet_(PERSISTENCE_SHEETS_.bookmarks);
    const map = makeRowMap_(sheet);
    const existing = findRowByKey_(map, { UserID: user.id, ResourceType: resourceType, ResourceID: resourceId });
    const now = nowIso_();
    if (existing) {
      const active = desired == null ? !toBoolean_(existing.Active) : desired;
      const changes = { Active: active, UpdatedAt: now };
      updateObjectRow_(sheet, existing._rowNumber, existing, changes);
      return { ok: true, created: false, item: publicRow_(Object.assign({}, existing, changes)) };
    }
    const item = { BookmarkID: persistenceId_("bookmark"), UserID: user.id, ResourceType: resourceType, ResourceID: resourceId, Active: desired == null ? true : desired, CreatedAt: now, UpdatedAt: now };
    writeObjectRow_(sheet, null, item);
    return { ok: true, created: true, item: item };
  } finally { lock.releaseLock(); }
}

function handlePersistenceAction_(action, event) {
  try {
    const payload = parseJsonPayload_(event);
    if (action === "persistence.health") {
      persistenceInstall_();
      return jsonResponse_({
        ok: true,
        service: "persistence",
        supportsPersistence: true,
        apiVersion: PERSISTENCE_API_VERSION_,
        schemaVersion: PERSISTENCE_SCHEMA_VERSION_,
        build: PERSISTENCE_BUILD_,
        sheetsReady: true,
        actions: PERSISTENCE_ACTIONS_,
        migration: PERSISTENCE_MIGRATION_,
        time: nowIso_()
      });
    }
    const user = requireAuthUser_(event, payload);
    const handlers = {
      "progress.get": progressGet_, "progress.upsert": progressUpsert_,
      "quizAttempt.save": quizAttemptSave_, "quizAttempt.listMine": quizAttemptListMine_,
      "review.save": reviewSave_, "review.listMine": reviewListMine_,
      "bookmark.list": bookmarkList_, "bookmark.toggle": bookmarkToggle_
    };
    if (!handlers[action]) throw new Error("UNKNOWN_PERSISTENCE_ACTION");
    return jsonResponse_(handlers[action](user, payload));
  } catch (error) {
    const code = String(error && error.message || "PERSISTENCE_ERROR");
    const allowed = ["AUTH_REQUIRED","INVALID_SESSION","AUTH_ADAPTER_NOT_CONFIGURED","INVALID_REQUEST_JSON","INVALID_JSON_DATA","PAYLOAD_TOO_LARGE","ATTEMPT_ID_CONFLICT","INVALID_ATTEMPT_COUNTS","INVALID_REVIEW_COUNTS","REVIEW_REQUIRES_SUBMISSION","UNKNOWN_PERSISTENCE_ACTION"];
    const safe = allowed.indexOf(code) >= 0 || /^INVALID_[A-Z_]+$/.test(code) ? code : "PERSISTENCE_ERROR";
    return jsonResponse_({ ok: false, error: safe });
  }
}
```

## Dispatcher integration

At the start of the existing `doGet` and `doPost` dispatcher, after computing `action`, add:

```javascript
if (/^(persistence\.health|progress\.|quizAttempt\.|review\.|bookmark\.)/.test(action)) {
  return handlePersistenceAction_(action, e);
}
```

`persistence.health` intentionally creates/verifies sheets without authentication. Every user-data action calls `requireAuthUser_`. Connect that helper to the existing token lookup function; never replace it with a client `userId` lookup.
