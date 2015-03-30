package org.openhab.customhub.util;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;

import org.openhab.customhub.ui.OpenHABMainActivity;

import edu.cmu.pocketsphinx.Assets;
import edu.cmu.pocketsphinx.Hypothesis;
import edu.cmu.pocketsphinx.RecognitionListener;
import edu.cmu.pocketsphinx.SpeechRecognizer;

import java.io.File;
import java.io.IOException;

import static edu.cmu.pocketsphinx.SpeechRecognizerSetup.defaultSetup;

/**
 * Created by Ega on 28.03.2015.
 */
public class asyncvoicesphinx implements edu.cmu.pocketsphinx.RecognitionListener {

    public SpeechRecognizer recognizer;
    private String passphrase;
    private OpenHABMainActivity.voicebackground backvoice;

    public  asyncvoicesphinx(final Context con, OpenHABMainActivity.voicebackground voicebackground){

       backvoice = voicebackground;
            passphrase = PreferenceManager.getDefaultSharedPreferences(con).getString(Constants.PREFERENCE_VBACKPHRASE, "");
        new AsyncTask<Void, Void, Exception>() {
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

        recognizer = defaultSetup()
                .setAcousticModel(new File(assetsDir, "en-us-ptm"))
                .setDictionary(new File(assetsDir, "cmudict-en-us.dict"))

                        // To disable logging of raw audio comment out this call (takes a lot of space on the device)
                .setRawLogDir(assetsDir)

                        // Threshold to tune for keyphrase to balance between false alarms and misses
                .setKeywordThreshold(1e-45f)

                        // Use context-independent phonetic search, context-dependent is too slow for mobile
                .setBoolean("-allphone_ci", true)

                .getRecognizer();
        recognizer.addListener(this);

        // Create keyword-activation search.
        recognizer.addKeyphraseSearch("mainstack", passphrase);
        recognizer.startListening("mainstack");
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


        Log.v("hyber","u: " + hypothesis.getHypstr().toString());
        if(hypothesis.getHypstr().toString().matches(passphrase)) {
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

    }

    @Override
    public void onTimeout() {
Log.v("hyber","timeout");
    }
}
