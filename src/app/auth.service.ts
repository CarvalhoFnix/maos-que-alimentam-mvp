import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { db } from './db';

const ITER = 310000, MAX_TENT = 5, BLOQ_MS = 5 * 60 * 1000, INATIV_MS = 15 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private enc = new TextEncoder();
  private b64(u: Uint8Array) { return btoa(String.fromCharCode(...u)); }
  private deb64(s: string) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
  private async hash(senha: string, salt: Uint8Array) {
    const k = await crypto.subtle.importKey('raw', this.enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
    const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITER }, k, 256);
    return this.b64(new Uint8Array(b));
  }
  async temSenha() { return !!(await db.config.get('auth')); }
  async definir(senha: string) {
    if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await db.config.put({ chave: 'auth', valor: { salt: this.b64(salt), hash: await this.hash(senha, salt) } });
    this.abrir();
  }
  async entrar(senha: string): Promise<'ok' | 'erro' | 'bloqueado'> {
    const lock = (await db.config.get('lock'))?.valor ?? { n: 0, ate: 0 };
    if (lock.ate > Date.now()) return 'bloqueado';
    const a = (await db.config.get('auth'))!.valor;
    if (await this.hash(senha, this.deb64(a.salt)) === a.hash) {
      await db.config.put({ chave: 'lock', valor: { n: 0, ate: 0 } });
      this.abrir();
      return 'ok';
    }
    const n = lock.n + 1;
    await db.config.put({ chave: 'lock', valor: n >= MAX_TENT ? { n: 0, ate: Date.now() + BLOQ_MS } : { n, ate: 0 } });
    return n >= MAX_TENT ? 'bloqueado' : 'erro';
  }
  private abrir() { sessionStorage.setItem('sessao', JSON.stringify({ t: crypto.randomUUID(), u: Date.now() })); }
  tocar() { const s = this.sessao(); if (s) { s.u = Date.now(); sessionStorage.setItem('sessao', JSON.stringify(s)); } }
  private sessao() { try { return JSON.parse(sessionStorage.getItem('sessao') || 'null'); } catch { return null; } }
  ativa() { const s = this.sessao(); return !!s && Date.now() - s.u < INATIV_MS; }
  sair() { sessionStorage.removeItem('sessao'); }
}

export const authGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.ativa() ? true : inject(Router).createUrlTree(['/login']);
};
