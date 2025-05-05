# Narrative Check

A Next.js application that analyzes media narratives and financial realities for companies and stocks using the Perplexity Sonar API.

## Features

-   **Real-time streaming** of AI-generated media narratives
-   **Financial reality extraction** from SEC filings, earnings calls, and reports
-   **Narrative vs Reality comparison** with divergence score
-   **Token-by-token updates** as content is generated
-   **Edge API routes** for optimal performance
-   **Dark mode design** inspired by Perplexity

## Tech Stack

-   [Next.js 15](https://nextjs.org/) with App Router
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [SWR](https://swr.vercel.app/) for data fetching
-   [Perplexity Sonar API](https://docs.perplexity.ai/) for AI search & analysis
-   [Lucide React](https://lucide.dev/) for icons

## Getting Started

### Prerequisites

-   Node.js 18.17 or later
-   Perplexity API key (get one at [perplexity.ai](https://www.perplexity.ai/))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/narrative-check.git
cd narrative-check
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Create a `.env.local` file in the root directory with your Perplexity API key:

```
PERPLEXITY_API_KEY=your-api-key-here
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting

### API Connection Issues

If you encounter errors related to the Perplexity API:

1. **Check your API key**: Make sure your `.env.local` file contains the correct `PERPLEXITY_API_KEY`
2. **Verify API connection**: In development mode, click the "+" button in the bottom-left corner to open the debugging panel
3. **Check for rate limits**: Perplexity API has usage limits based on your plan
4. **API errors in console**: Look for detailed error messages in the browser console or server logs

### Common Error Messages

-   `"Perplexity API error (401)"`: Invalid or missing API key
-   `"Perplexity API error (429)"`: Rate limit exceeded
-   `"Perplexity API error (404)"`: Endpoint not found or incorrectly configured

## Project Structure

```
├── app/
│   ├── api/                     # API routes
│   │   ├── debug/
│   │   │   └── route.ts         # API connection diagnostics
│   │   ├── financial/
│   │   │   └── route.ts         # Financial reality endpoint
│   │   ├── narrative/
│   │   │   ├── route.ts         # Regular narrative endpoint
│   │   │   └── stream/
│   │   │       └── route.ts     # Streaming endpoint
│   │   └── envCheck.ts          # Environment validation
│   ├── components/              # UI components
│   │   ├── ApiDebug.tsx         # Debug component
│   │   ├── FinancialRealityCard.tsx     # Financial data display
│   │   ├── FinancialRealitySkeleton.tsx # Loading skeleton for financial data
│   │   ├── FinancialRealityView.tsx     # Financial reality container
│   │   ├── NarrativeCard.tsx            # Media narrative display
│   │   ├── NarrativeFinancialComparison.tsx # Comparison component
│   │   ├── NarrativeSkeleton.tsx        # Loading skeleton for narratives
│   │   ├── NarrativeStreamView.tsx      # Main view component
│   │   └── PopularCompanies.tsx         # Quick selection buttons
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── lib/                         # Utility functions
│   ├── sonar.ts                 # Media narrative API helpers
│   ├── sonarConfig.ts           # API configuration
│   ├── sonarFinancial.ts        # Financial reality API helpers
│   ├── useFinancialReality.ts   # Financial data hook
│   ├── useNarrative.ts          # Regular narrative hook
│   └── useNarrativeStream.ts    # Streaming narrative hook
├── types/                       # TypeScript definitions
│   └── perplexity.ts            # Sonar API types
└── ...
```

## Implementation Details

### Financial Reality Extraction

The Financial Reality feature extracts key financial information from official sources using Perplexity's Sonar API:

1. **Data Collection** (`lib/sonarFinancial.ts`):

    - Uses domain filtering to focus on SEC filings, company websites, and reliable financial sources
    - Extracts fundamentals, risks, and trends from recent financial data
    - Returns structured financial data in JSON format

2. **Data Presentation** (`app/components/FinancialRealityCard.tsx`):

    - Tabbed interface for viewing different aspects of financial data
    - Color-coded sections for fundamentals (blue), risks (red), and trends (green)
    - Citations to source documents (10-K, 10-Q, earnings calls)

3. **Domain Filtering**:
    - Focuses on authoritative financial sources like sec.gov
    - Restricts to recent filings (last 365 days)
    - Falls back to financial news sources when official filings are unavailable

### Narrative vs Reality Comparison

The comparison feature analyzes the divergence between media narratives and financial reality:

1. **Divergence Calculation** (`app/components/NarrativeFinancialComparison.tsx`):

    - Semantic analysis of tone and content in both datasets
    - Keyword matching for sentiment indicators (positive/negative terms)
    - Calculation of divergence score (0-100 scale)

2. **Visualization**:

    - Color-coded divergence meter (green = aligned, yellow = moderate divergence, red = high divergence)
    - Key observation bullets highlighting specific areas of misalignment
    - Summary of overall relationship between media portrayal and financial reality

3. **Divergence Score**:
    - Low (0-30): Media narratives generally align with financial realities
    - Medium (30-60): Some notable differences between media portrayal and financial data
    - High (60-100): Significant divergence, indicating potential information asymmetry

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com), but can be deployed on any platform that supports Next.js.

1. Push your code to GitHub
2. Import the project into Vercel
3. Add the `PERPLEXITY_API_KEY` as an environment variable
4. Deploy!

## What's Next

Future enhancements could include:

-   Caching popular company analyses
-   Timeline visualization of sentiment trends over time
-   ESG (Environmental, Social, Governance) factors analysis
-   Financial metrics visualization (charts and graphs)
-   Multi-company comparison for competitive analysis
-   Export capabilities for reports and presentations
    │ │ # Narrative Check

A Next.js application that analyzes media narratives for companies and stocks in real-time using the Perplexity Sonar API.

## Features

-   **Real-time streaming** of AI-generated narratives
-   **Token-by-token updates** as content is generated
-   **Edge API routes** for optimal performance
-   **Dark mode design** inspired by Perplexity
-   Responsive design with **Tailwind CSS**

## Tech Stack

-   [Next.js 15](https://nextjs.org/) with App Router
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [SWR](https://swr.vercel.app/) for data fetching
-   [Perplexity Sonar API](https://docs.perplexity.ai/) for AI search & analysis
-   [Lucide React](https://lucide.dev/) for icons

## Getting Started

### Prerequisites

-   Node.js 18.17 or later
-   Perplexity API key (get one at [perplexity.ai](https://www.perplexity.ai/))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/narrative-check.git
cd narrative-check
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Create a `.env.local` file in the root directory with your Perplexity API key:

```
PERPLEXITY_API_KEY=your-api-key-here
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting

### API Connection Issues

If you encounter errors related to the Perplexity API:

1. **Check your API key**: Make sure your `.env.local` file contains the correct `PERPLEXITY_API_KEY`
2. **Verify API connection**: In development mode, click the "+" button in the bottom-left corner to open the debugging panel
3. **Check for rate limits**: Perplexity API has usage limits based on your plan
4. **API errors in console**: Look for detailed error messages in the browser console or server logs

### Common Error Messages

-   `"Perplexity API error (401)"`: Invalid or missing API key
-   `"Perplexity API error (429)"`: Rate limit exceeded
-   `"Perplexity API error (404)"`: Endpoint not found or incorrectly configured

## Project Structure

```
├── app/
│   ├── api/                     # API routes
│   │   ├── debug/
│   │   │   └── route.ts         # API connection diagnostics
│   │   ├── narrative/
│   │   │   ├── route.ts         # Regular API endpoint
│   │   │   └── stream/
│   │   │       └── route.ts     # Streaming endpoint
│   │   └── envCheck.ts          # Environment validation
│   ├── components/              # UI components
│   │   ├── ApiDebug.tsx         # Debug component
│   │   ├── NarrativeCard.tsx    # Completed narratives display
│   │   ├── NarrativeStreamView.tsx  # Main streaming component
│   │   ├── NarrativeSkeleton.tsx  # Loading skeleton
│   │   └── PopularCompanies.tsx # Quick selection buttons
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── lib/                         # Utility functions
│   ├── sonar.ts                 # Perplexity API helpers
│   ├── sonarConfig.ts           # API configuration
│   ├── useNarrative.ts          # SWR hook
│   └── useNarrativeStream.ts    # Streaming hook
├── types/                       # TypeScript definitions
│   └── perplexity.ts            # Sonar API types
└── ...
```

## Implementation Details

### Streaming Architecture

1. **Edge API Route** (`app/api/narrative/stream/route.ts`):

    - Receives company/ticker parameter
    - Makes request to Perplexity Sonar API with `stream: true`
    - Pipes the streaming response directly to the client

2. **Client-Side Streaming Hook** (`lib/useNarrativeStream.ts`):

    - Manages the SSE (Server-Sent Events) connection
    - Parses incoming chunks in real-time
    - Maintains state for content, loading, and errors

3. **UI Components**:
    - `NarrativeStreamView`: Main component that displays streaming content
    - `NarrativeCard`: Polished display of completed narratives
    - `NarrativeSkeleton`: Loading state placeholder
    - `PopularCompanies`: Quick selection of common stocks

### API Response Processing

The Perplexity Sonar API streams chunks in a format similar to OpenAI's streaming format:

```
data: {"id":"...", "choices":[{"delta":{"content":"T"}, "index":0}]}
data: {"id":"...", "choices":[{"delta":{"content":"e"}, "index":0}]}
data: {"id":"...", "choices":[{"delta":{"content":"s"}, "index":0}]}
data: {"id":"...", "choices":[{"delta":{"content":"l"}, "index":0}]}
data: {"id":"...", "choices":[{"delta":{"content":"a"}, "index":0}]}
...
```

Our implementation:

1. Collects these chunks
2. Accumulates the content
3. Formats them into bullet points dynamically as they arrive

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com), but can be deployed on any platform that supports Next.js.

1. Push your code to GitHub
2. Import the project into Vercel
3. Add the `PERPLEXITY_API_KEY` as an environment variable
4. Deploy!

## What's Next

Future enhancements could include:

-   Caching popular company analyses
-   Financial reality comparison (Feature #3)
-   Divergence score calculation (Feature #4)
-   Timeline visualization of sentiment trends
-   Competitor comparison
