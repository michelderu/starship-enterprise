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

# Add row data
curl -w " %{http_code}" --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables/oxygen_filter/rows \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}" \
  --data '{"columns":[
  {"name":"name","value":"engine_room"},
  {"name":"description","value":"Engine room filter array"},
  {"name":"flow","value":"5"},
  {"name":"oxigen","value":"18"},
  {"name":"updated","value":"2019-01-10 09:48:31.020+0040"}
  ]}'

  echo