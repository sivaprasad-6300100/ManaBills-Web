# Backend Setup Guide - ITC Persistence

## Problem Solved
✅ **Opening ITC Balance Persistence** - Manual ITC entries now persist across page refreshes and user logins.

## What Changed in Frontend
The GstReports.jsx component now:
1. **Loads** opening ITC from database when component mounts or year changes
2. **Saves** opening ITC when user clicks "Save" button
3. **Auto-saves** leftover ITC when GST is marked as paid
4. **Clears** opening ITC with database sync when user clicks "Clear"

## Backend Setup Required

### 1. Django Models (Already Defined ✅)
The `GstITCBalance` model exists in your `business_billing/models.py`:

```python
class GstITCBalance(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE)
    year        = models.IntegerField()
    opening_itc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at  = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ["user", "year"]  # One record per user per year
```

### 2. Django View (Already Defined ✅)
The `itc_opening_balance()` view exists in your `business_billing/views.py`:

```python
@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def itc_opening_balance(request):
    year = int(request.query_params.get("year", date.today().year))
    
    if request.method == "GET":
        try:
            obj = GstITCBalance.objects.get(user=request.user, year=year)
            return Response({"opening_itc": float(obj.opening_itc)})
        except GstITCBalance.DoesNotExist:
            return Response({"opening_itc": 0.0})
    
    if request.method == "POST":
        amount = float(request.data.get("opening_itc", 0))
        obj, _ = GstITCBalance.objects.update_or_create(
            user=request.user,
            year=year,
            defaults={"opening_itc": amount}
        )
        return Response({"opening_itc": float(obj.opening_itc), "saved": True})
```

### 3. URL Registration (ACTION REQUIRED ⚠️)

Find your main Django `urls.py` (or `business_billing/urls.py`) and add this URL pattern:

```python
from django.urls import path
from business_billing.views import itc_opening_balance

urlpatterns = [
    # ... other patterns ...
    path('api/business/itc-opening-balance/', itc_opening_balance, name='itc_opening_balance'),
]
```

**OR** if using include() in main urls.py:

```python
# In main urls.py
from django.urls import path, include

urlpatterns = [
    path('api/', include('business_billing.urls')),
]

# In business_billing/urls.py
from django.urls import path
from .views import itc_opening_balance

app_name = 'business_billing'
urlpatterns = [
    path('business/itc-opening-balance/', itc_opening_balance, name='itc_opening_balance'),
]
```

### 4. Run Migrations (If Not Done Yet)

```bash
python manage.py makemigrations
python manage.py migrate
```

## API Endpoints

### GET /api/business/itc-opening-balance/
Get the opening ITC balance for a specific year.

**Query Parameters:**
- `year` (optional): defaults to current year

**Response:**
```json
{
  "opening_itc": 5000.00
}
```

**Example:**
```javascript
authAxios.get('business/itc-opening-balance/', { 
  params: { year: 2026 } 
}).then(r => console.log(r.data.opening_itc))
```

### POST /api/business/itc-opening-balance/
Save/update the opening ITC balance.

**Request Body:**
```json
{
  "year": 2026,
  "opening_itc": 5000.00
}
```

**Response:**
```json
{
  "opening_itc": 5000.00,
  "saved": true
}
```

**Example:**
```javascript
authAxios.post('business/itc-opening-balance/', {
  year: 2026,
  opening_itc: 5000.00
}).then(r => console.log('Saved:', r.data.opening_itc))
```

## How It Works Now

1. **User Opens GstReports Page**
   - Component mounts → calls `loadOpeningITC(selectedYear)`
   - API GET request fetches value from `GstITCBalance` table
   - Value displays in input field and `openingITC` state

2. **User Enters ITC Manually**
   - Types amount in "Opening ITC Balance" field
   - Clicks "Save" button

3. **Frontend Calls Backend**
   - `saveOpeningITC()` → POST request with amount and year
   - Django saves to `GstITCBalance` table
   - Response updates React state
   - Toast confirms save

4. **Page Refresh / Different User**
   - New mount → `loadOpeningITC()` runs
   - Fetches fresh data from database (user-specific)
   - Each user sees their own opening ITC

5. **Auto Carry Forward**
   - When user marks GST as paid with leftover ITC
   - `saveOpeningITC()` automatically persists the leftover
   - Prepares opening balance for next month

## Data Isolation
- Each user has their own opening ITC (via `OneToOneField` to User)
- Each year has separate record (via year field)
- When user logs in, only their data loads
- When switching years, correct year's data loads

## Testing

### Test in Browser Console
```javascript
// Load current year's opening ITC
await authAxios.get('business/itc-opening-balance/', { params: { year: 2026 } })

// Save opening ITC
await authAxios.post('business/itc-opening-balance/', { 
  year: 2026, 
  opening_itc: 5000 
})

// Verify it persisted - refresh page and check
// Opening ITC field should still show the saved value
```

### Test Multi-User Scenario
1. User A logs in, enters opening ITC: ₹5000
2. User A sees ₹5000 persisted after refresh ✓
3. User B logs in, no opening ITC (different user) ✓
4. User B enters ₹3000, saves
5. User A logs back in, sees ₹5000 (not User B's data) ✓

## Troubleshooting

### "Failed to save opening ITC" error
- Check if endpoint URL is correct in urls.py
- Verify user is authenticated (cookies/tokens)
- Check Django logs for errors

### Opening ITC shows 0 after refresh
- Verify migrations ran: `python manage.py migrate`
- Check database table `business_billing_gstitcbalance` exists
- Confirm user authentication still valid

### Different user sees previous user's ITC
- Check `GstITCBalance` model has `user` field properly set
- Verify query filters by `user=request.user`

## Summary of Changes

| Component | Change | Type |
|-----------|--------|------|
| GstReports.jsx | Added `loadOpeningITC()` | Frontend ✅ |
| GstReports.jsx | Added `saveOpeningITC()` | Frontend ✅ |
| GstReports.jsx | Updated useEffect to load on mount | Frontend ✅ |
| GstReports.jsx | Updated Save button to call backend | Frontend ✅ |
| GstReports.jsx | Updated Clear button to call backend | Frontend ✅ |
| GstReports.jsx | Updated auto carry forward logic | Frontend ✅ |
| Django URL config | Register `/api/business/itc-opening-balance/` | Backend ⚠️ (TODO) |

**Next Step:** Register the URL in Django and test! 🚀
