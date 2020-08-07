source astra_environment.txt
source astra_token.txt

#CREATE TABLE IF NOT EXISTS oxigen_filter_sensor (
#  	name text,
#  	description text,
#  	flow decimal,
#  	oxigen decimal,
#  	updated timestamp,
#  	PRIMARY KEY (name, updated)
#);

# Create table for Oxigen Filter Levels
curl -w "%{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables \
  --header 'accept: */*' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{
        "name":"oxygen_filter",
        "ifNotExists":true,
        "columnDefinitions": [
            {"name":"name","typeDefinition":"text","static":false}, 
            {"name":"description","typeDefinition":"text","static":false}, 
            {"name":"flow","typeDefinition":"decimal","static":false}, 
            {"name":"oxygen","typeDefinition":"decimal","static":false}, 
            {"name":"updated","typeDefinition":"timestamp","static":false}
        ],
        "primaryKey": {"partitionKey":["name"], "clusteringKey":["updated"]},
        "tableOptions":{"defaultTimeToLive":0}
    }'

  echo