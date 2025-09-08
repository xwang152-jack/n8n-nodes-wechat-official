# n8n-nodes-wechat-official-account

This is an n8n community node. It lets you use WeChat Official Account API in your n8n workflows.

WeChat Official Account is a platform that allows businesses and organizations to create official accounts on WeChat to interact with users, publish content, and provide services.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## ✨ Key Features

- 🔧 **Dual Usage Mode**: Works as both workflow node and AI tool (usableAsTool: true)
- 🔑 **Smart Token Management**: Automatic access token caching and refresh
- 📁 **Complete Material Management**: Upload images, voice, video, and thumbnails
- 📝 **Draft Management**: Create and publish article drafts
- 🛡️ **Robust Error Handling**: Comprehensive error codes mapping and retry mechanisms
- 🚀 **High Performance**: Batch processing and rate limiting support
- 🔒 **Secure**: IP whitelist support and credential encryption

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

### Method 1: Community Node Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Method 2: Docker Deployment (Recommended)

This plugin supports Docker deployment with user node directory mounting for better isolation and management.

#### Prerequisites
- Docker and Docker Compose installed
- Built plugin files in `dist/` directory

#### Quick Start

1. **Build the plugin**:
   ```bash
   npm run build
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access n8n**:
   - URL: http://localhost:5679
   - Username: admin
   - Password: password

#### Docker Configuration

The plugin is automatically installed to the user node directory (`~/.n8n/custom/`) inside the container:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-wechat
    ports:
      - "5679:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n
      - ./dist:/home/node/.n8n/custom  # Plugin files mounted to user node directory
    command: >
      sh -c "mkdir -p /home/node/.n8n/custom && 
             chown -R node:node /home/node/.n8n/custom && 
             n8n start"
```

#### Benefits of User Node Directory Installation

- **Better Isolation**: Plugins are isolated in user space
- **Easy Management**: Simple to add/remove plugins
- **No Global Pollution**: Doesn't affect system-wide n8n installation
- **Development Friendly**: Easy to update during development

#### Verification

After deployment, verify the plugin installation:

```bash
# Check if plugin files are correctly mounted
docker exec n8n-wechat ls -la /home/node/.n8n/custom

# Verify plugin files
docker exec n8n-wechat find /home/node/.n8n/custom -name '*.js' -type f
```

You should see the WeChat Official Account node available in the n8n node panel.

## Operations

### Access Token
- **Get**: Retrieve access token for WeChat Official Account API
  - Automatic caching and refresh mechanism
  - Support for custom cache duration
  - Error handling for expired tokens

### Material Management
- **Upload Image**: Upload image for articles
  - Support for base64 encoded images
  - Automatic format validation
  - Returns media_id for further use
- **Upload Media**: Upload permanent media (image, voice, video, thumb)
  - Multiple media types support
  - File size validation
  - Batch upload capabilities

### Draft Management
- **Add Draft**: Create a new draft article
  - Rich text content support
  - Media attachment handling
  - Draft validation and preview
- **Publish Draft**: Publish a draft article
  - Automatic publishing workflow
  - Status tracking and confirmation
  - Error recovery mechanisms

## 🤖 Tool Calling Mode

This node supports **Tool Calling Mode** (`usableAsTool: true`), which means it can be:

### Used as Workflow Node
```
[Trigger] → [WeChat Official Account] → [Other Nodes]
```

### Called by AI Tools
```javascript
// AI can directly invoke node functions
const result = await wechatNode.execute({
  resource: 'accessToken',
  operation: 'get'
});
```

### Integrated via API
```bash
# Direct API integration
curl -X POST /api/wechat/upload-image \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image"}'
```

### Benefits of Tool Calling Mode
- **AI Assistant Integration**: Let AI assistants directly manage WeChat operations
- **Programmatic Access**: Use in custom scripts and applications
- **Batch Processing**: Efficient bulk operations
- **Real-time Integration**: Immediate response for time-sensitive tasks

## 🔐 Authentication & Configuration

### Credentials Setup

This node requires WeChat Official Account API credentials:

| Field | Description | Required |
|-------|-------------|----------|
| **App ID** | Your WeChat Official Account App ID | ✅ |
| **App Secret** | Your WeChat Official Account App Secret | ✅ |
| **Environment** | Choose 'production' or 'sandbox' | ✅ |
| **Server IP** | Your server IP for whitelist | ⚠️ |

