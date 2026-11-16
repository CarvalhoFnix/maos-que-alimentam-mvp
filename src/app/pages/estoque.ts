import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Alimento, db, diasAte, hoje } from '../db';

const LIMITE_ALERTA = 15;

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule],
  template: `
  <h1>Estoque</h1><p>Itens que vencem em até {{ limite }} dias aparecem primeiro.</p>
  @for (a of lista; track a.id) {
    <div class="item" [class.alert]="situacao(a) !== 'ok'">
      <b>{{ situacao(a) !== 'ok' ? '⚠ ' : '' }}{{ a.nome }} – {{ a.quantidade }} {{ a.unidade }}</b>
      <small>Validade: {{ a.validade.split('-').reverse().join('/') }}</small>
      <span class="tag">{{ rotulo(a) }}</span>
      @if (diasAte(a.validade) < 0 && a.quantidade > 0) { <button mat-stroked-button (click)="descartar(a)">Descartar vencido</button> }
    </div>
  } @empty { <p>Nenhum alimento registrado. Registre uma entrada abaixo.</p> }
  @if (erro) { <div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>{{ erro }}</span></div> }
  <h2>Registrar entrada</h2>
  <label for="n">Alimento</label><input id="n" [(ngModel)]="nome">
  <label for="u">Unidade (kg, un, pacote)</label><input id="u" [(ngModel)]="un">
  <label for="q">Quantidade</label><input id="q" type="number" min="1" [(ngModel)]="qtd">
  <label for="v">Validade</label><input id="v" type="date" [(ngModel)]="val">
  <button mat-flat-button (click)="entrada()">Registrar entrada</button>
  <h2>Registrar saída</h2>
  <label for="s">Alimento</label>
  <select id="s" [(ngModel)]="selId">@for (a of lista; track a.id) { <option [ngValue]="a.id">{{ a.nome }} ({{ a.quantidade }} {{ a.unidade }})</option> }</select>
  <label for="sq">Quantidade</label><input id="sq" type="number" min="1" [(ngModel)]="sqtd">
  <button mat-flat-button (click)="saida()">Registrar saída</button>
  <a mat-stroked-button routerLink="/menu">Voltar ao menu</a>`
})
export class EstoqueComponent {
  limite = LIMITE_ALERTA; diasAte = diasAte;
  lista: Alimento[] = []; erro = '';
  nome = ''; un = ''; qtd: number | null = null; val = ''; selId: number | null = null; sqtd: number | null = null;
  constructor() { this.carregar(); }
  async carregar() {
    const todos = await db.alimentos.toArray();
    this.lista = todos.filter(a => a.quantidade > 0).sort((a, b) => a.validade.localeCompare(b.validade));
  }
  situacao(a: Alimento) { const d = diasAte(a.validade); return d < 0 ? 'vencido' : d <= LIMITE_ALERTA ? 'alerta' : 'ok'; }
  rotulo(a: Alimento) {
    const d = diasAte(a.validade);
    return d < 0 ? 'Vencido' : d <= LIMITE_ALERTA ? `Vence em ${d} dias` : 'Em dia';
  }
  async entrada() {
    this.erro = '';
    const q = Number(this.qtd);
    if (!this.nome.trim() || !this.un.trim() || !this.val || !(q > 0)) { this.erro = 'Preencha nome, unidade, validade e quantidade maior que zero.'; return; }
    const id = await db.alimentos.add({ nome: this.nome.trim(), unidade: this.un.trim(), quantidade: q, validade: this.val, status: 'disponivel' });
    await db.movimentacoes.add({ alimentoId: id, tipo: 'entrada', quantidade: q, data: hoje() });
    this.nome = this.un = this.val = ''; this.qtd = null; this.carregar();
  }
  async saida() {
    this.erro = '';
    const q = Number(this.sqtd), a = this.lista.find(x => x.id === this.selId);
    if (!a || !(q > 0)) { this.erro = 'Escolha o alimento e uma quantidade maior que zero.'; return; }
    if (q > a.quantidade) { this.erro = 'Quantidade maior que o saldo disponível.'; return; }
    await this.mover(a, q, 'saida'); this.sqtd = null;
  }
  async descartar(a: Alimento) { await this.mover(a, a.quantidade, 'descarte'); }
  private async mover(a: Alimento, q: number, tipo: 'saida' | 'descarte') {
    const novo = a.quantidade - q;
    await db.alimentos.update(a.id!, { quantidade: novo, status: novo === 0 ? 'esgotado' : a.status });
    await db.movimentacoes.add({ alimentoId: a.id!, tipo, quantidade: q, data: hoje() });
    this.carregar();
  }
}
