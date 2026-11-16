import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { db, hoje } from '../db';

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule],
  template: `
  <h1>Relatório de atendimentos</h1>
  <label for="i">Data inicial</label><input id="i" type="date" [(ngModel)]="ini">
  <label for="f">Data final</label><input id="f" type="date" [(ngModel)]="fim">
  @if (erro) { <div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>{{ erro }}</span></div> }
  <button mat-flat-button (click)="gerar()">Gerar relatório</button>
  @if (res) {
    <div class="item" role="status"><b>Período: {{ res.p }}</b>
      <small>Atendimentos: {{ res.at }} · Famílias atendidas: {{ res.fam }} · Cestas entregues: {{ res.ces }}</small></div>
  }
  <h2>Cópia de segurança</h2><p>Baixe um arquivo com todos os dados do aparelho.</p>
  <button mat-stroked-button (click)="exportar()">Exportar cópia (JSON)</button>
  <a mat-stroked-button routerLink="/menu">Voltar ao menu</a>`
})
export class RelatorioComponent {
  ini = ''; fim = hoje(); erro = ''; res: { p: string; at: number; fam: number; ces: number } | null = null;
  async gerar() {
    this.erro = ''; this.res = null;
    if (!this.ini || !this.fim || this.ini > this.fim) { this.erro = 'Informe um período válido (data inicial até a final).'; return; }
    const at = await db.atendimentos.where('data').between(this.ini, this.fim, true, true).toArray();
    const br = (d: string) => d.split('-').reverse().join('/');
    this.res = { p: `${br(this.ini)} a ${br(this.fim)}`, at: at.length, fam: new Set(at.map(a => a.familiaId)).size, ces: at.reduce((s, a) => s + a.cestas, 0) };
  }
  async exportar() {
    const dados = {
      exportadoEm: new Date().toISOString(),
      familias: await db.familias.toArray(), alimentos: await db.alimentos.toArray(),
      movimentacoes: await db.movimentacoes.toArray(), atendimentos: await db.atendimentos.toArray()
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
    a.download = `backup-maos-que-alimentam-${hoje()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
}
