import { getClient } from './awsService'
import { awsConfig } from '../config/aws'
import { PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export interface WatchlistItem {
  userId: string
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  timestamp: number
}

export const watchlistService = {
  async addItem(userId: string, item: Omit<WatchlistItem, 'userId' | 'timestamp'>) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.watchlistTableName,
      Item: {
        userId,
        ...item,
        timestamp: Date.now(),
      },
    }

    await docClient.send(new PutCommand(params))
    return params.Item
  },

  async removeItem(userId: string, symbol: string) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.watchlistTableName,
      Key: {
        userId,
        symbol,
      },
    }

    await docClient.send(new DeleteCommand(params))
  },

  async updateItem(userId: string, symbol: string, updates: Partial<WatchlistItem>) {
    const docClient = getClient()
    const updateExpression = Object.keys(updates)
      .map(key => `${key} = :${key}`)
      .join(', ')
    const expressionAttributeValues = Object.entries(updates).reduce(
      (acc, [key, value]) => ({ ...acc, [`:${key}`]: value }),
      {}
    )

    const params = {
      TableName: awsConfig.dynamoDB.watchlistTableName,
      Key: {
        userId,
        symbol,
      },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues,
    }

    await docClient.send(new UpdateCommand(params))
  },

  async getWatchlist(userId: string) {
    const docClient = getClient()
    const params = {
      TableName: awsConfig.dynamoDB.watchlistTableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }

    const result = await docClient.send(new QueryCommand(params))
    return result.Items || []
  },
} 