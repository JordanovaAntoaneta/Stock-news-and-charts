
import { Box, Button, Card, CardActions, CardContent, CardMedia, FormControl, ListItemText, Menu, MenuItem, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Masonry } from '@mui/lab';
import { FaSearch } from "react-icons/fa";
import { Quote } from '../models/Quotes';
import { CompaniesData } from '../models/CompaniesData';
import { DataInterface } from '../models/News';
import { Root } from '../models/ChartInterface';
import { Line } from "react-chartjs-2";
import zoomPlugin from 'chartjs-plugin-zoom';
import { CategoryScale, Chart, ChartOptions, Legend, LinearScale, LineElement, Title, Tooltip, PointElement, Filler, Plugin, ChartTypeRegistry, Point, BubbleDataPoint } from 'chart.js';
import utc from 'dayjs/plugin/utc';
import { AnyObject, EmptyObject } from 'chart.js/dist/types/basic';

dayjs.extend(utc);

Chart.register(CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement, zoomPlugin, Filler);

const chartOptions: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    responsive: true,
    hover: {
        mode: 'index',
        intersect: false
    },
    scales: {
        x: {
            title: {
                text: 'Date',
                display: true
            }
        },
        y: {
            title: {
                text: 'Dollars',
                display: true
            }
        }
    },
    plugins: {
        title: {
            display: false,
        },
        zoom: {
            zoom: {
                wheel: {
                    enabled: true
                },
                mode: "x",
            },
            pan: {
                enabled: true,
                mode: "x",
            }
        },
    },

};

async function sha256(message: string) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await window.crypto.subtle.digest("SHA-1", msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}

function toHours(seconds: number) {
    return seconds / 3600;
}

const gmtoffset = toHours(-14400);

