export interface Root {
    chart: Chart
}

export interface Chart {
    result: Result[]
    error: any
}

export interface Result {
    meta: Meta
    timestamp: number[]
    events: Events
    indicators: Indicators
}

export interface Meta {
    currency: string
    symbol: string
    exchangeName: string
    fullExchangeName: string
    instrumentType: string
    firstTradeDate: number
    regularMarketTime: number
    hasPrePostMarketData: boolean
    gmtoffset: number
    timezone: string
    exchangeTimezoneName: string
    regularMarketPrice: number
    fiftyTwoWeekHigh: number
    fiftyTwoWeekLow: number
    regularMarketDayHigh: number
    regularMarketDayLow: number
    regularMarketVolume: number
    longName: string
    shortName: string
    chartPreviousClose: number
    previousClose: number
    scale: number
    priceHint: number
    currentTradingPeriod: CurrentTradingPeriod
    tradingPeriods: TradingPeriods
    dataGranularity: string
    range: string
    validRanges: string[]
}

export interface CurrentTradingPeriod {
    pre: Pre
    regular: Regular
    post: Post
}

export interface Pre {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface Regular {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface Post {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface TradingPeriods {
    pre: Pre2[][]
    post: Post2[][]
    regular: Regular2[][]
}

export interface Pre2 {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface Post2 {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface Regular2 {
    timezone: string
    end: number
    start: number
    gmtoffset: number
}

export interface Events {
    dividends: Dividends
}

export interface Dividends {
    "1723469400": N1723469400
}

export interface N1723469400 {
    amount: number
    date: number
}

export interface Indicators {
    quote: QuoteChart[]
}

export interface QuoteChart {
    volume: number[]
    close: number[]
    low: number[]
    open: number[]
    high: number[]
}
