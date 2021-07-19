source astra_environment.txt
source astra_token.txt

# Create table for Oxigen Filter Levels
curl --request POST \
  --url https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/sensor_data/rows/query \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-token: ${ASTRA_DB_APPLICATION_TOKEN}" \
  --data '{"filters":[{
    "columnName":"yyyymmddhhmm",
    "operator":"eq",
    "value":["202008161210"]
  }, {
    "columnName":"ship",
    "operator":"eq",
    "value":["Starship Astra"]
  }, {
    "columnName":"sensor",
    "operator":"eq",
    "value":["oxygen"]
  }]}'

  echo