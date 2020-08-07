source astra_environment.txt
source astra_token.txt

curl --request GET \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/keyspaces \
  --header 'accept: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --header "x-cassandra-token: ${ASTRA_AUTHORIZATION_TOKEN}"

echo