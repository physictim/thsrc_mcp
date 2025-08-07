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
  // 針對不同作業系統的 Python 路徑和檢測策略
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows 特殊處理：優先使用 py launcher
    const pyLaunchers = [
      'py -3',      // 使用最新 Python 3
      'py -3.12',   // 具體版本
      'py -3.11',
      'py -3.10',
      'py -3.9',
      'py -3.8',
      'py',         // 默認版本
      'python',     // 直接命令
      'python3'
    ];
    
    for (const pyCmd of pyLaunchers) {
      try {
        const result = require('child_process').execSync(`${pyCmd} --version`, { 
          encoding: 'utf8',
          stdio: 'pipe',
          shell: true
        });
        
        if (result.includes('Python 3.')) {
          const version = result.match(/Python (\d+\.\d+)/);
          if (version && parseFloat(version[1]) >= 3.8) {
            return pyCmd;
          }
        }
      } catch (e) {
        // 繼續嘗試下一個
      }
    }
    
    // 如果 py launcher 失敗，嘗試直接路徑
    const directPaths = [
      'C:\\Python3\\python.exe',
      'C:\\Python313\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python39\\python.exe'
    ];
    
    // 也嘗試用戶目錄
    const username = os.userInfo().username;
    const userPaths = [
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Python\\Python313\\python.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Python\\Python312\\python.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Python\\Python311\\python.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Python\\Python310\\python.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Python\\Python39\\python.exe`
    ];
    
    for (const pythonPath of [...directPaths, ...userPaths]) {
      try {
        const result = require('child_process').execSync(`"${pythonPath}" --version`, { 
          encoding: 'utf8',
          stdio: 'pipe',
          shell: true
        });
        
        if (result.includes('Python 3.')) {
          const version = result.match(/Python (\d+\.\d+)/);
          if (version && parseFloat(version[1]) >= 3.8) {
            return `"${pythonPath}"`;
          }
        }
      } catch (e) {
        // 繼續嘗試下一個
      }
    }
  } else {
    // macOS/Linux 的檢測邏輯
    const pythonPaths = [
      'python3', 'python',
      '/usr/local/bin/python3', '/usr/local/bin/python',
      '/usr/bin/python3', '/usr/bin/python',
      '/opt/homebrew/bin/python3', '/opt/homebrew/bin/python'
    ];
    
    for (const pythonCmd of pythonPaths) {
      try {
        const result = require('child_process').execSync(`${pythonCmd} --version`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (result.includes('Python 3.')) {
          const version = result.match(/Python (\d+\.\d+)/);
          if (version && parseFloat(version[1]) >= 3.8) {
            return pythonCmd;
          }
        }
      } catch (e) {
        // 繼續嘗試下一個
      }
    }
  }
  
  console.error('❌ 錯誤：找不到 Python 3.8+ 版本');
  console.error('   請安裝 Python 3.8 或更新版本：');
  console.error('   - macOS: brew install python3');
  console.error('   - Ubuntu: sudo apt install python3 python3-pip');  
  console.error('   - Windows: 從 https://python.org 下載安裝');
  console.error('             或使用 Microsoft Store 安裝 Python');
  console.error('');
  console.error('   已嘗試的路徑：');
  pythonPaths.forEach(path => console.error(`   - ${path}`));
  process.exit(1);
}

// 安裝 Python 依賴
function installDependencies(pythonCmd) {
  const requirementsPath = path.join(__dirname, 'requirements.txt');
  
  log('🔍 檢查 Python 依賴...');
  
  // 檢查是否已安裝依賴
  try {
    require('child_process').execSync(
      `${pythonCmd} -c "import httpx, fastmcp, dotenv"`, 
      { stdio: 'pipe' }
    );
    log('✅ Python 依賴已安裝');
    return; // 依賴已安裝
  } catch (e) {
    // 需要安裝依賴
  }
  
  log('📦 首次執行，正在安裝 Python 依賴...');
  log('   這可能需要幾分鐘時間...');
  
  try {
    // 在 MCP 模式下使用安靜模式安裝，避免輸出干擾
    const quietFlag = isMCPMode() ? '--quiet' : '';
    const stdio = isMCPMode() ? 'pipe' : 'inherit';
    const isWindows = os.platform() === 'win32';
    
    // Windows 和 Unix 有不同的 pip 安裝策略
    const installStrategies = isWindows ? [
      // Windows 策略
      `${pythonCmd} -m pip install ${quietFlag} -r "${requirementsPath}"`,  // 不使用 --user，避免權限問題
      `${pythonCmd} -m pip install --user ${quietFlag} -r "${requirementsPath}"`,  // 回退到 --user
      `py -m pip install ${quietFlag} -r "${requirementsPath}"`,  // 使用 py launcher
      `py -m pip install --user ${quietFlag} -r "${requirementsPath}"`
    ] : [
      // Unix 策略
      `${pythonCmd} -m pip install --user ${quietFlag} -r "${requirementsPath}"`,  // 正常安裝
      `${pythonCmd} -m pip install --user --break-system-packages ${quietFlag} -r "${requirementsPath}"`  // Python 3.12+ 回退
    ];
    
    let installSuccess = false;
    let lastError = null;
    
    for (const strategy of installStrategies) {
      try {
        require('child_process').execSync(strategy, { 
          stdio,
          shell: isWindows  // Windows 需要 shell
        });
        installSuccess = true;
        break;
      } catch (err) {
        lastError = err;
        // 繼續嘗試下一個策略
      }
    }
    
    if (!installSuccess) {
      throw lastError;
    }
    
    log('✅ 依賴安裝完成！');
  } catch (e) {
    const isWindows = os.platform() === 'win32';
    console.error('❌ 安裝依賴失敗');
    
    if (isWindows) {
      console.error('   Windows 用戶建議：');
      console.error('   1. 確保以管理員身份運行 Command Prompt 或 PowerShell');
      console.error('   2. 或使用以下命令手動安裝：');
      console.error('      py -m pip install httpx fastmcp python-dotenv');
      console.error('   3. 或從 Microsoft Store 安裝 Python 並重試');
    } else {
      console.error('   建議使用 pipx 安裝（推薦）：');
      console.error('   pipx install git+https://github.com/physictim/thsrc_mcp.git');
      console.error('');
      console.error('   或手動執行：');
      console.error(`   ${pythonCmd} -m pip install --user --break-system-packages httpx fastmcp python-dotenv`);
    }
    console.error('');
    console.error('   或使用 pipx 安裝：');
    console.error('   pipx install git+https://github.com/physictim/thsrc_mcp.git');
    process.exit(1);
  }
}

// 檢測是否在 MCP 環境中運行
function isMCPMode() {
  // 如果 stdout 是 pipe，通常表示在 MCP 環境中
  return !process.stdout.isTTY;
}

// 安全的日誌輸出（只在非 MCP 模式下輸出）
function log(message) {
  if (!isMCPMode()) {
    console.log(message);
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
  
  log('🚄 啟動 MCP Server THSRC...');
  
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
  
  log('🔌 連接 MCP 協議...');
  
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
    log('\n👋 正在關閉 MCP Server THSRC...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    log('\n👋 正在關閉 MCP Server THSRC...');
    child.kill('SIGTERM');
  });
}

if (require.main === module) {
  main();
}