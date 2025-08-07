# MCP Server THSRC - 台灣高鐵資訊查詢服務

這是一個基於 Model Context Protocol (MCP) 的台灣高鐵資料查詢服務器，提供即時的高鐵時刻表、車站資訊、班次狀態和座位查詢功能。

## 功能特色

- 🚄 **完整的高鐵資料查詢**：時刻表、即時班次、座位狀態
- 🌐 **多語言支援**：支援中文站名、英文站名及ID查詢
- 🔄 **即時資料**：整合 TDX (運輸資料流通服務) API
- 📱 **MCP 標準**：相容所有支援 MCP 的應用程式

## 安裝方式

### 方法 1：使用 pipx（推薦）

```bash
# 安裝 pipx（如果還沒有）
python -m pip install --user pipx
python -m pipx ensurepath

# 安裝 MCP 服務器
pipx install git+https://github.com/yourusername/mcp-server-thsrc.git
```

### 方法 2：直接使用 pip

```bash
pip install git+https://github.com/yourusername/mcp-server-thsrc.git
```

### 方法 3：手動安裝

```bash
git clone https://github.com/yourusername/mcp-server-thsrc.git
cd mcp-server-thsrc
pip install -e .
```

## 環境設定

1. 註冊 TDX 帳號：前往 [TDX運輸資料流通服務平臺](https://tdx.transportdata.tw/)
2. 取得 API 金鑰（Client ID 和 Client Secret）

## 啟動服務

```bash
python thsrc.py
```

## 快速開始

### 方法 1：使用 pipx（推薦）

```bash
# 安裝 pipx（如果還沒有）
python -m pip install --user pipx
python -m pipx ensurepath

# 從 GitHub 安裝
pipx install git+https://github.com/physictim/thsrc_mcp.git
```

### 方法 2：手動安裝

```bash
# 複製專案
git clone https://github.com/physictim/thsrc_mcp.git
cd thsrc_mcp

# 建立虛擬環境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt
```

## 整合到 Claude Desktop

### 1. 取得 TDX API 金鑰

前往 [TDX運輸資料流通服務平臺](https://tdx.transportdata.tw/) 註冊並取得：
- Client ID
- Client Secret

### 2. 配置 Claude Desktop

找到 Claude Desktop 的設定檔：

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 3. 編輯設定檔

在 `claude_desktop_config.json` 中加入以下設定：

#### 如果你使用 pipx 安裝：
```json
{
  "mcpServers": {
    "thsrc-mcp": {
      "command": "mcp-server-thsrc",
      "env": {
        "TDX_CLIENT_ID": "在這裡貼上你的 Client ID",
        "TDX_CLIENT_SECRET": "在這裡貼上你的 Client Secret"
      }
    }
  }
}
```

#### 如果你手動安裝：
```json
{
  "mcpServers": {
    "thsrc-mcp": {
      "command": "/path/to/your/python3",
      "args": ["/path/to/your/thsrc.py"],
      "env": {
        "TDX_CLIENT_ID": "在這裡貼上你的 Client ID",
        "TDX_CLIENT_SECRET": "在這裡貼上你的 Client Secret"
      }
    }
  }
}
```

### 4. 重啟 Claude Desktop

重新啟動 Claude Desktop，MCP 服務器將會自動載入。

### 5. 驗證連線

在 Claude Desktop 中輸入：
```
請幫我查詢台灣高鐵車站列表
```

如果設定成功，Claude 將會使用 MCP 工具查詢並返回高鐵車站資訊。

### 使用範例

設定完成後，您可以在 Claude Desktop 中直接使用自然語言查詢：

- "查詢明天台北到左營的高鐵班次"
- "台中車站現在有哪些班次？"
- "823車次明天的詳細資訊"
- "台北到高雄還有座位嗎？"

Claude 會自動調用相應的 MCP 工具來取得即時資料。

## 可用工具

### 1. 車站列表查詢
```python
get_thsr_stations()
```
取得所有台灣高鐵車站資訊。

### 2. 時刻表查詢
```python
get_thsr_timetable("台北", "左營", "2024-01-01")
```
查詢指定路線和日期的班次時刻表。

**參數說明：**
- `origin_station`: 起站（支援中文站名如"台北"或站點ID如"1000"）
- `destination_station`: 迄站（支援中文站名如"左營"或站點ID如"1070"）
- `travel_date`: 乘車日期（YYYY-MM-DD格式）

### 3. 即時班次查詢
```python
get_thsr_live_schedule("台北")
```
取得指定車站的即時班次狀態。

**參數說明：**
- `station`: 車站名稱或ID

### 4. 特定班次資訊
```python
get_thsr_train_info("823", "2024-01-01")
```
查詢特定車次的詳細資訊。

**參數說明：**
- `train_no`: 車次號碼
- `travel_date`: 乘車日期（YYYY-MM-DD格式）

### 5. 剩餘座位查詢
```python
get_thsr_available_seats("台北", "左營", "2024-01-01")
```
查詢指定路線的剩餘座位狀態。

**參數說明：**
- `origin_station`: 起站
- `destination_station`: 迄站  
- `travel_date`: 乘車日期

**更新頻率：**
- 當日查詢：每10分鐘更新
- 其他日期：每日10:00、16:00、22:00更新

## 支援車站

| 中文站名 | 英文站名 | 站點ID |
|---------|---------|--------|
| 南港 | Nangang | 0990 |
| 台北 | Taipei | 1000 |
| 板橋 | Banqiao | 1010 |
| 桃園 | Taoyuan | 1020 |
| 新竹 | Hsinchu | 1030 |
| 苗栗 | Miaoli | 1035 |
| 台中 | Taichung | 1040 |
| 彰化 | Changhua | 1043 |
| 雲林 | Yunlin | 1047 |
| 嘉義 | Chiayi | 1050 |
| 台南 | Tainan | 1060 |
| 左營 | Zuoying | 1070 |

## 資源

### thsr://stations
提供車站資訊的 MCP 資源，可在支援 MCP 的應用程式中直接存取。

## 使用範例

### 查詢台北到左營的班次
```python
# 使用中文站名
result = await get_thsr_timetable("台北", "左營", "2024-01-01")

# 使用英文站名
result = await get_thsr_timetable("Taipei", "Zuoying", "2024-01-01")

# 使用站點ID
result = await get_thsr_timetable("1000", "1070", "2024-01-01")
```

### 查詢台北車站即時班次
```python
result = await get_thsr_live_schedule("台北")
```

### 查詢座位狀態
```python
result = await get_thsr_available_seats("台北", "左營", "2024-01-01")
```

## 注意事項

1. **API 限制**：請遵守 TDX API 的使用限制
2. **認證**：確保正確設定 TDX API 金鑰
3. **日期格式**：日期必須使用 YYYY-MM-DD 格式
4. **站名輸入**：支援中英文站名，大小寫敏感

## 錯誤處理

- 無效站名：會拋出 `ValueError` 錯誤
- API 認證失敗：請檢查環境變數設定
- 網路連線問題：請確認網路連線狀態

## 授權

本專案使用 MIT 授權條款。

## 相關連結

- [TDX運輸資料流通服務平臺](https://tdx.transportdata.tw/)
- [台灣高鐵官網](https://www.thsrc.com.tw/)
- [Model Context Protocol](https://modelcontextprotocol.io/)