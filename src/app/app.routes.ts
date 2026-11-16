import { Routes } from '@angular/router';
import { authGuard } from './auth.service';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.LoginComponent) },
  { path: 'menu', canActivate: [authGuard], loadComponent: () => import('./pages/menu').then(m => m.MenuComponent) },
  { path: 'familias', canActivate: [authGuard], loadComponent: () => import('./pages/familias').then(m => m.FamiliasComponent) },
  { path: 'estoque', canActivate: [authGuard], loadComponent: () => import('./pages/estoque').then(m => m.EstoqueComponent) },
  { path: 'relatorio', canActivate: [authGuard], loadComponent: () => import('./pages/relatorio').then(m => m.RelatorioComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
