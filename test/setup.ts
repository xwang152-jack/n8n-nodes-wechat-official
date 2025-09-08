// Jest setup file
// This file is executed before each test file

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Uncomment to ignore specific log levels during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities
(global as any).mockCredentials = {
  appId: 'test_app_id',
  appSecret: 'test_app_secret',
};

(global as any).mockNode = {
  name: 'Test Wechat Official Account Node',
  type: 'n8n-nodes-wechat-official.wechatOfficialAccount',
};

(global as any).mockHelpers = {
  httpRequest: jest.fn(),
  prepareBinaryData: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});