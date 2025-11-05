# Candidate Subscription System

## Overview
Implemented a freemium subscription model for candidates on the MedEvidences platform.

## Subscription Tiers

### Free Tier
- ✅ Browse all job listings
- ✅ View job details  
- ✅ Create candidate profile
- ✅ Basic profile visibility
- ❌ Cannot apply to jobs

### Paid Subscription
- ✅ Apply to unlimited jobs
- ✅ Access to AI interview
- ✅ Premium candidate badge
- ✅ Priority in employer searches
- ✅ Email support

#### Plans Available:
- **Basic Plan**: $29/month
- **Premium Plan**: $49/month (includes advanced analytics & priority support)

## Technical Implementation

### Database Changes
Added subscription fields to `CandidateProfile` model:
```python
subscription_status: str = "free"  # free, active, cancelled, expired
subscription_plan: Optional[str] = None  # basic, premium
subscription_start: Optional[datetime] = None
subscription_end: Optional[datetime] = None
```

### API Endpoints

#### Subscription Management
- `GET /api/subscription/status` - Get current subscription status
- `GET /api/subscription/pricing` - Get available plans and pricing
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/subscription/activate` - Activate subscription after payment
- `POST /api/subscription/cancel` - Cancel active subscription

#### Job Application Control
- `GET /api/jobs/{job_id}/can-apply` - Check if candidate can apply to job
- `POST /api/applications` - Modified to check subscription status

### Subscription Validation
The system automatically:
1. Checks subscription status before allowing job applications
2. Validates subscription expiry dates
3. Updates expired subscriptions to "expired" status
4. Provides clear error messages for subscription requirements

### Payment Integration
- Ready for Stripe integration (currently returns mock checkout URLs)
- Supports monthly billing cycles
- Handles subscription activation and cancellation

## Usage Examples

### Check Subscription Status
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/subscription/status
```

### Get Pricing Plans
```bash
curl http://localhost:8000/api/subscription/pricing
```

### Check if Can Apply to Job
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/jobs/{job_id}/can-apply
```

### Apply to Job (Requires Active Subscription)
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"job_id": "job-123", "cover_letter": "..."}' \
     http://localhost:8000/api/applications
```

## Error Responses

### Free User Trying to Apply
```json
{
  "detail": "Subscription required to apply to jobs. Please upgrade to a paid plan to apply.",
  "status_code": 402
}
```

### Expired Subscription
```json
{
  "detail": "Your subscription has expired. Please renew to continue applying to jobs.",
  "status_code": 402
}
```

## Frontend Integration Notes

### Job Listings Page
- Free users can browse all jobs
- Show "Subscribe to Apply" button for non-subscribers
- Show "Apply Now" button for active subscribers

### Job Details Page
- Display subscription requirement notice for free users
- Show pricing information and upgrade prompts

### Profile Dashboard
- Display current subscription status
- Show subscription expiry date
- Provide upgrade/manage subscription options

## Next Steps for Production

1. **Stripe Integration**: Replace mock checkout with real Stripe integration
2. **Email Notifications**: Send subscription confirmation and expiry emails
3. **Analytics**: Track subscription conversion rates
4. **A/B Testing**: Test different pricing strategies
5. **Grace Period**: Consider adding grace period for expired subscriptions
6. **Annual Plans**: Add discounted annual subscription options

## Testing

Run the test suite:
```bash
python test_subscription.py
```

All subscription functionality has been tested and is working correctly.