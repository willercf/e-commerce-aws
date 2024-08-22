import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as cwLogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface ECommerceApiGatewayStackProps extends cdk.StackProps {
    productsFetchHandler: lambdaNodeJS.NodejsFunction;
    productsAdminHandler: lambdaNodeJS.NodejsFunction;
    ordersHandler: lambdaNodeJS.NodejsFunction;
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
                cloudWatchRole: true,
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
                    }),
                    tracingEnabled: true
                }
            }
        )

        this.createProductsApi(props, api);
        this.createOrdersApi(props, api);
    }

    private createProductsApi(props: ECommerceApiGatewayStackProps, api: apiGateway.RestApi) {
        const productsFetchIntegration = new apiGateway.LambdaIntegration(props.productsFetchHandler);
        const productsAdminIntegration = new apiGateway.LambdaIntegration(props.productsAdminHandler);
        //resource - /products
        const productsResource = api.root.addResource("products");
        productsResource.addMethod("GET", productsFetchIntegration);
        productsResource.addMethod("POST", productsAdminIntegration);

        // "/products/{id}"
        const productsIdResource = productsResource.addResource("{id}");
        productsIdResource.addMethod("GET", productsFetchIntegration);
        productsIdResource.addMethod("PUT", productsAdminIntegration);
        productsIdResource.addMethod("DELETE", productsAdminIntegration);
    }

    private createOrdersApi(props: ECommerceApiGatewayStackProps, api: apiGateway.RestApi) {
        const ordersIntegration = new apiGateway.LambdaIntegration(props.ordersHandler);
        //resource - /orders
        const ordersResource = api.root.addResource("orders");

        const ordersDeleteValidator = new apiGateway.RequestValidator(this, "OrdersDeleteValidator", {
            restApi: api,
            requestValidatorName: "OrdersDeleteValidator",
            validateRequestParameters: true
        });

        // GET /orders?email=will@teste.com&orderId=123
        ordersResource.addMethod("GET", ordersIntegration);
        // POST /orders
        ordersResource.addMethod("POST", ordersIntegration);
        // DELETE /orders?email=will@teste.com&orderId=123
        ordersResource.addMethod("DELETE", ordersIntegration, {
            requestParameters: {
                'method.request.querystring.email': true,
                'method.request.querystring.orderId': true
            },
            requestValidator: ordersDeleteValidator
        });
    }
}