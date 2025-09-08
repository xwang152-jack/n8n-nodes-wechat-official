import https from 'https';
import http from 'http';

// 测试数据
const testUrl = 'https://muse-ai.oss-cn-hangzhou.aliyuncs.com/img/76510d7ce8bb463a86722a05a005ad65.jpeg';
const appId = 'wxd229bec1f50ba65c';
const appSecret = '90546b886ae49e40d4311defb44637a1';
const baseUrl = 'https://api.weixin.qq.com';

console.log('=== 微信公众号素材上传测试 ===\n');

// 获取访问令牌
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

// 下载图片并转换为Buffer
async function downloadImageAsBuffer(imageUrl) {
    return new Promise((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;
        
        protocol.get(imageUrl, (res) => {
            const chunks = [];
            
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
        }).on('error', (error) => {
            reject(new Error(`下载图片失败: ${error.message}`));
        });
    });
}

// 上传图片到微信服务器
async function uploadImageToWechat(accessToken, imageBuffer) {
    const uploadUrl = `${baseUrl}/cgi-bin/media/uploadimg?access_token=${accessToken}`;
    
    return new Promise((resolve, reject) => {
        // 构建multipart/form-data
        const boundary = '----formdata-node-' + Math.random().toString(16);
        const CRLF = '\r\n';
        
        let body = '';
        body += `--${boundary}${CRLF}`;
        body += `Content-Disposition: form-data; name="media"; filename="image.jpg"${CRLF}`;
        body += `Content-Type: image/jpeg${CRLF}${CRLF}`;
        
        const header = Buffer.from(body, 'utf8');
        const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');
        
        const totalLength = header.length + imageBuffer.length + footer.length;
        const finalBuffer = Buffer.concat([header, imageBuffer, footer], totalLength);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': finalBuffer.length,
                'User-Agent': 'n8n-wechat-official-account'
            }
        };
        
        const req = https.request(uploadUrl, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.errcode && response.errcode !== 0) {
                        reject(new Error(`上传失败: ${response.errmsg} (错误码: ${response.errcode})`));
                    } else {
                        resolve(response);
                    }
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error(`请求失败: ${error.message}`));
        });
        
        req.write(finalBuffer);
        req.end();
    });
}

// 运行测试
async function runMaterialUploadTest() {
    try {
        console.log('1. 获取访问令牌...');
        const tokenResponse = await getAccessToken(appId, appSecret, baseUrl);
        console.log(`✅ 访问令牌获取成功: ${tokenResponse.access_token.substring(0, 20)}...`);
        
        console.log('\n2. 下载测试图片...');
        const imageBuffer = await downloadImageAsBuffer(testUrl);
        console.log(`✅ 图片下载成功，大小: ${Math.round(imageBuffer.length / 1024)} KB`);
        
        console.log('\n3. 上传图片到微信服务器...');
        const uploadResponse = await uploadImageToWechat(tokenResponse.access_token, imageBuffer);
        console.log('✅ 图片上传成功!');
        console.log(`   - 图片URL: ${uploadResponse.url}`);
        
        console.log('\n🎉 素材上传测试完成！所有功能正常工作。');
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
        console.log('\n请检查:');
        console.log('1. 网络连接是否正常');
        console.log('2. 微信公众号凭据是否正确');
        console.log('3. 图片URL是否可访问');
        console.log('4. 图片格式和大小是否符合要求');
    }
}

// 启动测试
runMaterialUploadTest();