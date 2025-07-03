# Admin Panel Troubleshooting Guide

## Overview
This guide helps resolve 400 errors when updating orders in the Strapi admin panel.

## Common Issues & Solutions

### 1. Validation Errors (400 Bad Request)

**Problem**: Updates fail with 400 errors due to strict validation rules.

**Solution**: The validation system has been improved to skip validation for:
- Payment-related fields (`paymentStatus`, `paymentIntent`, `amount`)
- Comments (`commentaire`)
- State changes to 'Annulée' (cancellation)
- Admin-only updates

### 2. Field Name Mismatches

**Problem**: Database uses snake_case but Strapi expects camelCase.

**Current Mapping**:
- Database: `payment_status` ↔ Strapi: `paymentStatus`
- Database: `updated_at` ↔ Strapi: `updatedAt`

### 3. Required Fields

**Required fields for order creation**:
- `quantite` (integer, min: 1)
- `event` (relation to prochaine-marmite)
- `user` (relation to user)

**Optional fields**:
- `commentaire` (text)
- `state` (enum: "Annulée", "Livrée", "Validée", "En attente")
- `livraison` (boolean)
- `cancelled` (boolean, default: false)
- `paymentMethod` (enum: "liquide", "stripe", default: "liquide")
- `paymentIntent` (text)
- `amount` (decimal)
- `paymentStatus` (enum: "pending", "succeeded", "failed", "canceled", default: "pending")

## Testing Admin Panel Updates

### Using the Test Script

```bash
# Set your admin token
export STRAPI_ADMIN_TOKEN="your-admin-token"

# Run the test
node test-admin-update.js
```

### Manual Testing

1. **Payment Status Update**:
   ```json
   {
     "paymentStatus": "succeeded"
   }
   ```

2. **Comment Update**:
   ```json
   {
     "commentaire": "Updated via admin panel"
   }
   ```

3. **State Change**:
   ```json
   {
     "state": "Annulée"
   }
   ```

4. **Multiple Fields**:
   ```json
   {
     "paymentStatus": "succeeded",
     "commentaire": "Updated via admin panel",
     "amount": 25.50
   }
   ```

## Validation Rules

### Business Logic Validation

The system validates:
1. **Quantity**: Must be positive integer
2. **Availability**: Cannot exceed available portions
3. **Event**: Must reference valid marmite
4. **User**: Must be authenticated

### Skipped Validation

Validation is skipped for:
- Payment status updates (from webhooks)
- Comment updates
- Amount updates
- Admin-only field updates
- Cancellation state changes

## Debugging Steps

### 1. Check Logs
```bash
# Monitor Strapi logs
npm run develop
```

### 2. Database Inspection
```bash
# Check order data
node debug-database.js
```

### 3. Validation Testing
```bash
# Test specific validation scenarios
node test-admin-update.js
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "La quantité doit être un entier positif" | Invalid quantity | Ensure quantity > 0 |
| "Aucune marmite trouvée" | Invalid event reference | Check event ID exists |
| "Il ne reste que X parts disponibles" | Insufficient availability | Reduce quantity or check availability |
| "Format de l'événement non reconnu" | Invalid event format | Use proper event ID or relation |

## Best Practices

### 1. Admin Panel Usage
- Use the admin panel for status updates and comments
- Avoid changing quantities or events after creation
- Use cancellation state for order management

### 2. Payment Management
- Let webhooks handle payment status updates
- Use admin panel for manual payment status changes
- Monitor webhook logs for payment issues

### 3. Data Integrity
- Always check availability before quantity changes
- Use transactions for critical updates
- Validate data before saving

## Troubleshooting Checklist

- [ ] Check Strapi logs for specific error messages
- [ ] Verify field names match schema
- [ ] Ensure required fields are provided
- [ ] Check business logic validation rules
- [ ] Test with minimal data first
- [ ] Verify database constraints
- [ ] Check for field type mismatches

## Support

If issues persist:
1. Check the logs for detailed error messages
2. Use the test scripts to isolate the problem
3. Verify database schema matches expectations
4. Test with different field combinations 