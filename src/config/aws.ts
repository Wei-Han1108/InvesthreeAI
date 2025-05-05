export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  userPoolId: 'us-east-2_PzYPoPmoi', // 更新为用户池 ID
  userPoolWebClientId: '6u9u15dr5a7qukho64dics4mhc', // 需要替换为应用客户端 ID
  identityPoolId: 'us-east-2:6c0eb3bb-b306-4bee-8841-2ea0a21dfad3', // 更新为身份池 ID
  dynamoDB: {
    tableName: import.meta.env.VITE_DYNAMODB_TABLE_NAME || 'StockInvestments',
    watchlistTableName: import.meta.env.VITE_DYNAMODB_WATCHLIST_TABLE_NAME || 'Watchlist',
  },
} 