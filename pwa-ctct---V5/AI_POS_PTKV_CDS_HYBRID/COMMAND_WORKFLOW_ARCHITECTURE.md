# Command Workflow Architecture

## Unified workflow

`useCommandWorkflow` is the single command-navigation state owned by `AdminCommandShell`. It tracks section, learner, unit, event, risk, case and source. Dashboard and Force Management no longer own separate profile destinations.

Flow:

Dashboard signal → workflow intent → Force Management → Electronic Learning Profile v2 → rule-based decision support → commander action draft → education case draft → local follow-up/status.

Top learner and activity rows with a UserID open the same profile v2 used by the roster. Unknown users render a safe no-data message including the unresolved UserID. KPI drill-down event rows can continue into the learner profile.

## State boundaries

- Workflow selection: AdminCommandShell hook.
- Account/analytics orchestration: Profile v2.
- Case data: in-memory component state for the current mounted profile only.
- Existing services/contracts: unchanged.
- Learner shell: unchanged and cannot render this admin workflow.

## No false persistence

Commander actions and cases are labeled proposal/draft. They are not sent to Apps Script, do not send notifications, and disappear when the profile/session UI is remounted.

