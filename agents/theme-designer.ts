// ============================================
// CAREHUB AI AGENT — THEME DESIGNER (AGENT #4)
// ============================================
// World-class store designer. User sirf mood bataye:
// "premium dark", "luxury gold", "modern clean"
// — Agent khud COMPLETE theme design kare aur apply.
// Colors, fonts, CSS, header, footer, buttons, cards,
// animations, mobile-responsive — EVERYTHING.
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient } from '@/lib/shopify';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ThemeDesignRequest {
  mood: string;
  specificRequests?: string[];
  colors?: Partial<ThemeColors>;
  fonts?: Partial<ThemeFonts>;
  sections?: string[];
  event?: string;
  preserveExisting?: boolean;
}

export interface ThemeDesignResult {
  success: boolean;
  design: ThemeDesign;
  cssApplied: boolean;
  message: string;
  preview?: string;
}

export interface ThemeDesign {
  mood: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  style: ThemeStyle;
  css: string;
  appliedAt: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  heading: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  gradient1: string;
  gradient2: string;
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  headerBg: string;
  headerText: string;
  footerBg: string;
  footerText: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  announcementBg: string;
  announcementText: string;
  overlay: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  accent: string;
  headingWeight: string;
  bodyWeight: string;
  headingSizeDesktop: string;
  headingSizeMobile: string;
  bodySizeDesktop: string;
  bodySizeMobile: string;
  letterSpacingHeading: string;
  letterSpacingBody: string;
  lineHeightHeading: string;
  lineHeightBody: string;
}

export interface ThemeSpacing {
  sectionPaddingDesktop: string;
  sectionPaddingMobile: string;
  cardPadding: string;
  elementGap: string;
  containerMaxWidth: string;
  borderRadius: string;
  borderRadiusLarge: string;
  borderRadiusSmall: string;
  buttonPaddingX: string;
  buttonPaddingY: string;
}

export interface ThemeStyle {
  buttonStyle: 'rounded' | 'sharp' | 'pill';
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'strong';
  animationLevel: 'none' | 'subtle' | 'moderate' | 'rich';
  imageStyle: 'rounded' | 'sharp' | 'circle';
  layoutDensity: 'spacious' | 'normal' | 'compact';
  headerStyle: 'transparent' | 'solid' | 'sticky' | 'minimal';
  cardStyle: 'flat' | 'elevated' | 'bordered' | 'glass';
  hoverEffect: 'none' | 'lift' | 'glow' | 'scale' | 'border';
}

// --------------------------------------------
// PRESET THEMES
// --------------------------------------------

