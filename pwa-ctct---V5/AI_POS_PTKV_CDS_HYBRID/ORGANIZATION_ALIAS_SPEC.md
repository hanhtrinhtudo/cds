# Organization Alias Spec

## Normalization

The resolver:

- trims whitespace
- lowercases
- removes Vietnamese accents where safe
- normalizes hyphen, underscore, comma and punctuation variants
- collapses duplicate spaces
- maps common abbreviations such as `hckt`, `thammuu`, `chinhtri`

## Required mappings

| Alias group | Canonical organization |
| --- | --- |
| Phòng HC-KT, Phòng HCKT, HCKT, HC-KT, Phòng Hậu cần - Kỹ thuật, Phòng hậu cần kỹ thuật, Phòng Hậu cần -KT, phòng hậu cần, kỹ thuật, Phòng hậu cần, Ban HC-KT | ORG_HCKT / Phòng HC-KT |
| Phòng Tham mưu, Phòng Tham Mưu, Phòng tham mưu, phong thammuu, thammuu, tham mưu, Tham mưu | ORG_THAMMUU / Phòng Tham mưu |
| Phòng Chính trị, Phòng chính trị, phong chinh tri, Chính trị, chính trị, CT | ORG_CHINHTRI / Phòng Chính trị |
| Ban CHQS xã Yên Thế, Ban CHQS xã, BCHQS xã Yên Thế, Ban chỉ huy quân sự xã Yên Thế | ORG_YENTHE |
| Dân quân tự vệ, DQTV | ORG_DQTV |
| Dân quân cơ động, DQCĐ, DQCD | ORG_DQCD |

Unresolved input must resolve to `ORG_TUDO` with pending status. The system must not create duplicate organizations automatically.
