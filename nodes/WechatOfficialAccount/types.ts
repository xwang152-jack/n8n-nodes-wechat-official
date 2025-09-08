/**
 * 微信公众号API相关类型定义
 */

/**
 * 微信API响应基础接口
 */
export interface WechatApiResponse {
	errcode?: number;
	errmsg?: string;
	[key: string]: any;
}

/**
 * Access Token响应接口
 */
export interface AccessTokenResponse extends WechatApiResponse {
	access_token: string;
	expires_in: number;
}

/**
 * 素材上传响应接口
 */
export interface MediaUploadResponse extends WechatApiResponse {
	type: string;
	media_id: string;
	created_at: number;
}

/**
 * 永久素材上传响应接口
 */
export interface PermanentMediaResponse extends WechatApiResponse {
	media_id: string;
	url?: string;
}

/**
 * 草稿响应接口
 */
export interface DraftResponse extends WechatApiResponse {
	media_id: string;
}

/**
 * 微信API端点常量
 */
export const WECHAT_API_ENDPOINTS = {
	// 基础接口
	GET_ACCESS_TOKEN: 'https://api.weixin.qq.com/cgi-bin/token',
	GET_CALLBACK_IP: 'https://api.weixin.qq.com/cgi-bin/getcallbackip',
	
	// 素材管理
	UPLOAD_MEDIA: 'https://api.weixin.qq.com/cgi-bin/media/upload',
	UPLOAD_IMG: 'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
	ADD_MATERIAL: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
	GET_MATERIAL: 'https://api.weixin.qq.com/cgi-bin/material/get_material',
	DEL_MATERIAL: 'https://api.weixin.qq.com/cgi-bin/material/del_material',
	GET_MATERIALCOUNT: 'https://api.weixin.qq.com/cgi-bin/material/get_materialcount',
	BATCHGET_MATERIAL: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
	
	// 草稿管理
	ADD_DRAFT: 'https://api.weixin.qq.com/cgi-bin/draft/add',
	GET_DRAFT: 'https://api.weixin.qq.com/cgi-bin/draft/get',
	DEL_DRAFT: 'https://api.weixin.qq.com/cgi-bin/draft/delete',
	UPDATE_DRAFT: 'https://api.weixin.qq.com/cgi-bin/draft/update',
	GET_DRAFT_COUNT: 'https://api.weixin.qq.com/cgi-bin/draft/count',
	GET_DRAFT_LIST: 'https://api.weixin.qq.com/cgi-bin/draft/batchget',
	PUBLISH_DRAFT: 'https://api.weixin.qq.com/cgi-bin/freepublish/submit',
	PUBLISH: 'https://api.weixin.qq.com/cgi-bin/freepublish/submit',
} as const;

/**
 * 微信错误码映射
 */
