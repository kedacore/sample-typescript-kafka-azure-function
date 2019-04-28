# Sample tweet processor (Azure Functions + Kafka)

The following sample includes an Azure Function (written in TypeScript) that triggers on changes to a local Kafka topic.  The Kafka topic is being populated by tweets.  As the function triggers, it will populate a real-time Power BI dashboard (optional) with information on the tweet sentiment.

## Pre-requisites

* Docker installed
* Kubernetes cluster
* KEDA installed on the cluster
* [Azure Functions core tools](https://github.com/azure/azure-functions-core-tools#installing)
* A [registered twitter application](https://developer.twitter.com/apps) with associated consumer key + secret and access token + secret

## Setup

The below will walk you through creating a Kafka topic within your function, publishing your function to that cluster, and then publishing an agent to pull data from Twitter and publish it to Kafka.  As the events land in Kafka, the function will automatically trigger and scale.  Feel free to skip portions if they already exist in your cluster.

#### Clone the repo and navigate to it
```cli
git clone https://github.com/kedacore/sample-typescript-kafka-azure-function
cd sample-typescript-kafka-azure-function
```

### Create a Kafka topic in your cluster

#### [Install helm](https://helm.sh/docs/using_helm/)

#### Add the confluent helm repo
```cli
helm repo add confluentinc https://confluentinc.github.io/cp-helm-charts/
helm repo update
```

#### Deploy the Confluent Kafka helm chart
```cli
helm install --name kafka --set cp-schema-registry.enabled=false,cp-kafka-rest.enabled=false,cp-kafka-connect.enabled=false,dataLogDirStorageClass=default,dataDirStorageClass=default,storageClass=default confluentinc/cp-helm-charts
```

You'll need to wait for the deployment to complete before continuing.  This may take a few minutes to spin up all the stateful sets.

#### Deploy a kafka client pod with configuration
```cli
kubectl apply -f deploy/kafka-client.yaml
```

#### Log into the Kafka client
```cli
kubectl exec -it kafka-client -- /bin/bash
```

#### Create a kafka topic
```cli
kafka-topics --zookeeper kafka-cp-zookeeper-headless:2181 --topic twitter --create --partitions 5 --replication-factor 1 --if-not-exists

exit
```

### Deploying the function app

#### Deploy the function app

```cli
func kubernetes deploy --name twitter-function --registry <docker-hub-username>
```

Alternatively, you can build and publish the image on your own and provide the `--image-name` instead of the `--registry`

#### Validate the function is deployed

```cli
kubectl get deploy
```

You should see the `twitter-function` is deployed, but since there are no Twitter events it has 0 replicas.

### Feed twitter data

#### Setup twitter consumer

Open the `./deploy/twitter-to-kafka.yaml` file and replace the environment variables near the bottom of the deployment with your own values:

|Name|Description|Example|
|--|--|--|
|TWITTER_STREAMING_MODE|Streaming mode for tweepy|normal|
|KAFKA_ENDPOINT|Kafka endpoint to publish|kafka-cp-kafka-headless:9092|
|CONSUMER_KEY|Twitter app consumer key|MGxxxxxxxx|
|CONSUMER_SECRET|Twitter app consumer secret|RBpw98sxukm3kKYxxxxx|
|ACCESS_TOKEN|Twitter app access token|126868398-2uGxxxxxx|
|ACCESS_TOKEN_SECRET|Twitter app access token secret|oqiewyaPj0QFDk3Xl2Pxxxxx|
|KAFKA_TOPIC|Kafka topic to publish|twitter|
|SEARCH_TERM|Twitter search term|Avengers|

Save the changes

#### Deploy the twitter consumer

```cli
kubectl apply -f deploy/twitter-to-kafka.yaml
```

### Validate and view outputs

#### View the current deployments

As the twitter consumer spins up it should start emitting data.  You should then see the `twitter-function` get 1 or more instances.  The scale-out can be adjusted by modifying how many messages each instance will pull at once (defined in the `host.json` file of the function), or the `lagThreshold` of the created `ScaledObject` in Kubernetes.

```cli
# View the current Kubernetes deployments
kubectl get deploy

# View the logs of function pods
kubectl get pods
kubectl logs twitter-function-<some-pod-Id>
```

You should see logs streaming with tweet data and sentiment scores:

```bash
info: Function.KafkaTwitterTrigger.User[0]
      Tweet analyzed
      Tweet text: RT @ballerguy: Yeah avengers endgame was good but I found out my boyfriend is a movie clapper so at what cost
      Sentiment: 0.09523809523809523
info: Function.KafkaTwitterTrigger[0]
      Executed 'Functions.KafkaTwitterTrigger' (Succeeded, Id=67cc49a3-0e13-4fa8-b605-a041ce37420a)
info: Host.Triggers.Kafka[0]
      Stored commit offset twitter / [3] / 37119
```

## Clean up resources

You can run the following to clean up resources created as part of this sample:

```cli
kubectl delete deploy/twitter-to-kafka-deployment
kubectl delete deploy/twitter-function
kubectl delete ScaledObject/twitter-function
kubectl delete Secret/twitter-function
kubectl delete pod kafka-client
helm delete kafka
```