import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
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

	// 认证配置
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'User-Agent': 'n8n-wechat-official-account',
			},
		},
	};
}