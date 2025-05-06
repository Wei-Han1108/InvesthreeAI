import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = import.meta.env.VITE_DYNAMODB_TABLE_NAME

interface PortfolioItem {
  userId: string
  symbol: string
  name: string
  shares: number
  averagePrice: number
  timestamp: number
}

export const portfolioService = {
  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })

      const response = await docClient.send(command)
      return response.Items as PortfolioItem[]
    } catch (error) {
      console.error('Error getting portfolio:', error)
      throw error
    }
  },

  async addItem(item: PortfolioItem): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...item,
          timestamp: Date.now()
        }
      })

      await docClient.send(command)
    } catch (error) {
      console.error('Error adding portfolio item:', error)
      throw error
    }
  },

  async removeItem(userId: string, symbol: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          symbol
        }
      })

      await docClient.send(command)
    } catch (error) {
      console.error('Error removing portfolio item:', error)
      throw error
    }
  },

  async updateItem(item: PortfolioItem): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...item,
          timestamp: Date.now()
        }
      })

      await docClient.send(command)
    } catch (error) {
      console.error('Error updating portfolio item:', error)
      throw error
    }
  }
} 