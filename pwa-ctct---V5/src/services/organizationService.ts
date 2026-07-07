import { apiClient } from "./apiClient";
import { isLegacyAppsScriptAuthMode } from "./authService";
import {
  Organization,
  OrganizationAlias,
  OrganizationMigrationResult,
  OrganizationResolveResult,
  OrganizationStats,
  OrganizationTreeNode
} from "../types/organization";

type LegacyOrganizationAction =
  | "organization_tree"
  | "organization_search"
  | "organization_resolve"
  | "organization_alias_list"
  | "organization_alias_add"
  | "organization_merge"
  | "organization_members"
  | "organization_stats"
  | "admin_migrate_user_organizations";

const env = (key: string): string => String((import.meta as any).env?.[key] || "").trim();
const authApiUrl = () => env("VITE_LEGACY_AUTH_API_URL") || env("VITE_LEGACY_CDS_API_URL");
const now = "2026-07-07T00:00:00.000Z";

export const normalizeOrganizationAlias = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[–—_/.,;:()]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bphong\b/g, "phong")
    .replace(/\bhc kt\b/g, "hckt")
    .replace(/\bhau can ky thuat\b/g, "hckt")
    .replace(/\btham muu\b/g, "thammuu")
    .replace(/\bchinh tri\b/g, "chinhtri")
    .trim();

const org = (
  organizationId: string,
  parentOrganizationId: string,
  level: number,
  code: string,
  canonicalName: string,
  shortName: string,
  organizationType: Organization["organizationType"],
  scopeLevel: Organization["scopeLevel"],
  sortOrder: number
): Organization => ({
  organizationId,
  parentOrganizationId,
  level,
  path: parentOrganizationId
    ? `${DEFAULT_ORGANIZATION_PATHS[parentOrganizationId] || parentOrganizationId}/${organizationId}`
    : organizationId,
  code,
  canonicalName,
  displayName: canonicalName,
  shortName,
  organizationType,
  scopeLevel,
  status: "active",
  sortOrder,
  createdAt: now,
  updatedAt: now
});

const DEFAULT_ORGANIZATION_PATHS: Record<string, string> = {
  ORG_QK1: "ORG_QK1",
  ORG_BCHQS_BN: "ORG_QK1/ORG_BCHQS_BN",
  ORG_PTKV3: "ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3",
  ORG_YENTHE: "ORG_QK1/ORG_BCHQS_BN/ORG_PTKV3/ORG_YENTHE"
};

export const DEFAULT_ORGANIZATIONS: Organization[] = [
  org("ORG_QK1", "", 1, "QK1", "Quân khu 1", "QK1", "MILITARY_REGION", "MILITARY_REGION", 10),
  org("ORG_BCHQS_BN", "ORG_QK1", 2, "BCHQS_BN", "Bộ CHQS tỉnh Bắc Ninh", "BCHQS Bắc Ninh", "PROVINCIAL_COMMAND", "PROVINCE", 20),
  org("ORG_PTKV3", "ORG_BCHQS_BN", 3, "PTKV3", "Ban Chỉ huy PTKV3", "PTKV3", "AREA_COMMAND", "AREA", 30),
  org("ORG_YENTHE", "ORG_PTKV3", 4, "YENTHE", "Ban CHQS xã Yên Thế", "Yên Thế", "COMMUNE_COMMAND", "COMMUNE", 40),
  org("ORG_CHINHTRI", "ORG_YENTHE", 5, "CHINHTRI", "Phòng Chính trị", "Chính trị", "DEPARTMENT", "DEPARTMENT", 50),
  org("ORG_THAMMUU", "ORG_YENTHE", 5, "THAMMUU", "Phòng Tham mưu", "Tham mưu", "DEPARTMENT", "DEPARTMENT", 60),
  org("ORG_HCKT", "ORG_YENTHE", 5, "HCKT", "Phòng HC-KT", "HC-KT", "DEPARTMENT", "DEPARTMENT", 70),
  org("ORG_BCHQS_XA", "ORG_YENTHE", 5, "BCHQS_XA", "Ban CHQS xã Yên Thế", "BCHQS xã", "COMMUNE_COMMAND", "COMMUNE", 80),
  org("ORG_DQCD", "ORG_YENTHE", 5, "DQCD", "Dân quân cơ động", "DQCĐ", "TEAM", "TEAM", 90),
  org("ORG_DQTV", "ORG_YENTHE", 5, "DQTV", "Dân quân tự vệ", "DQTV", "TEAM", "TEAM", 100),
  org("ORG_TUDO", "ORG_PTKV3", 4, "TUDO", "Tự do / Chưa xác định", "Tự do", "CUSTOM", "SELF", 999)
];

