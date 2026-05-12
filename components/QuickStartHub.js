"use client";

/*
  v67 preview hard-fix:
  QuickStartHub used to duplicate the main Studio setup form
  (topic / script / style / duration). The real single source of truth
  is ProjectSetupPanel inside app/storyboard/page.js.

  Keep this component as a safe no-op instead of deleting the file,
  because the page may still import/render it and project rules say
  not to delete files without explicit approval.
*/

export default function QuickStartHub() {
  return null;
}
