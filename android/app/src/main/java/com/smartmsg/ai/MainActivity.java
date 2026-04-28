package com.smartmsg.ai;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean onKeyDown(int keyCode, android.view.KeyEvent event) {
        if (keyCode == android.view.KeyEvent.KEYCODE_MENU) {
            // Menu key handled
            return true;
        }
        if (keyCode == android.view.KeyEvent.KEYCODE_SEARCH) {
            // Search key handled - trigger search in webview
            this.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('searchButtonClicked'));", null);
                }
            });
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
