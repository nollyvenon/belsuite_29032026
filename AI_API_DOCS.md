# BelSuite AI API Documentation

Complete reference for all AI generation endpoints, request/response formats, error handling, and usage patterns.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL & Headers](#base-url--headers)
3. [Response Format](#response-format)
4. [Text Generation Endpoints](#text-generation-endpoints)
5. [Image Generation](#image-generation)
6. [Template Management](#template-management)
7. [Usage & Analytics](#usage--analytics)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Code Examples](#code-examples)

---

## Authentication

All endpoints require a valid JWT token in the `Authorization` header.

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtaining Token

```bash
# POST /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

---

## Base URL & Headers

### Development

```
Base URL: http://localhost:3000
```

### Production

```
Base URL: https://api.belsuite.com
```

### Required Headers

```bash
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "meta": {
    "timestamp": "2026-03-31T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "Monthly token limit exceeded",
    "details": {
      "limit": 1000000,
      "used": 999999,
      "tier": "STARTER"
    }
  },
  "meta": {
    "timestamp": "2026-03-31T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

---

## Text Generation Endpoints

### 1. Custom Text Generation

Generate text with any custom prompt.

**Endpoint**
```
POST /api/ai/text
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about artificial intelligence",
    "model": "gpt-4-turbo",
    "maxTokens": 100,
    "temperature": 0.7,
    "useCache": true
  }'
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The prompt for generation |
| `model` | enum | No | Model to use (see [Model Enum](#model-enum)) |
| `maxTokens` | number | No | Max output tokens (default: 500) |
| `temperature` | number | No | Creativity (0-2, default: 0.7) |
| `useCache` | boolean | No | Enable caching (default: true) |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "content": "Circuits dance and think,\nArtificial mind awakens,\nFuture born in code.",
    "provider": "openai",
    "model": "gpt-4-turbo",
    "tokens": {
      "prompt": 8,
      "completion": 20,
      "total": 28
    },
    "cost": 0.0008,
    "cached": false,
    "timestamp": "2026-03-31T10:30:00Z"
  }
}
```

---

### 2. Blog Post Generation

Generate SEO-optimized blog posts.

**Endpoint**
```
POST /api/ai/blog-post
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/blog-post \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Artificial Intelligence in Healthcare",
    "tone": "professional",
    "audience": "healthcare professionals",
    "wordCount": 2500,
    "keywords": "AI, machine learning, diagnosis, patient care",
    "model": "gpt-4-turbo"
  }'
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | Yes | Blog post topic |
| `tone` | string | No | Tone: professional, casual, etc. (default: professional) |
| `audience` | string | No | Target audience description |
| `wordCount` | number | No | Target word count (default: 2000) |
| `keywords` | string | No | SEO keywords (comma-separated) |
| `model` | enum | No | Model to use |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "content": "# Artificial Intelligence in Healthcare\n\n## Introduction\nArtificial intelligence (AI) is revolutionizing...",
    "provider": "openai",
    "model": "gpt-4-turbo",
    "tokens": {
      "prompt": 45,
      "completion": 2100,
      "total": 2145
    },
    "cost": 0.0645,
    "wordCount": 2123,
    "timestamp": "2026-03-31T10:30:00Z"
  }
}
```

---

### 3. Social Media Post Generation

Generate platform-specific social media content.

**Endpoint**
```
POST /api/ai/social-post
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/social-post \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "New AI features launch",
    "platform": "LinkedIn",
    "tone": "professional",
    "hashtags": "AI, innovation, technology",
    "cta": "Learn more"
  }'
```

**Parameters**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `topic` | string | - | Post topic |
| `platform` | enum | Twitter, Instagram, LinkedIn, Facebook, TikTok | Target platform |
| `tone` | string | - | Tone style |
| `hashtags` | string | - | Hashtags (comma-separated) |
| `cta` | string | - | Call-to-action text |

**Platform Limits**

- Twitter: 280 characters
- Instagram: 2,200 characters
- LinkedIn: 3,000 characters
- Facebook: 63,206 characters
- TikTok: 2,200 characters (caption)

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "content": "🚀 Excited to announce our latest AI features that will transform how you work! From intelligent content generation to real-time analytics, we're making it easier than ever to harness the power of AI.\n\nLearn more about what's new: [link]\n\n#AI #Innovation #Technology",
    "platform": "LinkedIn",
    "characterCount": 285,
    "charLimit": 3000,
    "estimatedEngagement": {
      "views": 2500,
      "engagementRate": "12%"
    }
  }
}
```

---

### 4. Ad Copy Generation

Generate high-converting advertisement copy.

**Endpoint**
```
POST /api/ai/ad-copy
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/ad-copy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "AI Content Generator",
    "medium": "Google Ads",
    "audience": "marketing managers",
    "benefits": "save time, reduce costs, improve quality",
    "cta": "Start Free Trial",
    "tone": "persuasive"
  }'
```

**Parameters**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `product` | string | - | Product/service name |
| `medium` | enum | Google, Facebook, LinkedIn, Instagram, Email | Ad platform |
| `audience` | string | - | Target audience description |
| `benefits` | string | - | Key benefits (comma-separated) |
| `cta` | string | - | Call-to-action |
| `tone` | string | - | Tone style |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "variations": [
      {
        "headline": "Save Hours with AI Content Generation",
        "body": "Create professional content in minutes, not hours. Our AI-powered generator handles everything from blog posts to social media content.",
        "cta": "Start Free Trial",
        "platform": "Google Ads"
      },
      {
        "headline": "Cut Content Costs by 70%",
        "body": "Generate high-quality content automatically. No more expensive copywriters or long turnaround times.",
        "cta": "Start Free Trial",
        "platform": "Google Ads"
      }
    ],
    "estimatedCTR": "8.5%",
    "estimatedROI": "320%"
  }
}
```

---

### 5. Video Script Generation

Generate structured video scripts.

**Endpoint**
```
POST /api/ai/video-script
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/video-script \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Getting Started with AI",
    "videoDuration": 5,
    "videoType": "tutorial",
    "tone": "friendly",
    "audience": "beginners",
    "keyPoints": "what is AI, real-world examples, getting started"
  }'
```

**Parameters**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `topic` | string | - | Video topic |
| `videoDuration` | number | 1-60 minutes | Video length in minutes |
| `videoType` | enum | tutorial, promotional, educational, comedy, story | Video type |
| `tone` | string | - | Tone style |
| `audience` | string | - | Target audience |
| `keyPoints` | string | - | Key points to cover |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "script": {
      "hook": {
        "duration": "0:00-0:15",
        "description": "Open with compelling question",
        "voiceover": "Have you ever wondered what artificial intelligence really is?"
      },
      "sections": [
        {
          "duration": "0:15-2:00",
          "title": "What is AI?",
          "voiceover": "...",
          "visuals": "..."
        }
      ],
      "cta": {
        "duration": "4:45-5:00",
        "voiceover": "Start your AI journey today",
        "button": "Learn More"
      }
    },
    "estimatedViews": 15000,
    "audienceRetention": "75%"
  }
}
```

---

### 6. Email Campaign Generation

Generate marketing email campaigns.

**Endpoint**
```
POST /api/ai/email-campaign
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/email-campaign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "promotional",
    "emailSubject": "50% off AI Content Generator",
    "audience": "free tier users",
    "mainMessage": "Upgrade to Pro for unlimited content generation",
    "cta": "Upgrade Now"
  }'
```

**Parameters**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `emailType` | enum | promotional, newsletter, followup, welcome | Email type |
| `emailSubject` | string | - | Email subject line |
| `audience` | string | - | Target audience |
| `mainMessage` | string | - | Main message |
| `cta` | string | - | Call-to-action |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "subjectLine": "50% off AI Content Generator - Limited Time!",
    "preheader": "Upgrade to Pro and save big",
    "body": "<!DOCTYPE html>...",
    "plainText": "50% off AI Content Generator - Limited Time!...",
    "estimatedOpenRate": "22%",
    "estimatedClickRate": "4.5%"
  }
}
```

---

### 7. Product Description Generation

Generate e-commerce product descriptions.

**Endpoint**
```
POST /api/ai/product-description
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/product-description \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Pro Content Generator",
    "price": "$99/month",
    "category": "SaaS",
    "features": "unlimited generations, 10+ content types, API access",
    "audience": "marketing professionals",
    "tone": "professional"
  }'
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productName` | string | Yes | Product name |
| `price` | string | No | Price information |
| `category` | string | No | Product category |
| `features` | string | No | Features (comma-separated) |
| `audience` | string | No | Target audience |
| `tone` | string | No | Tone style |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "title": "Pro Content Generator - Unlimited Generations",
    "shortDescription": "Create unlimited content with our AI-powered generator",
    "fullDescription": "...",
    "seoKeywords": ["content generator", "AI writing", "marketing"],
    "conversionScore": "92/100"
  }
}
```

---

### 8. Headlines & Titles Generation

Generate multiple headline variations.

**Endpoint**
```
POST /api/ai/headlines
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/headlines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI revolutionizes content marketing",
    "purpose": "click-through",
    "audience": "marketers",
    "tone": "professional",
    "style": "varied"
  }'
