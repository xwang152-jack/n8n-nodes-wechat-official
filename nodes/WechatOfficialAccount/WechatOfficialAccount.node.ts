import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import {
	OperationType,
	MaterialType,
	WECHAT_API_ENDPOINTS,
	DraftArticle,
	VideoDescription,
} from './types';

import {
	getAccessToken,
	getUrlWithAccessToken,
	AccessTokenManager,
} from './utils/AccessTokenManager';

import {
	makeWechatApiCall,
	validateInput,
	createSuccessResponse,
	createErrorResponse,
	sanitizeInput,
} from './utils/ErrorHandler';

import {
	validateFileInput,
	prepareFileFormData,
	prepareImageFormData,
	validateVideoDescription,
} from './utils/FileUtils';

export class WechatOfficialAccount implements INodeType {
	description: INodeTypeDescription = {
		displayName: '微信公众号',
		name: 'wechatOfficialAccount',
		icon: 'file:wechat.svg',
		group: ['communication'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '与微信公众号API交互，支持素材管理、草稿管理等功能',
		defaults: {
			name: '微信公众号',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'wechatOfficialAccountApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: '资源',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Access Token',
						value: 'accessToken',
					},
					{
						name: '素材管理',
						value: 'material',
					},
					{
						name: '草稿管理',
						value: 'draft',
					},
				],
				default: 'accessToken',
			},
			
