import { AzureFunction, Context } from "@azure/functions"
import axios from "axios" 
import { StringDecoder } from "string_decoder"
import Sentiment = require("sentiment");

const POWER_BI_URL = process.env['POWER_BI_URL'];
const sentiment = new Sentiment();

const kafkaTrigger: AzureFunction = async function (context: Context, event: Buffer): Promise<void> {
    const dec = new StringDecoder('utf-8');
    let event_str = dec.write(event);

    // Process the event data
    let eventData = JSON.parse(event_str);

    context.log('Kafka trigger fired!');   

    // Analyze the tweet sentiment
    let score = sentiment.analyze(eventData['text']).comparative;

    context.log(`Tweet analyzed \nTweet text: ${eventData['text']} \nSentiment: ${score}`);
    
    // UNCOMMENT THIS if you want to send to Power BI Streaming Dataset
    // let analysis = [
    //     {
    //         'tweettext': eventData['text'],
    //         'sentiment': score,
    //         'timestamp': new Date().toJSON(),
    //         'location': eventData['user']['location'],
    //         'handle': eventData['user']['screen_name']
    //     }
    // ]
    // await axios.post(POWER_BI_URL, analysis)
};

export default kafkaTrigger;
