// UMD (Universal Module Definition) Pattern
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ServersRetriever = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    class ServersRetriever {
        static async getServers() {
            try {
                const response = await fetch('https://matchmaking.deadshot.io/servers');
                if (!response.ok) {
                    throw new Error(`Failed to fetch servers: ${response.status} ${response.statusText}`);
                }

                const rawText = await response.text();

                const lastBracketIndex = rawText.lastIndexOf(']');
                if (lastBracketIndex === -1) {
                    throw new Error('Invalid server response format: Missing closing bracket');
                }

                const cleanJson = rawText.substring(0, lastBracketIndex + 1);
                const data = JSON.parse(cleanJson);

                let flattenedServers = [];
                if (Array.isArray(data)) {
                    for (const group of data) {
                        if (group.servers && Array.isArray(group.servers)) {
                            flattenedServers = flattenedServers.concat(group.servers);
                        }
                    }
                }

                return flattenedServers;
            } catch (error) {
                console.error('ServersRetriever Error:', error.message);
                throw error;
            }
        }
    }

    return ServersRetriever;
}));