```

**Parameters**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `topic` | string | - | Topic for headlines |
| `purpose` | enum | click-through, engagement, share, conversion | Purpose |
| `audience` | string | - | Target audience |
| `tone` | string | - | Tone style |
| `style` | enum | curiosity, benefit, urgency, number, question | Style |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "headlines": [
      "1. AI Just Changed Content Marketing Forever (Here's Why)",
      "2. The 7 Ways AI Will Revolutionize Your Content Strategy in 2026",
      "3. Quick Question: Is Your Content Team Ready for AI?",
      "4. Marketers Hate This One Weird AI Trick - But It Works",
      "5. AI + Content = The Perfect Marketing Formula",
      "6. Before You Hire Another Copywriter, Read This",
      "7. The AI Content Revolution Starts Now",
      "8. 92% of Marketers Will Use AI This Year - Will You?",
      "9. Stop Writing Content the Old Way",
      "10. Your Competitors Are Using AI Content. Are You?"
    ],
    "bestPerformer": "1. AI Just Changed Content Marketing Forever (Here's Why)",
    "conversionPotential": "High"
  }
}
```

---

## Image Generation

### Generate Images with DALL-E

Generate images with DALL-E 3.

**Endpoint**
```
POST /api/ai/image
```

**Request**

```bash
curl -X POST http://localhost:3000/api/ai/image \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic AI assistant helping a woman at her desk with holographic displays",
    "size": "1024x1024",
    "quantity": 1,
    "quality": "hd",
    "style": "photorealistic"
  }'
```

