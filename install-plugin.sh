#!/bin/bash

# 微信公众号n8n节点插件安装脚本
# 用于在Docker容器中安装自定义节点包

set -e

echo "开始安装微信公众号n8n节点插件..."

# 检查插件包是否存在
if [ ! -f "/tmp/n8n-nodes-wechat-offiaccount-0.1.0.tgz" ]; then
    echo "错误: 插件包文件不存在"
    exit 1
fi

# 全局安装插件包
echo "正在安装插件包..."
npm install -g /tmp/n8n-nodes-wechat-offiaccount-0.1.0.tgz

# 验证安装
echo "验证插件安装..."
npm list -g n8n-nodes-wechat-offiaccount

if [ $? -eq 0 ]; then
    echo "✅ 微信公众号n8n节点插件安装成功!"
    echo "插件功能包括:"
    echo "  - 微信公众号Access Token管理"
    echo "  - 图片上传 (支持Base64和图片链接)"
    echo "  - 永久素材管理"
    echo "  - 草稿创建和发布"
    echo "请重启n8n服务以加载新插件"
else
    echo "❌ 插件安装失败"
    exit 1
fi