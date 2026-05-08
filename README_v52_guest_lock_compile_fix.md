# NeuroCine v52 — Guest Lock Compile Fix

Fixes the v51 JSX compile error and keeps the guest workspace locked.

Changed files:
- app/storyboard/page.js
- app/globals.css
- README_v52_guest_lock_compile_fix.md

What changed:
- Restored valid JSX structure.
- Guest sees only the auth-required notice and locked workspace message.
- Studio workspace 01–04, manual JSON, Production Pack and floating export dock are rendered only for signed-in users.
- No SQL required.

Deploy:
1. Replace listed files or upload full project.
2. Redeploy Render.
3. Test guest/incognito, normal user, admin.
