# 微信公众号 n8n 节点插件 Docker 部署指南

本指南将帮助您在 Docker 环境中部署 n8n 并安装微信公众号节点插件。插件现已优化为使用用户节点文件夹部署方式，提供更好的隔离性和权限管理。

## 📋 前置要求

- Docker 和 Docker Compose 已安装
- 已构建的插件包文件 `n8n-nodes-wechat-official-0.1.0.tgz`
- 了解 n8n 用户节点目录概念（推荐部署方式）

## 🚀 快速部署

### 方法一：使用 Docker Compose（推荐 - 用户节点文件夹部署）

**优势说明**：
- ✅ **隔离性更好**：插件安装在用户专用目录，不影响全局环境
- ✅ **权限管理优化**：遵循 n8n 官方推荐的权限模型
- ✅ **数据持久化**：用户节点目录独立持久化，升级更安全
- ✅ **符合规范**：符合 n8n 官方节点管理最佳实践

1. **确保文件结构**
   ```
   n8n-nodes-wechat-official/
   ├── docker-compose.yml          # 已配置用户节点目录挂载
   ├── install-plugin.sh           # 用户节点安装脚本
   ├── dist/                       # 构建输出目录
   │   ├── nodes/                  # 节点文件
   │   ├── credentials/            # 凭据文件（已修复配置）
   │   └── package.json            # 包配置
   └── DOCKER_DEPLOYMENT_GUIDE.md
   ```

2. **启动服务**
   ```bash
   # 在项目根目录执行
   docker-compose up -d
   ```

3. **访问 n8n**
   - 打开浏览器访问：http://localhost:5679 （注意端口已更改）
   - 默认用户名：`admin`
   - 默认密码：`password`

## 📁 部署位置说明

### 当前部署架构
插件采用**用户节点文件夹**部署方式，具体位置如下：

```
宿主机路径：
./dist/                                    # 构建输出目录
├── nodes/                                 # 节点文件
│   └── WeChatOfficialAccount.node.js     # 主节点文件
├── credentials/                           # 凭据文件
│   └── WeChatOfficialAccountApi.credentials.js
└── package.json                           # 包配置文件

Docker 容器内路径：
/home/node/.n8n/custom/                    # 用户节点目录
├── nodes/                                 # 节点文件
├── credentials/                           # 凭据文件
└── package.json                           # 包配置

n8n 数据持久化：
/home/node/.n8n/                           # n8n 用户数据目录
├── config/                                # 配置文件
├── custom/                                # 自定义节点（插件安装位置）
├── nodes/                                 # 用户节点
└── workflows/                             # 工作流数据
```

### 挂载配置
```yaml
volumes:
  - n8n_data:/home/node/.n8n               # 数据持久化卷
  - ./dist:/home/node/.n8n/custom          # 插件文件挂载
```

### 方法二：使用自定义 Docker 镜像

1. **构建自定义镜像**
   ```bash
   # 构建包含插件的自定义镜像
   docker build -t n8n-wechat:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name n8n-wechat \
     -p 5678:5678 \
     -v n8n_data:/home/node/.n8n \
     -e N8N_BASIC_AUTH_ACTIVE=true \
     -e N8N_BASIC_AUTH_USER=admin \
     -e N8N_BASIC_AUTH_PASSWORD=admin123 \
     -e WEBHOOK_URL=http://localhost:5678/ \
     -e GENERIC_TIMEZONE=Asia/Shanghai \
     n8n-wechat:latest
   ```

## 🔧 手动安装插件（现有 n8n 容器）

如果您已有运行中的 n8n Docker 容器，可以手动安装插件：

1. **复制插件包到容器**
   ```bash
   docker cp n8n-nodes-wechat-official-0.1.0.tgz <container_name>:/tmp/
   ```

2. **进入容器安装**
   ```bash
   docker exec -it <container_name> /bin/sh
   npm install -g /tmp/n8n-nodes-wechat-official-0.1.0.tgz
   exit
   ```

3. **重启容器**
   ```bash
   docker restart <container_name>
   ```

