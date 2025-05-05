import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

async function createWatchlistTable() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const cmd = new CreateTableCommand({
    TableName: "Watchlist",
    AttributeDefinitions: [
      { AttributeName: "userId",       AttributeType: "S" },
      { AttributeName: "stockTicker",  AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "userId",      KeyType: "HASH" },  // Partition Key
      { AttributeName: "stockTicker", KeyType: "RANGE" }, // Sort Key
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  try {
    const res = await client.send(cmd);
    console.log("Table status:", res.TableDescription?.TableStatus);
  } catch (err) {
    console.error("Create table error:", err);
  }
}

createWatchlistTable();
