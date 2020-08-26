'use strict'

const { BasicTracerProvider, SimpleSpanProcessor, ConsoleSpanExporter } = require("@opentelemetry/tracing");
const { NodeTracerProvider } = require('@opentelemetry/node');
const { context, propagation, trace } = require("@opentelemetry/api");
const { CollectorTraceExporter, CollectorProtocolNode } = require('@opentelemetry/exporter-collector');
const { detectResources } = require('@opentelemetry/resources');
// const { HttpTraceContextTemp } = require('httptracecontexttemp');
const { HttpTraceContext } = require('@opentelemetry/core');
const { awsEc2Detector } = require('@opentelemetry/resource-detector-aws');
const { AwsXRayPropagator } = require('@aws-observability/propagator-aws-xray');
const { AwsXRayIdGenerator } = require('@aws-observability/id-generator-aws-xray'); 

module.exports = (serviceName) => {
  // set global propagator
  propagation.setGlobalPropagator(new AwsXRayPropagator());

  // currently have not been merged, will do it later
  // get resource by take use of multiple detectors
  const detectorConfig = {
    detectors: [
      // awsEcsDetector,
      awsEc2Detector,
      // awsBeanstalkDetector
    ]
  };
  const resources = detectResources(detectorConfig);
  console.log(JSON.stringify(resources));

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
