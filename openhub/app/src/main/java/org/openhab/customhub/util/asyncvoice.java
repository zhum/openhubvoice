package org.openhab.customhub.util;

import java.util.ArrayList;
import java.util.Timer;

import android.content.Context;
import android.media.AudioManager;
import android.os.CountDownTimer;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.widget.Toast;

import org.openhab.customhub.R;
import org.openhab.customhub.ui.OpenHABMainActivity;

public class asyncvoice implements
        RecognitionListener {


    public SpeechRecognizer speech = null;
    public Intent recognizerIntent;
    private String LOG_TAG = "VoiceRecognitionActivity";
    public String rtext = "";
    private Context appcon;
    private AudioManager mAudioManager;
    private OpenHABMainActivity.voicebackground vback;
    private Menu appmenu;
    public asyncvoice(Context ctx, OpenHABMainActivity.voicebackground voicebackground, Menu menu){

        appmenu = menu;
        appcon = ctx;
        vback = voicebackground;
        mAudioManager = (AudioManager) appcon.getSystemService(Context.AUDIO_SERVICE);
        speech = SpeechRecognizer.createSpeechRecognizer(appcon);
        speech.setRecognitionListener(this);
        recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE,"en");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE,appcon.getPackageName());
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_WEB_SEARCH);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
       speech.startListening(recognizerIntent);
    }

    @Override
    public void onBeginningOfSpeech() {
        Log.i(LOG_TAG, "onBeginningOfSpeech");

    }

    @Override
    public void onBufferReceived(byte[] buffer) {
        Log.i(LOG_TAG, "onBufferReceived: " + buffer);
    }

    @Override
    public void onEndOfSpeech() {
        Log.i(LOG_TAG, "onEndOfSpeech");
    }

    @Override
    public void onError(int errorCode) {
        Log.d(LOG_TAG, "FAILED");
        appmenu.findItem(R.id.mainmenu_voice_recognition).setIcon(R.drawable.menu_mic_dark);
        speech.cancel();
    }

    @Override
    public void onEvent(int arg0, Bundle arg1) {
        Log.i(LOG_TAG, "onEvent");
    }

    @Override
    public void onPartialResults(Bundle arg0) {
        Log.i(LOG_TAG, "onPartialResults");
    }

    @Override
    public void onReadyForSpeech(Bundle arg0) {
        Log.i(LOG_TAG, "onReadyForSpeech");
    }

    @Override
    public void onResults(Bundle results) {
        Log.i(LOG_TAG, "onResults");
        ArrayList<String> matches = results
                .getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        String text = "";
        for (String result : matches)
            text += result + "\n";

        rtext = text;
        Log.i(LOG_TAG, "onResults text: " + rtext);
        vback.voicebackground(matches.get(0));
    }

    @Override
    public void onRmsChanged(float rmsdB) {
    //    Log.i(LOG_TAG, "onRmsChanged: " + rmsdB);
    }

}