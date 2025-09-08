import https from 'https';
import http from 'http';

// 测试数据
const testUrl = 'https://muse-ai.oss-cn-hangzhou.aliyuncs.com/img/76510d7ce8bb463a86722a05a005ad65.jpeg';
const appId = 'wxd229bec1f50ba65c';
const appSecret = '90546b886ae49e40d4311defb44637a1';

console.log('=== 微信公众号节点本地测试 ===\n');

// 复制validateImageFormat函数逻辑进行测试
function validateImageFormat(url) {
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    // 移除查询参数和锚点，只检查路径部分
    const urlPath = url.split('?')[0].split('#')[0].toLowerCase();
    
    // 添加调试日志
    console.log('[DEBUG] validateImageFormat - Original URL:', url);
    console.log('[DEBUG] validateImageFormat - Processed URL path:', urlPath);
    console.log('[DEBUG] validateImageFormat - Valid extensions:', validExtensions);
    
    const result = validExtensions.some(ext => {
        const matches = urlPath.endsWith(ext);
        console.log(`[DEBUG] validateImageFormat - Checking ${ext}: ${matches}`);
        return matches;
    });
    
    console.log('[DEBUG] validateImageFormat - Final result:', result);
    return result;
}

// 测试1: URL格式验证
console.log('1. 测试URL格式验证功能:');
console.log(`测试URL: ${testUrl}`);

try {
    const isValid = validateImageFormat(testUrl);
    console.log(`✅ URL验证结果: ${isValid ? '有效' : '无效'}`);
    
    if (isValid) {
        console.log('   - URL格式正确，包含有效的图片扩展名');
    } else {
        console.log('   - URL格式无效，不包含支持的图片扩展名');
    }
} catch (error) {
    console.log(`❌ URL验证出错: ${error.message}`);
}

console.log('\n2. 测试微信API凭据配置:');
console.log(`AppID: ${appId}`);
console.log(`AppSecret: ${appSecret.substring(0, 8)}...`);

// 获取访问令牌函数
async function getAccessToken(appid, appsecret, baseUrl = 'https://api.weixin.qq.com') {
    const url = `${baseUrl}/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`;
    
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.errcode && response.errcode !== 0) {
                        reject(new Error(`微信API错误: ${response.errmsg} (错误码: ${response.errcode})`));
                    } else {
                        resolve(response);
                    }
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`请求失败: ${error.message}`));
        });
    });
}

try {
    const accessToken = await getAccessToken(appId, appSecret);
    console.log('✅ 访问令牌获取成功');
    console.log(`   - Access Token: ${accessToken.access_token.substring(0, 20)}...`);
    console.log(`   - 过期时间: ${accessToken.expires_in}秒`);
} catch (error) {
    console.log(`❌ 访问令牌获取失败: ${error.message}`);
}

console.log('\n3. 测试图片下载功能:');

// 图片下载函数
async function downloadImageFromUrl(imageUrl) {
    console.log('[DEBUG] downloadImageFromUrl - Starting validation for URL:', imageUrl);
    
    if (!validateImageFormat(imageUrl)) {
        console.log('[DEBUG] downloadImageFromUrl - Validation FAILED for URL:', imageUrl);
        throw new Error('不支持的图片格式，仅支持 jpg/jpeg/png 格式');
    }
    
    console.log('[DEBUG] downloadImageFromUrl - Validation PASSED for URL:', imageUrl);
    
    return new Promise((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;
        
        protocol.get(imageUrl, (res) => {
            const chunks = [];
            
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                if (buffer.length > 1024 * 1024) {
                    reject(new Error('图片文件大小超过1MB限制'));
                    return;
                }
                
                const base64Data = buffer.toString('base64');
                resolve(base64Data);
            });
        }).on('error', (error) => {
            reject(new Error(`下载图片失败: ${error.message}`));
        });
    });
}

try {
    const imageData = await downloadImageFromUrl(testUrl);
    console.log('✅ 图片下载成功');
    console.log(`   - 图片数据长度: ${imageData.length} 字符 (Base64编码)`);
    console.log(`   - 预估文件大小: ${Math.round(imageData.length * 0.75 / 1024)} KB`);
} catch (error) {
    console.log(`❌ 图片下载失败: ${error.message}`);
}

console.log('\n=== 测试完成 ===');