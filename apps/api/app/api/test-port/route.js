import net from 'net';

export async function GET() {
    return new Promise((resolve) => {
        const socket = net.createConnection(27017, 'cluster0.cnu9wfd.mongodb.net', () => {
            socket.destroy();
            resolve(Response.json({ port: '27017 reachable' }));
        });
        socket.on('error', (err) => {
            resolve(Response.json({ port: '27017 blocked', error: err.message }));
        });
        socket.setTimeout(5000, () => {
            socket.destroy();
            resolve(Response.json({ port: 'timeout' }));
        });
    });
}