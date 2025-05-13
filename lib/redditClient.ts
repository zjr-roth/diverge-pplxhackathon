/**
 * Enhanced Reddit API client for comprehensive sentiment analysis
 * Gathers data from multiple stock-related subreddits
 */

interface RedditPost {
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    subreddit: string;
    created_utc: number;
    comments?: RedditComment[];
}

interface RedditComment {
    body: string;
    score: number;
    permalink: string;
    created_utc: number;
}

interface SentimentData {
    bullishPosts: RedditPost[];
    bearishPosts: RedditPost[];
    neutralPosts: RedditPost[];
    keyThemes: string[];
    sources: string[];
}

interface ThemePattern {
    pattern: RegExp;
    theme: string;
}

interface ReasonPattern {
    pattern: RegExp;
    reason: string;
    type: string;
}

class RedditClient {
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    // Comprehensive list of stock-related subreddits
    private readonly STOCK_SUBREDDITS = [
        'stocks',
        'wallstreetbets',
        'investing',
        'StockMarket',
        'options',
        'SecurityAnalysis',
        'valueinvesting',
        'pennystocks',
        'smallstreetbets',
        'thetagang',
        'dividends',
        'stockstobuy',
        'daytrading',
        'algotrading',
        'UKInvesting',
        'CanadianInvestor',
        'ASX_Bets',
        'IndiaInvestments',
        'EuropeInvesting'
    ];

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
     * Get OAuth token for Reddit API
     */
    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'NarrativeCheck/1.0'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error(`Reddit auth failed: ${response.status}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        return this.accessToken || "";
    }

    /**
     * Enhanced gatherCompanyData with better search and limit handling
     */
    async gatherCompanyData(company: string): Promise<SentimentData> {
        const token = await this.getAccessToken();
        const allPosts: RedditPost[] = [];

        // Multiple search strategies for comprehensive coverage
        const searchStrategies = [
            // Direct company mentions
            { query: company, subreddits: this.STOCK_SUBREDDITS.slice(0, 5) },
            // Ticker symbol search (assumes company is ticker)
            { query: `${company}`, subreddits: this.STOCK_SUBREDDITS.slice(0, 5) },
            // Quoted search
            { query: `"${company}"`, subreddits: this.STOCK_SUBREDDITS.slice(5, 10) },
            // Discussion focused
            { query: `${company} DD`, subreddits: ['stocks', 'wallstreetbets', 'investing'] },
            { query: `${company} analysis`, subreddits: ['SecurityAnalysis', 'valueinvesting'] },
            // Sentiment focused
            { query: `${company} bullish`, subreddits: ['wallstreetbets', 'options'] },
            { query: `${company} bearish`, subreddits: ['stocks', 'investing'] }
        ];

        // Execute searches with better error handling
        for (const { query, subreddits } of searchStrategies) {
            for (const subreddit of subreddits) {
                try {
                    const response = await fetch(
                        `https://oauth.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&sort=relevance&t=year&limit=100`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'User-Agent': 'NarrativeCheck/1.0'
                            }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        const posts = data.data.children
                            .filter((child: any) => {
                                const title = child.data.title.toLowerCase();
                                const text = child.data.selftext.toLowerCase();
                                const companyLower = company.toLowerCase();

                                // Must mention company specifically
                                const hasCompanyMention = title.includes(companyLower) ||
                                                        text.includes(companyLower) ||
                                                        title.includes(`${companyLower}`) ||
                                                        text.includes(`${companyLower}`);

                                // Exclude generic threads
                                const isGeneric = title.includes('daily discussion') ||
                                                title.includes('weekend discussion') ||
                                                title.includes('what are your moves') ||
                                                title.includes('weekly thread') ||
                                                title.includes('rate my portfolio');

                                // Minimum engagement
                                const hasEngagement = child.data.score >= 5 || child.data.num_comments >= 3;

                                // Filter for posts within 90 days
                                const ninetyDaysAgo = Date.now() / 1000 - (90 * 24 * 60 * 60);
                                const isRecent = child.data.created_utc >= ninetyDaysAgo;

                                return hasCompanyMention && !isGeneric && hasEngagement && isRecent;
                            })
                            .map((child: any) => ({
                                title: child.data.title,
                                selftext: child.data.selftext,
                                url: child.data.url,
                                permalink: `https://reddit.com${child.data.permalink}`,
                                score: child.data.score,
                                num_comments: child.data.num_comments,
                                subreddit: child.data.subreddit,
                                created_utc: child.data.created_utc
                            }));

                        allPosts.push(...posts);

