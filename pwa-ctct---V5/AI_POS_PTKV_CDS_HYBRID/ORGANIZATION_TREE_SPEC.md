# Organization Tree Spec

## Fields

`organizationId`, `parentOrganizationId`, `level`, `path`, `code`, `canonicalName`, `displayName`, `shortName`, `organizationType`, `scopeLevel`, `status`, `sortOrder`, `createdAt`, `updatedAt`.

## Default seed

```text
ORG_QK1 Quân khu 1
└─ ORG_BCHQS_BN Bộ CHQS tỉnh Bắc Ninh
   └─ ORG_PTKV3 Ban Chỉ huy PTKV3
      ├─ ORG_YENTHE Ban CHQS xã Yên Thế
      │  ├─ ORG_CHINHTRI Phòng Chính trị
      │  ├─ ORG_THAMMUU Phòng Tham mưu
      │  ├─ ORG_HCKT Phòng HC-KT
      │  ├─ ORG_BCHQS_XA Ban CHQS xã Yên Thế
      │  ├─ ORG_DQCD Dân quân cơ động
      │  └─ ORG_DQTV Dân quân tự vệ
      └─ ORG_TUDO Tự do / Chưa xác định
```

Every child path is `parent.path + "/" + organizationId`.

## Status

Active organizations are shown by default. Inactive/merged organizations stay in history for audit and migration safety.
