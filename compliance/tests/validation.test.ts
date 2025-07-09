import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateScenarios,
  validateAnnotatedLog,
  normalizeLogForComparison,
  compareNormalizedLogs,
} from '../src/validation.js';
import type { Scenarios, AnnotatedJSONRPCMessage } from '../src/types.js';

describe('validateScenarios', () => {
  it('should validate a valid scenarios object', () => {
    const validScenarios: Scenarios = {
      servers: {
        CalcServer: {
          description: 'A simple calculator server',
          tools: {
            add: { description: 'Adds two numbers' },
            multiply: { description: 'Multiplies two numbers' },
          },
          resources: {
            'resource://special-number': { description: 'A special number' },
          },
          resourceTemplates: {},
          prompts: {
            'example-maths': { description: 'Example math prompt' },
          },
          promptTemplates: {},
        },
      },
      scenarios: [
        {
          id: 1,
          description: 'client1 connects to CalcServer and calls add(a=10, b=20)',
          client_ids: ['client1'],
          server_name: 'CalcServer',
        },
      ],
    };

    assert.doesNotThrow(() => validateScenarios(validScenarios));
  });

  it('should reject duplicate scenario IDs', () => {
    const invalidScenarios = {
      servers: { TestServer: { description: 'Test', tools: {}, resources: {}, resourceTemplates: {}, prompts: {}, promptTemplates: {} } },
      scenarios: [
        { id: 1, description: 'Test 1', client_ids: ['client1'], server_name: 'TestServer' },
        { id: 1, description: 'Test 2', client_ids: ['client2'], server_name: 'TestServer' },
      ],
    };

    assert.throws(() => validateScenarios(invalidScenarios), /Duplicate scenario ID: 1/);
  });

  it('should reject scenarios referencing non-existent servers', () => {
    const invalidScenarios = {
      servers: {},
      scenarios: [
        { id: 1, description: 'Test', client_ids: ['client1'], server_name: 'NonExistent' },
      ],
    };

    assert.throws(
      () => validateScenarios(invalidScenarios),
      /Scenario 1 references non-existent server: NonExistent/
    );
  });

  it('should require at least one client ID', () => {
    const invalidScenarios = {
      servers: { TestServer: { description: 'Test', tools: {}, resources: {}, resourceTemplates: {}, prompts: {}, promptTemplates: {} } },
      scenarios: [
        { id: 1, description: 'Test', client_ids: [], server_name: 'TestServer' },
      ],
    };

    assert.throws(() => validateScenarios(invalidScenarios));
  });
});

describe('validateAnnotatedLog', () => {
  it('should validate a valid annotated log', () => {
    const validLog: AnnotatedJSONRPCMessage[] = [
      {
        message: {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: '1.0' },
        },
        metadata: {
          sender: 'client1',
          recipient: 'CalcServer',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    assert.doesNotThrow(() => validateAnnotatedLog(validLog));
  });

  it('should validate HTTP metadata when present', () => {
    const validLog: AnnotatedJSONRPCMessage[] = [
      {
        message: {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
        },
        metadata: {
          sender: 'client1',
          recipient: 'CalcServer',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'streamable-http',
          streamable_http_metadata: {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'mcp-session-id': 'test-session',
            },
          },
        },
      },
    ];

    assert.doesNotThrow(() => validateAnnotatedLog(validLog));
  });

  it('should reject invalid JSON-RPC messages', () => {
    const invalidLog = [
      {
        message: {
          // Missing jsonrpc field
          id: 1,
          method: 'test',
        },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    assert.throws(() => validateAnnotatedLog(invalidLog));
  });

  it('should reject invalid transport types', () => {
    const invalidLog = [
      {
        message: {
          jsonrpc: '2.0',
          id: 1,
          method: 'test',
        },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'invalid-transport',
        },
      },
    ];

    assert.throws(() => validateAnnotatedLog(invalidLog));
  });
});

describe('log comparison utilities', () => {
  it('should normalize timestamps for comparison', () => {
    const log: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test' },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-03-15T10:30:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    const normalized = normalizeLogForComparison(log);
    assert.strictEqual(normalized[0].metadata.timestamp, '2000-01-01T00:00:00.000Z');
  });

  it('should filter non-deterministic HTTP headers', () => {
    const log: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test' },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'streamable-http',
          streamable_http_metadata: {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'date': 'Fri, 15 Mar 2024 10:30:00 GMT',
              'x-request-id': 'random-id',
              'mcp-session-id': 'session-123',
            },
          },
        },
      },
    ];

    const normalized = normalizeLogForComparison(log);
    const headers = normalized[0].metadata.streamable_http_metadata!.headers;
    
    assert.strictEqual(headers['content-type'], 'application/json');
    assert.strictEqual(headers['mcp-session-id'], 'session-123');
    assert.strictEqual(headers['date'], undefined);
    assert.strictEqual(headers['x-request-id'], undefined);
  });

  it('should correctly compare normalized logs', () => {
    const log1: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test', params: { a: 1 } },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    const log2: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test', params: { a: 1 } },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-12-31T23:59:59.999Z', // Different timestamp
          transport: 'stdio',
        },
      },
    ];

    const normalized1 = normalizeLogForComparison(log1);
    const normalized2 = normalizeLogForComparison(log2);

    assert.strictEqual(compareNormalizedLogs(normalized1, normalized2), true);
  });

  it('should detect differences in normalized logs', () => {
    const log1: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test', params: { a: 1 } },
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    const log2: AnnotatedJSONRPCMessage[] = [
      {
        message: { jsonrpc: '2.0', id: 1, method: 'test', params: { a: 2 } }, // Different param
        metadata: {
          sender: 'client1',
          recipient: 'server',
          timestamp: '2024-01-01T00:00:00.000Z',
          transport: 'stdio',
        },
      },
    ];

    const normalized1 = normalizeLogForComparison(log1);
    const normalized2 = normalizeLogForComparison(log2);

    assert.strictEqual(compareNormalizedLogs(normalized1, normalized2), false);
  });
});