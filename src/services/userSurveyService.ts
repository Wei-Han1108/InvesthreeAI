import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { awsConfig } from '../config/aws'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'

const getClient = () => {
  const idToken = localStorage.getItem('idToken')
  if (!idToken) throw new Error('ID token not found. Please log in again.')
  const cognitoIdentityClient = new CognitoIdentityClient({ region: awsConfig.region })
  const credentials = fromCognitoIdentityPool({
    client: cognitoIdentityClient,
    identityPoolId: awsConfig.identityPoolId,
    logins: {
      [`cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`]: idToken,
    },
  })
  const client = new DynamoDBClient({ region: awsConfig.region, credentials })
  return DynamoDBDocumentClient.from(client)
}

export const userSurveyService = {
  async getUserSurvey(userId: string) {
    const docClient = getClient()
    const params = {
      TableName: 'user_surveys',
      Key: { userId },
    }
    const result = await docClient.send(new GetCommand(params))
    return result.Item
  },
  async submitUserSurvey(data: any) {
    const docClient = getClient()
    const params = {
      TableName: 'user_surveys',
      Item: data,
    }
    await docClient.send(new PutCommand(params))
    return params.Item
  },
} 