## ✅ 验证安装

1. **检查插件是否加载**
   - 登录 n8n 界面
   - 创建新的工作流
   - 在节点列表中搜索 "WeChat" 或"微信"
   - 应该能看到 "WeChat Official Account" 节点

2. **验证插件功能**
   - 添加 WeChat Official Account 节点
   - 配置微信公众号凭据
   - 测试各项功能：
     - Access Token 获取
     - 图片上传（Base64 和 URL 方式）
     - 永久素材管理
     - 草稿创建和发布

## 🔐 凭据配置（已修复）

**重要更新**：凭据配置已完全修复，解决了插件在 n8n 中不可见的问题。

### 修复内容
- ✅ 添加了 `preAuthentication` 方法，增强凭据配置
- ✅ 统一了凭据名称规范（`wechatOfficialAccountApi`）
- ✅ 优化了认证流程和错误处理
- ✅ 改进了凭据字段验证和安全性

### 配置步骤
在 n8n 中配置微信公众号 API 凭据：

1. 进入 **Settings** → **Credentials**
2. 点击 **Create New**
3. 选择 **WeChat Official Account API**
4. 填入以下信息：
   - **App ID**: 微信公众号的 AppID
   - **App Secret**: 微信公众号的 AppSecret（已加密存储）
   - **Environment**: 选择 API 环境（生产环境/沙箱环境）

### 凭据验证
- 系统会自动验证 AppID 和 AppSecret 的有效性
- 支持生产环境和沙箱环境切换
- 提供详细的错误提示和调试信息

## 📊 环境变量配置

当前 Docker Compose 配置中的环境变量：

```yaml
environment:
  - N8N_BASIC_AUTH_ACTIVE=true          # 启用基础认证
  - N8N_BASIC_AUTH_USER=admin           # 用户名
  - N8N_BASIC_AUTH_PASSWORD=password    # 密码（已更新）
  - WEBHOOK_URL=http://localhost:5679/  # Webhook URL（端口已更改）
  - N8N_HOST=0.0.0.0                    # 主机绑定
  - N8N_PORT=5678                       # 内部端口
  - N8N_PROTOCOL=http                   # 协议
```

### 用户节点目录配置
```yaml
volumes:
  - n8n_data:/home/node/.n8n            # n8n 数据持久化
  - ./dist:/home/node/.n8n/custom       # 用户节点目录挂载
```

### 可选的额外配置
```yaml
  - GENERIC_TIMEZONE=Asia/Shanghai      # 时区
  - N8N_LOG_LEVEL=info                  # 日志级别
  - N8N_METRICS=true                    # 启用指标
  - N8N_USER_FOLDER=/home/node/.n8n     # 用户文件夹路径
```

## 🐛 故障排除

### 插件未显示（已解决）
**常见原因及解决方案**：
1. **凭据配置问题**（已修复）：
   - ✅ 已添加 `preAuthentication` 方法
   - ✅ 已统一凭据名称规范
   - ✅ 已优化认证流程

2. **检查插件加载状态**：
   ```bash
   # 检查容器日志
   docker logs n8n-wechat
   
   # 检查用户节点目录
   docker exec n8n-wechat ls -la /home/node/.n8n/custom
   
   # 验证插件文件结构
   docker exec n8n-wechat find /home/node/.n8n/custom -name "*.js"
   ```

3. **重启服务**：
   ```bash
   docker-compose restart
   ```

### 用户节点目录问题
1. **挂载路径验证**：
   ```bash
   # 检查挂载状态
   docker inspect n8n-wechat | grep -A 10 "Mounts"
   
   # 验证目录权限
   docker exec n8n-wechat ls -la /home/node/.n8n/
   ```

2. **权限修复**：
   ```bash
   # 修复目录权限
   docker exec n8n-wechat chown -R node:node /home/node/.n8n/custom
   ```

### 端口和网络问题
1. **端口检查**：
   ```bash
   # 检查端口占用（注意端口已更改为5679）
   lsof -i :5679
   
   # 验证容器端口映射
   docker port n8n-wechat
   ```

