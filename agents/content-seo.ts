// ============================================
// CAREHUB AI AGENT — CONTENT & SEO (AGENT #12)
// ============================================
// Complete content & SEO engine:
// - Product descriptions (compelling, conversion-focused)
// - SEO meta titles & descriptions
// - Blog posts (organic traffic)
// - Social media captions (IG, FB, TikTok)
// - Ad copy (Facebook Ads, Google Ads)
// - Email marketing copy
// - Image alt texts
// - URL slug optimization
// - AI image generation prompts (IT/Design level)
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient } from '@/lib/shopify';
import { GroqMessage } from '@/lib/groq';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ContentRequest {
  type: ContentType;
  product?: string;
  topic?: string;
  keywords?: string[];
  tone?: string;
  platform?: string;
  maxLength?: number;
  style?: string;
  targetAudience?: string;
  additionalContext?: string;
}

export type ContentType =
  | 'product_description'
  | 'meta_title'
  | 'meta_description'
  | 'blog_post'
  | 'social_caption'
  | 'facebook_ad'
  | 'google_ad'
  | 'tiktok_script'
  | 'email_subject'
  | 'email_body'
  | 'image_alt'
  | 'url_slug'
  | 'image_prompt'
  | 'collection_description'
  | 'faq_content'
  | 'review_response';

export interface ContentResult {
  success: boolean;
  content: string;
  type: ContentType;
  metadata?: ContentMetadata;
  variants?: string[];
  message: string;
}

export interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  readingTime?: string;
  seoScore?: number;
  keywords?: string[];
  platform?: string;
}

export interface SEOAuditResult {
  success: boolean;
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  optimizedContent?: Record<string,>;
}

export interface SEOIssue {
  type: 'critical' | 'warning' | 'info';
  field: string;
  message: string;
  current?: string;
  suggested?: string;
}

export interface BulkContentResult {
  success: boolean;
  results: Array<{ productId: number; title: string; content: ContentResult }>;
  message: string;
  errors: string[];
}

// --------------------------------------------
// CONTENT & SEO CLASS
// --------------------------------------------

