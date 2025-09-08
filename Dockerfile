# 基于官方n8n镜像构建自定义镜像，预装微信公众号插件
FROM n8nio/n8n:latest

# 设置工作目录
WORKDIR /tmp

# 切换到root用户进行安装
USER root

# 复制插件包和安装脚本
COPY n8n-nodes-wechat-offiaccount-0.1.0.tgz /tmp/
COPY install-plugin.sh /tmp/

# 安装插件
RUN chmod +x /tmp/install-plugin.sh && \
    npm install -g /tmp/n8n-nodes-wechat-offiaccount-0.1.0.tgz && \
    rm -f /tmp/n8n-nodes-wechat-offiaccount-0.1.0.tgz /tmp/install-plugin.sh

# 切换回node用户
USER node

# 设置环境变量
ENV N8N_LOG_LEVEL=info
ENV GENERIC_TIMEZONE=Asia/Shanghai

# 暴露端口
EXPOSE 5678

# 启动命令
CMD ["n8n", "start"]