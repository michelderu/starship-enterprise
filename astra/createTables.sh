source astra_environment.txt
source astra_token.txt

#CREATE TABLE IF NOT EXISTS sensor_data (
#  yyyymmddhhmm text,
#  updated timestamp,
#  ship text,
#  sensor text,
#  oxygen int,
#  flow int,
#  PRIMARY KEY ((yymmddhhmm, ship, sensor), oxygen)
#) WITH CLUSTERING ORDER BY (oxygen ASC);

# Initially drop the table
echo "Dropping table"
curl -w "%{http_code}" --request DELETE \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/sensor_data \
  --header 'accept: */*' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}"

echo

# Create table for Oxigen Filter Levels
echo "Creating table"
curl -w "%{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables \
  --header 'accept: */*' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{
        "name":"sensor_data",
        "ifNotExists":true,
        "columnDefinitions": [
            {"name":"yyyymmddhhmm", "typeDefinition":"text", "static":false}, 
            {"name":"updated", "typeDefinition":"timestamp", "static":false}, 
            {"name":"ship", "typeDefinition":"text", "static":false}, 
            {"name":"sensor", "typeDefinition":"text", "static":false}, 
            {"name":"reading", "typeDefinition":"int", "static":false}
        ],
        "primaryKey": {"partitionKey":["yyyymmddhhmm", "ship", "sensor"], "clusteringKey":["reading"]},
        "tableOptions":{"defaultTimeToLive":0}
    }'

  echo