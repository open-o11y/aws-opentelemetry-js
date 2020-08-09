"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
const assert = require("assert");
const AWSXRayPropagator_1 = require("../src/AWSXRayPropagator");
describe('AWSXRayPropagator', () => {
    const xrayPropagator = new AWSXRayPropagator_1.AWSXRayPropagator();
    const TRACE_ID = '8a3c60f7d188f8fa79d48a391a778fa6';
    const SPAN_ID = '53995c3f42cd8ad8';
    const SAMPLED_TRACE_FLAG = api_1.TraceFlags.SAMPLED;
    const NOT_SAMPLED_TRACE_FLAG = api_1.TraceFlags.NONE;
    let carrier;
    beforeEach(() => {
        carrier = {};
    });
    describe('.inject()', () => {
        it('should inject sampled context', () => {
            const spanContext = {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                traceFlags: SAMPLED_TRACE_FLAG,
            };
            xrayPropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER], 'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1');
        });
        it('should inject not sampled context', () => {
            const spanContext = {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                traceFlags: NOT_SAMPLED_TRACE_FLAG,
            };
            xrayPropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER], 'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=0');
        });
        it('should inject with TraceState', () => {
            const traceState = new core_1.TraceState();
            traceState.set('foo', 'bar');
            const spanContext = {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                traceFlags: SAMPLED_TRACE_FLAG,
                traceState: traceState,
            };
            xrayPropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            // TODO: assert trace state when the propagator supports it
            assert.deepStrictEqual(carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER], 'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1');
        });
        it('inject without spanContext - should inject nothing', () => {
            xrayPropagator.inject(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier, {});
        });
        it('inject default invalid spanContext - should inject nothing', () => {
            const spanContext = core_1.INVALID_SPAN_CONTEXT;
            xrayPropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier, {});
        });
    });
    describe('.extract()', () => {
        it('extract nothing from context', () => {
            // context remains untouched
            assert.deepStrictEqual(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter), api_1.Context.ROOT_CONTEXT);
        });
        it('should extract sampled context', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('should extract sampled context with arbitrary order', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Parent=53995c3f42cd8ad8;Sampled=1;Root=1-8a3c60f7-d188f8fa79d48a391a778fa6';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('should extract context with additional fields', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1;Foo=Bar';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            // TODO: assert additional fields when the propagator supports it
            assert.deepStrictEqual(extractedSpanContext, {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('extract empty header value - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] = '';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid traceId - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-abcdefgh-ijklmnopabcdefghijklmnop;Parent=53995c3f42cd8ad8;Sampled=0';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid traceId size - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa600;Parent=53995c3f42cd8ad8;Sampled=0';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid traceId delimiter - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1*8a3c60f7+d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1;Foo=Bar';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid spanId - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=abcdefghijklmnop;Sampled=0';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid spanId size - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad800;Sampled=0';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid traceFlags - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid traceFlags length - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=10220';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract nonnumeric invalid traceFlags - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=1-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=a';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
        it('extract invalid aws xray version - should return undefined', () => {
            carrier[AWSXRayPropagator_1.AWSXRAY_TRACE_ID_HEADER] =
                'Root=2-8a3c60f7-d188f8fa79d48a391a778fa6;Parent=53995c3f42cd8ad8;Sampled=1';
            const extractedSpanContext = core_1.getExtractedSpanContext(xrayPropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, undefined);
        });
    });
});
//# sourceMappingURL=AWSXRayPropagator.test.js.map