import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
  <div class="acess" role="toolbar" aria-label="Recursos de acessibilidade">
    <button type="button" (click)="fonte(-0.15)" aria-label="Diminuir o tamanho da letra">A−</button>
    <button type="button" (click)="fonte(0.15)" aria-label="Aumentar o tamanho da letra">A+</button>
    <button type="button" (click)="contraste()" [attr.aria-pressed]="alto">Alto contraste</button>
  </div>
  <main><router-outlet /></main>`
})
export class AppComponent implements OnInit {
  escala = 1; alto = false;
  constructor(private auth: AuthService, private router: Router) {}
  ngOnInit() {
    try {
      this.escala = Number(localStorage.getItem('escala')) || 1;
      this.alto = localStorage.getItem('alto') === '1';
    } catch { /* armazenamento indisponível: usa o padrão */ }
    this.aplicar();
    setInterval(() => {
      if (!this.auth.ativa() && !this.router.url.startsWith('/login')) this.router.navigate(['/login']);
    }, 30000);
  }
  fonte(d: number) { this.escala = Math.min(1.6, Math.max(0.85, +(this.escala + d).toFixed(2))); this.aplicar(); }
  contraste() { this.alto = !this.alto; this.aplicar(); }
  private aplicar() {
    const r = document.documentElement;
    r.style.setProperty('--escala', String(this.escala));
    r.classList.toggle('alto-contraste', this.alto);
    try { localStorage.setItem('escala', String(this.escala)); localStorage.setItem('alto', this.alto ? '1' : '0'); } catch { /* ignora */ }
  }
  @HostListener('document:click') @HostListener('document:keydown') atividade() { this.auth.tocar(); }
}