const aliasPairs: Array<[string, string, number]> = [
  ["Phòng HC-KT", "ORG_HCKT", 1],
  ["Phòng HCKT", "ORG_HCKT", 1],
  ["HCKT", "ORG_HCKT", 1],
  ["HC-KT", "ORG_HCKT", 1],
  ["Phòng Hậu cần - Kỹ thuật", "ORG_HCKT", 0.98],
  ["Phòng hậu cần kỹ thuật", "ORG_HCKT", 0.98],
  ["Phòng Hậu Cần - Kỹ Thuật", "ORG_HCKT", 0.98],
  ["Phòng Hậu cần -KT", "ORG_HCKT", 0.96],
  ["phòng hậu cần, kỹ thuật", "ORG_HCKT", 0.96],
  ["Phòng hậu cần", "ORG_HCKT", 0.9],
  ["Ban HC-KT", "ORG_HCKT", 0.9],
  ["Phòng Tham mưu", "ORG_THAMMUU", 1],
  ["Phòng Tham Mưu", "ORG_THAMMUU", 1],
  ["Phòng tham mưu", "ORG_THAMMUU", 1],
  ["phong thammuu", "ORG_THAMMUU", 1],
  ["thammuu", "ORG_THAMMUU", 1],
  ["tham mưu", "ORG_THAMMUU", 1],
  ["Tham mưu", "ORG_THAMMUU", 1],
  ["Phòng Chính trị", "ORG_CHINHTRI", 1],
  ["Phòng chính trị", "ORG_CHINHTRI", 1],
  ["phong chinh tri", "ORG_CHINHTRI", 1],
  ["Chính trị", "ORG_CHINHTRI", 0.95],
  ["chính trị", "ORG_CHINHTRI", 0.95],
  ["CT", "ORG_CHINHTRI", 0.85],
  ["Ban CHQS xã Yên Thế", "ORG_YENTHE", 1],
  ["Ban CHQS xã", "ORG_YENTHE", 0.9],
  ["BCHQS xã Yên Thế", "ORG_YENTHE", 1],
  ["Ban chỉ huy quân sự xã Yên Thế", "ORG_YENTHE", 1],
  ["Dân quân", "ORG_DQTV", 0.7],
  ["Dân quân tự vệ", "ORG_DQTV", 1],
  ["DQTV", "ORG_DQTV", 1],
  ["Dân quân cơ động", "ORG_DQCD", 1],
  ["DQCĐ", "ORG_DQCD", 1],
  ["DQCD", "ORG_DQCD", 1]
];

export const DEFAULT_ORGANIZATION_ALIASES: OrganizationAlias[] = aliasPairs.map(([alias, organizationId, confidence]) => ({
  alias,
  normalizedAlias: normalizeOrganizationAlias(alias),
  organizationId,
  confidence,
  status: "active",
  createdAt: now,
  updatedAt: now
}));

