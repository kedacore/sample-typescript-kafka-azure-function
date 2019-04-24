# Sample Azure Function (typescript) in KEDA

The following sample includes an Azure Function (written in TypeScript) that triggers on changes to a local Kafka stream.  

## Scenario

The `kafka_publisher` deployment includes a simple Python script to stream real-time data from twitter and push it to a local Kafka cluster.  This Azure Function can trigger on the kafka feed, will process the tweet data using the Azure Cognitive Services to get a sentiment score, and publish the data to a real-time Power BI dashboard.