                        // Stop if we have enough posts
                        if (allPosts.length >= 200) break;
                    }
                } catch (error) {
                    console.error(`Error searching r/${subreddit} for "${query}":`, error);
                }
            }

            // Stop if we have enough posts
            if (allPosts.length >= 200) break;
        }

        // Deduplicate and sort
        const uniquePosts = this.deduplicatePosts(allPosts);
        const sortedPosts = uniquePosts.sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments));

        console.log(`Found ${sortedPosts.length} unique posts for ${company}`);

        // Take top posts for analysis
        const topPosts = sortedPosts.slice(0, 150);

        return this.analyzeSentiment(topPosts, company);
    }

    /**
     * Remove duplicate posts
     */
    private deduplicatePosts(posts: RedditPost[]): RedditPost[] {
        const seen = new Set<string>();
        return posts.filter(post => {
            const key = post.permalink;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Enhanced analyzeSentiment with more detailed scoring
     */
    private analyzeSentiment(posts: RedditPost[], company: string): SentimentData {
        const bullishPosts: RedditPost[] = [];
        const bearishPosts: RedditPost[] = [];
        const neutralPosts: RedditPost[] = [];
        const themes = new Map<string, number>();
        const sources: string[] = [];

        // Enhanced sentiment analysis
        posts.forEach(post => {
            const sentiment = this.analyzePostSentiment(post, company);

            if (sentiment.score > 1) {
                bullishPosts.push(post);
            } else if (sentiment.score < -1) {
                bearishPosts.push(post);
            } else {
                neutralPosts.push(post);
            }

            // Extract themes with context
            this.extractDetailedThemes(`${post.title} ${post.selftext}`, themes);
            sources.push(post.permalink);
        });

        // Sort by engagement
        bullishPosts.sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments));
        bearishPosts.sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments));
        neutralPosts.sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments));

        // Get top themes
        const keyThemes = Array.from(themes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([theme]) => theme);

        return {
            bullishPosts,
            bearishPosts,
            neutralPosts,
            keyThemes,
            sources: sources.slice(0, 10)
        };
    }

    /**
     * Enhanced sentiment analysis for individual posts
     */
    private analyzePostSentiment(post: RedditPost, company: string): { score: number; reasons: string[] } {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        let score = 0;
        const reasons: string[] = [];

        // Enhanced sentiment patterns with context
        const sentimentPatterns = [
            // Strong bullish with context
            { pattern: /strong\s*buy/i, score: 3, reason: 'strong buy signal' },
            { pattern: /calls?\s*on\s*\$?\w+/i, score: 2, reason: 'call options' },
            { pattern: /loading\s*up/i, score: 2, reason: 'accumulation' },
            { pattern: /undervalued/i, score: 2, reason: 'undervaluation' },
            { pattern: /buy\s*the\s*dip/i, score: 2, reason: 'dip buying' },
            { pattern: /to\s*the\s*moon/i, score: 2, reason: 'extreme bullishness' },
            { pattern: /earnings\s*beat/i, score: 2, reason: 'earnings beat' },
            { pattern: /raised\s*guidance/i, score: 2, reason: 'raised guidance' },

            // Moderate bullish
            { pattern: /\bbuy\b/i, score: 1, reason: 'buy recommendation' },
            { pattern: /\blong\b/i, score: 1, reason: 'long position' },
            { pattern: /bullish/i, score: 1, reason: 'bullish sentiment' },
            { pattern: /upside/i, score: 1, reason: 'upside potential' },
            { pattern: /growth/i, score: 1, reason: 'growth prospects' },

            // Strong bearish
            { pattern: /strong\s*sell/i, score: -3, reason: 'strong sell signal' },
            { pattern: /puts?\s*on\s*\$?\w+/i, score: -2, reason: 'put options' },
            { pattern: /overvalued/i, score: -2, reason: 'overvaluation' },
            { pattern: /stay\s*away/i, score: -2, reason: 'avoid recommendation' },
            { pattern: /bubble/i, score: -2, reason: 'bubble concerns' },
            { pattern: /earnings\s*miss/i, score: -2, reason: 'earnings miss' },
            { pattern: /lowered\s*guidance/i, score: -2, reason: 'lowered guidance' },

            // Moderate bearish
            { pattern: /\bsell\b/i, score: -1, reason: 'sell recommendation' },
            { pattern: /\bshort\b/i, score: -1, reason: 'short position' },
            { pattern: /bearish/i, score: -1, reason: 'bearish sentiment' },
            { pattern: /downside/i, score: -1, reason: 'downside risk' },
            { pattern: /declining/i, score: -1, reason: 'declining metrics' }
        ];

        // Apply patterns
        sentimentPatterns.forEach(({ pattern, score: patternScore, reason }) => {
            if (pattern.test(text)) {
                score += patternScore;
                reasons.push(reason);
            }
        });

        // Check for specific metrics that add weight
        const metricPatterns = [
            { pattern: /\d+%\s*growth/i, score: 1, reason: 'growth metrics' },
            { pattern: /\d+%\s*decline/i, score: -1, reason: 'decline metrics' },
            { pattern: /p\/e\s*(?:ratio\s*)?(?:of\s*)?\d+/i, score: 0, reason: 'valuation discussion' }
        ];

        metricPatterns.forEach(({ pattern, score: metricScore, reason }) => {
            if (pattern.test(text)) {
                score += metricScore;
                reasons.push(reason);
            }
        });

        return { score, reasons };
    }

    /**
     * Extract detailed themes with better categorization
     */
    private extractDetailedThemes(text: string, themes: Map<string, number>): void {
        const detailedThemePatterns: ThemePattern[] = [
            // Financial performance
            { pattern: /earnings?\s*(?:report|results?|beat|miss)/i, theme: 'Earnings Performance' },
            { pattern: /revenue\s*(?:growth|decline|beat|miss)/i, theme: 'Revenue Trends' },
            { pattern: /guidance?\s*(?:raised|lowered|maintained)/i, theme: 'Forward Guidance' },
            { pattern: /margin\s*(?:expansion|compression|improvement)/i, theme: 'Profit Margins' },
            { pattern: /cash\s*flow|free\s*cash/i, theme: 'Cash Generation' },

            // Valuation
            { pattern: /p\/e\s*(?:ratio)?|price\s*earnings/i, theme: 'P/E Valuation' },
            { pattern: /price\s*target/i, theme: 'Price Targets' },
            { pattern: /(?:under|over)valued/i, theme: 'Valuation Views' },
            { pattern: /market\s*cap/i, theme: 'Market Capitalization' },

            // Growth and innovation
            { pattern: /product\s*(?:launch|announcement|innovation)/i, theme: 'Product Innovation' },
            { pattern: /ai|artificial\s*intelligence|machine\s*learning/i, theme: 'AI/Technology' },
            { pattern: /expansion|new\s*market/i, theme: 'Market Expansion' },
            { pattern: /user\s*growth|customer\s*acquisition/i, theme: 'User Growth' },

            // Competition and market
            { pattern: /competition|competitor|market\s*share/i, theme: 'Competitive Position' },
            { pattern: /industry\s*(?:leader|trends)/i, theme: 'Industry Position' },
            { pattern: /disruption|disrupt/i, theme: 'Market Disruption' },

            // Risk factors
            { pattern: /regulation|regulatory|government/i, theme: 'Regulatory Issues' },
            { pattern: /lawsuit|legal|litigation/i, theme: 'Legal Concerns' },
            { pattern: /debt|leverage|balance\s*sheet/i, theme: 'Financial Health' },
            { pattern: /recession|macro/i, theme: 'Macro Risks' },

            // Trading activity
            { pattern: /options?\s*(?:flow|activity)/i, theme: 'Options Activity' },
            { pattern: /institutional\s*(?:buying|selling)/i, theme: 'Institutional Flow' },
            { pattern: /insider\s*(?:buying|selling)/i, theme: 'Insider Trading' },
            { pattern: /short\s*(?:interest|squeeze)/i, theme: 'Short Interest' },

            // Technical analysis
            { pattern: /support|resistance/i, theme: 'Technical Levels' },
            { pattern: /moving\s*average/i, theme: 'Moving Averages' },
            { pattern: /breakout|breakdown/i, theme: 'Chart Patterns' }
        ];

        detailedThemePatterns.forEach(({ pattern, theme }) => {
            if (pattern.test(text)) {
                themes.set(theme, (themes.get(theme) || 0) + 1);
            }
        });
    }

    /**
     * Generate narrative bullets from sentiment data
     */
    generateNarrative(data: SentimentData, company: string): string[] {
        const totalPosts = data.bullishPosts.length + data.bearishPosts.length + data.neutralPosts.length;

        if (totalPosts === 0) {
            return [`• Limited Reddit discussion about ${company} in the past 90 days`];
        }

        const bullets: string[] = [];

        // 1. Overall sentiment with DETAILED breakdown and driver
        const overallSentiment = this.generateDetailedSentimentBullet(data, totalPosts, company);
        bullets.push(overallSentiment);

        // 2. Most discussed topic with SPECIFIC examples
        if (data.keyThemes.length > 0) {
            const topicBullet = this.generateSpecificTopicBullet(data, company);
            bullets.push(topicBullet);
        }

        // 3. Top bullish argument with EXACT details
        if (data.bullishPosts.length > 0) {
            const bullishBullet = this.generateDetailedBullishBullet(data, company);
            bullets.push(bullishBullet);
        }

        // 4. Top bearish concern with CONCRETE data
        if (data.bearishPosts.length > 0) {
            const bearishBullet = this.generateDetailedBearishBullet(data, company);
            bullets.push(bearishBullet);
        }

        // 5. Unique insight (options, momentum, comparison)
        const uniqueInsight = this.generateUniqueInsight(data, company);
        bullets.push(uniqueInsight);

        return bullets;
    }

    /**
     * Generate detailed sentiment bullet with specific drivers
     */
    private generateDetailedSentimentBullet(data: SentimentData, totalPosts: number, company: string): string {
        const bullishPercent = Math.round((data.bullishPosts.length / totalPosts) * 100);
        const bearishPercent = Math.round((data.bearishPosts.length / totalPosts) * 100);

        // Find the PRIMARY driver of sentiment
        const primaryDriver = this.extractPrimarySentimentDriver(data, company);

        // Calculate engagement ratio
        const bullishEngagement = data.bullishPosts.reduce((sum, p) => sum + p.score + p.num_comments, 0);
        const bearishEngagement = data.bearishPosts.reduce((sum, p) => sum + p.score + p.num_comments, 0);
        const engagementRatio = bullishEngagement / (bearishEngagement || 1);

        if (bullishPercent > bearishPercent + 10) {
            return `• ${bullishPercent}% bullish vs ${bearishPercent}% bearish across ${totalPosts} posts, primarily driven by ${primaryDriver}, with bull posts getting ${engagementRatio.toFixed(1)}x more engagement`;
        } else if (bearishPercent > bullishPercent + 10) {
            return `• ${bearishPercent}% bearish vs ${bullishPercent}% bullish sentiment, mainly due to ${primaryDriver}, though bull/bear engagement ratio is ${engagementRatio.toFixed(1)}x`;
        } else {
            return `• Split sentiment (${bullishPercent}% bullish, ${bearishPercent}% bearish) as investors debate ${primaryDriver}, with ${engagementRatio > 1 ? 'bulls' : 'bears'} more engaged`;
        }
    }

    /**
     * Extract the primary driver of current sentiment
     */
    private extractPrimarySentimentDriver(sentimentData: SentimentData, company: string): string {
        const allPosts = [...sentimentData.bullishPosts.slice(0, 10), ...sentimentData.bearishPosts.slice(0, 10)];
        const drivers = new Map<string, { count: number, example: string }>();

        const driverPatterns = [
            { pattern: /earnings.{0,20}(\d+%|beat|miss)/i, driver: 'earnings', extract: true },
            { pattern: /revenue.{0,20}(\d+%|growth|decline)/i, driver: 'revenue', extract: true },
            { pattern: /guidance.{0,20}(raised|lowered|cut)/i, driver: 'guidance', extract: true },
            { pattern: /p\/e.{0,20}(\d+)/i, driver: 'valuation', extract: true },
            { pattern: /competition|competitor|market share/i, driver: 'competition', extract: false },
            { pattern: /product|launch|innovation/i, driver: 'product', extract: false },
            { pattern: /debt|cash|balance sheet/i, driver: 'financials', extract: false }
        ];

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;

            for (const { pattern, driver, extract } of driverPatterns) {
                const match = text.match(pattern);
                if (match) {
                    if (!drivers.has(driver)) {
                        drivers.set(driver, { count: 0, example: '' });
                    }
                    const entry = drivers.get(driver)!;
                    entry.count++;

                    if (extract && match[1] && !entry.example) {
                        entry.example = match[0].trim();
                    }
                }
            }
        }

        // Get the top driver
        const topDriver = Array.from(drivers.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (!topDriver) return `${company} fundamentals`;

        const [driver, data] = topDriver;

        // Return specific driver description
        switch (driver) {
            case 'earnings':
                return data.example || 'recent earnings results';
            case 'revenue':
                return data.example || 'revenue growth trends';
            case 'guidance':
                return data.example || 'forward guidance changes';
            case 'valuation':
                return data.example || 'valuation concerns';
            case 'competition':
                return 'competitive positioning';
            case 'product':
                return 'product announcements';
            case 'financials':
                return 'balance sheet metrics';
            default:
                return 'market dynamics';
        }
    }

    /**
     * Generate specific topic bullet with concrete examples
     */
    private generateSpecificTopicBullet(data: SentimentData, company: string): string {
        // Find the most discussed topic with specific mentions
        const topicData = this.extractTopicWithDetails(data, company);

        if (!topicData.topic) {
            return `• Primary discussion theme unclear across varied ${company} posts`;
        }

        return `• ${topicData.topic} discussions center on ${topicData.specificDetail}, with ${topicData.sentiment} sentiment ${topicData.metric ? `(${topicData.metric})` : ''}`;
    }

    /**
     * Extract topic with specific details
     */
    private extractTopicWithDetails(sentimentData: SentimentData, company: string): {
        topic: string;
        specificDetail: string;
        sentiment: string;
        metric?: string;
    } {
        const allPosts = [...sentimentData.bullishPosts, ...sentimentData.bearishPosts, ...sentimentData.neutralPosts];
        const topicDetails = new Map<string, { count: number; details: string[]; sentiment: number }>();

        // Enhanced patterns to extract specific details
        const detailPatterns: Record<string, RegExp[]> = {
            'Earnings': [
                /earnings.{0,20}(\$\d+\.?\d*|\d+%)/i,
                /EPS.{0,20}(\$\d+\.?\d*)/i,
                /beat.{0,20}by.{0,20}(\d+%|\$\d+\.?\d*)/i,
                /miss.{0,20}by.{0,20}(\d+%|\$\d+\.?\d*)/i
            ],
            'Revenue': [
                /revenue.{0,20}(\$\d+\.?\d*[BMK]?|\d+%)/i,
                /sales.{0,20}(growth|decline).{0,20}(\d+%)/i,
                /YoY.{0,20}(growth|decline).{0,20}(\d+%)/i
            ],
            'Valuation': [
                /P\/E.{0,20}(\d+)/i,
                /valued.{0,20}at.{0,20}(\d+x)/i,
                /price.{0,20}target.{0,20}(\$\d+)/i,
                /market.{0,20}cap.{0,20}(\$\d+\.?\d*[BMT])/i
            ],
            'Product': [
                /(\d+[MK]?).{0,20}users/i,
                /launched.{0,20}([\w\s]+)/i,
                /new.{0,20}product.{0,20}([\w\s]+)/i
            ],
            'Competition': [
                /market.{0,20}share.{0,20}(\d+%)/i,
                /vs.{0,20}competitor.{0,20}([\w\s]+)/i,
                /losing.{0,20}to.{0,20}([\w\s]+)/i
            ]
        };

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;
            const postSentiment = sentimentData.bullishPosts.includes(post) ? 1 : sentimentData.bearishPosts.includes(post) ? -1 : 0;

            for (const [topic, patterns] of Object.entries(detailPatterns)) {
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) {
                        if (!topicDetails.has(topic)) {
                            topicDetails.set(topic, { count: 0, details: [], sentiment: 0 });
                        }
                        const entry = topicDetails.get(topic)!;
                        entry.count++;
                        entry.sentiment += postSentiment;

                        // Extract the specific detail
                        const detail = match[0].trim();
                        if (detail && entry.details.length < 5) {
                            entry.details.push(detail);
                        }
                    }
                }
            }
        }

        // Get the top topic
        const topTopic = Array.from(topicDetails.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (!topTopic) {
            return { topic: '', specificDetail: '', sentiment: 'mixed' };
        }

        const [topic, data] = topTopic;
        const sentiment = data.sentiment > 0 ? 'bullish' : data.sentiment < 0 ? 'bearish' : 'mixed';
        const specificDetail = data.details[0] || `${topic.toLowerCase()} metrics`;

        // Extract the metric from the detail
        const metricMatch = specificDetail.match(/\$?\d+\.?\d*[BMK%]?/);
        const metric = metricMatch ? metricMatch[0] : undefined;

        return {
            topic,
            specificDetail,
            sentiment,
            metric
        };
    }

    /**
     * Generate detailed bullish bullet with specific data
     */
    private generateDetailedBullishBullet(data: SentimentData, company: string): string {
        const topPost = data.bullishPosts[0];
        const specificReason = this.extractSpecificReason(data.bullishPosts.slice(0, 5), 'bullish');
        const engagement = `${topPost.score} upvotes, ${topPost.num_comments} comments`;

        if (specificReason.detail) {
            return `• Bulls highlight ${specificReason.reason}: ${specificReason.detail} (${engagement})`;
        } else {
            return `• Bulls emphasize ${specificReason.reason} for ${company} (${engagement})`;
        }
    }

    /**
     * Generate detailed bearish bullet with specific concerns
     */
    private generateDetailedBearishBullet(data: SentimentData, company: string): string {
        const topPost = data.bearishPosts[0];
        const specificReason = this.extractSpecificReason(data.bearishPosts.slice(0, 5), 'bearish');
        const engagement = `${topPost.score} upvotes, ${topPost.num_comments} comments`;

        if (specificReason.detail) {
            return `• Bears worry about ${specificReason.reason}: ${specificReason.detail} (${engagement})`;
        } else {
            return `• Bears concerned about ${specificReason.reason} for ${company} (${engagement})`;
        }
    }

    /**
     * Extract specific reason with details
     */
    private extractSpecificReason(posts: RedditPost[], sentiment: 'bullish' | 'bearish'): {
        reason: string;
        detail?: string;
    } {
        const reasons = new Map<string, { count: number; details: string[] }>();

        const reasonPatterns = sentiment === 'bullish' ? [
            { pattern: /earnings.{0,50}beat.{0,20}(\$?\d+\.?\d*|\d+%)/i, reason: 'earnings beat' },
            { pattern: /revenue.{0,50}growth.{0,20}(\d+%)/i, reason: 'revenue growth' },
            { pattern: /guidance.{0,50}raised.{0,20}(\$?\d+\.?\d*[BM]?)/i, reason: 'raised guidance' },
            { pattern: /margin.{0,50}expansion.{0,20}(\d+\.?\d*%?)/i, reason: 'margin expansion' },
            { pattern: /cash.{0,50}position.{0,20}(\$?\d+\.?\d*[BM])/i, reason: 'strong cash position' },
            { pattern: /market.{0,50}share.{0,50}gain/i, reason: 'market share gains' },
            { pattern: /new.{0,50}product.{0,50}launch/i, reason: 'product innovation' }
        ] : [
            { pattern: /earnings.{0,50}miss.{0,20}(\$?\d+\.?\d*|\d+%)/i, reason: 'earnings miss' },
            { pattern: /revenue.{0,50}decline.{0,20}(\d+%)/i, reason: 'revenue decline' },
            { pattern: /guidance.{0,50}(cut|lowered).{0,20}(\$?\d+\.?\d*[BM]?)/i, reason: 'lowered guidance' },
            { pattern: /margin.{0,50}compression.{0,20}(\d+\.?\d*%?)/i, reason: 'margin pressure' },
            { pattern: /debt.{0,50}concern.{0,20}(\$?\d+\.?\d*[BM])/i, reason: 'debt levels' },
            { pattern: /competition.{0,50}pressure/i, reason: 'competitive threats' },
            { pattern: /valuation.{0,50}(high|expensive)/i, reason: 'valuation concerns' }
        ];

        for (const post of posts) {
            const text = `${post.title} ${post.selftext}`;

            for (const { pattern, reason } of reasonPatterns) {
                const match = text.match(pattern);
                if (match) {
                    if (!reasons.has(reason)) {
                        reasons.set(reason, { count: 0, details: [] });
                    }
                    const entry = reasons.get(reason)!;
                    entry.count++;

                    // Extract the full context
                    const fullMatch = match[0];
                    const numberMatch = fullMatch.match(/\$?\d+\.?\d*[BMK%]?/);
                    if (numberMatch) {
                        entry.details.push(fullMatch);
                    }
                }
            }
        }

        // Get top reason
        const topReason = Array.from(reasons.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (!topReason) {
            return { reason: sentiment === 'bullish' ? 'positive fundamentals' : 'risk factors' };
        }

        const [reason, data] = topReason;
        const detail = data.details[0];

        return { reason, detail };
    }

    /**
     * Generate unique insight bullet
     */
    private generateUniqueInsight(data: SentimentData, company: string): string {
        // Try different unique insights in order

        // 1. Unusual option activity
        const optionInsight = this.extractOptionInsight(data);
        if (optionInsight) return optionInsight;

        // 2. Comparison to competitors
        const comparisonInsight = this.extractComparisonInsight(data, company);
        if (comparisonInsight) return comparisonInsight;

        // 3. Technical analysis mentions
        const technicalInsight = this.extractTechnicalInsight(data);
        if (technicalInsight) return technicalInsight;

        // 4. Institutional activity mentions
        const institutionalInsight = this.extractInstitutionalInsight(data);
        if (institutionalInsight) return institutionalInsight;

        // 5. Default to momentum insight
        return this.extractMomentumInsight(data, company);
    }

    /**
     * Extract option activity insight
     */
    private extractOptionInsight(data: SentimentData): string {
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];
        let callMentions = 0;
        let putMentions = 0;
        const strikeDetails: string[] = [];

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;

            // Look for specific option mentions
            const callMatch = text.match(/(\$\d+)\s*calls?/i);
            const putMatch = text.match(/(\$\d+)\s*puts?/i);

            if (callMatch) {
                callMentions++;
                strikeDetails.push(`${callMatch[1]} calls`);
            }
            if (putMatch) {
                putMentions++;
                strikeDetails.push(`${putMatch[1]} puts`);
            }

            // Look for option flow
            const flowMatch = text.match(/option\s*flow.{0,50}(\$?\d+[MK])/i);
            if (flowMatch) {
                strikeDetails.push(`${flowMatch[1]} in option flow`);
            }
        }

        if (callMentions + putMentions >= 5) {
            const ratio = callMentions / (putMentions || 1);
            const detail = strikeDetails[0] || 'various strikes';

            if (ratio > 2) {
                return `• Heavy call activity (${callMentions}:${putMentions} ratio) with focus on ${detail} suggesting bullish positioning`;
            } else if (ratio < 0.5) {
                return `• Put buying dominating (${putMentions}:${callMentions} ratio) particularly ${detail} indicating hedging`;
            } else {
                return `• Mixed option activity (${callMentions} calls, ${putMentions} puts) with ${detail} showing uncertainty`;
            }
        }

        return '';
    }

    /**
     * Extract comparison insight
     */
    private extractComparisonInsight(data: SentimentData, company: string): string {
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];
        const comparisons = new Map<string, { count: number; context: string }>();

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;

            // Look for competitor mentions
            const compPattern = /vs\.?\s*([\w]+)|compared\s*to\s*([\w]+)|versus\s*([\w]+)/i;
            const match = text.match(compPattern);

            if (match) {
                const competitor = match[1] || match[2] || match[3];
                if (competitor && competitor.length > 2) {
                    if (!comparisons.has(competitor)) {
                        comparisons.set(competitor, { count: 0, context: '' });
                    }
                    const entry = comparisons.get(competitor)!;
                    entry.count++;

                    // Extract context
                    const contextMatch = text.match(new RegExp(`${competitor}.{0,100}`, 'i'));
                    if (contextMatch && !entry.context) {
                        entry.context = contextMatch[0];
                    }
                }
            }
        }

        const topComparison = Array.from(comparisons.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (topComparison) {
            const [competitor, data] = topComparison;
            return `• Frequent comparisons to ${competitor} (${data.count} mentions) with investors debating relative positioning`;
        }

        return '';
    }

    /**
     * Extract technical analysis insight
     */
    private extractTechnicalInsight(data: SentimentData): string {
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];
        const technicals = new Map<string, { count: number; level: string }>();

        const patterns = [
            { pattern: /support\s*(?:at\s*)?\$?(\d+)/i, type: 'support' },
            { pattern: /resistance\s*(?:at\s*)?\$?(\d+)/i, type: 'resistance' },
            { pattern: /(\d+)\s*day\s*moving\s*average/i, type: 'MA' },
            { pattern: /target\s*(?:price\s*)?\$?(\d+)/i, type: 'target' }
        ];

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;

            for (const { pattern, type } of patterns) {
                const match = text.match(pattern);
                if (match) {
                    if (!technicals.has(type)) {
                        technicals.set(type, { count: 0, level: match[1] });
                    }
                    const entry = technicals.get(type)!;
                    entry.count++;
                }
            }
        }

        const topTechnical = Array.from(technicals.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (topTechnical) {
            const [type, data] = topTechnical;

            switch (type) {
                case 'support':
                    return `• Technical traders watching ${data.level} support level (${data.count} mentions)`;
                case 'resistance':
                    return `• Key resistance at ${data.level} being discussed by ${data.count} traders`;
                case 'target':
                    return `• Price targets clustering around ${data.level} (${data.count} mentions)`;
                default:
                    return `• Technical analysis focusing on ${data.level}-day moving average`;
            }
        }

        return '';
    }

    /**
     * Extract institutional activity insight
     */
    private extractInstitutionalInsight(data: SentimentData): string {
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];
        const institutions = new Map<string, { count: number; action: string }>();

        const patterns = [
            { pattern: /([\w\s]+)\s*(?:bought|purchased|acquired)\s*(\d+[MK]?)?\s*shares/i, action: 'buying' },
            { pattern: /([\w\s]+)\s*(?:sold|dumped|reduced)\s*(\d+[MK]?)?\s*shares/i, action: 'selling' },
            { pattern: /insider\s*(?:buying|selling)/i, action: 'insider activity' },
            { pattern: /institutional\s*(?:buying|selling)/i, action: 'institutional flow' }
        ];

        for (const post of allPosts) {
            const text = `${post.title} ${post.selftext}`;

            for (const { pattern, action } of patterns) {
                const match = text.match(pattern);
                if (match) {
                    const institution = match[1] || action;
                    if (!institutions.has(institution)) {
                        institutions.set(institution, { count: 0, action });
                    }
                    institutions.get(institution)!.count++;
                }
            }
        }

        const topInstitution = Array.from(institutions.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];

        if (topInstitution) {
            const [institution, data] = topInstitution;
            return `• ${institution} activity (${data.action}) generating ${data.count} discussions`;
        }

        return '';
    }

    /**
     * Default momentum insight
     */
    private extractMomentumInsight(data: SentimentData, company: string): string {
        const now = Date.now() / 1000;
        const dayAgo = now - (24 * 60 * 60);
        const weekAgo = now - (7 * 24 * 60 * 60);

        const recentPosts = [...data.bullishPosts, ...data.bearishPosts].filter(p => p.created_utc > dayAgo);
        const weekPosts = [...data.bullishPosts, ...data.bearishPosts].filter(p => p.created_utc > weekAgo);

        if (recentPosts.length >= 5) {
            const recentEngagement = recentPosts.reduce((sum, p) => sum + p.score + p.num_comments, 0);
            const avgEngagement = Math.round(recentEngagement / recentPosts.length);

            const recentBullishPercent = recentPosts.filter(p => data.bullishPosts.includes(p)).length / recentPosts.length;

            if (recentBullishPercent > 0.7) {
                return `• Momentum building with ${recentPosts.length} posts in 24hrs (avg ${avgEngagement} engagement), ${Math.round(recentBullishPercent * 100)}% bullish`;
            } else if (recentBullishPercent < 0.3) {
                return `• Negative momentum with ${recentPosts.length} posts today, ${Math.round((1 - recentBullishPercent) * 100)}% bearish`;
            }
        }

        // Fallback to volume comparison
        const volumeRatio = weekPosts.length / 7; // Posts per day
        return `• ${company} averaging ${volumeRatio.toFixed(1)} posts/day this week, ${volumeRatio > 5 ? 'high' : volumeRatio > 2 ? 'moderate' : 'low'} retail interest`;
    }

    /**
     * Search for company mentions with engagement filtering
     */
    async searchCompany(company: string, subreddits: string[] = ['stocks', 'wallstreetbets', 'investing']): Promise<RedditPost[]> {
        const sentimentData = await this.gatherCompanyData(company);
        const allPosts = [...sentimentData.bullishPosts, ...sentimentData.bearishPosts, ...sentimentData.neutralPosts];

        // Filter to requested subreddits if specified
        const filteredPosts = allPosts.filter(post => subreddits.includes(post.subreddit));

        // Sort by engagement (score + comments)
        return filteredPosts
            .sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments))
            .slice(0, 10);
    }

    /**
     * Format Reddit data for narrative display
     */
    formatForNarrative(posts: RedditPost[], company: string): string[] {
        return posts.slice(0, 5).map(post => {
            const sentiment = this.analyzePostSentiment(post, company);
            const sentimentLabel = sentiment.score > 1 ? 'Bullish' : sentiment.score < -1 ? 'Bearish' : 'Neutral';
            const engagement = `${post.score} upvotes, ${post.num_comments} comments`;

            // Extract key opinion
            const opinion = this.extractKeyOpinion(post, company);

            return `• ${sentimentLabel} on r/${post.subreddit} (${engagement}) - ${opinion} [Source](${post.permalink})`;
        });
    }

    /**
     * Extract key opinion from post
     */
    private extractKeyOpinion(post: RedditPost, company: string): string {
        const text = `${post.title} ${post.selftext}`;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const companyLower = company.toLowerCase();

        // Look for sentences with opinions and data
        for (const sentence of sentences) {
            const sentLower = sentence.toLowerCase();

            // Check if sentence contains company and opinion indicators
            if (sentLower.includes(companyLower)) {
                // Look for specific data points
                const dataMatch = sentence.match(/\d+%|\$\d+[BM]?|\d+x/);
                if (dataMatch) {
                    return sentence.trim().slice(0, 150) + (sentence.length > 150 ? '...' : '');
                }

                // Look for opinion indicators
                const opinionIndicators = ['because', 'due to', 'expect', 'believe', 'shows', 'indicates'];
                if (opinionIndicators.some(indicator => sentLower.includes(indicator))) {
                    return sentence.trim().slice(0, 150) + (sentence.length > 150 ? '...' : '');
                }
            }
        }

        // Fallback to title
        return post.title.length > 100 ? post.title.slice(0, 100) + '...' : post.title;
    }

    /**
     * Get top comments from a post
     */
    async getComments(postId: string): Promise<RedditComment[]> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(
                `https://oauth.reddit.com/comments/${postId}.json?sort=best&limit=10`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'NarrativeCheck/1.0'
                    }
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch comments: ${response.status}`);
                return [];
            }

            const data = await response.json();

            // The second element contains the comments
            if (!data[1] || !data[1].data || !data[1].data.children) {
                return [];
            }

            const comments = data[1].data.children
                .filter((child: any) => child.kind === 't1' && child.data.score > 0)
                .map((child: any) => ({
                    body: child.data.body,
                    score: child.data.score,
                    permalink: `https://reddit.com${child.data.permalink}`,
                    created_utc: child.data.created_utc
                }))
                .sort((a: RedditComment, b: RedditComment) => b.score - a.score)
                .slice(0, 5);

            return comments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    /**
     * Extract specific mention from text
     */
    private extractSpecificMention(text: string, theme: string): string {
        // Look for sentences with numbers or specific details
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(theme.toLowerCase())) {
                // Extract numbers or specific metrics
                const numberMatch = sentence.match(/\d+%|\$\d+[BM]?|\d+x|\d+\s*(billion|million)/i);
                if (numberMatch) {
                    const context = sentence.trim().slice(0, 100);
                    return `${context}${context.length > 100 ? '...' : ''}`;
                }
            }
        }

        return '';
    }

    /**
     * Get trending topics for a company
     */
    async getTrendingTopics(company: string): Promise<string[]> {
        const data = await this.gatherCompanyData(company);
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];

        // Extract topics from recent posts (last 7 days)
        const recentPosts = allPosts.filter(p => {
            const daysSincePost = (Date.now() / 1000 - p.created_utc) / (24 * 60 * 60);
            return daysSincePost <= 7;
        });

        const topics = new Map<string, number>();

        recentPosts.forEach(post => {
            const text = `${post.title} ${post.selftext}`.toLowerCase();

            // Topic patterns
            const topicPatterns = [
                { pattern: /earnings|eps|revenue|guidance/i, topic: 'Earnings' },
                { pattern: /product|launch|announcement|release/i, topic: 'Product News' },
                { pattern: /merger|acquisition|buyout|deal/i, topic: 'M&A Activity' },
                { pattern: /fda|approval|trial|drug/i, topic: 'Regulatory News' },
                { pattern: /layoff|restructure|cost.cutting/i, topic: 'Restructuring' },
                { pattern: /dividend|buyback|share.repurchase/i, topic: 'Capital Return' },
                { pattern: /lawsuit|investigation|sec/i, topic: 'Legal Issues' },
                { pattern: /partnership|collaboration|joint/i, topic: 'Partnerships' },
                { pattern: /guidance|forecast|outlook/i, topic: 'Forward Guidance' },
                { pattern: /analyst|upgrade|downgrade|price.target/i, topic: 'Analyst Actions' }
            ];

            topicPatterns.forEach(({ pattern, topic }) => {
                if (pattern.test(text)) {
                    topics.set(topic, (topics.get(topic) || 0) + 1);
                }
            });
        });

        // Sort by frequency and return top topics
        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
    }

    /**
     * Get retail investor metrics
     */
    async getRetailMetrics(company: string): Promise<{
        totalPosts: number;
        totalEngagement: number;
        averageScore: number;
        sentimentBreakdown: { bullish: number; bearish: number; neutral: number };
        topSubreddits: string[];
        weeklyTrend: string;
    }> {
        const data = await this.gatherCompanyData(company);
        const allPosts = [...data.bullishPosts, ...data.bearishPosts, ...data.neutralPosts];

        const totalPosts = allPosts.length;
        const totalEngagement = allPosts.reduce((sum, post) => sum + post.score + post.num_comments, 0);
        const averageScore = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

        const sentimentBreakdown = {
            bullish: Math.round((data.bullishPosts.length / totalPosts) * 100) || 0,
            bearish: Math.round((data.bearishPosts.length / totalPosts) * 100) || 0,
            neutral: Math.round((data.neutralPosts.length / totalPosts) * 100) || 0
        };

        // Get top subreddits
        const subredditCounts = new Map<string, number>();
        allPosts.forEach(post => {
            subredditCounts.set(post.subreddit, (subredditCounts.get(post.subreddit) || 0) + 1);
        });

        const topSubreddits = Array.from(subredditCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([subreddit]) => subreddit);

        // Weekly trend
        const weeklyTrend = this.calculateWeeklyTrend(allPosts);

        return {
            totalPosts,
            totalEngagement,
            averageScore,
            sentimentBreakdown,
            topSubreddits,
            weeklyTrend
        };
    }

    /**
     * Calculate weekly trend
     */
    private calculateWeeklyTrend(posts: RedditPost[]): string {
        const now = Date.now() / 1000;
        const weekAgo = now - (7 * 24 * 60 * 60);
        const twoWeeksAgo = now - (14 * 24 * 60 * 60);

        const thisWeek = posts.filter(p => p.created_utc > weekAgo).length;
        const lastWeek = posts.filter(p => p.created_utc > twoWeeksAgo && p.created_utc <= weekAgo).length;

        if (thisWeek === 0 || lastWeek === 0) return 'stable';

        const changePercent = ((thisWeek - lastWeek) / lastWeek) * 100;

        if (changePercent > 50) return 'surging';
        if (changePercent > 20) return 'increasing';
        if (changePercent < -50) return 'declining sharply';
        if (changePercent < -20) return 'decreasing';

        return 'stable';
    }
}

// Create singleton instance
const redditClient = new RedditClient(
    process.env.REDDIT_CLIENT_ID || '',
    process.env.REDDIT_CLIENT_SECRET || ''
);

// Export the class, instance, and types
export { RedditClient, redditClient };
export type { RedditPost, RedditComment, SentimentData };

// Example usage:
/*
// Get comprehensive company data
const sentimentData = await redditClient.gatherCompanyData('TSLA');
const narrative = redditClient.generateNarrative(sentimentData, 'TSLA');

// Get specific subreddit posts
const posts = await redditClient.searchCompany('AAPL', ['wallstreetbets', 'stocks']);
const formattedNarrative = redditClient.formatForNarrative(posts, 'AAPL');

// Get trending topics
const topics = await redditClient.getTrendingTopics('NVDA');

// Get retail metrics
const metrics = await redditClient.getRetailMetrics('GOOGL');
*/