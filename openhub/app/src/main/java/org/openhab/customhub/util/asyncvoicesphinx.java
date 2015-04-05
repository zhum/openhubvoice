package org.openhab.customhub.util;

import android.content.Context;
import android.graphics.Path;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Looper;
import android.preference.PreferenceManager;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.Toast;

import org.openhab.customhub.R;
import org.openhab.customhub.ui.OpenHABMainActivity;

import edu.cmu.pocketsphinx.Assets;
import edu.cmu.pocketsphinx.Hypothesis;
import edu.cmu.pocketsphinx.RecognitionListener;
import edu.cmu.pocketsphinx.SpeechRecognizer;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import static edu.cmu.pocketsphinx.SpeechRecognizerSetup.defaultSetup;

/**
 * Created by Ega on 28.03.2015.
 */
public class asyncvoicesphinx implements edu.cmu.pocketsphinx.RecognitionListener {

    public SpeechRecognizer recognizer;
    public AsyncTask foldertask;
    private String passphrase;
    private OpenHABMainActivity.voicebackground backvoice;
    private  Context appcon;
    public boolean beforeremove = false;

    public  asyncvoicesphinx(final Context con, OpenHABMainActivity.voicebackground voicebackground){

       appcon = con;
       backvoice = voicebackground;
            passphrase = PreferenceManager.getDefaultSharedPreferences(con).getString(Constants.PREFERENCE_VBACKPHRASE, "");
     foldertask =  new AsyncTask<Void, Void, Exception>() {
            @Override
            protected Exception doInBackground(Void... params) {
                try {
                    Assets assets = new Assets(con);
                    File assetDir = assets.syncAssets();
                    setupRecognizer(assetDir);
                } catch (IOException e) {
                    return e;
                }
                return null;
            }

            @Override
            protected void onPostExecute(Exception result) {

            }
        }.execute();


    }




    private void setupRecognizer(File assetsDir) throws IOException {
        // The recognizer can be configured to perform multiple searches
        // of different kind and switch between them

        boolean isrussian = false;
        for(int i = 0;i < passphrase.length();i++){
            if((int) passphrase.charAt(i) >= 128){
                isrussian = true;
            }
        }

        File tempfile;
        if(isrussian){

tempfile = new File(assetsDir, "msu_ru_full.dic");
            recognizer = defaultSetup()
                    .setAcousticModel(new File(assetsDir, "ru-ru-ptm"))
                    .setDictionary(new File(assetsDir, "msu_ru_full.dic"))
                    .setKeywordThreshold(1e-45f)
                    .setBoolean("-allphone_ci", true)
                    .getRecognizer();



        }else {
            tempfile = new File(assetsDir, "cmudict-en-us.dict");
            recognizer = defaultSetup()
                    .setAcousticModel(new File(assetsDir, "en-us-ptm"))
                    .setDictionary(new File(assetsDir, "cmudict-en-us.dict"))
                    .setKeywordThreshold(1e-45f)
                    .setBoolean("-allphone_ci", true)
                    .getRecognizer();

        }

        recognizer.addListener(this);

        StringBuilder text = new StringBuilder();
        BufferedReader br = new BufferedReader(new FileReader(tempfile));
        String line;

        while ((line = br.readLine()) != null) {
            text.append(line);
            text.append('\n');
        }

        boolean ispass = true;

        String[] phrases = passphrase.trim().split(" ");

       for(int s = 0;s < phrases.length;s++){
           if(!text.toString().contains(phrases[s])){
               ispass = false;
           }
       }


       if(ispass && !beforeremove){
           recognizer.addKeyphraseSearch("mainstack", passphrase);
           recognizer.startListening("mainstack");

       }


        if(!ispass) {
            try {
                new Thread() {
                    @Override
                    public void run() {
                        Looper.prepare();
                        Toast.makeText(appcon, R.string.bad_command, Toast.LENGTH_SHORT).show();
                        Looper.loop();
                    }
                }.start();
            } catch (Exception i) {
            }


        }

    }


    @Override
    public void onBeginningOfSpeech() {

    }

    @Override
    public void onEndOfSpeech() {

    }

    @Override
    public void onPartialResult(Hypothesis hypothesis) {
        if (hypothesis == null)
            return;


        if(hypothesis.getHypstr().toString().trim().equals(passphrase)) {
            Log.v("hyber","particial: " + hypothesis.getHypstr().toString());
            recognizer.stop();
            recognizer.cancel();
            recognizer.shutdown();
        }
    }

    @Override
    public void onResult(Hypothesis hypothesis) {
        Log.v("hyber: ", hypothesis.getHypstr());
        backvoice.voicebackground(hypothesis.getHypstr());

    }

    @Override
    public void onError(Exception e) {
    Log.v("sphinxerror", e.toString());
    }

    @Override
    public void onTimeout() {
Log.v("hyber","timeout");
    }
}
