import Chat from '../chat/chat';

// const chat = new Chat('localhost:7070');
const chat = new Chat('ahs-08-sse-ws-server.onrender.com');

window.addEventListener('beforeunload', e => chat.beforeUnload(e));
