// PeerJS wrapper. Host is authoritative; clients send inputs/state.
const PREFIX = 'ashen-sanctum-v1-';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeCode() { let s = ''; for (let i = 0; i < 5; i++) s += ALPHA[(Math.random() * ALPHA.length) | 0]; return s; }

export class Net {
  constructor() { this.peer = null; this.conns = new Map(); this.conn = null; this.isHost = false; this.handlers = {}; }

  on(h) { Object.assign(this.handlers, h); }

  host(code) {
    this.isHost = true;
    return new Promise((resolve, reject) => {
      if (!window.Peer) return reject(new Error('nolib'));
      const peer = new window.Peer(PREFIX + code, { debug: 0 });
      this.peer = peer;
      const to = setTimeout(() => reject(new Error('timeout')), 12000);
      peer.on('open', () => { clearTimeout(to); resolve(code); });
      peer.on('error', (e) => {
        clearTimeout(to);
        if (e.type === 'unavailable-id') reject(new Error('taken'));
        else if (!this.ready) reject(e);
        else this.handlers.error?.(e);
      });
      peer.on('connection', (conn) => {
        conn.on('open', () => { this.conns.set(conn.peer, conn); this.handlers.join?.(conn.peer); });
        conn.on('data', (d) => this.handlers.data?.(conn.peer, d));
        conn.on('close', () => { this.conns.delete(conn.peer); this.handlers.leave?.(conn.peer); });
        conn.on('error', () => { this.conns.delete(conn.peer); this.handlers.leave?.(conn.peer); });
      });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
      this.ready = true;
    });
  }

  join(code) {
    this.isHost = false;
    return new Promise((resolve, reject) => {
      if (!window.Peer) return reject(new Error('nolib'));
      const peer = new window.Peer({ debug: 0 });
      this.peer = peer;
      const to = setTimeout(() => reject(new Error('timeout')), 15000);
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code.toUpperCase(), { reliable: true, serialization: 'json' });
        this.conn = conn;
        conn.on('open', () => { clearTimeout(to); resolve(); });
        conn.on('data', (d) => this.handlers.data?.('host', d));
        conn.on('close', () => this.handlers.leave?.('host'));
        conn.on('error', () => this.handlers.leave?.('host'));
      });
      peer.on('error', (e) => {
        clearTimeout(to);
        if (e.type === 'peer-unavailable') reject(new Error('notfound'));
        else reject(e);
      });
    });
  }

  send(to, msg) {
    if (this.isHost) { const c = this.conns.get(to); if (c && c.open) c.send(msg); }
    else if (this.conn && this.conn.open) this.conn.send(msg);
  }
  broadcast(msg, except = null) { for (const [id, c] of this.conns) if (id !== except && c.open) c.send(msg); }

  close() {
    try { for (const c of this.conns.values()) c.close(); } catch (e) { }
    try { this.conn?.close(); } catch (e) { }
    try { this.peer?.destroy(); } catch (e) { }
    this.conns.clear(); this.conn = null; this.peer = null; this.ready = false;
  }
}
