// src/aws/cognitoConfig.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-south-1_ERrr5aqhR', // replace with your actual User Pool ID
  ClientId: '5sratdhqtdqra100fi7aegel2j' // replace with your actual App Client ID (WITHOUT secret)
};

export default new CognitoUserPool(poolData);
