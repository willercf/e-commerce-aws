import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";

interface ProductsAppStackProps extends cdk.StackProps {
    eventsDdb: dynamoDB.Table;
}

export class ProductAppStack extends cdk.Stack {

    readonly productsFetchHandler: lambdaNodeJS.NodejsFunction;
    readonly productsAdminHandler: lambdaNodeJS.NodejsFunction;
    readonly productsTable: dynamoDB.Table;

    constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
        
        super(scope, id, props);
        this.productsTable = new dynamoDB.Table(
            this,
            "ProductsTable",
            {
                tableName: "products",
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                partitionKey: {
                    name: "id",
                    type: dynamoDB.AttributeType.STRING
                },
                billingMode: dynamoDB.BillingMode.PROVISIONED,
                readCapacity: 1,
                writeCapacity:1
            }
        );

        // Products Layer
        const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayersVersionArn");
        const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayersVersionArn", productsLayerArn);
        
        // Product Events Layer
        const productEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductEventsLayersVersionArn");
        const productEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductEventsLayersVersionArn", productEventsLayerArn);

        const productsEventHandler = new lambdaNodeJS.NodejsFunction(
            this,
            "ProductsEventsFunction",
            {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "ProductsEventsFunction",
                entry: "lambda/products/productsEventsFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(10),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    EVENTS_TABLE: props.eventsDdb.tableName
                },
                layers: [productEventsLayer],
                tracing: lambda.Tracing.ACTIVE,
                insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
            }
        );
        props.eventsDdb.grantWriteData(productsEventHandler);

        this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(
            this,
            "ProductsFetchFunction",
            {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "ProductsFetchFunction",
                entry: "lambda/products/productsFetchFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(10),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    PRODUCTS_TABLE: this.productsTable.tableName
                },
                layers: [productsLayer],
                tracing: lambda.Tracing.ACTIVE,
                insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
            }
        );
        this.productsTable.grantReadData(this.productsFetchHandler);

        this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(
            this,
            "ProductsAdminFunction",
            {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "ProductsAdminFunction",
                entry: "lambda/products/productsAdminFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(10),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    PRODUCTS_TABLE: this.productsTable.tableName,
                    PRODUCT_EVENTS_FUNCTION_NAME: productsEventHandler.functionName
                },
                layers: [productsLayer, productEventsLayer],
                tracing: lambda.Tracing.ACTIVE,
                insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
            }
        );
        this.productsTable.grantWriteData(this.productsAdminHandler);
        productsEventHandler.grantInvoke(this.productsAdminHandler);
    }
}