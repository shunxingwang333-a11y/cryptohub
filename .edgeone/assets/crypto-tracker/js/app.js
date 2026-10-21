/**
 * CryptoHub - Home Page Logic
 */

const App = (() => {
    let state = {
        page: 1,
        perPage: 50,
        coins: [],
        loading: false,
        error: null,
        sortKey: "marketCapRank",
        sortDir: "asc",
        globalData: null,
        favorites: loadFavorites(),
    };

    // --- LocalStorage Favorites ---
    function loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem("crypto_favorites") || "[]");
        } catch {
            return [];
        }
    }

    function saveFavorites() {
        localStorage.setItem("crypto_favorites", JSON.stringify(state.favorites));
    }

    function toggleFavorite(id) {
        const idx = state.favorites.indexOf(id);
        if (idx > -1) {
            state.favorites.splice(idx, 1);
        } else {
            state.favorites.push(id);
        }
        saveFavorites();
    }

    // --- Init ---
    async function init() {
        setupSearch();
        setupSearchGlobal();
        await Promise.all([
            loadGlobal(),
            loadMarkets(),
        ]);
    }

    // --- Global Stats ---
    async function loadGlobal() {
        try {
            const data = await API.getGlobal();
            state.globalData = data;
            renderGlobalStats(data);
        } catch (err) {
            console.warn("Failed to load global data:", err);
        }
    }

    function renderGlobalStats(data) {
        document.getElementById("totalMarketCap").textContent = "¥" + API.formatMarketCapCNY(data.totalMarketCapUSD);
        document.getElementById("totalVolume").textContent = "¥" + API.formatMarketCapCNY(data.totalVolumeUSD);
        document.getElementById("btcDominance").textContent = data.btcDominance.toFixed(1) + "%";
        document.getElementById("ethDominance").textContent = data.ethDominance.toFixed(1) + "%";

        const changeEl = document.getElementById("marketCapChange");
        const pct = data.marketCapChangePct;
        changeEl.textContent = API.formatPct(pct);
        changeEl.className = "stat-change " + (pct >= 0 ? "up" : "down");
    }

    // --- Markets Table ---
    async function loadMarkets() {
        state.loading = true;
        state.error = null;
        showLoading();
        try {
            const coins = await API.getMarkets(state.page, state.perPage);
            state.coins = coins;
            state.loading = false;
            renderTable();
        } catch (err) {
            state.loading = false;
            state.error = err.message;
            showError(err.message);
        }
    }

    function showLoading() {
        document.getElementById("tableBody").innerHTML = "";
        document.getElementById("tableOverlay").style.display = "flex";
        document.getElementById("tableOverlay").innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">正在加载行情数据...</div>
        `;
    }

    function showError(msg) {
        document.getElementById("tableOverlay").style.display = "flex";
        document.getElementById("tableOverlay").innerHTML = `
            <div style="font-size:24px">⚠️</div>
            <div>${msg}</div>
            <button class="retry-btn" onclick="App.loadMarkets()">重试</button>
        `;
    }

    function hideOverlay() {
        const overlay = document.getElementById("tableOverlay");
        overlay.style.display = "none";
        overlay.innerHTML = "";
    }

    function renderTable() {
        hideOverlay();
        const tbody = document.getElementById("tableBody");
        let coins = [...state.coins];

        // Sort
        coins.sort((a, b) => {
            let va, vb;
            switch (state.sortKey) {
                case "marketCapRank": va = a.marketCapRank || 999; vb = b.marketCapRank || 999; break;
                case "marketCap": va = a.marketCap || 0; vb = b.marketCap || 0; break;
                case "price": va = a.price || 0; vb = b.price || 0; break;
                case "volume24h": va = a.volume24h || 0; vb = b.volume24h || 0; break;
                case "priceChangePct": va = a.priceChangePct ?? -999; vb = b.priceChangePct ?? -999; break;
                default: va = a[state.sortKey] || 0; vb = b[state.sortKey] || 0;
            }
            if (typeof va === "string") {
                return state.sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            }
            return state.sortDir === "asc" ? va - vb : vb - va;
        });

        tbody.innerHTML = coins.map((c, i) => {
            const pctClass = c.priceChangePct >= 0 ? "pct-badge up" : "pct-badge down";
            const pctText = API.formatPct(c.priceChangePct);
            const isFav = state.favorites.includes(c.id);
            return `
                <tr onclick="window.location.href='detail.html?id=${c.id}'" style="cursor:pointer">
                    <td>
                        <button class="star-btn ${isFav ? "active" : ""}" onclick="App.toggleFav('${c.id}', event)" title="收藏">
                            ${isFav ? "★" : "☆"}
                        </button>
                    </td>
                    <td class="center">${c.marketCapRank || (state.page - 1) * state.perPage + i + 1}</td>
                    <td class="left">
                        <div class="coin-info">
                            <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 28 28%22><rect width=%2228%22 height=%2228%22 rx=%2214%22 fill=%22%23ccc%22/></svg>'" />
                            <div class="coin-names">
                                <span class="coin-name">${c.name}</span>
                                <span class="coin-symbol">${c.symbol}</span>
                            </div>
                        </div>
                    </td>
                    <td>¥${API.formatMarketCapCNY(c.marketCap)}</td>
                    <td>¥${API.formatPriceCNY(c.price)}</td>
                    <td>¥${API.formatMarketCapCNY(c.volume24h)}</td>
                    <td>${API.formatSupply(c.circulatingSupply)}</td>
                    <td>
                        <span class="${pctClass}">${pctText}</span>
                    </td>
                    <td class="sparkline-cell">
                        <canvas class="sparkline" data-prices='${JSON.stringify(c.sparkline)}' width="130" height="40"></canvas>
                    </td>
                </tr>
            `;
        }).join("");

        // Draw sparklines
        drawSparklines();

        // Update sort indicators
        updateSortHeaders();

        // Render pagination
        renderPagination();
    }

    function drawSparklines() {
        const canvases = document.querySelectorAll("canvas.sparkline");
        canvases.forEach(canvas => {
            let prices;
            try {
                prices = JSON.parse(canvas.dataset.prices);
            } catch {
                prices = [];
            }
            if (!prices || prices.length < 2) return;

            const ctx = canvas.getContext("2d");
            const w = canvas.width;
            const h = canvas.height;
            const padding = 2;

            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const range = max - min || 1;

            ctx.clearRect(0, 0, w, h);

            const isUp = prices[prices.length - 1] >= prices[0];
            const color = isUp ? "#16a34a" : "#dc2626";

            // Gradient fill
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, color + "30");
            grad.addColorStop(1, color + "00");

            ctx.beginPath();
            prices.forEach((p, i) => {
                const x = padding + (i / (prices.length - 1)) * (w - padding * 2);
                const y = h - padding - ((p - min) / range) * (h - padding * 2);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            // Line
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Fill area
            ctx.lineTo(w - padding, h);
            ctx.lineTo(padding, h);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        });
    }

    function updateSortHeaders() {
        document.querySelectorAll("th[data-sort]").forEach(th => {
            const key = th.dataset.sort;
            th.classList.remove("sorted");
            const arrow = th.querySelector(".sort-arrow");
            if (arrow) arrow.textContent = "↕";
            if (key === state.sortKey) {
                th.classList.add("sorted");
                if (arrow) arrow.textContent = state.sortDir === "asc" ? "↑" : "↓";
            }
        });
    }

    function renderPagination() {
        const container = document.getElementById("pagination");
        const cur = state.page;
        const pages = []; // page numbers to show
        const maxShow = 7;
        const start = Math.max(1, cur - 3);
        const end = Math.min(cur + 3, 100); // CoinGecko free API supports up to ~100 pages
        for (let i = start; i <= end; i++) pages.push(i);

        let html = "";
        html += `<button ${cur === 1 ? "disabled" : ""} onclick="App.goPage(${cur - 1})">上一页</button>`;
        if (start > 1) {
            html += `<button onclick="App.goPage(1)">1</button>`;
            if (start > 2) html += `<span class="page-info">...</span>`;
        }
        pages.forEach(p => {
            html += `<button class="${p === cur ? "active" : ""}" onclick="App.goPage(${p})">${p}</button>`;
        });
        if (end < 100) {
            if (end < 99) html += `<span class="page-info">...</span>`;
            html += `<button onclick="App.goPage(100)">100</button>`;
        }
        html += `<button ${cur >= 100 ? "disabled" : ""} onclick="App.goPage(${cur + 1})">下一页</button>`;
        html += `<span class="page-info">第 ${cur} / 100 页</span>`;

        container.innerHTML = html;
    }

    // --- Navigation ---
    function goPage(p) {
        if (p < 1 || p > 100 || p === state.page) return;
        state.page = p;
        loadMarkets();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function changePerPage(perPage) {
        state.perPage = parseInt(perPage);
        state.page = 1;
        loadMarkets();
    }

    // --- Sorting ---
    function sortBy(key) {
        if (state.sortKey === key) {
            state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
            state.sortKey = key;
            state.sortDir = "desc";
        }
        renderTable();
    }

    // --- Favorites toggle ---
    function toggleFav(id, event) {
        event.stopPropagation();
        toggleFavorite(id);
        renderTable();
    }

    // --- Search ---
    let searchTimer = null;
    function setupSearch() {
        const input = document.getElementById("searchInput");
        const results = document.getElementById("searchResults");

        input.addEventListener("input", (e) => {
            const q = e.target.value.trim();
            clearTimeout(searchTimer);
            if (!q) {
                results.classList.remove("show");
                return;
            }
            searchTimer = setTimeout(async () => {
                try {
                    const coins = await API.search(q);
                    if (coins.length === 0) {
                        results.innerHTML = `<div class="search-result-item" style="color:var(--text-muted)">无搜索结果</div>`;
                        results.classList.add("show");
                        return;
                    }
                    results.innerHTML = coins.map(c => `
                        <div class="search-result-item" onclick="window.location.href='detail.html?id=${c.id}'">
                            <img src="${c.thumb}" alt="${c.name}" onerror="this.style.display='none'" />
                            <span class="sr-symbol">${c.symbol}</span>
                            <span class="sr-name">${c.name}</span>
                        </div>
                    `).join("");
                    results.classList.add("show");
                } catch (err) {
                    console.error("Search error:", err);
                }
            }, 400);
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".search-box")) {
                results.classList.remove("show");
            }
        });
    }

    function setupSearchGlobal() {
        const input = document.getElementById("searchInput");
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const q = e.target.value.trim();
                if (q) {
                    window.location.href = `detail.html?search=${encodeURIComponent(q)}`;
                }
            }
        });
    }

    return {
        init,
        goPage,
        changePerPage,
        sortBy,
        toggleFav,
        loadMarkets,
    };
})();

document.addEventListener("DOMContentLoaded", App.init);
