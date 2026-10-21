/**
 * CryptoHub - API Module
 * Uses CoinGecko free API (no key needed)
 * With fallback sample data for offline/demo mode
 */

const API = (() => {
    const BASE = "https://api.coingecko.com/api/v3";
    const CNY_RATE = 7.1;
    const FETCH_TIMEOUT = 12000; // 12 seconds

    // Simple in-memory cache
    const cache = new Map();
    const CACHE_TTL = 60 * 1000; // 60 seconds

    function getCached(key) {
        if (cache.has(key)) {
            const { data, ts } = cache.get(key);
            if (Date.now() - ts < CACHE_TTL) return data;
        }
        return null;
    }

    function setCache(key, data) {
        cache.set(key, { data, ts: Date.now() });
    }

    /**
     * Fetch JSON with timeout
     */
    async function fetchJSON(url) {
        const cached = getCached(url);
        if (cached) return cached;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!resp.ok) {
                if (resp.status === 429) {
                    throw new Error("API 请求频率过高，请稍等片刻后重试。");
                }
                throw new Error(`请求失败: ${resp.status}`);
            }
            const data = await resp.json();
            setCache(url, data);
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                throw new Error("请求超时，可能是网络连接问题。");
            }
            if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
                throw new Error("网络连接失败，无法访问数据源。");
            }
            throw err;
        }
    }

    // ========================================
    // Fallback Sample Data (used when API is unreachable)
    // ========================================
    const FALLBACK_COINS = [
        { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", market_cap: 1128000000000, current_price: 79480, total_volume: 88966000000, circulating_supply: 19988500, price_change_percentage_24h: 2.08, sparkline_in_7d: { price: [77200,77500,76800,77100,77900,78300,78100,78600,79000,78800,79200,79400,79100,79480,79500,79300,79480] }, high_24h: 80100, low_24h: 77600, ath: 109024, market_cap_rank: 1 },
        { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", market_cap: 200000000000, current_price: 2343, total_volume: 39800000000, circulating_supply: 120000000, price_change_percentage_24h: 3.02, sparkline_in_7d: { price: [2270,2290,2280,2310,2300,2330,2310,2340,2360,2330,2360,2380,2350,2343,2360,2340,2343] }, high_24h: 2385, low_24h: 2265, ath: 4878, market_cap_rank: 2 },
        { id: "tether", symbol: "usdt", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", market_cap: 937819000000, current_price: 0.9541, total_volume: 187310000000, circulating_supply: 138298000000, price_change_percentage_24h: -0.46, sparkline_in_7d: { price: [0.956,0.955,0.954,0.953,0.954,0.955,0.954,0.953,0.954,0.954,0.953,0.954,0.955,0.954,0.954,0.953,0.954] }, high_24h: 0.956, low_24h: 0.952, ath: 1.32, market_cap_rank: 3 },
        { id: "binance-coin", symbol: "bnb", name: "Binance Coin", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2.png", market_cap: 728709000000, current_price: 712.7, total_volume: 43080000000, circulating_supply: 144000000, price_change_percentage_24h: 3.45, sparkline_in_7d: { price: [690,695,688,692,698,705,700,710,715,708,712,718,715,712,716,710,712] }, high_24h: 725, low_24h: 685, ath: 717, market_cap_rank: 4 },
        { id: "ripple", symbol: "xrp", name: "Ripple", image: "https://assets.coingecko.com/coins/images/1/large/xrp-symbol-white-128.png", market_cap: 530353000000, current_price: 1.298, total_volume: 75520000000, circulating_supply: 57564000000, price_change_percentage_24h: 5.11, sparkline_in_7d: { price: [1.23,1.24,1.22,1.25,1.26,1.27,1.25,1.28,1.30,1.27,1.29,1.31,1.28,1.298,1.30,1.28,1.298] }, high_24h: 1.33, low_24h: 1.21, ath: 3.40, market_cap_rank: 5 },
        { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", market_cap: 351470000000, current_price: 101.7, total_volume: 122030000000, circulating_supply: 486000000, price_change_percentage_24h: 2.83, sparkline_in_7d: { price: [99,98.5,97,98,99.5,100,99,100.5,102,101,102.5,103,101.5,101.7,102,101,101.7] }, high_24h: 104, low_24h: 96, ath: 214, market_cap_rank: 6 },
        { id: "usd-coin", symbol: "usdc", name: "USD Coin", image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png", market_cap: 320347000000, current_price: 0.9518, total_volume: 27854000000, circulating_supply: 47391000000, price_change_percentage_24h: -0.01, sparkline_in_7d: { price: [0.952,0.952,0.951,0.952,0.952,0.951,0.952,0.952,0.951,0.952,0.952,0.951,0.952,0.9518,0.952,0.951,0.9518] }, high_24h: 0.953, low_24h: 0.951, ath: 1.17, market_cap_rank: 7 },
        { id: "tron", symbol: "trx", name: "TRON", image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png", market_cap: 192556000000, current_price: 0.3148, total_volume: 11630000000, circulating_supply: 86156000000, price_change_percentage_24h: 0, sparkline_in_7d: { price: [0.315,0.314,0.316,0.315,0.314,0.315,0.314,0.315,0.316,0.315,0.314,0.315,0.314,0.3148,0.315,0.314,0.3148] }, high_24h: 0.317, low_24h: 0.313, ath: 0.231, market_cap_rank: 8 },
        { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", market_cap: 81974000000, current_price: 0.0782, total_volume: 20980000000, circulating_supply: 147675000000, price_change_percentage_24h: 4.04, sparkline_in_7d: { price: [0.075,0.076,0.074,0.077,0.078,0.076,0.077,0.079,0.080,0.077,0.078,0.079,0.076,0.0782,0.079,0.077,0.0782] }, high_24h: 0.081, low_24h: 0.073, ath: 0.731, market_cap_rank: 12 },
        { id: "cardano", symbol: "ada", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png", market_cap: 53643000000, current_price: 0.2148, total_volume: 12640000000, circulating_supply: 35164000000, price_change_percentage_24h: 4.05, sparkline_in_7d: { price: [0.206,0.208,0.205,0.209,0.210,0.212,0.209,0.213,0.215,0.211,0.214,0.216,0.213,0.2148,0.215,0.212,0.2148] }, high_24h: 0.219, low_24h: 0.204, ath: 3.09, market_cap_rank: 16 },
        { id: "chainlink", symbol: "link", name: "ChainLink", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", market_cap: 53379000000, current_price: 11.78, total_volume: 12950000000, circulating_supply: 638000000, price_change_percentage_24h: 0, sparkline_in_7d: { price: [11.7,11.6,11.5,11.8,11.9,11.7,11.8,11.9,12.0,11.8,11.9,12.0,11.8,11.78,11.9,11.7,11.78] }, high_24h: 12.1, low_24h: 11.4, ath: 52.70, market_cap_rank: 17 },
        { id: "litecoin", symbol: "ltc", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", market_cap: 35015000000, current_price: 58.72, total_volume: 15040000000, circulating_supply: 84000000, price_change_percentage_24h: 3.28, sparkline_in_7d: { price: [57,56.5,55.8,56.5,57.2,57.8,57,58.0,58.8,58.2,58.5,59.0,58.3,58.72,58.8,58.0,58.72] }, high_24h: 60, low_24h: 55, ath: 410, market_cap_rank: 24 },
        { id: "avalanche-2", symbol: "avax", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", market_cap: 27077000000, current_price: 9.27, total_volume: 10960000000, circulating_supply: 411000000, price_change_percentage_24h: 1.97, sparkline_in_7d: { price: [9.1,9.0,8.9,9.1,9.2,9.3,9.1,9.3,9.4,9.2,9.3,9.4,9.1,9.27,9.3,9.1,9.27] }, high_24h: 9.5, low_24h: 8.8, ath: 134, market_cap_rank: 25 },
        { id: "polkadot", symbol: "dot", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", market_cap: 22000000000, current_price: 12.88, total_volume: 5000000000, circulating_supply: 1700000000, price_change_percentage_24h: 2.5, sparkline_in_7d: { price: [12.5,12.4,12.3,12.5,12.6,12.7,12.5,12.8,13.0,12.7,12.9,13.0,12.6,12.88,12.9,12.6,12.88] }, high_24h: 13.2, low_24h: 12.2, ath: 55, market_cap_rank: 28 },
        { id: "polygon", symbol: "pol", name: "Polygon", image: "https://assets.coingecko.com/coins/images/4713/large/polygon.png", market_cap: 67630000000, current_price: 0.9106, total_volume: 10400000000, circulating_supply: 10000000000, price_change_percentage_24h: 1.54, sparkline_in_7d: { price: [0.895,0.89,0.885,0.898,0.905,0.910,0.900,0.912,0.915,0.908,0.911,0.913,0.905,0.9106,0.912,0.905,0.9106] }, high_24h: 0.920, low_24h: 0.880, ath: 2.92, market_cap_rank: 46 },
    ];

    // Fallback detail data generator
    function getFallbackDetail(id) {
        const coin = FALLBACK_COINS.find(c => c.id === id);
        if (!coin) {
            // Generate a basic structure for unknown coins
            return {
                id: id,
                symbol: id.substring(0, 4),
                name: id.charAt(0).toUpperCase() + id.slice(1),
                image: "",
                description: `<p>暂无${id}的详细描述信息（当前为离线模式，数据源不可用）。</p>`,
                marketCapRank: null,
                links: { homepage: [], blockchain_site: [], twitter_screen_name: "", reddit_url: "", github: [] },
                categories: [],
                currentPrice: 0,
                priceBtc: 0,
                marketCap: 0,
                volume24h: 0,
                high24h: 0,
                low24h: 0,
                ath: 0,
                athDate: "",
                athChangePct: 0,
                atl: 0,
                atlDate: "",
                circulatingSupply: 0,
                totalSupply: null,
                maxSupply: null,
                priceChangePct24h: 0,
                priceChangePct7d: 0,
                priceChangePct14d: 0,
                priceChangePct30d: 0,
                priceChangePct1y: 0,
                marketCapChangePct24h: 0,
                _fallback: true,
            };
        }
        return {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            description: `<p>${coin.name} 是一种加密货币，当前为离线模式展示数据。连接网络后可获取完整信息。</p>`,
            marketCapRank: coin.market_cap_rank,
            links: { homepage: [], blockchain_site: [], twitter_screen_name: "", reddit_url: "", github: [] },
            categories: [],
            currentPrice: coin.current_price,
            priceBtc: 0,
            marketCap: coin.market_cap,
            volume24h: coin.total_volume,
            high24h: coin.high_24h,
            low24h: coin.low_24h,
            ath: coin.ath,
            athDate: "",
            athChangePct: -50,
            atl: 0,
            atlDate: "",
            circulatingSupply: coin.circulating_supply,
            totalSupply: null,
            maxSupply: null,
            priceChangePct24h: coin.price_change_percentage_24h,
            priceChangePct7d: coin.price_change_percentage_24h,
            priceChangePct14d: coin.price_change_percentage_24h,
            priceChangePct30d: coin.price_change_percentage_24h,
            priceChangePct1y: coin.price_change_percentage_24h,
            marketCapChangePct24h: coin.price_change_percentage_24h,
            _fallback: true,
        };
    }

    // Fallback chart data generator
    function getFallbackChart(id, days) {
        const coin = FALLBACK_COINS.find(c => c.id === id);
        if (!coin || !coin.sparkline_in_7d) {
            return { prices: [], marketCaps: [], volumes: [] };
        }
        // Use sparkline data to generate fake historical chart
        const spark = coin.sparkline_in_7d.price;
        const now = Date.now();
        const interval = (days === "1") ? 3600000 : 86400000;
        const points = Math.min(spark.length, days === "max" ? 365 : parseInt(days) || 7);
        const prices = [];
        for (let i = 0; i < points; i++) {
            const ts = now - (points - i) * interval;
            const val = spark[Math.floor((i / points) * spark.length)];
            prices.push([ts, val]);
        }
        return { prices, marketCaps: [], volumes: [] };
    }

    // Fallback search
    function getFallbackSearch(query) {
        const q = query.toLowerCase();
        return FALLBACK_COINS.filter(c =>
            c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.includes(q)
        ).slice(0, 8).map(c => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            thumb: c.image,
        }));
    }

    // ========================================
    // Public API Methods
    // ========================================

    async function getGlobal() {
        try {
            const data = await fetchJSON(`${BASE}/global`);
            const d = data.data;
            return {
                totalMarketCapUSD: d.total_market_cap.usd,
                totalVolumeUSD: d.total_volume.usd,
                marketCapChangePct: d.market_cap_change_percentage_24h_usd,
                activeCryptos: d.active_cryptocurrencies,
                markets: d.markets,
                btcDominance: d.market_cap_percentage.btc,
                ethDominance: d.market_cap_percentage.eth,
            };
        } catch (err) {
            // Fallback
            return {
                totalMarketCapUSD: 2400000000000,
                totalVolumeUSD: 120000000000,
                marketCapChangePct: 2.08,
                activeCryptos: 13000,
                markets: 1200,
                btcDominance: 52.3,
                ethDominance: 9.2,
                _fallback: true,
            };
        }
    }

    async function getMarkets(page = 1, perPage = 50, vs = "usd") {
        const url = `${BASE}/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h`;
        try {
            const data = await fetchJSON(url);
            return data.map(c => ({
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                image: c.image,
                marketCap: c.market_cap,
                price: c.current_price,
                volume24h: c.total_volume,
                circulatingSupply: c.circulating_supply,
                priceChangePct: c.price_change_percentage_24h,
                sparkline: c.sparkline_in_7d ? c.sparkline_in_7d.price : [],
                high24h: c.high_24h,
                low24h: c.low_24h,
                ath: c.ath,
                athDate: c.ath_date,
                marketCapRank: c.market_cap_rank,
            }));
        } catch (err) {
            // Return fallback data
            const start = (page - 1) * perPage;
            const fallback = FALLBACK_COINS.slice(start, start + perPage).map(c => ({
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                image: c.image,
                marketCap: c.market_cap,
                price: c.current_price,
                volume24h: c.total_volume,
                circulatingSupply: c.circulating_supply,
                priceChangePct: c.price_change_percentage_24h,
                sparkline: c.sparkline_in_7d ? c.sparkline_in_7d.price : [],
                high24h: c.high_24h,
                low24h: c.low_24h,
                ath: c.ath,
                athDate: "",
                marketCapRank: c.market_cap_rank,
            }));
            return fallback;
        }
    }

    async function search(query) {
        try {
            const data = await fetchJSON(`${BASE}/search?query=${encodeURIComponent(query)}`);
            return (data.coins || []).slice(0, 8).map(c => ({
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                thumb: c.thumb,
            }));
        } catch (err) {
            return getFallbackSearch(query);
        }
    }

    async function getCoinDetail(id) {
        const url = `${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        try {
            const data = await fetchJSON(url);
            const md = data.market_data;
            return {
                id: data.id,
                symbol: data.symbol,
                name: data.name,
                image: data.image ? data.image.large : "",
                description: data.description ? data.description.en : "",
                marketCapRank: data.market_cap_rank,
                links: data.links,
                categories: (data.categories || []).filter(c => c),
                currentPrice: md.current_price.usd,
                priceBtc: md.current_price.btc,
                marketCap: md.market_cap.usd,
                volume24h: md.total_volume.usd,
                high24h: md.high_24h.usd,
                low24h: md.low_24h.usd,
                ath: md.ath.usd,
                athDate: md.ath_date.usd,
                athChangePct: md.ath_change_percentage.usd,
                atl: md.atl.usd,
                atlDate: md.atl_date.usd,
                circulatingSupply: md.circulating_supply,
                totalSupply: md.total_supply,
                maxSupply: md.max_supply,
                priceChangePct24h: md.price_change_percentage_24h,
                priceChangePct7d: md.price_change_percentage_7d,
                priceChangePct14d: md.price_change_percentage_14d,
                priceChangePct30d: md.price_change_percentage_30d,
                priceChangePct1y: md.price_change_percentage_1y,
                marketCapChangePct24h: md.market_cap_change_percentage_24h,
            };
        } catch (err) {
            return getFallbackDetail(id);
        }
    }

    async function getMarketChart(id, days = "7") {
        const url = `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
        try {
            const data = await fetchJSON(url);
            return {
                prices: data.prices || [],
                marketCaps: data.market_caps || [],
                volumes: data.total_volumes || [],
            };
        } catch (err) {
            return getFallbackChart(id, days);
        }
    }

    // ========================================
    // Formatting Utilities
    // ========================================

    function formatMarketCapCNY(usdValue) {
        if (!usdValue || isNaN(usdValue)) return "--";
        const cny = usdValue * CNY_RATE;
        return formatLargeNumberCNY(cny);
    }

    function formatLargeNumberCNY(val) {
        if (val >= 1e12) return (val / 1e12).toFixed(2) + "万亿";
        if (val >= 1e8) return (val / 1e8).toFixed(2) + "亿";
        if (val >= 1e4) return (val / 1e4).toFixed(2) + "万";
        return val.toFixed(2);
    }

    function formatPriceCNY(usdPrice) {
        if (!usdPrice || isNaN(usdPrice)) return "--";
        const cny = usdPrice * CNY_RATE;
        if (cny >= 10000) return cny.toLocaleString("zh-CN", { maximumFractionDigits: 0 }) + "";
        if (cny >= 100) return cny.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
        if (cny >= 1) return cny.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
        if (cny >= 0.01) return cny.toFixed(6);
        return cny.toFixed(10);
    }

    function formatPriceUSD(usdPrice) {
        if (!usdPrice || isNaN(usdPrice)) return "--";
        if (usdPrice >= 1) return "$" + usdPrice.toLocaleString("en-US", { maximumFractionDigits: 2 });
        if (usdPrice >= 0.01) return "$" + usdPrice.toFixed(4);
        return "$" + usdPrice.toFixed(10);
    }

    function formatSupply(val) {
        if (!val || isNaN(val)) return "--";
        if (val >= 1e12) return (val / 1e12).toFixed(2) + "万亿";
        if (val >= 1e8) return (val / 1e8).toFixed(2) + "亿";
        if (val >= 1e4) return (val / 1e4).toFixed(2) + "万";
        return val.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }

    function formatPct(val) {
        if (val === null || val === undefined || isNaN(val)) return "0%";
        const sign = val >= 0 ? "+" : "";
        return sign + val.toFixed(2) + "%";
    }

    // Get list of popular coins for detail page selection
    function getPopularCoins() {
        return FALLBACK_COINS.map(c => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            image: c.image,
            price: c.current_price,
            marketCapRank: c.market_cap_rank,
        }));
    }

    return {
        getGlobal,
        getMarkets,
        search,
        getCoinDetail,
        getMarketChart,
        formatMarketCapCNY,
        formatPriceCNY,
        formatPriceUSD,
        formatSupply,
        formatPct,
        getPopularCoins,
        CNY_RATE,
    };
})();
