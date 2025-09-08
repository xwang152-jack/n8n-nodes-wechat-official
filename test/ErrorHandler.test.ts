import { handleWechatError, shouldRetry, validateInput, sanitizeForLogging } from '../nodes/WechatOfficialAccount/utils/ErrorHandler';
import { NodeApiError, IExecuteFunctions } from 'n8n-workflow';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  NodeApiError: class extends Error {
    constructor(node: any, error: any) {
      super(error.message || 'API Error');
      this.name = 'NodeApiError';
    }
  },
  NodeOperationError: class extends Error {
    constructor(node: any, message: string) {
      super(message);
      this.name = 'NodeOperationError';
    }
  },
}));

describe('ErrorHandler', () => {
  const mockHelpers = {
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
    getNodeParameter: jest.fn(),
    getInputData: jest.fn(),
    getWorkflowDataProxy: jest.fn(),
    getCredentials: jest.fn(),
    getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
    helpers: {
      httpRequest: jest.fn(),
      requestWithAuthentication: jest.fn(),
    },
  } as unknown as IExecuteFunctions;

  const mockNode = {
    name: 'Test Node',
  };

  describe('handleWechatError', () => {
    it('should handle successful response', () => {
      const response = {
        errcode: 0,
        errmsg: 'ok',
        data: 'test data',
      };

      expect(() => handleWechatError(mockHelpers, response)).not.toThrow();
    });

    it('should throw NodeApiError for error response', () => {
      const response = {
        errcode: 40001,
        errmsg: 'invalid credential',
      };

      expect(() => handleWechatError(mockHelpers, response)).toThrow(NodeApiError);
    });

    it('should map known error codes to friendly messages', () => {
      const response = {
        errcode: 40001,
        errmsg: 'invalid credential',
      };

      expect(() => handleWechatError(mockHelpers, response)).toThrow('微信API错误 (40001): AppSecret错误或者AppSecret不属于这个公众号');
    });

    it('should use original message for unknown error codes', () => {
      const response = {
        errcode: 99999,
        errmsg: 'unknown error',
      };

      expect(() => handleWechatError(mockHelpers, response)).toThrow('unknown error');
    });

    it('should handle response without errcode', () => {
      const response = {
        data: 'test data',
      };

      expect(() => handleWechatError(mockHelpers, response)).not.toThrow();
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retryable error codes', () => {
      const error1 = { response: { body: { errcode: 40001 } } };
      const error2 = { response: { body: { errcode: 42001 } } };
      const error3 = { response: { body: { errcode: 40014 } } };
      
      expect(shouldRetry(error1)).toBe(true); // invalid credential
      expect(shouldRetry(error2)).toBe(true); // access_token expired
      expect(shouldRetry(error3)).toBe(true); // invalid access_token
    });

    it('should return false for non-retryable error codes', () => {
      const error1 = { response: { body: { errcode: 40013 } } };
      const error2 = { response: { body: { errcode: 40002 } } };
      const error3 = { response: { body: { errcode: 40164 } } };
      
      expect(shouldRetry(error1)).toBe(false); // invalid appid
      expect(shouldRetry(error2)).toBe(false); // invalid grant_type
      expect(shouldRetry(error3)).toBe(false); // invalid ip
    });

    it('should return true for network errors', () => {
      const error1 = { code: 'ECONNRESET' };
      const error2 = { code: 'ETIMEDOUT' };
      
      expect(shouldRetry(error1)).toBe(true);
      expect(shouldRetry(error2)).toBe(true);
    });

    it('should return false for undefined error', () => {
      expect(shouldRetry(undefined)).toBe(false);
      expect(shouldRetry(null)).toBe(false);
      expect(shouldRetry({})).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('should not throw for valid required fields', () => {
      expect(() => validateInput(mockHelpers, 'test_value', 'testField', true)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      expect(() => validateInput(mockHelpers, null, 'testField', true)).toThrow('参数 "testField" 不能为空');
      expect(() => validateInput(mockHelpers, undefined, 'testField', true)).toThrow('参数 "testField" 不能为空');
      expect(() => validateInput(mockHelpers, '', 'testField', true)).toThrow('参数 "testField" 不能为空');
    });

    it('should not throw for missing optional fields', () => {
      expect(() => validateInput(mockHelpers, null, 'testField', false)).not.toThrow();
      expect(() => validateInput(mockHelpers, undefined, 'testField', false)).not.toThrow();
      expect(() => validateInput(mockHelpers, '', 'testField', false)).not.toThrow();
    });

    it('should not throw for valid optional fields', () => {
      expect(() => validateInput(mockHelpers, 'test_value', 'testField', false)).not.toThrow();
    });
  });

  describe('sanitizeForLogging', () => {
    it('should remove sensitive fields from objects', () => {
      const input = {
        access_token: 'secret_token',
        appSecret: 'secret_key',
        data: 'public_data',
        nested: {
          access_token: 'nested_secret',
          public: 'public_nested',
        },
      };

      const result = sanitizeForLogging(input);

      expect(result).toEqual({
        access_token: '***',
        appSecret: '***',
        data: 'public_data',
        nested: {
          access_token: 'nested_secret',
          public: 'public_nested',
        },
      });
    });

    it('should handle arrays with objects', () => {
      const input = {
        items: [
          {
            access_token: 'secret1',
            data: 'data1',
          },
          {
            access_token: 'secret2',
            data: 'data2',
          },
        ],
      };

      const result = sanitizeForLogging(input);

      expect(result).toEqual({
        items: [
          {
            access_token: 'secret1',
            data: 'data1',
          },
          {
            access_token: 'secret2',
            data: 'data2',
          },
        ],
      });
    });

    it('should handle primitive values', () => {
      expect(sanitizeForLogging('string')).toBe('string');
      expect(sanitizeForLogging(123)).toBe(123);
      expect(sanitizeForLogging(true)).toBe(true);
      expect(sanitizeForLogging(null)).toBe(null);
      expect(sanitizeForLogging(undefined)).toBe(undefined);
    });

    it('should handle empty objects and arrays', () => {
      expect(sanitizeForLogging({})).toEqual({});
      expect(sanitizeForLogging([])).toEqual({});
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              access_token: 'deep_secret',
              data: 'deep_data',
            },
          },
        },
      };

      const result = sanitizeForLogging(input);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              access_token: 'deep_secret',
              data: 'deep_data',
            },
          },
        },
      });
    });

    it('should not modify the original object', () => {
      const input = {
        access_token: 'secret_token',
        data: 'public_data',
      };

      const originalInput = JSON.parse(JSON.stringify(input));
      const result = sanitizeForLogging(input);

      // Original should be unchanged
      expect(input).toEqual(originalInput);
      // Result should be sanitized
      expect(result.access_token).toBe('***');
    });
  });
});