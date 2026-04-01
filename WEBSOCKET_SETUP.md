# WebSocket Setup Guide for Teams Module

## Overview
The Teams module includes real-time notification support through WebSockets for approvals, member actions, and team activity.

## Prerequisites

### 1. Install Dependencies
```bash
npm install @nestjs/websockets socket.io socket.io-client
```

### 2. Backend Setup

#### A. Enable WebSocket in app.module.ts
```typescript
import { TeamsWebSocketGateway } from './backend/teams/websocket.gateway';

@Module({
  // ... other config
  providers: [
    // ... other providers
    TeamsWebSocketGateway,
  ],
})
export class AppModule {}
```

#### B. Register Gateway in TeamsModule
```typescript
// teams.module.ts
import { TeamsWebSocketGateway } from './websocket.gateway';

@Module({
  controllers: [TeamsController],
  providers: [
    TeamsService,
    PrismaService,
    TeamPermissionGuard,
    TeamRoleGuard,
    TeamsWebSocketGateway,
    JwtService,
  ],
  exports: [TeamsService, TeamPermissionGuard, TeamRoleGuard, TeamsWebSocketGateway],
})
export class TeamsModule {}
```

#### C. Uncomment WebSocket Gateway Implementation
Edit `src/backend/teams/websocket.gateway.ts`:
1. Remove the placeholder export at the bottom
2. Uncomment the full implementation with @WebSocketGateway decorators

#### D. Integrate Notifications in TeamsService
Add calls to emit notifications in key methods:

```typescript
// In teams.service.ts constructor
constructor(
  private prisma: PrismaService,
  private websocketGateway: TeamsWebSocketGateway,
) {}

// In submitForApproval method (after creating approval)
await this.websocketGateway.notifyApprovalSubmitted(teamId, {
  approvalId: workflowApproval.id,
  contentType: submitDto.contentType,
  submittedBy: { id: userId, email: user.email, name: user.firstName },
  requiredApprovals: workflow.requiredApprovals,
});

// In respondToApproval method (after updating approval)
await this.websocketGateway.notifyApprovalResponse(teamId, {
  approvalId: approval.id,
  decision: respondDto.decision,
  respondedBy: { id: userId, email: user.email },
  receivedApprovals: updatedApproval.receivedApprovals,
  requiredApprovals: workflow.requiredApprovals,
  isComplete: updatedApproval.status !== 'PENDING',
});

// Similar calls for member actions...
```

### 3. Frontend Setup

#### A. Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### B. WebSocket Hook
The `useTeamNotifications` hook is ready to use:
```typescript
import { useTeamNotifications } from '@/hooks/useTeamNotifications';

export default function MyComponent() {
  const { isConnected, notifications, subscribe, unsubscribe } = useTeamNotifications();
  
  // Subscribe to team updates
  useEffect(() => {
    subscribe(teamId);
    return () => unsubscribe(teamId);
  }, [teamId, subscribe, unsubscribe]);
  
  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {notifications.map(n => <>{n.message}</>)}
    </div>
  );
}
```

#### C. Team Dashboard Components
All components are ready in `src/components/teams/`:
- `TeamDashboard.tsx` - Main dashboard with tabs
- `TeamList.tsx` - List and search teams
- `TeamMembers.tsx` - Manage team members
- `ApprovalBoard.tsx` - View and approve content
- `CreateTeamModal.tsx` - Create new teams

### 4. Real-Time Events

#### WebSocket Events Emitted by Server
- `approval:submitted` - New approval request
- `approval:responded` - Approval decision made
- `member:added` - New member joined
- `member:removed` - Member left team
- `member:role_updated` - Member role changed

#### Example Event Data
```typescript
// approval:submitted
{
  approvalId: "approval_123",
  contentType: "video",
  submittedBy: {
    id: "user_..." ,
    email: "user@example.com",
    name: "John Doe"
  },
  requiredApprovals: 2,
  timestamp: "2026-04-01T12:34:56.000Z"
}

// member:added
{
  memberId: "member_123",
  user: {
    id: "user_...",
    email: "user@example.com",
    firstName: "Jane",
    lastName: "Doe"
  },
  role: "EDITOR",
  timestamp: "2026-04-01T12:34:56.000Z"
}
```

### 5. Testing WebSocket

#### Frontend Testing
```typescript
// In component or test
const { isConnected } = useTeamNotifications();
console.log('WebSocket connected:', isConnected);
```

#### Backend Testing
```bash
# Run with WebSocket logs
npm run start:dev

# You should see in logs:
# [TeamsWebSocketGateway] WebSocket gateway initialized
# [TeamsWebSocketGateway] User <userId> connected with socket <socketId>
```

### 6. Troubleshooting

#### WebSocket Not Connecting
1. Check browser DevTools → Network → WS for connection status
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check CORS settings in `WebSocketGateway` config
4. Ensure token is in `localStorage.getItem('token')`

#### Events Not Received
1. Verify client is subscribed: `subscribe(teamId)` called
2. Check server logs for event emits
3. Verify team room name matches: `team:${teamId}`

#### Permission Errors
1. Ensure JWT token is valid
2. Check user is member of team
3. Verify team exists and not archived

## Production Deployment

### Environment Variables
```
# .env.production
FRONTEND_URL=https://yourdomain.com
WEBSOCKET_ADAPTER=redis  # For scaling beyond single server
REDIS_URL=redis://localhost:6379
```

### Horizontal Scaling
For multiple servers, use Socket.io Redis adapter:
```bash
npm install @socket.io/redis-adapter redis
```

Then in gateway:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient();
const subClient = pubClient.duplicate();

server.adapter(createAdapter(pubClient, subClient));
```

## File Structure
```
src/
├── backend/teams/
│   ├── websocket.gateway.ts        ← WebSocket implementation
│   ├── teams.service.ts            ← Add notification calls
│   ├── teams.controller.ts         ← Already configured
│   └── teams.module.ts             ← Register gateway
├── components/teams/
│   ├── TeamDashboard.tsx           ← Main dashboard
│   ├── TeamList.tsx                ← Team listing
│   ├── TeamMembers.tsx             ← Member management
│   ├── ApprovalBoard.tsx           ← Approvals UI
│   └── CreateTeamModal.tsx         ← Create team form
├── hooks/
│   └── useTeamNotifications.ts     ← WebSocket client hook
└── app/teams/
    └── page.tsx                    ← Teams page route
```

## Next Steps
1. Install WebSocket dependencies
2. Uncomment gateway implementation
3. Update app.module.ts and teams.module.ts
4. Add notification calls to teams.service.ts
5. Test WebSocket connection in browser
6. Deploy with production settings

## Resources
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Socket.io Documentation](https://socket.io/docs/)
- [Socket.io Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
