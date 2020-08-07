# Starship Enterprise IOT Demo

## Experience during development
1. Repeatedly receieved 500 errors, even after creating a new Astra DB
2. No extended logging information available apart from REST responses saying nothing (i.e.: "unable to execute create table query" with error code 500)
3. Reached out to Astra support (Sebastian) who is now helping me
4. Actual response from the support team: 
"Looks like we have an issue related to a timeout on the table create call that is being fixed as we speak. To confirm that this is the issue can you check in cqlsh and see if the table is there?"
5. The support team fixed the issue in about 10 minutes and I could proceed.

## Running the demo

### Set up the database on Astra
Point the browser to https://astra.datastax.com and create a new database
- Database name: starship_enterprise;
- Keyspace: life_support_systems.
Note the cluster ID for follow up actions.

### Set up the environment variables
Edit `astra/astra_environment.txt` to match the Astra Cluster ID and Region.

### Get the Authorization Token for REST activities
Create a file `astra/astra_credentials.txt` that contains the username and password as such:
```sh
ASTRA_DB_USERNAME=<your username>
ASTRA_DB_PASSWORD=<your password>
```
Now run `astra/getAuthToken.sh`. Note the token in the response, we'll need it for the step below and for the JMeter simulation.  
Create a file `astra/astra_token.txt` that contains the token as such:
```sh
ASTRA_AUTHORIZATION_TOKEN=<your token>
```

### Create the needed tables
Run `astra/createTables.sh`.
This will create the oxygen_filter table that accepts information from the oxygen IOT sensor.

### Add a test row into the table
Run `astra/addRows.sh`.

### Spin up JMeter and hit the rows endpoint to load IOT data
In this demo we'll use JMeter to simulate a data feed coming from an oxygen level sensor in the filter room of the life support system in the space ship.  
Run `apache-jmeter-5.3/bin/jmeter.sh` and load `Oxygen Filter Simulation.jmx`.  
Update the Authorization Token in the Astra REST headers section (x-cassandra-token).  
Hit the run button to start the simulation that loads IOT data into Astra.  

#### IOT data generation
In 95% of the time we generate a normal O value of 18-22, the other 5% we generate outliers from 14-18.  
For the flow value, in 95% of the time we generate a normal value of 4-5, the other 5% we generate outliers from 2-3.  
One IOT data point per second is generated as follows in the JMeter HTTP thread definition:  
```json
{"columns":[
  {"name":"name","value":"main_scrubber"},
  {"name":"description","value":"Level 1 life support"},
  {"name":"flow","value":"${__javaScript(${__Random(0,100)} > 90 ? ${__Random(2,3)} : ${__Random(4,5)})}"},
  {"name":"oxygen","value":"${__javaScript(${__Random(0,100)} > 90 ? ${__Random(14,18)} : ${__Random(18,22)})}"},
  {"name":"updated","value":"${__time(yyyy-MM-dd HH:mm:ss)}"}
]}
```

