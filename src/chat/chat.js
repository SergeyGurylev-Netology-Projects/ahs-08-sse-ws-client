import './chat.css';
import { markupLoginItem, markupMessageItem } from './markup';

export default class Chat {
  constructor(url) {
    this.url = `https://${url}/`;
    this.ws = new WebSocket(`wss://${url}//ws`);
    this.myName = '';

    this.container = document.getElementById('chat');
    this.containerData = this.container.querySelector('.chat-data');
    this.containerLogins = document.getElementById('chat-users');

    this.loginsList = this.containerLogins.querySelector('.chat-users--list');
    this.formLogin = document.getElementById('chat-form-login');
    this.formLoginInput = this.formLogin.querySelector('.chat-form-login--input');
    this.formLoginTooltip = this.formLogin.querySelector('.chat-form-login--input-tooltip');

    this.messagesList = this.container.querySelector('.chat-messages--list');
    this.formChatMessage = document.getElementById('chat-form-messages');
    this.formChatMessageInput = this.formChatMessage.querySelector('.chat-form-messages--input');

    this.onLoginSubmit = this.onLoginSubmit.bind(this);
    this.onLoginInput = this.onLoginInput.bind(this);
    this.onChatMessageSubmit = this.onChatMessageSubmit.bind(this);

    this.onWSMessage = this.onWSMessage.bind(this);

    this.bindToDOM();

    this.formLogin.classList.add('visible');
    this.containerData.classList.remove('visible');
  }

  bindToDOM() {
    this.formLogin.addEventListener('submit', this.onLoginSubmit);
    this.formLoginInput.addEventListener('input', this.onLoginInput);
    this.formChatMessage.addEventListener('submit', this.onChatMessageSubmit);

    this.ws.addEventListener('message', this.onWSMessage);
  }

  initChat(result) {
    if (result.status === 0) {
      this.formLoginInput.classList.add('invalid');
      return;
    }

    this.myName = result.name;
    this.formLogin.classList.remove('visible');
    this.containerData.classList.add('visible');

    result.logins.forEach(el => {
      this.addLoginItem(el);
    });

    const message = JSON.stringify({ action: 'login', name: result.name });
    this.ws.send(message);
  }

  addLoginItem(data) {
    if (this.loginsList.querySelector(`[data-name="${data.name}"]`)) return;

    if (!this.myName) this.myName = data.name;

    const listItem = document.createElement('li');
    listItem.classList.add('chat-users--item');
    listItem.innerHTML = markupLoginItem;
    listItem.dataset.name = data.name;
    listItem.querySelector('.chat-users--item-name').textContent = data.name;
    this.loginsList.appendChild(listItem);

    if (data.name === this.myName) {
      listItem.querySelector('.chat-users--item-name').classList.add('this-is-mine');
    }
  }

  removeLoginItem(data) {
    const element = this.loginsList.querySelector(`[data-name="${data.name}"]`);

    if (element) element.remove();
  }

  initMessages(data) {
    this.messagesList.replaceChildren();

    data.messages.forEach(el => {
      this.addMessageItem(el);
    });
  }

  addMessageItem(data) {
    const listItem = document.createElement('li');
    listItem.classList.add('chat-messages--item');
    listItem.innerHTML = markupMessageItem;
    listItem.dataset.id = data.id;
    listItem.dataset.name = data.name;
    listItem.dataset.created = data.created;
    listItem.querySelector('.chat-messages--item-title').textContent = `${data.name}, ${new Date(data.created).toLocaleTimeString()} ${new Date(data.created).toLocaleDateString()}`;
    listItem.querySelector('.chat-messages--item-message').textContent = data.message;
    this.messagesList.appendChild(listItem);

    if (data.name === this.myName) {
      listItem.querySelector('.chat-messages--item-title').classList.add('this-is-mine');
      listItem.querySelector('.chat-messages--item-message').classList.add('this-is-mine');
    }
  }

  onLoginSubmit(e) {
    e.preventDefault();

    this.formLoginInput.classList.remove('invalid');
    this.formLoginTooltip.classList.remove('visible');

    const { value } = this.formLoginInput;

    this.getLoginAvailableStatus(value).then(result => {
      if (result.status === 1 || result.status === 2) {
        this.login(result.name).then(result => {
          this.initChat(result);
        });
      } else {
        if (result.status === 0) this.formLoginInput.classList.add('invalid');
        this.formLoginTooltip.querySelector('span').textContent = String(result.description);
        this.formLoginTooltip.classList.add('visible');
      }
    });

    // this.getLoginAvailableStatus().then(result => {
    //   if (result.status === 1 || result.status === 2) {
    //     console.log(result);
    //     console.log('OK');
    //     this.login(result.name).then(() => {});
    //   } else {
    //     this.formLoginTooltip.querySelector('span').textContent = String(result.description);
    //     this.formLoginTooltip.classList.add('visible');
    //   }
    // })
  }

  onLoginInput() {
    this.formLoginInput.classList.remove('invalid');
    this.formLoginTooltip.classList.remove('visible');

    const { value } = this.formLoginInput;

    if (!value) return;

    this.getLoginAvailableStatus(value).then(result => {
      if (result.status === 0) this.formLoginInput.classList.add('invalid');
    });
  }

  onChatMessageSubmit(e) {
    e.preventDefault();

    const { value } = this.formChatMessageInput;

    if (!value) return;

    this.sendMessage(value).then(result => {
      if (result.status > 0) {
        const message = JSON.stringify({
          action: 'message',
          id: result.id,
        });
        this.ws.send(message);
      }
    });

    this.formChatMessageInput.value = '';
  }

  async getLoginAvailableStatus(value) {
    const query = `${this.url}login/${value}`;

    const request = fetch(query, {
      method: 'GET',
    });

    let result = await request;

    if (!result.ok) {
      console.error(result);
      return { status: -1, name: value, description: result };
    }

    result = await result.json();
    return result;
  }

  async login(value) {
    const query = `${this.url}login`;

    const request = fetch(query, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: value }),
    });

    let result = await request;

    if (!result.ok) {
      console.error(result);
      return { status: -1, name: value, description: result };
    }

    result = await result.json();
    return result;
  }

  async sendMessage(value) {
    const query = `${this.url}message`;

    const request = fetch(query, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: this.myName, message: value }),
    });

    let result = await request;

    if (!result.ok) {
      console.error(result);
      return { status: -1, description: result };
    }

    result = await result.json();
    return result;
  }

  onWSMessage(e) {
    const data = JSON.parse(e.data);

    switch (data.action) {
      case 'login':
        this.addLoginItem(data);
        return;
      case 'logout':
        this.removeLoginItem(data);
        return;
      case 'message':
        this.addMessageItem(data);
        return;
      case 'initMessages':
        this.initMessages(data);
    }
  }

  beforeUnload() {
    const message = JSON.stringify({ action: 'unload', name: this.myName });
    this.ws.send(message);
  }
}