2. **网络连接**：
   - 确认防火墙设置
   - 验证 Docker 网络配置
   - 检查容器网络状态

### 凭据配置问题
1. **验证凭据类型**：
   - 确保选择 "WeChat Official Account API"
   - 检查 AppID 和 AppSecret 格式
   - 验证环境选择（生产/沙箱）

2. **调试凭据**：
   ```bash
   # 查看 n8n 日志中的凭据相关信息
   docker logs n8n-wechat | grep -i credential
   ```

## 📝 日志查看

```bash
# 查看容器日志
docker logs n8n-wechat

# 实时查看日志
docker logs -f n8n-wechat

# 查看最近100行日志
docker logs --tail 100 n8n-wechat
```

## 🔄 更新插件

### 用户节点目录更新方式

1. **重新构建插件**
   ```bash
   # 构建最新版本
   npm run build
   
   # 验证构建输出
   ls -la dist/
   ```

2. **更新 Docker 部署**
   ```bash
   # 停止服务
   docker-compose down
   
   # 清理旧的挂载内容（可选）
   docker volume rm n8n-nodes-wechat-official_n8n_data
   
   # 重新启动服务
   docker-compose up -d
   
   # 验证插件加载
   docker logs n8n-wechat
   ```

3. **验证更新**
   ```bash
   # 检查用户节点目录
   docker exec n8n-wechat ls -la /home/node/.n8n/custom
   
   # 验证插件文件时间戳
   docker exec n8n-wechat find /home/node/.n8n/custom -name "*.js" -exec ls -la {} \;
   ```

### 热更新（开发模式）
对于开发环境，可以直接修改 `dist/` 目录中的文件，Docker 会自动同步更新。

## 📚 插件功能说明

### 支持的操作
- **获取 Access Token**: 自动管理微信 API 访问令牌
- **上传图片**: 支持 Base64 编码和图片 URL 两种方式
- **添加永久素材**: 上传图片、语音、视频等素材
- **创建草稿**: 创建图文消息草稿
- **发布草稿**: 将草稿发布为正式文章

### 图片上传功能
- **格式支持**: JPG、PNG
- **大小限制**: 1MB 以内
- **输入方式**: 
  - Base64 编码数据
  - 图片 URL（自动下载转换）

## 📋 部署状态检查清单

### ✅ 部署验证步骤
1. **容器状态检查**
   ```bash
   docker ps | grep n8n-wechat
   ```

2. **插件文件验证**
   ```bash
   docker exec n8n-wechat ls -la /home/node/.n8n/custom/
   ```

3. **n8n 界面验证**
   - 访问 http://localhost:5679
   - 创建新工作流
   - 搜索 "WeChat" 或 "微信"
   - 确认节点可见

4. **凭据配置验证**
   - 进入 Settings → Credentials
   - 创建 "WeChat Official Account API" 凭据
   - 测试连接

### 🎯 最佳实践建议

1. **安全性**
   - 定期更新 Docker 镜像
   - 使用强密码
   - 限制网络访问

2. **性能优化**
   - 监控容器资源使用
   - 定期清理日志文件
   - 使用 Docker 健康检查

3. **备份策略**
   - 定期备份 n8n_data 卷
   - 备份插件配置文件
   - 记录环境变量配置

## 🆘 技术支持

如遇到问题，请：
1. 查看本指南的故障排除部分
2. 检查容器日志：`docker logs n8n-wechat`
3. 验证部署状态检查清单
4. 检查 GitHub Issues
5. 提交新的 Issue 并附上详细日志和环境信息

### 📞 问题报告模板
```
环境信息：
- Docker 版本：
- Docker Compose 版本：
- 操作系统：
- 插件版本：

问题描述：
[详细描述问题]

重现步骤：
1. 
2. 
3. 

错误日志：
[粘贴相关日志]
```

---

**注意**: 请确保您的微信公众号已通过认证，并具有相应的 API 权限。插件现已完全修复凭据配置问题，可正常使用所有功能。