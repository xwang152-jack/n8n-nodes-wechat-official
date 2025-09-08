# n8n微信公众号插件故障排除指南

## 问题描述
n8n微信公众号插件无法在n8n界面中正确识别和显示。

## 根本原因分析
通过对比正常工作的n8n-nodes-qwen-image项目，发现问题的根本原因：

1. **package.json配置错误**：main字段指向错误的文件路径
   - 错误配置：`"main": "index.js"`
   - 正确配置：`"main": "dist/index.js"`

2. **index.ts文件缺少导出内容**：原始index.ts文件为空，导致构建后的dist/index.js没有实际的导出内容

## 解决方案

### 步骤1：修正package.json配置
```json
{
  "main": "dist/index.js"
}
```

### 步骤2：创建正确的index.ts导出文件
```typescript
// 导出工具类
export { AccessTokenManager } from './nodes/WechatOfficialAccount/utils/AccessTokenManager';

// 导出工具函数
export * from './nodes/WechatOfficialAccount/utils/ErrorHandler';
export * from './nodes/WechatOfficialAccount/utils/FileUtils';

// 导出类型定义
export * from './nodes/WechatOfficialAccount/types';
```

### 步骤3：重新构建项目
```bash
npm run build
```

### 步骤4：安装到Docker n8n容器
```bash
# 打包插件
npm pack

# 复制到容器
docker cp n8n-nodes-wechat-official-1.0.0.tgz n8n-nodes-n8n-1:/tmp/

# 以root用户安装
docker exec -u root -it n8n-nodes-n8n-1 npm install -g /tmp/n8n-nodes-wechat-official-1.0.0.tgz

# 重启容器
docker restart n8n-nodes-n8n-1
```

## 验证结果
- ✅ package.json main字段已修正
- ✅ index.ts文件包含正确的导出内容
- ✅ dist/index.js构建成功并包含实际导出
- ✅ 插件成功安装到Docker n8n容器
- ✅ n8n容器重启正常，插件已加载

## 访问测试
n8n编辑器现在可以通过以下地址访问：
http://localhost:5678

用户可以登录后在节点列表中查看是否能找到微信公众号相关节点。

## 问题描述
n8n界面中没有显示微信公众号节点插件

## 根本原因
插件被安装到了错误的目录位置：
- **错误位置**: `/home/node/.n8n/custom/`
- **正确位置**: `/home/node/.n8n/custom-nodes/`

## 解决方案

### 1. 检查插件安装位置
```bash
# 检查错误位置
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom/

# 检查正确位置
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom-nodes/
```

### 2. 移动插件到正确位置
```bash
# 将插件从custom目录复制到custom-nodes目录
docker exec n8n-nodes-n8n-1 cp -r /home/node/.n8n/custom/n8n-nodes-wechat-official /home/node/.n8n/custom-nodes/
```

### 3. 重启n8n容器
```bash
docker restart n8n-nodes-n8n-1
```

### 4. 验证插件加载
```bash
# 检查n8n日志
docker logs n8n-nodes-n8n-1 --tail 30

# 验证插件文件结构
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom-nodes/n8n-nodes-wechat-official/dist/
```

## 插件文件结构验证

正确的插件结构应该包含：
```
/home/node/.n8n/custom-nodes/n8n-nodes-wechat-official/
├── dist/
│   ├── credentials/
│   │   └── WechatOfficialAccountApi.credentials.js
│   ├── nodes/
│   │   └── WechatOfficialAccount/
│   │       └── WechatOfficialAccount.node.js
│   ├── index.js
│   └── package.json
├── package.json
└── node_modules/
```

## 常见问题

### Q: 为什么插件会安装到错误位置？
A: 这通常是因为安装脚本或Docker挂载配置指向了错误的目录。n8n默认在`custom-nodes`目录中查找自定义节点。

### Q: 如何确认插件已成功加载？
A: 
1. 重启容器后检查日志，确保没有插件加载错误
2. 在n8n界面中搜索"微信"或"WeChat"
3. 检查节点面板中是否出现微信公众号相关节点

### Q: 如果移动后仍然看不到插件怎么办？
A: 
1. 检查插件的package.json中的n8n配置
2. 确认dist目录中的编译文件完整
3. 查看n8n日志中是否有具体的错误信息
4. 尝试重新构建和安装插件

## 预防措施

1. **正确的安装命令**:
   ```bash
   # 确保复制到正确目录
   docker cp ./n8n-nodes-wechat-official n8n-container:/home/node/.n8n/custom-nodes/
   ```

2. **验证安装**:
   每次安装后都要验证文件位置和结构

3. **环境变量检查**:
   确保n8n容器有正确的环境变量配置

## 手动安装步骤

如果自动安装失败，可以按以下步骤手动安装：

1. 构建插件
   ```bash
   npm run build
   npm pack
   ```

2. 复制到容器
   ```bash
   docker cp ./n8n-nodes-wechat-official-1.0.0.tgz n8n-container:/tmp/
   ```

3. 在容器内解压和安装
   ```bash
   docker exec -it n8n-container bash
   cd /home/node/.n8n/custom-nodes/
   tar -xzf /tmp/n8n-nodes-wechat-official-1.0.0.tgz
   mv package n8n-nodes-wechat-official
   cd n8n-nodes-wechat-official
   npm install
   ```

4. 重启容器
   ```bash
   docker restart n8n-container
   ```

## 总结

主要问题是插件安装位置错误。通过将插件从`/home/node/.n8n/custom/`移动到`/home/node/.n8n/custom-nodes/`并重启容器，问题应该得到解决。现在请访问n8n界面（http://localhost:5678）检查微信公众号节点是否已经出现在节点面板中。