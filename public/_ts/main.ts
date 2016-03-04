/// <reference path="socket.io-client.d.ts" />

const socket: SocketIOClient.Socket = io();

socket.on('addnode', node => {
    g.add(node);
});

socket.on('removenode', name => {
    g.removeNode(name);
});

socket.on('removeFriend', node => {
    g.removeLink(node.source, node.target);
});

socket.on('initialData', initialData => {
    for (let node of initialData) {
        g.add(node);
    }
});
