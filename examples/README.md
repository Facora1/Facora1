# Facora Examples

Drop-in code for merchants integrating Facora.

## Merchant API

### 402 Endpoint
\`\`\`typescript
// examples/merchant-api/402-endpoint.ts
// Returns 402 with facilitator list
\`\`\`

### Verify Settlement
\`\`\`typescript
// examples/merchant-api/verify-settlement.ts
// On-chain verification of payment proof
\`\`\`

## Usage

1. **Protect your endpoint** - Return 402 with facilitator list
2. **Client pays via SDK** - User calls `payAndRequest()`
3. **Verify settlement** - Check on-chain proof before unlocking content

See `/sdk` for client-side integration.