const CompanyCard: React.FC = () => {
    const [data, setData] = useState<CompaniesData[]>([]);
    const [filteredData, setFilteredData] = useState<CompaniesData[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [query, setQuery] = useState("");
    const [quotes, setQuotes] = useState<Array<Quote>>([]);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [isSearchListOpen, setSearchListOpen] = useState(false);
    const [company, setCompany] = useState<Quote | undefined>();
    const [symbol, setSymbol] = useState<string | undefined>();
    const [charts, setCharts] = useState<{ [key: string]: React.ReactNode | undefined }>({ "aa": undefined });

    useEffect(() => {
        data.forEach(card => {
            const cardTime = dayjs(card.published_at).add(gmtoffset, 'hour').set("second", 0);
            console.log('ORIGINAL TIME: ', dayjs.utc(card.published_at).set("second", 0).format("DD.MM.YYYY HH:mm"))
            console.log("CARD TIME: ", cardTime.format("DD.MM.YYYY HH:mm"));
            const startTimestamp = cardTime.subtract(2, "hour").unix();
            let endTimestamp = cardTime.add(2, "hour").unix();
            const nowTimestamp = dayjs().subtract(5, "minute").toDate().getTime();
            endTimestamp = Math.min(endTimestamp, nowTimestamp);

            console.log('START: ', startTimestamp)
            console.log('END: ', endTimestamp)

            fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1m&includePrePost=true&events=div|split|earn&=&lang=en-US&region=US`)
                .then(response => response.json())
                .then((result: Root) => {
                    const res = result.chart.result[0];

                    const chartData = {
                        labels: res.timestamp.map(stamp => {
                            return dayjs(stamp * 1000).format("DD.MM.YYYY HH:mm");
                        }),
                        datasets: [{
                            label: '',
                            data: res.indicators.quote[0].close,
                            fill: true,
                            borderColor: 'rgb(75, 192, 192)',
                        }]
                    };

                    const plugins: Plugin[] = [
                        {
                            id: 'arbitraryLine',
                            afterDraw: function (chart: Chart<keyof ChartTypeRegistry, (number | Point | [number, number] | BubbleDataPoint | null)[], unknown>, args: EmptyObject, options: AnyObject) {

                                const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;

                                if (!chart.data.labels) return;

                                const pubDate = dayjs(card.published_at).add(gmtoffset, 'hour').set("second", 0).format("DD.MM.YYYY HH:mm");

                                if (chart.data.labels !== undefined) {
                                    const index = chart.data.labels.findIndex((label: string | unknown) => {
                                        return label === pubDate;
                                    })

                                    if (index != -1) {
                                        const xPosition = x.getPixelForValue(index);

                                        ctx.save();
                                        ctx.lineWidth = 3;
                                        ctx.strokeStyle = '#6082B6';
                                        ctx.beginPath();
                                        ctx.moveTo(xPosition, top);
                                        ctx.lineTo(xPosition, bottom);
                                        ctx.stroke();
                                        ctx.restore();
                                    }
                                }
                                else console.log('LABELS IS UNDEFINED');

                            }
                        }
                    ]

                    setCharts(old => {
                        return {
                            ...old,
                            [card.uuid]: (
                                <div className='scnd-div'>
                                    <div className="chart-container">
                                        <Line
                                            className='chart'
                                            data={chartData}
                                            options={chartOptions}
                                            plugins={plugins}
                                        />
                                    </div >
                                </div>
                            )
                        }
                    })
                })
                .catch(error => {
                    console.error(error);
                    return undefined;
                });

        })
    }, [data])

    const openSearchList = () => {
        setSearchListOpen(true);
    };

    const closeSearchList = () => {
        setSearchListOpen(false);
    };

    const handleDateChange = (type: 'start' | 'end') => (event: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = event.target.value as string;
        if (type === 'start') {
            setStartDate(dateValue);
        } else {
            setEndDate(dateValue);
        }
    };

    const setSelectedCompany = (val: Quote | null) => {
        setCompany(val || undefined);
        setSymbol(val?.symbol);
        setSearchListOpen(false);
    };

    const fetchNewsForCompany = () => {
        if (company) {
            const startDateTemp = dayjs(startDate).format("YYYY-MM-DD");
            const endDateTemp = dayjs(endDate).format("YYYY-MM-DD");
            const storageKey = `${company.symbol}-${startDateTemp}-${endDateTemp}`;

            sha256(storageKey)
                .then(result => {
                    const cachedQuotesString = window.localStorage.getItem(result);

                    if (!cachedQuotesString) {
                        fetch(`https://api.marketaux.com/v1/news/all?symbols=${company.symbol}&published_after=${startDateTemp}&published_before=${endDateTemp}&filter_entities=true&language=en&api_token=vkrk41B7JFmnpwi1ipKFjr7Cv3VudgqRWL0Honw6`)
                            .then(response => response.json())
                            .then((data: DataInterface) => {
                                console.log('Fetched news:', data);
                                setData(data.data);
                                setFilteredData(data.data);

                                window.localStorage.setItem(result, JSON.stringify(data.data));
                            })
                            .catch(error => {
                                console.error(error);
                            });
                    } else {
                        const cachedQuotes = JSON.parse(cachedQuotesString);
                        setData(cachedQuotes);
                        setFilteredData(cachedQuotes);
                        setSearchListOpen(false);
                    }
                })
        }
    }



    const handleSearch = () => {
        fetch(`https://corsproxy.io/?https://query2.finance.yahoo.com/v1/finance/search?q=${query}&lang=en-US&region=US&quotesCount=6&newsCount=3&listsCount=2&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true&enableResearchReports=true&enableCulturalAssets=true&enableLogoUrl=true&uiConfig=[object Object]&searchConfig=[object Object]&recommendCount=5`)
            .then(res => res.json())
            .then(result => {
                if (result) {
                    setQuotes(result.quotes.filter((quote: Quote) => quote.isYahooFinance));
                    openSearchList();
                }
            })
            .catch(error => {
                console.error(error);
            });
    };

    const calculateSentiment = (post: CompaniesData) => {
        const entitiesForCompany = post.entities.filter(ent => ent.symbol === company?.symbol);
        return entitiesForCompany.reduce((prev, current) => prev + current.sentiment_score, 0) / entitiesForCompany.length;
    };

    const colorNewsTitles = (card: CompaniesData) => {
        let sentiment = calculateSentiment(card);
        if (sentiment < 0.3) {
            return "error"
        } else if (sentiment > 0.7) {
            return "green"
        } else {
            return "initial"
        }
    }

    return (
        <Box sx={{ width: '80%', margin: 'auto' }}>
            <Box style={{ width: "100%", display: 'flex', marginTop: '10px' }}>
                <TextField
                    fullWidth
                    className="search"
                    variant="outlined"
                    placeholder='Search...'
                    InputProps={{
                        type: 'search',
                    }}
                    inputRef={inputRef}
                    onBlur={(event) => {
                        setQuery(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.code === "Enter") {
                            handleSearch();
                            setSearchListOpen(true);
                        }
                    }}
                />

                <Button
                    onClick={handleSearch}
                    className="button"
                    sx={{
                        width: "5%",
                        marginLeft: 1
                    }}>
                    <FaSearch />
                </Button>

            </Box>
            <Box sx={{ marginBottom: 2, marginTop: 0.5, width: '100%' }}>
                <FormControl className='dateControl'>
                    <TextField
                        label="Start date"
                        type="datetime-local"
                        className='start'
                        value={startDate}
                        onChange={handleDateChange('start')}
                        sx={{ backgroundColor: "#F1F1E9", marginRight: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                </FormControl>
                <FormControl className='dateControl'>
                    <TextField
                        label="End date"
                        type="datetime-local"
                        className='end'
                        value={endDate}
                        onChange={handleDateChange('end')}
                        sx={{ backgroundColor: "#F1F1E9" }}
                        InputLabelProps={{ shrink: true }}
                    />
                </FormControl>
                <Button onClick={fetchNewsForCompany} className="button-30">Fetch news</Button>
            </Box>

            <Masonry columns={{ xs: 1, sm: 1, md: 1 }} spacing={2} sx={{ width: "100%", margin: 'auto', paddingTop: 2 }}>
                {filteredData.map((card) => (
                    <Card className='card' key={card.uuid} elevation={12}>
                        <CardMedia
                            className='image'
                            sx={{ height: 500 }}
                            image={card.image_url}
                            title={card.title}
                        />
                        <CardContent className='card-content'>
                            <Typography className='date' gutterBottom variant="body2" component="div" color="text.secondary">
                                Published: {dayjs(card.published_at).add(gmtoffset, 'hour').set("second", 0).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                            <Typography className='title' gutterBottom variant="h6" component="div" fontWeight='bold' color={colorNewsTitles(card)}>
                                {card.title}
                            </Typography>
                            <Typography className='authors' gutterBottom variant="body1" component="div" color="#757575">
                                Authors: {card.source}
                            </Typography>
                            <Typography className='description' variant="body2" color="text.secondary">
                                {card.description}
                            </Typography>
                            {charts !== undefined ? charts[card.uuid] : undefined}
                        </CardContent>
                        <CardActions>
                            <Button size="small" href={card.url} target="_blank">Learn More</Button>
                        </CardActions>
                    </Card>
                ))}
            </Masonry>

            <Menu
                id="basic-menu"
                anchorEl={inputRef.current}
                open={isSearchListOpen}
                onClose={closeSearchList}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                {
                    quotes.map(quote => {
                        return (
                            <MenuItem
                                key={quote.index}
                                sx={{
                                    transition: "background .3s ease-in-out",
                                    "&:hover": {
                                        background: "rgba(0,0,0,0.1)",
                                    }
                                }}
                                onClick={() => {
                                    setSelectedCompany(quote);
                                }}
                            >
                                <ListItemText>({quote.symbol}) {quote.longname}</ListItemText>
                            </MenuItem>
                        )
                    })
                }
            </Menu>


        </Box>
    );
}

export default CompanyCard;
