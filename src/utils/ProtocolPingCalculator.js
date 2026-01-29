const WebSocket = require('ws');

/**
 * A class to calculate WebSocket protocol ping.
 */
class ProtocolPingCalculator {

    static async getPingForSocket(socket, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            let handled = false;

            const timeout = setTimeout(() => {
                if (!handled) {
                    handled = true;
                    socket.removeListener('pong', pongListener);
                    socket.removeListener('error', errorListener);
                    reject(new Error('Ping timeout'));
                }
            }, timeoutMs);

            const pongListener = () => {
                if (!handled) {
                    handled = true;
                    const latency = Date.now() - start;
                    clearTimeout(timeout);
                    socket.removeListener('pong', pongListener);
                    socket.removeListener('error', errorListener);
                    resolve(latency);
                }
            };

            const errorListener = (error) => {
                if (!handled) {
                    handled = true;
                    clearTimeout(timeout);
                    socket.removeListener('pong', pongListener);
                    socket.removeListener('error', errorListener);
                    reject(error);
                }
            };

            socket.on('pong', pongListener);
            socket.on('error', errorListener);

            try {
                socket.ping();
            } catch (err) {
                errorListener(err);
            }
        });
    }

    static async getPing(url, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            let socket;
            const timeout = setTimeout(() => {
                if (socket) socket.terminate();
                reject(new Error('Connection timeout'));
            }, timeoutMs);

            try {
                socket = new WebSocket(url, { handshakeTimeout: timeoutMs });
            } catch (error) {
                clearTimeout(timeout);
                return reject(error);
            }

            socket.on('open', async () => {
                clearTimeout(timeout);
                try {
                    const latency = await ProtocolPingCalculator.getPingForSocket(socket, timeoutMs);
                    socket.close();
                    resolve(latency);
                } catch (err) {
                    socket.close();
                    reject(err);
                }
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
}

module.exports = ProtocolPingCalculator;