			// Access Token 操作
			{
				displayName: '操作',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['accessToken'],
					},
				},
				options: [
					{
						name: '获取Access Token',
						value: 'get',
						description: '获取微信公众号Access Token',
						action: 'Access token an access token',
					},
					{
						name: '刷新Access Token',
						value: 'refresh',
						description: '强制刷新Access Token',
						action: 'Access token an access token',
					},
					{
						name: '验证Access Token',
						value: 'validate',
						description: '验证Access Token是否有效',
						action: 'Access token an access token',
					},
				],
				default: 'get',
			},
			
			// 素材管理操作
			{
				displayName: '操作',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['material'],
					},
				},
				options: [
					{
						name: '上传临时素材',
						value: 'uploadTemp',
						description: '上传临时素材（3天有效期）',
						action: 'A material',
					},
					{
						name: '上传永久素材',
						value: 'uploadPermanent',
						action: 'A material',
					},
					{
						name: '上传图片',
						value: 'uploadImage',
						description: '上传图片（用于图文消息）',
						action: 'A material',
					},
					{
						name: '获取永久素材',
						value: 'getPermanent',
						action: 'A material',
					},
					{
						name: '删除永久素材',
						value: 'deletePermanent',
						action: 'A material',
					},
					{
						name: '获取素材总数',
						value: 'getCount',
						action: 'A material',
					},
					{
						name: '获取素材列表',
						value: 'getList',
						action: 'A material',
					},
				],
				default: 'uploadTemp',
			},
			
			// 草稿管理操作
			{
				displayName: '操作',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['draft'],
					},
				},
				options: [
					{
						name: '新建草稿',
						value: 'create',
						action: 'A draft',
					},
					{
						name: '获取草稿',
						value: 'get',
						action: 'A draft',
					},
					{
						name: '删除草稿',
						value: 'delete',
						action: 'A draft',
					},
					{
						name: '修改草稿',
						value: 'update',
						action: 'A draft',
					},
					{
						name: '获取草稿总数',
						value: 'getCount',
						action: 'A draft',
					},
					{
						name: '获取草稿列表',
						value: 'getList',
						action: 'A draft',
					},
					{
						name: '发布草稿',
						value: 'publish',
						action: 'A draft',
					},
				],
				default: 'create',
			},
			
			// 素材类型选择
			{
				displayName: '素材类型',
				name: 'materialType',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadTemp', 'uploadPermanent', 'getPermanent', 'deletePermanent', 'getList'],
					},
				},
				options: [
					{
						name: '图片',
						value: 'image',
					},
					{
						name: '语音',
						value: 'voice',
					},
					{
						name: '视频',
						value: 'video',
					},
					{
						name: '缩略图',
						value: 'thumb',
					},
				],
				default: 'image',
			},
			
			// 文件上传
			{
				displayName: '文件',
				name: 'file',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadTemp', 'uploadPermanent', 'uploadImage'],
					},
				},
				default: '',
				description: 'Base64编码的文件数据（格式：data:mime/type;base64,data）',
				placeholder: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
			},
			
			// 视频描述（仅视频类型显示）
			{
				displayName: '视频标题',
				name: 'videoTitle',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadPermanent'],
						materialType: ['video'],
					},
				},
				default: '',
				description: '视频素材的标题（最多20个字符）',
			},
			
			{
				displayName: '视频介绍',
				name: 'videoIntroduction',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadPermanent'],
						materialType: ['video'],
					},
				},
				default: '',
				description: '视频素材的介绍（最多120个字符）',
			},
			
			// 素材ID
			{
				displayName: '素材ID',
				name: 'mediaId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['getPermanent', 'deletePermanent'],
					},
				},
				default: '',
				description: '要操作的素材ID',
			},
			
			// 分页参数
			{
				displayName: '偏移量',
				name: 'offset',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['material', 'draft'],
						operation: ['getList'],
					},
				},
				default: 0,
				description: '从全部素材中的该偏移位置开始返回',
			},
			
			{
				displayName: '数量',
				name: 'count',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				displayOptions: {
					show: {
						resource: ['material', 'draft'],
						operation: ['getList'],
					},
				},
				default: 20,
				description: '返回素材的数量，取值在1到20之间',
			},
			
			// 草稿ID
			{
				displayName: '草稿ID',
				name: 'mediaId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['draft'],
						operation: ['get', 'delete', 'update', 'publish'],
					},
				},
				default: '',
				description: '要操作的草稿ID',
			},
			
			// 草稿文章内容
			{
				displayName: '文章内容',
				name: 'articles',
				type: 'json',
				typeOptions: {
					rows: 10,
				},
				displayOptions: {
					show: {
						resource: ['draft'],
						operation: ['create', 'update'],
					},
				},
				default: '[]',
				description: '文章内容数组，每个元素包含title、author、digest、content、content_source_url、thumb_media_id等字段',
				placeholder: '[{"title":"文章标题","author":"作者","digest":"摘要","content":"<p>文章内容</p>","content_source_url":"https://example.com","thumb_media_id":"缩略图素材ID"}]',
			},
			
			// 文章索引（用于修改草稿）
			{
				displayName: '文章索引',
				name: 'index',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['draft'],
						operation: ['update'],
					},
				},
				default: 0,
				description: '要修改的文章在图文消息中的位置（多图文消息时使用，从0开始）',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		const credentials = await this.getCredentials('wechatOfficialAccountApi');
		
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				
				let responseData: any;
				
				switch (resource) {
					case 'accessToken':
						responseData = await handleAccessTokenOperations(this, operation, credentials);
						break;
						
					case 'material':
						responseData = await handleMaterialOperations(this, operation, credentials, i);
						break;
						
					case 'draft':
						responseData = await handleDraftOperations(this, operation, credentials, i);
						break;
						
					default:
						throw new NodeOperationError(
							this.getNode(),
							`不支持的资源类型: ${resource}`,
						);
				}
				
				returnData.push({
					json: responseData,
					pairedItem: {
						item: i,
					},
				});
				
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: createErrorResponse(error instanceof Error ? error.message : String(error)).json,
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}
		
		return [returnData];
	}
}

/**
 * 处理Access Token相关操作
 */
