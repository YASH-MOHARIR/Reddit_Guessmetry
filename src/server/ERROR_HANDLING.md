# Error Handling for Consensus Voting

This document describes the error handling and graceful degradation strategies implemented for the consensus voting feature.

## Redis Error Handling

### Logging
All Redis operations now include enhanced error logging with context:
- `[Redis Error]` prefix for easy filtering
- Prompt ID and username included in logs
- Full error message and stack trace logged
- Operation name included for debugging

### Retry Logic
The `submit-guess` endpoint implements retry logic:
- Automatically retries failed operations once
- 100ms delay between retries
- Tracks which operations succeeded/failed
- Returns partial success if some operations succeed
- Only returns error if all 3 operations fail

### Partial Data Handling
The `get-results` endpoint handles partial data gracefully:
- Continues if some Redis operations fail
- Returns available data with warning flag
- Calculates percentages with available data
- Handles missing player guess or total players
- Logs warnings for partial data scenarios

## Client Error Handling

### PollResultsDisplay Component

#### Initial Load Failures
- Displays user-friendly error message: "Results temporarily unavailable"
- Shows retry button for manual recovery
- Provides clear feedback about what went wrong

#### Polling Failures
- Detects 3 consecutive polling failures
- Shows warning: "Live updates paused"
- Displays last known results
- Provides retry button to resume polling

#### Partial Data
- Shows info message: "Partial results"
- Indicates some data may be missing
- Displays available data normally
- Continues to function with reduced information

#### Empty State
- Shows "Be the first to guess!" message
- Handles zero players/guesses gracefully
- Provides clear call-to-action

### Graceful Degradation

The system degrades gracefully in the following scenarios:

1. **Redis completely unavailable**: Returns error message, allows fallback to Phase 1 mode
2. **Partial Redis failures**: Returns available data with warning
3. **Network issues**: Retries once, then shows cached data
4. **Missing player data**: Continues with available aggregation
5. **Missing creator answer**: Displays results without comparison

## Error Messages

### User-Facing Messages
- "Results temporarily unavailable" - Redis/API failure
- "Live updates paused" - Polling failures
- "Partial results" - Some data missing
- "Be the first to guess!" - No data yet
- "Failed to submit guess. Your answer was recorded locally." - Submit failure

### Server Logs
- `[Redis Error]` - Redis operation failures
- `[Redis Warning]` - Partial success scenarios
- `[Redis Retry]` - Retry attempts
- `[API Error]` - API endpoint failures

## Testing

Error handling is tested in:
- `src/server/services/redisAggregation.test.ts` - Redis error logging
- `src/client/components/PollResultsDisplay.test.tsx` - UI error states

Test scenarios include:
- Initial load failures
- Polling failures (3 consecutive)
- Partial data availability
- Missing player scores
- Empty aggregation data
- Redis operation failures with retry

## Best Practices

1. **Always log with context**: Include prompt ID, username, operation name
2. **Retry once**: Don't retry indefinitely, fail fast
3. **Partial success is OK**: Return what you can, warn about missing data
4. **User-friendly messages**: Don't expose technical details to users
5. **Graceful degradation**: Continue functioning with reduced data
6. **Clear recovery paths**: Provide retry buttons and fallback options