export const WECHAT_ERROR_CODES: Record<number, string> = {
	40001: 'AppSecret错误或者AppSecret不属于这个公众号',
	40002: '不合法的凭证类型',
	40003: '不合法的OpenID',
	40004: '不合法的媒体文件类型',
	40005: '不合法的文件类型',
	40006: '不合法的文件大小',
	40007: '不合法的媒体文件id',
	40008: '不合法的消息类型',
	40009: '不合法的图片文件大小',
	40010: '不合法的语音文件大小',
	40011: '不合法的视频文件大小',
	40012: '不合法的缩略图文件大小',
	40013: '不合法的AppID',
	40014: '不合法的access_token',
	40015: '不合法的菜单类型',
	40016: '不合法的按钮个数',
	40017: '不合法的按钮个数',
	40018: '不合法的按钮名字长度',
	40019: '不合法的按钮KEY长度',
	40020: '不合法的按钮URL长度',
	40021: '不合法的菜单版本号',
	40022: '不合法的子菜单级数',
	40023: '不合法的子菜单按钮个数',
	40024: '不合法的子菜单按钮类型',
	40025: '不合法的子菜单按钮名字长度',
	40026: '不合法的子菜单按钮KEY长度',
	40027: '不合法的子菜单按钮URL长度',
	40028: '不合法的自定义菜单使用用户',
	40029: '不合法的oauth_code',
	40030: '不合法的refresh_token',
	40031: '不合法的openid列表',
	40032: '不合法的openid列表长度',
	40033: '不合法的请求字符，不能包含\\uxxxx格式的字符',
	40035: '不合法的参数',
	40038: '不合法的请求格式',
	40039: '不合法的URL长度',
	40050: '不合法的分组id',
	40051: '分组名字不合法',
	41001: '缺少access_token参数',
	41002: '缺少appid参数',
	41003: '缺少refresh_token参数',
	41004: '缺少secret参数',
	41005: '缺少多媒体文件数据',
	41006: '缺少media_id参数',
	41007: '缺少子菜单数据',
	41008: '缺少oauth code',
	41009: '缺少openid',
	42001: 'access_token超时，请检查access_token的有效期，请参考基础支持-获取access_token中，对access_token的详细机制说明',
	42002: 'refresh_token超时',
	42003: 'oauth_code超时',
	43001: '需要GET请求',
	43002: '需要POST请求',
	43003: '需要HTTPS请求',
	43004: '需要接收者关注',
	43005: '需要好友关系',
	44001: '多媒体文件为空',
	44002: 'POST的数据包为空',
	44003: '图文消息内容为空',
	44004: '文本消息内容为空',
	45001: '多媒体文件大小超过限制',
	45002: '消息内容超过限制',
	45003: '标题字段超过限制',
	45004: '描述字段超过限制',
	45005: '链接字段超过限制',
	45006: '图片链接字段超过限制',
	45007: '语音播放时间超过限制',
	45008: '图文消息超过限制',
	45009: '接口调用超过限制',
	45010: '创建菜单个数超过限制',
	45015: '回复时间超过限制',
	45016: '系统分组，不允许修改',
	45017: '分组名字过长',
	45018: '分组数量超过上限',
	46001: '不存在媒体数据',
	46002: '不存在的菜单版本',
	46003: '不存在的菜单数据',
	46004: '不存在的用户',
	47001: '解析JSON/XML内容错误',
	48001: 'api功能未授权，请确认公众号已获得该接口，可以在公众平台官网-开发者中心页中查看接口权限',
	50001: '用户未授权该api',
	50002: '用户受限，可能是违规后接口被封禁',
	61451: '参数错误(invalid parameter)',
	61452: '无效客服账号(invalid kf_account)',
	61453: '客服帐号已存在(kf_account exsited)',
	61454: '客服帐号名长度超过限制(仅允许10个英文字符，不包括@及@后的公众号的微信号)(invalid kf_acount length)',
	61455: '客服帐号名包含非法字符(仅允许英文+数字)(illegal character in kf_account)',
	61456: '客服帐号个数超过限制(10个客服账号)(kf_account count exceeded)',
	61457: '无效头像文件类型(invalid file type)',
	61450: '系统错误(system error)',
	61500: '日期格式错误',
	65301: '不存在此menuid对应的个性化菜单',
	65302: '没有相应的用户',
	65303: '没有默认菜单，不能创建个性化菜单',
	65304: 'MatchRule信息为空',
	65305: '个性化菜单数量受限',
	65306: '不支持个性化菜单的帐号',
	65307: '个性化菜单信息为空',
	65308: '包含没有响应类型的button',
	65309: '个性化菜单开关处于关闭状态',
	65310: '填写了省份或城市信息，国家信息不能为空',
	65311: '填写了城市信息，省份信息不能为空',
	65312: '不合法的国家信息',
	65313: '不合法的省份信息',
	65314: '不合法的城市信息',
	65316: '该公众号的菜单设置了过多的域名外跳(最多跳转到3个域名)，请删除多余的域名外跳型菜单后重试',
	65317: '不合法的URL',
	9001001: 'POST数据参数不合法',
	9001002: '远端服务不可用',
	9001003: 'Ticket不合法',
	9001004: '获取摇周边用户信息失败',
	9001005: '获取商户信息失败',
	9001006: '获取OpenID失败',
	9001007: '上传文件缺失',
	9001008: '上传素材的文件类型不合法',
	9001009: '上传素材的文件尺寸不合法',
	9001010: '上传失败',
	9001020: '帐号不合法',
	9001021: '已有设备激活率低于50%，不能新增设备',
	9001022: '设备申请数不合法，必须为大于0的数字',
	9001023: '已存在审核中的设备ID申请',
	9001024: '一次查询设备ID数量不能超过50',
	9001025: '设备ID不合法',
	9001026: '页面ID不合法',
	9001027: '页面参数不合法',
	9001028: '一次删除页面ID数量不能超过10',
	9001029: '页面已应用在设备中，请先解除应用关系再删除',
	9001030: '一次查询页面ID数量不能超过50',
	9001031: '时间区间不合法',
	9001032: '保存设备与页面的绑定关系参数错误',
	9001033: '门店ID不合法',
	9001034: '设备备注信息过长',
	9001035: '设备申请参数不合法',
	9001036: '查询起始值begin不合法',
};

/**
 * 可重试的错误码
 */
export const RETRYABLE_ERROR_CODES = [
	40014, // 不合法的access_token
	42001, // access_token超时
	40001, // AppSecret错误（可能是临时网络问题）
	9001002, // 远端服务不可用
];

/**
 * 素材类型
 */
export enum MediaType {
	IMAGE = 'image',
	VOICE = 'voice',
	VIDEO = 'video',
	THUMB = 'thumb',
}

/**
 * 素材类型（用于文件上传）
 */
export enum MaterialType {
	IMAGE = 'image',
	VOICE = 'voice',
	VIDEO = 'video',
	THUMB = 'thumb',
}

/**
 * 视频描述信息
 */
export interface VideoDescription {
	title: string;
	introduction: string;
}

/**
 * 文件类型限制配置
 */
export interface FileTypeLimit {
	allowedTypes: string[];
	maxSize: number;
}

/**
 * 文件类型限制常量
 */
export const FILE_TYPE_LIMITS: Record<MaterialType, FileTypeLimit> = {
	[MaterialType.IMAGE]: {
		allowedTypes: ['image/jpeg', 'image/png'],
		maxSize: 10 * 1024 * 1024, // 10MB
	},
	[MaterialType.VOICE]: {
		allowedTypes: ['audio/mpeg', 'audio/amr'],
		maxSize: 2 * 1024 * 1024, // 2MB
	},
	[MaterialType.VIDEO]: {
		allowedTypes: ['video/mp4'],
		maxSize: 10 * 1024 * 1024, // 10MB
	},
	[MaterialType.THUMB]: {
		allowedTypes: ['image/jpeg', 'image/png'],
		maxSize: 64 * 1024, // 64KB
	},
}

/**
 * 操作类型
 */
export enum OperationType {
	ACCESS_TOKEN = 'accessToken',
	MATERIAL = 'material',
	DRAFT = 'draft',
}

/**
 * 草稿文章类型
 */
export interface DraftArticle {
	title: string;
	author?: string;
	digest?: string;
	content: string;
	content_source_url?: string;
	thumb_media_id: string;
	show_cover_pic?: 0 | 1;
	need_open_comment?: 0 | 1;
	only_fans_can_comment?: 0 | 1;
}