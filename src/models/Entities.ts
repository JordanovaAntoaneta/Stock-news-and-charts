interface HighlightsInterface {
    highlight: string,
    sentiment: number,
    highlighted_in: string
}

export interface EntitiesInterface {
    symbol: string,
    name: string,
    exchange: null,
    exchange_long: null,
    country: string,
    type: string,
    industry: string,
    match_score: number,
    sentiment_score: number,
    highlights: HighlightsInterface[]
};
