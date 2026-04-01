# Teams UI Setup Guide

## Overview
Complete Team Management UI built with React/Next.js with real-time WebSocket notifications, role-based access control, and approval workflows.

## Quick Start

### 1. Install WebSocket Dependencies (Optional but Recommended)
```bash
npm install socket.io-client
```

Note: Full WebSocket server support requires additional backend dependency:
```bash
npm install @nestjs/websockets socket.io
```
See `WEBSOCKET_SETUP.md` for full WebSocket server setup.

### 2. Add Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Access Team Dashboard
Navigate to `/teams` page after authentication

## Components

### TeamDashboard (Main Container)
**Location:** `src/components/teams/TeamDashboard.tsx`

Features:
- Tab-based navigation (Teams, Members, Approvals)
- Real-time connection status indicator
- Activity feed with latest notifications
- Responsive layout with dark theme

Usage:
```typescript
import TeamDashboard from '@/components/teams/TeamDashboard';

export default function Page() {
  return <TeamDashboard />;
}
```

### TeamList (View & Manage Teams)
**Location:** `src/components/teams/TeamList.tsx`

Features:
- Search teams by name
- Sort by creation date or name
- Filter by public/private
- Show member count and approval status
- Pagination support (50 teams per page)
- Click to select team

Props:
```typescript
interface TeamListProps {
  onSelectTeam: (teamId: string) => void;
}
```

### TeamMembers (Member Management)
**Location:** `src/components/teams/TeamMembers.tsx`

Features:
- List all team members with roles
- Invite new members via email
- Update member roles (click to edit)
- Remove members from team
- Shows joined date and last activity

Props:
```typescript
interface TeamMembersProps {
  teamId: string;
}
```

### ApprovalBoard (View & Manage Approvals)
**Location:** `src/components/teams/ApprovalBoard.tsx`

Features:
- Display pending approvals
- Show approval progress bar
- Submit approval decision (Approve/Reject)
- Optional rejection reason
- Auto-refresh (10 second polling)
- Status indicators (Pending, Approved, Rejected)

Props:
```typescript
interface ApprovalBoardProps {
  teamId: string;
}
```

### CreateTeamModal (Create New Team)
**Location:** `src/components/teams/CreateTeamModal.tsx`

Features:
- Modal form for team creation
- Configure team settings:
  - Name (required)
  - Description
  - Max members
  - Public/Private
  - Approval requirement
- Form validation
- Success handling with auto-refresh

Props:
```typescript
interface CreateTeamModalProps {
  onClose: () => void;
}
```

## Hooks

### useTeamNotifications (WebSocket Real-Time Updates)
**Location:** `src/hooks/useTeamNotifications.ts`

Features:
- WebSocket connection management
- Real-time event listeners
- Automatic reconnection
- Event types:
  - `approval:submitted`
  - `approval:responded`
  - `member:added`
  - `member:removed`
  - `member:role_updated`

Usage:
```typescript
import { useTeamNotifications } from '@/hooks/useTeamNotifications';

export default function Component() {
  const { isConnected, notifications, subscribe, unsubscribe } = useTeamNotifications();

  useEffect(() => {
    subscribe(teamId);
    return () => unsubscribe(teamId);
  }, [teamId, subscribe, unsubscribe]);

  return (
    <div>
      <span>{isConnected ? '🟢' : '🔴'} Connected</span>
      {notifications.map(n => <div>{n.message}</div>)}
    </div>
  );
}
```

## Pages

### Teams Page
**Location:** `src/app/teams/page.tsx`

- Requires authentication (redirects to home if no token)
- Loads TeamDashboard component
- Protected route

## API Endpoints Used

