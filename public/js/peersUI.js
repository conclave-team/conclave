const $ = query => document.getElementById(query);
const $$ = query => document.body.querySelector(query);

class PeersUI {

    constructor() {
        Events.on('peer-joined', e => this._onPeerJoined(e.detail));
        Events.on('peer-left', e => this._onPeerLeft(e.detail));
        Events.on('peers', e => this._onPeers(e.detail));
    }

    _onPeerJoined(peer) {
        if ($(peer)) return; // peer already exists
        const peerUI = new PeerUI(peer);
        $$('x-peers').appendChild(peerUI.$el);
    }

    _onPeers(peers) {
        this._clearPeers();
        peers.forEach(peer => this._onPeerJoined(peer));
    }

    _onPeerLeft(peer) {
        if (!$(peer)) return;
        $(peer).remove();
    }
    
    _clearPeers() {
        const $peers = $$('x-peers').innerHTML = '';
    }
}

class PeerUI {

    html() {
        return `
            <label class="column center" title="Click to connect with another user">
                <x-icon shadow="1">
                    <svg class="icon"><use xlink:href="#user-pic"/></svg>
                </x-icon>
                <div class="name"></div>
            </label>
            `
    }

    constructor(peer) {
        this._peer = peer;
        this._initDom();
        this._bindListeners(this.$el);
    }

    _bindListeners(el) {
        el.addEventListener('click', e => this._onClick(e));
    }

    _initDom() {
        const el = document.createElement('x-peer');
        el.innerHTML = this.html();
        el.querySelector('.name').textContent = this._peer;
        this.$el = el;
    }

    _onClick(e) {
        e.preventDefault();
        Events.fire('target-peer', this._peer);
    }

}

const peersUI = new PeersUI();