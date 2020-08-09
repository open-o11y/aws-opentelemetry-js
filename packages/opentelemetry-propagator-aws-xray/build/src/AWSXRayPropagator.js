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
exports.AWSXRayPropagator = exports.AWSXRAY_TRACE_ID_HEADER = void 0;
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
exports.AWSXRAY_TRACE_ID_HEADER = 'X-Amzn-Trace-Id';
const TRACE_HEADER_DELIMITER = ';';
const KV_DELIMITER = '=';
const TRACE_ID_KEY = 'Root';
const TRACE_ID_LENGTH = 35;
const TRACE_ID_VERSION = '1';
const TRACE_ID_DELIMITER = '-';
const TRACE_ID_DELIMITER_INDEX_1 = 1;
const TRACE_ID_DELIMITER_INDEX_2 = 10;
const TRACE_ID_FIRST_PART_LENGTH = 8;
const PARENT_ID_KEY = 'Parent';
const SAMPLED_FLAG_KEY = 'Sampled';
const SAMPLED_FLAG_LENGTH = 1;
const IS_SAMPLED = '1';
const NOT_SAMPLED = '0';
const VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
const VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
/**
 * Implementation of the AWS X-Ray Trace Header propagation protocol. See <a href=
 * https://https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-tracingheader>AWS
 * Tracing header spec</a>
 *
 * An example AWS Xray Tracing Header is shown below:
 * X-Amzn-Trace-Id: Root=1-5759e988-bd862e3fe1be46a994272793;Parent=53995c3f42cd8ad8;Sampled=1
 */
class AWSXRayPropagator {
    inject(context, carrier, setter) {
        const spanContext = core_1.getParentSpanContext(context);
        if (!spanContext || !core_1.isValid(spanContext))
            return;
        const otTraceId = spanContext.traceId;
        const xrayTraceId = TRACE_ID_VERSION +
            TRACE_ID_DELIMITER +
            otTraceId.substring(0, TRACE_ID_FIRST_PART_LENGTH) +
            TRACE_ID_DELIMITER +
            otTraceId.substring(TRACE_ID_FIRST_PART_LENGTH);
        const parentId = spanContext.spanId;
        const samplingFlag = spanContext.traceFlags ? IS_SAMPLED : NOT_SAMPLED;
        // TODO: Add OT trace state to the X-Ray trace header
        const traceHeader = TRACE_ID_KEY +
            KV_DELIMITER +
            xrayTraceId +
            TRACE_HEADER_DELIMITER +
            PARENT_ID_KEY +
            KV_DELIMITER +
            parentId +
            TRACE_HEADER_DELIMITER +
            SAMPLED_FLAG_KEY +
            KV_DELIMITER +
            samplingFlag;
        setter(carrier, exports.AWSXRAY_TRACE_ID_HEADER, traceHeader);
    }
    extract(context, carrier, getter) {
        const spanContext = this.getSpanContextFromHeader(carrier, getter);
        if (!core_1.isValid(spanContext))
            return context;
        return core_1.setExtractedSpanContext(context, spanContext);
    }
    getSpanContextFromHeader(carrier, getter) {
        const traceHeader = getter(carrier, exports.AWSXRAY_TRACE_ID_HEADER);
        // Only if the returned traceHeader is no empty string can be extracted
        if (!traceHeader || typeof traceHeader !== 'string')
            return core_1.INVALID_SPAN_CONTEXT;
        let pos = 0;
        let trimmedPart;
        let parsedTraceId = api_1.INVALID_TRACE_ID;
        let parsedSpanId = api_1.INVALID_SPAN_ID;
        let parsedTraceFlags = null;
        while (pos < traceHeader.length) {
            const delimiterIndex = traceHeader.indexOf(TRACE_HEADER_DELIMITER, pos);
            if (delimiterIndex >= 0) {
                trimmedPart = traceHeader.substring(pos, delimiterIndex).trim();
                pos = delimiterIndex + 1;
            }
            else {
                //last part
                trimmedPart = traceHeader.substring(pos).trim();
                pos = traceHeader.length;
            }
            const equalsIndex = trimmedPart.indexOf(KV_DELIMITER);
            const value = trimmedPart.substring(equalsIndex + 1);
            if (trimmedPart.startsWith(TRACE_ID_KEY)) {
                parsedTraceId = this._parseTraceId(value);
            }
            if (trimmedPart.startsWith(PARENT_ID_KEY)) {
                parsedSpanId = this._parseSpanId(value);
            }
            if (trimmedPart.startsWith(SAMPLED_FLAG_KEY)) {
                parsedTraceFlags = this._parseTraceFlag(value);
            }
        }
        if (parsedTraceFlags === null) {
            return core_1.INVALID_SPAN_CONTEXT;
        }
        const resultSpanContext = {
            traceId: parsedTraceId,
            spanId: parsedSpanId,
            traceFlags: parsedTraceFlags,
            isRemote: true,
        };
        if (!core_1.isValid(resultSpanContext)) {
            return core_1.INVALID_SPAN_CONTEXT;
        }
        return resultSpanContext;
    }
    _parseTraceId(xrayTraceId) {
        // Check length of trace id
        if (xrayTraceId.length !== TRACE_ID_LENGTH) {
            return api_1.INVALID_TRACE_ID;
        }
        // Check version trace id version
        if (!xrayTraceId.startsWith(TRACE_ID_VERSION)) {
            return api_1.INVALID_TRACE_ID;
        }
        // Check delimiters
        if (xrayTraceId.charAt(TRACE_ID_DELIMITER_INDEX_1) !== TRACE_ID_DELIMITER ||
            xrayTraceId.charAt(TRACE_ID_DELIMITER_INDEX_2) !== TRACE_ID_DELIMITER) {
            return api_1.INVALID_TRACE_ID;
        }
        const epochPart = xrayTraceId.substring(TRACE_ID_DELIMITER_INDEX_1 + 1, TRACE_ID_DELIMITER_INDEX_2);
        const uniquePart = xrayTraceId.substring(TRACE_ID_DELIMITER_INDEX_2 + 1, TRACE_ID_LENGTH);
        const resTraceId = epochPart + uniquePart;
        // Check the content of trace id
        if (!VALID_TRACEID_REGEX.test(resTraceId)) {
            return api_1.INVALID_TRACE_ID;
        }
        return resTraceId;
    }
    _parseSpanId(xrayParentId) {
        return VALID_SPANID_REGEX.test(xrayParentId)
            ? xrayParentId
            : api_1.INVALID_SPAN_ID;
    }
    _parseTraceFlag(xraySampledFlag) {
        if (xraySampledFlag.length === SAMPLED_FLAG_LENGTH &&
            xraySampledFlag === NOT_SAMPLED) {
            return api_1.TraceFlags.NONE;
        }
        if (xraySampledFlag === IS_SAMPLED) {
            return api_1.TraceFlags.SAMPLED;
        }
        return null;
    }
}
exports.AWSXRayPropagator = AWSXRayPropagator;
//# sourceMappingURL=AWSXRayPropagator.js.map