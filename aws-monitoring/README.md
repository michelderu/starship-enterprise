# Apache Cassandra REST API with AWS Lambda in Node.js
This example shows how to use [AWS Lambda](https://aws.amazon.com/lambda/) with the [Node.js DataStax Cassandra Driver](https://docs.datastax.com/en/developer/nodejs-driver/latest) to set up a basic REST API for a Cassandra database via HTTP Endpoints. The [Serverless Framework](https://serverless.com/) is used to facilitate the setup and deployment of the functions.

Contributor(s): [Chris Splinter](https://github.com/csplinter)

## Objectives
- How to use the DataStax Cassandra Driver with AWS Lambda functions
- How to use the Serverless Framework to set up AWS LAmbda functions HTTP Endpoints

## Project Layout
- [handler.js](handler.js): Contains the DataStax Cassandra Driver connection and queries as well as the AWS Lambda function entry points.
- [serverless.yml](serverless.yml): Used by serverless to deploy and configure the AWS Lambda artifacts needed to run the function.
- [package.json](package.json): Defines the dependencies and descriptive example metadata.

## How it works
The Serverless Framework handles the packaging and deployment of the functions to the AWS resources. Once the functions are deployed, the DataStax Cassandra Driver establishes the connection to the database and returns the results via the AWS Lambda HTTP Endpoints which can be accessed to interact with the database.

## Setup & Running

### Setup
Before running with this example, head over to the [SETUP-README](SETUP-README.md) for instructions on how to 
1. launch an instance in AWS EC2
2. install and start a Cassandra database
3. setup your local development environment for Node.js and [serverless](https://serverless.com)

Once the above is completed, you will have all of the needed pieces in place to run this example.

1. Clone this repository
```
git clone https://github.com/DataStax-Examples/aws-lambda-nodejs.git
```
2. Go to the `aws-lambda-nodejs` directory
```
cd aws-lambda-nodejs
```
3. Install the DataStax Cassandra Driver
```
npm install cassandra-driver
```
4. Configure `serverless.yml` with your S3 bucket, Contact Points ( public IP of AWS EC2 instance ), and Local Data Center ( likely `datacenter1` )

### Running
From the project directory, deploy your function. This should output the endpoints that you can use to access the database.
```
sls deploy
```
* When you are done, don't forget to clean things up with
```
sls remove
```

### Using the HTTP Endpoints
#### createCatalog
```
curl -X POST https://<function-id>.execute-api.us-east-2.amazonaws.com/dev/catalog/create
````
expected output:
```
Successfully created shopping.catalog schema
```
#### addItem
```
curl -X POST -d '{"item_id": 0, "name": "name_0", "description": "desc_0", "price": 10.1}' https://<function-id>.execute-api.us-east-2.amazonaws.com/dev/catalog/add
```
expected output:
```
{"query":"INSERT INTO shopping.catalog (item_id, name, description, price) VALUES (?, ?, ?, ?)","item_id":0,"name":"name_0","description":"desc_0","price":10.1}
```
#### getItem
```
curl -X GET https://<function-id>.execute-api.us-east-2.amazonaws.com/dev/catalog/get/0
```
expected output:
```
{"query":"SELECT name, description, price FROM shopping.catalog WHERE item_id = ?","item_id":"0","name":"name_0","description":"desc_0","price":"10.1"}
```

