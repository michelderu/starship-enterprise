'use strict';

//
// This middle layer provides REST endpoints that can be consumed by Monitoring Applications.
// It communcations with Astra through the REST APIs.
//

const keyspace = 'life_support_systems';
const table = 'sensor_data';

const astraRest = require('@astrajs/rest');
var astraClient;
const restBasePath = '/api/rest/v2/keyspaces/' + keyspace + '/' + table;
const restSchemaPath = '/api/rest/v2/schemas/keyspaces/' + keyspace + '/tables';

const astraDatabaseId = process.env['ASTRA_DB_ID'];
const astraDatabaseRegion = process.env['ASTRA_DB_REGION'];
const authToken = process.env['ASTRA_DB_APPLICATION_TOKEN'];

const monitorSMSNumber = process.env['MONITOR_SMS_NUMBER'];

const AWS = require('aws-sdk');
const sns = new AWS.SNS();

// Some sanity checking
if (!astraDatabaseId) throw new Error('Environment variable ASTRA_DB_ID not set');
if (!astraDatabaseRegion) throw new Error('Environment variable ASTRA_DB_REGION not set');
if (!authToken) throw new Error('Environment variable ASTRA_DB_APPLICATION_TOKEN not set');
if (!monitorSMSNumber) throw new Error('Environment variable MONITOR_SMS_NUMBER not set');

const writeQuery = `INSERT INTO ${keyspace}.${table} (yyyymmddhhmm, updated, ship, sensor, reading) VALUES (?, ?, ?, ?, ?)`;

const minuteQuery = `SELECT reading FROM ${keyspace}.${table} ` +
                    `WHERE yyyymmddhhmm = ? AND ship = ? AND sensor = ? `;

const monitorQuery = `SELECT reading FROM ${keyspace}.${table} ` +
                     `WHERE yyyymmddhhmm = ? AND ship = ? AND sensor = ? ` +
                     `LIMIT 1;`;

// Create an astra client if not available
async function getAstraClient() {
  if (!astraClient) {
      astraClient = await astraRest.createClient({
          astraDatabaseId: process.env.ASTRA_DB_ID,
          astraDatabaseRegion: process.env.ASTRA_DB_REGION,
          authToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
      });
  }
  return astraClient;
}

// Create the table in case it does not exist yet
async function createSchema() {
  console.debug('Getting Astra client connection');
  astraClient = await getAstraClient();
  console.debug('POST '+ restSchemaPath);
  // REST POST command to create a new table
  const response = await astraClient.post(restSchemaPath,
    {
      name: table,
      ifNotExists: true,
      columnDefinitions: [
          {name: 'yyyymmddhhmm', typeDefinition: 'text', static: false},
          {name: 'updated', typeDefinition: 'timestamp', static: false},
          {name: 'ship', typeDefinition: 'text', static: false},
          {name: 'sensor', typeDefinition: 'text', static: false},
          {name: 'reading', typeDefinition: 'int', static: false}
      ],
      primaryKey: { partitionKey: ['yyyymmddhhmm', 'ship', 'sensor'], clusteringKey: ['reading'] },
      tableOptions: { defaultTimeToLive: 0 }
    }
  );
  console.debug("Response: " + JSON.stringify(response));
  return {
    statusCode: response.status, 
    body: 'Created table: ' + JSON.stringify(response.data)
  };
}

// Add data to the table
async function addSensorReading(yyyymmddhhmm, updated, ship, sensor, reading) {
  console.debug('Getting Astra client connection');
  astraClient = await getAstraClient();
  console.debug('POST ' + restBasePath);
  // REST POST command to add data to a table
  const response = await astraClient.post(restBasePath,
    {
      yyyymmddhhmm: yyyymmddhhmm,
      updated: updated,
      ship: ship,
      sensor: sensor,
      reading: reading,
    }
  );
  console.debug("Response: " + JSON.stringify(response));
  return {
    statusCode: response.status,
    body: 'Saved data: ' + JSON.stringify(response.data)
  };
}

// Get a rolling 1 minute reading based on the ship and sensor
async function getReading(yyyymmddhhmm, ship, sensor) {

  console.debug('Getting Astra client connection');
  astraClient = await getAstraClient();
  const query = {
    params: {
      where: {
        yyyymmddhhmm: {
          $eq: yyyymmddhhmm
        },
        ship: {
          $eq: ship
        },
        sensor: {
          $eq: sensor
        }
      }
    }
  };
  console.debug('GET ' + restBasePath + ' with query: ' + JSON.stringify(query));
  // REST GET command to query a table
  const response = await astraClient.get(restBasePath, query);
  console.debug("Response: " + JSON.stringify(response));
  return {
    statusCode: response.status,
    body: 'Result: ' + JSON.stringify(response.data)
  };
}

// Send an alert to a SMS consumer
async function sendSMS(receiver, sender, message) {
  console.debug('Sending message', message, 'to receiver', receiver);
  try {
    let data = await sns.publish({
      Message: message,
      PhoneNumber: receiver,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          'DataType': 'String',
          'StringValue': sender
        },
        'AWS.SNS.SMS.SMSType': {
          'DataType': 'String',
          'StringValue': 'Promotional'
        }
      }
    }).promise();
    console.log('Sent message to', receiver, 'with data', data);
    return {
      statusCode: 200,
      body: 'AWS SNS Response: ' + JSON.stringify(data)
    };
  } catch (err) {
    console.log('Sending failed', err);
    return {
      statusCode: 500,
      body: 'Error: ' + JSON.stringify(err)
    };
  }
}

