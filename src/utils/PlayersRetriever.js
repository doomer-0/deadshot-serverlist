// UMD (Universal Module Definition) Pattern
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PlayersRetriever = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    class PlayersRetriever {
        static async getPlayers() {
            try {
                const response = await fetch('https://matchmaking.deadshot.io/players');
                if (!response.ok) {
                    throw new Error(`Failed to fetch players: ${response.status}`);
                }

                const text = await response.text();
                return this.parseResponse(text);
            } catch (error) {
                console.error('PlayersRetriever Error:', error.message);
                throw error;
            }
        }

        static parseResponse(text) {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const mapping = {};

            lines.forEach(line => {
                const [rawLabel, rawValue] = line.split(':');
                if (!rawLabel || !rawValue) return;

                const label = rawLabel.trim();
                const value = parseInt(rawValue.trim(), 10) || 0;

                if (label.toLowerCase() === 'total') {
                    mapping.total = value;
                } else {
                    mapping[label] = value;
                }
            });

            return mapping;
        }
    }

    return PlayersRetriever;
}));
