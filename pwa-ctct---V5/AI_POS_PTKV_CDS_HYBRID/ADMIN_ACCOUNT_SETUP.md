# Admin Account Setup

Admin login must use the normal Apps Script `login` action.

## Users sheet requirements

The admin user row must include:

- username/account value used by login
- password hash or existing password representation supported by Auth Apps Script
- role = `admin`
- status = `active`
- legacy unit text in `Đơn vị`

## Optional organization fields

If safe, Apps Script may return:

- `organizationId`
- `organizationName`
- `organizationPath`
- `scopeLevel`

These fields are optional and do not replace the legacy response fields.
