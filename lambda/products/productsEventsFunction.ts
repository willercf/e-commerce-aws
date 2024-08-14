import { Callback, Context } from "aws-lambda";
import { ProductEvent } from "/opt/nodejs/productEventsLayer";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { Product } from "aws-cdk-lib/aws-servicecatalog";

AWSXRay.captureAWS(require("aws-sdk"));
const eventDdb = process.env.EVENTS_TABLE!;
const ddbClient = new DynamoDB.DocumentClient();

export async function handler(event: ProductEvent, context: Context, callback: Callback): Promise<void> {

    //TODO - to be removed
    console.log(JSON.stringify(event));
    console.log(`Lambda Request Id: ${context.awsRequestId}`);

    await create(event);
    callback(null, JSON.stringify({
        productEventCreated: true,
        message: "ok"
    }));
}

function create(event: ProductEvent) {
    const timestamp = Date.now();
    const ttl = ~~(timestamp / 1000) + (5 * 60); // 5 minutos a frente do tempo de criação

    return ddbClient.put({
        TableName: eventDdb,
        Item: {
            pk: `#product_${event.productCode}`,
            sk: `${event.eventType}#${timestamp}`,
            email: event.email,
            createdAt: timestamp,
            eventType: event.eventType,
            info: {
                productId: event.productId,
                price: event.productPrice
            },
            ttl: ttl
        }
    }).promise();
}