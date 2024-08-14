import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB, Lambda } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";
import { json } from "stream/consumers";

AWSXRay.captureAWS(require("aws-sdk"));

const productsDdb = process.env.PRODUCTS_TABLE!;
const ddbClient = new DynamoDB.DocumentClient();
const productRepository = new ProductRepository(ddbClient, productsDdb);
const lambdaClient = new Lambda();
const productEventsFunctionName = process.env.PRODUCT_EVENTS_FUNCTION_NAME!;
const EMAIL_TEMP = "willercf@gmail.com"

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const lambdaRequestId = context.awsRequestId;
    const apiRequestId = event.requestContext.requestId;
    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`);
    console.log(`Product Table: ${productsDdb}`);

    if (event.resource === "/products") {

        console.log("POST /products");
        const product = JSON.parse(event.body!) as Product;
        const result = await productRepository.create(product);
        const responseEvent = await sendEvent(result, ProductEventType.CREATED, EMAIL_TEMP, lambdaRequestId);
        console.log(JSON.stringify(responseEvent));
        return {
            statusCode: 201,
            body: JSON.stringify(result)
        }
    } else if (event.resource === "/products/{id}") {

        const productId = event.pathParameters!.id as string;
        if (event.httpMethod === "PUT") {
            console.log(`PUT /products/${productId}`);
            const product = JSON.parse(event.body!) as Product;
            try {
                const result = await productRepository.update(productId, product);
                const responseEvent = await sendEvent(result, ProductEventType.UPDATED, EMAIL_TEMP, lambdaRequestId);
                console.log(JSON.stringify(responseEvent));
                return {
                    statusCode: 200,
                    body: JSON.stringify(result)
                }
            } catch (error) {
                console.error((<Error>error).message);
                return {
                    statusCode: 404,
                    body: 'Product Not Found'
                }
            }
        } else if (event.httpMethod === "DELETE") {

            console.log(`DELETE /products/${productId}`);
            try {
                const result = await productRepository.delete(productId);
                const responseEvent = await sendEvent(result, ProductEventType.DELETED, EMAIL_TEMP, lambdaRequestId);
                console.log(JSON.stringify(responseEvent));
                return {
                    statusCode: 200,
                    body: JSON.stringify(result)
                }
            } catch (error) {
                console.error((<Error>error).message);
                return {
                    statusCode: 404,
                    body: (<Error>error).message
                }
            }
        }
    }

    return {
        statusCode: 400,
        body: "Bad request bro"
    }
}

function sendEvent(product: Product, eventType: ProductEventType, email: string, lambdaRequestId: string) {

    const event: ProductEvent = {
        email: email,
        eventType: eventType,
        productCode: product.code,
        productId: product.id,
        productPrice: product.price,
        requestId: lambdaRequestId
    }

    return lambdaClient.invoke({
        FunctionName: productEventsFunctionName,
        Payload: JSON.stringify(event),
        InvocationType: "RequestResponse"
    }).promise();
}