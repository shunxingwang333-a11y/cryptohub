/**
 * CryptoHub - Detail Page Logic
 */

const Detail = (() => {
    let state = {
        coinId: null,
        detail: null,
        chartData: null,
        currentDays: "7",
        loading: true,
        error: null,
        isFallback: false,
    };

    let chartCanvas, chartCtx, chartHover = null;

    function init() {
        const params = new URLSearchParams(window.location.search);
        let id = params.get("id");
        if (!id) {
            const search = params.get("search");
            if (search) {
                redirectToSearch(search);
                return;
            }
            // No id and no search -> show coin selection page
            showCoinSelection();
            return;
        }
        state.coinId = id;
        loadDetail(id);
        setupSearchOnDetail();
    }

    /**
     * When no id is provided, show a page where user can pick a coin
     */
    function showCoinSelection() {
        const coins = API.getPopularCoins();
        document.getElementById("detailContent").innerHTML = `
            <h1 class="page-title">选择币种</h1>
            <p class="page-subtitle">请选择一个币种查看详情，或在上方搜索框中搜索</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:16px;">
                ${coins.map(c => `
                    <a href="detail.html?id=${c.id}" style="display:flex;align-items:center;gap:10px;padding:14px 18px;background:#fff;border:1px solid var(--border);border-radius:10px;transition:all .15s ease;" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='0 2px 8px rgba(0,0,0,.08)'" onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow=''">
                        ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width:32px;height:32px;border-radius:50%;" onerror="this.style.display='none'" />` : ""}
                        <div>
                            <div style="font-weight:600;font-size:14px;">${c.name}</div>
                            <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;">${c.symbol} ${c.marketCapRank ? "#"+c.marketCapRank : ""}</div>
                        </div>
                    </a>
                `).join("")}
            </div>
        `;
    }

    async function redirectToSearch(query) {
        document.getElementById("detailContent").innerHTML = `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <div class="loading-text">正在搜索 "${query}"...</div>
            </div>
        `;
        try {
            const results = await API.search(query);
            if (results.length > 0) {
                window.location.href = `detail.html?id=${results[0].id}`;
            } else {
                document.getElementById("detailContent").innerHTML = `
                    <div class="error-overlay">
                        <div style="font-size:24px">🔍</div>
                        <div>未找到匹配 "${query}" 的币种</div>
                        <a href="index.html" class="retry-btn" style="text-decoration:none;display:inline-block;line-height:36px">返回首页</a>
                    </div>
                `;
            }
        } catch {
            document.getElementById("detailContent").innerHTML = `
                <div class="error-overlay">
                    <div style="font-size:24px">⚠️</div>
                    <div>搜索失败，请稍后重试</div>
                    <a href="index.html" class="retry-btn" style="text-decoration:none;display:inline-block;line-height:36px">返回首页</a>
                </div>
            `;
        }
    }

    async function loadDetail(id) {
        state.loading = true;
        showLoading();
        try {
            const data = await API.getCoinDetail(id);
            state.detail = data;
            state.isFallback = data._fallback || false;
            state.loading = false;
            renderDetail(data);
            loadChart(id, "7");
        } catch (err) {
            state.loading = false;
            state.error = err.message;
            showError(err.message);
        }
    }

    function showLoading() {
        document.getElementById("detailContent").innerHTML = `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <div class="loading-text">正在加载币种数据...</div>
            </div>
        `;
    }

    function showError(msg) {
        document.getElementById("detailContent").innerHTML = `
            <div class="error-overlay">
                <div style="font-size:24px">⚠️</div>
                <div>${msg}</div>
                <a href="index.html" class="retry-btn" style="text-decoration:none;display:inline-block;line-height:36px">返回首页</a>
            </div>
        `;
    }

    function renderDetail(d) {
        document.title = `${d.name} (${d.symbol.toUpperCase()}) 价格、市值与行情 | CryptoHub`;

        const pct24h = d.priceChangePct24h ?? 0;
        const pctClass = pct24h >= 0 ? "pct-up" : "pct-down";

        const fallbackNotice = state.isFallback ? `
            <div style="padding:10px 16px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;margin-bottom:16px;font-size:13px;color:#92400e;">
                ⚠️ 当前为离线模式（数据源不可用），显示的是缓存数据。连接网络后可获取实时数据。
            </div>
        ` : "";

        document.getElementById("detailContent").innerHTML = `
            ${fallbackNotice}
            <a href="index.html" class="back-link">← 返回行情列表</a>

            <!-- Header -->
            <div class="detail-header">
                ${d.image ? `<img src="${d.image}" alt="${d.name}" onerror="this.style.display='none'" />` : `<div style="width:48px;height:48px;border-radius:50%;background:var(--bg-hover);"></div>`}
                <h1>${d.name} <span class="detail-symbol">${d.symbol}</span> ${d.marketCapRank ? `<span class="detail-rank">排名 #${d.marketCapRank}</span>` : ""}</h1>
            </div>

            <!-- Main Grid -->
            <div class="detail-grid">
                <div class="detail-main">
                    <!-- Price Card -->
                    <div class="price-card">
                        <div class="price-top">
                            <span class="price-main">¥${API.formatPriceCNY(d.currentPrice)}</span>
                            <span class="price-btc">≈ ${API.formatPriceUSD(d.currentPrice)} ${d.priceBtc ? "/ " + d.priceBtc.toFixed(8) + " BTC" : ""}</span>
                        </div>
                        <div class="price-change ${pctClass}">
                            ${pct24h >= 0 ? "▲" : "▼"} ${API.formatPct(pct24h)} <span style="color:var(--text-muted);font-weight:400;margin-left:8px">24h</span>
                        </div>
                    </div>

                    <!-- Chart Card -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>价格走势</h3>
                            <div class="chart-timeframes">
                                <button class="chart-timeframe" data-days="1" onclick="Detail.changeTimeframe('1')">24H</button>
                                <button class="chart-timeframe active" data-days="7" onclick="Detail.changeTimeframe('7')">7D</button>
                                <button class="chart-timeframe" data-days="14" onclick="Detail.changeTimeframe('14')">14D</button>
                                <button class="chart-timeframe" data-days="30" onclick="Detail.changeTimeframe('30')">30D</button>
                                <button class="chart-timeframe" data-days="90" onclick="Detail.changeTimeframe('90')">90D</button>
                                <button class="chart-timeframe" data-days="365" onclick="Detail.changeTimeframe('365')">1Y</button>
                                <button class="chart-timeframe" data-days="max" onclick="Detail.changeTimeframe('max')">全部</button>
                            </div>
                        </div>
                        <div style="position:relative;">
                            <canvas id="priceChart"></canvas>
                            <div id="chartTooltip" style="position:absolute;display:none;pointer-events:none;background:rgba(0,0,0,.85);color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;z-index:10;white-space:nowrap"></div>
                        </div>
                    </div>

                    <!-- About -->
                    ${d.description ? `
                    <div class="about-card">
                        <h3>关于 ${d.name}</h3>
                        <div class="about-content">${truncateHtml(d.description, 600)}</div>
                        ${d.links && ((d.links.homepage && d.links.homepage.filter(l => l).length > 0) || d.links.twitter_screen_name || d.links.reddit_url || (d.links.github && d.links.github[0])) ? `
                        <div class="detail-links">
                            ${d.links.homepage ? d.links.homepage.filter(l => l).map(l => `<a href="${l}" target="_blank" rel="noopener">官网</a>`).join("") : ""}
                            ${d.links.blockchain_site ? d.links.blockchain_site.filter(l => l).slice(0, 3).map(l => `<a href="${l}" target="_blank" rel="noopener">区块浏览器</a>`).join("") : ""}
                            ${d.links.twitter_screen_name ? `<a href="https://twitter.com/${d.links.twitter_screen_name}" target="_blank" rel="noopener">Twitter</a>` : ""}
                            ${d.links.reddit_url ? `<a href="${d.links.reddit_url}" target="_blank" rel="noopener">Reddit</a>` : ""}
                            ${d.links.official_forum_url && d.links.official_forum_url[0] ? `<a href="${d.links.official_forum_url[0]}" target="_blank" rel="noopener">论坛</a>` : ""}
                            ${d.links.github && d.links.github[0] ? `<a href="${d.links.github[0]}" target="_blank" rel="noopener">GitHub</a>` : ""}
                        </div>
                        ` : ""}
                    </div>
                    ` : ""}
                </div>

                <!-- Sidebar -->
                <div class="detail-sidebar">
                    <div class="stats-panel">
                        <h3>市场数据</h3>
                        <div class="stats-list">
                            <div class="stats-row">
                                <span class="stat-key">市值</span>
                                <span class="stat-val">¥${API.formatMarketCapCNY(d.marketCap)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">24H 成交量</span>
                                <span class="stat-val">¥${API.formatMarketCapCNY(d.volume24h)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">24H 最高</span>
                                <span class="stat-val">¥${API.formatPriceCNY(d.high24h)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">24H 最低</span>
                                <span class="stat-val">¥${API.formatPriceCNY(d.low24h)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">流通量</span>
                                <span class="stat-val">${API.formatSupply(d.circulatingSupply)}</span>
                            </div>
                            ${d.totalSupply ? `
                            <div class="stats-row">
                                <span class="stat-key">总供应量</span>
                                <span class="stat-val">${API.formatSupply(d.totalSupply)}</span>
                            </div>
                            ` : ""}
                            ${d.maxSupply ? `
                            <div class="stats-row">
                                <span class="stat-key">最大供应量</span>
                                <span class="stat-val">${API.formatSupply(d.maxSupply)}</span>
                            </div>
                            ` : ""}
                            ${d.ath ? `
                            <div class="stats-row">
                                <span class="stat-key">ATH (历史最高)</span>
                                <span class="stat-val">¥${API.formatPriceCNY(d.ath)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">距 ATH</span>
                                <span class="stat-val ${d.athChangePct >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.athChangePct)}</span>
                            </div>
                            ` : ""}
                            ${d.atl ? `
                            <div class="stats-row">
                                <span class="stat-key">ATL (历史最低)</span>
                                <span class="stat-val">¥${API.formatPriceCNY(d.atl)}</span>
                            </div>
                            ` : ""}
                        </div>
                    </div>

                    <div class="stats-panel">
                        <h3>涨跌幅</h3>
                        <div class="stats-list">
                            <div class="stats-row">
                                <span class="stat-key">24H</span>
                                <span class="stat-val ${(d.priceChangePct24h ?? 0) >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.priceChangePct24h)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">7D</span>
                                <span class="stat-val ${(d.priceChangePct7d ?? 0) >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.priceChangePct7d)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">14D</span>
                                <span class="stat-val ${(d.priceChangePct14d ?? 0) >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.priceChangePct14d)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">30D</span>
                                <span class="stat-val ${(d.priceChangePct30d ?? 0) >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.priceChangePct30d)}</span>
                            </div>
                            <div class="stats-row">
                                <span class="stat-key">1Y</span>
                                <span class="stat-val ${(d.priceChangePct1y ?? 0) >= 0 ? "pct-up" : "pct-down"}">${API.formatPct(d.priceChangePct1y)}</span>
                            </div>
                        </div>
                    </div>

                    ${d.categories && d.categories.length > 0 ? `
                    <div class="stats-panel">
                        <h3>分类</h3>
                        <div class="detail-links">
                            ${d.categories.map(c => `<a href="index.html">${c}</a>`).join("")}
                        </div>
                    </div>
                    ` : ""}
                </div>
            </div>
        `;
    }

    function truncateHtml(html, maxLen) {
        if (!html) return "";
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || "";
        if (text.length > maxLen) {
            // Truncate the HTML but keep valid structure
            tmp.innerHTML = html;
            let result = "";
            let count = 0;
            const walk = (node) => {
                if (count >= maxLen) return;
                if (node.nodeType === 3) { // Text node
                    const remaining = maxLen - count;
                    if (node.textContent.length > remaining) {
                        result += node.textContent.substring(0, remaining);
                        count = maxLen;
                    } else {
                        result += node.textContent;
                        count += node.textContent.length;
                    }
                } else if (node.nodeType === 1) { // Element node
                    result += `<${node.tagName.toLowerCase()}`;
                    for (const attr of node.attributes) {
                        result += ` ${attr.name}="${attr.value}"`;
                    }
                    result += ">";
                    for (const child of node.childNodes) walk(child);
                    result += `</${node.tagName.toLowerCase()}>`;
                }
            };
            walk(tmp);
            return result + "... <a href='#' onclick='Detail.expandDesc(event)'>展开全部</a>";
        }
        return html;
    }

    function expandDesc(e) {
        e.preventDefault();
        const card = document.querySelector(".about-content");
        if (state.detail && state.detail.description) {
            card.innerHTML = state.detail.description;
        }
    }

    async function loadChart(id, days) {
        const canvas = document.getElementById("priceChart");
        if (!canvas) return;
        try {
            canvas.parentElement.style.opacity = "0.5";
            const data = await API.getMarketChart(id, days);
            state.chartData = data;
            state.currentDays = days;
            if (data.prices && data.prices.length >= 2) {
                drawChart(data.prices);
            } else {
                drawChartEmpty();
            }
            canvas.parentElement.style.opacity = "1";
        } catch (err) {
            console.error("Chart load error:", err);
            drawChartEmpty();
            canvas.parentElement.style.opacity = "1";
        }
    }

    function drawChartEmpty() {
        const canvas = document.getElementById("priceChart");
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        canvas.style.width = rect.width + "px";
        canvas.style.height = "320px";
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, 320);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("暂无图表数据", rect.width / 2, 160);
    }

    function drawChart(prices) {
        const canvas = document.getElementById("priceChart");
        if (!canvas || !prices || prices.length < 2) {
            drawChartEmpty();
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const cssW = Math.max(rect.width, 300);
        const cssH = 320;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";

        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = cssW;
        const h = cssH;
        const padL = 60;
        const padR = 20;
        const padT = 20;
        const padB = 30;

        const values = prices.map(p => p[1]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const yTicks = 5;
        const yStep = range / yTicks;

        ctx.clearRect(0, 0, w, h);

        // Grid + Y labels
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px -apple-system, sans-serif";
        ctx.textAlign = "right";

        for (let i = 0; i <= yTicks; i++) {
            const y = padT + (h - padT - padB) * (i / yTicks);
            const val = max - yStep * i;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(w - padR, y);
            ctx.stroke();
            ctx.fillText("¥" + formatShortNum(val), padL - 8, y + 4);
        }

        // X labels
        ctx.textAlign = "center";
        const xTicks = Math.min(6, prices.length);
        for (let i = 0; i <= xTicks; i++) {
            const x = padL + (w - padL - padR) * (i / xTicks);
            const idx = Math.min(Math.floor(prices.length * (i / xTicks)), prices.length - 1);
            const ts = prices[idx][0];
            const date = new Date(ts);
            const label = formatDateLabel(date, state.currentDays);
            ctx.fillText(label, x, h - padB + 18);
        }

        // Determine color
        const isUp = prices[prices.length - 1][1] >= prices[0][1];
        const color = isUp ? "#16a34a" : "#dc2626";

        // Gradient fill
        const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
        grad.addColorStop(0, color + "25");
        grad.addColorStop(1, color + "00");

        // Path
        ctx.beginPath();
        prices.forEach((p, i) => {
            const x = padL + (i / (prices.length - 1)) * (w - padL - padR);
            const y = padT + (1 - (p[1] - min) / range) * (h - padT - padB);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        // Fill area
        ctx.lineTo(padL + (w - padL - padR), h - padB);
        ctx.lineTo(padL, h - padB);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line stroke
        ctx.beginPath();
        prices.forEach((p, i) => {
            const x = padL + (i / (prices.length - 1)) * (w - padL - padR);
            const y = padT + (1 - (p[1] - min) / range) * (h - padT - padB);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        chartCanvas = canvas;
        chartCtx = ctx;
        chartHover = { prices, min, max, range, padL, padR, padT, padB, w, h };

        // Mouse hover tooltip
        setupChartHover();
    }

    function setupChartHover() {
        const canvas = chartCanvas;
        const tooltip = document.getElementById("chartTooltip");
        if (!canvas || !tooltip || !chartHover) return;

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const { prices, min, max, range, padL, padR, padT, padB, w, h } = chartHover;

            if (mx < padL || mx > w - padR) {
                tooltip.style.display = "none";
                return;
            }

            const ratio = (mx - padL) / (w - padL - padR);
            const idx = Math.min(Math.floor(ratio * prices.length), prices.length - 1);
            const price = prices[idx];
            const date = new Date(price[0]);

            tooltip.innerHTML = `
                ${formatDateFull(date, state.currentDays)}<br/>
                ¥${API.formatPriceCNY(price[1])}
            `;
            tooltip.style.display = "block";

            // Position tooltip
            const tipW = tooltip.offsetWidth;
            let tipX = mx + 12;
            if (tipX + tipW > w) tipX = mx - tipW - 12;
            tooltip.style.left = tipX + "px";
            tooltip.style.top = (e.clientY - rect.top - 20) + "px";
        };

        canvas.onmouseleave = () => {
            tooltip.style.display = "none";
        };
    }

    function formatDateLabel(date, days) {
        if (days === "1") {
            return date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
        }
        if (days === "7" || days === "14") {
            return (date.getMonth() + 1) + "/" + date.getDate();
        }
        if (days === "30" || days === "90") {
            return (date.getMonth() + 1) + "月";
        }
        return date.getFullYear() + "";
    }

    function formatDateFull(date, days) {
        if (days === "1") {
            return date.getMonth()+1 + "/" + date.getDate() + " " + date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
        }
        return date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();
    }

    function formatShortNum(val) {
        if (val >= 10000) return (val / 10000).toFixed(1) + "万";
        if (val >= 1) return val.toFixed(2);
        return val.toFixed(6);
    }

    function changeTimeframe(days) {
        document.querySelectorAll(".chart-timeframe").forEach(b => {
            b.classList.toggle("active", b.dataset.days === days);
        });
        if (state.coinId) {
            loadChart(state.coinId, days);
        }
    }

    function setupSearchOnDetail() {
        const input = document.getElementById("searchInput");
        if (!input) return;
        const results = document.getElementById("searchResults");
        let timer = null;

        input.addEventListener("input", (e) => {
            const q = e.target.value.trim();
            clearTimeout(timer);
            if (!q) { results.classList.remove("show"); return; }
            timer = setTimeout(async () => {
                try {
                    const coins = await API.search(q);
                    if (coins.length === 0) {
                        results.innerHTML = `<div class="search-result-item" style="color:var(--text-muted)">无搜索结果</div>`;
                    } else {
                        results.innerHTML = coins.map(c => `
                            <div class="search-result-item" onclick="window.location.href='detail.html?id=${c.id}'">
                                ${c.thumb ? `<img src="${c.thumb}" alt="${c.name}" onerror="this.style.display='none'" />` : ""}
                                <span class="sr-symbol">${c.symbol}</span>
                                <span class="sr-name">${c.name}</span>
                            </div>
                        `).join("");
                    }
                    results.classList.add("show");
                } catch {}
            }, 400);
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".search-box")) results.classList.remove("show");
        });
    }

    // Handle window resize for chart
    window.addEventListener("resize", () => {
        if (chartHover && state.chartData) {
            drawChart(state.chartData.prices);
        }
    });

    return {
        init,
        changeTimeframe,
        expandDesc,
    };
})();

document.addEventListener("DOMContentLoaded", Detail.init);
