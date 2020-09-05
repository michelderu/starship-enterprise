'use strict';

const cassandra = require('cassandra-driver');
const secureConnectPath = process.env['ASTRA_SECURE_CONNECT_BUNDLE'];
const username = process.env['ASTRA_DB_USERNAME'];
const password = process.env['ASTRA_DB_PASSWORD'];
const monitorSMSNumber = process.env['MONITOR_SMS_NUMBER'];
const keyspace = 'life_support_systems';
const table = 'sensor_data';

let AWS = require('aws-sdk');
const sns = new AWS.SNS();

// Some sanity checking
if (!secureConnectPath) throw new Error('Environment variable ASTRA_SECURE_CONNECT_BUNDLE not set');
if (!username) throw new Error('Environment variable ASTRA_DB_USERNAME not set');
if (!password) throw new Error('Environment variable ASTRA_DB_PASSWORD not set');
if (!monitorSMSNumber) throw new Error('Environment variable MONITOR_SMS_NUMBER not set');

// useful for determining container re-use
const myuuid = cassandra.types.TimeUuid.now();
console.log('timeuuid in container startup: ' + myuuid);

// Create the Cassandra Client, connected to Astra
const client = new cassandra.Client({
  cloud: { secureConnectBundle: secureConnectPath },
  credentials: { username: username, password: password },

  // AWS Lambda freezes the function execution context after the callback has been invoked. 
  // This means that no background activity can occur between lambda invocations, 
  // including the heartbeat that the driver uses to prevent idle disconnects in some environments.
  // For this reason, we disable it below.
  pooling: { heartBeatInterval: 0 }

  // If trying to reduce Cold Start time, the driver's automatic metadata synchronization and pool warmup can be disabled 
  // isMetadataSyncEnabled: false,
  // pooling: { warmup: false }
});

// Enable logging
client.on('log', (level, className, message) => {
  if (level !== 'verbose') {
    console.log('Driver log event', level, className, message);
  }
});

// Keyspace for the Life Support Systems
const createKeyspace = `CREATE KEYSPACE IF NOT EXISTS ${keyspace} ` +
                       `WITH REPLICATION = {'class':'SimpleStrategy','replication_factor': 1};`;

// IOT table for the Oxygen Filter
const createTable = `CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (` +
                    `yyyymmddhhmm text,` +
                    `updated timestamp,` +
                    `ship text,` +
                    `sensor text,` +
                    `reading int,` +
                    `PRIMARY KEY ((yyyymmddhhmm, ship, sensor), reading)` +
                    `) WITH CLUSTERING ORDER BY (reading ASC);`;

const writeQuery = `INSERT INTO ${keyspace}.${table} (yyyymmddhhmm, updated, ship, sensor, reading) VALUES (?, ?, ?, ?, ?)`;

const minuteQuery = `SELECT reading FROM ${keyspace}.${table} ` +
                    `WHERE yyyymmddhhmm = ? AND ship = ? AND sensor = ? `;

const monitorQuery = `SELECT reading FROM ${keyspace}.${table} ` +
                     `WHERE yyyymmddhhmm = ? AND ship = ? AND sensor = ? ` +
                     `LIMIT 1;`;

client.connect()
  .then(() => console.log('Connected to the DSE cluster, discovered %d nodes', client.hosts.length))
  .catch(err => console.error('There was an error trying to connect', err));

// Create the table in case it does not exist yet
async function createSchema() {
  //await client.execute(createKeyspace);
  await client.execute(createTable);
  return {statusCode: 200, body: `Successfully created ${keyspace}.${table} schema\n`};
}

// Add data to the table
async function addSensorReading(yyyymmddhhmm, updated, ship, sensor, reading) {
  const params = [ yyyymmddhhmm, updated, ship, sensor, reading ];
  await client.execute(writeQuery, params, { prepare: true, isIdempotent: true });
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: writeQuery,
      yyyymmddhhmm: yyyymmddhhmm,
      updated: updated,
      ship: ship,
      sensor: sensor,
      reading: reading
      })
  };
}

async function getReading(yyyymmddhhmm, ship, sensor) {
  const params = [ yyyymmddhhmm, ship, sensor ];
  const result = await client.execute(minuteQuery, params, { prepare : true });
  const row = result.first();
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: minuteQuery,
      reading: row.reading
    })
  };
}

async function sendSMS(receiver, sender, message) {
  console.log("Sending message", message, "to receiver", receiver);

  try {
    let data = await sns.publish({
      Message: message,
      PhoneNumber: receiver,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: sender
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Promotional'
        }
      }
    }).promise();

    console.log("Sent message to", receiver, "with data", data);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: data
      })
    };

  } catch (err) {
    console.log("Sending failed", err);
    throw err;
  }
}

async function monitorOxygen() {
  const time = new Date();
  const yyyymmddhhmm = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes())).slice(-2);

  console.log ("Checking oxygen levels in the rolling minute window", yyyymmddhhmm);
  const params = [ String(yyyymmddhhmm), "Starship Astra", "oxygen" ];
  const result = await client.execute(monitorQuery, params, { prepare : true });
  if (result.first()) {
    console.log ("Value", result);
    const oxygen = result.first().reading;
    if (oxygen < 18) {
      console.log ("Alert! Oxygen value", oxygen, "below threshold of 18 ppm. Immediate action required!");
      const response = await sendSMS (monitorSMSNumber, "Starship", "Alert! Oxygen value below threshold of 18 ppm. Immediate action required!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          query: monitorQuery,
          alert: "Alert!",
          yyyymmddhhmm: yyyymmddhhmm,
          reading: oxygen
        })
      };
    } else {
      console.log ("Oxygen levels normal at a minimum of", oxygen);
      return {
        statusCode: 200,
        body: JSON.stringify({
          query: monitorQuery,
          alert: "Normal!",
          yyyymmddhhmm: yyyymmddhhmm,
          reading: oxygen
        })
      };
    }
  } else {
    console.log ("No data available!");
    return {
      statusCode: 400,
      body: JSON.stringify({
        query: monitorQuery,
        alert: "No data available!"
      })
    };
  }
}

module.exports.createSchema = async (event) => {
  console.log('timeuuid in createCatalog: ' + myuuid);
  return createSchema();
};

module.exports.addSensorReading = async (event) => {
  console.log('timeuuid in addSensorReading: ' + myuuid);
  const data = JSON.parse(event.body);
  return addSensorReading(data.yyyymmddhhmm, data.updated, data.ship, data.sensor, data.reading);
};

module.exports.getReading = async (event) => {
  console.log('timeuuid in getLatest: ' + myuuid);
  //const data = event.query;
  return getReading('202008161210', 'Starship Astra', 'oxygen');
};

module.exports.sendSMS = async (event) => {
  console.log("sendSMS called");
  const data = JSON.parse(event.body);
  return sendSMS(data.receiver, data.sender, data.message);
};

module.exports.monitorOxygen = async () => {
  console.log('timeuuid in monitorOxygen: ' + myuuid);
  return monitorOxygen();
};