# thsrc_mcp_server.py
import asyncio
import httpx
import os
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
from mcp.server.session import ServerSession
from mcp.types import Resource, Tool
from typing import Optional, Dict, Any

class THSRAPIClient:
    """台灣高鐵API客戶端"""
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expires = None
        self.base_url = "https://tdx.transportdata.tw/api/basic/v2"
        
    async def get_access_token(self) -> str:
        """取得或更新Access Token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token",
                headers={"content-type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            
        token_data = response.json()
        self.access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3600)
        self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
        
        return self.access_token
    
    async def api_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """通用API請求方法"""
        token = await self.get_access_token()
        headers = {
            "authorization": f"Bearer {token}",
            "Accept-Encoding": "gzip"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/{endpoint}",
                headers=headers,
                params=params or {}
            )
            return response.json()

# 初始化MCP服務器
mcp_server = FastMCP("THSRC-MCP")

# 載入環境變數
from dotenv import load_dotenv
load_dotenv()

# 初始化高鐵API客戶端
thsr_client = THSRAPIClient(
    client_id=os.getenv("TDX_CLIENT_ID"),
    client_secret=os.getenv("TDX_CLIENT_SECRET")
)

@mcp_server.tool()
async def get_thsr_stations() -> Dict[str, Any]:
    """取得台灣高鐵車站列表"""
    return await thsr_client.api_request("Rail/THSR/Station")

@mcp_server.tool()
async def get_thsr_timetable(
    origin_station_id: str,
    destination_station_id: str,
    travel_date: str
) -> Dict[str, Any]:
    """
    查詢高鐵時刻表
    
    Args:
        origin_station_id: 起站代碼 (例如: 1000 台北, 1070 左營)
        destination_station_id: 迄站代碼
        travel_date: 乘車日期 (YYYY-MM-DD格式)
    """
    endpoint = f"Rail/THSR/DailyTimetable/OD/{origin_station_id}/to/{destination_station_id}/{travel_date}"
    return await thsr_client.api_request(endpoint)

@mcp_server.tool()
async def get_thsr_live_schedule(station_id: str) -> Dict[str, Any]:
    """
    取得指定車站即時時刻表
    
    Args:
        station_id: 車站代碼 (例如: 1000 台北)
    """
    endpoint = f"Rail/THSR/LiveBoard/Station/{station_id}"
    return await thsr_client.api_request(endpoint)

@mcp_server.tool()
async def get_thsr_train_info(train_no: str, travel_date: str) -> Dict[str, Any]:
    """
    查詢特定班次資訊
    
    Args:
        train_no: 車次號碼 (例如: 823)
        travel_date: 乘車日期 (YYYY-MM-DD格式)
    """
    endpoint = f"Rail/THSR/DailyTimetable/TrainNo/{train_no}/{travel_date}"
    return await thsr_client.api_request(endpoint)

@mcp_server.tool()
async def get_thsr_available_seats(
    origin_station_id: str,
    destination_station_id: str,
    train_date: str
) -> Dict[str, Any]:
    """
    查詢指定日期對應車站有座位的車班
    
    Args:
        origin_station_id: 起站代碼 (例如: 1000 台北, 1070 左營)
        destination_station_id: 迄站代碼
        train_date: 乘車日期 (YYYY-MM-DD格式)
    """
    endpoint = f"Rail/THSR/AvailableSeatStatus/Train/OD/{origin_station_id}/to/{destination_station_id}/TrainDate/{train_date}"
    return await thsr_client.api_request(endpoint)

@mcp_server.tool()
async def get_thsr_train_seat_status(
    origin_station_id: str,
    destination_station_id: str,
    train_date: str,
    train_no: str
) -> Dict[str, Any]:
    """
    查詢指定車班的座位狀況
    
    Args:
        origin_station_id: 起站代碼 (例如: 1000 台北, 1070 左營)
        destination_station_id: 迄站代碼
        train_date: 乘車日期 (YYYY-MM-DD格式)
        train_no: 車次號碼 (例如: 823)
    """
    endpoint = f"Rail/THSR/AvailableSeatStatus/Train/OD/{origin_station_id}/to/{destination_station_id}/TrainDate/{train_date}/TrainNo/{train_no}"
    return await thsr_client.api_request(endpoint)

@mcp_server.resource("thsr://stations")
async def get_stations_resource() -> Resource:
    """提供車站資訊資源"""
    stations_data = await get_thsr_stations()
    return Resource(
        uri="thsr://stations",
        name="台灣高鐵車站",
        description="台灣高鐵所有車站列表及資訊",
        mimeType="application/json",
        text=str(stations_data)
    )

def main():
    """主程式進入點"""
    mcp_server.run()

if __name__ == "__main__":
    main()