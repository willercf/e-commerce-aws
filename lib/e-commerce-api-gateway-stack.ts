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
        const logGroup = new cwLogs.LogGroup(this, "ECommerceApiGatewayLogs");
        const api = new apiGateway.RestApi(
            this,
            "ECommerceApiGateway",
            {
                restApiName: "ECommerceApi",
                deployOptions: {
                    accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),
                    accessLogFormat: apiGateway.AccessLogFormat.jsonWithStandardFields({
                        httpMethod: true,
                        ip: true,
                        protocol: true,
                        requestTime: true,
                        resourcePath: true,
                        responseLength: true,
                        status: true,
                        caller: true,
                        user: true
                    })
                }
            }
        )

        const productsFetchIntegration = new apiGateway.LambdaIntegration(props.productsFetchHandler);
        // "/products"
        const productsResource = api.root.addResource("products");
        productsResource.addMethod("GET", productsFetchIntegration);
    }
}