# WeChat Official Account Plugin - 完整故障排除指南

## 问题现状
插件已成功安装到Docker容器中，但在n8n界面中仍然无法找到微信公众号节点。

## 已完成的诊断步骤

### 1. 版本兼容性检查 ✅
- n8n版本: 1.109.2
- 插件要求: n8nNodesApiVersion: 1
- 兼容性: 正常

### 2. 插件配置验证 ✅
- package.json中的n8n字段配置正确
- 节点路径: `dist/nodes/WechatOfficialAccount/WechatOfficialAccount.node.js`
- 凭证路径: `dist/credentials/WechatOfficialAccountApi.credentials.js`

### 3. 构建输出检查 ✅
- 构建成功，所有必要文件已生成
- dist目录结构完整
- 主要文件存在且可访问

### 4. 容器内安装 ✅
- 插件已复制到 `/home/node/.n8n/custom-nodes/n8n-nodes-wechat-official/`
- 使用 `npm install ./n8n-nodes-wechat-official` 成功安装
- 符号链接已创建: `node_modules/n8n-nodes-wechat-official -> ../n8n-nodes-wechat-official`

### 5. 环境变量检查 ✅
- N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true (已启用)
- 其他相关环境变量配置正常

## 可能的根本原因分析

### 1. n8n社区包加载机制问题
n8n可能需要特定的包结构或安装方式来识别自定义节点。

### 2. 插件注册问题
插件可能需要在n8n的包管理系统中正确注册。

### 3. 缓存问题
n8n可能缓存了节点列表，需要清除缓存。

## 推荐解决方案

### 方案1: 使用n8n包管理器安装
```bash
# 1. 创建tgz包
npm pack

# 2. 在n8n界面中通过"Settings" > "Community Nodes"安装
# 或使用命令行
docker exec n8n-nodes-n8n-1 n8n install n8n-nodes-wechat-official-1.0.0.tgz
```

### 方案2: 清除n8n缓存并重启
```bash
# 清除n8n缓存
docker exec n8n-nodes-n8n-1 rm -rf /home/node/.n8n/cache
docker exec n8n-nodes-n8n-1 rm -rf /home/node/.n8n/.cache

# 重启容器
docker restart n8n-nodes-n8n-1
```

### 方案3: 使用环境变量强制加载
```bash
# 设置自定义节点路径
docker run -d \
  --name n8n-custom \
  -p 5678:5678 \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 方案4: 直接安装到全局node_modules
```bash
# 安装到全局位置
docker exec n8n-nodes-n8n-1 npm install -g /home/node/.n8n/custom-nodes/n8n-nodes-wechat-official
```

## 验证步骤

1. **检查n8n界面**
   - 访问 http://localhost:5678
   - 登录后查看节点面板
   - 搜索"WeChat"或"微信"

2. **检查日志**
   ```bash
   docker logs n8n-nodes-n8n-1 | grep -i wechat
   ```

3. **检查已安装的包**
   ```bash
   docker exec n8n-nodes-n8n-1 npm list | grep wechat
   ```

## 下一步行动

如果以上方案都无效，建议：

1. **联系n8n社区**
   - 在n8n GitHub仓库提交issue
   - 在n8n社区论坛寻求帮助

2. **检查n8n版本特定问题**
   - 尝试使用不同版本的n8n
   - 查看n8n 1.109.2的已知问题

3. **开发环境测试**
   - 在本地开发环境中测试插件
   - 使用n8n CLI工具进行调试

## 联系信息

如需进一步帮助，请提供：
- 完整的Docker日志
- n8n界面截图
- 插件安装的详细步骤
- 系统环境信息