package ch.ethz.ikg.gis.hungergames;

import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.os.AsyncTaskCompat;
import android.support.v7.app.AppCompatActivity;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

import ch.ethz.ikg.gis.hungergames.dto.Challenge;

public class MainActivity extends AppCompatActivity {

    private String participantNumber = null;
    private Challenge currentChallenge = null;
    private Set<Challenge> pendingChallenges = new HashSet<>();
    private String serverURL = "http://hungergames-vested-mayfly.scapp.io";
    private boolean polling = false;
    private boolean pendingChallenge = false;
    private View activityGreen, activityRed, activityOrange;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);


        activityGreen = getLayoutInflater().inflate(R.layout.activity_green, null);
        activityRed = getLayoutInflater().inflate(R.layout.activity_red, null);
        activityOrange = getLayoutInflater().inflate(R.layout.activity_orange, null);

        Button startButton = (Button) findViewById(R.id.startButton);

        startButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText participantNumberText = (EditText) findViewById(R.id.participantNumberContent);

                if (participantNumberText.getText() != null && !"".equals(participantNumberText.getText().toString())) {
                    participantNumber = participantNumberText.getText().toString();
                    setContentView(activityRed);
                    polling = true;
                    AsyncTaskCompat.executeParallel(new ChallengePollerTask(), serverURL + "/pollChallenges/" + participantNumber);
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        polling = false;
    }

    private void onReceiveChallenge(final Challenge challenge) {
        if (!pendingChallenge) {
            pendingChallenge = true;

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    setContentView(activityOrange);

                    Button acceptButton = (Button) findViewById(R.id.acceptButton);
                    acceptButton.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View view) {
                            onAcceptChallenge();
                        }
                    });

                    Button declineButton = (Button) findViewById(R.id.declineButton);
                    declineButton.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View view) {
                            onDeclineChallenge();
                        }
                    });

                    pendingChallenges.add(challenge);

                    TextView sponsor = (TextView) findViewById(R.id.sponsorPending);
                    TextView cash = (TextView) findViewById(R.id.cashPending);
                    TextView task = (TextView) findViewById(R.id.taskPending);

                    sponsor.setText(challenge.getSponsor());
                    cash.setText(challenge.getIncentive());
                    task.setText(challenge.getTask());
                }
            });
        }
    }

    private void onAcceptChallenge() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                setContentView(activityGreen);

                currentChallenge = pendingChallenges.iterator().next();
                pendingChallenges.remove(currentChallenge);

                TextView sponsor = (TextView) findViewById(R.id.sponsor);
                TextView cash = (TextView) findViewById(R.id.cash);
                TextView task = (TextView) findViewById(R.id.task);

                sponsor.setText(currentChallenge.getSponsor());
                cash.setText(currentChallenge.getIncentive());
                task.setText(currentChallenge.getTask());

                updateServer(currentChallenge, "accept");
            }
        });

        AsyncTaskCompat.executeParallel(new ChallengeRunner(), currentChallenge);
    }

    private void onDeclineChallenge() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                currentChallenge = pendingChallenges.iterator().next();
                pendingChallenges.remove(currentChallenge);
                updateServer(currentChallenge, "decline");

                pendingChallenge = false;

                if (pendingChallenges.size() > 0) {
                    Challenge nextChallenge = pendingChallenges.iterator().next();
                    pendingChallenges.remove(nextChallenge);
                    onReceiveChallenge(nextChallenge);
                } else {
                    setContentView(activityRed);
                }
            }
        });
    }

    // TODO: wait

    // TODO: repeat

    private void onFinishChallenge() {
        updateServer(currentChallenge, "fail");
        currentChallenge = null;
        pendingChallenge = false;

        if (pendingChallenges.size() > 0) {
            Challenge nextChallenge = pendingChallenges.iterator().next();
            pendingChallenges.remove(nextChallenge);
            onReceiveChallenge(nextChallenge);
        } else {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    setContentView(activityRed);
                }
            });
        }
    }

    private void updateServer(Challenge challenge, String response) {
        if (challenge != null && response != null && !"".equals(response.trim())) {
            AsyncTaskCompat.executeParallel(new ChallengeResponder(), serverURL + "/responseChallenge/" + challenge.getId() + "/" + response);
        }
    }

    private class ChallengeRunner extends AsyncTask<Challenge, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Challenge... challenges) {
            try {
                Thread.sleep(5000);

                onFinishChallenge();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            return true;
        }
    }

    private class ChallengeResponder extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... strings) {
            HttpURLConnection connection = null;
            InputStream inputStream = null;
            JsonReader jsonReader = null;

            try {
                connection = (HttpURLConnection) new URL(strings[0]).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(2000);
                connection.setReadTimeout(2000);

                try {
                    inputStream = new BufferedInputStream(connection.getInputStream());
                } catch (SocketTimeoutException e) {
                    if (connection != null)
                        connection.disconnect();

                    Log.e("HungerGames", "Failed to retrieve data from server");

                    return false;
                }

                jsonReader = new JsonReader(new InputStreamReader(inputStream, "UTF-8"));
                jsonReader.beginObject();
                while (jsonReader.hasNext()) {
                    jsonReader.skipValue();
                }
                jsonReader.endObject();

                connection.disconnect();
                jsonReader.close();
                inputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }

            return null;
        }
    }

    private class ChallengePollerTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... urls) {
            HttpURLConnection connection = null;
            InputStream inputStream = null;
            JsonReader jsonReader = null;

            try {
                while (polling) {
                    Thread.sleep(10000);

                    for (String url : urls) {
                        // Open connection
                        connection = (HttpURLConnection) new URL(url).openConnection();
                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(2000);
                        connection.setReadTimeout(2000);

                        try {
                            inputStream = new BufferedInputStream(connection.getInputStream());
                        } catch (SocketTimeoutException e) {
                            if (connection != null)
                                connection.disconnect();

                            Log.e("HungerGames", "Failed to retrieve data from server");

                            continue;
                        }

                        // Get the challenge
                        long id = 0L;
                        String task = "task";
                        String incentive = "incentive";
                        String sponsor = "sponsor";

                        jsonReader = new JsonReader(new InputStreamReader(inputStream, "UTF-8"));
                        jsonReader.beginObject();
                        while (jsonReader.hasNext()) {
                            String name = jsonReader.nextName();
                            if (name.equals("id")) {
                                id = jsonReader.nextLong();
                            } else if (name.equals("task")) {
                                task = jsonReader.nextString();
                            } else if (name.equals("incentive")) {
                                incentive = jsonReader.nextString();
                            } else if (name.equals("sponsors")) {
                                String sponsors = jsonReader.nextString();

                                if (sponsors.indexOf(",") > 0) {
                                    sponsor = sponsors.substring(0, sponsors.indexOf(","));
                                }
                            } else {
                                jsonReader.skipValue();
                            }
                        }
                        jsonReader.endObject();

                        onReceiveChallenge(new Challenge(id, task, incentive, sponsor));

                        // Close connection
                        connection.disconnect();
                        inputStream.close();
                        jsonReader.close();
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            return null;
        }
    }
}
