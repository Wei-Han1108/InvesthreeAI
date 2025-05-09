import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { awsConfig } from '../config/aws'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'

const getClient = () => {
  const idToken = localStorage.getItem('idToken')
  if (!idToken) {
    throw new Error('ID token not found. Please log in again.')
  }

  // Check if token is expired
  const payload = JSON.parse(atob(idToken.split('.')[1]))
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    // Token expired, clear and redirect to login
    localStorage.removeItem('idToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('ID token expired. Please log in again.')
  }

  const cognitoIdentityClient = new CognitoIdentityClient({
    region: awsConfig.region,
  })

  const credentials = fromCognitoIdentityPool({
    client: cognitoIdentityClient,
    identityPoolId: awsConfig.identityPoolId,
    logins: {
      [`cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`]: idToken,
    },
  })

  const client = new DynamoDBClient({ 
    region: awsConfig.region,
    credentials
  })
  
  return DynamoDBDocumentClient.from(client)
}

export const investmentService = {
  async addInvestment(userId: string, investment: any) {
    const docClient = getClient()
    // Get current user's email
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const params = {
      TableName: 'Investments',
      Item: {
        userId,
        investmentId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        ...investment,
        createdAt: new Date().toISOString(),
      },
    }

    await docClient.send(new PutCommand(params))
    return params.Item
  },

  async getUserInvestments(userId: string) {
    const docClient = getClient()
    const params = {
      TableName: 'Investments',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }

    const result = await docClient.send(new QueryCommand(params))
    return result.Items || []
  },

  async getAllUsersInvestments() {
    const docClient = getClient()
    const params = {
      TableName: 'Investments',
    }

    const result = await docClient.send(new ScanCommand(params))
    return result.Items || []
  },

  calculateUserPerformance(investments: any[]) {
    const totalInvestment = investments.reduce(
      (sum, inv) => sum + inv.purchasePrice * inv.quantity,
      0
    )
    const currentValue = investments.reduce(
      (sum, inv) => sum + inv.currentPrice * inv.quantity,
      0
    )
    const profitLoss = currentValue - totalInvestment
    const profitLossPercentage = (profitLoss / totalInvestment) * 100

    return {
      totalInvestment,
      currentValue,
      profitLoss,
      profitLossPercentage,
    }
  },

  async deleteInvestment(userId: string, investmentId: string) {
    const docClient = getClient()
    const params = {
      TableName: 'Investments',
      Key: {
        userId,
        investmentId,
      },
    }
    await docClient.send(new DeleteCommand(params))
    return true
  },

  async sellInvestment(userId: string, investmentId: string, sellQuantity: number, sellPrice: number, sellDate: string) {
    const docClient = getClient()
    
    // Get current investment record
    const params = {
      TableName: 'Investments',
      Key: {
        userId,
        investmentId,
      },
    }
    const result = await docClient.send(new GetCommand(params))
    const investment = result.Item
    if (!investment) throw new Error('Investment not found')
    
    // Get all investment records for the same stock code
    const stockParams = {
      TableName: 'Investments',
      FilterExpression: 'userId = :userId AND stockCode = :stockCode',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':stockCode': investment.stockCode,
      },
    }
    const stockResult = await docClient.send(new ScanCommand(stockParams))
    const stockInvestments = stockResult.Items || []
    
    // Calculate total buy and sell quantities
    const totalBuy = stockInvestments.reduce((sum, inv) => sum + (inv.quantity > 0 ? inv.quantity : 0), 0)
    const totalSell = stockInvestments.reduce((sum, inv) => sum + (inv.quantity < 0 ? Math.abs(inv.quantity) : 0), 0)
    const availableQuantity = totalBuy - totalSell
    
    console.log('Stock quantity check:', {
      stockCode: investment.stockCode,
      totalBuy,
      totalSell,
      availableQuantity,
      requestedSellQuantity: sellQuantity
    })
    
    if (availableQuantity <= 0) {
      throw new Error('No shares available to sell')
    }
    
    if (sellQuantity > availableQuantity) {
      throw new Error(`Sell quantity exceeds holding quantity. Available: ${availableQuantity}`)
    }
    
    const profitLoss = (sellPrice - investment.purchasePrice) * sellQuantity
    
    // Create new sell record
    const sellParams = {
      TableName: 'Investments',
      Item: {
        userId,
        investmentId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: investment.email,
        stockCode: investment.stockCode,
        stockName: investment.stockName,
        quantity: -sellQuantity, // Use negative number to represent selling
        purchasePrice: sellPrice, // Use sell price
        purchaseDate: sellDate,   // Use sell date
        currentPrice: investment.currentPrice,
        profitLoss,
        createdAt: new Date().toISOString(),
      },
    }
    
    await docClient.send(new PutCommand(sellParams))
    return true
  },
} 