import {
	IExecuteFunctions,
	ICredentialDataDecryptedObject,
	NodeOperationError,
} from 'n8n-workflow';

import {
	AccessTokenResponse,
	WECHAT_API_ENDPOINTS,
} from '../types';

import { makeWechatApiCall } from './ErrorHandler';

/**
 * Access Token缓存接口
 */
interface TokenCache {
	token: string;
	expiresAt: number;
	appId: string;
}

/**
 * Access Token管理器
 */
export class AccessTokenManager {
	private static cache = new Map<string, TokenCache>();
	
	/**
	 * 获取Access Token（带缓存）
	 */
	static async getAccessToken(
		context: IExecuteFunctions,
		credentials: ICredentialDataDecryptedObject,
	): Promise<string> {
		const appId = credentials.appId as string;
		const appSecret = credentials.appSecret as string;
		
		if (!appId || !appSecret) {
			throw new NodeOperationError(
				context.getNode(),
				'AppID和AppSecret不能为空',
			);
		}
		
		const cacheKey = this.getCacheKey(appId, appSecret);
		const cached = this.cache.get(cacheKey);
		
		// 检查缓存是否有效（提前5分钟过期）
		if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
			return cached.token;
		}
		
		// 获取新的Access Token
		const newToken = await this.fetchAccessToken(context, appId, appSecret);
		
		// 更新缓存
		this.cache.set(cacheKey, {
			token: newToken.access_token,
			expiresAt: Date.now() + (newToken.expires_in - 300) * 1000, // 提前5分钟过期
			appId,
		});
		
		return newToken.access_token;
	}
	
	/**
	 * 从微信API获取Access Token
	 */
	private static async fetchAccessToken(
		context: IExecuteFunctions,
		appId: string,
		appSecret: string,
	): Promise<AccessTokenResponse> {
		const url = `${WECHAT_API_ENDPOINTS.GET_ACCESS_TOKEN}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
		
		try {
			const response = await makeWechatApiCall(context, 'GET', url);
			
			if (!response.access_token) {
				throw new NodeOperationError(
					context.getNode(),
					'获取Access Token失败：响应中没有access_token字段',
				);
			}
			
			return response as AccessTokenResponse;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(
				context.getNode(),
				`获取Access Token失败: ${errorMessage}`,
			);
		}
	}
	
	/**
	 * 生成缓存键
	 */
	private static getCacheKey(appId: string, appSecret: string): string {
		// 使用appId和appSecret的hash作为缓存键
		return `${appId}_${this.simpleHash(appSecret)}`;
	}
	
	/**
	 * 简单hash函数
	 */
	private static simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(36);
	}
	
	/**
	 * 清除指定AppID的缓存
	 */
	static clearCache(appId: string, appSecret: string): void {
		const cacheKey = this.getCacheKey(appId, appSecret);
		this.cache.delete(cacheKey);
	}
	
	/**
	 * 清除所有缓存
	 */
	static clearAllCache(): void {
		this.cache.clear();
	}
	
	/**
	 * 获取缓存状态（用于调试）
	 */
	static getCacheStatus(): Array<{
		appId: string;
		expiresAt: number;
		isValid: boolean;
	}> {
		const now = Date.now();
		return Array.from(this.cache.values()).map(cache => ({
			appId: cache.appId,
			expiresAt: cache.expiresAt,
			isValid: cache.expiresAt > now,
		}));
	}
	
	/**
	 * 强制刷新Access Token
	 */
	static async refreshAccessToken(
		context: IExecuteFunctions,
		credentials: ICredentialDataDecryptedObject,
	): Promise<string> {
		const appId = credentials.appId as string;
		const appSecret = credentials.appSecret as string;
		
		// 清除缓存
		this.clearCache(appId, appSecret);
		
		// 重新获取
		return this.getAccessToken(context, credentials);
	}
	
	/**
	 * 验证Access Token是否有效
	 */
	static async validateAccessToken(
		context: IExecuteFunctions,
		accessToken: string,
	): Promise<boolean> {
		try {
			// 使用获取微信服务器IP列表的接口来验证token
			const url = `${WECHAT_API_ENDPOINTS.GET_CALLBACK_IP}?access_token=${accessToken}`;
			const response = await makeWechatApiCall(context, 'GET', url);
			
			// 如果返回ip_list，说明token有效
			return !!(response && response.ip_list);
		} catch (error) {
			// 如果出现错误，说明token无效
			return false;
		}
	}
	
	/**
	 * 获取带Access Token的完整URL
	 */
	static async getUrlWithToken(
		context: IExecuteFunctions,
		credentials: ICredentialDataDecryptedObject,
		baseUrl: string,
		additionalParams?: Record<string, string>,
	): Promise<string> {
		const accessToken = await this.getAccessToken(context, credentials);
		const url = new URL(baseUrl);
		
		// 添加access_token参数
		url.searchParams.set('access_token', accessToken);
		
		// 添加其他参数
		if (additionalParams) {
			Object.entries(additionalParams).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});
		}
		
		return url.toString();
	}
}

/**
 * 获取Access Token的便捷函数
 */
export async function getAccessToken(
	context: IExecuteFunctions,
	credentials: ICredentialDataDecryptedObject,
): Promise<string> {
	return AccessTokenManager.getAccessToken(context, credentials);
}

/**
 * 获取带Access Token的URL的便捷函数
 */
export async function getUrlWithAccessToken(
	context: IExecuteFunctions,
	credentials: ICredentialDataDecryptedObject,
	baseUrl: string,
	additionalParams?: Record<string, string>,
): Promise<string> {
	return AccessTokenManager.getUrlWithToken(context, credentials, baseUrl, additionalParams);
}