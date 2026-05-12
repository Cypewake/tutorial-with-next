@echo off
chcp 65001 >nul
echo ========================================
echo 学习通助手 - Deno Deploy 代理一键部署
echo ========================================
echo.

cd /d "%~dp0"

echo [步骤 1/4] 检查 Deno 是否已安装...
deno --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] Deno 未安装，正在安装...
    echo.
    echo 请在新打开的 PowerShell 窗口中完成 Deno 安装
    echo 安装完成后，关闭 PowerShell 窗口，然后重新运行此脚本
    echo.
    powershell -Command "irm https://deno.land/install.ps1 | iex"
    pause
    exit /b 0
)
echo [成功] Deno 已安装
deno --version
echo.

echo [步骤 2/4] 检查 deployctl 是否已安装...
where deployctl >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] deployctl 未安装，正在安装...
    deno install -gArf jsr:@deno/deployctl
    if %errorlevel% neq 0 (
        echo [错误] deployctl 安装失败！
        pause
        exit /b 1
    )
    echo [成功] deployctl 已安装
) else (
    echo [成功] deployctl 已安装
)
echo.

echo [步骤 3/4] 检查 .env 文件...
if not exist ".env" (
    echo [错误] .env 文件不存在！
    echo 请先创建 .env 文件并填入 Supabase 配置
    pause
    exit /b 1
)
echo [成功] .env 文件已存在
echo.

echo [步骤 4/4] 开始部署到 Deno Deploy...
echo.
echo 注意：首次部署会自动创建项目并打开浏览器进行授权
echo.
deployctl deploy --project=xuetong-proxy --env-file=.env

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo [成功] 部署完成！
    echo ========================================
    echo.
    echo 请记录上方输出的 URL（类似 https://xuetong-proxy-xxxxx.deno.dev）
    echo.
    echo 下一步：
    echo 1. 将代理 URL 配置到 scriptfor.js 的 PROXY_API_URL 变量
    echo 2. 将 API_SECRET 配置到 scriptfor.js 的 PROXY_API_SECRET 变量
    echo.
) else (
    echo.
    echo ========================================
    echo [错误] 部署失败！
    echo ========================================
    echo.
    echo 可能原因：
    echo 1. 未登录 Deno Deploy（需要浏览器授权）
    echo 2. .env 文件中的配置不正确
    echo 3. 网络连接问题
    echo.
)

pause
