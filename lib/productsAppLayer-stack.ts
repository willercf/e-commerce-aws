import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class ProductsAppLayerStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {

        super(scope, id, props);
        const productsLayers = new lambda.LayerVersion(
            this,
            "ProductsLayers",
            {
                code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
                compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
                layerVersionName: "ProductsLayers",
                removalPolicy: cdk.RemovalPolicy.DESTROY
            }
        );
        new ssm.StringParameter(
            this,
            "ProductsLayersVersionArn",
            {
                parameterName: "ProductsLayersVersionArn",
                stringValue: productsLayers.layerVersionArn
            }
        );

        const productEventsLayers = new lambda.LayerVersion(
            this,
            "ProductEventsLayers",
            {
                code: lambda.Code.fromAsset('lambda/products/layers/productEventsLayer'),
                compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
                layerVersionName: "ProductEventsLayers",
                removalPolicy: cdk.RemovalPolicy.DESTROY
            }
        );
        new ssm.StringParameter(
            this,
            "ProductEventsLayersVersionArn",
            {
                parameterName: "ProductEventsLayersVersionArn",
                stringValue: productEventsLayers.layerVersionArn
            }
        );
    }
}