async function handleAccessTokenOperations(
	executeFunctions: IExecuteFunctions,
	operation: string,
	credentials: any,
): Promise<any> {
	switch (operation) {
		case 'get': {
			const accessToken = await getAccessToken(executeFunctions, credentials);
			return createSuccessResponse({
				access_token: accessToken,
				cache_status: AccessTokenManager.getCacheStatus(),
			}).json;
		}
		
		case 'refresh': {
			const accessToken = await AccessTokenManager.refreshAccessToken(executeFunctions, credentials);
			return createSuccessResponse({
				access_token: accessToken,
				refreshed: true,
			}).json;
		}
		
		case 'validate': {
			const accessToken = await getAccessToken(executeFunctions, credentials);
			const isValid = await AccessTokenManager.validateAccessToken(executeFunctions, accessToken);
			return createSuccessResponse({
				access_token: accessToken,
				is_valid: isValid,
			}).json;
		}
		
		default:
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`不支持的Access Token操作: ${operation}`,
			);
	}
}

/**
 * 处理素材管理相关操作
 */
async function handleMaterialOperations(
	executeFunctions: IExecuteFunctions,
	operation: string,
	credentials: any,
	itemIndex: number,
): Promise<any> {
	switch (operation) {
		case 'uploadTemp': {
			const materialType = executeFunctions.getNodeParameter('materialType', itemIndex) as MaterialType;
			const file = executeFunctions.getNodeParameter('file', itemIndex) as string;
			
			validateInput(executeFunctions, file, '文件');
			validateFileInput(executeFunctions, file, materialType);
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.UPLOAD_MEDIA,
			);
			
			const formData = prepareFileFormData(executeFunctions, file, materialType);
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, undefined, formData);
			
			return createSuccessResponse(response, {
				material_type: materialType,
				operation: 'uploadTemp',
			}).json;
		}
		
		case 'uploadPermanent': {
			const materialType = executeFunctions.getNodeParameter('materialType', itemIndex) as MaterialType;
			const file = executeFunctions.getNodeParameter('file', itemIndex) as string;
			
			validateInput(executeFunctions, file, '文件');
			validateFileInput(executeFunctions, file, materialType);
			
			let description: VideoDescription | undefined;
			if (materialType === MaterialType.VIDEO) {
				const videoTitle = executeFunctions.getNodeParameter('videoTitle', itemIndex) as string;
				const videoIntroduction = executeFunctions.getNodeParameter('videoIntroduction', itemIndex) as string;
				
				validateInput(executeFunctions, videoTitle, '视频标题');
				validateInput(executeFunctions, videoIntroduction, '视频介绍');
				
				description = {
					title: sanitizeInput(videoTitle),
					introduction: sanitizeInput(videoIntroduction),
				};
				
				validateVideoDescription(executeFunctions, description);
			}
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.ADD_MATERIAL,
			);
			
			const formData = prepareFileFormData(executeFunctions, file, materialType, description);
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, undefined, formData);
			
			return createSuccessResponse(response, {
				material_type: materialType,
				operation: 'uploadPermanent',
			}).json;
		}
		
		case 'uploadImage': {
			const file = executeFunctions.getNodeParameter('file', itemIndex) as string;
			
			validateInput(executeFunctions, file, '文件');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.UPLOAD_IMG,
			);
			
			const formData = prepareImageFormData(executeFunctions, file);
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, undefined, formData);
			
			return createSuccessResponse(response, {
				operation: 'uploadImage',
			}).json;
		}
		
		case 'getPermanent': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '素材ID');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.GET_MATERIAL,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				operation: 'getPermanent',
			}).json;
		}
		
		case 'deletePermanent': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '素材ID');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.DEL_MATERIAL,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				operation: 'deletePermanent',
			}).json;
		}
		
		case 'getCount': {
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.GET_MATERIALCOUNT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'GET', url);
			
			return createSuccessResponse(response, {
				operation: 'getCount',
			}).json;
		}
		
		case 'getList': {
			const materialType = executeFunctions.getNodeParameter('materialType', itemIndex) as MaterialType;
			const offset = executeFunctions.getNodeParameter('offset', itemIndex) as number;
			const count = executeFunctions.getNodeParameter('count', itemIndex) as number;
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.BATCHGET_MATERIAL,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				type: materialType,
				offset,
				count,
			});
			
			return createSuccessResponse(response, {
				material_type: materialType,
				offset,
				count,
				operation: 'getList',
			}).json;
		}
		
		default:
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`不支持的素材操作: ${operation}`,
			);
	}
}

