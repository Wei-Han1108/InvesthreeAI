import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { awsConfig } from '../config/aws'

let docClient: DynamoDBDocumentClient | null = null

export const getClient = () => {
  if (!docClient) {
    const client = new DynamoDBClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    })

    docClient = DynamoDBDocumentClient.from(client)
  }

  return docClient
} 