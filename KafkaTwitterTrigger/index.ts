import { AzureFunction, Context } from "@azure/functions"
import axios from "axios" 
import { StringDecoder } from "string_decoder"

const COGNITIVE_URL = process.env['COGNITIVE_URL']
const COGNITIVE_KEY = process.env['COGNITIVE_KEY']
const POWER_BI_URL = process.env['POWER_BI_URL']

const kafkaTrigger: AzureFunction = async function (context: Context, event: Buffer): Promise<void> {
    const dec = new StringDecoder('utf-8');
    let event_str = dec.write(event);
    context.log(event_str);
    // Process the event data
    let eventData = JSON.parse(event_str);

    context.log('Kafka trigger fired!', eventData);   

    // Analyze the tweet sentiment
    let r = await axios.post(COGNITIVE_URL, {
            documents: [
                {
                    id: 1,
                    text: eventData['text']
                }
            ]
        }, {headers: {'ocp-apim-subscription-key': COGNITIVE_KEY}});

    // Generate and send the analysis to Power BI
    let analysis = [
        {
            'tweettext': eventData['text'],
            'sentiment': r.data['documents'][0]['score'],
            'timestamp': new Date().toJSON(),
            'location': eventData['user']['location'],
            'handle': eventData['user']['screen_name']
        }
    ]
    await axios.post(POWER_BI_URL, analysis)
};

export default kafkaTrigger;
