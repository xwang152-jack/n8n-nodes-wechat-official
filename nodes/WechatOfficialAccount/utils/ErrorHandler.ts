import {
	IExecuteFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	WechatApiResponse,
	WECHAT_ERROR_CODES,
	RETRYABLE_ERROR_CODES,
} from '../types';

/**
 * 处理微信API错误响应
 */
export function handleWechatError(
	context: IExecuteFunctions,
	response: WechatApiResponse,
): void {
	if (response.errcode && response.errcode !== 0) {
		const errorMessage = WECHAT_ERROR_CODES[response.errcode] || response.errmsg || '未知错误';
		throw new NodeApiError(context.getNode(), {
			message: `微信API错误 (${response.errcode}): ${errorMessage}`,
			description: '请检查您的配置和网络连接',
			httpCode: '400',
			response: {
				body: response,
			},
		});
	}
}

/**
 * 判断错误是否可以重试
 */
export function shouldRetry(error: any): boolean {
	if (!error) {
		return false;
	}
	
	if (error?.response?.body?.errcode) {
		return RETRYABLE_ERROR_CODES.includes(error.response.body.errcode);
	}
	
	// 网络错误通常可以重试
	if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
		return true;
	}
	
	return false;
}

/**
 * 带重试机制的微信API调用
 */
export async function makeWechatApiCall(
	context: IExecuteFunctions,
	method: 'GET' | 'POST',
	endpoint: string,
	body?: any,
	formData?: any,
	maxRetries: number = 3,
): Promise<any> {
	let lastError: Error;
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const options: any = {
				method,
				url: endpoint,
				headers: {
					'User-Agent': 'n8n-wechat-official-account',
				},
			};
			
			if (formData) {
				options.formData = formData;
			} else if (body) {
				options.body = body;
				options.json = true;
			}
			
			const response = await context.helpers.httpRequest(options);
			
			// 检查微信API错误
			handleWechatError(context, response);
			
			return response;
		} catch (error) {
			lastError = error as Error;
			
			// 对于特定错误码进行重试
			if (shouldRetry(error) && attempt < maxRetries) {
				// 指数退避策略
				const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
			
			throw error;
		}
	}
	
	throw lastError!;
}

/**
 * 验证输入参数
 */
export function validateInput(
	context: IExecuteFunctions,
	value: any,
	fieldName: string,
	required: boolean = true,
): void {
	if (required && (value === undefined || value === null || value === '')) {
		throw new NodeOperationError(
			context.getNode(),
			`参数 "${fieldName}" 不能为空`,
		);
	}
}

/**
 * 清理敏感信息用于日志记录
 */
export function sanitizeForLogging(data: any): any {
	if (!data || typeof data !== 'object') {
		return data;
	}
	
	const sanitized = { ...data };
	
	// 移除敏感字段
	const sensitiveFields = ['access_token', 'appSecret', 'secret', 'appId'];
	sensitiveFields.forEach(field => {
		if (sanitized[field]) {
			sanitized[field] = '***';
		}
	});
	
	return sanitized;
}

/**
 * 清理和验证输入内容
 */
export function sanitizeInput(input: string): string {
	if (typeof input !== 'string') {
		return String(input || '');
	}
	
	// 移除潜在的恶意内容
	return input
		.replace(/<script[^>]*>.*?<\/script>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
		.trim();
}

/**
 * 创建标准化的成功响应
 */
export function createSuccessResponse(data: any, additionalInfo?: any) {
	return {
		json: {
			...data,
			success: true,
			timestamp: new Date().toISOString(),
			...additionalInfo,
		},
	};
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: string, details?: any) {
	return {
		json: {
			error: error,
			success: false,
			timestamp: new Date().toISOString(),
			...details,
		},
	};
}