import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as cwLogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface ECommerceApiGatewayStackProps extends cdk.StackProps {
    productsFetchHandler: lambdaNodeJS.NodejsFunction;
}

export class ECommerceApiGatewayStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: ECommerceApiGatewayStackProps) {
        
        super(scope, id, props);
        const api = new apiGateway.RestApi(
            this,
            "ECommerceApiGateway",
            {
                restApiName: "ECommerceApi"
            }
        )

        const productsFetchIntegration = new apiGateway.LambdaIntegration(props.productsFetchHandler);
        // "/products"
        const productsResource = api.root.addResource("products");
        productsResource.addMethod("GET", productsFetchIntegration);
    }
}