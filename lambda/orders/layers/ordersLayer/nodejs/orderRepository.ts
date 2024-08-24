import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { database } from "aws-xray-sdk";
import { v4 as uuid } from 'uuid';

export interface OrderProduct {
    code: string,
    price: number
}

export interface Order {
    pk: string,
    sk?: string,
    createdAt?: number,
    shipping: {
        type: "URGENT" | "ECONOMIC",
        carrier: "CORREIOS" | "FEDEX"
    },
    billing: {
        payment: "CASH" | "DEBIT_CARD" | "CREDIT_CARD",
        totalPrice: number
    },
    products: OrderProduct[]
}

export class OrderRepository {
    private ddbClient: DocumentClient;
    private ordersDdb: string;

    constructor(ddbClient: DocumentClient, ordersDdb: string) {
        this.ddbClient = ddbClient;
        this.ordersDdb = ordersDdb;
    }

    async create(order: Order): Promise<Order> {
        order.sk = uuid();
        order.createdAt = Date.now();
        await this.ddbClient.put({
            TableName: this.ordersDdb,
            Item: order
        }).promise();
        return order;
    }

    async getAll(): Promise<Order[]> {

        const result = await this.ddbClient.scan({
            TableName: this.ordersDdb
        }).promise();
        return result.Items as Order[];
    }

    async findByEmail(email: string): Promise<Order[]> {
        
        const result = await this.ddbClient.query({
            TableName: this.ordersDdb,
            KeyConditionExpression: "pk = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        }).promise();
        return result.Items as Order[];
    }

    async findByEmailAndOrderId(email: string, orderId: string): Promise<Order> {
 
        const result = await this.ddbClient.get({
            TableName: this.ordersDdb,
            Key: {
                pk: email,
                sk: orderId
            }
        }).promise();

        if (result.Item) {
            return result.Item as Order;
        } else {
            throw new Error("Order Not Found");
        }
    }

    async deleteByEmailAndOrderId(email: string, orderId: string): Promise<Order> {

        const result = await this.ddbClient.delete({
            TableName: this.ordersDdb,
            Key: {
                pk: email,
                sk: orderId
            },
            ReturnValues: "ALL_OLD"
        }).promise();
        if (result.Attributes) {
            return result.Attributes as Order;
        } else {
            throw new Error("Order Not Found");
        }
    }
}