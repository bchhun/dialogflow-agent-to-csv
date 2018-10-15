dialogflow-agent-to-csv
=======================

A simple Express app where you upload a dialogflow agent zip file and receive 2 csv files of all its training phrases and its answers.

## How to extract your agent from dialogflow

1. Go into https://console.dialogflow.com
2. Open your desired agent's configuration panel (click on the gear right to the agent name)
3. Click on the `Export and Import` tab
4. Click on the `Export as zip` button
5. Upload your agent using the upload input
6. Click on the convert button !

You should then see 2 links that will allow you to download all your agent's training phrases and answers !

Once the conversion has been done, it will remove all the files from this project's `public` folder :)