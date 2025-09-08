# n8n-nodes-wechat-official

WeChat Official Account n8n node plugin with complete WeChat Official Account API integration.

## Features

- ✅ **Access Token Management**: Automatic access token retrieval, caching, and refresh
- ✅ **Material Management**: Support for temporary and permanent material upload, retrieval, and deletion
- ✅ **Draft Management**: Support for draft creation, modification, publishing, and deletion
- ✅ **Error Handling**: Comprehensive error handling and retry mechanisms
- ✅ **Type Safety**: Complete TypeScript type definitions
- ✅ **Security**: Input validation and sensitive information handling

## Installation

### Install via npm

```bash
npm install n8n-nodes-wechat-official
```

### Manual Installation

1. Download or clone this repository
2. Run in the project root directory:
   ```bash
   npm install
   npm run build
   ```
3. Copy the built files to n8n's custom nodes directory

## Configuration

### 1. Get WeChat Official Account Credentials

Before using this node, you need to:

1. Login to [WeChat Official Account Platform](https://mp.weixin.qq.com/)
2. Get from "Development" -> "Basic Configuration":
   - **AppID**: Unique identifier of the official account
   - **AppSecret**: Application secret of the official account

### 2. Configure Credentials in n8n

1. Create a new "WeChat Official Account API" credential in n8n
2. Fill in your AppID and AppSecret
3. Click "Test Connection" to verify the credentials are correct

## Usage

### Access Token Management

```javascript
// Get Access Token
{
  "resource": "accessToken",
  "operation": "get"
}

// Refresh Access Token
{
  "resource": "accessToken",
  "operation": "refresh"
}

// Validate Access Token
{
  "resource": "accessToken",
  "operation": "validate"
}
```

### Material Management

#### Upload Temporary Material

```javascript
{
  "resource": "material",
  "operation": "uploadTemp",
  "materialType": "image",
  "file": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### Upload Permanent Material

```javascript
{
  "resource": "material",
  "operation": "uploadPermanent",
  "materialType": "image",
  "file": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### Upload Video Material (requires description)

```javascript
{
  "resource": "material",
  "operation": "uploadPermanent",
  "materialType": "video",
  "file": "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28y...",
  "videoTitle": "Video Title",
  "videoIntroduction": "Video Description"
}
```

#### Get Material List

```javascript
{
  "resource": "material",
  "operation": "getList",
  "materialType": "image",
  "offset": 0,
  "count": 20
}
```

### Draft Management

#### Create Draft

```javascript
{
  "resource": "draft",
  "operation": "create",
  "articles": [
    {
      "title": "Article Title",
      "author": "Author",
      "digest": "Article Summary",
      "content": "<p>Article Content HTML</p>",
      "content_source_url": "https://example.com",
      "thumb_media_id": "Thumbnail Material ID"
    }
  ]
}
```

#### Publish Draft

```javascript
{
  "resource": "draft",
  "operation": "publish",
  "mediaId": "Draft ID"
}
```

## Supported File Formats

### Images
- **Formats**: JPG, PNG
- **Size Limit**: 10MB
- **Usage**: Temporary materials, permanent materials, article images

### Audio
- **Formats**: MP3, AMR
- **Size Limit**: 2MB
- **Duration Limit**: 60 seconds

### Video
- **Formats**: MP4
- **Size Limit**: 10MB
- **Requirements**: Title and description required

### Thumbnails
- **Formats**: JPG
- **Size Limit**: 64KB
- **Dimensions**: Recommended 360*200

## Error Handling

The node includes comprehensive error handling mechanisms:

- **Automatic Retry**: Automatically retries for network errors and specific WeChat API error codes
- **Error Mapping**: Maps WeChat API error codes to understandable error messages
- **Input Validation**: Validates all input parameters
- **Security Handling**: Automatically cleans sensitive information to prevent leaks

## FAQ

### Q: Access Token retrieval failed
**A**: Please check:
1. Whether AppID and AppSecret are correct
2. Whether the official account is verified
3. Whether the network connection is normal

### Q: File upload failed
**A**: Please check:
1. Whether the file format is supported
2. Whether the file size exceeds the limit
3. Whether Base64 encoding is correct (must include data URI prefix)

### Q: Draft publishing failed
**A**: Please check:
1. Whether the draft content is complete
2. Whether the thumbnail material exists
3. Whether the article content complies with WeChat specifications

## API Limitations

- **Access Token**: Valid for 7200 seconds (2 hours), this plugin automatically manages caching
- **Temporary Materials**: Valid for 3 days
- **API Call Frequency**: Please follow WeChat Official Account Platform's call frequency limits

## Development

### Requirements

- Node.js >= 18.17.0
- TypeScript >= 4.8.0
- n8n >= 1.0.0

### Build

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Code linting
npm run lint
```

### Project Structure

```
n8n-nodes-wechat-official/
├── credentials/                 # Authentication credentials
│   └── WechatOfficialAccountApi.credentials.ts
├── nodes/
│   └── WechatOfficialAccount/  # Main node
│       ├── types/              # Type definitions
│       ├── utils/              # Utility functions
│       ├── WechatOfficialAccount.node.ts
│       └── wechat.svg         # Node icon
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

## Changelog

### v1.0.0
- Initial release
- Support for Access Token management
- Support for material management (temporary/permanent materials)
- Support for draft management
- Complete error handling and retry mechanisms

## Related Links

- [WeChat Official Account Development Documentation](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [n8n Official Documentation](https://docs.n8n.io/)
- [Project Repository](https://github.com/your-username/n8n-nodes-wechat-official)

## Support

If you encounter problems during use, please:

1. Check the FAQ section of this documentation
2. Submit an Issue on GitHub
3. Send an email to: xwagn152@163.com

---

**Note**: Please comply with WeChat Official Account Platform's terms of use and relevant laws and regulations when using this plugin.