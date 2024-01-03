import Chat from '../chat/chat';

const chat = new Chat('localhost:7070');

window.addEventListener('beforeunload', e => chat.beforeUnload(e));
