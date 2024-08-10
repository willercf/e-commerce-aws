import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from "aws-sdk";

const productsDdb = process.env.PRODUCTS_TABLE!;
const ddbClient = new DynamoDB.DocumentClient();
const productRepository = new ProductRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const lambdaRequestId = context.awsRequestId;
    const apiRequestId = event.requestContext.requestId;
    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`);
    console.log(`Product Table: ${productsDdb}`);

    if (event.resource === "/products") {

        console.log("POST /products");
        const product = JSON.parse(event.body!) as Product;
        const result = await productRepository.create(product);
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
                const product = await productRepository.delete(productId);
                return {
                    statusCode: 200,
                    body: JSON.stringify(product)
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