import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const builtInTemplates = [
  {
    name: 'Blog Post',
    category: 'blog',
    description: 'SEO-optimized blog post for various topics',
    prompt: `You are an expert content writer. Write a comprehensive, SEO-optimized blog post about "{{topic}}".

Requirements:
- Tone: {{tone || 'professional'}}
- Target Audience: {{audience || 'general'}}
- Word Count: {{wordCount || 2000}} words
- Keywords to include: {{keywords || ''}}
- Include H2 and H3 subheadings
- Make it engaging and informative
- Add a compelling introduction and conclusion
- Include practical examples where relevant

Please write the blog post now:`,
    variables: ['topic', 'tone', 'audience', 'wordCount', 'keywords'],
  },
  {
    name: 'Social Media Post',
    category: 'social',
    description: 'Platform-specific social media content',
    prompt: `Create a compelling {{platform}} post about {{topic}}.

Requirements:
- Platform: {{platform || 'Twitter'}}
- Tone: {{tone || 'engaging'}}
- Include relevant hashtags: {{hashtags || ''}}
- Call-to-action: {{cta || 'Learn more'}}
- Keep it concise and shareable
- Make it platform-appropriate
{{emojis === 'true' ? '- Include relevant emojis' : ''}}

Write the post now:`,
    variables: ['platform', 'topic', 'tone', 'hashtags', 'cta', 'emojis'],
  },
  {
    name: 'Ad Copy',
    category: 'advertising',
    description: 'High-converting advertisement copy',
    prompt: `Write compelling ad copy for {{medium}}.

Product/Service: {{product}}
Target Audience: {{audience || 'general consumers'}}
Key Benefits: {{benefits || ''}}
Call-to-Action: {{cta || 'Shop now'}}
Tone: {{tone || 'persuasive'}}

Requirements:
- Create multiple variations (at least 3) with different angles
- Each variation should be punchy and compelling
- Highlight the main benefits
- Include a clear call-to-action
- Make it urgency-driven where appropriate
- Keep it within character limits for {{medium}}

Write the ad copy variations:`,
    variables: ['medium', 'product', 'audience', 'benefits', 'cta', 'tone'],
  },
  {
    name: 'Video Script',
    category: 'video',
    description: 'Structured video content script',
    prompt: `Write a {{videoDuration}} {{videoType}} video script about {{topic}}.

Details:
- Video Duration: {{videoDuration}} minutes
- Video Type: {{videoType || 'informational'}} (tutorial, promotional, educational, etc.)
- Tone: {{tone || 'engaging'}}
- Target Audience: {{audience || 'general'}}
- Key Points: {{keyPoints || ''}}

Requirements:
- Include: Hook, Main content, Call-to-action
- Format: Scene descriptions, Voiceover, Visuals
- Make it engaging and easy to follow
- Include timing estimates
- Add suggestions for B-roll or graphics

Write the video script:`,
    variables: ['topic', 'videoDuration', 'videoType', 'tone', 'audience', 'keyPoints'],
  },
  {
    name: 'Email Campaign',
    category: 'email',
    description: 'Marketing email template',
    prompt: `Write a {{emailType}} email for {{audience}}.

Campaign Details:
- Email Type: {{emailType || 'promotional'}} (promotional, newsletter, follow-up, welcome)
- Subject: {{emailSubject || ''}}
- Recipient: {{audience || 'customers'}}
- Main Message: {{mainMessage || ''}}
- Call-to-Action: {{cta || 'Learn more'}}

Requirements:
- Include subject line
- Pre-header text
- Compelling body copy
- Clear CTA button text
- Mobile-friendly format
- Add personalization tokens like {{firstName}}, {{companyName}}

Write the complete email:`,
    variables: ['emailType', 'subject', 'audience', 'mainMessage', 'cta'],
  },
  {
    name: 'Product Description',
    category: 'ecommerce',
    description: 'E-commerce product listing description',
    prompt: `Write a persuasive product description for {{productName}}.

Product Details:
- Product Name: {{productName}}
- Price: {{price || 'N/A'}}
- Category: {{category || ''}}
- Key Features: {{features || ''}}
- Target Audience: {{audience || 'general consumers'}}
- Tone: {{tone || 'professional yet friendly'}}

Requirements:
- Open with a hook highlighting the main benefit
- List key features and benefits
- Address common pain points
- Include social proof if relevant
- Create urgency where appropriate
- Include size/material/specifications info
- Write compelling benefits, not just features

Write the product description:`,
    variables: ['productName', 'price', 'category', 'features', 'audience', 'tone'],
  },
  {
    name: 'Headlines & Titles',
    category: 'headlines',
    description: 'Multiple headline variations',
    prompt: `Generate multiple compelling headline variations for: {{topic}}

Context:
- Topic: {{topic}}
- Purpose: {{purpose || 'click-through'}} (click-through, engagement, social share, etc.)
- Target Audience: {{audience || 'general'}}
- Tone: {{tone || 'professional'}}
- Style: {{style || 'varied'}} (curiosity, benefit-driven, urgency, etc.)

Requirements:
- Generate at least 10 different headline variations
- Mix different styles: curiosity gaps, questions, numbers, benefits
- Keep headlines concise but impactful
- Make them platform-appropriate
- Include A/B testing variations
- Number each headline

Generate the headlines:`,
    variables: ['topic', 'purpose', 'audience', 'tone', 'style'],
  },
];

async function seedPromptTemplates() {
  console.log('Starting prompt template seed...');

  try {
    for (const template of builtInTemplates) {
      const existing = await prisma.promptTemplate.findFirst({
        where: {
          name: template.name,
          isBuiltIn: true,
        },
      });

      if (existing) {
        console.log(`✓ Template "${template.name}" already exists, skipping...`);
        continue;
      }

      const created = await prisma.promptTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          description: template.description,
          prompt: template.prompt,
          variables: template.variables,
          isBuiltIn: true,
          isActive: true,
          isPublic: true,
        },
      });

      console.log(`✓ Created template: ${created.name}`);
    }

    console.log('\n✅ Prompt template seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding prompt templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedPromptTemplates();
