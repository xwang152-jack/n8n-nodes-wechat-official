import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class WechatOfficialAccountApi implements ICredentialType {
	name = 'wechatOfficialAccountApi';
	displayName = 'WeChat Official Account API';
	documentationUrl = 'https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html';
	
	properties: INodeProperties[] = [
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			required: true,
			description: '微信公众号的AppID',
			placeholder: 'wx1234567890abcdef',
		},
		{
			displayName: 'App Secret',
			name: 'appSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: '微信公众号的AppSecret',
			placeholder: 'abcdef1234567890abcdef1234567890',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
				},
				{
					name: 'Sandbox',
					value: 'sandbox',
				},
			],
			default: 'production',
			description: '选择API环境',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'User-Agent': 'n8n-wechat-official-account',
			},
		},
	};

	// 添加凭据测试功能
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: 'https://api.weixin.qq.com/cgi-bin/stable_token',
			body: {
				grant_type: 'client_credential',
				appid: '={{$credentials.appId}}',
				secret: '={{$credentials.appSecret}}',
				force_refresh: false,
			},
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: '微信公众号API凭据验证成功',
					key: 'access_token',
					value: 'string',
				},
			},
		],
	};
}