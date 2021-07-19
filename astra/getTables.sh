source astra_environment.txt
source astra_token.txt

# Create table for Oxigen Filter Levels
curl --request GET \
  --url https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces/life_support_systems/tables \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "x-cassandra-token: ${ASTRA_DB_APPLICATION_TOKEN}"

  echo