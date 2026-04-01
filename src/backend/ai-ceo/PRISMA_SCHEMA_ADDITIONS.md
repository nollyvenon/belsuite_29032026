// Add this to prisma/schema.prisma to enable AI CEO database models

// AI CEO Decision Model - Stores autonomous decisions and recommendations
model AIceoDecision {
  id            String   @id @default(cuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Decision metadata
  type          String   // REVENUE_OPTIMIZATION, PRICING_ADJUSTMENT, CHURN_MITIGATION, FEATURE_RECOMMENDATION, GROWTH_STRATEGY
  severity      String   // low, medium, high, critical
  title         String
  description   String   @db.Text
  
  // AI-generated recommendation
  recommendation  String  @db.Text
  implementationSteps Json // Array of strings
  
  // Impact analysis
  estimatedImpact Json // { metric: string, currentValue: number, projectedValue: number, percentChange: number }
  actualImpact    Json? // { metric: string, actualValue: number, percentChange: number }
  
  // Confidence and model info
  confidence    Float    @default(0.75) // 0-1
  aiModel       String   @default("gpt-4-turbo")
  
  // Implementation tracking
  implemented   Boolean  @default(false)
  implementedAt DateTime?
  
  // Lifecycle
  generatedAt   DateTime @default(now())
  expiresAt     DateTime // Decision validity period
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([type])
  @@index([severity])
  @@index([expiresAt])
  @@index([implemented])
}

// AI CEO Report Model - Stores periodic executive reports
model AICEOReport {
  id            String   @id @default(cuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Report metadata
  frequency     String   // daily, weekly, monthly
  period        Json     // { start: DateTime, end: DateTime }
  
  // Metrics snapshot
  metrics       Json     // { revenue, churn, pricing, features, growth }
  
  // AI summary
  summary       Json     // { keyHighlights, mainChallenges, opportunities, recommendations }
  
  // Associated decisions
  decisions     Json     // Array of decision IDs or full decision objects
  
  // Model and timestamps
  aiModel       String   @default("gpt-4-turbo")
  generatedAt   DateTime @default(now())
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([frequency])
  @@index([generatedAt])
}

// AI CEO Configuration Model - Stores org-specific settings
model AICEOConfig {
  id            String   @id @default(cuid())
  organizationId String   @unique
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Enable/disable AI CEO
  enabled       Boolean  @default(false)
  
  // Analysis preferences
  riskTolerance String   @default("balanced") // conservative, balanced, aggressive
  growthTarget  Float    @default(1.2) // 20% growth target by default
  
  // Churn tolerance
  maxChurnRate  Float    @default(5) // % acceptable churn rate
  
  // Analysis frequency
  analysisFrequency String @default("weekly") // daily, weekly, monthly
  
  // Notification settings
  sendNotifications Boolean @default(true)
  notificationEmail String?
  
  // Report settings
  autoGenerateReports Boolean @default(true)
  reportFrequency String   @default("weekly")
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([enabled])
}

// Add to Organization model:
// aiceoEnabled      Boolean @default(false)
// aiCeoConfig       AICEOConfig?
// aiCeoDecisions    AICEODecision[]
// aiCeoReports      AICEOReport[]
