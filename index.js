#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 顯示幫助信息
function showHelp() {
  console.log(`
MCP Server THSRC - 台灣高鐵資訊查詢服務
使用方式：
  npx @physictim/mcp-server-thsrc

環境變數：
  TDX_CLIENT_ID      - TDX API Client ID (必要)
  TDX_CLIENT_SECRET  - TDX API Client Secret (必要)

範例 Claude Desktop 配置：
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

更多資訊：https://github.com/physictim/thsrc_mcp
`);
}

// 檢查環境變數
function checkEnvironment() {
  if (!process.env.TDX_CLIENT_ID || !process.env.TDX_CLIENT_SECRET) {
    console.error('❌ 錯誤：缺少必要的環境變數');
    console.error('   請設定 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET');
    console.error('   前往 https://tdx.transportdata.tw/ 註冊並取得 API 金鑰');
    console.error('');
    showHelp();
    process.exit(1);
  }
}

// 檢查 Python 是否安裝
function checkPython() {
  const pythonCommands = ['python3', 'python'];
  
  for (const cmd of pythonCommands) {
    try {
      const result = require('child_process').execSync(`${cmd} --version`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      if (result.includes('Python 3.')) {
        const version = result.match(/Python (\d+\.\d+)/);
        if (version && parseFloat(version[1]) >= 3.8) {
          return cmd;
        }
      }
    } catch (e) {
      // 繼續嘗試下一個
    }
  }
  
  console.error('❌ 錯誤：找不到 Python 3.8+ 版本');
  console.error('   請安裝 Python 3.8 或更新版本：');
  console.error('   - macOS: brew install python3');
  console.error('   - Ubuntu: sudo apt install python3 python3-pip');  
  console.error('   - Windows: 從 https://python.org 下載安裝');
  process.exit(1);
}

// 安裝 Python 依賴
function installDependencies(pythonCmd) {
  const requirementsPath = path.join(__dirname, 'requirements.txt');
  
  console.log('🔍 檢查 Python 依賴...');
  
  // 檢查是否已安裝依賴
  try {
    require('child_process').execSync(
      `${pythonCmd} -c "import httpx, fastmcp, dotenv"`, 
      { stdio: 'pipe' }
    );
    console.log('✅ Python 依賴已安裝');
    return; // 依賴已安裝
  } catch (e) {
    // 需要安裝依賴
  }
  
  console.log('📦 首次執行，正在安裝 Python 依賴...');
  console.log('   這可能需要幾分鐘時間...');
  
  try {
    require('child_process').execSync(
      `${pythonCmd} -m pip install --user -r "${requirementsPath}"`,
      { stdio: 'inherit' }
    );
    console.log('✅ 依賴安裝完成！');
  } catch (e) {
    console.error('❌ 安裝依賴失敗');
    console.error('   請手動執行以下命令：');
    console.error(`   ${pythonCmd} -m pip install --user httpx fastmcp python-dotenv`);
    console.error('');
    console.error('   或使用 pipx 安裝：');
    console.error('   pipx install git+https://github.com/physictim/thsrc_mcp.git');
    process.exit(1);
  }
}

// 主函數
function main() {
  // 處理命令行參數
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  console.log('🚄 啟動 MCP Server THSRC...');
  
  // 檢查環境
  checkEnvironment();
  const pythonCmd = checkPython();
  const scriptPath = path.join(__dirname, 'thsrc.py');
  
  // 檢查腳本文件是否存在
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ 錯誤：找不到 thsrc.py 文件');
    console.error('   套件可能安裝不完整，請重新安裝：');
    console.error('   npm uninstall -g @physictim/mcp-server-thsrc');
    console.error('   npx @physictim/mcp-server-thsrc');
    process.exit(1);
  }
  
  // 首次執行時安裝依賴
  installDependencies(pythonCmd);
  
  console.log('🔌 連接 MCP 協議...');
  
  // 執行 Python 腳本
  const child = spawn(pythonCmd, [scriptPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('error', (err) => {
    console.error('❌ 執行錯誤:', err.message);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ 程序異常退出，代碼: ${code}`);
    }
    process.exit(code);
  });
  
  // 處理中斷信號
  process.on('SIGINT', () => {
    console.log('\n👋 正在關閉 MCP Server THSRC...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n👋 正在關閉 MCP Server THSRC...');
    child.kill('SIGTERM');
  });
}

if (require.main === module) {
  main();
}