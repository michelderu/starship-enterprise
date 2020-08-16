# Starship Enterprise IOT Demo
Welcome to the Starship Enterprise Fleet! And congratulations, you're the Safety Manager responsible for the safety of all personnel.  
The single most important safety issue is the quality of oxygen. No oxygen == No people!  
In order to maximise safety on each ship an extensive monitoring system has been implemented by you for life support. This monitoring system takes information from thousands of systems and stores it securely in a scalable Cassandra architecture.  
Cassandra has been choosen because of it's zero-downtime capabilities and it's lightning fast write operations allowing for secure storage of all measurements of all IOT sensors.  

## Components in the demo
### Database
The database being used is deployed on the Astra SaaS offering because of:
- No Ops, just use it in a serverless fashion!
- Cloud native
- Zero lock-in
- Global (Universal in our case!) scale

### IOT data provider
The most important factor to measure is the quality of the oxygen in the spaceship!  
For this type of IOT data we utilize JMeter serving as an IOT sensor simulator sending it's data towards the database.

### Monitoring
Once we have measurements, it's time to start monitoring.  
In our situation, we have decided to monitor for outliers during a roling window of one minute.  
Normal oxygen levels measure 18-22 ppm. Everything below 17 ppm activates an alert event.

### Alerting
Because the maintenance personnel is very actively working throughout the whole ship, we have to make sure they get alerted as soon as action has to be taken. 
#### AWS cloud-native app 
To keep in-line with the cloud-based Astra solution, we utlize the following cloud-native solutions on AWS:
- Lambda functions to create a true severless application.
- Additionally the Simple Notification Service from AWS is used to inform service employees.
- Finally Lambda Scheduled Events to run the service every minute.  
In order to package the application nicely in a devops environment https://serverless.com has been used.
#### Python app
For reference, and showing the flexibility of the Datastax platform, there is also a Python app that monitors the sensor information and triggers alerts when needed.

## Data model design
### Keyspace
In order to group all information of the life support systems together, we'll utilize the keyspace `life_support_systems`.
### Table structure
For the design of the table structure, the user-experience-based design principles are being used.  
This means we design the table based on it's usage patterns. In our case the following aspects have to be taken care of:
- Monitoring runs every minute, utilizing a roling window of a minute to find outliers
- Within the space ship there will be thousounds of IOT devices
The partition key therefore will be based on:
- `yymmddhhmm` (in order to easily find all data for a roling minute window)
- The `name of the ship`
- The `name of the sensor`
Because we want to find outliers easily, it will be helpful to group and sort the data based on oxygen level. Therefore the clustering key will be based on:
- `oxygen level in ppm`
All of this results in the following table structure:
```sql
CREATE TABLE IF NOT EXISTS sensor_data (
  yyyymmddhhmm text,
  updated timestamp,
  ship text,
  sensor text,
  reading int,
  PRIMARY KEY ((yyyymmddhhmm, ship, sensor), reading)
) WITH CLUSTERING ORDER BY (reading ASC);
```
The primary key consists of the combined attributes `yyyymmddhhmm`, `ship` and `sensor` to be able to find the relevant data quickly as this data will be stored on one partition. Additionally we place a clustering key on `reading` in ascending order so that the data gets sorted. This allows to limit the results to the first row, again speeding up the read activity, because the first row will contain the lowest value for `reading`.

### Query
We want to quickly know if there is an outlier during the last rolling window of a minute. The easiest way to do this is utilizing the partition keys and clustering key.
```sql
SELECT reading FROM sensor_data
WHERE yyyymmddhhmm = '202008161202' AND ship = 'Starship Astra' AND sensor = 'oxygen'
LIMIT 1;
```
This will retrieve all oxygen reading from the current rolling minut window, with the oxygen value sorted in an ascending order. So the smallest value will be first, easily allowing to check if it's < 18. Limiting to 1 gives us the number we're interested in.

## Some personal notes: Experience during development
1. Repeatedly receieved 500 errors call REST endpoints, even after creating a new Astra DB
2. No extended logging information available apart from REST responses saying little (i.e.: "unable to execute create table query" with error code 500)
3. Reached out to Astra support (Sebastian) who is now helping me
4. Actual response from the support team: 
"Looks like we have an issue related to a timeout on the table create call that is being fixed as we speak. To confirm that this is the issue can you check in cqlsh and see if the table is there?"
5. The support team fixed the issue in about 10 minutes and I could proceed.

## Setting up Astra using REST
All activities are relative to the `./astra` directory!

### Set up the database on Astra
Point your browser to https://astra.datastax.com and create a new database
- Database name: starship_enterprise;
- Keyspace: life_support_systems.
Note the cluster ID for follow up actions.

### Set up the environment variables
Edit `astra_environment.txt` to match the Astra Cluster ID and Region.

### Get the Authorization Token for REST activities
Create a file `astra_credentials.txt` that contains the username and password as such:
```sh
export ASTRA_DB_USERNAME=<your username>
export ASTRA_DB_PASSWORD=<your password>
```
Now run `./getAuthToken.sh`.  
Note the token in the response, we'll need it for the step below and for the JMeter simulation.  
  
Create a file `astra_token.txt` that contains the token as such:
```sh
ASTRA_AUTHORIZATION_TOKEN=<your token>
```

### Create the needed tables
Run: `./createTables.sh`. Take a look at the embedded REST call.  
This will create the oxygen_filter table that accepts information from the oxygen IOT sensor.

### Add some test rows into the table
Run: `./addRows.sh`. Take a look at the embedded REST call.

### Test querying the sensor table
Run: `./query.sh`. Take a look at the embedded REST call.  
Take note of the automatic order done by the cluster!

## Simulate the oxygen IOT device