export class ContentSEO {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
  }

  // --------------------------------------------
  // MAIN GENERATE METHOD
  // --------------------------------------------

  async generate(request: ContentRequest): Promise {
    try {
      const preferences = await this.memory.getPreferences();
      const tone = request.tone || 'professional, compelling, trustworthy';
      const audience = request.targetAudience || `${preferences.targetMarket} online shoppers`;

      let content = '';
      let variants: string[] | undefined;

      switch (request.type) {
        case 'product_description':
          content = await this.generateProductDescription(request, tone, audience);
          break;
        case 'meta_title':
          ({ content, variants } = await this.generateMetaTitle(request));
          break;
        case 'meta_description':
          ({ content, variants } = await this.generateMetaDescription(request));
          break;
        case 'blog_post':
          content = await this.generateBlogPost(request, tone, audience);
          break;
        case 'social_caption':
          ({ content, variants } = await this.generateSocialCaption(request));
          break;
        case 'facebook_ad':
          ({ content, variants } = await this.generateFacebookAd(request));
          break;
        case 'google_ad':
          ({ content, variants } = await this.generateGoogleAd(request));
          break;
        case 'tiktok_script':
          content = await this.generateTikTokScript(request);
          break;
        case 'email_subject':
          ({ content, variants } = await this.generateEmailSubject(request));
          break;
        case 'email_body':
          content = await this.generateEmailBody(request, tone);
          break;
        case 'image_alt':
          content = await this.generateImageAlt(request);
          break;
        case 'url_slug':
          content = await this.generateUrlSlug(request);
          break;
        case 'image_prompt':
          content = await this.generateImagePrompt(request);
          break;
        case 'collection_description':
          content = await this.generateCollectionDescription(request, tone);
          break;
        case 'faq_content':
          content = await this.generateFAQ(request);
          break;
        case 'review_response':
          content = await this.generateReviewResponse(request);
          break;
      }

      const metadata: ContentMetadata = {
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        readingTime: `${Math.ceil(content.split(/\s+/).length / 200)} min`,
        keywords: request.keywords,
        platform: request.platform,
      };

      await this.memory.logAction({
        agent: 'content-seo',
        action: `generate_${request.type}`,
        input: JSON.stringify({ product: request.product, topic: request.topic }),
        output: content.substring(0, 100),
        success: true,
        duration: 0,
        reversible: false,
      });

      return {
        success: true,
        content,
        type: request.type,
        metadata,
        variants,
        message: `✅ ${request.type.replace(/_/g, ' ')} generated successfully!`,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        type: request.type,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  // --------------------------------------------
  // PRODUCT DESCRIPTION
  // --------------------------------------------

  private async generateProductDescription(request: ContentRequest, tone: string, audience: string): Promise {
    const prompt = `Write a high-converting e-commerce product description.

Product: ${request.product || 'Premium product'}
Keywords: ${request.keywords?.join(', ') || 'quality, premium, best'}
Tone: ${tone}
Audience: ${audience}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}

Structure:
1. Hook (1-2 sentences that create desire)
2. Key Benefits (5 bullet points with emojis)
3. "Why Choose This?" paragraph (3-4 sentences)
4. Social proof hint (1 sentence)
5. Urgency close (1 sentence)

Rules:
- Use HTML formatting: , , , , 
- 150-250 words
- Benefit-focused (not feature-focused)
- Include sensory language
- Every word must SELL
- NO filler, NO generic phrases
- Target US/UK audience language

Return ONLY the HTML content.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');
    return response.success ? response.content : this.fallbackDescription(request.product || 'Product');
  }

  // --------------------------------------------
  // META TITLE
  // --------------------------------------------

  private async generateMetaTitle(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const prompt = `Generate 3 SEO-optimized meta titles for this product/page:

Product/Page: ${request.product || request.topic || 'Product'}
Keywords: ${request.keywords?.join(', ') || ''}

Rules:
- Max 60 characters each
- Include primary keyword near the beginning
- Include brand name "CareHub" at end with | separator
- Make it click-worthy (curiosity or benefit)
- Use power words: Best, Premium, Top, Free, New

Return ONLY a JSON array of 3 titles:
["title 1", "title 2", "title 3"]`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const titles = JSON.parse(match[0]) as string[];
          return { content: titles[0], variants: titles };
        }
      }
    } catch { /* fall through */ }

    const fallback = `${request.product || 'Premium Products'} | CareHub`;
    return { content: fallback, variants: [fallback] };
  }

  // --------------------------------------------
  // META DESCRIPTION
  // --------------------------------------------

  private async generateMetaDescription(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const prompt = `Generate 3 SEO meta descriptions:

Product/Page: ${request.product || request.topic || 'Product'}
Keywords: ${request.keywords?.join(', ') || ''}

Rules:
- 150-160 characters each
- Include primary keyword naturally
- Include a call-to-action
- Create curiosity or highlight benefit
- Include "Free shipping" or "30-day returns" if relevant
- Make people want to click

Return ONLY a JSON array:
["desc 1", "desc 2", "desc 3"]`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const descs = JSON.parse(match[0]) as string[];
          return { content: descs[0], variants: descs };
        }
      }
    } catch { /* fall through */ }

    const fallback = `Shop ${request.product || 'premium products'} at CareHub. Free shipping, 30-day returns. Premium quality guaranteed.`;
    return { content: fallback, variants: [fallback] };
  }

  // --------------------------------------------
  // BLOG POST
  // --------------------------------------------

  private async generateBlogPost(request: ContentRequest, tone: string, audience: string): Promise {
    const prompt = `Write an SEO-optimized blog post for an e-commerce store.

Topic: ${request.topic || request.product || 'Shopping Guide'}
Keywords: ${request.keywords?.join(', ') || ''}
Tone: ${tone}
Audience: ${audience}
Word count: ${request.maxLength || 800}-${(request.maxLength || 800) + 200} words

Structure:
- Compelling H1 title (with primary keyword)
- Introduction (hook + promise, 2-3 sentences)
- 3-5 H2 subheadings with content under each
- Practical tips or advice
- Subtle product mentions (not salesy)
- Conclusion with CTA
- Meta description suggestion at the end

Rules:
- Use HTML: , , , , , , 
- Natural keyword placement (2-3% density)
- Valuable content first, promotion second
- US/UK English
- Include internal link suggestions: [LINK: /collections/xxx]
- Scannable format — short paragraphs, lists, bold key points

Return the complete HTML blog post.`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGemini(messages, 'creative_writing');
    return response.success ? response.content : 'Blog post generation failedPlease try again.';
  }

  // --------------------------------------------
  // SOCIAL MEDIA CAPTIONS
  // --------------------------------------------

  private async generateSocialCaption(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const platform = request.platform || 'instagram';

    const platformRules: Record = {
      instagram: 'Max 2200 chars, use emojis, 20-30 relevant hashtags at end, line breaks for readability, story-telling tone',
      facebook: 'Max 500 chars, conversational, include question to boost engagement, 3-5 hashtags, emoji usage moderate',
      tiktok: 'Max 150 chars, trending language, viral hooks, 5-8 hashtags, Gen-Z friendly, casual',
      twitter: 'Max 280 chars, punchy, witty, 2-3 hashtags max, create urgency',
      pinterest: 'Max 500 chars, descriptive, keyword-rich, how-to angle, aspirational',
    };

    const prompt = `Write 3 social media captions for ${platform}:

Product: ${request.product || 'Premium product'}
Platform: ${platform}
Rules: ${platformRules[platform] || platformRules.instagram}
Tone: ${request.tone || 'engaging, authentic, premium'}

Return ONLY a JSON array of 3 captions:
["caption 1", "caption 2", "caption 3"]

Each caption should have a different angle:
1. Benefit-focused
2. Social proof / testimonial style
3. Urgency / limited offer`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const captions = JSON.parse(match[0]) as string[];
          return { content: captions[0], variants: captions };
        }
      }
    } catch { /* fall through */ }

    return { content: `✨ ${request.product || 'New arrival'} now available! Shop link in bio 🛒`, variants: [] };
  }

  // --------------------------------------------
  // FACEBOOK AD COPY
  // --------------------------------------------

  private async generateFacebookAd(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const prompt = `Write 3 Facebook ad copy variations:

Product: ${request.product || 'Premium product'}
Goal: Purchase/Add to Cart
Audience: US/UK, 25-55, online shoppers

For each variation provide:
- Primary text (125 chars max for mobile)
- Headline (40 chars max)
- Description (30 chars max)
- CTA suggestion

Format as JSON array:
[
  {"primary": "text", "headline": "text", "description": "text", "cta": "Shop Now"},
  {"primary": "text", "headline": "text", "description": "text", "cta": "Get Offer"},
  {"primary": "text", "headline": "text", "description": "text", "cta": "Buy Now"}
]

Rules:
- Hook in first 3 words
- Create desire/curiosity
- Social proof or urgency
- Clear value proposition
- Compliant with Meta ad policies`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const ads = JSON.parse(match[0]) as Array<{ primary: string; headline: string; description: string; cta: string }>;
          const formatted = ads.map(ad =>
            `📝 Primary: ${ad.primary}\n📌 Headline: ${ad.headline}\n📋 Description: ${ad.description}\n🔘 CTA: ${ad.cta}`
          );
          return { content: formatted[0], variants: formatted };
        }
      }
    } catch { /* fall through */ }

    return { content: 'Ad copy generation failed. Try again.', variants: [] };
  }

  // --------------------------------------------
  // GOOGLE AD COPY
  // --------------------------------------------

  private async generateGoogleAd(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const prompt = `Write 3 Google Search Ad variations:

Product/Service: ${request.product || 'Premium product'}
Keywords: ${request.keywords?.join(', ') || ''}

For each, provide:
- Headline 1 (30 chars max)
- Headline 2 (30 chars max)
- Headline 3 (30 chars max)
- Description 1 (90 chars max)
- Description 2 (90 chars max)

Format as JSON array:
[
  {"h1": "", "h2": "", "h3": "", "d1": "", "d2": ""},
  {"h1": "", "h2": "", "h3": "", "d1": "", "d2": ""},
  {"h1": "", "h2": "", "h3": "", "d1": "", "d2": ""}
]

Rules:
- Include keywords in headlines
- Include CTA in at least one headline
- Highlight USP (free shipping, guarantee, etc.)
- Use numbers/stats where possible
- Match search intent`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const ads = JSON.parse(match[0]) as Array<{ h1: string; h2: string; h3: string; d1: string; d2: string }>;
          const formatted = ads.map(ad =>
            `H1: ${ad.h1}\nH2: ${ad.h2}\nH3: ${ad.h3}\nD1: ${ad.d1}\nD2: ${ad.d2}`
          );
          return { content: formatted[0], variants: formatted };
        }
      }
    } catch { /* fall through */ }

    return { content: 'Google ad generation failed. Try again.', variants: [] };
  }

  // --------------------------------------------
  // TIKTOK SCRIPT
  // --------------------------------------------

  private async generateTikTokScript(request: ContentRequest): Promise {
    const prompt = `Write a TikTok video script for a product promotion:

Product: ${request.product || 'Premium product'}
Duration: 15-30 seconds
Style: Trendy, fast-paced, authentic

Structure:
- HOOK (0-3s): Something that stops scrolling
- PROBLEM (3-8s): Relatable pain point
- SOLUTION (8-18s): Show the product as the answer
- SOCIAL PROOF (18-23s): Quick testimonial/stats
- CTA (23-30s): Clear action + urgency

Format:
[0-3s] HOOK: (what to say/show)
[3-8s] PROBLEM: (what to say/show)
[8-18s] SOLUTION: (what to say/show)
[18-23s] PROOF: (what to say/show)
[23-30s] CTA: (what to say/show)

Also include:
- Suggested trending sounds
- Text overlay suggestions
- Hashtags (8-10)

Make it feel organic, not ad-like.`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGemini(messages, 'creative_writing');
    return response.success ? response.content : 'TikTok script generation failed.';
  }

  // --------------------------------------------
  // EMAIL MARKETING
  // --------------------------------------------

  private async generateEmailSubject(request: ContentRequest): Promise<{ content: string; variants: string[] }> {
    const prompt = `Write 5 email subject lines for:

Purpose: ${request.topic || 'Product promotion'}
Product: ${request.product || ''}
Type: ${request.style || 'promotional'}

Rules:
- Max 50 characters each
- Create curiosity or urgency
- Use personalization [{first_name}] where appropriate
- Mix of styles: emoji, question, number, statement, FOMO
- High open rate optimized
- No spam trigger words

Return ONLY JSON array:
["subject 1", "subject 2", "subject 3", "subject 4", "subject 5"]`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    try {
      if (response.success) {
        const match = response.content.match(/$$[\s\S]*$$/);
        if (match) {
          const subjects = JSON.parse(match[0]) as string[];
          return { content: subjects[0], variants: subjects };
        }
      }
    } catch { /* fall through */ }

    return { content: `✨ Something special just for you`, variants: [] };
  }

  private async generateEmailBody(request: ContentRequest, tone: string): Promise {
    const prompt = `Write a marketing email body:

Purpose: ${request.topic || 'Product promotion'}
Product: ${request.product || ''}
Tone: ${tone}
Type: ${request.style || 'promotional'}

Structure:
- Personal greeting
- Hook (why they should read)
- Value/Offer (what's in it for them)
- Social proof (quick)
- CTA button text + urgency
- PS line (extra incentive)

Rules:
- Short paragraphs (1-2 sentences each)
- Mobile-friendly formatting
- Use HTML: , , , 
- Include [CTA_BUTTON: text | url] for button placement
- Max 200 words
- Conversational but professional

Return HTML email body content.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');
    return response.success ? response.content : 'Email generation failed.';
  }

  // --------------------------------------------
  // IMAGE ALT TEXT
  // --------------------------------------------

  private async generateImageAlt(request: ContentRequest): Promise {
    const prompt = `Generate SEO-optimized image alt text:

Product: ${request.product || 'Product image'}
Context: ${request.additionalContext || 'E-commerce product photo'}

Rules:
- 125 characters max
- Descriptive (what's in the image)
- Include primary keyword naturally
- Don't start with "Image of" or "Photo of"
- Accessible and helpful for screen readers

Return ONLY the alt text, nothing else.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'quick_response');
    return response.success ? response.content.replace(/^["']|["']$/g, '').trim() : request.product || 'Product image';
  }

  // --------------------------------------------
  // URL SLUG
  // --------------------------------------------

  private async generateUrlSlug(request: ContentRequest): Promise {
    const title = request.product || request.topic || '';

    // Generate clean slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);

    return slug;
  }

  // --------------------------------------------
  // AI IMAGE PROMPT (IT/Design Level)
  // --------------------------------------------

  private async generateImagePrompt(request: ContentRequest): Promise {
    const prompt = `Create a professional-level image generation prompt:

Subject: ${request.product || request.topic || 'E-commerce product'}
Style: ${request.style || 'Product photography, premium, clean'}
Purpose: ${request.additionalContext || 'E-commerce product listing'}

Return a detailed prompt with:
1. MAIN PROMPT: (detailed description of desired image)
2. STYLE: (photography/3D/illustration)
3. LIGHTING: (specific lighting setup)
4. BACKGROUND: (specific background)
5. CAMERA: (angle, lens, depth of field)
6. COLOR PALETTE: (specific colors)
7. MOOD: (atmosphere)
8. NEGATIVE PROMPT: (what to avoid)
9. TECHNICAL: (resolution, aspect ratio)

Think like a professional photographer/designer billing $500/hour.
Be extremely specific — every detail matters.`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGemini(messages, 'image_prompt');
    return response.success ? response.content : 'Image prompt generation failed.';
  }

  // --------------------------------------------
  // COLLECTION DESCRIPTION
  // --------------------------------------------

  private async generateCollectionDescription(request: ContentRequest, tone: string): Promise {
    const prompt = `Write a collection page description:

Collection: ${request.product || request.topic || 'Collection'}
Keywords: ${request.keywords?.join(', ') || ''}
Tone: ${tone}

Rules:
- 100-150 words
- SEO-optimized (include keywords naturally)
- Compelling opening sentence
- Mention variety/range
- Include value proposition
- End with subtle CTA
- HTML formatting: , 

Return ONLY the HTML content.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');
    return response.success ? response.content : `Explore our curated ${request.product || 'collection'} — premium quality at unbeatable prices.`;
  }

  // --------------------------------------------
  // FAQ CONTENT
  // --------------------------------------------

  private async generateFAQ(request: ContentRequest): Promise {
    const prompt = `Generate 5 FAQ items for:

Product/Topic: ${request.product || request.topic || 'E-commerce store'}
Target audience: US/UK shoppers

Format as HTML:

  Question?
  Answer


Rules:
- Address real purchase objections
- Include shipping, returns, quality, security questions
- Answers should be reassuring and specific
- 2-3 sentences per answer
- Build trust and reduce friction

Return ONLY the HTML.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');
    return response.success ? response.content : 'FAQ generation failedPlease try again.';
  }

  // --------------------------------------------
  // REVIEW RESPONSE
  // --------------------------------------------

  private async generateReviewResponse(request: ContentRequest): Promise {
    const prompt = `Write a professional response to this customer review:

Review: "${request.additionalContext || 'Great product, love it!'}"
Tone: Grateful, professional, personal

Rules:
- Thank them by name if available
- Reference specific details from their review
- 2-3 sentences max
- End with invitation to shop again
- Professional but warm
- Don't be generic or robotic

Return ONLY the response text.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'quick_response');
    return response.success ? response.content : 'Thank you for your wonderful review! We are thrilled you love your purchase.';
  }

  // --------------------------------------------
  // SEO AUDIT
  // --------------------------------------------

  async auditProductSEO(productId: number): Promise {
    try {
      const response = await this.shopify.getProduct(productId);
      if (!response.success || !response.data) {
        return { success: false, score: 0, issues: [], recommendations: [] };
      }

      const product = response.data.product;
      const issues: SEOIssue[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check title
      if (!product.title || product.title.length < 20) {
        issues.push({ type: 'warning', field: 'title', message: 'Title too short — aim for 50-60 characters', current: product.title });
        score -= 10;
      }
      if (product.title && product.title.length > 70) {
        issues.push({ type: 'warning', field: 'title', message: 'Title too long — will be truncated in search results' });
        score -= 5;
      }

      // Check description
      if (!product.body_html || product.body_html.length < 100) {
        issues.push({ type: 'critical', field: 'description', message: 'Description too short or missing — needs at least 300 characters' });
        score -= 20;
        recommendations.push('Generate a compelling product description with keywords');
      }

      // Check images
      if (!product.images || product.images.length === 0) {
        issues.push({ type: 'critical', field: 'images', message: 'No product images' });
        score -= 20;
      } else {
        const missingAlt = product.images.filter(img => !img.alt || img.alt.trim() === '');
        if (missingAlt.length > 0) {
          issues.push({ type: 'warning', field: 'images', message: `${missingAlt.length} images missing alt text` });
          score -= 5 * missingAlt.length;
          recommendations.push('Add descriptive alt text to all images');
        }
      }

      // Check tags
      if (!product.tags || product.tags.trim() === '') {
        issues.push({ type: 'info', field: 'tags', message: 'No product tags — add relevant tags for filtering and SEO' });
        score -= 5;
      }

      // Check product type
      if (!product.product_type) {
        issues.push({ type: 'info', field: 'product_type', message: 'Product type not set' });
        score -= 3;
      }

      // Check price has compare-at
      if (product.variants && product.variants[0]) {
        if (!product.variants[0].compare_at_price) {
          recommendations.push('Add a compare-at price to show savings and increase conversions');
        }
      }

      // General recommendations
      if (score >= 80) {
        recommendations.push('Good SEO foundation! Consider adding structured data for rich snippets.');
      } else {
        recommendations.push('Fix critical issues first, then optimize descriptions and images.');
      }

      return {
        success: true,
        score: Math.max(0, score),
        issues,
        recommendations,
      };
    } catch (error) {
      return { success: false, score: 0, issues: [], recommendations: [`Error: ${error instanceof Error ? error.message : 'Unknown'}`] };
    }
  }

  // --------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------

  async bulkGenerateDescriptions(productIds: number[]): Promise {
    const results: Array<{ productId: number; title: string; content: ContentResult }> = [];
    const errors: string[] = [];

    for (const productId of productIds) {
      try {
        const productResp = await this.shopify.getProduct(productId);
        if (!productResp.success || !productResp.data) {
          errors.push(`Product ${productId}: Not found`);
          continue;
        }

        const product = productResp.data.product;
        const content = await this.generate({
          type: 'product_description',
          product: product.title,
          keywords: product.tags?.split(',').map(t => t.trim()).slice(0, 5),
        });

        if (content.success && product.id) {
          // Update product description
          await this.shopify.updateProduct(product.id, {
            body_html: content.content,
          });

          results.push({ productId: product.id, title: product.title, content });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }

    return {
      success: results.length > 0,
      results,
      message: `✅ Generated descriptions for ${results.length}/${productIds.length} products`,
      errors,
    };
  }

  async bulkGenerateAltTexts(productIds: number[]): Promise {
    const results: Array<{ productId: number; title: string; content: ContentResult }> = [];
    const errors: string[] = [];

    for (const productId of productIds) {
      try {
        const productResp = await this.shopify.getProduct(productId);
        if (!productResp.success || !productResp.data) continue;

        const product = productResp.data.product;
        const images = product.images || [];

        for (const image of images) {
          if (!image.alt && image.id && product.id) {
            const alt = await this.generateImageAlt({
              type: 'image_alt',
              product: product.title,
            });

            await this.shopify.createProductImage(product.id, {
              ...image,
              src: image.src,
              alt,
            });
          }
        }

        results.push({
          productId: product.id || productId,
          title: product.title,
          content: { success: true, content: 'Alt texts generated', type: 'image_alt', message: '✅' },
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }

    return {
      success: results.length > 0,
      results,
      message: `✅ Generated alt texts for ${results.length} products`,
      errors,
    };
  }

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  private fallbackDescription(product: string): string {
    return `
${product} — Crafted with premium materials for those who demand excellence.

  ✅ Premium quality — built to last
  🚚 Free shipping on all orders
  ↩️ 30-day hassle-free returns
  🔒 Secure checkout guaranteed
  ⭐ Loved by thousands of happy customers

Why Choose This?
We've carefully selected this product for its exceptional quality and value. Join our community of satisfied customers who've made the upgrade.
⚡ Limited stock — order now before it's gone!`;
  }

  // Quick command handler
  async handleCommand(command: string): Promise {
    const lower = command.toLowerCase();

    if (lower.includes('description') || lower.includes('desc')) {
      const productMatch = command.match(/(?:for|of)\s+"?([^"]+)"?/i);
      return this.generate({ type: 'product_description', product: productMatch?.[1] || 'product' });
    }

    if (lower.includes('blog')) {
      const topicMatch = command.match(/(?:about|on|topic)\s+"?([^"]+)"?/i);
      return this.generate({ type: 'blog_post', topic: topicMatch?.[1] || 'shopping guide' });
    }

    if (lower.includes('instagram') || lower.includes('social') || lower.includes('caption')) {
      return this.generate({ type: 'social_caption', product: 'our latest product', platform: 'instagram' });
    }

    if (lower.includes('facebook ad') || lower.includes('fb ad')) {
      return this.generate({ type: 'facebook_ad', product: 'our product' });
    }

    if (lower.includes('google ad')) {
      return this.generate({ type: 'google_ad', product: 'our product' });
    }

    if (lower.includes('tiktok')) {
      return this.generate({ type: 'tiktok_script', product: 'our product' });
    }

    if (lower.includes('email')) {
      return this.generate({ type: 'email_body', topic: 'promotion' });
    }

    if (lower.includes('image prompt') || lower.includes('graphic')) {
      return this.generate({ type: 'image_prompt', product: 'product photography' });
    }

    return this.generate({ type: 'product_description', product: command });
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let contentSEOInstance: ContentSEO | null = null;

export function getContentSEO(): ContentSEO {
  if (!contentSEOInstance) {
    contentSEOInstance = new ContentSEO();
  }
  return contentSEOInstance;
}

export function resetContentSEO(): void {
  contentSEOInstance = null;
}
