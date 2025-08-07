#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 檢查 Python 是否安裝
function checkPython() {
  const pythonCommands = ['python3', 'python'];
  
  for (const cmd of pythonCommands) {
    try {
      const result = require('child_process').execSync(`${cmd} --version`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      if (result.includes('Python')) {
        return cmd;
      }
    } catch (e) {
      // 繼續嘗試下一個
    }
  }
  
  console.error('錯誤：找不到 Python。請先安裝 Python 3.8 或更新版本。');
  process.exit(1);
}

// 安裝 Python 依賴
function installDependencies(pythonCmd) {
  const requirementsPath = path.join(__dirname, 'requirements.txt');
  
  // 檢查是否已安裝依賴
  try {
    require('child_process').execSync(`${pythonCmd} -c "import httpx, fastmcp"`, {
      stdio: 'pipe'
    });
    return; // 依賴已安裝
  } catch (e) {
    // 需要安裝依賴
  }
  
  console.log('首次執行，正在安裝 Python 依賴...');
  
  try {
    require('child_process').execSync(
      `${pythonCmd} -m pip install -r "${requirementsPath}"`,
      { stdio: 'inherit' }
    );
    console.log('依賴安裝完成！');
  } catch (e) {
    console.error('安裝依賴失敗。請手動執行：');
    console.error(`${pythonCmd} -m pip install httpx fastmcp python-dotenv`);
    process.exit(1);
  }
}

// 主函數
function main() {
  const pythonCmd = checkPython();
  const scriptPath = path.join(__dirname, 'thsrc.py');
  
  // 首次執行時安裝依賴
  installDependencies(pythonCmd);
  
  // 執行 Python 腳本
  const child = spawn(pythonCmd, [scriptPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('error', (err) => {
    console.error('執行錯誤:', err);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
  
  // 處理中斷信號
  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

if (require.main === module) {
  main();
}