# Module 6: Marketing Engine Implementation

Module 6 is now extended on top of the existing marketing stack rather than duplicating what the codebase already had.

Delivered additions:

- campaign cloning for rapid iteration
- campaign ROI summary endpoint with actionable recommendations
- approval workflow submission and response using shared TeamWorkflow and WorkflowApproval models
- CommonModule event bus integration for campaign lifecycle events

New API endpoints:

- POST /api/marketing/campaigns/:id/clone
- GET /api/marketing/campaigns/:id/roi
- GET /api/marketing/campaigns/:id/approvals
- POST /api/marketing/campaigns/:id/approvals
- POST /api/marketing/approvals/:approvalId/respond

Implementation notes:

- approval workflows require an active TeamWorkflow with applicableContentTypes including marketing_campaign
- cloned campaigns are created as DRAFT and duplicate the source campaign's ads as DRAFT ads
- campaign lifecycle actions now emit analytics events through CommonModule