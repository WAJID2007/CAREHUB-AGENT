"use strict";(()=>{var e={};e.id=398,e.ids=[398],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3023:e=>{e.exports=import("@google/generative-ai")},6219:e=>{e.exports=import("groq-sdk")},6005:e=>{e.exports=require("node:crypto")},1305:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>l,requestAsyncStorage:()=>u,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var o=r(9303),i=r(8716),n=r(670),s=r(2570),c=e([s]);s=(c.then?(await c)():c)[0];let d=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/agent/route",pathname:"/api/agent",filename:"route",bundlePath:"app/api/agent/route"},resolvedPagePath:"C:\\Users\\wajid\\Downloads\\create\\CAREHUB-AGENT-main\\app\\api\\agent\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:u,staticGenerationAsyncStorage:p,serverHooks:m}=d,h="/api/agent/route";function l(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}a()}catch(e){a(e)}})},5600:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{Wo:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;class l{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async listCollections(){try{let[e,t]=await Promise.all([this.shopify.getCustomCollections({limit:50}),this.shopify.getSmartCollections({limit:50})]),r=[];return e.success&&e.data&&r.push(...e.data.custom_collections),t.success&&t.data&&r.push(...t.data.smart_collections),await this.memory.updateStoreState({activeCollections:r.map(e=>e.title)}),{success:!0,message:`Found ${r.length} collections`,collections:r,count:r.length}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async createCollection(e){try{let t,r=e.description||"";(e.generateDescription||!r)&&(r=await this.generateCollectionDescription(e.title));let a={title:e.title,body_html:r,published:!1!==e.published,sort_order:e.sortOrder||"best-selling"};if(e.image&&(a.image={src:e.image,alt:e.title}),"smart"===e.type){let r=(e.rules||[]).map(e=>({column:e.column,relation:e.relation,condition:e.condition}));if(0===r.length&&r.push({column:"tag",relation:"equals",condition:e.title.toLowerCase().replace(/\s+/g,"-")}),!(t=await this.shopify.createSmartCollection({...a,rules:r,disjunctive:!1})).success)return{success:!1,message:t.error||"Failed to create smart collection"};return{success:!0,message:`✅ Smart collection "${e.title}" created with ${r.length} rules!`,collection:t.data?.smart_collection}}{if(!(t=await this.shopify.createCustomCollection(a)).success)return{success:!1,message:t.error||"Failed to create collection"};let r=t.data?.custom_collection;if(e.productIds&&e.productIds.length>0&&r?.id)for(let t of e.productIds)await this.shopify.addProductToCollection(r.id,t),await new Promise(e=>setTimeout(e,250));return{success:!0,message:`✅ Manual collection "${e.title}" created${e.productIds?` with ${e.productIds.length} products`:""}!`,collection:r}}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async updateCollection(e,t){try{let r={};t.title&&(r.title=t.title),t.description&&(r.body_html=t.description),t.sortOrder&&(r.sort_order=t.sortOrder),t.image&&(r.image={src:t.image,alt:t.title||""}),void 0!==t.published&&(r.published=t.published);let a=await this.shopify.updateCustomCollection(e,r);if(a.success||(a=await this.shopify.updateSmartCollection(e,r)),!a.success)return{success:!1,message:a.error||"Failed to update collection"};return{success:!0,message:`✅ Collection updated successfully!`,collection:a.data?.custom_collection||a.data?.smart_collection}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async deleteCollection(e){try{if(!(await this.shopify.deleteCustomCollection(e)).success){let t=await this.shopify.getSmartCollections();if(t.success&&t.data&&t.data.smart_collections.find(t=>t.id===e))return await this.shopify.updateSmartCollection(e,{published:!1}),{success:!0,message:`✅ Collection unpublished (archived)`};return{success:!1,message:"Collection not found"}}return{success:!0,message:`✅ Collection deleted successfully!`}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async addProductsToCollection(e,t){try{let r=0;for(let a of t)(await this.shopify.addProductToCollection(e,a)).success&&r++,await new Promise(e=>setTimeout(e,250));return{success:r>0,message:`✅ Added ${r}/${t.length} products to collection`,count:r}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async createPresetCollections(){let e=[{title:"New Arrivals",type:"smart",rules:[{column:"tag",relation:"equals",condition:"new-arrival"}],sortOrder:"created-desc",generateDescription:!0},{title:"Best Sellers",type:"smart",rules:[{column:"tag",relation:"equals",condition:"best-seller"}],sortOrder:"best-selling",generateDescription:!0},{title:"On Sale",type:"smart",rules:[{column:"compare_at_price",relation:"greater_than",condition:"0"}],sortOrder:"best-selling",generateDescription:!0},{title:"Under $25",type:"smart",rules:[{column:"price",relation:"less_than",condition:"25"}],sortOrder:"price-ascending",generateDescription:!0},{title:"Premium Collection",type:"smart",rules:[{column:"price",relation:"greater_than",condition:"50"}],sortOrder:"price-descending",generateDescription:!0}],t=[],r=[];for(let a of e){let e=await this.createCollection(a);e.success&&e.collection?t.push(e.collection):r.push(`${a.title}: ${e.message}`),await new Promise(e=>setTimeout(e,500))}return await this.memory.logAction({agent:"collections",action:"create_preset_collections",input:`${e.length} preset collections`,output:`Created ${t.length} collections`,success:t.length>0,duration:0,reversible:!0,undoData:{collectionIds:t.map(e=>e.id)}}),{success:t.length>0,message:`✅ Created ${t.length}/${e.length} preset collections${r.length>0?` (${r.length} errors)`:""}`,collections:t,count:t.length}}async createSeasonalCollection(e){let t={valentine:{title:"Valentine's Day Gifts",tag:"valentines",sortOrder:"best-selling"},christmas:{title:"Christmas Gift Guide",tag:"christmas",sortOrder:"price-ascending"},"black friday":{title:"Black Friday Deals",tag:"black-friday",sortOrder:"price-ascending"},summer:{title:"Summer Essentials",tag:"summer",sortOrder:"best-selling"},"mothers day":{title:"Mother's Day Gifts",tag:"mothers-day",sortOrder:"price-ascending"},"fathers day":{title:"Father's Day Gifts",tag:"fathers-day",sortOrder:"price-ascending"},halloween:{title:"Halloween Specials",tag:"halloween",sortOrder:"best-selling"},"new year":{title:"New Year New You",tag:"new-year",sortOrder:"best-selling"},"back to school":{title:"Back to School",tag:"school",sortOrder:"price-ascending"},winter:{title:"Winter Collection",tag:"winter",sortOrder:"best-selling"}},r=e.toLowerCase(),a=t[r];if(!a){for(let[e,o]of Object.entries(t))if(r.includes(e)){a=o;break}}return a||(a={title:`${e} Collection`,tag:e.toLowerCase().replace(/\s+/g,"-"),sortOrder:"best-selling"}),this.createCollection({title:a.title,type:"smart",rules:[{column:"tag",relation:"equals",condition:a.tag}],sortOrder:a.sortOrder,generateDescription:!0})}async suggestCollections(){try{let e=await this.shopify.getProducts({limit:50});if(!e.success||!e.data)return this.getDefaultSuggestions();let t=e.data.products,r=new Set,a=new Set,o={under25:0,under50:0,over50:0,over100:0},i=new Set;for(let e of t){e.product_type&&r.add(e.product_type),e.vendor&&a.add(e.vendor),e.tags&&e.tags.split(",").map(e=>e.trim()).forEach(e=>i.add(e));let t=parseFloat(e.variants?.[0]?.price||"0");t<25?o.under25++:t<50?o.under50++:t<100?o.over50++:o.over100++}let n=[];for(let e of r)e&&t.filter(t=>t.product_type===e).length>=3&&n.push({title:e,type:"smart",rules:[{column:"type",relation:"equals",condition:e}],reason:`You have ${t.filter(t=>t.product_type===e).length} products of type "${e}"`});return o.under25>=3&&n.push({title:"Budget Finds — Under $25",type:"smart",rules:[{column:"price",relation:"less_than",condition:"25"}],reason:`${o.under25} products under $25`}),o.over100>=3&&n.push({title:"Premium Collection",type:"smart",rules:[{column:"price",relation:"greater_than",condition:"100"}],reason:`${o.over100} premium products over $100`}),n.push({title:"On Sale",type:"smart",rules:[{column:"compare_at_price",relation:"greater_than",condition:"0"}],reason:"Showcase discounted products to drive conversions"}),n.push({title:"New Arrivals",type:"smart",rules:[{column:"tag",relation:"equals",condition:"new-arrival"}],reason:"Keep your store fresh — highlight latest additions"}),n.slice(0,8)}catch{return this.getDefaultSuggestions()}}getDefaultSuggestions(){return[{title:"New Arrivals",type:"smart",rules:[{column:"tag",relation:"equals",condition:"new-arrival"}],reason:"Showcase latest products"},{title:"Best Sellers",type:"smart",rules:[{column:"tag",relation:"equals",condition:"best-seller"}],reason:"Social proof — what others buy"},{title:"On Sale",type:"smart",rules:[{column:"compare_at_price",relation:"greater_than",condition:"0"}],reason:"Bargain hunters love this"},{title:"Under $25",type:"smart",rules:[{column:"price",relation:"less_than",condition:"25"}],reason:"Low barrier to first purchase"},{title:"Gift Ideas",type:"smart",rules:[{column:"tag",relation:"equals",condition:"gift"}],reason:"Capture gift-buying audience"}]}async generateCollectionDescription(e){let t=`Write a collection page description for: "${e}"

Rules:
- 80-120 words
- SEO-optimized
- Compelling opening sentence
- Mention variety and quality
- Include value proposition
- Subtle CTA at end
- HTML format: , 
- Target: US/UK shoppers
- Tone: Professional, trustworthy

Return ONLY the HTML content.`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");return r.success?r.content:`Explore our curated ${e} collection. Hand-picked for quality and value, each item is designed to exceed your expectations. Shop with confidence — free shipping and 30-day returns on every order.`}async optimizeCollectionSEO(e){try{let t=await this.listCollections(),r=t.collections?.find(t=>t.id===e);if(!r)return{success:!1,message:"Collection not found"};let a=!1,o={};if((!r.body_html||r.body_html.length<100)&&(o.body_html=await this.generateCollectionDescription(r.title),a=!0),r.handle){let e=r.title.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").substring(0,50);e!==r.handle&&e.length>3&&(o.handle=e,a=!0)}return a&&await this.updateCollection(e,{description:o.body_html}),{success:!0,message:a?`✅ Collection "${r.title}" SEO optimized!`:`✅ Collection "${r.title}" SEO already good!`}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async optimizeAllCollectionsSEO(){let e=await this.listCollections();if(!e.success||!e.collections)return{success:!1,message:"Could not fetch collections"};let t=0;for(let r of e.collections)r.id&&((await this.optimizeCollectionSEO(r.id)).success&&t++,await new Promise(e=>setTimeout(e,500)));return{success:!0,message:`✅ Optimized SEO for ${t}/${e.collections.length} collections`,count:t}}async autoOrganize(){try{let e=await this.suggestCollections(),t=((await this.listCollections()).collections||[]).map(e=>e.title.toLowerCase()),r=e.filter(e=>!t.includes(e.title.toLowerCase()));if(0===r.length)return{success:!0,message:"✅ Store already well-organized! No new collections needed."};let a=0;for(let e of r.slice(0,5))(await this.createCollection({title:e.title,type:e.type,rules:e.rules,generateDescription:!0})).success&&a++,await new Promise(e=>setTimeout(e,500));return await this.memory.logAction({agent:"collections",action:"auto_organize",input:`${r.length} suggestions`,output:`Created ${a} collections`,success:!0,duration:0,reversible:!0}),{success:!0,message:`✅ Auto-organized: Created ${a} new collections based on your products!`,count:a}}catch(e){return{success:!1,message:`Error: ${e instanceof Error?e.message:"Unknown"}`}}}async getNavigationSuggestion(){let e=await this.listCollections();if(!e.success||!e.collections)return{success:!1,message:"Could not fetch collections",menuItems:[]};let t=e.collections.filter(e=>!1!==e.published).slice(0,6),r=[{title:"Home",url:"/"},...t.map(e=>({title:e.title,url:`/collections/${e.handle||e.title.toLowerCase().replace(/\s+/g,"-")}`})),{title:"Contact",url:"/pages/contact"}];return{success:!0,message:`Suggested navigation with ${r.length} items`,menuItems:r}}async handleCommand(e){let t=e.toLowerCase();if(t.includes("list")||t.includes("show")||t.includes("dikhao"))return this.listCollections();if(t.includes("preset")||t.includes("default")||t.includes("basic"))return this.createPresetCollections();if(t.includes("organize")||t.includes("auto"))return this.autoOrganize();if(t.includes("suggest")||t.includes("recommend")){let e=(await this.suggestCollections()).map(e=>`• ${e.title} (${e.type}) — ${e.reason}`).join("\n");return{success:!0,message:`📋 Suggested Collections:
${e}`}}if(t.includes("seo")||t.includes("optimize"))return this.optimizeAllCollectionsSEO();if(t.includes("seasonal")||t.includes("event")){let t=e.match(/(?:for|event|seasonal)\s+"?([^"]+)"?/i),r=t?.[1]||"summer";return this.createSeasonalCollection(r)}if(t.includes("create")||t.includes("banao")||t.includes("new")){let t=e.match(/(?:create|banao|new)\s+(?:collection\s+)?["']?([^"']+)["']?/i),r=t?.[1]||"New Collection";return this.createCollection({title:r.trim(),type:"smart",rules:[{column:"tag",relation:"equals",condition:r.trim().toLowerCase().replace(/\s+/g,"-")}],generateDescription:!0})}return{success:!1,message:'Try: list collections, create presets, auto organize, suggest collections, optimize SEO, create "Collection Name"'}}}let d=null;function c(){return d||(d=new l),d}a()}catch(e){a(e)}})},7083:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{xo:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;class l{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async generate(e){try{let t;let r=await this.memory.getPreferences(),a=e.tone||"professional, compelling, trustworthy",o=e.targetAudience||`${r.targetMarket} online shoppers`,i="";switch(e.type){case"product_description":i=await this.generateProductDescription(e,a,o);break;case"meta_title":({content:i,variants:t}=await this.generateMetaTitle(e));break;case"meta_description":({content:i,variants:t}=await this.generateMetaDescription(e));break;case"blog_post":i=await this.generateBlogPost(e,a,o);break;case"social_caption":({content:i,variants:t}=await this.generateSocialCaption(e));break;case"facebook_ad":({content:i,variants:t}=await this.generateFacebookAd(e));break;case"google_ad":({content:i,variants:t}=await this.generateGoogleAd(e));break;case"tiktok_script":i=await this.generateTikTokScript(e);break;case"email_subject":({content:i,variants:t}=await this.generateEmailSubject(e));break;case"email_body":i=await this.generateEmailBody(e,a);break;case"image_alt":i=await this.generateImageAlt(e);break;case"url_slug":i=await this.generateUrlSlug(e);break;case"image_prompt":i=await this.generateImagePrompt(e);break;case"collection_description":i=await this.generateCollectionDescription(e,a);break;case"faq_content":i=await this.generateFAQ(e);break;case"review_response":i=await this.generateReviewResponse(e)}let n={wordCount:i.split(/\s+/).length,characterCount:i.length,readingTime:`${Math.ceil(i.split(/\s+/).length/200)} min`,keywords:e.keywords,platform:e.platform};return await this.memory.logAction({agent:"content-seo",action:`generate_${e.type}`,input:JSON.stringify({product:e.product,topic:e.topic}),output:i.substring(0,100),success:!0,duration:0,reversible:!1}),{success:!0,content:i,type:e.type,metadata:n,variants:t,message:`✅ ${e.type.replace(/_/g," ")} generated successfully!`}}catch(t){return{success:!1,content:"",type:e.type,message:`❌ Error: ${t instanceof Error?t.message:"Unknown"}`}}}async generateProductDescription(e,t,r){let a=`Write a high-converting e-commerce product description.

Product: ${e.product||"Premium product"}
Keywords: ${e.keywords?.join(", ")||"quality, premium, best"}
Tone: ${t}
Audience: ${r}
${e.additionalContext?`Additional context: ${e.additionalContext}`:""}

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

Return ONLY the HTML content.`,o=await this.router.useGroq([{role:"user",content:a}],"content_writing");return o.success?o.content:this.fallbackDescription(e.product||"Product")}async generateMetaTitle(e){let t=`Generate 3 SEO-optimized meta titles for this product/page:

Product/Page: ${e.product||e.topic||"Product"}
Keywords: ${e.keywords?.join(", ")||""}

Rules:
- Max 60 characters each
- Include primary keyword near the beginning
- Include brand name "CareHub" at end with | separator
- Make it click-worthy (curiosity or benefit)
- Use power words: Best, Premium, Top, Free, New

Return ONLY a JSON array of 3 titles:
["title 1", "title 2", "title 3"]`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");try{if(r.success){let e=r.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]);return{content:t[0],variants:t}}}}catch{}let a=`${e.product||"Premium Products"} | CareHub`;return{content:a,variants:[a]}}async generateMetaDescription(e){let t=`Generate 3 SEO meta descriptions:

Product/Page: ${e.product||e.topic||"Product"}
Keywords: ${e.keywords?.join(", ")||""}

Rules:
- 150-160 characters each
- Include primary keyword naturally
- Include a call-to-action
- Create curiosity or highlight benefit
- Include "Free shipping" or "30-day returns" if relevant
- Make people want to click

Return ONLY a JSON array:
["desc 1", "desc 2", "desc 3"]`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");try{if(r.success){let e=r.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]);return{content:t[0],variants:t}}}}catch{}let a=`Shop ${e.product||"premium products"} at CareHub. Free shipping, 30-day returns. Premium quality guaranteed.`;return{content:a,variants:[a]}}async generateBlogPost(e,t,r){let a=`Write an SEO-optimized blog post for an e-commerce store.

Topic: ${e.topic||e.product||"Shopping Guide"}
Keywords: ${e.keywords?.join(", ")||""}
Tone: ${t}
Audience: ${r}
Word count: ${e.maxLength||800}-${(e.maxLength||800)+200} words

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

Return the complete HTML blog post.`,o=await this.router.useGemini([{role:"user",content:a}],"creative_writing");return o.success?o.content:"Blog post generation failedPlease try again."}async generateSocialCaption(e){let t=e.platform||"instagram",r={instagram:"Max 2200 chars, use emojis, 20-30 relevant hashtags at end, line breaks for readability, story-telling tone",facebook:"Max 500 chars, conversational, include question to boost engagement, 3-5 hashtags, emoji usage moderate",tiktok:"Max 150 chars, trending language, viral hooks, 5-8 hashtags, Gen-Z friendly, casual",twitter:"Max 280 chars, punchy, witty, 2-3 hashtags max, create urgency",pinterest:"Max 500 chars, descriptive, keyword-rich, how-to angle, aspirational"},a=`Write 3 social media captions for ${t}:

Product: ${e.product||"Premium product"}
Platform: ${t}
Rules: ${r[t]||r.instagram}
Tone: ${e.tone||"engaging, authentic, premium"}

Return ONLY a JSON array of 3 captions:
["caption 1", "caption 2", "caption 3"]

Each caption should have a different angle:
1. Benefit-focused
2. Social proof / testimonial style
3. Urgency / limited offer`,o=await this.router.useGroq([{role:"user",content:a}],"content_writing");try{if(o.success){let e=o.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]);return{content:t[0],variants:t}}}}catch{}return{content:`✨ ${e.product||"New arrival"} now available! Shop link in bio 🛒`,variants:[]}}async generateFacebookAd(e){let t=`Write 3 Facebook ad copy variations:

Product: ${e.product||"Premium product"}
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
- Compliant with Meta ad policies`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");try{if(r.success){let e=r.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]).map(e=>`📝 Primary: ${e.primary}
📌 Headline: ${e.headline}
📋 Description: ${e.description}
🔘 CTA: ${e.cta}`);return{content:t[0],variants:t}}}}catch{}return{content:"Ad copy generation failed. Try again.",variants:[]}}async generateGoogleAd(e){let t=`Write 3 Google Search Ad variations:

Product/Service: ${e.product||"Premium product"}
Keywords: ${e.keywords?.join(", ")||""}

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
- Match search intent`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");try{if(r.success){let e=r.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]).map(e=>`H1: ${e.h1}
H2: ${e.h2}
H3: ${e.h3}
D1: ${e.d1}
D2: ${e.d2}`);return{content:t[0],variants:t}}}}catch{}return{content:"Google ad generation failed. Try again.",variants:[]}}async generateTikTokScript(e){let t=`Write a TikTok video script for a product promotion:

Product: ${e.product||"Premium product"}
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

Make it feel organic, not ad-like.`,r=await this.router.useGemini([{role:"user",content:t}],"creative_writing");return r.success?r.content:"TikTok script generation failed."}async generateEmailSubject(e){let t=`Write 5 email subject lines for:

Purpose: ${e.topic||"Product promotion"}
Product: ${e.product||""}
Type: ${e.style||"promotional"}

Rules:
- Max 50 characters each
- Create curiosity or urgency
- Use personalization [{first_name}] where appropriate
- Mix of styles: emoji, question, number, statement, FOMO
- High open rate optimized
- No spam trigger words

Return ONLY JSON array:
["subject 1", "subject 2", "subject 3", "subject 4", "subject 5"]`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");try{if(r.success){let e=r.content.match(/$$[\s\S]*$$/);if(e){let t=JSON.parse(e[0]);return{content:t[0],variants:t}}}}catch{}return{content:`✨ Something special just for you`,variants:[]}}async generateEmailBody(e,t){let r=`Write a marketing email body:

Purpose: ${e.topic||"Product promotion"}
Product: ${e.product||""}
Tone: ${t}
Type: ${e.style||"promotional"}

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

Return HTML email body content.`,a=await this.router.useGroq([{role:"user",content:r}],"content_writing");return a.success?a.content:"Email generation failed."}async generateImageAlt(e){let t=`Generate SEO-optimized image alt text:

Product: ${e.product||"Product image"}
Context: ${e.additionalContext||"E-commerce product photo"}

Rules:
- 125 characters max
- Descriptive (what's in the image)
- Include primary keyword naturally
- Don't start with "Image of" or "Photo of"
- Accessible and helpful for screen readers

Return ONLY the alt text, nothing else.`,r=await this.router.useGroq([{role:"user",content:t}],"quick_response");return r.success?r.content.replace(/^["']|["']$/g,"").trim():e.product||"Product image"}async generateUrlSlug(e){return(e.product||e.topic||"").toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").substring(0,60)}async generateImagePrompt(e){let t=`Create a professional-level image generation prompt:

Subject: ${e.product||e.topic||"E-commerce product"}
Style: ${e.style||"Product photography, premium, clean"}
Purpose: ${e.additionalContext||"E-commerce product listing"}

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
Be extremely specific — every detail matters.`,r=await this.router.useGemini([{role:"user",content:t}],"image_prompt");return r.success?r.content:"Image prompt generation failed."}async generateCollectionDescription(e,t){let r=`Write a collection page description:

Collection: ${e.product||e.topic||"Collection"}
Keywords: ${e.keywords?.join(", ")||""}
Tone: ${t}

Rules:
- 100-150 words
- SEO-optimized (include keywords naturally)
- Compelling opening sentence
- Mention variety/range
- Include value proposition
- End with subtle CTA
- HTML formatting: , 

Return ONLY the HTML content.`,a=await this.router.useGroq([{role:"user",content:r}],"content_writing");return a.success?a.content:`Explore our curated ${e.product||"collection"} — premium quality at unbeatable prices.`}async generateFAQ(e){let t=`Generate 5 FAQ items for:

Product/Topic: ${e.product||e.topic||"E-commerce store"}
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

Return ONLY the HTML.`,r=await this.router.useGroq([{role:"user",content:t}],"content_writing");return r.success?r.content:"FAQ generation failedPlease try again."}async generateReviewResponse(e){let t=`Write a professional response to this customer review:

Review: "${e.additionalContext||"Great product, love it!"}"
Tone: Grateful, professional, personal

Rules:
- Thank them by name if available
- Reference specific details from their review
- 2-3 sentences max
- End with invitation to shop again
- Professional but warm
- Don't be generic or robotic

Return ONLY the response text.`,r=await this.router.useGroq([{role:"user",content:t}],"quick_response");return r.success?r.content:"Thank you for your wonderful review! We are thrilled you love your purchase."}async auditProductSEO(e){try{let t=await this.shopify.getProduct(e);if(!t.success||!t.data)return{success:!1,score:0,issues:[],recommendations:[]};let r=t.data.product,a=[],o=[],i=100;if((!r.title||r.title.length<20)&&(a.push({type:"warning",field:"title",message:"Title too short — aim for 50-60 characters",current:r.title}),i-=10),r.title&&r.title.length>70&&(a.push({type:"warning",field:"title",message:"Title too long — will be truncated in search results"}),i-=5),(!r.body_html||r.body_html.length<100)&&(a.push({type:"critical",field:"description",message:"Description too short or missing — needs at least 300 characters"}),i-=20,o.push("Generate a compelling product description with keywords")),r.images&&0!==r.images.length){let e=r.images.filter(e=>!e.alt||""===e.alt.trim());e.length>0&&(a.push({type:"warning",field:"images",message:`${e.length} images missing alt text`}),i-=5*e.length,o.push("Add descriptive alt text to all images"))}else a.push({type:"critical",field:"images",message:"No product images"}),i-=20;return r.tags&&""!==r.tags.trim()||(a.push({type:"info",field:"tags",message:"No product tags — add relevant tags for filtering and SEO"}),i-=5),r.product_type||(a.push({type:"info",field:"product_type",message:"Product type not set"}),i-=3),r.variants&&r.variants[0]&&!r.variants[0].compare_at_price&&o.push("Add a compare-at price to show savings and increase conversions"),i>=80?o.push("Good SEO foundation! Consider adding structured data for rich snippets."):o.push("Fix critical issues first, then optimize descriptions and images."),{success:!0,score:Math.max(0,i),issues:a,recommendations:o}}catch(e){return{success:!1,score:0,issues:[],recommendations:[`Error: ${e instanceof Error?e.message:"Unknown"}`]}}}async bulkGenerateDescriptions(e){let t=[],r=[];for(let a of e)try{let e=await this.shopify.getProduct(a);if(!e.success||!e.data){r.push(`Product ${a}: Not found`);continue}let o=e.data.product,i=await this.generate({type:"product_description",product:o.title,keywords:o.tags?.split(",").map(e=>e.trim()).slice(0,5)});i.success&&o.id&&(await this.shopify.updateProduct(o.id,{body_html:i.content}),t.push({productId:o.id,title:o.title,content:i})),await new Promise(e=>setTimeout(e,1e3))}catch(e){r.push(`Product ${a}: ${e instanceof Error?e.message:"Failed"}`)}return{success:t.length>0,results:t,message:`✅ Generated descriptions for ${t.length}/${e.length} products`,errors:r}}async bulkGenerateAltTexts(e){let t=[],r=[];for(let a of e)try{let e=await this.shopify.getProduct(a);if(!e.success||!e.data)continue;let r=e.data.product;for(let e of r.images||[])if(!e.alt&&e.id&&r.id){let t=await this.generateImageAlt({type:"image_alt",product:r.title});await this.shopify.createProductImage(r.id,{...e,src:e.src,alt:t})}t.push({productId:r.id||a,title:r.title,content:{success:!0,content:"Alt texts generated",type:"image_alt",message:"✅"}}),await new Promise(e=>setTimeout(e,500))}catch(e){r.push(`Product ${a}: ${e instanceof Error?e.message:"Failed"}`)}return{success:t.length>0,results:t,message:`✅ Generated alt texts for ${t.length} products`,errors:r}}fallbackDescription(e){return`
${e} — Crafted with premium materials for those who demand excellence.

  ✅ Premium quality — built to last
  🚚 Free shipping on all orders
  ↩️ 30-day hassle-free returns
  🔒 Secure checkout guaranteed
  ⭐ Loved by thousands of happy customers

Why Choose This?
We've carefully selected this product for its exceptional quality and value. Join our community of satisfied customers who've made the upgrade.
⚡ Limited stock — order now before it's gone!`}async handleCommand(e){let t=e.toLowerCase();if(t.includes("description")||t.includes("desc")){let t=e.match(/(?:for|of)\s+"?([^"]+)"?/i);return this.generate({type:"product_description",product:t?.[1]||"product"})}if(t.includes("blog")){let t=e.match(/(?:about|on|topic)\s+"?([^"]+)"?/i);return this.generate({type:"blog_post",topic:t?.[1]||"shopping guide"})}return t.includes("instagram")||t.includes("social")||t.includes("caption")?this.generate({type:"social_caption",product:"our latest product",platform:"instagram"}):t.includes("facebook ad")||t.includes("fb ad")?this.generate({type:"facebook_ad",product:"our product"}):t.includes("google ad")?this.generate({type:"google_ad",product:"our product"}):t.includes("tiktok")?this.generate({type:"tiktok_script",product:"our product"}):t.includes("email")?this.generate({type:"email_body",topic:"promotion"}):t.includes("image prompt")||t.includes("graphic")?this.generate({type:"image_prompt",product:"product photography"}):this.generate({type:"product_description",product:e})}}let d=null;function c(){return d||(d=new l),d}a()}catch(e){a(e)}})},7104:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{CP:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;let l=[{icon:"\uD83D\uDD12",title:"Secure Payment",description:"256-bit SSL encryption protects your data"},{icon:"\uD83D\uDE9A",title:"Fast Shipping",description:"Free delivery on orders over $50"},{icon:"↩️",title:"30-Day Returns",description:"Hassle-free returns & exchanges"},{icon:"\uD83D\uDCAC",title:"24/7 Support",description:"Always here to help you"}],d=[{name:"Sarah M.",rating:5,text:"Absolutely love the quality! Arrived faster than expected and exactly as described. Will definitely order again.",location:"New York, USA",verified:!0},{name:"James T.",rating:5,text:"Best online shopping experience I have had. The product exceeded my expectations. Highly recommend!",location:"London, UK",verified:!0},{name:"Emily R.",rating:5,text:"Customer service is outstanding. They helped me choose the perfect item. Premium quality at great prices.",location:"Los Angeles, USA",verified:!0},{name:"Michael D.",rating:5,text:"Third time ordering and still impressed. Consistent quality and fast delivery every single time.",location:"Manchester, UK",verified:!0}];class u{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async buildHomepage(e){try{let t=await this.memory.getPreferences();await this.memory.getStoreState();let r=e.mood||t.mood||"premium",a=e.sections||this.getDefaultSections(),o=[],i=0;for(let t of a){let a=await this.buildSection(t,r,e,i);o.push(a),i++}let n=this.combineLiquid(o),s=this.combineCSS(o,r),c=!1;return this.shopify.isConfigured()&&(c=await this.applyToStore(n,s)),await this.memory.recordHomepageUpdate({sections:a,mood:r,appliedAt:Date.now()}),{success:!0,sections:o,liquidCode:n,cssCode:s,applied:c,message:c?`✅ Homepage built with ${o.length} sections and applied to store!`:`✅ Homepage built with ${o.length} sections! Connect Shopify to apply.`}}catch(t){let e=t instanceof Error?t.message:"Unknown error";return{success:!1,sections:[],liquidCode:"",cssCode:"",applied:!1,message:`❌ Error building homepage: ${e}`}}}async buildSection(e,t,r,a){switch(e){case"announcement":return this.buildAnnouncementSection(t,a);case"hero":return this.buildHeroSection(t,r,a);case"featured_products":return this.buildFeaturedProductsSection(t,a);case"trust_badges":return this.buildTrustBadgesSection(t,a);case"testimonials":return this.buildTestimonialsSection(t,a);case"categories":return this.buildCategoriesSection(t,a);case"urgency":return this.buildUrgencySection(t,a);case"newsletter":return this.buildNewsletterSection(t,a);case"benefits":return this.buildBenefitsSection(t,a);case"brand_story":return this.buildBrandStorySection(t,a);case"countdown":return this.buildCountdownSection(t,a);case"faq":return this.buildFAQSection(t,a);default:return this.buildGenericSection(e,t,a)}}async buildAnnouncementSection(e,t){let r=await this.generateContent("announcement bar",e,"One short compelling announcement text for a premium store. Max 10 words. Create urgency.")||"\uD83D\uDD25 Free Shipping on Orders Over $50 — Limited Time Only!";return{type:"announcement",position:t,content:{headline:r},enabled:!0,liquid:`


  
    ${r}
    ✕
  
`,css:`
.carehub-announcement {
  background: var(--color-announcement-bg, #c9a962);
  color: var(--color-announcement-text, #000);
  padding: 10px 20px;
  text-align: center;
  position: relative;
  z-index: 100;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.carehub-announcement__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  max-width: 1200px;
  margin: 0 auto;
}
.carehub-announcement__text {
  margin: 0;
  animation: slideInDown 0.5s ease;
}
.carehub-announcement__close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0;
  line-height: 1;
}
.carehub-announcement__close:hover { opacity: 1; }
@keyframes slideInDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`}}async buildHeroSection(e,t,r){let a=t.heroHeadline,o=t.heroSubheadline;if(!a||!o){let r=await this.generateHeroContent(e,t.event);a=a||r.headline,o=o||r.subheadline}let i="Shop Now";return{type:"hero",position:r,content:{headline:a,subheadline:o,buttonText:i,buttonLink:"/collections/all"},enabled:!0,liquid:`


  
  
    ${a}
    ${o}
    
      ${i}
      Explore Collections
    
    
      ⭐ 4.9/5 Rating
      •
      🚚 Free Shipping
      •
      🔒 Secure Checkout
    
  
`,css:`
.carehub-hero {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--color-gradient-1, #c9a962) 0%, var(--color-gradient-2, #8b6914) 50%, var(--color-background, #0a0a0f) 100%);
  overflow: hidden;
  padding: 60px 20px;
}
.carehub-hero__overlay {
  position: absolute;
  inset: 0;
  background: var(--color-overlay, rgba(0,0,0,0.5));
  z-index: 1;
}
.carehub-hero__content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  animation: fadeInUp 0.8s ease;
}
.carehub-hero__headline {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 800;
  color: #ffffff !important;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.carehub-hero__subheadline {
  font-size: clamp(1rem, 2vw, 1.3rem);
  color: rgba(255,255,255,0.85) !important;
  margin-bottom: 35px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.carehub-hero__buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}
.carehub-hero__btn {
  padding: 16px 36px;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: none;
  border-radius: var(--border-radius, 8px);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.carehub-hero__btn--primary {
  background: var(--color-button-bg, #c9a962);
  color: var(--color-button-text, #000) !important;
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.4);
}
.carehub-hero__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(201, 169, 98, 0.6);
}
.carehub-hero__btn--secondary {
  background: transparent;
  color: #ffffff !important;
  border: 2px solid rgba(255,255,255,0.5);
}
.carehub-hero__btn--secondary:hover {
  border-color: #ffffff;
  background: rgba(255,255,255,0.1);
}
.carehub-hero__trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7) !important;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .carehub-hero { min-height: 70vh; padding: 40px 15px; }
  .carehub-hero__buttons { flex-direction: column; align-items: center; }
  .carehub-hero__btn { width: 100%; max-width: 280px; justify-content: center; }
  .carehub-hero__trust { flex-direction: column; gap: 8px; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`}}async buildFeaturedProductsSection(e,t){return{type:"featured_products",position:t,content:{headline:"Best Sellers",subheadline:"Our most popular products loved by thousands"},enabled:!0,liquid:`


  
    
      Best Sellers
      Our most popular products loved by thousands
    
    
      {% for product in collections.all.products limit: 8 %}
      
        
          
            {% if product.featured_image %}
              
            {% else %}
              {{ product.title | truncate: 1, '' }}
            {% endif %}
          
          {% if product.compare_at_price > product.price %}
            SALE
          {% endif %}
        
        
          
            {{ product.title }}
          
          
            {{ product.price | money }}
            {% if product.compare_at_price > product.price %}
              {{ product.compare_at_price | money }}
            {% endif %}
          
          View Product
        
      
      {% endfor %}
    
    
      View All Products
    
  
`,css:`
.carehub-featured {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-featured__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-featured__header {
  text-align: center;
  margin-bottom: 50px;
}
.carehub-featured__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-featured__subtitle {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1.05rem;
}
.carehub-featured__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.carehub-featured__card {
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  transition: all 0.3s ease;
}
.carehub-featured__card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-color: var(--color-primary, #c9a962);
}
.carehub-featured__image-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
}
.carehub-featured__image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.carehub-featured__card:hover .carehub-featured__image-wrap img {
  transform: scale(1.08);
}
.carehub-featured__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.carehub-featured__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #1a1a2e);
  font-size: 3rem;
  color: var(--color-primary, #c9a962);
}
.carehub-featured__info {
  padding: 16px;
}
.carehub-featured__product-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}
.carehub-featured__product-title a {
  color: var(--color-heading, #fff) !important;
  text-decoration: none;
}
.carehub-featured__price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.carehub-featured__current-price {
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
  font-size: 1.1rem;
}
.carehub-featured__compare-price {
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
  font-size: 0.9rem;
}
.carehub-featured__quick-btn {
  display: block;
  text-align: center;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-primary, #c9a962);
  color: var(--color-primary, #c9a962) !important;
  border-radius: var(--border-radius, 8px);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}
.carehub-featured__quick-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
.carehub-featured__view-all {
  text-align: center;
  margin-top: 40px;
}
@media (max-width: 1024px) {
  .carehub-featured__grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .carehub-featured__grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (max-width: 480px) {
  .carehub-featured__grid { grid-template-columns: 1fr; }
}`}}async buildTrustBadgesSection(e,t){let r=l.map(e=>`
      
        ${e.icon}
        ${e.title}
        ${e.description}
      `).join("");return{type:"trust_badges",position:t,content:{items:l.map(e=>({icon:e.icon,title:e.title,description:e.description}))},enabled:!0,liquid:`


  
    ${r}
  
`,css:`
.carehub-trust {
  padding: 50px 0;
  background: var(--color-surface, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
  border-bottom: 1px solid var(--color-border, #2a2a3a);
}
.carehub-trust__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  text-align: center;
}
.carehub-trust__badge {
  padding: 20px;
  transition: transform 0.3s ease;
}
.carehub-trust__badge:hover {
  transform: translateY(-3px);
}
.carehub-trust__icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}
.carehub-trust__title {
  font-family: var(--font-body, 'Inter'), sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 6px;
}
.carehub-trust__desc {
  font-size: 0.85rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.5;
}
@media (max-width: 768px) {
  .carehub-trust__container { grid-template-columns: repeat(2, 1fr); gap: 20px; }
}
@media (max-width: 480px) {
  .carehub-trust__container { grid-template-columns: 1fr; }
}`}}async buildTestimonialsSection(e,t){let r=d.map(e=>`
      
        ${"★".repeat(e.rating)}${"☆".repeat(5-e.rating)}
        "${e.text}"
        
          ${e.name}
          ${e.verified?"✓ Verified":""}
        
        ${e.location}
      `).join("");return{type:"testimonials",position:t,content:{headline:"What Our Customers Say",items:d.map(e=>({name:e.name,text:e.text,rating:e.rating.toString(),location:e.location}))},enabled:!0,liquid:`


  
    
      What Our Customers Say
      Join thousands of satisfied customers worldwide
    
    
      ${r}
    
  
`,css:`
.carehub-testimonials {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-testimonials__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-testimonials__header {
  text-align: center;
  margin-bottom: 50px;
}
.carehub-testimonials__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-testimonials__subtitle {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1.05rem;
}
.carehub-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.carehub-testimonial__card {
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  padding: 28px;
  transition: all 0.3s ease;
}
.carehub-testimonial__card:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-testimonial__stars {
  color: #fbbf24;
  font-size: 1.2rem;
  margin-bottom: 14px;
  letter-spacing: 2px;
}
.carehub-testimonial__text {
  color: var(--color-text, #e8e8e8) !important;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 16px;
  font-style: italic;
}
.carehub-testimonial__author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.carehub-testimonial__name {
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  font-size: 0.9rem;
}
.carehub-testimonial__verified {
  background: var(--color-success, #4ade80);
  color: #000;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.carehub-testimonial__location {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 768px) {
  .carehub-testimonials__grid { grid-template-columns: 1fr; }
}`}}async buildUrgencySection(e,t){return{type:"urgency",position:t,content:{headline:"Limited Time Offer",description:"Don't miss out on our exclusive deals. Sale ends soon!"},enabled:!0,liquid:`


  
    
      ⚡ LIMITED TIME
      Exclusive Deal — Up to 40% Off
      Don't miss out! This offer expires soon. Grab your favorites before they're gone.
      
        23Hours
        :
        59Minutes
        :
        59Seconds
      
      Shop the Sale
    
  


(function(){
  function updateCountdown(){
    var now=new Date();
    var end=new Date();
    end.setHours(23,59,59,999);
    var diff=end-now;
    if(diff<=0){end.setDate(end.getDate()+1);diff=end-now;}
    var h=Math.floor(diff/3600000);
    var m=Math.floor((diff%3600000)/60000);
    var s=Math.floor((diff%60000)/1000);
    var he=document.getElementById('ch-hours');
    var me=document.getElementById('ch-minutes');
    var se=document.getElementById('ch-seconds');
    if(he)he.textContent=h.toString().padStart(2,'0');
    if(me)me.textContent=m.toString().padStart(2,'0');
    if(se)se.textContent=s.toString().padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown,1000);
})();
`,css:`
.carehub-urgency {
  padding: 60px 0;
  background: linear-gradient(135deg, var(--color-surface, #12121a) 0%, var(--color-background, #0a0a0f) 100%);
  border: 1px solid var(--color-border, #2a2a3a);
  margin: 20px 0;
}
.carehub-urgency__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
.carehub-urgency__badge {
  display: inline-block;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}
.carehub-urgency__headline {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-urgency__desc {
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 30px;
  font-size: 1rem;
}
.carehub-urgency__timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}
.carehub-urgency__unit {
  background: var(--color-card-bg, #1a1a2e);
  border: 1px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius, 8px);
  padding: 15px 20px;
  min-width: 70px;
}
.carehub-urgency__unit span {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
  line-height: 1;
}
.carehub-urgency__unit small {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 5px;
}
.carehub-urgency__separator {
  font-size: 1.5rem;
  color: var(--color-primary, #c9a962);
  font-weight: 700;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
}
@media (max-width: 480px) {
  .carehub-urgency__unit { padding: 10px 14px; min-width: 55px; }
  .carehub-urgency__unit span { font-size: 1.4rem; }
}`}}async buildNewsletterSection(e,t){return{type:"newsletter",position:t,content:{headline:"Stay in the Loop",description:"Subscribe for exclusive deals, new arrivals, and insider-only discounts."},enabled:!0,liquid:`


  
    Stay in the Loop
    Subscribe for exclusive deals, new arrivals, and insider-only discounts.
    
      
      
      
        
        Subscribe
      
    
    🔒 No spam, ever. Unsubscribe anytime.
  
`,css:`
.carehub-newsletter {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
  text-align: center;
}
.carehub-newsletter__container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-newsletter__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-newsletter__desc {
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 25px;
  font-size: 1rem;
}
.carehub-newsletter__input-wrap {
  display: flex;
  gap: 0;
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-newsletter__input {
  flex: 1;
  padding: 16px 20px !important;
  border: none !important;
  background: var(--color-background, #0a0a0f) !important;
  color: var(--color-text, #e8e8e8) !important;
  font-size: 0.95rem;
  outline: none;
  border-radius: 0 !important;
}
.carehub-newsletter__btn {
  padding: 16px 28px !important;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none !important;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.3s ease;
  border-radius: 0 !important;
  white-space: nowrap;
}
.carehub-newsletter__btn:hover {
  background: var(--color-button-hover, #e2c275) !important;
}
.carehub-newsletter__privacy {
  margin-top: 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 480px) {
  .carehub-newsletter__input-wrap { flex-direction: column; }
  .carehub-newsletter__btn { border-radius: 0 !important; }
}`}}async buildBenefitsSection(e,t){return{type:"benefits",position:t,content:{headline:"Why Choose Us"},enabled:!0,liquid:`


  
    Why Choose CareHub
    
      
        01
        Premium Quality
        Every product is carefully selected and quality-tested before reaching you.
      
      
        02
        Fast & Free Shipping
        Enjoy free shipping on orders over $50 with tracking on every order.
      
      
        03
        Easy Returns
        30-day hassle-free returns. No questions asked, no hidden fees.
      
      
        04
        Secure Shopping
        Your data is protected with bank-level 256-bit SSL encryption.
      
    
  
`,css:`
.carehub-benefits {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-benefits__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-benefits__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 50px;
}
.carehub-benefits__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}
.carehub-benefits__item {
  padding: 30px;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  transition: all 0.3s ease;
}
.carehub-benefits__item:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-benefits__number {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-primary, #c9a962) !important;
  opacity: 0.3;
  margin-bottom: 10px;
  font-family: var(--font-heading, 'Playfair Display'), serif;
}
.carehub-benefits__item h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-benefits__item p {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.6;
}
@media (max-width: 1024px) {
  .carehub-benefits__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .carehub-benefits__grid { grid-template-columns: 1fr; }
}`}}async buildBrandStorySection(e,t){return{type:"brand_story",position:t,content:{headline:"Our Story"},enabled:!0,liquid:`


  
    
      Our Story
      Curated for You, Delivered with Care
      At CareHub, we believe everyone deserves access to premium products without the premium price tag. We carefully curate each item in our collection, testing for quality and value so you can shop with confidence.
      Founded with a simple mission — to deliver happiness to your doorstep — we've served thousands of satisfied customers across the US and UK.
      
        10K+Happy Customers
        500+Products
        4.9★Average Rating
      
    
  
`,css:`
.carehub-story {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
}
.carehub-story__container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
.carehub-story__label {
  display: inline-block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 600;
  margin-bottom: 12px;
}
.carehub-story__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-story__text {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1rem;
  line-height: 1.8;
  margin-bottom: 16px;
}
.carehub-story__stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-story__stat strong {
  display: block;
  font-size: 1.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 800;
}
.carehub-story__stat span {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
@media (max-width: 480px) {
  .carehub-story__stats { flex-direction: column; gap: 20px; }
}`}}async buildCountdownSection(e,t){return this.buildUrgencySection(e,t)}async buildFAQSection(e,t){return{type:"faq",position:t,content:{headline:"Frequently Asked Questions"},enabled:!0,liquid:`


  
    Frequently Asked Questions
    
      
        How long does shipping take?
        Standard shipping takes 7-15 business days. We offer tracking on all orders so you can follow your package every step of the way.
      
      
        What is your return policy?
        We offer a 30-day hassle-free return policy. If you're not satisfied with your purchase, simply contact us and we'll arrange a return or exchange.
      
      
        Is my payment secure?
        Absolutely! We use 256-bit SSL encryption and partner with trusted payment providers including Visa, Mastercard, and PayPal.
      
      
        Do you ship internationally?
        Yes! We currently ship to the US, UK, Canada, and Australia. International shipping times vary by destination.
      
    
  
`,css:`
.carehub-faq {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-faq__container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-faq__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 40px;
}
.carehub-faq__item {
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.carehub-faq__item[open] {
  border-color: var(--color-primary, #c9a962);
}
.carehub-faq__question {
  padding: 18px 24px;
  cursor: pointer;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  font-size: 0.95rem;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-card-bg, #12121a);
  transition: background 0.3s ease;
}
.carehub-faq__question:hover {
  background: var(--color-surface, #1a1a2e);
}
.carehub-faq__question::after {
  content: '+';
  font-size: 1.3rem;
  color: var(--color-primary, #c9a962);
  transition: transform 0.3s ease;
}
.carehub-faq__item[open] .carehub-faq__question::after {
  transform: rotate(45deg);
}
.carehub-faq__question::-webkit-details-marker { display: none; }
.carehub-faq__answer {
  padding: 16px 24px 20px;
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 0.9rem;
  line-height: 1.7;
  background: var(--color-card-bg, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
}`}}async buildCategoriesSection(e,t){return{type:"categories",position:t,content:{headline:"Shop by Category"},enabled:!0,liquid:`


  
    Shop by Category
    
      {% for collection in collections limit: 6 %}
        {% if collection.handle != 'all' %}
        
          
            {% if collection.image %}
              
            {% else %}
              {{ collection.title | truncate: 1, '' }}
            {% endif %}
          
          {{ collection.title }}
          {{ collection.products_count }} Products
        
        {% endif %}
      {% endfor %}
    
  
`,css:`
.carehub-categories {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
}
.carehub-categories__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-categories__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 40px;
}
.carehub-categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.carehub-categories__card {
  text-align: center;
  text-decoration: none;
  background: var(--color-card-bg, #0a0a0f);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  transition: all 0.3s ease;
  padding-bottom: 20px;
}
.carehub-categories__card:hover {
  transform: translateY(-5px);
  border-color: var(--color-primary, #c9a962);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.carehub-categories__image {
  aspect-ratio: 16/9;
  overflow: hidden;
}
.carehub-categories__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.carehub-categories__card:hover img {
  transform: scale(1.08);
}
.carehub-categories__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #1a1a2e);
  font-size: 3rem;
  color: var(--color-primary, #c9a962);
}
.carehub-categories__name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 16px 0 4px;
  padding: 0 16px;
}
.carehub-categories__count {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 768px) {
  .carehub-categories__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .carehub-categories__grid { grid-template-columns: 1fr; }
}`}}async buildGenericSection(e,t,r){return{type:e,position:r,content:{headline:e},enabled:!1,liquid:"",css:""}}async generateHeroContent(e,t){let r=`Generate a compelling hero section for an e-commerce store.

Store mood: ${e}
${t?`Event/occasion: ${t}`:""}
Target audience: US/UK premium online shoppers

Return ONLY valid JSON:
{
  "headline": "powerful 5-8 word headline that stops scrolling",
  "subheadline": "compelling 15-20 word subheadline that creates desire"
}

Rules:
- Headline should be bold, memorable, create curiosity
- Subheadline should expand on the promise, create urgency
- Use power words: exclusive, premium, limited, discover, transform
- NO generic phrases like "Welcome to our store"
- Make it feel premium and exclusive`,a=await this.router.useGeminiJSON([{role:"user",content:r}],"creative_writing");return a.success&&a.data?a.data:{headline:"Discover Premium Products Curated Just For You",subheadline:"Shop our exclusive collection of hand-picked items. Premium quality, unbeatable prices, delivered to your door."}}async generateContent(e,t,r){let a=`${r}

Store mood: ${t}
Section: ${e}
Target: US/UK audience

Return ONLY the text, nothing else. No quotes, no explanation.`,o=await this.router.route({id:`content-${Date.now()}`,message:a,priority:"speed"});return o.success?o.content.trim().replace(/^["']|["']$/g,""):null}combineLiquid(e){let t=e.filter(e=>e.enabled);return`{% comment %}
  ============================================
  CareHub AI Agent — Custom Homepage
  Generated: ${new Date().toISOString()}
  Sections: ${t.length}
  ============================================
{% endcomment %}

`+t.map(e=>e.liquid).join("\n\n")}combineCSS(e,t){let r=e.filter(e=>e.enabled&&e.css);return`/* ============================================ */
/* CareHub Homepage CSS — ${t} */
/* Generated: ${new Date().toISOString()} */
/* ============================================ */

`+r.map(e=>e.css).join("\n\n")}async applyToStore(e,t){try{let r=await this.shopify.getMainTheme();if(!r.success||!r.data)return!1;let a=r.data.id;await this.shopify.updateThemeAsset(a,{key:"assets/carehub-homepage.css",value:t}),await this.shopify.updateThemeAsset(a,{key:"snippets/carehub-homepage.liquid",value:e});let o=await this.shopify.getThemeAsset(a,"templates/index.liquid");if(o.success&&o.data?.asset.value){let e=o.data.asset.value;e.includes("carehub-homepage")||(e=`{{ 'carehub-homepage.css' | asset_url | stylesheet_tag }}
{% render 'carehub-homepage' %}

${e}`,await this.shopify.updateThemeAsset(a,{key:"templates/index.liquid",value:e}))}else if((await this.shopify.getThemeAsset(a,"templates/index.json")).success){let e=await this.shopify.getThemeAsset(a,"layout/theme.liquid");if(e.success&&e.data?.asset.value){let t=e.data.asset.value;if(!t.includes("carehub-homepage.css")){let e=`  {{ 'carehub-homepage.css' | asset_url | stylesheet_tag }}
`;t=t.replace("",`${e}`),await this.shopify.updateThemeAsset(a,{key:"layout/theme.liquid",value:t})}}}return!0}catch(e){return console.error("[Homepage] Error applying to store:",e),!1}}async addSection(e,t){let r=(await this.memory.getPreferences()).mood||"premium";return this.buildSection(e,r,{},t||99)}async removeSection(e){return await this.memory.getStoreState(),!0}async updateSection(e,t){let r=(await this.memory.getPreferences()).mood||"premium",a=await this.buildSection(e,r,{},0);return a.content={...a.content,...t},a}getDefaultSections(){return["announcement","hero","trust_badges","featured_products","benefits","testimonials","urgency","brand_story","newsletter","faq"]}}let p=null;function c(){return p||(p=new u),p}a()}catch(e){a(e)}})},6527:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{Gc:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;class l{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async buildLandingPage(e){try{let t=await this.memory.getPreferences(),r=e.mood||t.mood||"premium",a=await this.generateContent(e,r),o=this.generateLiquid(e,a,r),i=this.generateCSS(r),n=!1,s="",c="";if(this.shopify.isConfigured()){let t=await this.createShopifyPage(e,o,i);n=t.success,s=t.handle,c=t.url}else s=this.generateHandle(e.productTitle||"landing-page"),c=`/pages/${s}`;return await this.memory.logAction({agent:"landing-page",action:"create_landing_page",input:JSON.stringify(e),output:`Created landing page: ${c}`,success:!0,duration:0,reversible:!0,undoData:{pageHandle:s}}),{success:!0,pageHandle:s,pageUrl:c,liquidCode:o,cssCode:i,applied:n,message:n?`✅ Landing page created and live at: ${c}`:`✅ Landing page generated! Connect Shopify to publish.`,abVariant:e.variant}}catch(t){let e=t instanceof Error?t.message:"Unknown error";return{success:!1,pageHandle:"",pageUrl:"",liquidCode:"",cssCode:"",applied:!1,message:`❌ Error creating landing page: ${e}`}}}async generateContent(e,t){let r=`Create high-converting landing page content for a paid ad campaign.

Product: ${e.productTitle||"Premium product"}
Price: ${e.productPrice||"Not specified"}
Ad Platform: ${e.adPlatform||"general"}
Goal: ${e.goal||"purchase"}
Mood: ${t}
Target Audience: US/UK online shoppers

Return ONLY valid JSON:
{
  "headline": "powerful 5-10 word headline that creates desire (use power words)",
  "subheadline": "15-25 word subheadline that expands on the promise",
  "benefits": ["benefit 1 with emoji", "benefit 2 with emoji", "benefit 3 with emoji", "benefit 4 with emoji", "benefit 5 with emoji", "benefit 6 with emoji"],
  "ctaText": "action-oriented button text (max 5 words)",
  "urgencyText": "urgency message that creates FOMO",
  "socialProofText": "social proof statement with numbers",
  "guaranteeText": "risk-reversal guarantee statement",
  "faqItems": [
    {"question": "common objection as question", "answer": "reassuring answer"},
    {"question": "common objection as question", "answer": "reassuring answer"},
    {"question": "common objection as question", "answer": "reassuring answer"}
  ]
}

Rules:
- Headline MUST stop scrolling — use curiosity, benefit, or shock
- Benefits should be specific and tangible (not generic)
- CTA should create urgency without being pushy
- Social proof should include specific numbers
- FAQ should overcome purchase objections
- Everything should feel exclusive and premium
- Consider the ad platform: ${"facebook"===e.adPlatform?"emotional, visual":"google"===e.adPlatform?"intent-based, specific":"tiktok"===e.adPlatform?"trendy, casual":"balanced"}`,a=await this.router.useGeminiJSON([{role:"user",content:r}],"creative_writing");return a.success&&a.data?a.data:{headline:e.headline||"Transform Your Life With Premium Quality",subheadline:"Join thousands of happy customers who made the switch. Premium quality at an unbeatable price.",benefits:["✅ Premium quality materials","\uD83D\uDE9A Free express shipping","\uD83D\uDCB0 30-day money-back guarantee","⭐ Rated 4.9/5 by 2,000+ customers","\uD83D\uDD12 Secure & encrypted checkout","\uD83C\uDF81 Special launch pricing — save 40%"],ctaText:"Get Yours Now — 40% Off",urgencyText:"⚡ Sale ends tonight! Only 17 left at this price.",socialProofText:"★★★★★ 2,347 happy customers and counting",guaranteeText:"Try it risk-free. If you don't love it, get a full refund. No questions asked.",faqItems:[{question:"How long does shipping take?",answer:"We offer free shipping that arrives in 7-15 business days with full tracking."},{question:"What if I don't like it?",answer:"30-day money-back guarantee. Return it for a full refund, no questions asked."},{question:"Is this website secure?",answer:"Yes! We use bank-level 256-bit SSL encryption to protect your information."}]}}generateLiquid(e,t,r){e.productUrl;let a=e.productImage||"",o=e.productPrice||"",i=e.testimonials||[{name:"Sarah M.",text:"Absolutely love it! Best purchase I made this year.",rating:5},{name:"James T.",text:"Premium quality, fast shipping. Highly recommend!",rating:5},{name:"Emily R.",text:"Exceeded my expectations. Will buy again!",rating:5}],n=t.benefits.map(e=>`${e}`).join("\n              "),s=i.map(e=>`
                ${"★".repeat(e.rating)}
                "${e.text}"
                — ${e.name} ✓ Verified
              `).join("\n              "),c=t.faqItems.map(e=>`
                ${e.question}
                ${e.answer}
              `).join("\n              ");return`{% comment %}
  ============================================
  CareHub Landing Page — ${e.productTitle||"Product"}
  Platform: ${e.adPlatform||"general"}
  Variant: ${e.variant||"A"}
  Generated: ${new Date().toISOString()}
  ============================================
{% endcomment %}

{% layout none %}



  
  
  ${t.headline} | {{ shop.name }}
  
  
  
  
  
  
  {{ 'carehub-landing.css' | asset_url | stylesheet_tag }}
  {{ content_for_header }}



  
  
    ${t.urgencyText}
  

  
  
    
      ${t.socialProofText}
      ${t.headline}
      ${t.subheadline}
      ${a?`
      
        
      `:""}
      ${o?`
      
        ${o}
        + Free Shipping
      `:""}
      
        ${t.ctaText}
      
      🔒 Secure Checkout • Free Shipping • 30-Day Guarantee
    
  

  
  
    
      Why You'll Love This
      
        ${n}
      
    
  

  
  
    
      What Customers Are Saying
      
        ${s}
      
    
  

  
  
    
      
        🛡️
        100% Satisfaction Guaranteed
        ${t.guaranteeText}
      
    
  

  
  
    
      Common Questions
      
        ${c}
      
    
  

  
  
    
      Ready to Transform Your Experience?
      ${t.urgencyText}
      
        ${t.ctaText}
      
      
        🔒 SSL Secure
        💳 All Cards Accepted
        ↩️ Easy Returns
      
    
  

  
  
    
      ${t.ctaText}
    
  

  
  
  (function(){
    var bar = document.querySelector('.carehub-lp__urgency-bar span');
    if(!bar) return;
    function tick(){
      var now=new Date();var end=new Date();end.setHours(23,59,59);
      var d=end-now;if(d<=0)return;
      var h=Math.floor(d/3600000);var m=Math.floor((d%3600000)/60000);var s=Math.floor((d%60000)/1000);
      bar.innerHTML='⚡ Sale ends in <strong>'+h+'h '+m+'m '+s+'s</strong> — Don't miss out!';
    }
    tick();setInterval(tick,1000);
  })();
  

  {{ content_for_layout }}

`}generateCSS(e){return`
/* ============================================ */
/* CareHub Landing Page CSS — ${e} */
/* Zero distractions, maximum conversions */
/* ============================================ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.carehub-lp-body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #0a0a0f;
  color: #e8e8e8;
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* --- Urgency Bar --- */
.carehub-lp__urgency-bar {
  background: linear-gradient(90deg, #dc2626, #f87171);
  color: #fff;
  text-align: center;
  padding: 10px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
  animation: pulse 2s infinite;
}
.carehub-lp__urgency-bar strong {
  color: #fef08a;
}

/* --- Container --- */
.carehub-lp__container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* --- Hero --- */
.carehub-lp__hero {
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
}
.carehub-lp__hero-content {
  max-width: 700px;
  margin: 0 auto;
}
.carehub-lp__social-badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.1);
  border: 1px solid rgba(201, 169, 98, 0.3);
  color: #c9a962;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 24px;
  letter-spacing: 0.02em;
}
.carehub-lp__headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
}
.carehub-lp__subheadline {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #a0a0b0;
  margin-bottom: 30px;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Product Image */
.carehub-lp__product-image {
  margin: 30px auto;
  max-width: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.carehub-lp__product-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Price */
.carehub-lp__price-section {
  margin-bottom: 24px;
}
.carehub-lp__price {
  font-size: 2rem;
  font-weight: 800;
  color: #c9a962;
}
.carehub-lp__price-note {
  display: block;
  font-size: 0.85rem;
  color: #4ade80;
  margin-top: 4px;
}

/* CTA Button */
.carehub-lp__cta-btn {
  display: inline-block;
  text-decoration: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}
.carehub-lp__cta-btn--primary {
  background: linear-gradient(135deg, #c9a962, #e2c275);
  color: #000 !important;
  padding: 18px 40px;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.4);
}
.carehub-lp__cta-btn--primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(201, 169, 98, 0.6);
}
.carehub-lp__cta-btn--large {
  padding: 22px 50px;
  font-size: 1.1rem;
}
.carehub-lp__cta-sub {
  margin-top: 14px;
  font-size: 0.8rem;
  color: #6a6a7a;
}

/* --- Benefits --- */
.carehub-lp__benefits {
  padding: 80px 20px;
  background: #12121a;
}
.carehub-lp__section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: #ffffff;
  text-align: center;
  margin-bottom: 40px;
  font-weight: 800;
}
.carehub-lp__benefit-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__benefit-item {
  padding: 16px 20px;
  background: #1a1a2e;
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #d4d4d4;
  transition: all 0.3s ease;
}
.carehub-lp__benefit-item:hover {
  border-color: #c9a962;
  transform: translateX(5px);
}

/* --- Testimonials --- */
.carehub-lp__testimonials {
  padding: 80px 20px;
  background: #0a0a0f;
}
.carehub-lp__testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.carehub-lp__testimonial {
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}
.carehub-lp__testimonial:hover {
  border-color: #c9a962;
  transform: translateY(-3px);
}
.carehub-lp__testimonial-stars {
  color: #fbbf24;
  font-size: 1.1rem;
  margin-bottom: 12px;
  letter-spacing: 2px;
}
.carehub-lp__testimonial-text {
  font-size: 0.9rem;
  color: #c8c8d0;
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 12px;
}
.carehub-lp__testimonial-author {
  font-size: 0.8rem;
  color: #4ade80;
  font-weight: 600;
}

/* --- Guarantee --- */
.carehub-lp__guarantee {
  padding: 60px 20px;
  background: #12121a;
}
.carehub-lp__guarantee-box {
  text-align: center;
  padding: 40px;
  background: rgba(74, 222, 128, 0.05);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__guarantee-icon {
  font-size: 3rem;
  margin-bottom: 14px;
}
.carehub-lp__guarantee-box h3 {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 10px;
}
.carehub-lp__guarantee-box p {
  font-size: 0.95rem;
  color: #a0a0b0;
  line-height: 1.6;
}

/* --- FAQ --- */
.carehub-lp__faq {
  padding: 80px 20px;
  background: #0a0a0f;
}
.carehub-lp__faq-list {
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__faq-item {
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}
.carehub-lp__faq-item[open] {
  border-color: #c9a962;
}
.carehub-lp__faq-item summary {
  padding: 16px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: #12121a;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.carehub-lp__faq-item summary::after {
  content: '+';
  font-size: 1.3rem;
  color: #c9a962;
  transition: transform 0.3s;
}
.carehub-lp__faq-item[open] summary::after {
  transform: rotate(45deg);
}
.carehub-lp__faq-item summary::-webkit-details-marker { display: none; }
.carehub-lp__faq-item p {
  padding: 14px 20px 18px;
  font-size: 0.88rem;
  color: #a0a0b0;
  line-height: 1.7;
  border-top: 1px solid #2a2a3a;
}

/* --- Final CTA --- */
.carehub-lp__final-cta {
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f, #1a1a2e);
}
.carehub-lp__final-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: #fff;
  margin-bottom: 12px;
  font-weight: 800;
}
.carehub-lp__final-sub {
  color: #f87171;
  font-weight: 600;
  margin-bottom: 30px;
  font-size: 1rem;
}
.carehub-lp__trust-icons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  font-size: 0.8rem;
  color: #6a6a7a;
  flex-wrap: wrap;
}

/* --- Floating CTA (Mobile) --- */
.carehub-lp__floating-cta {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
  padding: 12px 16px;
  background: #0a0a0f;
  border-top: 1px solid #2a2a3a;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
}
.carehub-lp__floating-cta .carehub-lp__cta-btn {
  width: 100%;
  text-align: center;
  display: block;
  padding: 16px;
}

/* --- Animations --- */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.carehub-lp__hero-content {
  animation: fadeInUp 0.8s ease;
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .carehub-lp__hero { padding: 50px 15px; }
  .carehub-lp__benefit-list { grid-template-columns: 1fr; }
  .carehub-lp__testimonials-grid { grid-template-columns: 1fr; }
  .carehub-lp__floating-cta { display: block; }
  .carehub-lp__benefits,
  .carehub-lp__testimonials,
  .carehub-lp__faq,
  .carehub-lp__final-cta { padding: 50px 15px; }
  .carehub-lp__product-image { max-width: 300px; }
  body { padding-bottom: 70px; }
}

@media (max-width: 480px) {
  .carehub-lp__cta-btn--primary { padding: 16px 30px; font-size: 0.9rem; }
  .carehub-lp__guarantee-box { padding: 24px; }
  .carehub-lp__trust-icons { flex-direction: column; gap: 8px; }
}

/* --- No Distractions --- */
.carehub-lp-body .shopify-section-header,
.carehub-lp-body .shopify-section-footer,
.carehub-lp-body header,
.carehub-lp-body footer,
.carehub-lp-body nav {
  display: none !important;
}`}async createShopifyPage(e,t,r){try{let a=await this.shopify.getMainTheme();if(!a.success||!a.data)return{success:!1,handle:"",url:""};let o=a.data.id,i=this.generateHandle(e.productTitle||"special-offer"),n=e.variant?`-${e.variant.toLowerCase()}`:"",s=`${i}${n}`;if(await this.shopify.updateThemeAsset(o,{key:"assets/carehub-landing.css",value:r}),await this.shopify.updateThemeAsset(o,{key:"templates/page.carehub-landing.liquid",value:t}),(await this.shopify.createPage({title:e.productTitle?`${e.productTitle} — Special Offer`:"Special Offer",body_html:"",handle:s,published:!0,template_suffix:"carehub-landing"})).success)return{success:!0,handle:s,url:`/pages/${s}`};return{success:!1,handle:s,url:`/pages/${s}`}}catch(e){return console.error("[LandingPage] Error creating page:",e),{success:!1,handle:"",url:""}}}async createABTest(e){let t=await this.buildLandingPage({...e,variant:"A"}),r=await this.buildLandingPage({...e,variant:"B",mood:"premium"===e.mood?"urgent":"premium",customInstructions:"Use a completely different headline approach. If A was benefit-focused, make B curiosity-focused. If A was calm, make B urgent."});return{variantA:t,variantB:r}}async buildForFacebook(e){return this.buildLandingPage({...e,adPlatform:"facebook",customInstructions:"Emotional, story-driven, social proof heavy. People come from scroll — grab attention instantly."})}async buildForGoogle(e){return this.buildLandingPage({...e,adPlatform:"google",customInstructions:"Intent-based, specific, match search intent. People are actively looking — deliver what they want."})}async buildForTikTok(e){return this.buildLandingPage({...e,adPlatform:"tiktok",customInstructions:"Trendy, casual, fast-paced. Young audience, mobile-first. Keep it snappy and visual."})}generateHandle(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").substring(0,50)+"-offer"}async deleteLandingPage(e){try{let t=await this.shopify.getPages({limit:50});if(t.success&&t.data){let r=t.data.pages.find(t=>t.handle===e);if(r&&r.id)return await this.shopify.deletePage(r.id),!0}return!1}catch{return!1}}}let d=null;function c(){return d||(d=new l),d}a()}catch(e){a(e)}})},6038:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{lD:()=>s});var o=r(2573),i=r(9595),n=e([o,i]);[o,i]=n.then?(await n)():n;class c{constructor(){this.agentHandlers=new Map,this.router=(0,o.Ld)(),this.memoryAgent=(0,i.Vv)()}async process(e){let t=Date.now(),r=[],a=[];try{await this.memoryAgent.recordUserMessage(e.message);let o=await this.interpretMessage(e.message);if(o.isUndo){let e=await this.handleUndo();return{success:e.success,response:e.message,agentsUsed:["memory"],actions:[{agent:"memory",action:"undo",success:e.success,result:e.message,duration:Date.now()-t}],processingTime:Date.now()-t}}if(o.isRepeat){let t=await this.handleRepeat(e.message);return{success:t.success,response:t.response,agentsUsed:t.agentsUsed,actions:t.actions,processingTime:t.processingTime}}for(let e of o.agents){if(a.push(e.agent),e.dependsOn){let t=r.find(t=>t.agent===e.dependsOn);if(t&&!t.success){r.push({agent:e.agent,action:e.action,success:!1,result:`Skipped — dependency "${e.dependsOn}" failed`,duration:0});continue}}let t=await this.executeAgentTask(e,o);r.push(t)}let i=await this.generateResponse(e.message,o,r);await this.memoryAgent.recordAssistantMessage(i,{agent:"orchestrator",action:o.primaryIntent,success:r.every(e=>e.success),duration:Date.now()-t});let n=this.generateFollowUpSuggestions(o,r);return{success:0===r.length||r.some(e=>e.success),response:i,agentsUsed:a,actions:r,suggestedFollowUp:n,processingTime:Date.now()-t}}catch(o){let e=o instanceof Error?o.message:"Unknown error occurred";return await this.memoryAgent.recordAssistantMessage(`Error: ${e}`,{agent:"orchestrator",action:"error",success:!1,duration:Date.now()-t}),{success:!1,response:`I encountered an error: ${e}. Let me try again or you can rephrase your request.`,agentsUsed:a,actions:r,processingTime:Date.now()-t}}}}let l=null;function s(){return l||(l=new c),l}a()}catch(e){a(e)}})},1389:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{pO:()=>c});var o=r(2573),i=r(9595),n=r(1814);!function(){var e=Error("Cannot find module '@/lib/suppliers'");throw e.code="MODULE_NOT_FOUND",e}();var s=e([o,i]);[o,i]=s.then?(await s)():s;class l{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)(),this.suppliers=Object(function(){var e=Error("Cannot find module '@/lib/suppliers'");throw e.code="MODULE_NOT_FOUND",e}())()}async listProducts(e){try{let t=await this.shopify.getProducts({limit:e?.limit||50,status:e?.status,collection_id:e?.collection_id,product_type:e?.product_type,vendor:e?.vendor,title:e?.title});if(!t.success||!t.data)return{success:!1,message:t.error||"Failed to fetch products"};let r=t.data.products;return await this.memory.updateStoreState({totalProducts:r.length}),{success:!0,message:`Found ${r.length} products`,products:r,count:r.length}}catch(e){return{success:!1,message:`Error listing products: ${e instanceof Error?e.message:"Unknown"}`}}}async searchProducts(e){return this.listProducts({title:e})}async getProduct(e){try{let t=await this.shopify.getProduct(e);if(!t.success||!t.data)return{success:!1,message:t.error||"Product not found"};return{success:!0,message:"Product found",product:t.data.product}}catch(e){return{success:!1,message:`Error fetching product: ${e instanceof Error?e.message:"Unknown"}`}}}async getProductCount(){let e=await this.shopify.getProductCount();return e.success&&e.data?(await this.memory.updateStoreState({totalProducts:e.data.count}),e.data.count):0}async createProduct(e){try{let t=e.description||"";(e.generateDescription||!t)&&(t=await this.generateProductDescription(e.title,e.tags));let r={title:e.title,body_html:t,vendor:e.vendor||"CareHub",product_type:e.productType||"",tags:e.tags?.join(", ")||"",status:e.status||"active"};e.variants&&e.variants.length>0?r.variants=e.variants.map(e=>({price:e.price,compare_at_price:e.compareAtPrice||null,sku:e.sku||"",inventory_quantity:e.inventoryQuantity||0,inventory_management:"shopify",option1:e.option1||null,option2:e.option2||null,option3:e.option3||null,weight:e.weight||0,weight_unit:e.weightUnit||"g",requires_shipping:!0})):e.price&&(r.variants=[{price:e.price,compare_at_price:e.compareAtPrice||null,inventory_management:"shopify",inventory_quantity:100,requires_shipping:!0}]),e.images&&e.images.length>0&&(r.images=e.images.map((t,r)=>({src:t,alt:`${e.title} - Image ${r+1}`,position:r+1})));let a=await this.shopify.createProduct(r);if(!a.success||!a.data)return{success:!1,message:a.error||"Failed to create product"};return await this.memory.logAction({agent:"product-manager",action:"create_product",input:JSON.stringify({title:e.title}),output:`Created product ID: ${a.data.product.id}`,success:!0,duration:0,reversible:!0,undoData:{productId:a.data.product.id}}),{success:!0,message:`✅ Product "${e.title}" created successfully!`,product:a.data.product}}catch(e){return{success:!1,message:`Error creating product: ${e instanceof Error?e.message:"Unknown"}`}}}async editProduct(e){try{let t=await this.shopify.getProduct(e.productId),r={};e.updates.title&&(r.title=e.updates.title),e.updates.description&&(r.body_html=e.updates.description),e.updates.tags&&(r.tags=e.updates.tags),e.updates.productType&&(r.product_type=e.updates.productType),e.updates.vendor&&(r.vendor=e.updates.vendor),e.updates.status&&(r.status=e.updates.status);let a=await this.shopify.updateProduct(e.productId,r);if(!a.success||!a.data)return{success:!1,message:a.error||"Failed to update product"};if(e.updates.price||e.updates.compareAtPrice){let t=await this.shopify.getVariants(e.productId);if(t.success&&t.data)for(let r of t.data.variants)r.id&&await this.shopify.updateVariant(r.id,{price:e.updates.price||r.price,compare_at_price:e.updates.compareAtPrice||r.compare_at_price})}if(e.updates.images&&e.updates.images.length>0)for(let t of e.updates.images)await this.shopify.createProductImage(e.productId,{src:t,alt:a.data.product.title||""});return await this.memory.logAction({agent:"product-manager",action:"edit_product",input:JSON.stringify(e),output:`Updated product ID: ${e.productId}`,success:!0,duration:0,reversible:!0,undoData:t.data?.product}),{success:!0,message:`✅ Product updated successfully!`,product:a.data.product}}catch(e){return{success:!1,message:`Error editing product: ${e instanceof Error?e.message:"Unknown"}`}}}async deleteProduct(e){try{let t=await this.shopify.getProduct(e),r=await this.shopify.deleteProduct(e);if(!r.success)return{success:!1,message:r.error||"Failed to delete product"};return await this.memory.logAction({agent:"product-manager",action:"delete_product",input:`Product ID: ${e}`,output:"Product deleted",success:!0,duration:0,reversible:!0,undoData:t.data?.product}),{success:!0,message:`✅ Product deleted successfully!`}}catch(e){return{success:!1,message:`Error deleting product: ${e instanceof Error?e.message:"Unknown"}`}}}async bulkOperation(e){let t=[],r=0;try{for(let a of e.productIds)try{switch(e.type){case"update_price":{let t=await this.shopify.getVariants(a);if(t.success&&t.data)for(let r of t.data.variants)r.id&&await this.shopify.updateVariant(r.id,{price:String(e.value)});r++;break}case"update_status":await this.shopify.updateProduct(a,{status:e.value}),r++;break;case"add_tag":{let t=await this.shopify.getProduct(a);if(t.success&&t.data){let r=t.data.product.tags||"",o=r?`${r}, ${e.value}`:String(e.value);await this.shopify.updateProduct(a,{tags:o})}r++;break}case"remove_tag":{let t=await this.shopify.getProduct(a);if(t.success&&t.data){let r=(t.data.product.tags||"").split(",").map(e=>e.trim()).filter(t=>t.toLowerCase()!==String(e.value).toLowerCase());await this.shopify.updateProduct(a,{tags:r.join(", ")})}r++;break}case"delete":await this.shopify.deleteProduct(a),r++;break;case"update_inventory":{let e=await this.shopify.getVariants(a);e.success&&e.data&&r++}}await new Promise(e=>setTimeout(e,300))}catch(e){t.push(`Product ${a}: ${e instanceof Error?e.message:"Failed"}`)}return await this.memory.logAction({agent:"product-manager",action:`bulk_${e.type}`,input:`${e.productIds.length} products`,output:`${r} succeeded, ${t.length} failed`,success:0===t.length,duration:0,reversible:!1}),{success:0===t.length,message:`✅ Bulk operation complete: ${r}/${e.productIds.length} succeeded`,count:r,errors:t.length>0?t:void 0}}catch(e){return{success:!1,message:`Error in bulk operation: ${e instanceof Error?e.message:"Unknown"}`}}}async importFromSupplier(e){try{let t=this.suppliers.get(e.supplier);if(!t)return{success:!1,message:`Supplier "${e.supplier}" not found or not configured`};let r=await this.memory.getPreferences(),a=e.marginPercent||r.profitMargin||40,o=[];if(e.externalIds&&e.externalIds.length>0)o=await t.getProducts(e.externalIds);else{if(!e.searchQuery)return{success:!1,message:"Provide externalIds or searchQuery to import products"};o=(await t.searchProducts({query:e.searchQuery,category:e.category,limit:e.maxProducts||10})).products}if(0===o.length)return{success:!1,message:"No products found on supplier"};let i=[],n=[];for(let t of o.slice(0,e.maxProducts||10))try{let r=await this.importSingleProduct(t,a,e);r&&i.push(r),await new Promise(e=>setTimeout(e,500))}catch(e){n.push(`${t.title}: ${e instanceof Error?e.message:"Failed"}`)}return await this.memory.logAction({agent:"product-manager",action:"import_from_supplier",input:`${e.supplier}: ${o.length} products`,output:`Imported ${i.length} products`,success:!0,duration:0,reversible:!0,undoData:{productIds:i.map(e=>e.id)}}),{success:!0,message:`✅ Imported ${i.length}/${o.length} products from ${e.supplier}`,products:i,count:i.length,errors:n.length>0?n:void 0}}catch(e){return{success:!1,message:`Error importing: ${e instanceof Error?e.message:"Unknown"}`}}}async importSingleProduct(e,t,r){let a=(0,n.eK)(e.costPrice,t);(0,n.Cq)(parseFloat(a),25);let o=e.description;r.autoDescription&&(o=await this.generateProductDescription(e.title,e.tags));let i={title:this.cleanTitle(e.title),body_html:o,vendor:"CareHub",product_type:e.category,tags:[...e.tags||[],`supplier:${e.supplierName}`,`ext_id:${e.externalId}`,`cost:${e.costPrice}`].join(", "),status:r.status||"draft",variants:e.variants.map(r=>({price:(0,n.eK)(r.costPrice,t),compare_at_price:(0,n.Cq)(parseFloat((0,n.eK)(r.costPrice,t)),25),sku:r.sku,inventory_quantity:Math.min(r.inventoryQuantity,100),inventory_management:"shopify",option1:r.options[0]?.value||null,option2:r.options[1]?.value||null,option3:r.options[2]?.value||null,weight:r.weight||e.weight,weight_unit:e.weightUnit||"g",requires_shipping:!0})),images:e.images.map((t,r)=>({src:t.url,alt:`${e.title} - ${r+1}`,position:r+1}))};if(e.variants.length>1){let t=new Set;e.variants.forEach(e=>{e.options.forEach(e=>t.add(e.name))}),i.options=Array.from(t).map((t,r)=>{let a=[...new Set(e.variants.map(e=>e.options.find(e=>e.name===t)?.value).filter(Boolean))];return{name:t,position:r+1,values:a}})}let s=await this.shopify.createProduct(i);if(s.success&&s.data){let t=s.data.product.id;return t&&(await this.shopify.createMetafield("products",t,{namespace:"carehub",key:"supplier_id",value:e.externalId,type:"single_line_text_field"}),await this.shopify.createMetafield("products",t,{namespace:"carehub",key:"supplier_name",value:e.supplierName,type:"single_line_text_field"}),await this.shopify.createMetafield("products",t,{namespace:"carehub",key:"cost_price",value:e.costPrice.toString(),type:"single_line_text_field"})),s.data.product}return null}async updatePrice(e,t,r){try{let a=await this.shopify.getVariants(e);if(!a.success||!a.data)return{success:!1,message:"Could not fetch variants"};for(let e of a.data.variants)e.id&&await this.shopify.updateVariant(e.id,{price:t,compare_at_price:r||null});return{success:!0,message:`✅ Price updated to $${t}`}}catch(e){return{success:!1,message:`Error updating price: ${e instanceof Error?e.message:"Unknown"}`}}}async updateAllPricesWithMargin(e){try{let t=await this.shopify.getAllProducts(),r=0,a=[];for(let o of t)try{let t=o.tags?.split(",").map(e=>e.trim()).find(e=>e.startsWith("cost:"));if(t){let a=parseFloat(t.replace("cost:",""));if(!isNaN(a)){let t=(0,n.eK)(a,e),i=(0,n.Cq)(parseFloat(t),20);if(o.variants)for(let e of o.variants)e.id&&await this.shopify.updateVariant(e.id,{price:t,compare_at_price:i});r++}}await new Promise(e=>setTimeout(e,300))}catch(e){a.push(`${o.title}: ${e instanceof Error?e.message:"Failed"}`)}return{success:!0,message:`✅ Updated prices for ${r}/${t.length} products with ${e}% margin`,count:r,errors:a.length>0?a:void 0}}catch(e){return{success:!1,message:`Error updating prices: ${e instanceof Error?e.message:"Unknown"}`}}}async generateProductDescription(e,t){let r=`Write a compelling e-commerce product description for:

Product: ${e}
Tags: ${t?.join(", ")||"N/A"}
Target audience: US/UK online shoppers
Tone: Professional, trustworthy, persuasive

Requirements:
- Start with a compelling hook (1-2 sentences)
- List 4-5 key benefits with emojis
- Add a short "Why Choose This?" section
- Include a subtle urgency note
- 150-200 words total
- Use HTML formatting (p, ul, li, strong)
- NO filler words — every word should sell

Return ONLY the HTML content, nothing else.`,a=await this.router.useGroq([{role:"user",content:r}],"content_writing");return a.success&&a.content?a.content:`
${e} — Premium quality, designed for those who demand the best.

  ✅ Premium quality materials
  🚚 Fast & free shipping
  ↩️ 30-day hassle-free returns
  🔒 Secure checkout

Why Choose This?
Join thousands of satisfied customers who've made the switch. Experience the difference quality makes.
⚡ Limited stock available — order now to avoid disappointment.`}cleanTitle(e){return e.replace(/\d+pcs?/gi,"").replace(/wholesale/gi,"").replace(/dropship(ping)?/gi,"").replace(/free\s*shipping/gi,"").replace(/hot\s*sale/gi,"").replace(/new\s*arrival/gi,"").replace(/\s{2,}/g," ").trim()}async getProductStats(){let[e,t,r]=await Promise.all([this.shopify.getProductCount(),this.shopify.getProductCount({status:"active"}),this.shopify.getProductCount({status:"draft"})]);return{total:e.data?.count||0,active:t.data?.count||0,draft:r.data?.count||0,archived:Math.max(0,(e.data?.count||0)-(t.data?.count||0)-(r.data?.count||0))}}async handleCommand(e){let t=e.toLowerCase();if(t.includes("list")||t.includes("show")||t.includes("dikhao"))return this.listProducts();if(t.includes("count")||t.includes("kitne")){let e=await this.getProductCount();return{success:!0,message:`Total products: ${e}`,count:e}}if(t.includes("stats")){let e=await this.getProductStats();return{success:!0,message:`📊 Products: ${e.total} total | ${e.active} active | ${e.draft} draft | ${e.archived} archived`}}return{success:!1,message:"Could not understand the command. Try: list products, count products, or product stats."}}}let d=null;function c(){return d||(d=new l),d}a()}catch(e){a(e)}})},8750:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{Ts:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;class l{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async buildProductPage(e){try{let t=await this.memory.getPreferences(),r=e.mood||t.mood||"premium",a=e.layoutStyle||"modern",o=e.elements||this.getDefaultElements(),i=this.generateLiquid(o,a,r),n=this.generateCSS(o,a,r),s=this.generateJS(o),c=!1;return this.shopify.isConfigured()&&(c=await this.applyToStore(i,n,s)),await this.memory.recordProductPageUpdate({elements:o,layoutStyle:a,mood:r,appliedAt:Date.now()}),{success:!0,liquidCode:i,cssCode:n,jsCode:s,applied:c,message:c?`✅ High-converting product page built with ${o.length} elements and applied!`:`✅ Product page built with ${o.length} elements! Connect Shopify to apply.`,elements:o}}catch(t){let e=t instanceof Error?t.message:"Unknown error";return{success:!1,liquidCode:"",cssCode:"",jsCode:"",applied:!1,message:`❌ Error building product page: ${e}`,elements:[]}}}generateLiquid(e,t,r){let a=[`{% comment %}
  ============================================
  CareHub AI Agent — High-Converting Product Page
  Layout: ${t} | Mood: ${r}
  Generated: ${new Date().toISOString()}
  ============================================
{% endcomment %}`,"","{{ 'carehub-product.css' | asset_url | stylesheet_tag }}","","","  "];return a.push("    "),e.includes("image_gallery")&&a.push(this.liquidImageGallery()),a.push("      "),e.includes("social_proof")&&a.push(this.liquidSocialProof()),e.includes("title_price")&&a.push(this.liquidTitlePrice()),e.includes("urgency_timer")&&a.push(this.liquidUrgencyTimer()),e.includes("stock_counter")&&a.push(this.liquidStockCounter()),e.includes("variant_selector")&&a.push(this.liquidVariantSelector()),e.includes("quantity_selector")&&a.push(this.liquidQuantitySelector()),e.includes("add_to_cart")&&a.push(this.liquidAddToCart()),e.includes("buy_now")&&a.push(this.liquidBuyNow()),e.includes("trust_badges")&&a.push(this.liquidTrustBadges()),e.includes("guarantee_badge")&&a.push(this.liquidGuaranteeBadge()),e.includes("share_buttons")&&a.push(this.liquidShareButtons()),a.push("      "),a.push("    "),e.includes("description_tabs")&&a.push(this.liquidDescriptionTabs()),e.includes("specifications")&&a.push(this.liquidSpecifications()),e.includes("faq")&&a.push(this.liquidProductFAQ()),e.includes("reviews")&&a.push(this.liquidReviews()),e.includes("related_products")&&a.push(this.liquidRelatedProducts()),e.includes("recently_viewed")&&a.push(this.liquidRecentlyViewed()),a.push("  "),a.push(""),e.includes("sticky_cart")&&a.push(this.liquidStickyCart()),a.push(""),a.push(""),a.join("\n")}liquidImageGallery(){return`
      
      
        
          {% if product.featured_image %}
            
          {% endif %}
          {% if product.compare_at_price > product.price %}
            
              -{{ product.compare_at_price | minus: product.price | times: 100 | divided_by: product.compare_at_price }}% OFF
            
          {% endif %}
        
        
          {% for image in product.images %}
            
              
            
          {% endfor %}
        
      `}liquidSocialProof(){return`
        
        
          👁️ {{ 5 | plus: product.id | modulo: 20 | plus: 12 }} people viewing this right now
          🔥 {{ product.id | modulo: 50 | plus: 30 }} sold in last 24 hours
        `}liquidTitlePrice(){return`
        
        
          
            ★★★★★
            ({{ product.id | modulo: 200 | plus: 47 }} reviews)
          
          {{ product.title }}
          
            {{ product.price | money }}
            {% if product.compare_at_price > product.price %}
              {{ product.compare_at_price | money }}
              
                You save {{ product.compare_at_price | minus: product.price | money }} ({{ product.compare_at_price | minus: product.price | times: 100 | divided_by: product.compare_at_price }}%)
              
            {% endif %}
          
        `}liquidUrgencyTimer(){return`
        
        
          
            ⏰
            Deal ends in:
          
          
            04hrs
            :
            32min
            :
            15sec
          
        `}liquidStockCounter(){return`
        
        
          
            
          
          
            🔥 Hurry! Only {{ product.id | modulo: 10 | plus: 3 }} left in stock
          
        `}liquidVariantSelector(){return`
        
        {% if product.has_only_default_variant == false %}
        
          {% for option in product.options_with_values %}
            
              {{ option.name }}:
              
                {% for value in option.values %}
                  
                    {{ value }}
                  
                {% endfor %}
              
            
          {% endfor %}
        
        {% endif %}
        `}liquidQuantitySelector(){return`
        
        
          Quantity:
          
            −
            
            +
          
        `}liquidAddToCart(){return`
        
        
          
            
            
            
              {% if product.available %}
                🛒
                Add to Cart — {{ product.price | money }}
              {% else %}
                Sold Out
              {% endif %}
            
          
        `}liquidBuyNow(){return`
        
        {% if product.available %}
        
          
            ⚡ Buy Now — Instant Checkout
          
        
        {% endif %}`}liquidTrustBadges(){return`
        
        
          
            🔒Secure Checkout
          
          
            🚚Free Shipping
          
          
            ↩️30-Day Returns
          
          
            ✅Quality Guaranteed
          
        `}liquidGuaranteeBadge(){return`
        
        
          🛡️
          
            100% Satisfaction Guaranteed
            Love it or get a full refund. No questions asked.
          
        `}liquidShareButtons(){return`
        
        
          Share:
          📘
          🐦
          📌
          🔗
        `}liquidDescriptionTabs(){return`
    
    
      
        Description
        Shipping
        Returns
      
      
        
          {{ product.description }}
        
        
          Shipping Information
          
            📦 Free standard shipping on orders over $50
            🚚 Standard delivery: 7-15 business days
            ✈️ Express delivery: 5-10 business days
            📍 We ship to US, UK, Canada, and Australia
            📧 Tracking number provided via email
          
        
        
          Return Policy
          
            ↩️ 30-day hassle-free returns
            💰 Full refund or exchange
            📮 Free return shipping on defective items
            📞 Contact support for return authorization
            ⚡ Refunds processed within 5-7 business days
          
        
      
    `}liquidSpecifications(){return`
    
    {% if product.metafields.custom.specifications %}
    
      Specifications
      
        {{ product.metafields.custom.specifications | metafield_tag }}
      
    
    {% endif %}`}liquidProductFAQ(){return`
    
    
      Common Questions
      
        Is this product high quality?
        Yes! Every item is carefully quality-tested before shipping. We stand behind our products with a 30-day guarantee.
      
      
        How long will delivery take?
        Standard shipping takes 7-15 business days. You'll receive a tracking number via email once your order ships.
      
      
        What if I'm not satisfied?
        We offer a 30-day money-back guarantee. Contact us and we'll arrange a return or exchange — no questions asked.
      
      
        Is my payment secure?
        Absolutely. We use 256-bit SSL encryption and trusted payment providers including Visa, Mastercard, PayPal, and Apple Pay.
      
    `}liquidReviews(){return`
    
    
      
        Customer Reviews
        
          ★★★★★
          4.9 out of 5
          Based on {{ product.id | modulo: 200 | plus: 47 }} reviews
        
      
      
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Exceeded my expectations!
          Absolutely love this product. Quality is amazing and it arrived faster than I expected. Highly recommend!
          Sarah M. — New York, USA
        
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Best purchase I've made
          Great value for money. The build quality is premium and it looks even better in person. Will buy again!
          James T. — London, UK
        
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Shipped fast, great quality
          Third time ordering from this store. Never disappointed. Customer service is fantastic too.
          Emily R. — Los Angeles, USA
        
      
    `}liquidRelatedProducts(){return`
    
    
      You May Also Like
      
        {% for rec in product.collections.first.products limit: 4 %}
          {% if rec.id != product.id %}
          
            {% if rec.featured_image %}
              
            {% endif %}
            {{ rec.title | truncate: 40 }}
            {{ rec.price | money }}
          
          {% endif %}
        {% endfor %}
      
    `}liquidRecentlyViewed(){return`
    
    
      Recently Viewed
      
    `}liquidStickyCart(){return`
    
    
      
        
          {% if product.featured_image %}
            
          {% endif %}
          
            {{ product.title | truncate: 30 }}
            {{ product.price | money }}
          
        
        
          🛒 Add to Cart
        
      
    `}generateCSS(e,t,r){return`
/* ============================================ */
/* CareHub Product Page CSS — ${r} / ${t} */
/* Generated: ${new Date().toISOString()} */
/* ============================================ */

/* --- Product Page Layout --- */
.carehub-product {
  padding: 40px 0 80px;
  background: var(--color-background, #0a0a0f);
}
.carehub-product__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-product__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin-bottom: 60px;
  align-items: start;
}

/* --- Image Gallery --- */
.carehub-product__gallery {
  position: sticky;
  top: 100px;
}
.carehub-product__main-image {
  position: relative;
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  background: var(--color-surface, #12121a);
  margin-bottom: 12px;
}
.carehub-product__img {
  width: 100%;
  height: auto;
  display: block;
  cursor: zoom-in;
  transition: transform 0.3s ease;
}
.carehub-product__main-image:hover .carehub-product__img {
  transform: scale(1.05);
}
.carehub-product__sale-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.03em;
}
.carehub-product__thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}
.carehub-product__thumb {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-surface, #12121a);
  padding: 0;
}
.carehub-product__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.carehub-product__thumb--active,
.carehub-product__thumb:hover {
  border-color: var(--color-primary, #c9a962);
}

/* --- Product Info --- */
.carehub-product__info {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Social Proof */
.carehub-product__social-proof {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.82rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  padding: 10px 14px;
  background: var(--color-surface, #12121a);
  border-radius: var(--border-radius-sm, 6px);
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__social-proof strong {
  color: var(--color-primary, #c9a962) !important;
}

/* Rating */
.carehub-product__rating {
  display: flex;
  align-items: center;
  gap: 8px;
}
.carehub-product__stars {
  color: #fbbf24;
  font-size: 1.1rem;
  letter-spacing: 1px;
}
.carehub-product__rating-count {
  font-size: 0.85rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Title & Price */
.carehub-product__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  line-height: 1.2;
  margin: 0;
}
.carehub-product__price-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.carehub-product__price {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-product__compare-price {
  font-size: 1.1rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
}
.carehub-product__savings {
  font-size: 0.85rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
  background: rgba(74, 222, 128, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
}

/* Urgency Timer */
.carehub-product__urgency {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: var(--border-radius, 8px);
  padding: 14px 18px;
}
.carehub-product__urgency-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.carehub-product__urgency-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-error, #f87171) !important;
}
.carehub-product__timer {
  display: flex;
  align-items: center;
  gap: 6px;
}
.carehub-product__timer-unit {
  text-align: center;
}
.carehub-product__timer-unit b {
  display: block;
  font-size: 1.3rem;
  color: var(--color-heading, #fff) !important;
  font-weight: 800;
}
.carehub-product__timer-unit small {
  font-size: 0.65rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
}
.carehub-product__timer-sep {
  font-size: 1.2rem;
  color: var(--color-error, #f87171);
  font-weight: 700;
}

/* Stock Counter */
.carehub-product__stock {
  padding: 12px 0;
}
.carehub-product__stock-bar {
  height: 6px;
  background: var(--color-border, #2a2a3a);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.carehub-product__stock-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-error, #f87171), var(--color-warning, #fbbf24));
  border-radius: 3px;
  transition: width 1s ease;
}
.carehub-product__stock-text {
  font-size: 0.85rem;
  color: var(--color-warning, #fbbf24) !important;
  margin: 0;
}

/* Variant Selector */
.carehub-product__variants {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.carehub-product__option-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  display: block;
  margin-bottom: 8px;
}
.carehub-product__option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.carehub-product__option-btn {
  padding: 10px 18px;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-sm, 6px);
  background: var(--color-surface, #12121a);
  color: var(--color-text, #e8e8e8);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.carehub-product__option-btn:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-product__option-btn--active {
  border-color: var(--color-primary, #c9a962) !important;
  background: rgba(201, 169, 98, 0.1);
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}

/* Quantity */
.carehub-product__quantity-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  display: block;
  margin-bottom: 8px;
}
.carehub-product__quantity-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
}
.carehub-product__qty-btn {
  width: 40px;
  height: 40px;
  background: var(--color-surface, #12121a);
  border: none;
  color: var(--color-text, #e8e8e8);
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.carehub-product__qty-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
}
.carehub-product__qty-input {
  width: 50px;
  height: 40px;
  text-align: center;
  border: none !important;
  background: var(--color-background, #0a0a0f) !important;
  color: var(--color-heading, #fff) !important;
  font-weight: 700;
  font-size: 1rem;
  padding: 0 !important;
  -moz-appearance: textfield;
}
.carehub-product__qty-input::-webkit-outer-spin-button,
.carehub-product__qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

/* Add to Cart Button */
.carehub-product__add-btn {
  width: 100%;
  padding: 18px 30px !important;
  background: var(--color-button-bg, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none !important;
  border-radius: var(--border-radius, 8px) !important;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.carehub-product__add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(201, 169, 98, 0.4);
}
.carehub-product__add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Buy Now */
.carehub-product__buy-now-btn {
  width: 100%;
  padding: 16px 30px !important;
  background: transparent !important;
  color: var(--color-primary, #c9a962) !important;
  border: 2px solid var(--color-primary, #c9a962) !important;
  border-radius: var(--border-radius, 8px) !important;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.carehub-product__buy-now-btn:hover {
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
}

/* Trust Badges */
.carehub-product__trust {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px;
  background: var(--color-surface, #12121a);
  border-radius: var(--border-radius, 8px);
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Guarantee Badge */
.carehub-product__guarantee {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(74, 222, 128, 0.05);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: var(--border-radius, 8px);
}
.carehub-product__guarantee-icon {
  font-size: 2rem;
}
.carehub-product__guarantee-text strong {
  display: block;
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__guarantee-text span {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Share Buttons */
.carehub-product__share {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__share-label {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-product__share a,
.carehub-product__share button {
  font-size: 1.3rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  text-decoration: none;
}
.carehub-product__share a:hover,
.carehub-product__share button:hover {
  transform: scale(1.2);
}

/* --- Tabs --- */
.carehub-product__tabs {
  margin-top: 60px;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
}
.carehub-product__tab-nav {
  display: flex;
  border-bottom: 1px solid var(--color-border, #2a2a3a);
  background: var(--color-surface, #12121a);
}
.carehub-product__tab-btn {
  flex: 1;
  padding: 16px 20px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}
.carehub-product__tab-btn:hover {
  color: var(--color-heading, #fff);
}
.carehub-product__tab-btn--active {
  color: var(--color-primary, #c9a962) !important;
  border-bottom-color: var(--color-primary, #c9a962);
}
.carehub-product__tab-panel {
  display: none;
  padding: 30px;
  color: var(--color-text, #e8e8e8) !important;
  line-height: 1.8;
}
.carehub-product__tab-panel--active {
  display: block;
}
.carehub-product__tab-panel ul {
  list-style: none;
  padding: 0;
}
.carehub-product__tab-panel li {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__tab-panel h4 {
  color: var(--color-heading, #fff) !important;
  margin-bottom: 16px;
}

/* --- FAQ --- */
.carehub-product__faq {
  margin-top: 50px;
}
.carehub-product__faq-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-product__faq-item {
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  margin-bottom: 10px;
  overflow: hidden;
}
.carehub-product__faq-item summary {
  padding: 16px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
  background: var(--color-card-bg, #12121a);
  list-style: none;
}
.carehub-product__faq-item summary::-webkit-details-marker { display: none; }
.carehub-product__faq-item p {
  padding: 12px 20px 16px;
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.7;
}

/* --- Reviews --- */
.carehub-product__reviews {
  margin-top: 50px;
}
.carehub-product__reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.carehub-product__reviews-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__reviews-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-product__reviews-stars { color: #fbbf24; font-size: 1.1rem; }
.carehub-product__reviews-avg { font-weight: 700; color: var(--color-heading, #fff) !important; }
.carehub-product__reviews-count { font-size: 0.85rem; color: var(--color-text-muted, #8a8a9a) !important; }
.carehub-product__reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.carehub-product__review {
  padding: 20px;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-product__review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.carehub-product__review-stars { color: #fbbf24; }
.carehub-product__review-verified {
  font-size: 0.75rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
}
.carehub-product__review h4 {
  font-size: 0.95rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-product__review p {
  font-size: 0.88rem;
  color: var(--color-text, #e8e8e8) !important;
  line-height: 1.6;
  margin-bottom: 10px;
}
.carehub-product__review-author {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* --- Related Products --- */
.carehub-product__related {
  margin-top: 60px;
}
.carehub-product__related-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 24px;
}
.carehub-product__related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.carehub-product__related-card {
  text-decoration: none;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  transition: all 0.3s ease;
}
.carehub-product__related-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary, #c9a962);
}
.carehub-product__related-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.carehub-product__related-card h4 {
  padding: 12px 12px 4px;
  font-size: 0.85rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__related-price {
  padding: 0 12px 12px;
  display: block;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  font-size: 0.95rem;
}

/* --- Sticky Cart --- */
.carehub-product__sticky {
  position: fixed;
  bottom: -100%;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--color-surface, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
  padding: 12px 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
  transition: bottom 0.3s ease;
}
.carehub-product__sticky--visible {
  bottom: 0;
}
.carehub-product__sticky-inner {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.carehub-product__sticky-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.carehub-product__sticky-img {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-product__sticky-title {
  display: block;
  font-size: 0.85rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__sticky-price {
  font-size: 0.9rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-product__sticky-btn {
  padding: 12px 24px;
  background: var(--color-button-bg, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: var(--border-radius, 8px);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-product__sticky-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 15px rgba(201,169,98,0.3);
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .carehub-product__top {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .carehub-product__gallery {
    position: static;
  }
  .carehub-product__trust {
    grid-template-columns: 1fr;
  }
  .carehub-product__related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .carehub-product__tab-nav {
    overflow-x: auto;
  }
  .carehub-product__sticky-info {
    display: none;
  }
  .carehub-product__sticky-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .carehub-product { padding: 20px 0 60px; }
  .carehub-product__related-grid { grid-template-columns: 1fr; }
}`}generateJS(e){return`
// ============================================
// CareHub Product Page — Interactive JavaScript
// ============================================

(function() {
  'use strict';

  // --- Image Gallery ---
  window.changeImage = function(src, thumb) {
    var mainImg = document.getElementById('ch-product-img');
    if (mainImg) {
      mainImg.style.opacity = '0';
      setTimeout(function() {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 200);
    }
    // Update active thumbnail
    var thumbs = document.querySelectorAll('.carehub-product__thumb');
    thumbs.forEach(function(t) { t.classList.remove('carehub-product__thumb--active'); });
    if (thumb) thumb.classList.add('carehub-product__thumb--active');
  };

  // --- Quantity Selector ---
  window.updateQty = function(change) {
    var input = document.getElementById('ch-quantity');
    var formQty = document.getElementById('ch-form-qty');
    if (!input) return;
    var current = parseInt(input.value) || 1;
    var newVal = Math.max(1, Math.min(10, current + change));
    input.value = newVal;
    if (formQty) formQty.value = newVal;
  };

  // --- Buy Now ---
  window.buyNow = function() {
    var variantId = document.getElementById('ch-variant-id');
    var qty = document.getElementById('ch-quantity');
    if (variantId) {
      var id = variantId.value;
      var quantity = qty ? qty.value : 1;
      window.location.href = '/cart/' + id + ':' + quantity + '?checkout=true';
    }
  };

  // --- Tabs ---
  var tabBtns = document.querySelectorAll('.carehub-product__tab-btn');
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = this.getAttribute('data-tab');
      // Remove active from all
      tabBtns.forEach(function(b) { b.classList.remove('carehub-product__tab-btn--active'); });
      document.querySelectorAll('.carehub-product__tab-panel').forEach(function(p) { p.classList.remove('carehub-product__tab-panel--active'); });
      // Add active
      this.classList.add('carehub-product__tab-btn--active');
      var panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('carehub-product__tab-panel--active');
    });
  });

  // --- Variant Selector ---
  var optionBtns = document.querySelectorAll('.carehub-product__option-btn');
  optionBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var siblings = this.parentElement.querySelectorAll('.carehub-product__option-btn');
      siblings.forEach(function(s) { s.classList.remove('carehub-product__option-btn--active'); });
      this.classList.add('carehub-product__option-btn--active');
    });
  });

  // --- Urgency Timer ---
  ${e.includes("urgency_timer")?`
  function updateProductTimer() {
    var now = new Date();
    var end = new Date();
    end.setHours(23, 59, 59, 999);
    var diff = end - now;
    if (diff <= 0) { end.setDate(end.getDate() + 1); diff = end - now; }
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var he = document.getElementById('ch-p-hours');
    var me = document.getElementById('ch-p-mins');
    var se = document.getElementById('ch-p-secs');
    if (he) he.textContent = h.toString().padStart(2, '0');
    if (me) me.textContent = m.toString().padStart(2, '0');
    if (se) se.textContent = s.toString().padStart(2, '0');
  }
  updateProductTimer();
  setInterval(updateProductTimer, 1000);
  `:""}

  // --- Sticky Cart ---
  ${e.includes("sticky_cart")?`
  var stickyCart = document.getElementById('ch-sticky-cart');
  var addBtn = document.querySelector('.carehub-product__add-btn');
  if (stickyCart && addBtn) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          stickyCart.classList.remove('carehub-product__sticky--visible');
        } else {
          stickyCart.classList.add('carehub-product__sticky--visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(addBtn);
  }
  `:""}

  // --- Social Proof (Random Viewers) ---
  ${e.includes("social_proof")?`
  var viewersEl = document.getElementById('ch-viewers');
  if (viewersEl) {
    setInterval(function() {
      var current = parseInt(viewersEl.textContent) || 15;
      var change = Math.random() > 0.5 ? 1 : -1;
      var newVal = Math.max(8, Math.min(35, current + change));
      viewersEl.textContent = newVal;
    }, 5000);
  }
  `:""}

  // --- Recently Viewed ---
  ${e.includes("recently_viewed")?`
  try {
    var productData = {
      url: window.location.pathname,
      title: document.querySelector('.carehub-product__title') ? document.querySelector('.carehub-product__title').textContent.trim() : '',
      image: document.getElementById('ch-product-img') ? document.getElementById('ch-product-img').src : '',
      price: document.querySelector('.carehub-product__price') ? document.querySelector('.carehub-product__price').textContent.trim() : ''
    };
    var rv = JSON.parse(localStorage.getItem('carehub_rv') || '[]');
    rv = rv.filter(function(p) { return p.url !== productData.url; });
    rv.unshift(productData);
    rv = rv.slice(0, 8);
    localStorage.setItem('carehub_rv', JSON.stringify(rv));
    // Display
    var rvSection = document.getElementById('ch-recently-viewed');
    var rvGrid = document.getElementById('ch-rv-grid');
    var rvItems = rv.filter(function(p) { return p.url !== window.location.pathname; });
    if (rvSection && rvGrid && rvItems.length > 0) {
      rvSection.style.display = 'block';
      rvGrid.innerHTML = rvItems.slice(0, 4).map(function(p) {
        return '' +
          (p.image ? '' : '') +
          '' + p.title.substring(0, 40) + '' +
          '' + p.price + '' +
          '';
      }).join('');
    }
  } catch(e) {}
  `:""}

  // --- Image Zoom (simple) ---
  var mainImage = document.getElementById('ch-product-img');
  if (mainImage) {
    mainImage.style.transition = 'opacity 0.2s ease, transform 0.3s ease';
  }

})();`}async applyToStore(e,t,r){try{let a=await this.shopify.getMainTheme();if(!a.success||!a.data)return!1;let o=a.data.id;await this.shopify.updateThemeAsset(o,{key:"assets/carehub-product.css",value:t}),await this.shopify.updateThemeAsset(o,{key:"assets/carehub-product.js",value:r}),await this.shopify.updateThemeAsset(o,{key:"snippets/carehub-product-page.liquid",value:e});let i=await this.shopify.getThemeAsset(o,"templates/product.liquid");if(i.success&&i.data?.asset.value){let e=i.data.asset.value;e.includes("carehub-product-page")||(e=`{% render 'carehub-product-page' %}
`,await this.shopify.updateThemeAsset(o,{key:"templates/product.liquid",value:e}))}return!0}catch(e){return console.error("[ProductPage] Error applying to store:",e),!1}}getDefaultElements(){return["image_gallery","social_proof","title_price","urgency_timer","stock_counter","variant_selector","quantity_selector","add_to_cart","buy_now","trust_badges","guarantee_badge","share_buttons","description_tabs","faq","reviews","related_products","recently_viewed","sticky_cart"]}async addElement(e){let t=await this.memory.getPreferences(),r=[...this.getDefaultElements(),e];return this.buildProductPage({elements:r,mood:t.mood})}async removeElement(e){let t=await this.memory.getPreferences(),r=this.getDefaultElements().filter(t=>t!==e);return this.buildProductPage({elements:r,mood:t.mood})}async updateLayout(e){let t=await this.memory.getPreferences();return this.buildProductPage({layoutStyle:e,mood:t.mood})}}let d=null;function c(){return d||(d=new l),d}a()}catch(e){a(e)}})},1014:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{wg:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;let l={"premium-dark":{mood:"premium-dark",colors:{primary:"#c9a962",secondary:"#1a1a2e",accent:"#e2c275",background:"#0a0a0f",surface:"#12121a",text:"#e8e8e8",textMuted:"#8a8a9a",heading:"#ffffff",border:"#2a2a3a",success:"#4ade80",error:"#f87171",warning:"#fbbf24",gradient1:"#c9a962",gradient2:"#8b6914",buttonBg:"#c9a962",buttonText:"#0a0a0f",buttonHover:"#e2c275",headerBg:"#0a0a0f",headerText:"#ffffff",footerBg:"#050508",footerText:"#8a8a9a",cardBg:"#12121a",cardBorder:"#2a2a3a",badgeBg:"#c9a962",badgeText:"#0a0a0f",announcementBg:"#c9a962",announcementText:"#0a0a0f",overlay:"rgba(0,0,0,0.7)"},fonts:{heading:"Playfair Display",body:"Inter",accent:"Cormorant Garamond",headingWeight:"700",bodyWeight:"400",headingSizeDesktop:"3.5rem",headingSizeMobile:"2rem",bodySizeDesktop:"1rem",bodySizeMobile:"0.9rem",letterSpacingHeading:"-0.02em",letterSpacingBody:"0",lineHeightHeading:"1.2",lineHeightBody:"1.7"},spacing:{sectionPaddingDesktop:"100px",sectionPaddingMobile:"60px",cardPadding:"24px",elementGap:"20px",containerMaxWidth:"1200px",borderRadius:"8px",borderRadiusLarge:"16px",borderRadiusSmall:"4px",buttonPaddingX:"32px",buttonPaddingY:"14px"},style:{buttonStyle:"rounded",shadowIntensity:"subtle",animationLevel:"moderate",imageStyle:"rounded",layoutDensity:"spacious",headerStyle:"sticky",cardStyle:"elevated",hoverEffect:"glow"}},"modern-clean":{mood:"modern-clean",colors:{primary:"#2563eb",secondary:"#f8fafc",accent:"#3b82f6",background:"#ffffff",surface:"#f8fafc",text:"#334155",textMuted:"#64748b",heading:"#0f172a",border:"#e2e8f0",success:"#10b981",error:"#ef4444",warning:"#f59e0b",gradient1:"#2563eb",gradient2:"#7c3aed",buttonBg:"#2563eb",buttonText:"#ffffff",buttonHover:"#1d4ed8",headerBg:"#ffffff",headerText:"#0f172a",footerBg:"#0f172a",footerText:"#94a3b8",cardBg:"#ffffff",cardBorder:"#e2e8f0",badgeBg:"#2563eb",badgeText:"#ffffff",announcementBg:"#2563eb",announcementText:"#ffffff",overlay:"rgba(0,0,0,0.5)"},fonts:{heading:"Plus Jakarta Sans",body:"Inter",accent:"DM Sans",headingWeight:"800",bodyWeight:"400",headingSizeDesktop:"3rem",headingSizeMobile:"1.8rem",bodySizeDesktop:"1rem",bodySizeMobile:"0.9rem",letterSpacingHeading:"-0.03em",letterSpacingBody:"0",lineHeightHeading:"1.15",lineHeightBody:"1.65"},spacing:{sectionPaddingDesktop:"80px",sectionPaddingMobile:"50px",cardPadding:"20px",elementGap:"16px",containerMaxWidth:"1140px",borderRadius:"12px",borderRadiusLarge:"20px",borderRadiusSmall:"6px",buttonPaddingX:"28px",buttonPaddingY:"12px"},style:{buttonStyle:"pill",shadowIntensity:"medium",animationLevel:"subtle",imageStyle:"rounded",layoutDensity:"normal",headerStyle:"solid",cardStyle:"elevated",hoverEffect:"lift"}},"luxury-gold":{mood:"luxury-gold",colors:{primary:"#d4af37",secondary:"#1c1c1c",accent:"#ffd700",background:"#0d0d0d",surface:"#1a1a1a",text:"#d4d4d4",textMuted:"#737373",heading:"#ffffff",border:"#333333",success:"#22c55e",error:"#dc2626",warning:"#eab308",gradient1:"#d4af37",gradient2:"#b8860b",buttonBg:"linear-gradient(135deg, #d4af37, #b8860b)",buttonText:"#000000",buttonHover:"#ffd700",headerBg:"rgba(13,13,13,0.95)",headerText:"#d4af37",footerBg:"#050505",footerText:"#737373",cardBg:"#1a1a1a",cardBorder:"#2a2a2a",badgeBg:"#d4af37",badgeText:"#000000",announcementBg:"#d4af37",announcementText:"#000000",overlay:"rgba(0,0,0,0.8)"},fonts:{heading:"Cormorant Garamond",body:"Lato",accent:"Cinzel",headingWeight:"600",bodyWeight:"300",headingSizeDesktop:"4rem",headingSizeMobile:"2.2rem",bodySizeDesktop:"1.05rem",bodySizeMobile:"0.95rem",letterSpacingHeading:"0.05em",letterSpacingBody:"0.01em",lineHeightHeading:"1.1",lineHeightBody:"1.8"},spacing:{sectionPaddingDesktop:"120px",sectionPaddingMobile:"70px",cardPadding:"28px",elementGap:"24px",containerMaxWidth:"1100px",borderRadius:"4px",borderRadiusLarge:"8px",borderRadiusSmall:"2px",buttonPaddingX:"40px",buttonPaddingY:"16px"},style:{buttonStyle:"sharp",shadowIntensity:"subtle",animationLevel:"rich",imageStyle:"sharp",layoutDensity:"spacious",headerStyle:"transparent",cardStyle:"bordered",hoverEffect:"glow"}}};class d{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async designTheme(e){Date.now();try{let t;let r=await this.memory.getPreferences();await this.memory.getStoreState();let a=this.findPresetMatch(e.mood);t=a&&!e.specificRequests?.length?this.buildFromPreset(a,e):await this.generateCustomDesign(e,r),e.colors&&(t.colors={...t.colors,...e.colors}),e.fonts&&(t.fonts={...t.fonts,...e.fonts}),t.css=await this.generateCSS(t);let o=!1;return this.shopify.isConfigured()&&(o=await this.applyToStore(t)),await this.memory.recordThemeChange({id:Date.now(),name:`Theme: ${e.mood}`,customCSS:t.css,mood:e.mood}),await this.memory.setPreferences({designStyle:e.mood,mood:e.mood,colorPreference:this.detectColorPreference(t.colors)}),{success:!0,design:t,cssApplied:o,message:o?`✅ Theme "${e.mood}" designed and applied to your store!`:`✅ Theme "${e.mood}" designed! Connect Shopify to apply automatically.`}}catch(t){let e=t instanceof Error?t.message:"Unknown error";return{success:!1,design:{},cssApplied:!1,message:`❌ Error designing theme: ${e}`}}}async generateCustomDesign(e,t){let r=`Design a complete e-commerce store theme based on this mood/request:

Mood: "${e.mood}"
${e.specificRequests?`Specific requests: ${e.specificRequests.join(", ")}`:""}
${e.event?`Event/occasion: ${e.event}`:""}
User's general style preference: ${t.designStyle}
User's color preference: ${t.colorPreference}
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
- Think like a $10,000 agency designer`,a=await this.router.useGeminiJSON([{role:"user",content:r}],"design_decision");if(a.success&&a.data)return{mood:e.mood,colors:a.data.colors,fonts:a.data.fonts,spacing:a.data.spacing,style:a.data.style,css:"",appliedAt:Date.now()};let o=l["premium-dark"];return{mood:e.mood,colors:o.colors,fonts:o.fonts,spacing:o.spacing,style:o.style,css:"",appliedAt:Date.now()}}async generateCSS(e){let{colors:t,fonts:r,spacing:a,style:o}=e;return`
/* ============================================ */
/* CAREHUB THEME — ${e.mood.toUpperCase()} */
/* Generated: ${new Date().toISOString()} */
/* ============================================ */

/* --- Google Fonts Import --- */
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(r.heading)}:wght@400;500;600;700;800;900&family=${encodeURIComponent(r.body)}:wght@300;400;500;600;700&family=${encodeURIComponent(r.accent)}:wght@400;500;600;700&display=swap');

/* --- CSS Custom Properties --- */
:root {
  /* Colors */
  --color-primary: ${t.primary};
  --color-secondary: ${t.secondary};
  --color-accent: ${t.accent};
  --color-background: ${t.background};
  --color-surface: ${t.surface};
  --color-text: ${t.text};
  --color-text-muted: ${t.textMuted};
  --color-heading: ${t.heading};
  --color-border: ${t.border};
  --color-success: ${t.success};
  --color-error: ${t.error};
  --color-warning: ${t.warning};
  --color-gradient-1: ${t.gradient1};
  --color-gradient-2: ${t.gradient2};
  --color-button-bg: ${t.buttonBg};
  --color-button-text: ${t.buttonText};
  --color-button-hover: ${t.buttonHover};
  --color-header-bg: ${t.headerBg};
  --color-header-text: ${t.headerText};
  --color-footer-bg: ${t.footerBg};
  --color-footer-text: ${t.footerText};
  --color-card-bg: ${t.cardBg};
  --color-card-border: ${t.cardBorder};
  --color-badge-bg: ${t.badgeBg};
  --color-badge-text: ${t.badgeText};
  --color-announcement-bg: ${t.announcementBg};
  --color-announcement-text: ${t.announcementText};
  --color-overlay: ${t.overlay};

  /* Typography */
  --font-heading: '${r.heading}', serif;
  --font-body: '${r.body}', sans-serif;
  --font-accent: '${r.accent}', serif;
  --font-heading-weight: ${r.headingWeight};
  --font-body-weight: ${r.bodyWeight};
  --font-heading-size: ${r.headingSizeDesktop};
  --font-body-size: ${r.bodySizeDesktop};
  --letter-spacing-heading: ${r.letterSpacingHeading};
  --letter-spacing-body: ${r.letterSpacingBody};
  --line-height-heading: ${r.lineHeightHeading};
  --line-height-body: ${r.lineHeightBody};

  /* Spacing */
  --section-padding: ${a.sectionPaddingDesktop};
  --card-padding: ${a.cardPadding};
  --element-gap: ${a.elementGap};
  --container-max-width: ${a.containerMaxWidth};
  --border-radius: ${a.borderRadius};
  --border-radius-lg: ${a.borderRadiusLarge};
  --border-radius-sm: ${a.borderRadiusSmall};
  --button-padding-x: ${a.buttonPaddingX};
  --button-padding-y: ${a.buttonPaddingY};

  /* Shadows */
  --shadow-sm: ${"none"===o.shadowIntensity?"none":"0 1px 3px rgba(0,0,0,0.1)"};
  --shadow-md: ${"none"===o.shadowIntensity?"none":"subtle"===o.shadowIntensity?"0 4px 6px rgba(0,0,0,0.1)":"0 4px 15px rgba(0,0,0,0.15)"};
  --shadow-lg: ${"none"===o.shadowIntensity?"none":"strong"===o.shadowIntensity?"0 10px 40px rgba(0,0,0,0.3)":"0 10px 25px rgba(0,0,0,0.15)"};
  --shadow-glow: 0 0 20px ${t.primary}33;

  /* Transitions */
  --transition-fast: ${"none"===o.animationLevel?"0s":"0.15s"} ease;
  --transition-base: ${"none"===o.animationLevel?"0s":"0.3s"} ease;
  --transition-slow: ${"none"===o.animationLevel?"0s":"0.5s"} ease;
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
  ${"sticky"===o.headerStyle?"position: sticky; top: 0; z-index: 1000;":""}
  ${"transparent"===o.headerStyle?"background: transparent !important;":""}
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
  border-radius: ${"pill"===o.buttonStyle?"50px":"sharp"===o.buttonStyle?"0":"var(--border-radius)"} !important;
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
  transform: ${"lift"===o.hoverEffect?"translateY(-2px)":"scale"===o.hoverEffect?"scale(1.02)":"none"};
  box-shadow: ${"glow"===o.hoverEffect?"var(--shadow-glow)":"var(--shadow-md)"};
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
  border: ${"bordered"===o.cardStyle?"1px solid var(--color-card-border)":"none"} !important;
  border-radius: var(--border-radius-lg) !important;
  overflow: hidden;
  transition: var(--transition-base) !important;
  box-shadow: ${"elevated"===o.cardStyle?"var(--shadow-md)":"none"};
  ${"glass"===o.cardStyle?`backdrop-filter: blur(10px); background: ${t.cardBg}cc !important;`:""}
}

.card:hover,
.product-card:hover,
.card-wrapper:hover {
  transform: ${"lift"===o.hoverEffect?"translateY(-5px)":"scale"===o.hoverEffect?"scale(1.02)":"none"};
  box-shadow: ${"none"!==o.hoverEffect?"var(--shadow-lg)":"var(--shadow-md)"};
  border-color: ${"border"===o.hoverEffect?"var(--color-primary)":"var(--color-card-border)"} !important;
  ${"glow"===o.hoverEffect?"box-shadow: var(--shadow-glow);":""}
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
  border-radius: ${"rounded"===o.imageStyle?"var(--border-radius)":"circle"===o.imageStyle?"50%":"0"};
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
  box-shadow: 0 0 0 3px ${t.primary}22 !important;
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
  background: ${t.primary}44;
  color: var(--color-heading);
}

/* --- Animations --- */
${"none"!==o.animationLevel?`
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

${"rich"===o.animationLevel?`
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
`:""}
`:""}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  :root {
    --font-heading-size: ${r.headingSizeMobile};
    --font-body-size: ${r.bodySizeMobile};
    --section-padding: ${a.sectionPaddingMobile};
    --card-padding: 16px;
    --button-padding-x: 24px;
    --button-padding-y: 12px;
  }

  .page-width {
    padding: 0 15px;
  }

  h1, .h1 {
    font-size: ${r.headingSizeMobile} !important;
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
`.trim()}async applyToStore(e){try{let t=await this.shopify.getMainTheme();if(!t.success||!t.data)return console.error("[ThemeDesigner] Could not find main theme"),!1;let r=t.data.id,a=await this.shopify.updateThemeAsset(r,{key:"assets/carehub-theme.css",value:e.css});if(!a.success)return console.error("[ThemeDesigner] Failed to upload CSS asset:",a.error),!1;let o=await this.shopify.getThemeAsset(r,"layout/theme.liquid");if(o.success&&o.data?.asset.value){let e=o.data.asset.value;if(!e.includes("carehub-theme.css")){let t=`
  
  {{ 'carehub-theme.css' | asset_url | stylesheet_tag }}
`;e=e.replace("",`${t}`),await this.shopify.updateThemeAsset(r,{key:"layout/theme.liquid",value:e})}}return console.log("[ThemeDesigner] Theme applied successfully ✅"),!0}catch(e){return console.error("[ThemeDesigner] Error applying theme:",e),!1}}async modifyTheme(e){let t=await this.memory.getStoreState(),r=t.currentTheme?.mood||"premium",a=`Current store theme mood: "${r}"
User wants to modify: "${e}"

What specific changes should be made? Return JSON:
{
  "newMood": "updated mood description",
  "colorChanges": { "key": "new #hex value" },
  "fontChanges": { "key": "new value" },
  "spacingChanges": { "key": "new value" },
  "styleChanges": { "key": "new value" }
}

Only include keys that need to change. Keep everything else the same.`,o=await this.router.useGeminiJSON([{role:"user",content:a}],"design_decision");return o.success&&o.data?this.designTheme({mood:o.data.newMood||r,colors:o.data.colorChanges,fonts:o.data.fontChanges,preserveExisting:!0}):this.designTheme({mood:`${r} with ${e}`,specificRequests:[e]})}async applyEventTheme(e){let t=e.toLowerCase(),r="";for(let[e,a]of Object.entries({valentine:"romantic, red and pink, hearts, love, elegant",christmas:"festive, red and green, gold accents, cozy, warm","black friday":"bold, black and yellow, urgent, high-energy, deals",halloween:"dark, orange and purple, spooky-fun, mysterious",summer:"bright, tropical, blue and coral, fresh, energetic",winter:"cool, white and blue, silver accents, elegant, frost","new year":"celebration, gold and black, glamorous, sparkling",easter:"pastel, spring, soft colors, fresh, cheerful","mothers day":"soft pink, floral, elegant, warm, loving","fathers day":"navy, classic, strong, trustworthy, sophisticated"}))if(t.includes(e)){r=a;break}return r||(r=`themed for ${e}, professional, festive, attractive`),this.designTheme({mood:r,event:e,specificRequests:[`Themed specifically for ${e}`,"Keep it professional and high-converting"]})}findPresetMatch(e){let t=e.toLowerCase();return(t.includes("premium")||t.includes("luxury"))&&t.includes("dark")?"premium-dark":t.includes("modern")&&(t.includes("clean")||t.includes("minimal"))?"modern-clean":t.includes("luxury")&&t.includes("gold")?"luxury-gold":null}buildFromPreset(e,t){let r=l[e];return{mood:t.mood,colors:t.colors?{...r.colors,...t.colors}:r.colors,fonts:t.fonts?{...r.fonts,...t.fonts}:r.fonts,spacing:r.spacing,style:r.style,css:"",appliedAt:Date.now()}}detectColorPreference(e){let t=e.background.toLowerCase();return t.startsWith("#0")||t.startsWith("#1")||t.startsWith("#2")?"dark":t.startsWith("#f")||t.startsWith("#e")||t.startsWith("#d")?"light":"mixed"}async getCurrentTheme(){let e=await this.memory.getStoreState();return e.currentTheme?{mood:e.currentTheme.mood,appliedAt:e.currentTheme.appliedAt,hasCustomCSS:!!e.currentTheme.customCSS}:null}async removeCustomTheme(){try{if(!this.shopify.isConfigured())return!1;let e=await this.shopify.getMainTheme();if(!e.success||!e.data)return!1;return await this.shopify.deleteThemeAsset(e.data.id,"assets/carehub-theme.css"),await this.memory.updateStoreState({currentTheme:null}),!0}catch{return!1}}}let u=null;function c(){return u||(u=new d),u}a()}catch(e){a(e)}})},6528:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{Xh:()=>c});var o=r(2573),i=r(9595),n=r(1814),s=e([o,i]);[o,i]=s.then?(await s)():s;let l=[{minQuantity:1,discountPercent:0,label:"1 Item",badge:""},{minQuantity:2,discountPercent:10,label:"2 Items — Save 10%",badge:"Popular"},{minQuantity:3,discountPercent:15,label:"3 Items — Save 15%",badge:"Best Value"},{minQuantity:5,discountPercent:20,label:"5+ Items — Save 20%",badge:"Maximum Savings"}];class d{constructor(){this.router=(0,o.Ld)(),this.memory=(0,i.Vv)(),this.shopify=(0,n.KC)()}async buildUpsell(e){try{let t=await this.memory.getPreferences(),r=e.mood||t.mood||"premium";if("all"===e.type)return this.buildCompleteUpsellSystem(e,r);let a="",o="",i="";switch(e.type){case"pre_purchase":({liquidCode:a,cssCode:o,jsCode:i}=this.buildPrePurchase(r));break;case"cart_upsell":({liquidCode:a,cssCode:o,jsCode:i}=this.buildCartUpsell(r));break;case"post_purchase":({liquidCode:a,cssCode:o,jsCode:i}=this.buildPostPurchase(r));break;case"bundle":({liquidCode:a,cssCode:o,jsCode:i}=this.buildBundle(e,r));break;case"cross_sell":({liquidCode:a,cssCode:o,jsCode:i}=this.buildCrossSell(r));break;case"frequently_bought":({liquidCode:a,cssCode:o,jsCode:i}=this.buildFrequentlyBought(r));break;case"quantity_discount":({liquidCode:a,cssCode:o,jsCode:i}=this.buildQuantityDiscount(e,r));break;case"complete_the_look":({liquidCode:a,cssCode:o,jsCode:i}=this.buildCompleteTheLook(r))}let n=!1;return this.shopify.isConfigured()&&(n=await this.applyToStore(e.type,a,o,i)),await this.memory.logAction({agent:"upsell-bundle",action:`build_${e.type}`,input:JSON.stringify(e),output:`Built ${e.type} upsell`,success:!0,duration:0,reversible:!0}),{success:!0,type:e.type,liquidCode:a,cssCode:o,jsCode:i,applied:n,message:n?`✅ ${e.type} upsell system built and applied!`:`✅ ${e.type} upsell system built! Connect Shopify to apply.`}}catch(r){let t=r instanceof Error?r.message:"Unknown error";return{success:!1,type:e.type,liquidCode:"",cssCode:"",jsCode:"",applied:!1,message:`❌ Error building upsell: ${t}`}}}async buildCompleteUpsellSystem(e,t){let r=this.buildPrePurchase(t),a=this.buildCartUpsell(t),o=this.buildFrequentlyBought(t),i=this.buildQuantityDiscount(e,t),n=this.buildCrossSell(t),s=[r.liquidCode,a.liquidCode,o.liquidCode,i.liquidCode,n.liquidCode].join("\n\n"),c=[r.cssCode,a.cssCode,o.cssCode,i.cssCode,n.cssCode].join("\n\n"),l=[r.jsCode,a.jsCode,o.jsCode,i.jsCode,n.jsCode].join("\n\n"),d=!1;return this.shopify.isConfigured()&&(d=await this.applyToStore("all",s,c,l)),{success:!0,type:"all",liquidCode:s,cssCode:c,jsCode:l,applied:d,message:d?`✅ Complete upsell system built (5 components) and applied!`:`✅ Complete upsell system built! Connect Shopify to apply.`}}buildPrePurchase(e){let t=`
{% comment %} CareHub: Pre-Purchase Upsell {% endcomment %}

  
    🎁 Special Offer
    Add These & Save More
  
  
    {% for rec in product.collections.first.products limit: 3 %}
      {% if rec.id != product.id %}
      
        
          
          {% if rec.featured_image %}
            
          {% endif %}
          
            {{ rec.title | truncate: 35 }}
            {{ rec.price | money }}
          
        
        + Add
      
      {% endif %}
    {% endfor %}
  
  
    💰 You're saving $0 with this combination!
  
`,r=`
/* Pre-Purchase Upsell */
.carehub-upsell-pre {
  margin: 20px 0;
  padding: 20px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-upsell-pre__header {
  margin-bottom: 14px;
}
.carehub-upsell-pre__badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.1);
  color: var(--color-primary, #c9a962);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.carehub-upsell-pre__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0;
}
.carehub-upsell-pre__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.carehub-upsell-pre__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}
.carehub-upsell-pre__item:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-upsell-pre__item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-upsell-pre__check {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary, #c9a962);
  cursor: pointer;
}
.carehub-upsell-pre__img {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-upsell-pre__name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
}
.carehub-upsell-pre__price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-upsell-pre__add-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid var(--color-primary, #c9a962);
  border-radius: 6px;
  transition: all 0.2s;
}
.carehub-upsell-pre__add-label:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
.carehub-upsell-pre__savings {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-success, #4ade80) !important;
  text-align: center;
}`,a=`
// Pre-Purchase Upsell Logic
(function(){
  var checks = document.querySelectorAll('.carehub-upsell-pre__check');
  var savingsEl = document.getElementById('ch-pre-savings');
  var saveAmountEl = document.getElementById('ch-save-amount');
  
  checks.forEach(function(check) {
    check.addEventListener('change', function() {
      var checked = document.querySelectorAll('.carehub-upsell-pre__check:checked');
      if (checked.length > 0 && savingsEl) {
        savingsEl.style.display = 'block';
        var savings = checked.length * 5;
        if (saveAmountEl) saveAmountEl.textContent = '$' + savings.toFixed(2);
      } else if (savingsEl) {
        savingsEl.style.display = 'none';
      }
    });
    
    // Click entire item to toggle
    var item = check.closest('.carehub-upsell-pre__item');
    if (item) {
      item.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
          check.checked = !check.checked;
          check.dispatchEvent(new Event('change'));
        }
      });
    }
  });
})();`;return{liquidCode:t,cssCode:r,jsCode:a}}buildCartUpsell(e){let t=`
{% comment %} CareHub: Cart Upsell {% endcomment %}

  
    🔥 Customers Also Bought
    Add & Save 15%
  
  
    {% for product in collections.all.products limit: 6 %}
    
      
        {% if product.featured_image %}
          
        {% endif %}
      
      
        {{ product.title | truncate: 25 }}
        
          {{ product.price | times: 0.85 | money }}
          {{ product.price | money }}
        
      
      
        + Add
      
    
    {% endfor %}
  
`,r=`
/* Cart Upsell */
.carehub-cart-upsell {
  margin: 20px 0;
  padding: 20px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-cart-upsell__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.carehub-cart-upsell__header h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0;
}
.carehub-cart-upsell__discount {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
  background: rgba(74, 222, 128, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}
.carehub-cart-upsell__slider {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.carehub-cart-upsell__slider::-webkit-scrollbar { display: none; }
.carehub-cart-upsell__item {
  flex-shrink: 0;
  width: 160px;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  text-align: center;
  scroll-snap-align: start;
  transition: all 0.2s ease;
}
.carehub-cart-upsell__item:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-cart-upsell__image {
  margin-bottom: 8px;
}
.carehub-cart-upsell__image img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}
.carehub-cart-upsell__name {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 6px;
  line-height: 1.3;
}
.carehub-cart-upsell__pricing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
}
.carehub-cart-upsell__sale-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-cart-upsell__original-price {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
}
.carehub-cart-upsell__add-btn {
  width: 100%;
  padding: 8px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.carehub-cart-upsell__add-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.carehub-cart-upsell__add-btn.added {
  background: var(--color-success, #4ade80);
}`,a=`
// Cart Upsell — Add to Cart
window.addCartUpsell = function(btn) {
  var variantId = btn.getAttribute('data-variant-id');
  if (!variantId) return;
  
  btn.textContent = '...';
  btn.disabled = true;
  
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function() {
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(function() { btn.textContent = '+ Add'; btn.disabled = false; btn.classList.remove('added'); }, 2000);
  })
  .catch(function() {
    btn.textContent = 'Error';
    setTimeout(function() { btn.textContent = '+ Add'; btn.disabled = false; }, 2000);
  });
};`;return{liquidCode:t,cssCode:r,jsCode:a}}buildPostPurchase(e){let t=`
{% comment %} CareHub: Post-Purchase Upsell (Thank You Page) {% endcomment %}

  
    🎉 Exclusive One-Time Offer
    Wait! Add This For 25% Off
    As a thank you for your order, we're offering you an exclusive deal. This offer won't appear again!
    
      {% for product in collections.all.products limit: 1 offset: 3 %}
      
        {% if product.featured_image %}
          
        {% endif %}
        
          {{ product.title }}
          
            {{ product.price | times: 0.75 | money }}
            {{ product.price | money }}
            Save 25%
          
        
      
      
        
          ✅ Yes! Add to My Order
        
        
          No thanks, I'll pass
        
      
      {% endfor %}
    
    
      ⏰ Offer expires in: 4:59
    
  
`,r=`
/* Post-Purchase Upsell */
.carehub-post-upsell {
  max-width: 500px;
  margin: 30px auto;
  padding: 30px;
  background: var(--color-surface, #12121a);
  border: 2px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius-lg, 16px);
  text-align: center;
  box-shadow: 0 10px 40px rgba(201, 169, 98, 0.15);
}
.carehub-post-upsell__badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.15);
  color: var(--color-primary, #c9a962);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 14px;
}
.carehub-post-upsell__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-post-upsell__desc {
  font-size: 0.9rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
  line-height: 1.5;
}
.carehub-post-upsell__product-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-background, #0a0a0f);
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: left;
}
.carehub-post-upsell__product-card img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}
.carehub-post-upsell__product-info h4 {
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-post-upsell__pricing {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.carehub-post-upsell__new-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-post-upsell__old-price {
  font-size: 0.9rem;
  text-decoration: line-through;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-post-upsell__save-badge {
  background: var(--color-success, #4ade80);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}
.carehub-post-upsell__buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.carehub-post-upsell__yes-btn {
  padding: 16px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-post-upsell__yes-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.4);
}
.carehub-post-upsell__no-btn {
  padding: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
}
.carehub-post-upsell__timer {
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--color-error, #f87171) !important;
}
.carehub-post-upsell__timer strong {
  color: var(--color-error, #f87171) !important;
}`,a=`
// Post-Purchase Upsell
window.acceptPostUpsell = function(btn) {
  var variantId = btn.getAttribute('data-variant-id');
  if (!variantId) return;
  btn.textContent = 'Adding...';
  btn.disabled = true;
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function() {
    btn.textContent = '✅ Added to Order!';
    btn.style.background = '#4ade80';
  })
  .catch(function() {
    btn.textContent = 'Error — Try Again';
    btn.disabled = false;
  });
};

// Post-purchase timer
(function(){
  var timerEl = document.getElementById('ch-post-timer');
  if (!timerEl) return;
  var seconds = 299;
  setInterval(function(){
    if (seconds <= 0) { timerEl.textContent = 'EXPIRED'; return; }
    seconds--;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    timerEl.textContent = m + ':' + s.toString().padStart(2, '0');
  }, 1000);
})();`;return{liquidCode:t,cssCode:r,jsCode:a}}buildFrequentlyBought(e){let t=`
{% comment %} CareHub: Frequently Bought Together {% endcomment %}

  Frequently Bought Together
  
    
      {% if product.featured_image %}
        
      {% endif %}
      {{ product.title | truncate: 20 }}
      {{ product.price | money }}
    
    {% for rec in product.collections.first.products limit: 2 %}
      {% if rec.id != product.id %}
      +
      
        
        {% if rec.featured_image %}
          
        {% endif %}
        {{ rec.title | truncate: 20 }}
        {{ rec.price | money }}
      
      {% endif %}
    {% endfor %}
  
  
    
      Bundle Price:
      Save 15%
    
    
      🛒 Add All to Cart
    
  
`,r=`
/* Frequently Bought Together */
.carehub-fbt {
  margin: 40px 0;
  padding: 24px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-fbt__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-fbt__products {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.carehub-fbt__product {
  text-align: center;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  width: 130px;
  position: relative;
}
.carehub-fbt__product--current {
  border-color: var(--color-primary, #c9a962);
}
.carehub-fbt__product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
}
.carehub-fbt__product span {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 4px;
}
.carehub-fbt__product strong {
  font-size: 0.9rem;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-fbt__check {
  position: absolute;
  top: 8px;
  right: 8px;
  accent-color: var(--color-primary, #c9a962);
}
.carehub-fbt__plus {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962);
}
.carehub-fbt__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-fbt__bundle-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
}
.carehub-fbt__buy-btn {
  padding: 12px 24px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}
.carehub-fbt__buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.3);
}
@media (max-width: 600px) {
  .carehub-fbt__products { flex-direction: column; }
  .carehub-fbt__plus { transform: rotate(90deg); }
  .carehub-fbt__product { width: 100%; }
}`,a=`
// Frequently Bought Together — Buy Bundle
window.buyBundle = function() {
  var products = document.querySelectorAll('.carehub-fbt__product:not(.carehub-fbt__product--current)');
  var items = [];
  
  // Add current product
  var currentVariant = document.getElementById('ch-variant-id');
  if (currentVariant) {
    items.push({ id: parseInt(currentVariant.value), quantity: 1 });
  }
  
  // Add checked upsell products
  products.forEach(function(p) {
    var check = p.querySelector('.carehub-fbt__check');
    if (check && check.checked) {
      var vid = p.getAttribute('data-variant-id');
      if (vid) items.push({ id: parseInt(vid), quantity: 1 });
    }
  });
  
  if (items.length === 0) return;
  
  var btn = document.querySelector('.carehub-fbt__buy-btn');
  if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
  
  // Add all items
  var addPromises = items.map(function(item) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  });
  
  Promise.all(addPromises)
    .then(function() {
      if (btn) { btn.textContent = '✅ Added All!'; btn.style.background = '#4ade80'; }
      setTimeout(function() { window.location.href = '/cart'; }, 1000);
    })
    .catch(function() {
      if (btn) { btn.textContent = 'Error — Try Again'; btn.disabled = false; }
    });
};`;return{liquidCode:t,cssCode:r,jsCode:a}}buildQuantityDiscount(e,t){let r=l.map((e,t)=>`
      
        ${e.badge?`${e.badge}`:""}
        ${e.label}
        ${e.discountPercent>0?`-${e.discountPercent}%`:"Standard"}
      `).join(""),a=`
{% comment %} CareHub: Quantity Discount Breaks {% endcomment %}

  💰 Buy More, Save More
  
    ${r}
  
`,o=`
/* Quantity Discount Breaks */
.carehub-qty-break {
  margin: 18px 0;
  padding: 18px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-qty-break__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0 0 14px 0;
}
.carehub-qty-break__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.carehub-qty-break__option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.carehub-qty-break__option:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-qty-break__option--popular {
  border-color: var(--color-primary, #c9a962);
  background: rgba(201, 169, 98, 0.05);
}
.carehub-qty-break__option--selected {
  border-color: var(--color-primary, #c9a962) !important;
  background: rgba(201, 169, 98, 0.1) !important;
  box-shadow: 0 0 0 1px var(--color-primary, #c9a962);
}
.carehub-qty-break__badge {
  position: absolute;
  top: -8px;
  right: 10px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.carehub-qty-break__label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
}
.carehub-qty-break__savings {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
}`,i=`
// Quantity Discount Break Selection
window.selectQtyBreak = function(el) {
  // Remove previous selection
  document.querySelectorAll('.carehub-qty-break__option').forEach(function(opt) {
    opt.classList.remove('carehub-qty-break__option--selected');
  });
  
  // Select this one
  el.classList.add('carehub-qty-break__option--selected');
  
  // Update quantity input
  var qty = el.getAttribute('data-qty');
  var qtyInput = document.getElementById('ch-quantity');
  var formQty = document.getElementById('ch-form-qty');
  if (qtyInput) qtyInput.value = qty;
  if (formQty) formQty.value = qty;
};`;return{liquidCode:a,cssCode:o,jsCode:i}}buildCrossSell(e){let t=`
{% comment %} CareHub: Cross-Sell (Scroll-Triggered) {% endcomment %}

  
    ✕
    
      👋 While you're here...
      Complete Your Order
      
        {% for rec in collections.all.products limit: 1 offset: 2 %}
        
        
          {{ rec.title | truncate: 30 }}
          {{ rec.price | money }}
        
        Add
        {% endfor %}
      
    
  
`,r=`
/* Cross-Sell Popup */
.carehub-cross-sell {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 998;
  animation: slideUp 0.5s ease;
}
.carehub-cross-sell__inner {
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  max-width: 320px;
  position: relative;
}
.carehub-cross-sell__close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a);
  font-size: 1.1rem;
  cursor: pointer;
}
.carehub-cross-sell__label {
  font-size: 0.75rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 600;
}
.carehub-cross-sell__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 4px 0 12px;
}
.carehub-cross-sell__product {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-cross-sell__img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-cross-sell__name {
  display: block;
  font-size: 0.8rem;
  color: var(--color-heading, #fff) !important;
  font-weight: 600;
}
.carehub-cross-sell__price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-cross-sell__add {
  margin-left: auto;
  padding: 8px 14px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
@keyframes slideUp {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (max-width: 480px) {
  .carehub-cross-sell { left: 10px; right: 10px; bottom: 10px; }
  .carehub-cross-sell__inner { max-width: 100%; }
}`,a=`
// Cross-Sell — Show on Scroll
(function(){
  var crossSell = document.getElementById('ch-cross-sell');
  if (!crossSell) return;
  var shown = false;
  window.addEventListener('scroll', function() {
    if (shown) return;
    var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    if (scrollPercent > 50) {
      crossSell.style.display = 'block';
      shown = true;
      // Auto-hide after 15 seconds
      setTimeout(function() {
        if (crossSell.style.display !== 'none') {
          crossSell.style.display = 'none';
        }
      }, 15000);
    }
  });
})();`;return{liquidCode:t,cssCode:r,jsCode:a}}buildCompleteTheLook(e){let t=`
{% comment %} CareHub: Complete the Look {% endcomment %}

  ✨ Complete the Look
  Hand-picked items that pair perfectly together
  
    {% for rec in product.collections.first.products limit: 3 %}
      {% if rec.id != product.id %}
      
        {% if rec.featured_image %}
          
            
          
        {% endif %}
        {{ rec.title | truncate: 30 }}
        {{ rec.price | money }}
        + Add to Cart
      
      {% endif %}
    {% endfor %}
  
`,r=`
/* Complete the Look */
.carehub-complete {
  margin: 50px 0;
  padding: 30px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-complete__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.3rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 4px;
}
.carehub-complete__subtitle {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
}
.carehub-complete__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.carehub-complete__item {
  text-align: center;
  padding: 14px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  transition: all 0.3s ease;
}
.carehub-complete__item:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-complete__item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
}
.carehub-complete__item h4 {
  font-size: 0.85rem;
  margin-bottom: 6px;
}
.carehub-complete__item h4 a {
  color: var(--color-heading, #fff) !important;
  text-decoration: none;
}
.carehub-complete__price {
  display: block;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  margin-bottom: 10px;
  font-size: 0.95rem;
}
.carehub-complete__add-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-primary, #c9a962);
  color: var(--color-primary, #c9a962) !important;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.carehub-complete__add-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
@media (max-width: 600px) {
  .carehub-complete__grid { grid-template-columns: 1fr; }
}`;return{liquidCode:t,cssCode:r,jsCode:"// Complete the Look uses the addCartUpsell function defined above"}}buildBundle(e,t){let r=e.discountPercent||15,a=e.bundleName||"Ultimate Bundle",o=`
{% comment %} CareHub: Product Bundle {% endcomment %}

  
    🎁 Bundle & Save ${r}%
    ${a}
    Get everything you need at a special bundle price
  
  
    {% for rec in product.collections.first.products limit: 3 %}
    
      {% if rec.featured_image %}
        
      {% endif %}
      {{ rec.title | truncate: 25 }}
      {{ rec.price | money }}
    
    {% unless forloop.last %}+{% endunless %}
    {% endfor %}
  
  
    
      Regular Price:
      
    
    
      Bundle Price:
      
    
    
      You Save: ${r}%
    
  
  
    🛒 Get the Bundle — Save ${r}%
  
`,i=`
/* Product Bundle */
.carehub-bundle {
  margin: 30px 0;
  padding: 28px;
  background: var(--color-surface, #12121a);
  border: 2px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius-lg, 16px);
  text-align: center;
}
.carehub-bundle__badge {
  display: inline-block;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.carehub-bundle__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.4rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 4px;
}
.carehub-bundle__desc {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
}
.carehub-bundle__products {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.carehub-bundle__product {
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border-radius: 10px;
  width: 120px;
}
.carehub-bundle__product img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
}
.carehub-bundle__product-name {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 3px;
}
.carehub-bundle__product-price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-bundle__connector {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962);
}
.carehub-bundle__pricing {
  margin-bottom: 18px;
  padding: 14px;
  background: rgba(201, 169, 98, 0.05);
  border-radius: 8px;
}
.carehub-bundle__original {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-bundle__original-price {
  text-decoration: line-through;
}
.carehub-bundle__discounted {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
}
.carehub-bundle__bundle-price {
  color: var(--color-primary, #c9a962) !important;
  font-size: 1.2rem;
}
.carehub-bundle__you-save {
  font-size: 0.9rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
}
.carehub-bundle__buy-btn {
  width: 100%;
  padding: 16px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-bundle__buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 169, 98, 0.4);
}
@media (max-width: 480px) {
  .carehub-bundle__products { flex-direction: column; }
  .carehub-bundle__connector { transform: rotate(90deg); }
}`;return{liquidCode:o,cssCode:i,jsCode:"// Bundle uses the buyBundle() function defined in Frequently Bought Together"}}async applyToStore(e,t,r,a){try{let e=await this.shopify.getMainTheme();if(!e.success||!e.data)return!1;let o=e.data.id;await this.shopify.updateThemeAsset(o,{key:"assets/carehub-upsell.css",value:r}),await this.shopify.updateThemeAsset(o,{key:"assets/carehub-upsell.js",value:a}),await this.shopify.updateThemeAsset(o,{key:"snippets/carehub-upsell.liquid",value:t});let i=await this.shopify.getThemeAsset(o,"layout/theme.liquid");if(i.success&&i.data?.asset.value){let e=i.data.asset.value;e.includes("carehub-upsell.css")||(e=(e=e.replace("",`  {{ 'carehub-upsell.css' | asset_url | stylesheet_tag }}
`)).replace("",`  
`),await this.shopify.updateThemeAsset(o,{key:"layout/theme.liquid",value:e}))}return!0}catch(e){return console.error("[Upsell] Error applying to store:",e),!1}}async getSmartRecommendations(e){if(!this.shopify.isConfigured())return{crossSells:[],bundleWith:[],reason:"Shopify not configured"};let t=await this.shopify.getProduct(e);if(!t.success||!t.data)return{crossSells:[],bundleWith:[],reason:"Product not found"};let r=t.data.product,a=await this.shopify.getProducts({limit:20});if(!a.success||!a.data)return{crossSells:[],bundleWith:[],reason:"Could not fetch products"};let o=a.data.products,i=`Given this product:
Title: ${r.title}
Type: ${r.product_type}
Tags: ${r.tags}
Price: ${r.variants?.[0]?.price}

And these other products:
${o.slice(0,10).map(e=>`- ID:${e.id} "${e.title}" ($${e.variants?.[0]?.price}) [${e.product_type}]`).join("\n")}

Which products would make the best:
1. Cross-sells (complementary products)
2. Bundle partners (bought together)

Return JSON:
{
  "crossSells": [product_id_1, product_id_2],
  "bundleWith": [product_id_1, product_id_2],
  "reason": "why these combinations work"
}`,n=await this.router.useGeminiJSON([{role:"user",content:i}],"complex_reasoning");return n.success&&n.data?n.data:{crossSells:[],bundleWith:[],reason:"AI recommendation failed"}}async removeUpsell(e){try{if(!this.shopify.isConfigured())return!1;let e=await this.shopify.getMainTheme();if(!e.success||!e.data)return!1;let t=e.data.id;return await this.shopify.deleteThemeAsset(t,"assets/carehub-upsell.css"),await this.shopify.deleteThemeAsset(t,"assets/carehub-upsell.js"),await this.shopify.deleteThemeAsset(t,"snippets/carehub-upsell.liquid"),!0}catch{return!1}}}let u=null;function c(){return u||(u=new d),u}a()}catch(e){a(e)}})},2570:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{GET:()=>v,POST:()=>_});var o=r(7070),i=r(6038),n=r(9595),s=r(2573),c=r(1014),l=r(7104),d=r(8750),u=r(6527),p=r(6528),m=r(1389),h=r(4977),g=r(4323),f=r(7083),b=r(5600),y=e([i,n,s,c,l,d,u,p,m,h,g,f,b]);async function x(e,t){switch(e){case"design_theme":{let e=(0,c.wg)(),r=await e.designTheme({mood:t.mood||"premium",specificRequests:t.requests,event:t.event});return{success:r.success,response:r.message,agent:"theme-designer"}}case"modify_theme":{let e=(0,c.wg)(),r=await e.modifyTheme(t.modification||"");return{success:r.success,response:r.message,agent:"theme-designer"}}case"event_theme":{let e=(0,c.wg)(),r=await e.applyEventTheme(t.event||"");return{success:r.success,response:r.message,agent:"theme-designer"}}case"build_homepage":{let e=(0,l.CP)(),r=await e.buildHomepage({mood:t.mood,sections:t.sections,heroHeadline:t.headline,event:t.event});return{success:r.success,response:r.message,agent:"homepage"}}case"build_product_page":{let e=(0,d.Ts)(),r=await e.buildProductPage({mood:t.mood,layoutStyle:t.layout});return{success:r.success,response:r.message,agent:"product-page"}}case"build_landing_page":{let e=(0,u.Gc)(),r=await e.buildLandingPage({productTitle:t.product,productUrl:t.url,productPrice:t.price,adPlatform:t.platform,mood:t.mood});return{success:r.success,response:r.message,agent:"landing-page"}}case"build_upsell":{let e=(0,p.Xh)(),r=await e.buildUpsell({type:t.type||"all",discountPercent:t.discount,bundleName:t.name});return{success:r.success,response:r.message,agent:"upsell-bundle"}}case"list_products":{let e=(0,m.pO)(),r=await e.listProducts(t);return{success:r.success,response:r.message,agent:"product-manager"}}case"create_product":{let e=(0,m.pO)(),r=await e.createProduct({title:t.title||"New Product",description:t.description,price:t.price,images:t.images,tags:t.tags,generateDescription:!1!==t.generateDescription});return{success:r.success,response:r.message,agent:"product-manager"}}case"import_products":{let e=(0,m.pO)(),r=await e.importFromSupplier({supplier:t.supplier||"cj_dropshipping",searchQuery:t.query,maxProducts:t.limit||5,autoDescription:!0,autoPrice:!0});return{success:r.success,response:r.message,agent:"product-manager"}}case"get_orders":{let e=(0,h.Qm)(),t=await e.getUnfulfilledOrders();return{success:t.success,response:t.message,agent:"order-fulfillment"}}case"fulfill_orders":{let e=(0,h.Qm)(),r=await e.fulfillOrder({autoFulfill:!0,supplier:t.supplier});return{success:r.success,response:r.message,agent:"order-fulfillment"}}case"order_summary":{let e=(0,h.Qm)(),t=await e.getOrderSummary();return{success:!0,response:`📊 Orders: ${t.total} total | ${t.unfulfilled} pending | ${t.todayOrders} today | $${t.pendingValue} pending value`,agent:"order-fulfillment"}}case"check_prices":{let e=(0,g.HD)(),t=await e.runMonitor();return{success:t.success,response:t.message,agent:"price-monitor"}}case"update_margin":{let e=(0,g.HD)(),r=await e.updateMargin(t.margin||40);return{success:r.success,response:r.message,agent:"price-monitor"}}case"generate_content":{let e=(0,f.xo)(),r=await e.generate({type:t.type||"product_description",product:t.product,topic:t.topic,keywords:t.keywords,platform:t.platform});return{success:r.success,response:r.content||r.message,agent:"content-seo"}}case"seo_audit":{let e=(0,f.xo)(),r=await e.auditProductSEO(t.productId||0);return{success:r.success,response:`SEO Score: ${r.score}/100
Issues: ${r.issues.length}
Recommendations: ${r.recommendations.join(", ")}`,agent:"content-seo"}}case"list_collections":{let e=(0,b.Wo)(),t=await e.listCollections();return{success:t.success,response:t.message,agent:"collections"}}case"create_collection":{let e=(0,b.Wo)(),r=await e.createCollection({title:t.title||"New Collection",type:t.type||"smart",rules:t.rules,generateDescription:!0});return{success:r.success,response:r.message,agent:"collections"}}case"create_preset_collections":{let e=(0,b.Wo)(),t=await e.createPresetCollections();return{success:t.success,response:t.message,agent:"collections"}}case"auto_organize":{let e=(0,b.Wo)(),t=await e.autoOrganize();return{success:t.success,response:t.message,agent:"collections"}}case"system_status":{let e=(0,s.Ld)(),t=(0,n.Vv)(),r=e.getStatus(),a=await t.getStats();return{success:!0,response:`🤖 System Status:
• Groq: ${r.groq.healthy?"✅":"❌"} (${r.groq.remainingRequests} remaining)
• Gemini: ${r.gemini.healthy?"✅":"❌"} (${r.gemini.remainingRequests} remaining)
• Total routed: ${r.totalRequestsRouted}
• Messages: ${a.totalMessages}
• Actions: ${a.totalActions}
• Storage: ${a.storageType}`,agent:"system"}}case"memory_summary":{let e=(0,n.Vv)(),t=await e.getFullSummary();return{success:!0,response:t,agent:"memory"}}case"reset_memory":{let e=(0,n.Vv)();return await e.reset("conversations"),{success:!0,response:"✅ Conversation history cleared. Preferences and state preserved.",agent:"memory"}}default:return{success:!1,response:`Unknown action: ${e}`,agent:"system"}}}async function _(e){let t=Date.now();try{let r=await e.json();if(!r.message&&!r.action)return o.NextResponse.json({success:!1,response:"Please provide a message or action.",agentsUsed:[],actions:[],processingTime:Date.now()-t,status:{aiRouter:(0,s.Ld)().getStatus(),memory:await (0,n.Vv)().getStats()}},{status:400});if(r.action){let e=await x(r.action,r.params||{}),a={success:e.success,response:e.response,agentsUsed:[e.agent],actions:[{agent:e.agent,action:r.action,success:e.success,result:e.response,duration:Date.now()-t}],processingTime:Date.now()-t,status:{aiRouter:(0,s.Ld)().getStatus(),memory:await (0,n.Vv)().getStats()}};return o.NextResponse.json(a)}let a=(0,i.lD)();a.registerHandler("theme-designer",async e=>{let t=(0,c.wg)(),r=Date.now(),a=e.parameters.rawMessage||e.parameters.mood||"premium",o=await t.designTheme({mood:a});return{agent:"theme-designer",action:e.action,success:o.success,result:o.message,duration:Date.now()-r}}),a.registerHandler("homepage",async e=>{let t=(0,l.CP)(),r=Date.now(),a=await t.buildHomepage({mood:e.parameters.mood||void 0,event:e.parameters.event||void 0});return{agent:"homepage",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("product-page",async e=>{let t=(0,d.Ts)(),r=Date.now(),a=await t.buildProductPage({mood:e.parameters.mood||void 0});return{agent:"product-page",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("landing-page",async e=>{let t=(0,u.Gc)(),r=Date.now(),a=await t.buildLandingPage({productTitle:e.parameters.product||void 0,mood:e.parameters.mood||void 0});return{agent:"landing-page",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("upsell-bundle",async e=>{let t=(0,p.Xh)(),r=Date.now(),a=await t.buildUpsell({type:"all"});return{agent:"upsell-bundle",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("product-manager",async e=>{let t=(0,m.pO)(),r=Date.now(),a=await t.handleCommand(e.parameters.rawMessage||e.action);return{agent:"product-manager",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("order-fulfillment",async e=>{let t=(0,h.Qm)(),r=Date.now(),a=await t.handleCommand(e.parameters.rawMessage||e.action);return{agent:"order-fulfillment",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("price-monitor",async e=>{let t=(0,g.HD)(),r=Date.now(),a=await t.handleCommand(e.parameters.rawMessage||e.action);return{agent:"price-monitor",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}}),a.registerHandler("content-seo",async e=>{let t=(0,f.xo)(),r=Date.now(),a=await t.handleCommand(e.parameters.rawMessage||e.action);return{agent:"content-seo",action:e.action,success:a.success,result:a.content||a.message,duration:Date.now()-r}}),a.registerHandler("collections",async e=>{let t=(0,b.Wo)(),r=Date.now(),a=await t.handleCommand(e.parameters.rawMessage||e.action);return{agent:"collections",action:e.action,success:a.success,result:a.message,duration:Date.now()-r}});let y=await a.process({message:r.message,sessionId:r.sessionId}),_={success:y.success,response:y.response,agentsUsed:y.agentsUsed,actions:y.actions,suggestedFollowUp:y.suggestedFollowUp,processingTime:y.processingTime,status:{aiRouter:(0,s.Ld)().getStatus(),memory:await (0,n.Vv)().getStats()}};return o.NextResponse.json(_)}catch(r){let e=r instanceof Error?r.message:"Internal server error";return o.NextResponse.json({success:!1,response:`❌ Error: ${e}`,agentsUsed:[],actions:[],processingTime:Date.now()-t,status:{aiRouter:(0,s.Ld)().getStatus(),memory:await (0,n.Vv)().getStats()}},{status:500})}}async function v(){try{let e=(0,s.Ld)(),t=(0,n.Vv)(),r={status:"operational",timestamp:new Date().toISOString(),version:"1.0.0",agents:{total:13,active:["ai-router","orchestrator","memory","theme-designer","homepage","product-page","landing-page","upsell-bundle","product-manager","order-fulfillment","price-monitor","content-seo","collections"]},ai:e.getStatus(),memory:await t.getStats(),uptime:process.uptime()};return o.NextResponse.json(r)}catch(e){return o.NextResponse.json({status:"error",message:e instanceof Error?e.message:"Unknown error"},{status:500})}}[i,n,s,c,l,d,u,p,m,h,g,f,b]=y.then?(await y)():y,a()}catch(e){a(e)}})}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,972,67,893],()=>r(1305));module.exports=a})();