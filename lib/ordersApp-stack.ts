import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface OrdersAppStackProps extends cdk.StackProps {
    productsTable: dynamodb.Table;
}

export class OrdersAppStack extends cdk.Stack {
 
    readonly ordersHandler: lambdaNodeJS.NodejsFunction;
    
    constructor(scope: Construct, id: string, props: OrdersAppStackProps) {

        super(scope, id, props);
        const ordersTable = new dynamodb.Table(
            this,
            "OrdersTable",
            {
                tableName: "orders",
                partitionKey: {
                    name: "pk",
                    type: dynamodb.AttributeType.STRING
                },
                sortKey: {
                    name: "sk",
                    type: dynamodb.AttributeType.STRING
                },
                billingMode: dynamodb.BillingMode.PROVISIONED,
                readCapacity: 1,
                writeCapacity: 1
            }
        );

        //Orders Layer
        const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersLayerVersionArn");
        const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersLayerVersionArn", ordersLayerArn);

         //Orders API Layer
         const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersApiLayerVersionArn");
         const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersApiLayerVersionArn", ordersApiLayerArn);

        //Product Layer
        const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayersVersionArn");
        const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayersVersionArn", productsLayerArn);

        this.ordersHandler = new lambdaNodeJS.NodejsFunction(
            this,
            "OrdersFunction",
            {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "OrdersFunction",
                entry: "lambda/orders/ordersFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(10),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    ORDERS_TABLE: ordersTable.tableName,
                    PRODUCTS_TABLE: props.productsTable.tableName
                },
                layers: [ordersLayer, productsLayer, ordersApiLayer],
                tracing: lambda.Tracing.ACTIVE,
                insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
            }
        );

        ordersTable.grantWriteData(this.ordersHandler);
        props.productsTable.grantReadData(this.ordersHandler);
    }    
}
