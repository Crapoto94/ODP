package fr.ivry.odp.mobile;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VpnDetector")
public class VpnDetectorPlugin extends Plugin {

    @PluginMethod
    public void isVpnActive(PluginCall call) {
        boolean isActive = false;
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Network activeNetwork = cm.getActiveNetwork();
                    NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
                    if (caps != null) {
                        isActive = caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN);
                    }
                } else {
                    android.net.NetworkInfo activeNetworkInfo = cm.getActiveNetworkInfo();
                    if (activeNetworkInfo != null) {
                        isActive = activeNetworkInfo.getType() == 17; // TYPE_VPN is 17
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        JSObject ret = new JSObject();
        ret.put("isActive", isActive);
        call.resolve(ret);
    }
}
