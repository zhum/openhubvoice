package org.openhab.customhub.ui;


import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.FragmentActivity;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.openhab.customhub.util.Constants;


/**
 * Created by Ega on 28.01.2015.
 */
public class aipanelsettings  extends FragmentActivity {
    private WebView webview;

    @Override
    protected void onCreate(Bundle savedInstanceState) {


        getWindow().requestFeature(Window.FEATURE_PROGRESS);

        //setContentView(webview);
        webview = new WebView(this);
        webview.getSettings().setJavaScriptEnabled(true);

        final Activity activity = this;
        webview.setWebChromeClient(new WebChromeClient() {
            public void onProgressChanged(WebView view, int progress) {
                // Activities and WebViews measure progress with different scales.
                // The progress meter will automatically disappear when we reach 100%
                activity.setProgress(progress * 1000);
            }
        });
        webview.setWebViewClient(new WebViewClient() {
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                webview.setVisibility(View.GONE);
                Toast.makeText(activity, "Oh no! " + description, Toast.LENGTH_SHORT).show();

            }
        });


        String AIBaseUrl = PreferenceManager.getDefaultSharedPreferences(this).getString(Constants.PREFERENCE_AIURL, null);
         setContentView(webview);
       // webview.setVisibility(View.INVISIBLE);
        webview.setAlpha(0);
        webview.addJavascriptInterface(new WebAppInterface(this), "Android");
        webview.loadUrl(AIBaseUrl + "/admin");


        super.onCreate(savedInstanceState);

    }


    class WebAppInterface {
        Context mContext;

        /**
         * Instantiate the interface and set the context
         */
        WebAppInterface(Context c) {
            mContext = c;
        }

        /**
         * Show a toast from the web page
         */
        @JavascriptInterface
        public void ispanel() {
        //    setContentView(webview);
            webview.setAlpha(1);
            Toast.makeText(mContext, "successfully connected to AI panel", Toast.LENGTH_SHORT).show();
        }
    }
}