const THEME_PRESETS: Record<string, ThemeDesign> = {
  'premium-dark': {
    mood: 'premium-dark',
    colors: {
      primary: '#c9a962',
      secondary: '#1a1a2e',
      accent: '#e2c275',
      background: '#0a0a0f',
      surface: '#12121a',
      text: '#e8e8e8',
      textMuted: '#8a8a9a',
      heading: '#ffffff',
      border: '#2a2a3a',
      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      gradient1: '#c9a962',
      gradient2: '#8b6914',
      buttonBg: '#c9a962',
      buttonText: '#0a0a0f',
      buttonHover: '#e2c275',
      headerBg: '#0a0a0f',
      headerText: '#ffffff',
      footerBg: '#050508',
      footerText: '#8a8a9a',
      cardBg: '#12121a',
      cardBorder: '#2a2a3a',
      badgeBg: '#c9a962',
      badgeText: '#0a0a0f',
      announcementBg: '#c9a962',
      announcementText: '#0a0a0f',
      overlay: 'rgba(0,0,0,0.7)',
    } as ThemeColors,
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
      accent: 'Cormorant Garamond',
      headingWeight: '700',
      bodyWeight: '400',
      headingSizeDesktop: '3.5rem',
      headingSizeMobile: '2rem',
      bodySizeDesktop: '1rem',
      bodySizeMobile: '0.9rem',
      letterSpacingHeading: '-0.02em',
      letterSpacingBody: '0',
      lineHeightHeading: '1.2',
      lineHeightBody: '1.7',
    },
    spacing: {
      sectionPaddingDesktop: '100px',
      sectionPaddingMobile: '60px',
      cardPadding: '24px',
      elementGap: '20px',
      containerMaxWidth: '1200px',
      borderRadius: '8px',
      borderRadiusLarge: '16px',
      borderRadiusSmall: '4px',
      buttonPaddingX: '32px',
      buttonPaddingY: '14px',
    },
    style: {
      buttonStyle: 'rounded',
      shadowIntensity: 'subtle',
      animationLevel: 'moderate',
      imageStyle: 'rounded',
      layoutDensity: 'spacious',
      headerStyle: 'sticky',
      cardStyle: 'elevated',
      hoverEffect: 'glow',
    },
  },
  'modern-clean': {
    mood: 'modern-clean',
    colors: {
      primary: '#2563eb',
      secondary: '#f8fafc',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#334155',
      textMuted: '#64748b',
      heading: '#0f172a',
      border: '#e2e8f0',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      gradient1: '#2563eb',
      gradient2: '#7c3aed',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      buttonHover: '#1d4ed8',
      headerBg: '#ffffff',
      headerText: '#0f172a',
      footerBg: '#0f172a',
      footerText: '#94a3b8',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      badgeBg: '#2563eb',
      badgeText: '#ffffff',
      announcementBg: '#2563eb',
      announcementText: '#ffffff',
      overlay: 'rgba(0,0,0,0.5)',
    } as ThemeColors,
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Inter',
      accent: 'DM Sans',
      headingWeight: '800',
      bodyWeight: '400',
      headingSizeDesktop: '3rem',
      headingSizeMobile: '1.8rem',
      bodySizeDesktop: '1rem',
      bodySizeMobile: '0.9rem',
      letterSpacingHeading: '-0.03em',
      letterSpacingBody: '0',
      lineHeightHeading: '1.15',
      lineHeightBody: '1.65',
    },
    spacing: {
      sectionPaddingDesktop: '80px',
      sectionPaddingMobile: '50px',
      cardPadding: '20px',
      elementGap: '16px',
      containerMaxWidth: '1140px',
      borderRadius: '12px',
      borderRadiusLarge: '20px',
      borderRadiusSmall: '6px',
      buttonPaddingX: '28px',
      buttonPaddingY: '12px',
    },
    style: {
      buttonStyle: 'pill',
      shadowIntensity: 'medium',
      animationLevel: 'subtle',
      imageStyle: 'rounded',
      layoutDensity: 'normal',
      headerStyle: 'solid',
      cardStyle: 'elevated',
      hoverEffect: 'lift',
    },
  },
  'luxury-gold': {
    mood: 'luxury-gold',
    colors: {
      primary: '#d4af37',
      secondary: '#1c1c1c',
      accent: '#ffd700',
      background: '#0d0d0d',
      surface: '#1a1a1a',
      text: '#d4d4d4',
      textMuted: '#737373',
      heading: '#ffffff',
      border: '#333333',
      success: '#22c55e',
      error: '#dc2626',
      warning: '#eab308',
      gradient1: '#d4af37',
      gradient2: '#b8860b',
      buttonBg: 'linear-gradient(135deg, #d4af37, #b8860b)',
      buttonText: '#000000',
      buttonHover: '#ffd700',
      headerBg: 'rgba(13,13,13,0.95)',
      headerText: '#d4af37',
      footerBg: '#050505',
      footerText: '#737373',
      cardBg: '#1a1a1a',
      cardBorder: '#2a2a2a',
      badgeBg: '#d4af37',
      badgeText: '#000000',
      announcementBg: '#d4af37',
      announcementText: '#000000',
      overlay: 'rgba(0,0,0,0.8)',
    } as ThemeColors,
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato',
      accent: 'Cinzel',
      headingWeight: '600',
      bodyWeight: '300',
      headingSizeDesktop: '4rem',
      headingSizeMobile: '2.2rem',
      bodySizeDesktop: '1.05rem',
      bodySizeMobile: '0.95rem',
      letterSpacingHeading: '0.05em',
      letterSpacingBody: '0.01em',
      lineHeightHeading: '1.1',
      lineHeightBody: '1.8',
    },
    spacing: {
      sectionPaddingDesktop: '120px',
      sectionPaddingMobile: '70px',
      cardPadding: '28px',
      elementGap: '24px',
      containerMaxWidth: '1100px',
      borderRadius: '4px',
      borderRadiusLarge: '8px',
      borderRadiusSmall: '2px',
      buttonPaddingX: '40px',
      buttonPaddingY: '16px',
    },
    style: {
      buttonStyle: 'sharp',
      shadowIntensity: 'subtle',
      animationLevel: 'rich',
      imageStyle: 'sharp',
      layoutDensity: 'spacious',
      headerStyle: 'transparent',
      cardStyle: 'bordered',
      hoverEffect: 'glow',
    },
  },
};

// --------------------------------------------
// THEME DESIGNER CLASS
// --------------------------------------------