### Team Management
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:teamId` - Get team details
- `PUT /api/teams/:teamId` - Update team
- `DELETE /api/teams/:teamId` - Archive team

### Members
- `GET /api/teams/:teamId/members` - List members
- `POST /api/teams/:teamId/members/invite` - Invite member
- `POST /api/teams/:teamId/members/add` - Accept invitation
- `DELETE /api/teams/:teamId/members/:memberId` - Remove member
- `PUT /api/teams/:teamId/members/:memberId/role` - Update member role

### Approvals
- `POST /api/teams/:teamId/workflows` - Create workflow
- `POST /api/teams/:teamId/approvals/submit` - Submit for approval
- `GET /api/teams/:teamId/approvals/pending` - Get pending approvals
- `POST /api/teams/:teamId/approvals/:approvalId/respond` - Respond to approval

## Authentication

All API calls include JWT token from localStorage:
```typescript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

Ensure token is present before accessing `/teams` page.

## Styling

All components use:
- **Framework:** Tailwind CSS
- **Theme:** Dark mode (slate-900, slate-800)
- **Colors:**
  - Primary: Blue-600
  - Success: Green-600
  - Danger: Red-600
  - Neutral: Slate

## Real-Time Example

```typescript
'use client';

import { useTeamNotifications } from '@/hooks/useTeamNotifications';
import { useEffect, useState } from 'react';

export default function RealtimeExample() {
  const { isConnected, notifications, subscribe } = useTeamNotifications();
  const [teamId] = useState('team_123');

  useEffect(() => {
    subscribe(teamId);
  }, [teamId, subscribe]);

  return (
    <div>
      <div className="mb-4">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      {notifications.map((notif, i) => (
        <div key={i} className="p-2 bg-slate-700 rounded mb-2">
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

All components handle errors gracefully:
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed');
  // ... process response
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
} finally {
  setLoading(false);
}
```

## Loading States

Components display loading indicators:
- Spinner during data fetch
- Disabled buttons during submission
- Loading text feedback

## Mobile Responsive

All components are fully responsive:
- Mobile: Single column layout
- Tablet: 2-column grid where applicable
- Desktop: 3-column grid for teams, full tables for data

## Customization

### Change Color Theme
Edit Tailwind classes in components:
```typescript
// Change from blue-600 to purple-600
className="bg-purple-600 hover:bg-purple-700"
```

### Modify Refresh Rate
In ApprovalBoard:
```typescript
// Default: 10 seconds
setInterval(fetchApprovals, 10000);

// Change to 5 seconds
setInterval(fetchApprovals, 5000);
```

### Adjust Notification Count
In useTeamNotifications:
```typescript
const maxNotifications = 10; // Change this value
```

## Troubleshooting

### Cannot find module 'socket.io-client'
**Solution:** Install dependencies
```bash
npm install socket.io-client
```

### WebSocket not connecting
1. Check `NEXT_PUBLIC_API_URL` environment variable
2. Verify backend WebSocket gateway is running
3. Check browser console for auth errors
4. Ensure token is in localStorage

### Tokens not persisting
1. Check localStorage is enabled in browser
2. Verify token is being stored: `localStorage.setItem('token', token)`
3. Check token format matches JWT

### API calls failing with 403
1. Verify you're a member of the team
2. Check your role has required permissions
3. Verify team is not archived

## File Structure

```
src/
├── app/
│   └── teams/
│       └── page.tsx                      ← Teams page
├── components/
│   └── teams/
│       ├── TeamDashboard.tsx             ← Main dashboard
│       ├── TeamList.tsx                  ← Team listing
│       ├── TeamMembers.tsx               ← Member management
│       ├── ApprovalBoard.tsx             ← Approval view
│       └── CreateTeamModal.tsx           ← Create form
└── hooks/
    └── useTeamNotifications.ts           ← WebSocket hook
```

## Next Steps

1. ✅ UI components created and ready
2. ⏭️ Install optional WebSocket dependencies
3. ⏭️ Configure WebSocket server (see WEBSOCKET_SETUP.md)
4. ⏭️ Test real-time notifications
5. ⏭️ Deploy to production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [React Hooks](https://react.dev/reference/react)

## Support

For issues with:
- **Backend API:** See `TEAMS_API_REFERENCE.md`
- **RBAC & Security:** See Phase 2b implementation notes
- **WebSocket Setup:** See `WEBSOCKET_SETUP.md`
