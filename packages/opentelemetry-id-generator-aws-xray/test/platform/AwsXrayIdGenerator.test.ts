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
import * as assert from 'assert';
import * as sinon from 'sinon';
import { AwsXRayIdGenerator } from '../../src/platform';

const idGenerator = new AwsXRayIdGenerator();

describe('AwsXRayTraceId', () => {
  let traceId1: string, traceId2: string;
  let prevTime: number, currTime: number, nextTime: number;
  const inValidTraceId = '00000000000000000000000000000000';
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    prevTime = Math.floor(Date.now() / 1000);
    traceId1 = idGenerator.generateTraceId();
    currTime = parseInt(traceId1.substring(0, 8), 16);
    nextTime = Math.floor(Date.now() / 1000);
    traceId2 = idGenerator.generateTraceId();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns 32 character hex strings', () => {
    assert.ok(traceId1.match(/[a-f0-9]{32}/));
    assert.ok(!traceId1.match(/^0+$/));
  });

  it('returns different ids on each call', () => {
    assert.notDeepStrictEqual(traceId1, traceId2);
  });

  it('using current time to encode trace id', () => {
    assert.ok(currTime >= prevTime);
    assert.ok(currTime <= nextTime);
  });

  it('should not be all zero', () => {
    sandbox.stub(Math, 'random').returns(0);
    const traceIdTemp = idGenerator.generateTraceId();

    assert.notEqual(traceIdTemp, inValidTraceId);
  });
});

describe('AwsXRaySpanId', () => {
  let spanId1: string, spanId2: string;
  const inValidSpanId = '0000000000000000';
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    spanId1 = idGenerator.generateSpanId();
    spanId2 = idGenerator.generateSpanId();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns 16 character hex strings', () => {
    assert.ok(spanId1.match(/[a-f0-9]{16}/));
    assert.ok(!spanId1.match(/^0+$/));
  });

  it('returns different ids on each call', () => {
    assert.notDeepStrictEqual(spanId1, spanId2);
  });

  it('should not be all zero', () => {
    sandbox.stub(Math, 'random').returns(0);
    const spanIdTemp = idGenerator.generateSpanId();

    assert.notEqual(spanIdTemp, inValidSpanId);
  });
});
