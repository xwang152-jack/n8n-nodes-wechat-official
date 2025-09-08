import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { wechatApiRequest, uploadImage, addMaterial, addDraft, publishDraft } from './GenericFunctions';

export class WechatOfficialAccount implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WeChat Official Account',
		name: 'wechatOfficialAccount',
		icon: 'file:wechat.svg',
		group: ['communication'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '微信公众号API操作',
		usableAsTool: true,
		defaults: {
			name: 'WeChat Official Account',
		},
		inputs: [NodeConnectionType.Main],
	outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'wechatOfficialAccountCredentialsApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Access Token',
						value: 'accessToken',
						description: 'Access Token管理',
					},
					{
						name: 'Material',
						value: 'material',
						description: '素材管理',
					},
					{
						name: 'Draft',
						value: 'draft',
						description: '草稿管理',
					},
				],
				default: 'accessToken',
			},

			// Access Token Operations
			{
				displayName: 'Operation',
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
						name: 'Get',
						value: 'get',
						action: 'Get access token',
						description: '获取Access Token',
					},
				],
				default: 'get',
			},

			// Material Operations
			{
				displayName: 'Operation',
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
						name: 'Upload Image',
						value: 'uploadImage',
						action: 'Upload image',
						description: '上传图片素材',
					},
					{
						name: 'Add Material',
						value: 'addMaterial',
						action: 'Add permanent material',
						description: '新增其他类型永久素材',
					},
				],
				default: 'uploadImage',
			},

			// Draft Operations
			{
				displayName: 'Operation',
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
						name: 'Add',
						value: 'add',
						action: 'Add draft',
						description: '新建草稿',
					},
					{
						name: 'Publish',
						value: 'publish',
						action: 'Publish draft',
						description: '发布接口',
					},
				],
				default: 'add',
			},

			// Material Upload Image Fields
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadImage'],
					},
				},
				options: [
					{
						name: 'Base64 Encoded Data',
						value: 'base64',
						description: '使用Base64编码的图片数据',
					},
					{
						name: 'Image URL',
						value: 'url',
						description: '使用图片链接URL',
					},
				],
				default: 'base64',
				required: true,
				description: '选择图片输入类型',
			},
			{
				displayName: 'Image File',
				name: 'imageFile',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadImage'],
						inputType: ['base64'],
					},
				},
				default: '',
				required: true,
				description: '要上传的图片文件路径或base64编码',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['uploadImage'],
						inputType: ['url'],
					},
				},
				default: '',
				required: true,
				description: '图片链接URL（支持jpg/png格式，大小限制1MB以下）',
			},

			// Material Add Material Fields
			{
				displayName: 'Material Type',
				name: 'materialType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['addMaterial'],
					},
				},
				options: [
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Voice',
						value: 'voice',
					},
					{
						name: 'Video',
						value: 'video',
					},
					{
						name: 'Thumb',
						value: 'thumb',
					},
				],
				default: 'image',
				required: true,
				description: '素材类型',
			},
			{
				displayName: 'Input Type',
				name: 'mediaInputType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['addMaterial'],
					},
				},
				options: [
					{
						name: 'Base64 Encoded Data',
						value: 'base64',
						description: '使用Base64编码的媒体数据',
					},
					{
						name: 'Media URL',
						value: 'url',
						description: '使用媒体文件链接URL',
					},
				],
				default: 'base64',
				required: true,
				description: '选择媒体文件输入类型',
			},
			{
				displayName: 'Media File',
				name: 'mediaFile',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['addMaterial'],
						mediaInputType: ['base64'],
					},
				},
				default: '',
				required: true,
				description: '要上传的媒体文件路径或base64编码',
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['material'],
						operation: ['addMaterial'],
						mediaInputType: ['url'],
					},
				},
				default: '',
				required: true,
				description: '媒体文件链接URL（图片支持jpg/png格式，大小限制1MB以下）',
			},

			// Draft Add Fields
			{
				displayName: 'Articles',
				name: 'articles',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['draft'],
						operation: ['add'],
					},
				},
				default: {},
				options: [
					{
						name: 'article',
						displayName: 'Article',
						values: [
							{
						displayName: 'Author',
						name: 'author',
						type: 'string',
						default: '',
						description: '作者',
							},
							{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						default: '',
							required:	true,
						description: '图文消息的具体内容，支持HTML标签',
							},
							{
						displayName: 'Content Source URL',
						name: 'content_source_url',
						type: 'string',
						default: '',
						description: '图文消息的原文地址，即点击\'阅读原文\'后的URL',
							},
							{
						displayName: 'Digest',
						name: 'digest',
						type: 'string',
						default: '',
						description: '图文消息的摘要',
							},
							{
						displayName: 'Show Cover Pic',
						name: 'show_cover_pic',
						type: 'boolean',
						default: true,
						description: 'Whether to show cover pic. 0 for false (not show), 1 for true (show).',
							},
							{
						displayName: 'Thumb Media ID',
						name: 'thumb_media_id',
						type: 'string',
						default: '',
							required:	true,
						description: '图文消息的封面图片素材ID（必须是永久mediaID）',
							},
							{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
							required:	true,
						description: '文章标题',
							},
						],
					},
				],
			},

			// Draft Publish Fields
			{
				displayName: 'Media ID',
				name: 'mediaId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['draft'],
						operation: ['publish'],
					},
				},
				default: '',
				required: true,
				description: '要发布的草稿的media_id',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData;

				if (resource === 'accessToken') {
					if (operation === 'get') {
						responseData = await wechatApiRequest.call(this, 'GET', '/cgi-bin/token', {}, {
							grant_type: 'client_credential',
						});
					}
				} else if (resource === 'material') {
					if (operation === 'uploadImage') {
						const inputType = this.getNodeParameter('inputType', i) as string;
						let imageData: string;
						
						if (inputType === 'url') {
							imageData = this.getNodeParameter('imageUrl', i) as string;
						} else {
							imageData = this.getNodeParameter('imageFile', i) as string;
						}
						
						responseData = await uploadImage.call(this, imageData, inputType);
					} else if (operation === 'addMaterial') {
						const materialType = this.getNodeParameter('materialType', i) as string;
						const mediaInputType = this.getNodeParameter('mediaInputType', i) as string;
						let mediaData: string;
						
						if (mediaInputType === 'url') {
							mediaData = this.getNodeParameter('mediaUrl', i) as string;
						} else {
							mediaData = this.getNodeParameter('mediaFile', i) as string;
						}
						
						responseData = await addMaterial.call(this, materialType, mediaData, undefined, mediaInputType);
					}
				} else if (resource === 'draft') {
					if (operation === 'add') {
						const articles = this.getNodeParameter('articles', i) as any;
						const articleList = articles.article || [];
						responseData = await addDraft.call(this, articleList);
					} else if (operation === 'publish') {
						const mediaId = this.getNodeParameter('mediaId', i) as string;
						responseData = await publishDraft.call(this, mediaId);
					}
				}

				returnData.push({
					json: responseData || {},
					pairedItem: {
						item: i,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
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