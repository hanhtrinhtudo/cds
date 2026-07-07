# Conflict Resolution Policy

## Learning progress

1. COMPLETED never regresses to another state through ordinary synchronization.
2. Otherwise, higher ProgressPercent wins.
3. If equal, higher remote Version wins.
4. If still equal, newest UpdatedAt/LastAccessedAt wins.
5. Server-confirmed progress is merged back into optimistic state.

## Bookmarks

- Writes send desired `active`, never an ambiguous blind toggle.
- Newest UpdatedAt wins when comparing records.
- Server-confirmed desired state reconciles the optimistic ID list.
- Repeated pending changes for the same resource collapse to the latest desired payload.

## Quiz attempts

- AttemptID is immutable and retry-safe.
- Remote existing row wins over a matching local attempt.
- Merged lists are sorted newest submitted first.

## Reviews

- AttemptID is the merge key.
- Newest UpdatedAt wins, with SubmittedAt as legacy fallback.
- Remote list is current-user scoped by backend token ownership.
- Ambiguous global legacy review keys are not auto-imported.

## Queue replay

After successful startup replay, all four remote collections are fetched again. This avoids showing stale pre-flush state after an offline write reaches the server.