/**
 * 处理草稿管理相关操作
 */
async function handleDraftOperations(
	executeFunctions: IExecuteFunctions,
	operation: string,
	credentials: any,
	itemIndex: number,
): Promise<any> {
	switch (operation) {
		case 'create': {
			const articlesJson = executeFunctions.getNodeParameter('articles', itemIndex) as string;
			
			validateInput(executeFunctions, articlesJson, '文章内容');
			
			let articles: DraftArticle[];
			try {
				articles = JSON.parse(articlesJson);
			} catch (error) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'文章内容格式错误，请提供有效的JSON数组',
				);
			}
			
			if (!Array.isArray(articles) || articles.length === 0) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'文章内容必须是非空数组',
				);
			}
			
			// 验证和清理文章内容
			const cleanedArticles = articles.map(article => ({
				...article,
				title: sanitizeInput(article.title || ''),
				author: sanitizeInput(article.author || ''),
				digest: sanitizeInput(article.digest || ''),
				content: article.content || '',
				content_source_url: sanitizeInput(article.content_source_url || ''),
			}));
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.ADD_DRAFT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				articles: cleanedArticles,
			});
			
			return createSuccessResponse(response, {
				article_count: cleanedArticles.length,
				operation: 'create',
			}).json;
		}
		
		case 'get': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '草稿ID');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.GET_DRAFT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				operation: 'get',
			}).json;
		}
		
		case 'delete': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '草稿ID');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.DEL_DRAFT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				operation: 'delete',
			}).json;
		}
		
		case 'update': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			const index = executeFunctions.getNodeParameter('index', itemIndex) as number;
			const articlesJson = executeFunctions.getNodeParameter('articles', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '草稿ID');
			validateInput(executeFunctions, articlesJson, '文章内容');
			
			let articles: DraftArticle[];
			try {
				articles = JSON.parse(articlesJson);
			} catch (error) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'文章内容格式错误，请提供有效的JSON数组',
				);
			}
			
			if (!Array.isArray(articles) || articles.length === 0) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'文章内容必须是非空数组',
				);
			}
			
			if (index >= articles.length) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`文章索引 ${index} 超出范围，文章总数: ${articles.length}`,
				);
			}
			
			// 清理文章内容
			const article = articles[index];
			const cleanedArticle = {
				...article,
				title: sanitizeInput(article.title || ''),
				author: sanitizeInput(article.author || ''),
				digest: sanitizeInput(article.digest || ''),
				content: article.content || '',
				content_source_url: sanitizeInput(article.content_source_url || ''),
			};
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.UPDATE_DRAFT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
				index,
				articles: cleanedArticle,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				index,
				operation: 'update',
			}).json;
		}
		
		case 'getCount': {
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.GET_DRAFT_COUNT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'GET', url);
			
			return createSuccessResponse(response, {
				operation: 'getCount',
			}).json;
		}
		
		case 'getList': {
			const offset = executeFunctions.getNodeParameter('offset', itemIndex) as number;
			const count = executeFunctions.getNodeParameter('count', itemIndex) as number;
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.GET_DRAFT_LIST,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				offset,
				count,
			});
			
			return createSuccessResponse(response, {
				offset,
				count,
				operation: 'getList',
			}).json;
		}
		
		case 'publish': {
			const mediaId = executeFunctions.getNodeParameter('mediaId', itemIndex) as string;
			
			validateInput(executeFunctions, mediaId, '草稿ID');
			
			const url = await getUrlWithAccessToken(
				executeFunctions,
				credentials,
				WECHAT_API_ENDPOINTS.PUBLISH_DRAFT,
			);
			
			const response = await makeWechatApiCall(executeFunctions, 'POST', url, {
				media_id: mediaId,
			});
			
			return createSuccessResponse(response, {
				media_id: mediaId,
				operation: 'publish',
			}).json;
		}
		
		default:
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`不支持的草稿操作: ${operation}`,
			);
	}
}