# NeuroCine v51 — Guest Workspace Lock

## Что исправлено

- Гость без Google-входа больше не видит и не может редактировать рабочую зону 01–04.
- Ручной JSON textarea в Storyboard скрыт для гостя.
- Production Pack / экспорт / floating dock скрыты для гостя.
- Demo banner показывается только авторизованному пользователю.
- LocalStorage draft больше не использует guest-scope: черновики грузятся только по `user.id`.

## Файлы под замену

- `app/storyboard/page.js`
- `app/globals.css`
- `README_v51_guest_workspace_lock.md`

SQL не нужен.