export class ThemeDesigner {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
  }

  // --------------------------------------------
  // MAIN DESIGN METHOD
  // --------------------------------------------

  async designTheme(request: ThemeDesignRequest): Promise<ThemeDesignResult> {
    const startTime = Date.now();

    try {
      // Step 1: Get user preferences from memory
      const preferences = await this.memory.getPreferences();
      const storeState = await this.memory.getStoreState();

      // Step 2: Check for preset match
      const presetKey = this.findPresetMatch(request.mood);
      let design: ThemeDesign;

      if (presetKey && !request.specificRequests?.length) {
        // Use preset as base
        design = this.buildFromPreset(presetKey, request);
      } else {
        // Generate custom design via AI
        design = await this.generateCustomDesign(request, preferences);
      }

      // Step 3: Override with specific user requests
      if (request.colors) {
        design.colors = { ...design.colors, ...request.colors };
      }
      if (request.fonts) {
        design.fonts = { ...design.fonts, ...request.fonts };
      }

      // Step 4: Generate complete CSS
      design.css = await this.generateCSS(design);

      // Step 5: Apply to Shopify store
      let cssApplied = false;
      if (this.shopify.isConfigured()) {
        cssApplied = await this.applyToStore(design);
      }

      // Step 6: Save to memory
      await this.memory.recordThemeChange({
        id: Date.now(),
        name: `Theme: ${request.mood}`,
        customCSS: design.css,
        mood: request.mood,
      });

      // Step 7: Update preferences
      await this.memory.setPreferences({
        designStyle: request.mood,
        mood: request.mood,
        colorPreference: this.detectColorPreference(design.colors),
      });

      return {
        success: true,
        design,
        cssApplied,
        message: cssApplied
          ? `✅ Theme "${request.mood}" designed and applied to your store!`
          : `✅ Theme "${request.mood}" designed! Connect Shopify to apply automatically.`,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        design: {} as ThemeDesign,
        cssApplied: false,
        message: `❌ Error designing theme: ${errMsg}`,
      };
    }
  }

  // --------------------------------------------
  // CUSTOM DESIGN GENERATION
  // --------------------------------------------

  private async generateCustomDesign(
    request: ThemeDesignRequest,
    preferences: { designStyle: string; colorPreference: string; mood: string }
  ): Promise<ThemeDesign> {
    const prompt = `Design a complete e-commerce store theme based on this mood/request:

Mood: "${request.mood}"
${request.specificRequests ? `Specific requests: ${request.specificRequests.join(', ')}` : ''}
${request.event ? `Event/occasion: ${request.event}` : ''}
User's general style preference: ${preferences.designStyle}
User's color preference: ${preferences.colorPreference}
Target market: US/UK premium online shoppers

Return ONLY valid JSON with this EXACT structure:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "heading": "#hex",
    "border": "#hex",
    "success": "#hex",
    "error": "#hex",
    "warning": "#hex",
    "gradient1": "#hex",
    "gradient2": "#hex",
    "buttonBg": "#hex or gradient",
    "buttonText": "#hex",
    "buttonHover": "#hex",
    "headerBg": "#hex or rgba",
    "headerText": "#hex",
    "footerBg": "#hex",
    "footerText": "#hex",
    "cardBg": "#hex",
    "cardBorder": "#hex",
    "badgeBg": "#hex",
    "badgeText": "#hex",
    "announcementBg": "#hex",
    "announcementText": "#hex",
    "overlay": "rgba value"
  },
  "fonts": {
    "heading": "Google Font name",
    "body": "Google Font name",
    "accent": "Google Font name",
    "headingWeight": "number",
    "bodyWeight": "number",
    "headingSizeDesktop": "rem value",
    "headingSizeMobile": "rem value",
    "bodySizeDesktop": "rem value",
    "bodySizeMobile": "rem value",
    "letterSpacingHeading": "em value",
    "letterSpacingBody": "em value",
    "lineHeightHeading": "number",
    "lineHeightBody": "number"
  },
  "spacing": {
    "sectionPaddingDesktop": "px value",
    "sectionPaddingMobile": "px value",
    "cardPadding": "px value",
    "elementGap": "px value",
    "containerMaxWidth": "px value",
    "borderRadius": "px value",
    "borderRadiusLarge": "px value",
    "borderRadiusSmall": "px value",
    "buttonPaddingX": "px value",
    "buttonPaddingY": "px value"
  },
  "style": {
    "buttonStyle": "rounded|sharp|pill",
    "shadowIntensity": "none|subtle|medium|strong",
    "animationLevel": "none|subtle|moderate|rich",
    "imageStyle": "rounded|sharp|circle",
    "layoutDensity": "spacious|normal|compact",
    "headerStyle": "transparent|solid|sticky|minimal",
    "cardStyle": "flat|elevated|bordered|glass",
    "hoverEffect": "none|lift|glow|scale|border"
  }
}

IMPORTANT:
- Choose colors that create a cohesive, professional palette
- Ensure sufficient contrast for readability (WCAG AA)
- Pick Google Fonts that load fast and match the mood
- Design for HIGH CONVERSION — every choice should help sell
- Think like a $10,000 agency designer`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGeminiJSON<{
      colors: ThemeColors;
      fonts: ThemeFonts;
      spacing: ThemeSpacing;
      style: ThemeStyle;
    }>(messages, 'design_decision');

    if (response.success && response.data) {
      return {
        mood: request.mood,
        colors: response.data.colors,
        fonts: response.data.fonts,
        spacing: response.data.spacing,
        style: response.data.style,
        css: '',
        appliedAt: Date.now(),
      };
    }

    // Fallback to premium-dark preset
    const fallbackPreset = THEME_PRESETS['premium-dark']!;
    return {
      mood: request.mood,
      colors: fallbackPreset.colors as ThemeColors,
      fonts: fallbackPreset.fonts as ThemeFonts,
      spacing: fallbackPreset.spacing as ThemeSpacing,
      style: fallbackPreset.style as ThemeStyle,
      css: '',
      appliedAt: Date.now(),
    };
  }

  // --------------------------------------------
  // CSS GENERATION
  // --------------------------------------------

  private async generateCSS(design: ThemeDesign): Promise<string> {
    const { colors, fonts, spacing, style } = design;

    // Generate comprehensive CSS
    const css = `
/* ============================================ */
/* CAREHUB THEME — ${design.mood.toUpperCase()} */
/* Generated: ${new Date().toISOString()} */
/* ============================================ */

/* --- Google Fonts Import --- */
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.heading)}:wght@400;500;600;700;800;900&family=${encodeURIComponent(fonts.body)}:wght@300;400;500;600;700&family=${encodeURIComponent(fonts.accent)}:wght@400;500;600;700&display=swap');

/* --- CSS Custom Properties --- */
:root {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-heading: ${colors.heading};
  --color-border: ${colors.border};
  --color-success: ${colors.success};
  --color-error: ${colors.error};
  --color-warning: ${colors.warning};
  --color-gradient-1: ${colors.gradient1};
  --color-gradient-2: ${colors.gradient2};
  --color-button-bg: ${colors.buttonBg};
  --color-button-text: ${colors.buttonText};
  --color-button-hover: ${colors.buttonHover};
  --color-header-bg: ${colors.headerBg};
  --color-header-text: ${colors.headerText};
  --color-footer-bg: ${colors.footerBg};
  --color-footer-text: ${colors.footerText};
  --color-card-bg: ${colors.cardBg};
  --color-card-border: ${colors.cardBorder};
  --color-badge-bg: ${colors.badgeBg};
  --color-badge-text: ${colors.badgeText};
  --color-announcement-bg: ${colors.announcementBg};
  --color-announcement-text: ${colors.announcementText};
  --color-overlay: ${colors.overlay};

  /* Typography */
  --font-heading: '${fonts.heading}', serif;
  --font-body: '${fonts.body}', sans-serif;
  --font-accent: '${fonts.accent}', serif;
  --font-heading-weight: ${fonts.headingWeight};
  --font-body-weight: ${fonts.bodyWeight};
  --font-heading-size: ${fonts.headingSizeDesktop};
  --font-body-size: ${fonts.bodySizeDesktop};
  --letter-spacing-heading: ${fonts.letterSpacingHeading};
  --letter-spacing-body: ${fonts.letterSpacingBody};
  --line-height-heading: ${fonts.lineHeightHeading};
  --line-height-body: ${fonts.lineHeightBody};

  /* Spacing */
  --section-padding: ${spacing.sectionPaddingDesktop};
  --card-padding: ${spacing.cardPadding};
  --element-gap: ${spacing.elementGap};
  --container-max-width: ${spacing.containerMaxWidth};
  --border-radius: ${spacing.borderRadius};
  --border-radius-lg: ${spacing.borderRadiusLarge};
  --border-radius-sm: ${spacing.borderRadiusSmall};
  --button-padding-x: ${spacing.buttonPaddingX};
  --button-padding-y: ${spacing.buttonPaddingY};

  /* Shadows */
  --shadow-sm: ${style.shadowIntensity === 'none' ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'};
  --shadow-md: ${style.shadowIntensity === 'none' ? 'none' : style.shadowIntensity === 'subtle' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 15px rgba(0,0,0,0.15)'};
  --shadow-lg: ${style.shadowIntensity === 'none' ? 'none' : style.shadowIntensity === 'strong' ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.15)'};
  --shadow-glow: 0 0 20px ${colors.primary}33;

  /* Transitions */
  --transition-fast: ${style.animationLevel === 'none' ? '0s' : '0.15s'} ease;
  --transition-base: ${style.animationLevel === 'none' ? '0s' : '0.3s'} ease;
  --transition-slow: ${style.animationLevel === 'none' ? '0s' : '0.5s'} ease;
}

/* --- Base Styles --- */
body,
.shopify-section {
  background-color: var(--color-background) !important;
  color: var(--color-text) !important;
  font-family: var(--font-body) !important;
  font-weight: var(--font-body-weight);
  font-size: var(--font-body-size);
  letter-spacing: var(--letter-spacing-body);
  line-height: var(--line-height-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- Typography --- */
h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6 {
  font-family: var(--font-heading) !important;
  font-weight: var(--font-heading-weight) !important;
  color: var(--color-heading) !important;
  letter-spacing: var(--letter-spacing-heading);
  line-height: var(--line-height-heading);
}

h1, .h1 { font-size: var(--font-heading-size) !important; }
h2, .h2 { font-size: calc(var(--font-heading-size) * 0.75) !important; }
h3, .h3 { font-size: calc(var(--font-heading-size) * 0.6) !important; }
h4, .h4 { font-size: calc(var(--font-heading-size) * 0.5) !important; }

p, li, span, div {
  color: var(--color-text);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

a:hover {
  color: var(--color-accent);
}

/* --- Header --- */
.header-wrapper,
.section-header,
header,
#shopify-section-header {
  background: var(--color-header-bg) !important;
  ${style.headerStyle === 'sticky' ? 'position: sticky; top: 0; z-index: 1000;' : ''}
  ${style.headerStyle === 'transparent' ? 'background: transparent !important;' : ''}
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition-base);
}

.header-wrapper *,
header a,
header span,
.header__heading-link {
  color: var(--color-header-text) !important;
}

header nav a:hover {
  color: var(--color-primary) !important;
}

/* --- Announcement Bar --- */
.announcement-bar,
.utility-bar {
  background: var(--color-announcement-bg) !important;
  color: var(--color-announcement-text) !important;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  padding: 8px 0;
}

.announcement-bar * {
  color: var(--color-announcement-text) !important;
}

/* --- Buttons --- */
.btn,
.button,
button[type="submit"],
.shopify-payment-button button,
.product-form__submit,
.cart__submit,
a.btn,
.btn--primary {
  background: var(--color-button-bg) !important;
  color: var(--color-button-text) !important;
  font-family: var(--font-body) !important;
  font-weight: 600 !important;
  padding: var(--button-padding-y) var(--button-padding-x) !important;
  border: none !important;
  border-radius: ${style.buttonStyle === 'pill' ? '50px' : style.buttonStyle === 'sharp' ? '0' : 'var(--border-radius)'} !important;
  cursor: pointer;
  transition: var(--transition-base) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-sm);
  text-decoration: none !important;
}

.btn:hover,
.button:hover,
button[type="submit"]:hover,
.shopify-payment-button button:hover,
.product-form__submit:hover,
.cart__submit:hover {
  background: var(--color-button-hover) !important;
  transform: ${style.hoverEffect === 'lift' ? 'translateY(-2px)' : style.hoverEffect === 'scale' ? 'scale(1.02)' : 'none'};
  box-shadow: ${style.hoverEffect === 'glow' ? 'var(--shadow-glow)' : 'var(--shadow-md)'};
}

/* Secondary button */
.btn--secondary,
.button--secondary {
  background: transparent !important;
  color: var(--color-primary) !important;
  border: 2px solid var(--color-primary) !important;
}

.btn--secondary:hover,
.button--secondary:hover {
  background: var(--color-primary) !important;
  color: var(--color-button-text) !important;
}

/* --- Cards / Product Cards --- */
.card,
.product-card,
.card-wrapper,
.grid__item .card,
.collection-product-card {
  background: var(--color-card-bg) !important;
  border: ${style.cardStyle === 'bordered' ? `1px solid var(--color-card-border)` : 'none'} !important;
  border-radius: var(--border-radius-lg) !important;
  overflow: hidden;
  transition: var(--transition-base) !important;
  box-shadow: ${style.cardStyle === 'elevated' ? 'var(--shadow-md)' : 'none'};
  ${style.cardStyle === 'glass' ? `backdrop-filter: blur(10px); background: ${colors.cardBg}cc !important;` : ''}
}

.card:hover,
.product-card:hover,
.card-wrapper:hover {
  transform: ${style.hoverEffect === 'lift' ? 'translateY(-5px)' : style.hoverEffect === 'scale' ? 'scale(1.02)' : 'none'};
  box-shadow: ${style.hoverEffect !== 'none' ? 'var(--shadow-lg)' : 'var(--shadow-md)'};
  border-color: ${style.hoverEffect === 'border' ? 'var(--color-primary)' : 'var(--color-card-border)'} !important;
  ${style.hoverEffect === 'glow' ? `box-shadow: var(--shadow-glow);` : ''}
}

.card__heading,
.card__heading a,
.product-card__title {
  color: var(--color-heading) !important;
  font-family: var(--font-body) !important;
  font-weight: 600 !important;
}

.card .price,
.price-item,
.product-card__price {
  color: var(--color-primary) !important;
  font-weight: 700 !important;
  font-size: 1.1rem;
}

/* Card images */
.card img,
.product-card img,
.card-wrapper img {
  border-radius: ${style.imageStyle === 'rounded' ? 'var(--border-radius)' : style.imageStyle === 'circle' ? '50%' : '0'};
  transition: var(--transition-base);
}

.card:hover img {
  transform: scale(1.05);
}

/* --- Product Page --- */
.product__title,
.product-single__title {
  font-family: var(--font-heading) !important;
  font-size: calc(var(--font-heading-size) * 0.7) !important;
  color: var(--color-heading) !important;
}

.product__price,
.product-single__price {
  color: var(--color-primary) !important;
  font-size: 1.5rem !important;
  font-weight: 700 !important;
}

.product__description,
.product-single__description {
  color: var(--color-text) !important;
  line-height: var(--line-height-body) !important;
}

/* Compare price (strikethrough) */
.price--compare,
.compare-price,
s, del {
  color: var(--color-text-muted) !important;
  text-decoration: line-through;
  font-size: 0.9em;
}

/* --- Sections --- */
.shopify-section {
  padding: var(--section-padding) 0;
}

.page-width,
.container {
  max-width: var(--container-max-width) !important;
  margin: 0 auto;
  padding: 0 20px;
}

/* --- Footer --- */
footer,
.footer,
#shopify-section-footer {
  background: var(--color-footer-bg) !important;
  color: var(--color-footer-text) !important;
  padding: 60px 0 30px;
  border-top: 1px solid var(--color-border);
}

footer *,
.footer * {
  color: var(--color-footer-text) !important;
}

footer a:hover,
.footer a:hover {
  color: var(--color-primary) !important;
}

footer h3,
footer h4,
.footer__heading {
  color: var(--color-heading) !important;
  font-family: var(--font-heading) !important;
}

/* --- Forms & Inputs --- */
input, textarea, select,
.field__input {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: var(--border-radius-sm) !important;
  color: var(--color-text) !important;
  padding: 12px 16px !important;
  font-family: var(--font-body) !important;
  transition: var(--transition-fast);
}

input:focus, textarea:focus, select:focus,
.field__input:focus {
  border-color: var(--color-primary) !important;
  outline: none !important;
  box-shadow: 0 0 0 3px ${colors.primary}22 !important;
}

/* --- Badges / Tags --- */
.badge,
.tag,
.product__badge,
.card__badge {
  background: var(--color-badge-bg) !important;
  color: var(--color-badge-text) !important;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: var(--border-radius-sm);
}

/* Sale badge */
.badge--sale,
.on-sale-badge {
  background: var(--color-error) !important;
  color: #ffffff !important;
}

/* --- Cart --- */
.cart-item,
.cart__item {
  border-bottom: 1px solid var(--color-border) !important;
  padding: 20px 0 !important;
}

.cart__footer,
.cart-footer {
  border-top: 1px solid var(--color-border) !important;
}

/* --- Collection Page --- */
.collection-hero,
.collection-banner {
  background: var(--color-surface);
  padding: 40px 0;
  text-align: center;
}

/* --- Scrollbar --- */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* --- Selection --- */
::selection {
  background: ${colors.primary}44;
  color: var(--color-heading);
}

/* --- Animations --- */
${style.animationLevel !== 'none' ? `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shopify-section {
  animation: fadeInUp 0.6s ease forwards;
}

${style.animationLevel === 'rich' ? `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.btn:hover {
  animation: pulse 2s infinite;
}
` : ''}
` : ''}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  :root {
    --font-heading-size: ${fonts.headingSizeMobile};
    --font-body-size: ${fonts.bodySizeMobile};
    --section-padding: ${spacing.sectionPaddingMobile};
    --card-padding: 16px;
    --button-padding-x: 24px;
    --button-padding-y: 12px;
  }

  .page-width {
    padding: 0 15px;
  }

  h1, .h1 {
    font-size: ${fonts.headingSizeMobile} !important;
  }

  .card:hover {
    transform: none;
  }
}

@media (max-width: 480px) {
  :root {
    --section-padding: 40px;
    --element-gap: 12px;
  }

  .btn, .button {
    width: 100%;
    text-align: center;
  }
}

/* --- Print --- */
@media print {
  body {
    background: white !important;
    color: black !important;
  }
}

/* --- Accessibility --- */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

*:focus-visible {
  outline: 2px solid var(--color-primary) !important;
  outline-offset: 2px;
}
`;

    return css.trim();
  }

  // --------------------------------------------
  // APPLY TO SHOPIFY STORE
  // --------------------------------------------

  private async applyToStore(design: ThemeDesign): Promise<boolean> {
    try {
      // Get main theme
      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) {
        console.error('[ThemeDesigner] Could not find main theme');
        return false;
      }

      const themeId = themeResponse.data.id;

      // Upload CSS as theme asset
      const assetResult = await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-theme.css',
        value: design.css,
      });

      if (!assetResult.success) {
        console.error('[ThemeDesigner] Failed to upload CSS asset:', assetResult.error);
        return false;
      }

      // Inject CSS link into theme.liquid
      const themeContent = await this.shopify.getThemeAsset(themeId, 'layout/theme.liquid');
      if (themeContent.success && themeContent.data?.asset.value) {
        let liquid = themeContent.data.asset.value;

        // Check if already injected 
          const cssLink = `{{ 'carehub-theme.css' | asset_url | stylesheet_tag }}`;
const colorOverride = `<style>
body,html{background:#0a0a0f!important}
[class*="color-scheme"],[class*="color-background"]{background:#0a0a0f!important;color:#e8e8e8!important}
</style>`;

if (!liquid.includes('carehub-theme.css')) {
  liquid = liquid.replace(
    '{{ content_for_header }}',
    `{{ content_for_header }}\n  ${cssLink}\n  ${colorOverride}`
  );


          await this.shopify.updateThemeAsset(themeId, {
            key: 'layout/theme.liquid',
            value: liquid,
          });
        }
      }
