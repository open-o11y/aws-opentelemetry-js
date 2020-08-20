'use strict'

const { BasicTracerProvider, SimpleSpanProcessor, ConsoleSpanExporter } = require("@opentelemetry/tracing");
const { NodeTracerProvider } = require('@opentelemetry/node');
const { context, propagation, trace } = require("@opentelemetry/api");
const { CollectorTraceExporter, CollectorProtocolNode } = require('@opentelemetry/exporter-collector');
const { detectResources } = require('@opentelemetry/resources');
const { awsEc2Detector } = require('@opentelemetry/resource-detector-aws');
const { AwsXRayPropagator } = require('@opentelemetry/propagator-aws-xray');
const { AwsXRayIdGenerator } = require('@opentelemetry/id-generator-aws-xray');

module.exports = (serviceName) => {
  // set global propagator
  propagation.setGlobalPropagator(new AwsXRayPropagator());

  // currently have not been merged, will do it later
  // // get resource by take use of multiple detectors
  // const detectorConfig = {
  //   detectors: [awsEcsDetector, awsEc2Detector, awsBeanstalkDetector]
  // };
  // const resources = detectResources(detectorConfig);

  // create a provider for activating and tracking with AWS IdGenerator
  const tracerConfig = {
    idGenerator: new AwsXRayIdGenerator(),
    // resources: resources
  };
  const tracerProvider = new NodeTracerProvider(tracerConfig);

  // add OTLP exporter
  const otlpExporter = new CollectorTraceExporter({
    serviceName: serviceName,
    protocolNode: CollectorProtocolNode.HTTP_PROTO,
  });
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  // Register the tracer
  tracerProvider.register();

  // Get a tracer
  return trace.getTracer("awsxray-tests");
}