// Continously monitor the oxygen and send an alert if the level drops below 18 ppm
async function monitorOxygen(ship) {
  // Current time
  const time = new Date();
  // Get the rolling window of a minute
  const yyyymmddhhmm = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes())).slice(-2);
  console.debug('Checking oxygen levels on space ship ' + ship + ' in the rolling minute window', yyyymmddhhmm);

  console.debug('Getting Astra client connection');
  astraClient = await getAstraClient();
  const query = {
    params: {
      where: {
        yyyymmddhhmm: {
          $eq: yyyymmddhhmm
        },
        ship: {
          $eq: ship
        },
        sensor: {
          $eq: 'oxygen'
        }
      },
      'page-size': 1,
      fields: 'reading'
    }
  };
  console.debug('GET ' + restBasePath + ' with query: ' + JSON.stringify(query));
  // REST GET command to query a table, limit by 1 and return a specific value
  const response = await astraClient.get(restBasePath, query);
  console.debug("Response: " + JSON.stringify(response));
  if (response.status == 200 && response.data.length > 0) {
    // Yes! We have some results
    const reading = response.data[0].reading;
    if (reading < 18) {
      // Reading is in the ALERT zone!
      console.debug('Alert! Oxygen value ' + reading + ' in space ship ' + ship + ' below threshold of 18 ppm. Immediate action required!');
      // Send an alert to the SMS consumer
      const response = await sendSMS (monitorSMSNumber, 'OxygenMon', 'Alert! Oxygen value below threshold of 18 ppm on ' + ship + '. Current value is ' + reading + '. Immediate action required!');
      return {
        statusCode: 200,
        body: JSON.stringify({
          query: query,
          alert: 'Alert!',
          yyyymmddhhmm: yyyymmddhhmm,
          reading: reading
        })
      };
    } else {
      // No worries
      console.log ('Oxygen levels normal at a minimum of', reading);
      return {
        statusCode: 200,
        body: JSON.stringify({
          query: query,
          alert: 'Normal!',
          yyyymmddhhmm: yyyymmddhhmm,
          reading: reading
        })
      };
    }
  } else {
    // No rows retrieved
    console.log ('No data available!');
    return {
      statusCode: 201,
      body: JSON.stringify({
        query: query,
        alert: 'No data available!'
      })
    };
  }
}

// Get the readings from the last 5 minutes
async function getReadings(ship, sensor) {
  // Current time
  const time = new Date();
  // Get the rolling window of a minute
  var yyyymmddhhmm = [];
  yyyymmddhhmm[0] = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes())).slice(-2);
  yyyymmddhhmm[1] = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes()-1)).slice(-2);
  yyyymmddhhmm[2] = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes()-2)).slice(-2);
  yyyymmddhhmm[3] = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes()-3)).slice(-2);
  yyyymmddhhmm[4] = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate())).slice(-2) + ('0' + (time.getHours()+2)).slice(-2) + ('0' + (time.getMinutes()-4)).slice(-2);

  console.debug('Checking oxygen levels on space ship ' + ship + ' in the window', yyyymmddhhmm[0], 'until', yyyymmddhhmm[4]);

  console.debug('Getting Astra client connection');
  astraClient = await getAstraClient();

  // Loop 5 times to get the 5 minute window
  var result = [];
  for (var i=0; i <= 4; i++) {
    var query = {
      params: {
        where: {
          yyyymmddhhmm: {
            $eq: yyyymmddhhmm[i]
          },
          'ship': {
            $eq: ship
          },
          sensor: {
            $eq: 'oxygen'
          }
        }
      }
    };
    console.debug('GET ' + restBasePath + ' with query: ' + JSON.stringify(query));
    // REST GET command to query a table
    const response = await astraClient.get(restBasePath, query);
    console.debug("Response #" + i + ": " + JSON.stringify(response));
    if (response.status == 200 && response.data.length > 0) {
      // Yes! We have some results, construct the result
      result = [].concat(result, response.data);
    }
  }
  console.debug("Result: " + JSON.stringify(result));
  // Make sure to add CORS headers to be able to call this endpoint from React
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(result)
  };
}

module.exports.createSchema = async () => {
  return createSchema();
}

module.exports.addSensorReading = async (event) => {
  const data = JSON.parse(event.body);
  return addSensorReading(data.yyyymmddhhmm, data.updated, data.ship, data.sensor, data.reading);
};

module.exports.getReading = async (event) => {
  const data = JSON.parse(event.body);
  return getReading(data.yyyymmddhhmm, data.ship, data.sensor);
};

module.exports.sendSMS = async (event) => {
  const data = JSON.parse(event.body);
  return sendSMS(data.receiver, data.sender, data.message);
};

module.exports.monitorOxygen = async (event) => {
  const data = JSON.parse(event.body);
  return monitorOxygen(data.ship);
};

module.exports.getReadings = async (event) => {
  const data = JSON.parse(event.body);
  return getReadings(data.ship, data.sensor);
};