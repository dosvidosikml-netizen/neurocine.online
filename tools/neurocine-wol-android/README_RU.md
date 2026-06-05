# NeuroCine Wake

Минимальное Android-приложение для Wake-on-LAN под ПК NeuroCine.

## Уже вставлено

- MAC ПК: `70:85:C2:98:35:76`
- Broadcast IP домашней сети: `192.168.0.255`
- Port: `9`

На экране эти поля можно поменять вручную, если сменится роутер или подсеть.

## Как работает

Кнопка `Разбудить ПК` отправляет 5 Wake-on-LAN magic packets по UDP.

Лучший первый тест:

1. Телефон подключён к домашнему Wi-Fi.
2. ПК в sleep или выключен, но кабель Ethernet и питание остаются подключены.
3. В BIOS включён Wake-on-LAN / Power On by PCI-E.
4. Нажать `Разбудить ПК`.

## Для включения издалека

Android-приложение сможет будить ПК из мобильного интернета только если есть один из вариантов:

- VPN домой, чтобы телефон оказался как будто в домашней сети;
- роутер умеет Wake-on-LAN из своего приложения/админки;
- домашний relay-сервер в сети;
- умная розетка + BIOS `Power On after AC restore`.

## Сборка APK

На текущем ПК пока не найдено Java / Gradle / Android SDK. Когда Android build tools появятся:

```powershell
cd tools\neurocine-wol-android
gradle assembleDebug
```

APK будет здесь:

```text
tools\neurocine-wol-android\app\build\outputs\apk\debug\app-debug.apk
```
