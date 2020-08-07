source astra_environment.txt
source astra_credentials.txt

curl --request POST \
  --url https://${ASTRA_CLUSTER_ID}-${ASTRA_CLUSTER_REGION}.apps.astra.datastax.com/api/rest/v1/auth \
  --header 'accept: */*' \
  --header 'content-type: application/json' \
  --header "x-cassandra-request-id: ${ASTRA_UUID}" \
  --data '{"username":"'"${ASTRA_DB_USERNAME}"'", "password":"'"${ASTRA_DB_PASSWORD}"'"}'

  echo