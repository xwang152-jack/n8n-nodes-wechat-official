# WeChat Official Account Plugin - Docker Installation Guide

本指南详细说明如何将 n8n-nodes-wechat-official 插件安装到现有的 Docker n8n 容器中。

## 前提条件

- 已有运行中的 Docker n8n 容器
- Docker 命令行工具
- 已构建的插件包 (`n8n-nodes-wechat-official-1.0.0.tgz`)

## 安装步骤

### 1. 检查现有 n8n 容器

```bash
# 查看运行中的 n8n 容器
docker ps | grep n8n

# 示例输出：
# ff673bd4e3eb   n8nio/n8n:latest   "tini -- /docker-ent…"   27 hours ago   Up 26 minutes   0.0.0.0:5678->5678/tcp   n8n-nodes-n8n-1
```

### 2. 构建和打包插件

```bash
# 在插件项目目录中
cd /path/to/n8n-nodes-wechat-official

# 构建插件
npm run build

# 打包插件
npm pack
```

### 3. 复制文件到容器

```bash
# 复制插件包到容器
docker cp n8n-nodes-wechat-official-1.0.0.tgz n8n-nodes-n8n-1:/tmp/

# 复制安装脚本到容器
docker cp install-plugin.sh n8n-nodes-n8n-1:/tmp/
```

### 4. 在容器内安装插件

```bash
# 执行安装脚本
docker exec n8n-nodes-n8n-1 sh /tmp/install-plugin.sh
```

如果遇到依赖冲突，手动安装：

```bash
# 手动安装插件依赖
docker exec n8n-nodes-n8n-1 sh -c "cd /home/node/.n8n/custom/n8n-nodes-wechat-official && npm install --production --legacy-peer-deps"
```

### 5. 重启容器

```bash
# 重启 n8n 容器以加载插件
docker restart n8n-nodes-n8n-1

# 等待容器启动完成
sleep 10

# 检查容器状态
docker ps | grep n8n
```

### 6. 验证插件安装

```bash
# 检查插件目录
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom/

# 检查插件文件
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom/n8n-nodes-wechat-official/

# 查看容器日志
docker logs n8n-nodes-n8n-1 --tail 20
```

## 测试插件功能

### 1. 访问 n8n 界面

打开浏览器访问：`http://localhost:5678`

### 2. 创建新工作流

1. 点击 "New Workflow"
2. 在节点面板中搜索 "WeChat" 或 "微信"
3. 应该能看到 "WeChat Official Account" 节点

### 3. 配置认证凭据

1. 添加 WeChat Official Account 节点
2. 点击 "Credential to connect with"
3. 选择 "Create New"
4. 输入你的微信公众号 AppID 和 AppSecret
5. 测试连接

### 4. 测试基本功能

创建一个简单的工作流测试以下功能：
- 获取 Access Token
- 发送模板消息
- 获取用户信息
- 创建菜单

## 故障排除

### 插件未显示在节点列表中

1. 检查插件目录权限：
```bash
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom/
```

2. 检查插件文件完整性：
```bash
docker exec n8n-nodes-n8n-1 ls -la /home/node/.n8n/custom/n8n-nodes-wechat-official/dist/
```

3. 重启容器：
```bash
docker restart n8n-nodes-n8n-1
```

### 依赖安装失败

如果遇到 npm 依赖冲突：

```bash
# 使用 --legacy-peer-deps 参数
docker exec n8n-nodes-n8n-1 sh -c "cd /home/node/.n8n/custom/n8n-nodes-wechat-official && npm install --legacy-peer-deps"

# 或者使用 --force 参数
docker exec n8n-nodes-n8n-1 sh -c "cd /home/node/.n8n/custom/n8n-nodes-wechat-official && npm install --force"
```

### 权限问题

确保插件目录有正确的权限：

```bash
# 修复权限
docker exec n8n-nodes-n8n-1 chown -R node:node /home/node/.n8n/custom
docker exec n8n-nodes-n8n-1 chmod -R 755 /home/node/.n8n/custom
```

### 查看详细日志

```bash
# 查看完整的容器日志
docker logs n8n-nodes-n8n-1

# 实时查看日志
docker logs -f n8n-nodes-n8n-1
```

## 环境变量配置

如果需要设置特定的环境变量，可以在重启容器时添加：

```bash
# 停止容器
docker stop n8n-nodes-n8n-1

# 使用新的环境变量启动容器
docker run -d \
  --name n8n-nodes-n8n-1 \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=admin123 \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

## 卸载插件

如果需要卸载插件：

```bash
# 删除插件目录
docker exec n8n-nodes-n8n-1 rm -rf /home/node/.n8n/custom/n8n-nodes-wechat-official

# 重启容器
docker restart n8n-nodes-n8n-1
```

## 注意事项

1. **备份数据**：在安装插件前，建议备份 n8n 数据
2. **版本兼容性**：确保插件版本与 n8n 版本兼容
3. **资源使用**：插件会增加容器的内存和 CPU 使用
4. **安全性**：确保微信公众号凭据的安全存储
5. **更新插件**：重复安装步骤即可更新插件

## 支持

如果遇到问题，请检查：
1. Docker 容器日志
2. n8n 版本兼容性
3. 插件文件完整性
4. 网络连接状态

更多信息请参考项目 README.md 文件。