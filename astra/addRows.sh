source astra_environment.txt
source astra_token.txt

#  yyyymmddhhmm text,
#  updated timestamp,
#  ship text,
#  sensor text,
#  oxygen int,
#  flow int,

# Add row data
echo "Adding one row of data"
curl -w " %{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/sensor_data/rows \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{"columns":[
  {"name":"yyyymmddhhmm","value":"202008161210"},
  {"name":"updated","value":"2020-08-16 12:10:31.020"},
  {"name":"ship","value":"Starship Astra"},
  {"name":"sensor","value":"oxygen"},
  {"name":"reading","value":18}
  ]}'

echo

echo "Adding one row of data"
curl -w " %{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/sensor_data/rows \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{"columns":[
  {"name":"yyyymmddhhmm","value":"202008161210"},
  {"name":"updated","value":"2020-08-16 12:10:31.020"},
  {"name":"ship","value":"Starship Astra"},
  {"name":"sensor","value":"oxygen"},
  {"name":"reading","value":20}
  ]}'

echo

echo "Adding one row of data"
curl -w " %{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/sensor_data/rows \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{"columns":[
  {"name":"yyyymmddhhmm","value":"202008161210"},
  {"name":"updated","value":"2020-08-16 12:10:31.020"},
  {"name":"ship","value":"Starship Astra"},
  {"name":"sensor","value":"oxygen"},
  {"name":"reading","value":17}
  ]}'

echo