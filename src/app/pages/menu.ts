import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
  <h1>Mãos que Alimentam</h1><p>O que você quer fazer hoje?</p>
  <a mat-flat-button class="grande" routerLink="/familias">Famílias</a>
  <a mat-flat-button class="grande" routerLink="/estoque">Estoque</a>
  <a mat-flat-button class="grande" routerLink="/relatorio">Relatório</a>
  <button mat-stroked-button (click)="sair()">Sair</button>`
})
export class MenuComponent {
  constructor(private auth: AuthService, private router: Router) {}
  sair() { this.auth.sair(); this.router.navigate(['/login']); }
}
