# NeuroCine v46 — Auth Gate + DEMO No-API Lock

## Что исправлено

- Гость больше не может вводить тему и запускать генерацию.
- Без Google-входа Studio показывает Auth Gate и блокирует рабочие поля.
- DEMO режим теперь жёстко работает через mock-данные на фронте и не должен вызывать `/api/chat`, `/api/storyboard`, `/api/video`, `/api/cover`, `/api/music-suno`, `/api/seo-pack`, `/api/social-pack`, `/api/tts-studio`.
- LIVE режим для FREE аккаунта блокируется сообщением `LIVE/API заблокирован`.
- Production Pack также уважает DEMO/LIVE lock.

## Файлы для замены

- `app/storyboard/page.js`
- `components/ProductionPack.js`
- `app/globals.css`
- `README.md`

## SQL

Новый SQL не нужен, если v44/v45 schema уже успешно выполнена.

## Проверка

1. Выйти из аккаунта.
2. Открыть `/storyboard`.
3. Поля генерации должны быть заблокированы, вместо рабочего режима должен быть блок "Вход обязателен".
4. Войти через Google.
5. В DEMO создать сценарий/storyboard — API не должен списываться.
6. Переключить LIVE на FREE — генерация должна блокироваться.
