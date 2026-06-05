package online.neurocine.wol;

import android.app.Activity;
import android.graphics.Color;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String DEFAULT_MAC = "70:85:C2:98:35:76";
    private static final String DEFAULT_BROADCAST = "192.168.0.255";
    private static final String DEFAULT_PORT = "9";
    private static final String DEFAULT_REMOTE_HOST = "5.182.97.164";
    private static final String DEFAULT_REMOTE_PORT = "40009";

    private EditText macInput;
    private EditText broadcastInput;
    private EditText portInput;
    private EditText remoteHostInput;
    private EditText remotePortInput;
    private TextView statusView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
    }

    private ScrollView buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(8, 11, 16));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(22), dp(18), dp(22));
        scroll.addView(root, new ScrollView.LayoutParams(
                ScrollView.LayoutParams.MATCH_PARENT,
                ScrollView.LayoutParams.WRAP_CONTENT
        ));

        TextView kicker = text("NEUROCINE COMPANION", 12, Color.rgb(255, 179, 189), true);
        kicker.setLetterSpacing(0.12f);
        root.addView(kicker);

        TextView title = text("Разбудить ПК", 34, Color.WHITE, true);
        title.setPadding(0, dp(8), 0, dp(8));
        root.addView(title);

        TextView subtitle = text("Отправляет Wake-on-LAN magic packet на твой ПК по кабелю Ethernet. Есть два режима: дома по Wi-Fi и удалённо через роутер.", 15, Color.rgb(194, 199, 211), false);
        subtitle.setPadding(0, 0, 0, dp(18));
        root.addView(subtitle);

        macInput = input("MAC ПК", DEFAULT_MAC, InputType.TYPE_CLASS_TEXT);
        broadcastInput = input("Wi-Fi broadcast IP", DEFAULT_BROADCAST, InputType.TYPE_CLASS_TEXT);
        portInput = input("Wi-Fi порт", DEFAULT_PORT, InputType.TYPE_CLASS_NUMBER);
        remoteHostInput = input("Удалённый IP / DDNS роутера", DEFAULT_REMOTE_HOST, InputType.TYPE_CLASS_TEXT);
        remotePortInput = input("Удалённый UDP порт роутера", DEFAULT_REMOTE_PORT, InputType.TYPE_CLASS_NUMBER);
        root.addView(macInput);
        root.addView(broadcastInput);
        root.addView(portInput);
        root.addView(remoteHostInput);
        root.addView(remotePortInput);

        Button wakeLocalButton = button("Разбудить дома по Wi-Fi", Color.rgb(227, 52, 79));
        wakeLocalButton.setOnClickListener((v) -> sendWakePacket(
                broadcastInput.getText().toString().trim(),
                portInput.getText().toString().trim(),
                "Wi-Fi"
        ));
        root.addView(wakeLocalButton);

        Button wakeRemoteButton = button("Разбудить удалённо через роутер", Color.rgb(18, 112, 83));
        wakeRemoteButton.setOnClickListener((v) -> sendWakePacket(
                remoteHostInput.getText().toString().trim(),
                remotePortInput.getText().toString().trim(),
                "удалённый режим"
        ));
        root.addView(wakeRemoteButton);

        Button defaultButton = button("Вернуть данные Codex", Color.rgb(25, 31, 43));
        defaultButton.setOnClickListener((v) -> {
            macInput.setText(DEFAULT_MAC);
            broadcastInput.setText(DEFAULT_BROADCAST);
            portInput.setText(DEFAULT_PORT);
            remoteHostInput.setText(DEFAULT_REMOTE_HOST);
            remotePortInput.setText(DEFAULT_REMOTE_PORT);
            setStatus("Данные ПК восстановлены.", false);
        });
        root.addView(defaultButton);

        statusView = text("Готово. Wi-Fi режим работает в домашней сети. Удалённый режим заработает после настройки TP-Link: UDP 40009 -> Wake-on-LAN внутри сети.", 14, Color.rgb(183, 255, 227), false);
        statusView.setPadding(0, dp(16), 0, 0);
        root.addView(statusView);

        TextView note = text("Если роутер не умеет WOL/UDP broadcast, самый надёжный удалённый старт: умная розетка + BIOS Power On after AC restore. После старта Windows Local Agent уже настроен на автозапуск.", 13, Color.rgb(255, 220, 166), false);
        note.setPadding(0, dp(16), 0, 0);
        root.addView(note);

        return scroll;
    }

    private EditText input(String label, String value, int inputType) {
        EditText editText = new EditText(this);
        editText.setHint(label);
        editText.setText(value);
        editText.setSingleLine(true);
        editText.setInputType(inputType);
        editText.setTextColor(Color.WHITE);
        editText.setHintTextColor(Color.rgb(145, 150, 162));
        editText.setTextSize(16);
        editText.setPadding(dp(12), dp(12), dp(12), dp(12));
        editText.setBackgroundColor(Color.rgb(16, 19, 27));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, dp(10));
        editText.setLayoutParams(params);
        return editText;
    }

    private Button button(String label, int color) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setTextSize(16);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER);
        button.setBackgroundColor(color);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(54)
        );
        params.setMargins(0, dp(8), 0, 0);
        button.setLayoutParams(params);
        return button;
    }

    private TextView text(String value, int sizeSp, int color, boolean bold) {
        TextView textView = new TextView(this);
        textView.setText(value);
        textView.setTextSize(sizeSp);
        textView.setTextColor(color);
        textView.setLineSpacing(0, 1.12f);
        if (bold) textView.setTypeface(textView.getTypeface(), android.graphics.Typeface.BOLD);
        return textView;
    }

    private void sendWakePacket(String targetHost, String targetPort, String modeLabel) {
        final String mac = macInput.getText().toString().trim();
        final String host = targetHost.trim();
        final int port;
        try {
            port = Integer.parseInt(targetPort.trim());
        } catch (Exception e) {
            setStatus("Порт должен быть числом.", true);
            return;
        }
        if (host.length() == 0) {
            setStatus("Нужен IP, broadcast или DDNS роутера.", true);
            return;
        }

        new Thread(() -> {
            WifiManager.MulticastLock lock = null;
            try {
                WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
                if (wifi != null) {
                    lock = wifi.createMulticastLock("neurocine-wol");
                    lock.setReferenceCounted(false);
                    lock.acquire();
                }

                byte[] packet = buildMagicPacket(mac);
                InetAddress address = InetAddress.getByName(host);
                try (DatagramSocket socket = new DatagramSocket()) {
                    socket.setBroadcast(true);
                    DatagramPacket datagram = new DatagramPacket(packet, packet.length, address, port);
                    for (int i = 0; i < 5; i++) {
                        socket.send(datagram);
                        Thread.sleep(180);
                    }
                }
                setStatus(String.format(Locale.US, "%s: отправлено 5 magic packets на %s:%d для %s.", modeLabel, host, port, mac), false);
            } catch (Exception e) {
                setStatus("Не отправилось: " + e.getMessage(), true);
            } finally {
                if (lock != null && lock.isHeld()) lock.release();
            }
        }).start();
    }

    private byte[] buildMagicPacket(String mac) {
        String clean = mac.replace(":", "").replace("-", "").trim();
        if (clean.length() != 12) {
            throw new IllegalArgumentException("MAC должен быть формата 70:85:C2:98:35:76");
        }
        byte[] macBytes = new byte[6];
        for (int i = 0; i < 6; i++) {
            macBytes[i] = (byte) Integer.parseInt(clean.substring(i * 2, i * 2 + 2), 16);
        }

        byte[] packet = new byte[6 + 16 * macBytes.length];
        for (int i = 0; i < 6; i++) packet[i] = (byte) 0xFF;
        for (int i = 6; i < packet.length; i += macBytes.length) {
            System.arraycopy(macBytes, 0, packet, i, macBytes.length);
        }
        return packet;
    }

    private void setStatus(String message, boolean error) {
        runOnUiThread(() -> {
            statusView.setText(message);
            statusView.setTextColor(error ? Color.rgb(255, 154, 168) : Color.rgb(183, 255, 227));
        });
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