### IOT data generation
In 98% of the time we generate a normal O value of 18-22, the other 2% we generate outliers from 14-17.  
One IOT data point per second is generated as follows in the JMeter HTTP thread definition calling the Astra REST endpoint:  
```json
${__setProperty(time, ${__time(yyyy-MM-dd HH:mm:ss.S)}, False)}
${__setProperty(yyyymmddhhmm, ${__time(yyyyMMddHHmm)}, False)}

{"columns":[
  {"name":"yyyymmddhhmm","value":"${__P(yyyymmddhhmm)}"},
  {"name":"updated","value":"${__P(time)}"},
  {"name":"ship","value":"Starship Astra"},
  {"name":"sensor","value":"oxygen"},
  {"name":"reading","value":${__javaScript(${__Random(0,100)} > 98 ? ${__Random(14,17)} : ${__Random(18,22)})}}
]}
```

### Spin up JMeter and hit the rows endpoint to load IOT data
In this demo we'll use JMeter to simulate a data feed coming from an oxygen level sensor in the filter room of the life support system in the space ship.  
Run `apache-jmeter-5.3/bin/jmeter.sh` and load `Oxygen Filter Simulation.jmx`.  
***Important:*** Update the Authorization Token in the Astra REST headers section (x-cassandra-token). In case you need to renew the token, run `getAuthToken.sh` in `./astra`.  
Hit the run button to start the simulation that loads IOT data into Astra. JMeter will ingest a value every second for a period of 5 minutes (enough for testing).

## Python Monitoring App
All activities are relative to the `./python-monitoring` directory!

### Design
Credentials are taken from the `./astra/credentials.txt` file.  
The app connects to Astra using the Secure Connect Bundle.  
Every 5 seconds the app checks if there is an outlier in the oxygen values for the rolling minute window. This is scheduled using the `schedule` package.  
The query we use is documented above. Whenever we retrieve a value that is smaller than 18, an alert goes off.

### Run the IOT monitoring process
First download the secure connect bundle from Astra and place the zip in `./python-monitoring`. Make sure to update the filename in environment variable `ASTRA_SECURE_CONNECT_BUNDLE` in `run_monitoring.sh`.  
Then make sure your Astra credentials are correctly stored in `./astra/credentials.txt`. 
Now install the cassandra driver: `pip3 install cassandra-driver`.  
Optional: Check the cassandra driver availability: `python3 -c 'import cassandra; print (cassandra.__version__)'`.  
Make sure JMeter is firing the endpoint to simulate the oxygen sensor.    
Now run `run_monitoring.sh`.

## AWS cloud-native Monitoring App
All activities are relative to the `./aws-monitoring` directory!

### Design
The cloud-native solutions uses a full serverless design. No need for standing up nodes anymore!  
To ease the devops process, we make use of the wunderful https://serverless.com framework.

### Set up Serverless and deploy to AWS
1. `npm install -g serverless`
2. Go to AWS and create an IAM user for serverless (programmatic access and admin access). Note the credentials.
3. Configure serverless credentials like `serverless config credentials --provider aws --key <KEY> --secret <SECRET>`.
4. Go to AWS and create an S3 bucket (make sure to use the same region).
5. Configure the region and bucket in serverless.yml.
6. Download the secure connect bundle fro Astra and put the zip into the `aws-monitoring` directory so it will be packaged.
7. Install Node.js dependencies
```sh
cd aws-monitoring
npm install cassandra-driver
npm install aws-sdk
```
8. Deploy the serverless functions running `sls deploy`.

### Create the oxygen_filter table in the life_support_systems keyspace (if not done already, or drop it)
Call the AWS Lambda REST endpoint (replace the URL to match your instance):
```sh
curl -X POST https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/createSchema
```

### Add some test data (for the demo, use JMeter explained above)
Call the AWS Lambda rest endpoint:
```sh
curl -X POST -d '{"yyyymmddhhmm": "202008161210", "updated": "2020-08-16 12:10:31.020", "ship": "Starship Astra", "sensor": "oxygen", "reading": 18}' https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/addSensorReading
curl -X POST -d '{"yyyymmddhhmm": "202008161210", "updated": "2020-08-16 12:10:31.020", "ship": "Starship Astra", "sensor": "oxygen", "reading": 20}' https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/addSensorReading
curl -X POST -d '{"yyyymmddhhmm": "202008161210", "updated": "2020-08-16 12:10:31.020", "ship": "Starship Astra", "sensor": "oxygen", "reading": 17}' https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/addSensorReading
```

### Test querying the test data
Call the AWS Lambda rest endpoint (some variables haven been hardcoded for the sake of time):
```sh
curl -X GET https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/getReading
```

### Test sending an SMS
Call the rest endpoint which on it's turn cals the SNS service of AWS to send an SMS:
```sh
curl -X POST -d '{"receiver": "+31638507567", "sender": "Starship", "message": "This is a test message"}' https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/test/send
```

### Test monitoring
Make sure JMeter is firing the endpoint to simulate the oxygen sensor. Also update `MONITOR_SMS_NUMBER` in `serverless.yml` to match your cell phone number.  
Call the rest endpoint (some variables haven been hardcoded for the sake of time):
```sh
curl -X GET https://2qx7yo740c.execute-api.eu-west-1.amazonaws.com/dev/monitorOxygen
```

### Operationalize the monitoring process
Update `serverless.yml` and change `enabled: false` to `enabled: true ` for function `monitorOxygen`. Also update `MONITOR_SMS_NUMBER` in `serverless.yml` to match your cell phone number.  
Run `sls deploy` and sit back!  
***Important:*** Make sure to change enabled back to false and run another deploy. Else the monitoring app keeps running which will incur a cost!