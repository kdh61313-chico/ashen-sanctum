// PeerJS wrapper. Host is authoritative; clients send inputs/state.
const PREFIX = 'ashen-sanctum-v1-';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Several STUN servers so each side can learn its public address, plus the
// PeerJS relay (TURN) for networks where a direct path is impossible.
const ICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ],
  sdpSemantics: 'unified-plan',
};
const OPTS = { debug: 1, config: ICE, pingInterval: 4000 };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

export function makeCode() { let s = ''; for (let i = 0; i < 5; i++) s += ALPHA[(Math.random() * ALPHA.length) | 0]; return s; }
// accepts a typed code or a whole invite link
export function cleanCode(s) {
  const t = String(s || '').toUpperCase();
  const m = t.match(/JOIN=([A-Z0-9]{5})/);          // a pasted invite link
  return (m ? m[1] : t).replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

export class Net {
  constructor() { this.peer = null; this.conns = new Map(); this.conn = null; this.isHost = false; this.handlers = {}; this.closed = false; }

  on(h) { Object.assign(this.handlers, h); }

  _watchHost(peer) {
    // the room only exists while the host is registered on the signalling server.
    // Mobile browsers drop that socket when the page goes to the background, so reconnect aggressively.
    const tryReconnect = async () => {
      if (this.closed || this.reconnecting) return;
      this.reconnecting = true;
      this.handlers.status?.('reconnecting');
      for (let i = 0; i < 20 && !this.closed && peer.disconnected && !peer.destroyed; i++) {
        try { peer.reconnect(); } catch (e) { }
        await wait(1500 + i * 500);
      }
      this.reconnecting = false;
      if (!this.closed) this.handlers.status?.(peer.disconnected ? 'lost' : 'ok');
    };
    peer.on('disconnected', tryReconnect);
    this._vis = () => { if (document.visibilityState === 'visible' && peer.disconnected && !peer.destroyed) tryReconnect(); };
    document.addEventListener('visibilitychange', this._vis);
    window.addEventListener('online', this._vis);
    peer.on('open', () => this.handlers.status?.('ok'));
  }

  host(code) {
    this.isHost = true;
    return new Promise((resolve, reject) => {
      if (!window.Peer) return reject(new Error('nolib'));
      const peer = new window.Peer(PREFIX + code, OPTS);
      this.peer = peer;
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; reject(new Error('server')); } }, 15000);
      peer.on('open', () => { if (done) return; done = true; clearTimeout(to); this._watchHost(peer); resolve(code); });
      peer.on('error', (e) => {
        if (!done) {
          done = true; clearTimeout(to);
          if (e.type === 'unavailable-id') reject(new Error('taken'));
          else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed') reject(new Error('server'));
          else reject(e);
        } else this.handlers.error?.(e);
      });
      peer.on('connection', (conn) => {
        conn.on('open', () => { this.conns.set(conn.peer, conn); this.handlers.join?.(conn.peer); });
        conn.on('data', (d) => this.handlers.data?.(conn.peer, d));
        conn.on('close', () => { if (this.conns.delete(conn.peer)) this.handlers.leave?.(conn.peer); });
        conn.on('error', () => { if (this.conns.delete(conn.peer)) this.handlers.leave?.(conn.peer); });
      });
    });
  }

  // stage reports progress to the UI: 'server' → 'search' → 'p2p'
  join(code, stage = () => { }) {
    this.isHost = false;
    return new Promise((resolve, reject) => {
      if (!window.Peer) return reject(new Error('nolib'));
      const peer = new window.Peer(OPTS);
      this.peer = peer;
      let done = false, tries = 0, phase = 'server';
      const fail = (m) => { if (done) return; done = true; clearTimeout(to); reject(new Error(m)); };
      const to = setTimeout(() => fail(phase === 'server' ? 'server' : 'p2p'), 30000);
      stage('server');
      const attempt = () => {
        if (done) return;
        tries++;
        phase = 'search'; stage('search');
        const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
        this.conn = conn;
        conn.on('open', () => { if (done) return; done = true; clearTimeout(to); resolve(); });
        conn.on('data', (d) => this.handlers.data?.('host', d));
        conn.on('close', () => { if (done) this.handlers.leave?.('host'); });
        conn.on('error', () => { if (done) this.handlers.leave?.('host'); });
        // once the host answers, we are negotiating the direct connection
        let polls = 0;
        const watchIce = () => {
          if (done || conn !== this.conn || ++polls > 300) return;
          const pc = conn.peerConnection;
          if (!pc) return setTimeout(watchIce, 100);
          pc.addEventListener('iceconnectionstatechange', () => {
            const s = pc.iceConnectionState;
            if (s === 'checking') { phase = 'p2p'; stage('p2p'); }
            if (s === 'failed') fail('p2p');
          });
          pc.addEventListener('signalingstatechange', () => { if (pc.signalingState !== 'stable' || pc.remoteDescription) { phase = 'p2p'; stage('p2p'); } });
        };
        watchIce();
      };
      peer.on('open', () => attempt());
      peer.on('error', async (e) => {
        if (done) return;
        if (e.type === 'peer-unavailable') {
          // the host may be briefly reconnecting (e.g. they just switched apps to send the code)
          if (tries < 4) { await wait(2500); attempt(); }
          else fail('notfound');
        } else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed') fail('server');
        else fail(e.type || 'unknown');
      });
    });
  }

  send(to, msg) {
    if (this.isHost) { const c = this.conns.get(to); if (c && c.open) c.send(msg); }
    else if (this.conn && this.conn.open) this.conn.send(msg);
  }
  broadcast(msg, except = null) { for (const [id, c] of this.conns) if (id !== except && c.open) c.send(msg); }

  close() {
    this.closed = true;
    if (this._vis) { document.removeEventListener('visibilitychange', this._vis); window.removeEventListener('online', this._vis); }
    try { for (const c of this.conns.values()) c.close(); } catch (e) { }
    try { this.conn?.close(); } catch (e) { }
    try { this.peer?.destroy(); } catch (e) { }
    this.conns.clear(); this.conn = null; this.peer = null; this.ready = false;
  }
}
