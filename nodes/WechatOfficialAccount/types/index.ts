import { ICredentialDataDecryptedObject } from 'n8n-workflow';

// 微信API响应接口
export interface WechatApiResponse {
	errcode?: number;
	errmsg?: string;
	[key: string]: any;
}

// Access Token响应接口
export interface AccessTokenResponse extends WechatApiResponse {
	access_token: string;
	expires_in: number;
}

// Token缓存信息
export interface TokenInfo {
	token: string;
	expiresAt: number;
}

// 上传素材响应接口
export interface UploadImageResponse extends WechatApiResponse {
	url: string;
}

export interface AddMaterialResponse extends WechatApiResponse {
	media_id: string;
	url?: string;
}

// 草稿管理响应接口
export interface AddDraftResponse extends WechatApiResponse {
	media_id: string;
}

export interface PublishDraftResponse extends WechatApiResponse {
	publish_id: string;
	msg_id: string;
}

// 微信凭据接口
export interface WechatCredentials extends ICredentialDataDecryptedObject {
	appId: string;
	appSecret: string;
	environment: 'production' | 'sandbox';
}

// 文章信息接口
export interface ArticleInfo {
	articleType?: string;
	title: string;
	author?: string;
	digest?: string;
	content: string;
	contentSourceUrl?: string;
	thumbMediaId: string;
	needOpenComment?: boolean;
	onlyFansCanComment?: boolean;
}

// 素材类型枚举
export enum MaterialType {
	IMAGE = 'image',
	VOICE = 'voice',
	VIDEO = 'video',
	THUMB = 'thumb',
}

// 操作类型枚举
export enum OperationType {
	// Access Token操作
	GET_ACCESS_TOKEN = 'getAccessToken',
	
	// 素材管理操作
	UPLOAD_IMAGE = 'uploadImage',
	ADD_MATERIAL = 'addMaterial',
	
	// 草稿管理操作
	ADD_DRAFT = 'addDraft',
	PUBLISH_DRAFT = 'publishDraft',
}

// 微信API错误码映射
export const WECHAT_ERROR_CODES: Record<number, string> = {
	'-1': '系统繁忙，请稍后重试',
	'40001': 'AppSecret错误或者AppSecret不属于这个公众号',
	'40002': '不合法的凭证类型',
	'40013': '不合法的AppID',
	'40125': '无效的AppSecret',
	'40164': 'IP地址不在白名单中',
	'41002': '缺少AppID参数',
	'41004': '缺少AppSecret参数',
	'43002': '需要POST请求',
	'45009': '调用超过天级别频率限制',
	'45011': 'API调用太频繁，请稍候再试',
	'40007': '不合法的媒体文件id',
	'40004': '不合法的媒体文件类型',
	'40005': '不合法的文件类型',
	'40006': '不合法的文件大小',
	'40008': '不合法的消息类型',
	'40009': '不合法的图片文件大小',
	'40010': '不合法的语音文件大小',
	'40011': '不合法的视频文件大小',
	'40012': '不合法的缩略图文件大小',
};

// 可重试的错误码
export const RETRYABLE_ERROR_CODES = [-1, 45011, 40164];

// 文件类型限制
export const FILE_TYPE_LIMITS = {
	image: {
		allowedTypes: ['image/jpeg', 'image/png'],
		maxSize: 1024 * 1024, // 1MB
		extensions: ['jpg', 'jpeg', 'png'],
	},
	voice: {
		allowedTypes: ['audio/mpeg', 'audio/amr'],
		maxSize: 2 * 1024 * 1024, // 2MB
		extensions: ['mp3', 'amr'],
	},
	video: {
		allowedTypes: ['video/mp4'],
		maxSize: 10 * 1024 * 1024, // 10MB
		extensions: ['mp4'],
	},
	thumb: {
		allowedTypes: ['image/jpeg', 'image/png'],
		maxSize: 64 * 1024, // 64KB
		extensions: ['jpg', 'jpeg', 'png'],
	},
};

// 视频描述接口
export interface VideoDescription {
	title: string;
	introduction: string;
}

// API端点常量
export const API_ENDPOINTS = {
	STABLE_TOKEN: 'https://api.weixin.qq.com/cgi-bin/stable_token',
	UPLOAD_IMAGE: 'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
	ADD_MATERIAL: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
	ADD_DRAFT: 'https://api.weixin.qq.com/cgi-bin/draft/add',
	PUBLISH_DRAFT: 'https://api.weixin.qq.com/cgi-bin/freepublish/submit',
};