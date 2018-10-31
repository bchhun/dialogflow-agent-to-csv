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

## Setup instructions

### Environment variables

* `AGENT_UPLOAD_PATH`: the path where the zip files should be uploaded. defaults to `/tmp`.
* `DELETE_ALL_UUID`: a uuid that protects the `/deleteAll` url so you can run a cronjob without worrying about anyone poking that URL for the fun of it. defaults to a random uuid. *You really need to set that variable.*