export const buildOrganizationTree = (organizations: Organization[] = DEFAULT_ORGANIZATIONS): OrganizationTreeNode[] => {
  const nodes = new Map<string, OrganizationTreeNode>();
  organizations
    .filter(item => item.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach(item => nodes.set(item.organizationId, { ...item, children: [] }));

  const roots: OrganizationTreeNode[] = [];
  nodes.forEach(node => {
    const parent = node.parentOrganizationId ? nodes.get(node.parentOrganizationId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
};

export const flattenOrganizationTree = (tree: OrganizationTreeNode[]): OrganizationTreeNode[] =>
  tree.flatMap(node => [node, ...flattenOrganizationTree(node.children || [])]);

export const resolveOrganizationLocally = (name: string): OrganizationResolveResult => {
  const normalized = normalizeOrganizationAlias(name);
  const exactOrg = DEFAULT_ORGANIZATIONS.find(item => normalizeOrganizationAlias(item.canonicalName) === normalized);
  const alias = DEFAULT_ORGANIZATION_ALIASES.find(item => item.normalizedAlias === normalized);
  const target = exactOrg || DEFAULT_ORGANIZATIONS.find(item => item.organizationId === alias?.organizationId);

  if (target) {
    return {
      organizationId: target.organizationId,
      canonicalName: target.canonicalName,
      displayName: target.displayName,
      confidence: exactOrg ? 1 : alias?.confidence || 0.9,
      source: exactOrg ? "canonical" : "alias",
      status: "resolved",
      originalInput: name
    };
  }

  const fallback = DEFAULT_ORGANIZATIONS.find(item => item.organizationId === "ORG_TUDO")!;
  return {
    organizationId: fallback.organizationId,
    canonicalName: fallback.canonicalName,
    displayName: fallback.displayName,
    confidence: 0,
    source: "fallback",
    status: "pending",
    originalInput: name
  };
};

const legacyRequest = async <T>(action: LegacyOrganizationAction, payload: Record<string, unknown> = {}): Promise<T> => {
  const base = authApiUrl();
  if (!base) throw new Error("Thiếu VITE_LEGACY_AUTH_API_URL cho quản lý tổ chức.");

  const response = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: apiClient.getAuthToken(), ...payload })
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok || json?.ok === false || json?.success === false || json?.error) {
    throw new Error(json?.error || json?.message || `Tác vụ tổ chức ${action} chưa sẵn sàng.`);
  }
  return (json?.data ?? json) as T;
};

const listFromPayload = <T>(payload: any, keys: string[]): T[] => {
  for (const key of keys) {
    const value = key.split(".").reduce((obj, part) => obj?.[part], payload);
    if (Array.isArray(value)) return value as T[];
  }
  return Array.isArray(payload) ? payload as T[] : [];
};

export const organizationService = {
  async getOrganizationTree(): Promise<OrganizationTreeNode[]> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        const payload = await legacyRequest<any>("organization_tree");
        const tree = listFromPayload<OrganizationTreeNode>(payload, ["tree", "items", "organizations", "data.tree"]);
        if (tree.length && "children" in tree[0]) return tree;
        const orgs = listFromPayload<Organization>(payload, ["organizations", "items", "data.organizations"]);
        if (orgs.length) return buildOrganizationTree(orgs);
      } catch (error) {
        if ((import.meta as any).env?.DEV) console.warn("[organizationService] Using local organization tree fallback:", error);
      }
      return buildOrganizationTree();
    }
    return apiClient.get<OrganizationTreeNode[]>("/api/organizations/tree");
  },

  async searchOrganizations(query: string): Promise<Organization[]> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        const payload = await legacyRequest<any>("organization_search", { query });
        return listFromPayload<Organization>(payload, ["items", "organizations", "data.items"]);
      } catch {
        const normalized = normalizeOrganizationAlias(query);
        return DEFAULT_ORGANIZATIONS.filter(item =>
          normalizeOrganizationAlias(`${item.canonicalName} ${item.shortName} ${item.code}`).includes(normalized)
        );
      }
    }
    return apiClient.get<Organization[]>(`/api/organizations/search?q=${encodeURIComponent(query)}`);
  },

  async resolveOrganization(name: string): Promise<OrganizationResolveResult> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        const payload = await legacyRequest<any>("organization_resolve", { input: name, name });
        return (payload?.result || payload) as OrganizationResolveResult;
      } catch {
        return resolveOrganizationLocally(name);
      }
    }
    return apiClient.post<OrganizationResolveResult>("/api/organizations/resolve", { name });
  },

  async getOrganizationMembers(organizationId: string, includeDescendants = true): Promise<any[]> {
    if (isLegacyAppsScriptAuthMode()) {
      const payload = await legacyRequest<any>("organization_members", { organizationId, includeDescendants });
      return listFromPayload<any>(payload, ["items", "members", "users", "data.items"]);
    }
    return apiClient.get<any[]>(`/api/organizations/${organizationId}/members?includeDescendants=${includeDescendants}`);
  },

  async getOrganizationStats(): Promise<OrganizationStats[]> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        const payload = await legacyRequest<any>("organization_stats");
        return listFromPayload<OrganizationStats>(payload, ["items", "stats", "data.items"]);
      } catch {
        return DEFAULT_ORGANIZATIONS.map(item => ({
          organizationId: item.organizationId,
          memberCount: 0,
          activeCount: 0,
          pendingCount: 0,
          childCount: DEFAULT_ORGANIZATIONS.filter(child => child.parentOrganizationId === item.organizationId).length
        }));
      }
    }
    return apiClient.get<OrganizationStats[]>("/api/organizations/stats");
  },

  async listAliases(): Promise<OrganizationAlias[]> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        const payload = await legacyRequest<any>("organization_alias_list");
        return listFromPayload<OrganizationAlias>(payload, ["items", "aliases", "data.items"]);
      } catch {
        return DEFAULT_ORGANIZATION_ALIASES;
      }
    }
    return apiClient.get<OrganizationAlias[]>("/api/organizations/aliases");
  },

  async addAlias(alias: string, organizationId: string): Promise<OrganizationAlias> {
    if (isLegacyAppsScriptAuthMode()) {
      const payload = await legacyRequest<any>("organization_alias_add", { alias, organizationId });
      return (payload?.alias || payload?.item || payload) as OrganizationAlias;
    }
    return apiClient.post<OrganizationAlias>("/api/organizations/aliases", { alias, organizationId });
  },

  async mergeOrganizations(sourceId: string, targetId: string): Promise<{ ok: boolean; message: string }> {
    if (isLegacyAppsScriptAuthMode()) return legacyRequest("organization_merge", { sourceId, targetId });
    return apiClient.post<{ ok: boolean; message: string }>("/api/organizations/merge", { sourceId, targetId });
  },

  async migrateUserOrganizations(): Promise<OrganizationMigrationResult> {
    if (isLegacyAppsScriptAuthMode()) {
      try {
        return await legacyRequest<OrganizationMigrationResult>("admin_migrate_user_organizations");
      } catch (error) {
        return {
          ok: false,
          createdLinks: 0,
          skippedExisting: 0,
          unresolvedUnits: [],
          backendPatchRequired: true,
          message: error instanceof Error ? error.message : "Cần triển khai Apps Script patch quản lý tổ chức."
        };
      }
    }
    return apiClient.post<OrganizationMigrationResult>("/api/organizations/migrate-users");
  }
};

export default organizationService;
