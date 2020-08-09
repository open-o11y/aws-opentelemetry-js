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

import { IdGenerator } from '@opentelemetry/core';

type WindowWithMsCrypto = Window & {
  msCrypto?: Crypto;
};
const cryptoLib = window.crypto || (window as WindowWithMsCrypto).msCrypto;
const SPAN_ID_BYTES = 8;
const TRACE_ID_BYTES = 16;
const TIME_BYTES = 4;
const randomBytesArray = new Uint8Array(TRACE_ID_BYTES);

/** IdGenerator that generates trace IDs conforming to AWS X-Ray format.
 * https://docs.aws.amazon.com/xray/latest/devguide/xray-api-sendingdata.html#xray-api-traceids
 */
export class AwsXrayIdGenerator implements IdGenerator {
  /**
   * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
   * characters corresponding to 128 bits. The first 4 bytes correspond to the current
   * time, in seconds, as per X-Ray trace ID format.
   */
  generateTraceId(): string {
    const date = new Date();
    const nowSec = Math.floor(date.getTime() / 1000).toString(16);
    cryptoLib.getRandomValues(randomBytesArray);
    return (
      nowSec +
      this.toHex(randomBytesArray.slice(0, TRACE_ID_BYTES - TIME_BYTES))
    );
  }

  /**
   * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
   * characters corresponding to 64 bits.
   */
  generateSpanId(): string {
    cryptoLib.getRandomValues(randomBytesArray);
    return this.toHex(randomBytesArray.slice(0, SPAN_ID_BYTES));
  }

  /**
   * Get the hex string representation of a byte array
   *
   * @param byteArray
   */
  private toHex(byteArray: Uint8Array) {
    const chars: number[] = new Array(byteArray.length * 2);
    const alpha = 'a'.charCodeAt(0) - 10;
    const digit = '0'.charCodeAt(0);

    let p = 0;
    for (let i = 0; i < byteArray.length; i++) {
      let nibble = (byteArray[i] >>> 4) & 0xf;
      chars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
      nibble = byteArray[i] & 0xf;
      chars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
    }
    return String.fromCharCode.apply(null, chars);
  }
}
