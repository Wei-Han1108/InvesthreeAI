# InvesthreeAI - 智能投资助手

一个基于人工智能的投资分析平台，帮助投资者做出更明智的投资决策。

## 主要功能

- 🤖 AI 智能分析：基于 GPT 模型的投资分析和建议
- 📊 投资组合管理：实时跟踪和管理您的投资组合
- 👀 观察列表：关注感兴趣的股票
- 📈 市场分析：获取市场趋势和投资机会
- 💡 个性化建议：根据您的投资组合提供定制化建议

## 技术栈

- React + TypeScript
- Tailwind CSS
- OpenAI GPT API
- Zustand 状态管理
- Vite 构建工具


## 开始使用

1. 克隆项目
```bash
git clone https://github.com/yourusername/InvesthreeAI.git
```

2. 安装依赖
```bash
cd InvesthreeAI
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，添加必要的 API 密钥

## 环境变量（.env）


```env
# 金融数据 API Key（Financial Modeling Prep）
VITE_FMP_API_KEY=<YOUR_FMP_API_KEY>

# DynamoDB 表名
VITE_DYNAMODB_TABLE_NAME=Investments
VITE_DYNAMODB_WATCHLIST_TABLE_NAME=Watchlist

# AWS 区域及凭证
VITE_AWS_REGION=us-east-2
VITE_AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
VITE_AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>

# Cognito 配置
VITE_COGNITO_USER_POOL_ID=<YOUR_COGNITO_USER_POOL_ID>
VITE_COGNITO_WEB_CLIENT_ID=<YOUR_COGNITO_WEB_CLIENT_ID>
VITE_COGNITO_IDENTITY_POOL_ID=<YOUR_COGNITO_IDENTITY_POOL_ID>

# OpenAI API Key
VITE_OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>


4. 启动开发服务器
```bash
npm run dev
```

## 项目结构

```
src/
├── ai/              # AI 相关组件和服务
├── components/      # 通用组件
├── pages/          # 页面组件
├── store/          # 状态管理
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```
![image](https://github.com/user-attachments/assets/24bf9e5f-bd1c-459e-8251-8517b7b5688f)
![image](https://github.com/user-attachments/assets/90834917-e783-4f32-8d83-9c7446d5fdb7)
![image](https://github.com/user-attachments/assets/0cf36cf6-8d7b-4760-8f0d-43c1786e8df8)
![image](https://github.com/user-attachments/assets/1ae16cf3-8019-4dfb-807e-937385ade6f6)
![image](https://github.com/user-attachments/assets/a3063f3e-ef39-4628-aa5b-2b168acc93ca)

## 问题
1. FMP 限流，本地保存数据1h更新一次 ***
2. 添加股票时如果限流，需要错误处理 ***
3. 新闻默认APPL
4. Ask AI 搜索栏位置太靠下
5. 深色主题
6. 雷达图各个股票分布区别不大，最好有总评分


## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

[MIT License](LICENSE) 