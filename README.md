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

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系我们：
- 提交 Issue
- 发送邮件至：your.email@example.com 

## 问题
1. FMP 限流，本地保存数据1h更新一次 ***
2. 添加股票时如果限流，需要错误处理 ***
3. 新闻默认APPL
4. Ask AI 搜索栏位置太靠下
5. 深色主题
6. 雷达图各个股票分布区别不大，最好有总评分