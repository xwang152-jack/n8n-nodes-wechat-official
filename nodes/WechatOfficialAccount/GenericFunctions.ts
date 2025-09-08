import {
	IExecuteFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * 微信API请求函数
 */
export async function wechatApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: any = {},
	query: any = {},
): Promise<any> {
	const credentials = await this.getCredentials('wechatOfficialAccountApi');

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials returned!');
	}

	const { appId, appSecret, environment } = credentials;

	// 构建基础URL
	const baseUrl = environment === 'sandbox' 
		? 'https://api.weixin.qq.com/sandbox'
		: 'https://api.weixin.qq.com';

	// 如果需要access_token，先获取
	if (endpoint !== '/cgi-bin/token' && !query.access_token) {
		const tokenResponse = await getAccessToken.call(this, appId as string, appSecret as string, baseUrl);
		query.access_token = tokenResponse.access_token;
	}

	// 如果是获取token的请求，添加必要参数
	if (endpoint === '/cgi-bin/token') {
		query.appid = appId;
		query.secret = appSecret;
	}

	const options: IRequestOptions = {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-wechat-official-account',
		},
		method,
		body,
		qs: query,
		uri: `${baseUrl}${endpoint}`,
		json: true,
	};

	try {
		const response = await this.helpers.request(options);
		
		// 检查微信API错误
		if (response.errcode && response.errcode !== 0) {
			throw new NodeApiError(this.getNode(), response, {
				message: `WeChat API Error: ${response.errmsg}`,
				description: `Error Code: ${response.errcode}`,
			});
		}

		return response;
	} catch (error) {
		if (error instanceof NodeApiError) {
			throw error;
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * 获取Access Token
 */
async function getAccessToken(
	this: IExecuteFunctions,
	appId: string,
	appSecret: string,
	baseUrl: string,
): Promise<any> {
	const options: IRequestOptions = {
		headers: {
			'Accept': 'application/json',
			'User-Agent': 'n8n-wechat-official-account',
		},
		method: 'GET',
		qs: {
			grant_type: 'client_credential',
			appid: appId,
			secret: appSecret,
		},
		uri: `${baseUrl}/cgi-bin/token`,
		json: true,
	};

	try {
		const response = await this.helpers.request(options);
		
		if (response.errcode && response.errcode !== 0) {
			throw new NodeApiError(this.getNode(), response, {
				message: `Failed to get access token: ${response.errmsg}`,
				description: `Error Code: ${response.errcode}`,
			});
		}

		return response;
	} catch (error) {
		if (error instanceof NodeApiError) {
			throw error;
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * 验证图片格式和大小
 */
function validateImageFormat(url: string): boolean {
	const validExtensions = ['.jpg', '.jpeg', '.png'];
	return validExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * 从URL下载图片并转换为Base64
 */
async function downloadImageFromUrl(
	this: IExecuteFunctions,
	imageUrl: string,
): Promise<string> {
	// 验证图片格式
	if (!validateImageFormat(imageUrl)) {
		throw new NodeOperationError(this.getNode(), '不支持的图片格式，仅支持 jpg/jpeg/png 格式');
	}

	try {
		const response = await this.helpers.request({
			method: 'GET',
			uri: imageUrl,
			encoding: null, // 获取二进制数据
			timeout: 30000, // 30秒超时
		});

		// 检查文件大小（1MB = 1024 * 1024 bytes）
		if (response.length > 1024 * 1024) {
			throw new NodeOperationError(this.getNode(), '图片文件大小超过1MB限制');
		}

		// 转换为Base64
		return Buffer.from(response).toString('base64');
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `下载图片失败: ${error.message}`);
	}
}

/**
 * 上传图片素材
 */
export async function uploadImage(
	this: IExecuteFunctions,
	imageData: string,
	inputType?: string,
): Promise<any> {
	const credentials = await this.getCredentials('wechatOfficialAccountApi');

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials returned!');
	}

	const { appId, appSecret, environment } = credentials;

	// 构建基础URL
	const baseUrl = environment === 'sandbox' 
		? 'https://api.weixin.qq.com/sandbox'
		: 'https://api.weixin.qq.com';

	// 获取access_token
	const tokenResponse = await getAccessToken.call(this, appId as string, appSecret as string, baseUrl);

	// 处理不同的输入类型
	let base64Data: string;
	if (inputType === 'url') {
		// 从URL下载图片并转换为Base64
		base64Data = await downloadImageFromUrl.call(this, imageData);
	} else {
		// 直接使用Base64数据
		base64Data = imageData;
	}

	// 构建上传请求
	const formData = {
		media: {
			value: Buffer.from(base64Data, 'base64'),
			options: {
				filename: 'image.jpg',
				contentType: 'image/jpeg',
			},
		},
	};

	const options: IRequestOptions = {
		headers: {
			'User-Agent': 'n8n-wechat-official-account',
		},
		method: 'POST',
		qs: {
			access_token: tokenResponse.access_token,
		},
		uri: `${baseUrl}/cgi-bin/media/uploadimg`,
		formData,
		json: true,
	};

	try {
		const response = await this.helpers.request(options);
		
		if (response.errcode && response.errcode !== 0) {
			throw new NodeApiError(this.getNode(), response, {
				message: `Failed to upload image: ${response.errmsg}`,
				description: `Error Code: ${response.errcode}`,
			});
		}

		return response;
	} catch (error) {
		if (error instanceof NodeApiError) {
			throw error;
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * 从URL下载媒体文件并转换为Base64
 */
async function downloadMediaFromUrl(
	this: IExecuteFunctions,
	mediaUrl: string,
	mediaType: string,
): Promise<string> {
	// 对于图片类型，验证格式
	if (mediaType === 'image' || mediaType === 'thumb') {
		if (!validateImageFormat(mediaUrl)) {
			throw new NodeOperationError(this.getNode(), '不支持的图片格式，仅支持 jpg/jpeg/png 格式');
		}
	}

	try {
		const response = await this.helpers.request({
			method: 'GET',
			uri: mediaUrl,
			encoding: null, // 获取二进制数据
			timeout: 30000, // 30秒超时
		});

		// 检查文件大小限制
		if (mediaType === 'image' || mediaType === 'thumb') {
			// 图片和缩略图限制1MB
			if (response.length > 1024 * 1024) {
				throw new NodeOperationError(this.getNode(), '图片文件大小超过1MB限制');
			}
		} else if (mediaType === 'voice') {
			// 语音限制2MB
			if (response.length > 2 * 1024 * 1024) {
				throw new NodeOperationError(this.getNode(), '语音文件大小超过2MB限制');
			}
		} else if (mediaType === 'video') {
			// 视频限制10MB
			if (response.length > 10 * 1024 * 1024) {
				throw new NodeOperationError(this.getNode(), '视频文件大小超过10MB限制');
			}
		}

		// 转换为Base64
		return Buffer.from(response).toString('base64');
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `下载媒体文件失败: ${error.message}`);
	}
}

/**
 * 新增其他类型永久素材
 */
export async function addMaterial(
	this: IExecuteFunctions,
	mediaType: string,
	mediaData: string,
	description?: any,
	inputType?: string,
): Promise<any> {
	const credentials = await this.getCredentials('wechatOfficialAccountApi');

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials returned!');
	}

	const { appId, appSecret, environment } = credentials;

	// 构建基础URL
	const baseUrl = environment === 'sandbox' 
		? 'https://api.weixin.qq.com/sandbox'
		: 'https://api.weixin.qq.com';

	// 获取access_token
	const tokenResponse = await getAccessToken.call(this, appId as string, appSecret as string, baseUrl);

	// 处理不同的输入类型
	let base64Data: string;
	if (inputType === 'url') {
		// 从URL下载媒体文件并转换为Base64
		base64Data = await downloadMediaFromUrl.call(this, mediaData, mediaType);
	} else {
		// 直接使用Base64数据
		base64Data = mediaData;
	}

	// 构建上传请求
	const formData: any = {
		type: mediaType,
		media: {
			value: Buffer.from(base64Data, 'base64'),
			options: {
				filename: `media.${getFileExtension(mediaType)}`,
				contentType: getContentType(mediaType),
			},
		},
	};

	// 如果是视频类型，需要添加描述信息
	if (mediaType === 'video' && description) {
		formData.description = JSON.stringify(description);
	}

	const options: IRequestOptions = {
		headers: {
			'User-Agent': 'n8n-wechat-official-account',
		},
		method: 'POST',
		qs: {
			access_token: tokenResponse.access_token,
		},
		uri: `${baseUrl}/cgi-bin/material/add_material`,
		formData,
		json: true,
	};

	try {
		const response = await this.helpers.request(options);
		
		if (response.errcode && response.errcode !== 0) {
			throw new NodeApiError(this.getNode(), response, {
				message: `Failed to add material: ${response.errmsg}`,
				description: `Error Code: ${response.errcode}`,
			});
		}

		return response;
	} catch (error) {
		if (error instanceof NodeApiError) {
			throw error;
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * 获取文件扩展名
 */
function getFileExtension(mediaType: string): string {
	switch (mediaType) {
		case 'image':
			return 'jpg';
		case 'voice':
			return 'mp3';
		case 'video':
			return 'mp4';
		case 'thumb':
			return 'jpg';
		default:
			return 'bin';
	}
}

/**
 * 获取内容类型
 */
function getContentType(mediaType: string): string {
	switch (mediaType) {
		case 'image':
			return 'image/jpeg';
		case 'voice':
			return 'audio/mpeg';
		case 'video':
			return 'video/mp4';
		case 'thumb':
			return 'image/jpeg';
		default:
			return 'application/octet-stream';
	}
}

/**
 * 新建草稿
 */
export async function addDraft(
	this: IExecuteFunctions,
	articles: any[],
): Promise<any> {
	const requestBody = {
		articles: articles.map(article => ({
			title: article.title,
			author: article.author || '',
			digest: article.digest || '',
			content: article.content,
			content_source_url: article.content_source_url || '',
			thumb_media_id: article.thumb_media_id,
			show_cover_pic: article.show_cover_pic ? 1 : 0,
			need_open_comment: 0,
			only_fans_can_comment: 0,
		})),
	};

	return await wechatApiRequest.call(this, 'POST', '/cgi-bin/draft/add', requestBody);
}

/**
 * 发布接口
 */
export async function publishDraft(
	this: IExecuteFunctions,
	mediaId: string,
): Promise<any> {
	const requestBody = {
		media_id: mediaId,
	};

	return await wechatApiRequest.call(this, 'POST', '/cgi-bin/freepublish/submit', requestBody);
}