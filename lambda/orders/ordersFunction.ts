import { DynamoDB } from "aws-sdk";
import { Order, OrderRepository } from "/opt/nodejs/ordersLayer";
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";
import * as AWSXRay from "aws-xray-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { OrderProductResponse, OrderRequest } from "/opt/nodejs/ordersApiLayer";

const ordersTable = process.env.ORDERS_TABLE!;
const productsTable = process.env.PRODUCTS_TABLE!;

const ddbClient = new DynamoDB.DocumentClient();

const orderRepository = new OrderRepository(ddbClient, ordersTable);
const productRepository = new ProductRepository(ddbClient, productsTable);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const method = event.httpMethod;
    const apiRequestId = event.requestContext.requestId;
    const lambdaRequestId = context.awsRequestId;

    console.log(`API Gateway RequestId: ${apiRequestId} - LambdaRequestId: ${lambdaRequestId}`);

    if (method === "GET") {
        console.log("GET /orders");
        if (event.queryStringParameters) {
            const email = event.queryStringParameters!.email;
            const orderId = event.queryStringParameters!.orderId;
            if (email) {
                if (orderId) {
                    // GET one order from an user
                } else {
                    // GET all orders from an user
                }
            }
        } else {
            // GET all ordres
        }
    } else if (method === "POST") {
        console.log("POST /orders");
    } else if (method === "DELETE") {
        console.log("DELETE /orders");
        const email = event.queryStringParameters!.email;
        const orderId = event.queryStringParameters!.orderId;
        console.log(`email: ${email} - orderId: ${orderId}`);
    }

    return {
        statusCode: 400,
        body: "Bad Request"
    }
}

function buildOrder(orderRequest: OrderRequest, products: Product[]): Order {

    const orderProducts: OrderProductResponse[] = [];
    let totalPrice = 0;
    products.forEach((product) => {
        totalPrice += product.price;
        orderProducts.push({
            code: product.code,
            price: product.price
        })
    });

    const order: Order = {
        pk: orderRequest.email,
        billing: {
            payment: orderRequest.paymentType,
            totalPrice: totalPrice
        },
        shipping: {
            type: orderRequest.shipping.type,
            carrier: orderRequest.shipping.carrier
        },
        products: orderProducts
    }

    return order;
}