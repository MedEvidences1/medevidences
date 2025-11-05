# Stripe Payment Integration Guide

## Current Status
✅ Subscription system fully implemented (frontend + backend)
✅ Pricing plans configured ($29 Basic, $49 Premium)
✅ Payment flow logic ready
⚠️ **MISSING: Your Stripe API keys**

---

## Step 1: Get Stripe API Keys

### Sign up for Stripe (if you haven't):
1. Go to: https://dashboard.stripe.com/register
2. Sign up with your email
3. Complete business verification

### Get Your API Keys:
1. Go to: https://dashboard.stripe.com/apikeys
2. You'll see two keys:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)
3. Copy both keys

**Test Mode vs Live Mode:**
- Use **test keys** (`pk_test_`, `sk_test_`) for development
- Use **live keys** (`pk_live_`, `sk_live_`) for production

---

## Step 2: Add Keys to Your Platform

### Backend Configuration (.env file):
```bash
# Open /app/backend/.env and update:
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
```

### Frontend Configuration (.env file):
```bash
# Open /app/frontend/.env and add:
REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
```

---

## Step 3: Install Stripe Library (Already Done)

The backend already has `stripe` Python library installed.

---

## Step 4: Restart Services

After adding keys:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

## Step 5: Test the Payment Flow

### As Candidate:
1. Login: john.cardio@test.com / TestPass123
2. Click "⭐ Subscription" button
3. Choose a plan (Basic $29 or Premium $49)
4. Click "Subscribe Now"
5. Enter test card: **4242 4242 4242 4242**
6. Expiry: any future date (e.g., 12/25)
7. CVC: any 3 digits (e.g., 123)
8. Complete payment
9. You'll be subscribed!

### Test Cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Auth**: 4000 0027 6000 3184

---

## How It Works

### Current Implementation:

**Backend (`/app/backend/server.py`):**
- `/api/subscription/create-checkout` - Creates Stripe checkout session
- `/api/subscription/activate` - Activates subscription after payment
- `/api/subscription/cancel` - Cancels subscription
- `/api/subscription/status` - Checks subscription status

**Frontend (`/app/frontend/src/pages/SubscriptionPlans.js`):**
- Displays pricing plans
- Calls backend to create checkout
- Redirects to Stripe hosted checkout page
- Handles success/cancel redirects

### Payment Flow:
1. User clicks "Subscribe Now"
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe's secure payment page
4. User enters card details
5. Stripe processes payment
6. User redirected back to your app
7. Backend activates subscription in database
8. User can now apply to unlimited jobs

---

## Webhooks (Optional for Production)

For production, set up webhooks to handle:
- Successful payments
- Failed payments
- Subscription cancellations
- Subscription renewals

**Webhook URL:** `https://yourdomain.com/api/webhooks/stripe`

Configure in Stripe Dashboard → Developers → Webhooks

---

## Security Notes

⚠️ **NEVER commit API keys to version control**
✅ Always use environment variables
✅ Use test keys for development
✅ Use live keys only in production
✅ Keep Secret Key secure (backend only)
✅ Publishable Key can be in frontend

---

## Pricing Configuration

Current plans (can be modified):

**Basic Plan - $29/month:**
- Apply to unlimited jobs
- Access to AI interview
- Basic candidate badge
- Email support

**Premium Plan - $49/month:**
- Everything in Basic
- Priority support
- Advanced analytics
- Featured profile
- Job match alerts

---

## Where to Add Your Keys

### Method 1: Direct Edit
```bash
# Edit backend .env
nano /app/backend/.env

# Add:
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"

# Edit frontend .env
nano /app/frontend/.env

# Add:
REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"
```

### Method 2: Share with Me
Just provide both keys and I'll add them for you:
- Publishable Key: pk_test_...
- Secret Key: sk_test_...

---

## Troubleshooting

**Issue: Payment page shows error**
- Solution: Check if keys are added correctly
- Verify keys start with `pk_test_` or `sk_test_`
- Restart backend after adding keys

**Issue: "Invalid API key"**
- Solution: Copied key might be incomplete
- Make sure there are no extra spaces
- Use test keys (not live) for testing

**Issue: Payment succeeds but subscription not activated**
- Solution: Check backend logs
- Verify webhook is configured (production only)

---

## Contact Support

If you need help:
1. Share error messages
2. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Check frontend console (F12)

---

**Once you provide your Stripe keys, the payment system will be 100% functional!**
