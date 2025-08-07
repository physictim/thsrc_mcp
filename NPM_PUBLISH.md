# 發布到 npm 的步驟

## 1. 註冊 npm 帳號

如果還沒有 npm 帳號：
```bash
# 前往 https://www.npmjs.com/signup 註冊
# 或使用命令行註冊
npm adduser
```

## 2. 登入 npm

```bash
npm login
```

## 3. 檢查套件

```bash
# 檢查套件配置
npm run test

# 檢查要發布的檔案
npm pack --dry-run
```

## 4. 發布到 npm

```bash
# 發布套件
npm publish

# 如果是 scoped package (@physictim/...)，需要指定 public
npm publish --access public
```

## 5. 驗證發布

發布成功後，可以前往：
- https://www.npmjs.com/package/@physictim/mcp-server-thsrc

## 使用者安裝方式

發布後，使用者可以通過以下方式使用：

### 方式 1：直接使用 npx（推薦）
```bash
npx @physictim/mcp-server-thsrc --help
```

### 方式 2：全域安裝
```bash
npm install -g @physictim/mcp-server-thsrc
mcp-server-thsrc --help
```

### 方式 3：Claude Desktop 配置
```json
{
  "mcpServers": {
    "thsrc": {
      "command": "npx",
      "args": ["-y", "@physictim/mcp-server-thsrc"],
      "env": {
        "TDX_CLIENT_ID": "your_client_id",
        "TDX_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## 更新版本

當需要更新時：

```bash
# 更新版本號
npm version patch  # 小更新 (0.1.0 -> 0.1.1)
npm version minor  # 功能更新 (0.1.0 -> 0.2.0)  
npm version major  # 重大更新 (0.1.0 -> 1.0.0)

# 推送標籤到 GitHub
git push --tags

# 重新發布
npm publish
```

## 優點

✅ 使用者無需安裝 Python 環境管理  
✅ 一條命令即可使用  
✅ 自動處理依賴安裝  
✅ 跨平台相容  
✅ 與 Claude Desktop 完美整合