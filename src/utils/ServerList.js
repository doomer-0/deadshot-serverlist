/**
 * Component to display the list of game servers.
 */
class ServerList extends Component {
    constructor() {
        super('div', 'server-list-panel glass-panel');
        this.isVisible = false;
        this.setupUI();
    }

    setupUI() {
        // Header
        this.header = document.createElement('div');
        this.header.className = 'window-header';
        this.header.innerHTML = `
            <h2>Deadshot Servers</h2>
            <div class="header-actions">
                <button class="refresh-btn">⟳</button>
                <button class="quit-btn">✕</button>
            </div>
        `;
        this.element.appendChild(this.header);

        const refreshBtn = this.header.querySelector('.refresh-btn');
        refreshBtn.onclick = () => this.refresh();

        const quitBtn = this.header.querySelector('.quit-btn');
        quitBtn.onclick = () => window.api.quit();

        // List Container
        this.listContainer = document.createElement('div');
        this.listContainer.id = 'server-list';
        this.element.appendChild(this.listContainer);

        this.listContainer.innerHTML = '<div class="loading">Loading servers...</div>';
    }

    async refresh() {
        this.listContainer.innerHTML = '<div class="loading">Refreshing...</div>';
        const refreshId = Date.now();
        this.lastRefreshId = refreshId;

        try {
            const [servers, players] = await Promise.all([
                ServersRetriever.getServers(),
                PlayersRetriever.getPlayers()
            ]);

            if (this.lastRefreshId !== refreshId) return;

            this.renderServers(servers, players);
        } catch (error) {
            this.listContainer.innerHTML = `<div style="color:red; padding:15px;">Error: ${error.message}</div>`;
        }
    }

    renderServers(servers, players = {}) {
        this.listContainer.innerHTML = '';

        const REGION_INFO = {
            2: { code: 'NA', name: 'North America' },
            9: { code: 'EU', name: 'Europe' },
            35: { code: 'AU', name: 'Australia' },
            40: { code: 'SA', name: 'South America' },
            52: { code: 'AS', name: 'Asia' },
            53: { code: 'IN', name: 'South India' }
        };

        if (servers.length === 0) {
            this.listContainer.innerHTML = '<div style="padding:15px; text-align:center;">No servers found.</div>';
            return;
        }

        // Group servers by region
        const grouped = {};
        servers.forEach(server => {
            const info = REGION_INFO[server.region] || { code: server.region, name: 'Region ' + server.region };
            if (!grouped[info.code]) {
                grouped[info.code] = {
                    name: info.name,
                    servers: []
                };
            }
            grouped[info.code].servers.push(server);
        });

        const SORT_ORDER = ['NA', 'EU', 'AS', 'SA', 'AU', 'IN'];

        const sortedCodes = Object.keys(grouped).sort((a, b) => {
            const indexA = SORT_ORDER.indexOf(a);
            const indexB = SORT_ORDER.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        sortedCodes.forEach(code => {
            const group = grouped[code];
            const regionalPlayerCount = players[code] || 0;

            // Region Header
            const regionHeader = document.createElement('div');
            regionHeader.className = 'region-section-header';
            regionHeader.innerHTML = `
                <span>${group.name}</span>
                <div class="region-header-actions">
                    <span class="region-player-count">👤 ${regionalPlayerCount}</span>
                    <button class="region-refresh-ping-btn" data-region="${code}" title="Refresh pings for ${group.name}">PING</button>
                </div>
            `;

            const regionRefreshBtn = regionHeader.querySelector('.region-refresh-ping-btn');
            regionRefreshBtn.onclick = (e) => {
                e.stopPropagation();
                this.refreshRegionPings(code);
            };
            this.listContainer.appendChild(regionHeader);

            // Region Group
            const regionGroup = document.createElement('div');
            regionGroup.className = 'region-group';
            this.listContainer.appendChild(regionGroup);

            let regionIpCounter = 1;
            const ipToNumberMap = {};
            const ipSubIndexMap = {};

            group.servers.forEach(server => {
                const item = document.createElement('div');
                item.className = 'server-item';

                if (ipToNumberMap[server.ip] === undefined) {
                    ipToNumberMap[server.ip] = regionIpCounter++;
                    ipSubIndexMap[server.ip] = 0;
                }

                const num = ipToNumberMap[server.ip];
                const subIndex = ipSubIndexMap[server.ip]++;

                const version = subIndex === 0 ? '' : String.fromCharCode(64 + subIndex + 1);
                const serverLabel = `${code}-${num}${version}`;

                const formattedIp = server.port === 80
                    ? `wss://ip_${server.ip}.deadshot.io:80/ws`
                    : `wss://ip_${server.ip}.deadshot.io/ws`;

                item.innerHTML = `
                    <div class="server-info">
                        <div class="server-ip"><strong>${serverLabel}:</strong> ${formattedIp}</div>
                    </div>
                    <div class="server-meta">
                        <span class="server-players">👤 ${server.playerCount}</span>
                        <span class="server-ping" data-url="${formattedIp}">--- ms</span>
                    </div>
                `;

                regionGroup.appendChild(item);
            });
        });
    }

    async refreshRegionPings(regionCode) {
        const pingRefreshId = Date.now();
        this.pingRefreshId = pingRefreshId;

        const regionHeader = this.listContainer.querySelector(`.region-refresh-ping-btn[data-region="${regionCode}"]`);
        if (!regionHeader) return;

        const regionGroup = regionHeader.closest('.region-section-header').nextElementSibling;
        if (!regionGroup || !regionGroup.classList.contains('region-group')) return;

        const pingElements = Array.from(regionGroup.querySelectorAll('.server-ping'));

        pingElements.forEach(el => {
            el.textContent = '--- ms';
            el.classList.remove('ping-low', 'ping-mid', 'ping-high', 'ping-error');
        });

        for (const el of pingElements) {
            if (this.pingRefreshId !== pingRefreshId || !this.isVisible) break;

            const url = el.getAttribute('data-url');
            try {
                const ping = await window.api.getPing(url);

                if (this.pingRefreshId !== pingRefreshId || !this.isVisible) break;

                el.textContent = `${ping} ms`;

                if (ping < 60) el.classList.add('ping-low');
                else if (ping < 120) el.classList.add('ping-mid');
                else el.classList.add('ping-high');

            } catch (error) {
                if (this.pingRefreshId === pingRefreshId) {
                    el.textContent = error.message || 'error';
                    el.classList.add('ping-error');
                }
            }
        }
    }

    show() {
        this.element.style.display = 'flex';
        this.isVisible = true;
        this.refresh();
    }

    hide() {
        this.element.style.display = 'none';
        this.isVisible = false;
        this.lastRefreshId = null;
    }
}
