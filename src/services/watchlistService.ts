import { getClient } from './awsService'
import { awsConfig } from '../config/aws'
import { PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export interface WatchlistItem {
  userId: string
  stockTicker: string
  name: string
  price: number
  change: number
  changePercent: number
  timestamp: number
}

export const watchlistService = {
  async addItem(userId: string, item: { symbol: string; name: string; price: number; change: number; changePercent: number }) {
    const docClient = getClient()
    const params = {
      TableName: 'Watchlist',
      Item: {
        userId,
        stockTicker: item.symbol,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.changePercent,
        timestamp: Date.now(),
      },
    }

    try {
      await docClient.send(new PutCommand(params))
      return params.Item
    } catch (error) {
      console.error('Error adding item to watchlist:', error)
      throw error
    }
  },

  async removeItem(userId: string, symbol: string) {
    const docClient = getClient()
    const params = {
      TableName: 'Watchlist',
      Key: {
        userId,
        stockTicker: symbol,
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
      TableName: 'Watchlist',
      Key: {
        userId,
        stockTicker: symbol,
      },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues,
    }

    await docClient.send(new UpdateCommand(params))
  },

  async getWatchlist(userId: string) {
    const docClient = getClient()
    const params = {
      TableName: 'Watchlist',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }

    const result = await docClient.send(new QueryCommand(params))
    return result.Items || []
  },
} 