package ch.ethz.ikg.gis.hungergames;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.JsonReader;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import ch.ethz.ikg.gis.hungergames.dto.Challenge;

public class MainActivity extends AppCompatActivity {

    private String participantNumber = null;
    private Challenge currentChallenge = null;
    private List<Challenge> pendingChallenges = new ArrayList<>();
    private String serverURL = "http://hungergames-vested-mayfly.scapp.io";
    private boolean polling = false;
    private Thread pollerThread = new Thread(new ChallengePoller());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button startButton = (Button) findViewById(R.id.startButton);

        startButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText participantNumberText = (EditText) findViewById(R.id.participantNumberContent);

                if (participantNumberText.getText() != null && !"".equals(participantNumberText.getText().toString())) {
                    participantNumber = participantNumberText.getText().toString();
                    setContentView(R.layout.activity_red);
                    polling = true;
                    pollerThread.run();
                }
            }
        });

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
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        polling = false;
    }

    private void onReceiveChallenge(Challenge challenge) {
        setContentView(R.layout.activity_orange);

        pendingChallenges.add(challenge);

        TextView sponsor = (TextView) findViewById(R.id.sponsorPending);
        TextView cash = (TextView) findViewById(R.id.cashPending);
        TextView task = (TextView) findViewById(R.id.taskPending);

        sponsor.setText(challenge.getSponsor());
        cash.setText(challenge.getIncentive());
        task.setText(challenge.getTask());
    }

    private void onAcceptChallenge() {
        setContentView(R.layout.activity_green);

        currentChallenge = pendingChallenges.get(0);
        pendingChallenges.remove(0);

        TextView sponsor = (TextView) findViewById(R.id.sponsor);
        TextView cash = (TextView) findViewById(R.id.cash);
        TextView task = (TextView) findViewById(R.id.task);

        sponsor.setText(currentChallenge.getSponsor());
        cash.setText(currentChallenge.getIncentive());
        task.setText(currentChallenge.getTask());
    }

    private void onDeclineChallenge() {
        if (pendingChallenges.size() > 0) {
            Challenge nextChallenge = pendingChallenges.get(0);
            pendingChallenges.remove(0);
            onReceiveChallenge(nextChallenge);
        } else {
            setContentView(R.layout.activity_red);
        }
    }

    // TODO: wait

    // TODO: repeat

    private class ChallengePoller implements Runnable {
        @Override
        public void run() {
            HttpURLConnection connection = null;
            InputStream inputStream = null;
            JsonReader jsonReader = null;

            try {
                connection = (HttpURLConnection) new URL(serverURL + "/pollChallenges/" + participantNumber).openConnection();
                connection.setRequestMethod("GET");

                inputStream = new BufferedInputStream(connection.getInputStream());
            } catch (MalformedURLException e) {
                e.printStackTrace();
            } catch (ProtocolException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }

            while (polling) {
                try {
                    Thread.sleep(2000);

                    String task = "task";
                    String incentive = "incentive";
                    String sponsor = "sponsor";

                    jsonReader = new JsonReader(new InputStreamReader(inputStream, "UTF-8"));
                    jsonReader.beginObject();
                    while (jsonReader.hasNext()) {
                        String name = jsonReader.nextName();
                        if (name.equals("task")) {
                            task = jsonReader.nextString();
                        } else if (name.equals("incentive")) {
                            incentive = jsonReader.nextString();
                        } else if (name.equals("sponsor")) {
                            sponsor = jsonReader.nextString();
                        } else {
                            jsonReader.skipValue();
                        }
                    }
                    jsonReader.endObject();

                    onReceiveChallenge(new Challenge(task, incentive, sponsor));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            try {
                connection.disconnect();

                inputStream.close();

                jsonReader.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
