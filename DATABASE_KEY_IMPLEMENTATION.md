# Database Key Authentication - Implementation Guide

## Overview

Implemented a secure multi-key authentication system for Cloudflare D1 access:
- **Valid key → Cloud Database** (cross-device sync)
- **Invalid/no key → Local Storage** (private, offline)
- **Multiple keys supported** (personal, team, guests)

## Server-Side Implementation ✅ COMPLETE

### 1. Environment Variables

```env
# Multiple keys (comma-separated)
DATABASE_ACCESS_KEYS=df561132b2760a6c08206e05ec51c27112052186c9f3067f109aa1b638caf2c7,943446b3162272b15ac0eb21bd8837fd55494f3554b1a7e8f7528672cc7d2d61,789cd9ed5e6ddd05dbbf65964d5244f4e9e73c2ed197927855b68540c4296f52
```

### 2. Authorization Middleware

**File:** `lib/veo/auth.ts`
- `isValidDatabaseKey()` - Validates user key against server keys
- `extractDatabaseKey()` - Extracts key from request headers
- Supports comma-separated multiple keys

### 3. API Route Protection

**Files:**
- `app/api/veo/jobs/route.ts` - GET/DELETE with auth
- `app/api/veo/jobs/[jobId]/route.ts` - GET/PUT/DELETE with auth

All endpoints now return `401 Unauthorized` if key is invalid/missing.

### 4. User Settings Storage

**File:** `lib/userSettings.ts`
- Added `databaseKey` field to `UserSettings` interface
- Encrypted storage using Web Crypto API
- Auto-decrypt on load

### 5. Cache Layer Updates

**File:** `lib/veo/cache-remote.ts`
- `getDatabaseKey()` - Get key from user settings
- `isUsingCloudStorage()` - Check if key is valid
- All cache functions send key in `x-database-key` header
- Automatic fallback to localStorage on 401 errors

## Client-Side Implementation ⏳ TODO

### 1. Settings UI - Database Key Field

**File:** `components/settings/SettingsButton.tsx`

Add input field for database key:

```tsx
<div>
  <label>Database Key</label>
  <input
    type="password"
    placeholder="Enter your database key..."
    value={databaseKey}
    onChange={(e) => setDatabaseKey(e.target.value)}
  />
  <p className="hint">
    Enter your database key to enable cloud sync. Leave empty for local-only storage.
  </p>
</div>
```

### 2. Storage Type Indicator

**File:** `components/veo/VeoHistoryPanel.tsx`

Add badge to show storage type:

```tsx
const [storageType, setStorageType] = useState<'cloud' | 'local'>('local');

useEffect(() => {
  isUsingCloudStorage().then(isCloud => {
    setStorageType(isCloud ? 'cloud' : 'local');
  });
}, [databaseKey]); // Re-check when key changes

<div className={styles.storageIndicator}>
  <span className={storageType === 'cloud' ? styles.cloudBadge : styles.localBadge}>
    {storageType === 'cloud' ? '☁️ Cloud' : '💾 Local'}
  </span>
</div>
```

### 3. Language Strings

**Files:** `lib/lang/en.ts` and `lib/lang/vi.ts`

```typescript
settings: {
  databaseKey: "Database Key",
  databaseKeyPlaceholder: "Enter your database key...",
  databaseKeyHint: "Enter key for cloud sync, or leave empty for local-only",
  cloudStorage: "Cloud Storage",
  localStorage: "Local Storage",
}
```

## How It Works

### Key Generation

```bash
# Generate a new secure key
openssl rand -hex 32
```

### User Workflow

1. **User generates a secure key** (using openssl or any secure generator)
2. **Admin adds key to server** (DATABASE_ACCESS_KEYS in .env.local)
3. **User enters key in Settings** (encrypted and stored in localStorage)
4. **Cache layer sends key with all D1 requests**
5. **Server validates key:**
   - Valid → Use D1 cloud storage
   - Invalid/missing → Use localStorage fallback
6. **UI shows storage type:**
   - ☁️ Cloud (cross-device sync enabled)
   - 💾 Local (private, offline-only)

### Security Features

- Keys encrypted in localStorage (Web Crypto API)
- Keys sent via HTTP headers (not in URL/body)
- Server-side validation (multiple keys supported)
- Automatic fallback on auth failure
- No error exposed to end user (silent fallback)

## Multiple Keys Use Cases

### Personal Key
```
Key 1: df561132...caf2c7 (User A's personal key)
- Only User A can access their cloud jobs
```

### Team Key
```
Key 2: 943446b3...7d2d61 (Shared team key)
- All team members can access shared cloud jobs
```

### Guest Key
```
Key 3: 789cd9ed...296f52 (Temporary guest key)
- Guests can access cloud storage
- Revoke by removing from DATABASE_ACCESS_KEYS
```

## Testing

### Test Valid Key
1. Enter valid key in Settings
2. Create a job
3. Check storage indicator shows "☁️ Cloud"
4. Open another device with same key
5. Verify job appears

### Test Invalid Key
1. Enter invalid key in Settings
2. Create a job
3. Check storage indicator shows "💾 Local"
4. Jobs stored in localStorage only

### Test No Key
1. Leave database key empty
2. Create a job
3. Check storage indicator shows "💾 Local"
4. Jobs stored in localStorage only

## Production Deployment

### Vercel Environment Variables

```env
DATABASE_ACCESS_KEYS=key1,key2,key3
```

Add to: Vercel Dashboard → Settings → Environment Variables

### Key Rotation

1. Generate new key
2. Add to DATABASE_ACCESS_KEYS (keep old keys)
3. Notify users of new key
4. Users update key in Settings
5. After migration, remove old keys

## Files Changed

### Server-side ✅
- `lib/veo/auth.ts` - NEW (authorization middleware)
- `lib/userSettings.ts` - Updated (added databaseKey field)
- `lib/veo/cache-remote.ts` - Updated (send key, check auth)
- `lib/veo/cache.ts` - Updated (export isUsingCloudStorage)
- `app/api/veo/jobs/route.ts` - Updated (auth checks)
- `app/api/veo/jobs/[jobId]/route.ts` - Updated (auth checks)
- `.env.local` - Updated (DATABASE_ACCESS_KEYS)

### Client-side ⏳ TODO
- `components/settings/SettingsButton.tsx` - Add database key input
- `components/veo/VeoHistoryPanel.tsx` - Add storage indicator
- `lib/lang/en.ts` - Add language strings
- `lib/lang/vi.ts` - Add language strings

## Next Steps

1. ✅ Server-side implementation complete
2. ⏳ Add database key input to Settings UI
3. ⏳ Add Cloud/Local storage indicator to History panel
4. ⏳ Add language strings
5. ⏳ Test with valid/invalid keys
6. ⏳ Deploy to production with keys configured

---

**Status:** Server-side COMPLETE, Client-side UI pending
**Security:** Multi-key support, encrypted storage, automatic fallback
**Ready for:** UI implementation and testing
