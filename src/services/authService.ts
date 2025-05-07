import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { awsConfig } from '../config/aws'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { userService } from './userService'

const userPool = new CognitoUserPool({
  UserPoolId: awsConfig.userPoolId,
  ClientId: awsConfig.userPoolWebClientId,
})

const configureAWSCredentials = async (idToken: string) => {
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

  return credentials
}

export const authService = {
  async signUp(username: string, email: string, password: string) {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ]

      userPool.signUp(
        username,
        password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            console.error('SignUp Error:', err)
            reject(err)
            return
          }
          console.log('SignUp Success:', result)
          resolve(result)
        }
      )
    })
  },

  async confirmSignUp(username: string, code: string) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      })

      console.log('Confirming signup for user:', username)
      console.log('Verification code:', code)
      console.log('UserPool:', userPool)

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('ConfirmSignUp Error:', err)
          reject(err)
          return
        }
        console.log('ConfirmSignUp Success:', result)
        resolve(result)
      })
    })
  },

  async resendConfirmationCode(username: string) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      })

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('ResendConfirmationCode Error:', err)
          reject(err)
          return
        }
        console.log('ResendConfirmationCode Success:', result)
        resolve(result)
      })
    })
  },

  async signIn(username: string, password: string) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      })

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (result) => {
          const idToken = result.getIdToken().getJwtToken()
          try {
            await configureAWSCredentials(idToken)
            // Store the ID token for later use
            localStorage.setItem('idToken', idToken)
            console.log('ID Token stored:', idToken)

            // 获取用户属性
            const attributes = await new Promise((resolve, reject) => {
              cognitoUser.getUserAttributes((err, result) => {
                if (err) {
                  reject(err)
                  return
                }
                resolve(result)
              })
            })

            const email = attributes?.find(attr => attr.getName() === 'email')?.getValue()
            if (email) {
              // 创建或更新用户信息
              await userService.createOrUpdateUser(cognitoUser.getUsername(), email)
              // 存储用户信息到localStorage
              localStorage.setItem('user', JSON.stringify({ email, username: cognitoUser.getUsername() }))
            }

            resolve(result)
          } catch (error) {
            console.error('Error configuring AWS credentials:', error)
            reject(error)
          }
        },
        onFailure: (err) => {
          console.error('SignIn Error:', err)
          reject(err)
        },
      })
    })
  },

  async signOut() {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
      localStorage.removeItem('idToken')
    }
  },

  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()
      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err) {
          console.error('GetCurrentUser Error:', err)
          reject(err)
          return
        }
        console.log('GetCurrentUser Success:', session)
        // 确保存储最新的idToken
        if (session && session.getIdToken()) {
          const idToken = session.getIdToken().getJwtToken()
          localStorage.setItem('idToken', idToken)
          console.log('Updated ID Token:', idToken)
        }
        resolve(cognitoUser)
      })
    })
  },
} 