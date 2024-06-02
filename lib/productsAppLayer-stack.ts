import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class ProductsAppLayerStack extends cdk.Stack {

    readonly productsLayers: lambda.LayerVersion;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {

        super(scope, id, props);
        this.productsLayers = new lambda.LayerVersion(
            this,
            "ProductsLayers",
            {
                code: lambda.Code.fromAsset('lambda/products/productsLayers'),
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
                stringValue: this.productsLayers.layerVersionArn
            }
        );
    }
}