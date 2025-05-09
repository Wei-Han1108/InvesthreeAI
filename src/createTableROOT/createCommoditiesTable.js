import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
async function createCommoditiesTable() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const cmd = new CreateTableCommand({
      TableName: "CommoditiesInvestments",
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "investmentId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "investmentId", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });
  
    try {
      const res = await client.send(cmd);
      console.log("CommoditiesInvestments creation started:", res.TableDescription?.TableStatus);
    } catch (err) {
      console.error("Error creating CommoditiesInvestments:", err);
    }
  }
  
  createCommoditiesTable();
  