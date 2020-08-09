import { IdGenerator } from '@opentelemetry/core';
/** IdGenerator that generates trace IDs conforming to AWS X-Ray format.
 * https://docs.aws.amazon.com/xray/latest/devguide/xray-api-sendingdata.html#xray-api-traceids
 */
export declare class AwsXrayIdGenerator implements IdGenerator {
    /**
     * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
     * characters corresponding to 128 bits. The first 4 bytes correspond to the current
     * time, in seconds, as per X-Ray trace ID format.
     */
    generateTraceId(): string;
    /**
     * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
     * characters corresponding to 64 bits.
     */
    generateSpanId(): string;
    /**
     * Get the hex string representation of a byte array
     *
     * @param byteArray
     */
    private toHex;
}
//# sourceMappingURL=AwsXrayIdGenerator.d.ts.map