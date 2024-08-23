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
}