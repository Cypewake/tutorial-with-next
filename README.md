# Deno Deploy 代理部署指南

## 前置条件

1. 安装 Deno：`irm https://deno.land/install.ps1 | iex`（Windows）
2. 安装 deployctl：`deno install -gArf jsr:@deno/deployctl`
3. 准备 Supabase Service Role Key（从 Supabase 控制台获取）

## 部署步骤

### 1. 配置环境变量

```bash
cd dist/server-deno
copy .env.example .env
# 编辑 .env 文件，填入实际的 Supabase 配置
```

### 2. 本地测试（可选）

```bash
deno run --allow-env --allow-net main.ts
# 访问 http://localhost:8000
```

### 3. 部署到 Deno Deploy

```bash
# 首次部署（会自动创建项目）
deployctl deploy --project=xuetong-proxy --env-file=.env

# 更新部署
deployctl deploy --project=xuetong-proxy --env-file=.env
```

### 4. 获取代理 URL

部署成功后会显示类似：
```
https://xuetong-proxy-xxxxx.deno.dev
```

### 5. 更新脚本配置

将代理 URL 填入脚本的 `PROXY_API_URL` 变量。

## API 端点

| 端点 | 功能 |
|------|------|
| POST /api/activate | 激活卡密 |
| POST /api/consume | 消耗答题次数 |
| POST /api/get-remaining | 获取剩余次数 |
| POST /api/redeem-invite | 兑换邀请码 |
| POST /api/register-invite | 注册邀请码 |
| POST /api/get-invite-code | 获取设备邀请码 |

## 请求格式

```json
{
  "Authorization": "Bearer YOUR_API_SECRET"
}

Body: {
  "card_hash": "...",
  "device_fingerprint": "...",
  // 其他参数根据端点不同
}
```

## 安全特性

- API 密钥验证（Bearer Token）
- 限流保护（100 次/分钟）
- CORS 支持
- 错误日志记录
