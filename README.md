# InvesthreeAI

A modern AI-powered investment assistant web application, built with React, TypeScript, AWS, and TailwindCSS.



---

# Example Output:
## Features

### Onboarding & Personalization
- **First-Time User Survey**: New users complete a personalized survey to tailor investment advice and recommendations.
- **Dynamic User Experience**: The app adapts content and suggestions based on user profile and survey results.

### AI-Powered Investment Tools
- **AI Investment Advice**: Receive AI-generated investment analysis, news summaries, and actionable insights.
- **AI Chatbot**: Ask investment-related questions and get instant, context-aware AI responses.
- **Price Prediction**: Get AI-driven predictions for individual stocks, ETFs, and cryptocurrencies, including short-term and long-term outlooks.
- **AI Stock Picker**: Discover stock ideas and recommendations powered by advanced AI models.

### Portfolio & Watchlist
- **Portfolio Management**: Add, edit, and track your investments, including stocks, ETFs, and cryptocurrencies.
- **Watchlist**: Monitor favorite assets, with real-time price updates and performance tracking.
- **Performance Analytics**: Visualize portfolio growth, profit/loss, and compare with market benchmarks.

### Market Data & Research
- **Real-Time Market Data**: Access up-to-date information on stocks, ETFs, crypto, commodities, and forex.
- **Company & Market Insights**: Deep-dive into company profiles, insider trading, ETF holdings, and market performance.
- **News & Sentiment**: Stay informed with breaking news and AI-powered sentiment analysis.

### Social & Gamification
- **User Rankings**: See top-performing users and compare your investment performance.
- **Community Features**: (Planned) Share insights, strategies, and compete on leaderboards.


---

## Project Structure

```
src/
  ai/                    # AI logic, chat, and report components
    components/          # AI-related UI components
    services/            # AI service logic (OpenAI, LangChain, etc.)
  components/            # Reusable UI components (Navbar, Modals, Search, etc.)
  contexts/              # React Contexts (Auth, global state, etc.)
  pages/                 # Main application pages (Home, Survey, Login, Dashboard, etc.)
  services/              # API and AWS service logic (auth, user, survey, market data)
  store/                 # Zustand state management (portfolio, watchlist, etc.)
  config/                # Configuration files (AWS, API keys, etc.)
  stock/                 # Stock-specific logic and utilities
  App.tsx                # Main app component and route definitions
  main.tsx               # Application entry point
  index.css              # Global styles (TailwindCSS)
```

### Notable Files & Folders

- `src/pages/Home.tsx` — Main dashboard after login
- `src/pages/Survey.tsx` — User onboarding survey
- `src/pages/Login.tsx` & `src/pages/ConfirmSignup.tsx` — Authentication pages
- `src/pages/Portfolio.tsx`, `src/pages/AddInvestment.tsx` — Portfolio management
- `src/pages/Ranking.tsx` — User rankings
- `src/pages/AskAI.tsx`, `src/pages/AIReportPage.tsx` — AI chatbot and report
- `src/components/Navbar.tsx` — Top navigation bar
- `src/services/` — All backend and AWS service logic

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Zustand, React Router, TailwindCSS, Chart.js, Recharts, MUI
- **Backend/Cloud**: AWS Cognito, DynamoDB (via AWS SDK)
- **AI**: OpenAI, LangChain, Google GenAI
- **Build Tools**: Vite, ESLint, PostCSS

---

# Input
## Getting Started

1. **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/InvesthreeAI.git
    cd InvesthreeAI
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Configure environment**
    ```bash
    cp example.env .env
    ```
    Follow the instructions to request access to the key:
   👉 [Request Access via Google Doc](https://docs.google.com/document/d/1Am2464__TcCagisOEWl6KscyesZszOzOqspMmRVvg-g/edit?usp=sharing)

4. **Run the app**
    ```bash
    npm run dev
    ```
    App will be available at [http://localhost:5173](http://localhost:5173)

5. **Run the test**
    ```bash
    npx jest
    ```


---

## Customization

- Modify `src/components/Navbar.tsx` to change navigation.
- Update survey questions in `src/pages/Survey.tsx`.
- Add new features or pages in `src/pages/`.

---

## License

MIT 

## 🔐 API Key Access

To use GPT-based features, you need an API key.

We **do not expose our key publicly**. If you want to run this project locally:

1. Open `.env.example`
2. Follow the instructions to request access to the key:
   👉 [Request Access via Google Doc](https://docs.google.com/document/d/1Am2464__TcCagisOEWl6KscyesZszOzOqspMmRVvg-g/edit?usp=sharing)

After approval, put the key in a new `.env` file like this:

```env
# Financial Data API Key (Financial Modeling Prep)
VITE_FMP_API_KEY=<YOUR_FMP_API_KEY>
VITE_NEWS_API_KEY=<YOUR_NEWS_API_KEY>

# DynamoDB Table Names
VITE_DYNAMODB_TABLE_NAME=Investments
VITE_DYNAMODB_WATCHLIST_TABLE_NAME=Watchlist

# AWS Region and Credentials
VITE_AWS_REGION=us-east-2
VITE_AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
VITE_AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>

# Cognito Configuration
VITE_COGNITO_USER_POOL_ID=<YOUR_COGNITO_USER_POOL_ID>
VITE_COGNITO_WEB_CLIENT_ID=<YOUR_COGNITO_WEB_CLIENT_ID>
VITE_COGNITO_IDENTITY_POOL_ID=<YOUR_COGNITO_IDENTITY_POOL_ID>

# OpenAI API Key
VITE_OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

## View Parts of Page
![image](https://github.com/user-attachments/assets/6eab60bf-a859-4cdf-8e41-e984d05cad53)
![image](https://github.com/user-attachments/assets/c031eb88-fcc5-42b0-9d18-7fd0292ea431)
![image](https://github.com/user-attachments/assets/57e87fb3-b5bf-40c8-9e4f-513be2900269)
![image](https://github.com/user-attachments/assets/f68433f7-377e-46d3-9128-30ce69268484)
![image](https://github.com/user-attachments/assets/5be76a97-eb43-4632-9644-a77509a41d36)
![image](https://github.com/user-attachments/assets/79175595-1bd2-4139-be28-ad8de22766d9)
![image](https://github.com/user-attachments/assets/9225bec2-ce72-423f-b881-8cebdd5b4bd1)
![image](https://github.com/user-attachments/assets/ea1efbc0-0805-4912-bf0c-90ea720daca3)
![image](https://github.com/user-attachments/assets/c315468f-19cc-46a9-ab2c-7fa7658aacd6)
![image](https://github.com/user-attachments/assets/76ef6c07-b05e-4478-a7e4-5a99e279a58a)
