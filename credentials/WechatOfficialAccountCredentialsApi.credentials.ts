import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class WechatOfficialAccountCredentialsApi implements ICredentialType {
	name = 'wechatOfficialAccountCredentialsApi';
	displayName = 'Wechat Official Account Credentials API';
	documentationUrl = 'https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'api.weixin.qq.com',
			required: true,
		},
		{
			displayName: 'Appid',
			description: '第三方用户唯一凭证，AppID和AppSecret可在"微信公众平台-设置与开发--基本配置"页中获得',
			name: 'appid',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'AppSecret',
			name: 'appsecret',
			description: '第三方用户唯一凭证密钥',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'AccessToken',
			name: 'accessToken',
			type: 'hidden',
			default: '',
			typeOptions: {
				expirable: true,
			},
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		console.log('preAuthentication credentials', credentials);

		const res = (await this.helpers.httpRequest({
			method: 'GET',
			url: `https://${credentials.baseUrl}/cgi-bin/token?grant_type=client_credential&appid=${credentials.appid}&secret=${credentials.appsecret}`,
		})) as any;

		console.log('preAuthentication', res);

		if (res.errcode && res.errcode !== 0) {
			throw new Error('授权失败：' + res.errcode + ', ' + res.errmsg);
		}

		return { accessToken: res.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				access_token: '={{$credentials.accessToken}}',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://{{$credentials.baseUrl}}',
			url: '/cgi-bin/get_api_domain_ip',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errcode',
					value: 0,
					message: '凭证验证失败',
				},
			},
		],
	};
}