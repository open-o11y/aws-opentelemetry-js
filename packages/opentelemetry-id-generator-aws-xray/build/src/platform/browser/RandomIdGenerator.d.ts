import { IdGenerator } from '@opentelemetry/core';
export declare class RandomIdGenerator implements IdGenerator {
    /**
     * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
     * characters corresponding to 128 bits.
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
//# sourceMappingURL=RandomIdGenerator.d.ts.map