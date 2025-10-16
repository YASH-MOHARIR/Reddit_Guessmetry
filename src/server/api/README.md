# Consensus API Endpoints

## POST /api/consensus/get-results

Fetches aggregated consensus results for a prompt, including top 10 guesses, player score, and creator's answer.

### Request Body

```json
{
  "promptId": 1,
  "username": "testuser"
}
```

### Response

```json
{
  "type": "consensus-results",
  "aggregation": [
    {
      "guess": "jellyfish",
      "count": 85,
      "percentage": 85.0,
      "isPlayerGuess": true,
      "isCreatorAnswer": false,
      "rank": 1
    },
    {
      "guess": "squid",
      "count": 10,
      "percentage": 10.0,
      "isPlayerGuess": false,
      "isCreatorAnswer": false,
      "rank": 2
    }
  ],
  "playerGuess": "jellyfish",
  "creatorAnswer": "house",
  "totalPlayers": 100,
  "totalGuesses": 103,
  "playerScore": {
    "pointsEarned": 100,
    "matchPercentage": 85.0,
    "tier": "majority"
  }
}
```

### Error Responses

**400 Bad Request** - Missing required fields
```json
{
  "status": "error",
  "message": "promptId and username are required"
}
```

**404 Not Found** - Prompt doesn't exist
```json
{
  "status": "error",
  "message": "Prompt not found"
}
```

**500 Internal Server Error** - Redis or server error
```json
{
  "status": "error",
  "message": "Failed to fetch consensus results: <error details>"
}
```

### Features

- ✅ Validates request body (promptId, username)
- ✅ Fetches aggregated guesses from Redis
- ✅ Calculates percentages based on total unique players
- ✅ Sorts guesses by count descending and returns top 10
- ✅ Marks player's guess in aggregation array
- ✅ Marks creator's answer in aggregation array
- ✅ Calculates player's consensus score using tier system
- ✅ Handles empty aggregation gracefully
- ✅ Handles missing player guess gracefully
- ✅ Error handling for Redis failures
- ✅ Error handling for invalid prompt IDs

### Testing

The endpoint has comprehensive unit tests in `consensus-get-results.test.ts` covering:
- Request validation
- Empty aggregation handling
- Percentage calculations
- Sorting and ranking
- Player guess marking
- Creator answer marking
- Score calculation
- Error scenarios

To test manually with the Devvit playtest:
1. Run `npm run dev`
2. Open the playtest URL
3. Submit guesses using `/api/consensus/submit-guess`
4. Call `/api/consensus/get-results` to see aggregated results
