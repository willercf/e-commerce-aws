#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductAppStack } from '../lib/products-app-stack';
import { ECommerceApiGatewayStack } from '../lib/e-commerce-api-gateway-stack';
import { ProductsAppLayerStack } from '../lib/productsAppLayer-stack';
import { EventDdbStack } from '../lib/eventsDdb-stack';
import { OrdersAppLayerStack } from 'lib/ordersAppLayer-stack';
import { OrdersAppStack } from 'lib/ordersApp-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: "759744428911",
  region: "us-east-1"
}

const tags = {
  cost: "ECommerce",
  team: "WillSoft"
}

const productsAppLayersStack = new ProductsAppLayerStack(app, "ProductsAppLayers", {
  tags: tags,
  env: env
});

const eventsDdbStack = new EventDdbStack(app, "EventsDdb", {
  tags: tags,
  env: env
});

const productsAppStack = new ProductAppStack(app, "ProductsApp", {
  eventsDdb: eventsDdbStack.table,
  tags: tags,
  env: env
});
productsAppStack.addDependency(productsAppLayersStack);
productsAppStack.addDependency(eventsDdbStack);

const ordersAppLayerStack = new OrdersAppLayerStack(app, "OrdersAppLayerStack", {
  tags: tags,
  env: env
});

const ordersAppStack = new OrdersAppStack(app, "OrdersAppStack", {
  tags: tags,
  env: env,
  productsTable: productsAppStack.productsTable
});
ordersAppStack.addDependency(productsAppStack);
ordersAppStack.addDependency(ordersAppLayerStack);

const eCommerceApiGatewayStack = new ECommerceApiGatewayStack(app, "ECommerceApiGateway", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler,
  tags: tags,
  env: env
});
eCommerceApiGatewayStack.addDependency(productsAppStack);