// Update Horizon color scheme settings
try {
  const settingsAsset = await this.shopify.getThemeAsset(themeId, 'config/settings_data.json');
  if (settingsAsset.success && settingsAsset.data?.asset.value) {
    const settings = JSON.parse(settingsAsset.data.asset.value);
    
    const darkColors = {
      "background": design.colors.background,
      "foreground_heading": design.colors.heading,
      "foreground": design.colors.text,
      "primary": design.colors.text,
      "primary_hover": design.colors.accent,
      "border": design.colors.border,
      "shadow": "#000000",
      "primary_button_background": design.colors.buttonBg,
      "primary_button_text": design.colors.buttonText,
      "primary_button_border": design.colors.buttonBg,
      "primary_button_hover_background": design.colors.buttonHover,
      "primary_button_hover_text": design.colors.buttonText,
      "primary_button_hover_border": design.colors.buttonHover,
      "secondary_button_background": "rgba(0,0,0,0)",
      "secondary_button_text": design.colors.primary,
      "secondary_button_border": design.colors.primary,
      "secondary_button_hover_background": design.colors.surface,
      "secondary_button_hover_text": design.colors.heading,
      "secondary_button_hover_border": design.colors.accent,
      "input_background": design.colors.surface,
      "input_text_color": design.colors.text,
      "input_border_color": design.colors.border,
      "input_hover_background": design.colors.surface
    };

    // Update all schemes in current
    const schemeKeys = Object.keys(settings.current?.color_schemes || {});
    for (const key of schemeKeys) {
      if (settings.current.color_schemes[key]?.settings) {
        settings.current.color_schemes[key].settings = {
          ...settings.current.color_schemes[key].settings,
          ...darkColors
        };
      }
    }

    await this.shopify.updateThemeAsset(themeId, {
      key: 'config/settings_data.json',
      value: JSON.stringify(settings, null, 2),
    });
  }
} catch (e) {
  console.error('[ThemeDesigner] Settings update failed:', e);
}
      console.log('[ThemeDesigner] Theme applied successfully ✅');
      return true;
    } catch (error) {
      console.error('[ThemeDesigner] Error applying theme:', error);
      return false;
    }
  }

  // --------------------------------------------
  // THEME MODIFICATION (Change/Tweak)
  // --------------------------------------------

  async modifyTheme(modification: string): Promise<ThemeDesignResult> {
    // Get current theme from memory
    const storeState = await this.memory.getStoreState();
    const currentMood = storeState.currentTheme?.mood || 'premium';

    // Interpret modification
    const prompt = `Current store theme mood: "${currentMood}"
User wants to modify: "${modification}"

What specific changes should be made? Return JSON:
{
  "newMood": "updated mood description",
  "colorChanges": { "key": "new #hex value" },
  "fontChanges": { "key": "new value" },
  "spacingChanges": { "key": "new value" },
  "styleChanges": { "key": "new value" }
}

Only include keys that need to change. Keep everything else the same.`;

    const response = await this.router.useGeminiJSON<{
      newMood: string;
      colorChanges?: Partial<ThemeColors>;
      fontChanges?: Partial<ThemeFonts>;
      spacingChanges?: Partial<ThemeSpacing>;
      styleChanges?: Partial<ThemeStyle>;
    }>([{ role: 'user', content: prompt }], 'design_decision');

    if (response.success && response.data) {
      return this.designTheme({
        mood: response.data.newMood || currentMood,
        colors: response.data.colorChanges,
        fonts: response.data.fontChanges,
        preserveExisting: true,
      });
    }

    // Fallback: re-design with modification as mood
    return this.designTheme({
      mood: `${currentMood} with ${modification}`,
      specificRequests: [modification],
    });
  }

  // --------------------------------------------
  // EVENT-BASED THEMES
  // --------------------------------------------

  async applyEventTheme(event: string): Promise<ThemeDesignResult> {
    const eventMoods: Record<string, string> = {
      'valentine': 'romantic, red and pink, hearts, love, elegant',
      'christmas': 'festive, red and green, gold accents, cozy, warm',
      'black friday': 'bold, black and yellow, urgent, high-energy, deals',
      'halloween': 'dark, orange and purple, spooky-fun, mysterious',
      'summer': 'bright, tropical, blue and coral, fresh, energetic',
      'winter': 'cool, white and blue, silver accents, elegant, frost',
      'new year': 'celebration, gold and black, glamorous, sparkling',
      'easter': 'pastel, spring, soft colors, fresh, cheerful',
      'mothers day': 'soft pink, floral, elegant, warm, loving',
      'fathers day': 'navy, classic, strong, trustworthy, sophisticated',
    };

    const lowerEvent = event.toLowerCase();
    let eventMood = '';

    for (const [key, mood] of Object.entries(eventMoods)) {
      if (lowerEvent.includes(key)) {
        eventMood = mood;
        break;
      }
    }

    if (!eventMood) {
      eventMood = `themed for ${event}, professional, festive, attractive`;
    }

    return this.designTheme({
      mood: eventMood,
      event,
      specificRequests: [`Themed specifically for ${event}`, 'Keep it professional and high-converting'],
    });
  }

  // --------------------------------------------
  // HELPER METHODS
  // --------------------------------------------

  private findPresetMatch(mood: string): string | null {
    const lower = mood.toLowerCase();

    if ((lower.includes('premium') || lower.includes('luxury')) && lower.includes('dark')) {
      return 'premium-dark';
    }
    if (lower.includes('modern') && (lower.includes('clean') || lower.includes('minimal'))) {
      return 'modern-clean';
    }
    if (lower.includes('luxury') && lower.includes('gold')) {
      return 'luxury-gold';
    }

    return null;
  }

  private buildFromPreset(presetKey: string, request: ThemeDesignRequest): ThemeDesign {
    const preset = THEME_PRESETS[presetKey]!;
    return {
      mood: request.mood,
      colors: (request.colors ? { ...preset.colors, ...request.colors } : preset.colors) as ThemeColors,
      fonts: (request.fonts ? { ...preset.fonts, ...request.fonts } : preset.fonts) as ThemeFonts,
      spacing: preset.spacing as ThemeSpacing,
      style: preset.style as ThemeStyle,
      css: '',
      appliedAt: Date.now(),
    };
  }

  private detectColorPreference(colors: ThemeColors): string {
    const bg = colors.background.toLowerCase();
    if (bg.startsWith('#0') || bg.startsWith('#1') || bg.startsWith('#2')) return 'dark';
    if (bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#d')) return 'light';
    return 'mixed';
  }

  // --------------------------------------------
  // GET CURRENT THEME INFO
  // --------------------------------------------

  async getCurrentTheme(): Promise<{
    mood: string;
    appliedAt: number;
    hasCustomCSS: boolean;
  } | null> {
    const state = await this.memory.getStoreState();
    if (!state.currentTheme) return null;

    return {
      mood: state.currentTheme.mood,
      appliedAt: state.currentTheme.appliedAt,
      hasCustomCSS: !!state.currentTheme.customCSS,
    };
  }

  async removeCustomTheme(): Promise<boolean> {
    try {
      if (!this.shopify.isConfigured()) return false;

      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) return false;

      await this.shopify.deleteThemeAsset(themeResponse.data.id, 'assets/carehub-theme.css');
      await this.memory.updateStoreState({ currentTheme: null });

      return true;
    } catch {
      return false;
    }
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let themeDesignerInstance: ThemeDesigner | null = null;

export function getThemeDesigner(): ThemeDesigner {
  if (!themeDesignerInstance) {
    themeDesignerInstance = new ThemeDesigner();
  }
  return themeDesignerInstance;
}

export function resetThemeDesigner(): void {
  themeDesignerInstance = null;
}
