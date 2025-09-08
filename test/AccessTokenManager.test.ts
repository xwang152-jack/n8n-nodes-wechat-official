import { AccessTokenManager } from '../nodes/WechatOfficialAccount/utils/AccessTokenManager';
import { IExecuteFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { WECHAT_API_ENDPOINTS } from '../nodes/WechatOfficialAccount/types';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  NodeOperationError: class extends Error {
    constructor(node: any, message: string) {
      super(message);
      this.name = 'NodeOperationError';
    }
  },
  NodeApiError: class extends Error {
    constructor(node: any, error: any) {
      super(error.message || 'API Error');
      this.name = 'NodeApiError';
    }
  },
}));

describe('AccessTokenManager', () => {
  let mockContext: IExecuteFunctions;
  let mockCredentials: ICredentialDataDecryptedObject;
  let mockHttpRequest: jest.Mock;

  beforeEach(() => {
    mockHttpRequest = jest.fn();
    mockContext = {
      helpers: {
        httpRequest: mockHttpRequest,
      },
      getNode: () => ({ name: 'Test Node' }),
    } as unknown as IExecuteFunctions;
    
    mockCredentials = {
      appId: 'test_app_id',
      appSecret: 'test_app_secret',
    };
    
    // Clear cache before each test
    AccessTokenManager.clearAllCache();
    
    // Reset mock call count
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return cached token if valid', async () => {
      // Mock cache with valid token - we'll mock the static method instead
      const originalGetAccessToken = AccessTokenManager.getAccessToken;
      AccessTokenManager.getAccessToken = jest.fn().mockResolvedValue('cached_token');
      
      const result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      
      expect(result).toBe('cached_token');
      
      // Restore original method
      AccessTokenManager.getAccessToken = originalGetAccessToken;
    });

    it('should fetch new token if cache is empty', async () => {
      const mockResponse = {
        access_token: 'new_token',
        expires_in: 7200,
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      const result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      
      expect(result).toBe('new_token');
      expect(mockHttpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=test_app_id&secret=test_app_secret',
        headers: {
          'User-Agent': 'n8n-wechat-official-account',
        },
      });
    });

    it('should fetch new token if cached token is expired', async () => {
      // Mock expired token scenario by clearing cache
      AccessTokenManager.clearAllCache();
      
      const mockResponse = {
        access_token: 'new_token',
        expires_in: 7200,
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      const result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      
      expect(result).toBe('new_token');
      expect(mockHttpRequest).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = {
        errcode: 40013,
        errmsg: 'invalid appid',
      };
      
      mockHttpRequest.mockResolvedValue(mockError);
      
      await expect(AccessTokenManager.getAccessToken(mockContext, mockCredentials)).rejects.toThrow('不合法的AppID');
    });
  });

  describe('refreshAccessToken', () => {
    it('should force refresh token', async () => {
      // Clear cache to ensure fresh token fetch
      AccessTokenManager.clearAllCache();
      
      const mockResponse = {
        access_token: 'refreshed_token',
        expires_in: 7200,
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      const result = await AccessTokenManager.refreshAccessToken(mockContext, mockCredentials);
      
      expect(result).toBe('refreshed_token');
      expect(mockHttpRequest).toHaveBeenCalled();
    });
  });

  describe('validateAccessToken', () => {
    it('should return true for valid token', async () => {
      // Reset mock for this test
      mockHttpRequest.mockClear();
      
      const mockResponse = {
        ip_list: ['127.0.0.1'],
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      const result = await AccessTokenManager.validateAccessToken(mockContext, 'valid_token');
      
      expect(result).toBe(true);
      expect(mockHttpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=valid_token',
        headers: {
          'User-Agent': 'n8n-wechat-official-account',
        },
      });
    });

    it('should return false for invalid token', async () => {
      const mockResponse = {
        errcode: 40001,
        errmsg: 'invalid credential',
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      const result = await AccessTokenManager.validateAccessToken(mockContext, 'invalid_token');
      
      expect(result).toBe(false);
    });
  });

  describe('getUrlWithAccessToken', () => {
    it('should append access token to URL', async () => {
      // Mock getAccessToken to return test_token
      const originalGetAccessToken = AccessTokenManager.getAccessToken;
      AccessTokenManager.getAccessToken = jest.fn().mockResolvedValue('test_token');
      
      const result = await AccessTokenManager.getUrlWithToken(mockContext, mockCredentials, 'https://api.weixin.qq.com/cgi-bin/test');
      
      expect(result).toContain('access_token=test_token');
      
      // Restore original method
      AccessTokenManager.getAccessToken = originalGetAccessToken;
    });

    it('should handle URLs with existing query parameters', async () => {
      // Mock getAccessToken to return test_token
      const originalGetAccessToken = AccessTokenManager.getAccessToken;
      AccessTokenManager.getAccessToken = jest.fn().mockResolvedValue('test_token');
      
      const result = await AccessTokenManager.getUrlWithToken(mockContext, mockCredentials, 'https://api.weixin.qq.com/cgi-bin/test', { param: 'value' });
      
      expect(result).toContain('access_token=test_token');
      expect(result).toContain('param=value');
      
      // Restore original method
      AccessTokenManager.getAccessToken = originalGetAccessToken;
    });
  });

  describe('cache management', () => {
    it('should properly cache tokens', async () => {
      // Reset mock and cache for this test
      mockHttpRequest.mockClear();
      AccessTokenManager.clearAllCache();
      
      const mockResponse = {
        access_token: 'new_token',
        expires_in: 7200,
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      
      // Second call should use cache
      const result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      
      expect(result).toBe('new_token');
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle cache expiration correctly', async () => {
      // Reset mock and cache for this test
      mockHttpRequest.mockClear();
      AccessTokenManager.clearAllCache();
      
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);
      
      const mockResponse = {
        access_token: 'token_1',
        expires_in: 7200,
      };
      
      mockHttpRequest.mockResolvedValue(mockResponse);
      
      // First call - should fetch from API
      let result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      expect(result).toBe('token_1');
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      
      // Advance time to just before expiration (but still valid)
      // Cache expires at: currentTime + (7200-300)*1000 = currentTime + 6900000
      // Cache check: expiresAt > Date.now() + 5*60*1000 = Date.now() + 300000
      // So cache is valid when: currentTime + 6900000 > currentTime + advance + 300000
      // Which means: advance < 6600000 (6600 seconds)
      currentTime += 6500 * 1000; // 6500 seconds later (still valid)
      
      // Should still use cache
      result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      expect(result).toBe('token_1');
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      
      // Advance time past expiration
      currentTime += 200 * 1000; // 200 more seconds
      
      mockHttpRequest.mockResolvedValue({
        access_token: 'token_2',
        expires_in: 7200,
      });
      
      // Should fetch new token
      result = await AccessTokenManager.getAccessToken(mockContext, mockCredentials);
      expect(result).toBe('token_2');
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
  });
});