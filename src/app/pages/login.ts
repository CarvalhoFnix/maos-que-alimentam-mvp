import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  template: `
  <h1>Mãos que Alimentam</h1>
  @if (primeiro) { <p>Primeiro acesso: crie uma senha com pelo menos 8 caracteres.</p> } @else { <p>Cadastro e estoque da ONG</p> }
  <label for="senha">{{ primeiro ? 'Nova senha' : 'Senha' }}</label>
  <input id="senha" type="password" [(ngModel)]="senha" (keyup.enter)="enviar()" autocomplete="current-password">
  @if (erro) { <div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>{{ erro }}</span></div> }
  <button mat-flat-button (click)="enviar()">{{ primeiro ? 'Criar senha e entrar' : 'Entrar' }}</button>`
})
export class LoginComponent {
  senha = ''; erro = ''; primeiro = false;
  constructor(private auth: AuthService, private router: Router) { this.auth.temSenha().then(t => this.primeiro = !t); }
  async enviar() {
    this.erro = '';
    try {
      if (this.primeiro) { await this.auth.definir(this.senha); }
      else {
        const r = await this.auth.entrar(this.senha);
        if (r === 'erro') { this.erro = 'Senha incorreta. Tente novamente.'; return; }
        if (r === 'bloqueado') { this.erro = 'Acesso bloqueado por 5 minutos.'; return; }
      }
      this.router.navigate(['/menu']);
    } catch (e: any) { this.erro = e.message; }
  }
}
