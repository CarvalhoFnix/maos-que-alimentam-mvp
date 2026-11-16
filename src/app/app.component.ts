import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<main><router-outlet /></main>`
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}
  ngOnInit() {
    setInterval(() => {
      if (!this.auth.ativa() && !this.router.url.startsWith('/login')) this.router.navigate(['/login']);
    }, 30000);
  }
  @HostListener('document:click') @HostListener('document:keydown') atividade() { this.auth.tocar(); }
}
