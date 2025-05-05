import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { awsConfig } from '../config/aws'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'

const getClient = () => {
  const idToken = localStorage.getItem('idToken')
  if (!idToken) {
    throw new Error('ID token not found. Please log in again.')
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
    const params = {
      TableName: awsConfig.dynamoDB.tableName,
      Item: {
        userId,
        investmentId: Date.now().toString(),
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
      TableName: awsConfig.dynamoDB.tableName,
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
      TableName: awsConfig.dynamoDB.tableName,
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
} 