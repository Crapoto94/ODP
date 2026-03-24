package fr.ivry.odp.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VpnDetectorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