### Getting Your Credentials

1. **Login to WeChat Platform**
   - Visit [WeChat Official Account Platform](https://mp.weixin.qq.com/)
   - Login with your account credentials

2. **Navigate to Settings**
   - Go to **Development** > **Basic Configuration**
   - Find your **App ID** and **App Secret**

3. **Configure IP Whitelist** (Important for Production)
   - Add your server IP to the whitelist
   - This is required for API access in production

4. **Security Best Practices**
   - Store credentials securely in n8n credential store
   - Use environment variables for sensitive data
   - Regularly rotate App Secret
   - Monitor API usage and access logs

### Environment Configuration

- **Production**: Use for live WeChat Official Account
- **Sandbox**: Use for testing and development (limited functionality)

### Required Permissions

Ensure your WeChat Official Account has the following permissions:
- ✅ Basic interface permissions
- ✅ Advanced interface permissions (for media upload)
- ✅ Custom menu permissions (if applicable)
- ✅ Material management permissions

## 📋 Usage Examples

### Example 1: Upload Image and Create Draft

```json
{
  "workflow": {
    "nodes": [
      {
        "name": "Upload Image",
        "type": "n8n-nodes-wechat-official-account",
        "parameters": {
          "resource": "material",
          "operation": "uploadImage",
          "image": "{{ $binary.data.data }}"
        }
      },
      {
        "name": "Create Draft",
        "type": "n8n-nodes-wechat-official-account",
        "parameters": {
          "resource": "draft",
          "operation": "addDraft",
          "title": "My Article",
          "content": "Article content with image",
          "thumb_media_id": "{{ $node['Upload Image'].json.media_id }}"
        }
      }
    ]
  }
}
```

### Example 2: Batch Media Upload

```json
{
  "resource": "material",
  "operation": "uploadMedia",
  "type": "image",
  "media": [
    {"name": "image1.jpg", "data": "base64_data_1"},
    {"name": "image2.jpg", "data": "base64_data_2"}
  ]
}
```

## 🚀 Best Practices

### Performance Optimization
- **Cache Access Tokens**: Tokens are automatically cached for 2 hours
- **Batch Operations**: Use batch upload for multiple media files
- **Rate Limiting**: Built-in rate limiting prevents API quota exhaustion

### Error Handling
- **Automatic Retry**: Failed requests are automatically retried with exponential backoff
- **Comprehensive Logging**: All operations are logged for debugging
- **Graceful Degradation**: Fallback mechanisms for common failures

### Security
- **Credential Encryption**: All credentials are encrypted in n8n
- **IP Whitelisting**: Configure IP whitelist in WeChat platform
- **Token Rotation**: Regularly rotate App Secret for security

## 🔧 Compatibility

| Component | Version | Status |
|-----------|---------|--------|
| n8n | 0.190.0+ | ✅ Supported |
| Node.js | 16.x+ | ✅ Supported |
| WeChat API | v2.0 | ✅ Latest |

## 📚 Resources

- 📖 [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- 🔗 [WeChat Official Account API Documentation](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- 🌐 [WeChat Official Account Platform](https://mp.weixin.qq.com/)
- 💬 [Community Support Forum](https://community.n8n.io/)

## 📄 License

[MIT](https://github.com/xwang152-jack/n8n-nodes-wechat-official/blob/master/LICENSE.md)

## 👨‍💻 Author

**Jack Wang**
- GitHub: [@jackwang](https://github.com/jackwang)
- Email: jack@example.com

## 📈 Version History

### v1.0.0 (Latest)
- ✅ Initial release with full WeChat Official Account API support
- ✅ **Tool Calling Mode** support (`usableAsTool: true`)
- ✅ Smart Access Token management with caching
- ✅ Complete Material upload functionality (image, voice, video, thumb)
- ✅ Draft creation and publishing with rich content support
- ✅ Comprehensive error handling and retry mechanisms
- ✅ Rate limiting and quota management
- ✅ Batch processing capabilities
- ✅ Security enhancements and IP whitelist support

---

**🎉 Ready to automate your WeChat Official Account? Install now and start building powerful workflows!**
