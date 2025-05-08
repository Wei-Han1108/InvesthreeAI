import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
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

export const userService = {
  async createOrUpdateUser(userId: string, email: string) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.usersTableName,
      Item: {
        userId,
        email,
        updatedAt: new Date().toISOString(),
      },
    }

    await docClient.send(new PutCommand(params))
    return params.Item
  },

  async getUser(userId: string) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.usersTableName,
      Key: {
        userId,
      },
    }

    const result = await docClient.send(new GetCommand(params))
    return result.Item
  },

  async getAllUsers() {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.usersTableName,
    }

    const result = await docClient.send(new ScanCommand(params))
    return result.Items || []
  },

  async deposit(userId: string, amount: number) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.usersTableName,
      Key: { userId },
      UpdateExpression: 'SET balance = if_not_exists(balance, :zero) + :amount',
      ExpressionAttributeValues: {
        ':amount': amount,
        ':zero': 0
      },
      ReturnValues: 'UPDATED_NEW'
    }
    const result = await docClient.send(new (await import('@aws-sdk/lib-dynamodb')).UpdateCommand(params))
    return result.Attributes?.balance
  },
} 