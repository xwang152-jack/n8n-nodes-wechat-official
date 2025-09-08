import {
	IExecuteFunctions,
	NodeOperationError,
} from 'n8n-workflow';

import {
	MaterialType,
	FILE_TYPE_LIMITS,
	VideoDescription,
} from '../types';

/**
 * 验证文件输入
 */
export function validateFileInput(
	context: IExecuteFunctions,
	file: string,
	materialType: MaterialType,
): void {
	if (!file) {
		throw new NodeOperationError(context.getNode(), '文件参数不能为空');
	}
	
	const limits = FILE_TYPE_LIMITS[materialType];
	if (!limits) {
		throw new NodeOperationError(
			context.getNode(),
			`不支持的素材类型: ${materialType}`,
		);
	}
	
	// 验证base64格式
	if (file.startsWith('data:')) {
		const [header] = file.split(',');
		const mimeType = header.split(';')[0].split(':')[1];
		
		if (!limits.allowedTypes.includes(mimeType)) {
			throw new NodeOperationError(
				context.getNode(),
				`不支持的文件类型: ${mimeType}。支持的类型: ${limits.allowedTypes.join(', ')}`,
			);
		}
		
		// 检查文件大小
		const [, data] = file.split(',');
		const buffer = Buffer.from(data, 'base64');
		if (buffer.length > limits.maxSize) {
			throw new NodeOperationError(
				context.getNode(),
				`文件大小超过限制。最大允许: ${(limits.maxSize / 1024 / 1024).toFixed(1)}MB`,
			);
		}
	} else {
		throw new NodeOperationError(
			context.getNode(),
			'不支持的文件格式，请使用base64编码的文件（格式：data:mime/type;base64,data）',
		);
	}
}

/**
 * 准备文件FormData
 */
export function prepareFileFormData(
	context: IExecuteFunctions,
	file: string,
	materialType: MaterialType,
	description?: VideoDescription,
): any {
	if (!file.startsWith('data:')) {
		throw new NodeOperationError(
			context.getNode(),
			'不支持的文件格式，请使用base64编码的文件',
		);
	}
	
	const [header, data] = file.split(',');
	const mimeType = header.split(';')[0].split(':')[1];
	const buffer = Buffer.from(data, 'base64');
	
	// 获取文件扩展名
	const extension = getFileExtension(mimeType);
	const filename = `upload.${extension}`;
	
	const formData: any = {
		type: materialType,
		media: {
			value: buffer,
			options: {
				filename,
				contentType: mimeType,
			},
		},
	};
	
	// 视频类型需要添加描述信息
	if (materialType === MaterialType.VIDEO && description) {
		validateVideoDescription(context, description);
		formData.description = JSON.stringify(description);
	}
	
	return formData;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'audio/mpeg': 'mp3',
		'audio/amr': 'amr',
		'video/mp4': 'mp4',
	};
	
	return mimeToExt[mimeType] || 'bin';
}

/**
 * 验证视频描述信息
 */
export function validateVideoDescription(
	context: IExecuteFunctions,
	description: VideoDescription,
): void {
	if (!description.title || description.title.trim() === '') {
		throw new NodeOperationError(
			context.getNode(),
			'视频标题不能为空',
		);
	}
	
	if (!description.introduction || description.introduction.trim() === '') {
		throw new NodeOperationError(
			context.getNode(),
			'视频介绍不能为空',
		);
	}
	
	// 标题长度限制
	if (description.title.length > 20) {
		throw new NodeOperationError(
			context.getNode(),
			'视频标题长度不能超过20个字符',
		);
	}
	
	// 介绍长度限制
	if (description.introduction.length > 120) {
		throw new NodeOperationError(
			context.getNode(),
			'视频介绍长度不能超过120个字符',
		);
	}
}

/**
 * 检查文件类型和大小
 */
export function checkFileTypeAndSize(
	context: IExecuteFunctions,
	file: string,
	allowedTypes: string[],
	maxSize: number,
): { mimeType: string; size: number } {
	if (!file.startsWith('data:')) {
		throw new NodeOperationError(
			context.getNode(),
			'不支持的文件格式，请使用base64编码的文件',
		);
	}
	
	const [header, data] = file.split(',');
	const mimeType = header.split(';')[0].split(':')[1];
	const buffer = Buffer.from(data, 'base64');
	const size = buffer.length;
	
	if (!allowedTypes.includes(mimeType)) {
		throw new NodeOperationError(
			context.getNode(),
			`不支持的文件类型: ${mimeType}。支持的类型: ${allowedTypes.join(', ')}`,
		);
	}
	
	if (size > maxSize) {
		throw new NodeOperationError(
			context.getNode(),
			`文件大小超过限制。当前大小: ${(size / 1024 / 1024).toFixed(2)}MB，最大允许: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
		);
	}
	
	return { mimeType, size };
}

/**
 * 准备图片上传的FormData（用于uploadimg接口）
 */
export function prepareImageFormData(
	context: IExecuteFunctions,
	file: string,
): any {
	// 验证图片文件
	checkFileTypeAndSize(
		context,
		file,
		['image/jpeg', 'image/png'],
		1024 * 1024, // 1MB
	);
	
	const [header, data] = file.split(',');
	const mimeType = header.split(';')[0].split(':')[1];
	const buffer = Buffer.from(data, 'base64');
	const extension = getFileExtension(mimeType);
	
	return {
		media: {
			value: buffer,
			options: {
				filename: `image.${extension}`,
				contentType: mimeType,
			},
		},
	};
}