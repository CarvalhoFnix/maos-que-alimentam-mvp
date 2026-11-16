import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { db, Familia, hoje } from '../db';

@Component({
  selector: 'app-familias',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule],
  template: `
  <h1>Cadastrar família</h1><p>Cada família deve ser cadastrada uma única vez.</p>
  <label for="nome">Nome do responsável</label><input id="nome" [(ngModel)]="nome" autocomplete="off">
  <label for="end">Endereço</label><input id="end" [(ngModel)]="end" autocomplete="off">
  <label for="pes">Nº de pessoas</label><input id="pes" type="number" min="1" inputmode="numeric" [(ngModel)]="pes">
  @if (erro) { <div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>{{ erro }}</span></div> }
  @if (ok) { <div class="msg ok" role="status"><span aria-hidden="true">✔</span><span>{{ ok }}</span></div> }
  <button mat-flat-button (click)="salvar()">Salvar família</button>
  <a mat-stroked-button routerLink="/menu">Voltar ao menu</a>
  <h2>Famílias cadastradas</h2>
  @for (f of lista; track f.id) {
    <div class="item">
      <b>{{ f.responsavel }}</b><small>{{ f.endereco }} ({{ f.pessoas }} pessoas)</small>
      <div class="row">
        <input type="number" min="1" [(ngModel)]="cestas[f.id!]" [attr.aria-label]="'Cestas para ' + f.responsavel" placeholder="Cestas">
        <button mat-stroked-button (click)="atender(f)">Registrar entrega</button>
      </div>
    </div>
  } @empty { <p>Nenhuma família cadastrada.</p> }`
})
export class FamiliasComponent {
  nome = ''; end = ''; pes: number | null = null; erro = ''; ok = ''; lista: Familia[] = []; cestas: Record<number, number> = {};
  constructor() { this.carregar(); }
  async carregar() { this.lista = (await db.familias.where('status').equals('ativo').toArray()).sort((a, b) => a.responsavel.localeCompare(b.responsavel)); }
  async salvar() {
    this.erro = ''; this.ok = '';
    const n = this.nome.trim(), e = this.end.trim(), p = Number(this.pes);
    if (!n || !e || !(p > 0)) { this.erro = 'Preencha todos os campos. Nº de pessoas deve ser maior que zero.'; return; }
    const chave = n.toLowerCase() + '|' + e.toLowerCase();
    if (await db.familias.where('chave').equals(chave).count()) { this.erro = 'Família já cadastrada.'; return; }
    await db.familias.add({ responsavel: n, endereco: e, pessoas: p, dataCadastro: hoje(), status: 'ativo', chave });
    this.ok = 'Família cadastrada.'; this.nome = this.end = ''; this.pes = null; this.carregar();
  }
  async atender(f: Familia) {
    this.erro = ''; this.ok = '';
    const c = Number(this.cestas[f.id!]);
    if (!(c > 0)) { this.erro = 'Informe a quantidade de cestas (maior que zero).'; return; }
    await db.atendimentos.add({ familiaId: f.id!, data: hoje(), cestas: c });
    this.ok = `Entrega registrada para ${f.responsavel}.`; this.cestas[f.id!] = 0;
  }
}
