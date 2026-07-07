export type OrganizationType =
  | "MILITARY_REGION"
  | "PROVINCIAL_COMMAND"
  | "AREA_COMMAND"
  | "COMMUNE_COMMAND"
  | "DEPARTMENT"
  | "COMPANY"
  | "PLATOON"
  | "SQUAD"
  | "TEAM"
  | "CUSTOM";

export type OrganizationScopeLevel =
  | "GLOBAL"
  | "MILITARY_REGION"
  | "PROVINCE"
  | "AREA"
  | "COMMUNE"
  | "DEPARTMENT"
  | "UNIT"
  | "TEAM"
  | "SELF";

export type OrganizationStatus = "active" | "inactive" | "merged" | "pending";

export interface Organization {
  organizationId: string;
  parentOrganizationId: string;
  level: number;
  path: string;
  code: string;
  canonicalName: string;
  displayName: string;
  shortName: string;
  organizationType: OrganizationType;
  scopeLevel: OrganizationScopeLevel;
  status: OrganizationStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  memberCount?: number;
  activeCount?: number;
  pendingCount?: number;
}

export interface OrganizationAlias {
  alias: string;
  normalizedAlias: string;
  organizationId: string;
  confidence: number;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserOrganization {
  userId: string;
  organizationId: string;
  roleInOrganization: string;
  isPrimary: boolean;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationAuditEntry {
  time: string;
  actorUserId: string;
  actorUsername: string;
  action: string;
  organizationId: string;
  detailJson: string;
}

export interface OrganizationResolveResult {
  organizationId: string;
  canonicalName: string;
  displayName: string;
  confidence: number;
  source: "alias" | "canonical" | "fallback" | "unresolved";
  status?: "resolved" | "pending" | "unresolved";
  originalInput?: string;
}

export interface OrganizationStats {
  organizationId: string;
  memberCount: number;
  activeCount: number;
  pendingCount: number;
  childCount?: number;
}

export interface OrganizationScope {
  userId: string;
  role: string;
  organizationId: string;
  scopeLevel: OrganizationScopeLevel;
}

export interface OrganizationMigrationResult {
  ok: boolean;
  createdLinks: number;
  skippedExisting: number;
  unresolvedUnits: string[];
  duplicateAliases?: string[];
  backendPatchRequired?: boolean;
  message: string;
}