**Parameters**

| Field | Type | Options | Default | Description |
|-------|------|---------|---------|-------------|
| `prompt` | string | - | - | Image description (detailed) |
| `size` | enum | 1024x1024, 1792x1024, 1024x1792 | 1024x1024 | Image dimensions |
| `quantity` | number | 1-4 | 1 | Number of images to generate |
| `quality` | enum | standard, hd | standard | Image quality |
| `style` | string | - | photorealistic | Art style |

**Size Pricing (per image)**

- 1024x1024: $0.04
- 1792x1024 or 1024x1792: $0.08

**Response**

```json
{
  "success": true,
  "data": {
    "id": "gen-uuid",
    "images": [
      {
        "url": "https://cdn.openai.com/API/dalle-3-preview.png",
        "size": "1024x1024",
        "revisedPrompt": "A photorealistic image of a futuristic AI assistant helping a woman at her desk with holographic displays showing data and analytics"
      }
    ],
    "provider": "openai",
    "model": "dall-e-3",
    "cost": 0.04,
    "timestamp": "2026-03-31T10:30:00Z"
  }
}
```

---

## Template Management

### List All Templates

Get all available prompt templates.

**Endpoint**
```
GET /api/ai/templates
```

**Request**

```bash
curl -X GET "http://localhost:3000/api/ai/templates?category=blog" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (blog, social, email, etc.) |
| `isBuiltIn` | boolean | Filter built-in templates |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset (default: 0) |

**Response**

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template-uuid",
        "name": "Blog Post",
        "category": "blog",
        "description": "SEO-optimized blog post generator",
        "isBuiltIn": true,
        "isPublic": true,
        "variables": ["topic", "tone", "audience", "wordCount", "keywords"],
        "usageCount": 1250,
        "averageTokens": 2100,
        "averageCost": 0.063
      },
      // ... more templates
    ],
    "total": 7,
    "limit": 20,
    "offset": 0
  }
}
```

---

### Get Template by Category

Get templates filtered by category.

**Endpoint**
```
GET /api/ai/templates/category/:category
```

**Request**

```bash
curl -X GET http://localhost:3000/api/ai/templates/category/blog \
  -H "Authorization: Bearer $TOKEN"
```

**Response**

```json
{
  "success": true,
  "data": {
    "category": "blog",
    "templates": [
      {
        "id": "template-uuid",
        "name": "Blog Post",
        "description": "SEO-optimized blog post generator",
        "variables": ["topic", "tone", "audience", "wordCount", "keywords"],
        "usageCount": 1250
      }
    ]
  }
}
```

---

## Usage & Analytics

### Get Usage Statistics

Get comprehensive usage statistics and limits.

**Endpoint**
```
GET /api/ai/usage/stats
```

**Request**

```bash
curl -X GET http://localhost:3000/api/ai/usage/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Response**

```json
{
  "success": true,
  "data": {
    "stats": {
      "thisMonth": {
        "requests": 245,
        "totalTokens": 450000,
        "totalCost": 1.35
      },
      "byModel": [
        {
          "model": "gpt-4-turbo",
          "requests": 120,
          "totalTokens": 250000,
          "totalCost": 0.75
        },
        {
          "model": "gpt-3-5-turbo",
          "requests": 125,
          "totalTokens": 200000,
          "totalCost": 0.30
        }
      ],
      "byProvider": [
        {
          "provider": "openai",
          "requests": 245,
          "totalTokens": 450000,
          "totalCost": 1.35
        }
      ]
    },
    "limits": {
      "requestsRemaining": 55,
      "tokensRemaining": 550000,
      "tier": "STARTER"
    }
  }
}
```

---

### Check Current Usage

Check current usage status and remaining limits.

**Endpoint**
```
GET /api/ai/usage/check
```

**Request**

```bash
curl -X GET http://localhost:3000/api/ai/usage/check \
  -H "Authorization: Bearer $TOKEN"
