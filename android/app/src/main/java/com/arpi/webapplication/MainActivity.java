package com.arpi.webapplication;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import ee.forgr.biometric.NativeBiometric;


public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBiometric.class);
        super.onCreate(savedInstanceState);
    }
}
