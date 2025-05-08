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

  // 检查 token 是否过期
  const payload = JSON.parse(atob(idToken.split('.')[1]))
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    // token 已过期，清理并跳转登录
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
    // 获取当前用户的邮箱
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
    if (sellQuantity > investment.quantity) throw new Error('Sell quantity exceeds holding quantity')
    const profitLoss = (sellPrice - investment.purchasePrice) * sellQuantity
    const updateParams = {
      TableName: 'Investments',
      Key: {
        userId,
        investmentId,
      },
      UpdateExpression: 'SET sellQuantity = :sq, sellPrice = :sp, sellDate = :sd, profitLoss = :pl, quantity = quantity - :sq',
      ExpressionAttributeValues: {
        ':sq': sellQuantity,
        ':sp': sellPrice,
        ':sd': sellDate,
        ':pl': profitLoss,
      },
    }
    await docClient.send(new UpdateCommand(updateParams))
    return true
  },
} 