```

**Response**

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "currentUsage": {
      "requestsThisMinute": 3,
      "tokensThisMonth": 450000
    },
    "limits": {
      "requestsPerMinute": 50,
      "tokensPerMonth": 1000000,
      "tier": "STARTER"
    },
    "remaining": {
      "requestsThisMinute": 47,
      "tokensThisMonth": 550000
    }
  }
}
```

---

### Get Cache Statistics

Get metrics on cache performance.

**Endpoint**
```
GET /api/ai/cache/stats
```

**Request**

```bash
curl -X GET http://localhost:3000/api/ai/cache/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Response**

```json
{
  "success": true,
  "data": {
    "cacheStats": {
      "totalEntries": 342,
      "totalHits": 1250,
      "totalSize": "124.5 MB",
      "hitRate": "18.5%",
      "averageEntrySize": "373 KB",
      "oldestEntry": "2026-03-24T10:30:00Z",
      "newestEntry": "2026-03-31T10:30:00Z"
    }
  }
}
```

---

## Error Handling

### Common Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `INVALID_TOKEN` | 401 | Invalid or expired JWT | Refresh token |
| `LIMIT_EXCEEDED` | 429 | Rate limit or Monthly too many requests | Wait or upgrade |
| `INSUFFICIENT_QUOTA` | 403 | Monthly quota exceeded | Upgrade tier |
| `INVALID_MODEL` | 400 | Invalid model specified | Check model enum |
| `PROVIDER_UNAVAILABLE` | 503 | Provider not available | Try another model |
| `INVALID_REQUEST` | 400 | Missing or invalid parameters | Check request |
| `SERVER_ERROR` | 500 | Internal server error | Retry or contact support |

### Error Examples

**Invalid Token**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

**Quota Exceeded**
```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "Monthly token limit exceeded",
    "details": {
      "limit": 1000000,
      "used": 1000005,
      "tier": "STARTER"
    }
  }
}
```

**Invalid Request**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: prompt",
    "details": {
      "field": "prompt",
      "reason": "required"
    }
  }
}
```

---

## Rate Limiting

Requests are rate-limited based on subscription tier.

### Rate Limits

| Tier | Requests/Minute | Tokens/Month |
|------|---|---|
| Free | 10 | 100,000 |
| Starter | 50 | 1,000,000 |
| Professional | 200 | 10,000,000 |
| Enterprise | 1,000 | 100,000,000 |

### Rate Limit Headers

Response includes:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1680345600
```

### Handling Rate Limits

When hitting limit, implement exponential backoff:

```javascript
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function retryWithBackoff(fn, attempt = 0) {
  try {
    return await fn();
  } catch (error) {
    if (error.status === 429 && attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, attempt + 1);
    }
    throw error;
  }
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const client = new AIClient({
  baseURL: 'https://api.belsuite.com',
  token: 'your-jwt-token'
});

// Generate blog post
const blog = await client.generateBlogPost({
  topic: 'AI in Healthcare',
  wordCount: 2000,
  tone: 'professional'
});

// Generate social post
const tweet = await client.generateSocialPost({
  platform: 'Twitter',
  topic: 'New Product Launch'
});

// Generate image
const image = await client.generateImage({
  prompt: 'A futuristic AI assistant',
  quantity: 1,
  quality: 'hd'
});
```

### Python

```python
from belsuite_ai import AIClient

client = AIClient(
    api_key='your-jwt-token',
    base_url='https://api.belsuite.com'
)

# Generate blog post
blog = client.generate_blog_post(
    topic='AI in Healthcare',
    word_count=2000,
    tone='professional'
)

# Generate social post
tweet = client.generate_social_post(
    platform='Twitter',
    topic='New Product Launch'
)
```

### cURL

```bash
#!/bin/bash

TOKEN="your-jwt-token"
BASE_URL="https://api.belsuite.com"

# Generate blog post
curl -X POST "$BASE_URL/api/ai/blog-post" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in Healthcare",
    "wordCount": 2000,
    "tone": "professional"
  }' | jq .
```

---

## Webhooks (Coming Soon)

Subscribe to events:
- `generation.completed`
- `generation.failed`
- `quota.approaching`
- `quota.exceeded`

---

## Support

- **Issues**: Contact support@belsuite.com
- **Status**: Check status.belsuite.com
- **Documentation**: See [AI_SETUP_GUIDE.md](./AI_SETUP_GUIDE.md)
