"use strict";
/*!
 * Copyright 2020, OpenTelemetry Authors
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
const JaegerHttpTracePropagator_1 = require("../src/JaegerHttpTracePropagator");
describe('JaegerHttpTracePropagator', () => {
    const jaegerHttpTracePropagator = new JaegerHttpTracePropagator_1.JaegerHttpTracePropagator();
    const customHeader = 'new-header';
    const customJaegerHttpTracePropagator = new JaegerHttpTracePropagator_1.JaegerHttpTracePropagator(customHeader);
    let carrier;
    beforeEach(() => {
        carrier = {};
    });
    describe('.inject()', () => {
        it('should set uber trace id header', () => {
            const spanContext = {
                traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                spanId: '6e0c63257de34c92',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            jaegerHttpTracePropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier[JaegerHttpTracePropagator_1.UBER_TRACE_ID_HEADER], 'd4cda95b652f4a1592b449d5929fda1b:6e0c63257de34c92:0:01');
        });
        it('should use custom header if provided', () => {
            const spanContext = {
                traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                spanId: '6e0c63257de34c92',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            customJaegerHttpTracePropagator.inject(core_1.setExtractedSpanContext(api_1.Context.ROOT_CONTEXT, spanContext), carrier, api_1.defaultSetter);
            assert.deepStrictEqual(carrier[customHeader], 'd4cda95b652f4a1592b449d5929fda1b:6e0c63257de34c92:0:01');
        });
    });
    describe('.extract()', () => {
        it('should extract context of a sampled span from carrier', () => {
            carrier[JaegerHttpTracePropagator_1.UBER_TRACE_ID_HEADER] =
                'd4cda95b652f4a1592b449d5929fda1b:6e0c63257de34c92:0:01';
            const extractedSpanContext = core_1.getExtractedSpanContext(jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: '6e0c63257de34c92',
                traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('should extract context of a sampled span from carrier with 1 bit flag', () => {
            carrier[JaegerHttpTracePropagator_1.UBER_TRACE_ID_HEADER] =
                '9c41e35aeb6d1272:45fd2a9709dadcf1:a13699e3fb724f40:1';
            const extractedSpanContext = core_1.getExtractedSpanContext(jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: '45fd2a9709dadcf1',
                traceId: '9c41e35aeb6d1272',
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('should extract context of a sampled span from UTF-8 encoded carrier', () => {
            carrier[JaegerHttpTracePropagator_1.UBER_TRACE_ID_HEADER] =
                'ac1f3dc3c2c0b06e%3A5ac292c4a11a163e%3Ac086aaa825821068%3A1';
            const extractedSpanContext = core_1.getExtractedSpanContext(jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: '5ac292c4a11a163e',
                traceId: 'ac1f3dc3c2c0b06e',
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('should use custom header if provided', () => {
            carrier[customHeader] =
                'd4cda95b652f4a1592b449d5929fda1b:6e0c63257de34c92:0:01';
            const extractedSpanContext = core_1.getExtractedSpanContext(customJaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter));
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: '6e0c63257de34c92',
                traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('returns undefined if UBER_TRACE_ID_HEADER header is missing', () => {
            assert.deepStrictEqual(core_1.getExtractedSpanContext(jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter)), undefined);
        });
        it('returns undefined if UBER_TRACE_ID_HEADER header is invalid', () => {
            carrier[JaegerHttpTracePropagator_1.UBER_TRACE_ID_HEADER] = 'invalid!';
            assert.deepStrictEqual(core_1.getExtractedSpanContext(jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, api_1.defaultGetter)), undefined);
        });
    });
    it('should fail gracefully on bad responses from getter', () => {
        const ctx1 = jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, (c, k) => 1 // not a number
        );
        const ctx2 = jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, (c, k) => [] // empty array
        );
        const ctx3 = jaegerHttpTracePropagator.extract(api_1.Context.ROOT_CONTEXT, carrier, (c, k) => undefined // missing value
        );
        assert.ok(ctx1 === api_1.Context.ROOT_CONTEXT);
        assert.ok(ctx2 === api_1.Context.ROOT_CONTEXT);
        assert.ok(ctx3 === api_1.Context.ROOT_CONTEXT);
    });
});
//# sourceMappingURL=JaegerHttpTracePropagator.test.js.map