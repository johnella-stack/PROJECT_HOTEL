# TODO
- [ ] Update availability logic so that if a room has any booking overlapping the exact selected range (e.g., 9/7/2026 to 10/7/2026) the UI marks the room as unavailable; otherwise mark available.
- [ ] Modify `src/lib/availability.ts` to compute blocked state using overlap against backend conflict logic for the whole range.
- [ ] Verify SearchResults disables/enables “Select Room” based on updated blocked computation.
- [ ] Run TypeScript build / quick sanity check.

