# 使用 Microsoft 官方維護的 Node.js 20 LTS (Iron) 開發映像檔
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# 安裝基礎工具
RUN apt-get update && apt-get install -y git vim curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /workspaces/vod-front