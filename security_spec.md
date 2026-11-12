# Security Specification — Meus Links Cloud

## 1. Data Invariants
1. **Strict Multi-Tenant Isolation**: Every user profile, collection, category, subcategory, link, note, and trash item is scoped strictly under `/users/{userId}` and carries an immutable `userId` equal to `request.auth.uid`.
2. **Verified Identity**: Write operations require a signed-in user with a verified email (`request.auth.token.email_verified == true`).
3. **Referential Integrity**:
   - Subcollections under `/users/{userId}` require the parent `/users/{userId}` document to exist on create/update.
   - Subcategories require their referenced `categoryId` to exist under `/users/{userId}/categories/{categoryId}`.
4. **Temporal & Identity Immutability**:
   - `createdAt` must equal `request.time` on `create` and must remain unchanged on `update`.
   - `updatedAt` must equal `request.time` on both `create` and `update`.
   - `id` and `userId` are immutable after creation.
5. **Bounded Payloads**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), all strings enforce explicit `.size()` bounds, and tag lists are capped at `<= 20` elements.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-User Read (`get`/`list`)**: User B attempts to read `/users/{userA}/links/{linkId}`.
2. **Identity Spoofing on Create**: User B writes to `/users/{userB}/links/{linkId}` with `userId: userA`.
3. **Ghost Field / Shadow Write**: Payload includes unexpected field `isAdmin: true` or `role: "superadmin"` on `users/{uid}` or `links/{id}`.
4. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempts to create a category or link.
5. **ID Poisoning**: Document created at `/users/{uid}/links/bad$id..1500chars` violating `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
6. **Timestamp Forgery on Create**: Client submits `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` (`serverTimestamp()`).
7. **Immortal Field Tampering on Update**: Client modifies `userId` or `createdAt` during an update to a link or category.
8. **Value Poisoning**: Client updates `title` with a 5KB string (`> 300` chars) or `clickCount` with a string instead of a number.
9. **Orphan Subcategory Write**: Client creates a subcategory referencing a non-existent `categoryId`.
10. **Array Exhaustion**: Client submits `tags` with 50 items (`> 20`) or non-string first element (`tags: [123]`).
11. **Privilege Escalation on Profile**: Client updates `plan` or `userId` directly via unauthorized fields or missing `updatedAt == request.time`.
12. **Global Query Scraping**: Any user attempts `collectionGroup('links')` or listing `/users/{otherUid}/links` without matching `request.auth.uid`.
