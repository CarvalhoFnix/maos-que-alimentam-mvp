import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { db, diasAte, hoje } from './db';
import { FamiliasComponent } from './pages/familias';
import { EstoqueComponent } from './pages/estoque';
import { RelatorioComponent } from './pages/relatorio';
import { LoginComponent } from './pages/login';
import { MenuComponent } from './pages/menu';

const espera = () => new Promise(r => setTimeout(r, 20));
const dia = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

beforeEach(async () => {
  await Promise.all([db.familias.clear(), db.alimentos.clear(), db.movimentacoes.clear(), db.atendimentos.clear(), db.config.clear()]);
  sessionStorage.removeItem('sessao');
});

describe('Unitários: datas', () => {
  it('calcula dias até a validade', () => {
    expect(diasAte(dia(10))).toBe(10);
    expect(diasAte(dia(-3))).toBe(-3);
    expect(hoje()).toHaveLength(10);
  });
});

describe('Unitários: autenticação (RNF01)', () => {
  it('rejeita senha com menos de 8 caracteres', async () => {
    await expect(new AuthService().definir('1234567')).rejects.toThrow();
  });
  it('não guarda a senha em texto limpo', async () => {
    await new AuthService().definir('senhaSegura1');
    const a = (await db.config.get('auth'))!.valor;
    expect(JSON.stringify(a)).not.toContain('senhaSegura1');
    expect(a.salt).toBeTruthy();
    expect(a.hash).toBeTruthy();
  });
  it('aceita a senha correta e rejeita a incorreta', async () => {
    const auth = new AuthService();
    await auth.definir('senhaSegura1');
    expect(await auth.entrar('errada123')).toBe('erro');
    expect(await auth.entrar('senhaSegura1')).toBe('ok');
    expect(auth.ativa()).toBe(true);
  });
  it('bloqueia após 5 senhas incorretas', async () => {
    const auth = new AuthService();
    await auth.definir('senhaSegura1');
    for (let i = 0; i < 4; i++) expect(await auth.entrar('x')).toBe('erro');
    expect(await auth.entrar('x')).toBe('bloqueado');
    expect(await auth.entrar('senhaSegura1')).toBe('bloqueado');
  });
  it('encerra a sessão por inatividade e ao sair', async () => {
    const auth = new AuthService();
    await auth.definir('senhaSegura1');
    expect(auth.ativa()).toBe(true);
    sessionStorage.setItem('sessao', JSON.stringify({ t: 'x', u: Date.now() - 16 * 60 * 1000 }));
    expect(auth.ativa()).toBe(false);
    await auth.entrar('senhaSegura1');
    auth.sair();
    expect(auth.ativa()).toBe(false);
  });
  it('informa se já existe senha', async () => {
    const auth = new AuthService();
    expect(await auth.temSenha()).toBe(false);
    await auth.definir('senhaSegura1');
    expect(await auth.temSenha()).toBe(true);
  });
});

describe('Unitários: cadastro de famílias (RF01, RF02)', () => {
  it('recusa campos vazios e pessoas igual a zero', async () => {
    const c = new FamiliasComponent();
    c.nome = ''; c.end = 'Rua A'; c.pes = 0;
    await c.salvar();
    expect(c.erro).toContain('Preencha');
    expect(await db.familias.count()).toBe(0);
  });
  it('bloqueia família duplicada', async () => {
    const c = new FamiliasComponent();
    c.nome = 'Ana Lima'; c.end = 'Rua das Flores, 120'; c.pes = 4;
    await c.salvar();
    expect(c.ok).toBe('Família cadastrada.');
    c.nome = ' ana lima '; c.end = 'rua das flores, 120'; c.pes = 3;
    await c.salvar();
    expect(c.erro).toBe('Família já cadastrada.');
    expect(await db.familias.count()).toBe(1);
  });
});

describe('Unitários: estoque (RF03 a RF05)', () => {
  it('classifica alerta e vencido', () => {
    const e = new EstoqueComponent();
    const base = { nome: 'a', unidade: 'kg', quantidade: 1, status: 'disponivel' as const };
    expect(e.situacao({ ...base, validade: dia(10) })).toBe('alerta');
    expect(e.situacao({ ...base, validade: dia(40) })).toBe('ok');
    expect(e.situacao({ ...base, validade: dia(-1) })).toBe('vencido');
    expect(e.rotulo({ ...base, validade: dia(10) })).toBe('Vence em 10 dias');
    expect(e.rotulo({ ...base, validade: dia(40) })).toBe('Em dia');
    expect(e.rotulo({ ...base, validade: dia(-1) })).toBe('Vencido');
  });
  it('recusa entrada inválida', async () => {
    const e = new EstoqueComponent();
    e.nome = 'Arroz'; e.un = 'kg'; e.qtd = 0; e.val = dia(30);
    await e.entrada();
    expect(e.erro).toContain('Preencha');
  });
  it('recusa saída maior que o saldo', async () => {
    const e = new EstoqueComponent();
    e.nome = 'Arroz'; e.un = 'kg'; e.qtd = 5; e.val = dia(30);
    await e.entrada(); await espera();
    e.selId = e.lista[0].id!; e.sqtd = 9;
    await e.saida();
    expect(e.erro).toBe('Quantidade maior que o saldo disponível.');
  });
});

describe('Integração: fluxo completo do MVP', () => {
  it('estoque: entrada, saída, descarte e histórico de movimentações', async () => {
    const e = new EstoqueComponent();
    e.nome = 'Arroz'; e.un = 'kg'; e.qtd = 10; e.val = dia(5);
    await e.entrada(); await espera();
    expect(e.lista[0].quantidade).toBe(10);
    e.selId = e.lista[0].id!; e.sqtd = 4;
    await e.saida(); await espera();
    expect(e.lista[0].quantidade).toBe(6);
    await e.descartar(e.lista[0]); await espera();
    expect(e.lista).toHaveLength(0);
    const tipos = (await db.movimentacoes.toArray()).map(m => m.tipo);
    expect(tipos).toEqual(['entrada', 'saida', 'descarte']);
    expect((await db.alimentos.toArray())[0].status).toBe('esgotado');
  });
  it('família, entrega e relatório por período', async () => {
    const f = new FamiliasComponent();
    f.nome = 'Ana Lima'; f.end = 'Rua das Flores, 120'; f.pes = 4;
    await f.salvar(); await espera();
    expect(f.lista).toHaveLength(1);
    f.cestas[f.lista[0].id!] = 0;
    await f.atender(f.lista[0]);
    expect(f.erro).toContain('cestas');
    f.cestas[f.lista[0].id!] = 2;
    await f.atender(f.lista[0]);
    expect(f.ok).toContain('Entrega registrada');
    const r = new RelatorioComponent();
    r.ini = dia(-1); r.fim = dia(1);
    await r.gerar();
    expect(r.res).toMatchObject({ at: 1, fam: 1, ces: 2 });
  });
  it('relatório recusa período inválido e ignora entregas fora do período', async () => {
    const r = new RelatorioComponent();
    r.ini = dia(5); r.fim = dia(1);
    await r.gerar();
    expect(r.erro).toContain('período válido');
    await db.atendimentos.add({ familiaId: 1, data: '2020-01-01', cestas: 3 });
    r.ini = dia(-1); r.fim = dia(1); await r.gerar();
    expect(r.res?.at).toBe(0);
  });
  it('exporta a cópia de segurança em JSON', async () => {
    let conteudo = '';
    const clique = vi.fn();
    (globalThis as any).document = { createElement: () => ({ click: clique, set href(_v: string) {}, get href() { return 'x'; }, download: '' }) };
    (globalThis as any).URL.createObjectURL = (b: Blob) => { b.text().then(t => (conteudo = t)); return 'blob:x'; };
    (globalThis as any).URL.revokeObjectURL = () => {};
    await db.familias.add({ responsavel: 'A', endereco: 'B', pessoas: 1, dataCadastro: hoje(), status: 'ativo', chave: 'a|b' });
    await new RelatorioComponent().exportar(); await espera();
    expect(clique).toHaveBeenCalled();
    expect(JSON.parse(conteudo).familias).toHaveLength(1);
  });
  it('login e menu: fluxo de entrada e saída', async () => {
    const auth = new AuthService();
    const nav = vi.fn();
    const l = new LoginComponent(auth, { navigate: nav } as any);
    await espera();
    expect(l.primeiro).toBe(true);
    l.senha = 'curta'; await l.enviar();
    expect(l.erro).toContain('8 caracteres');
    l.senha = 'senhaSegura1'; await l.enviar();
    expect(nav).toHaveBeenCalledWith(['/menu']);
    const l2 = new LoginComponent(auth, { navigate: nav } as any); await espera();
    l2.senha = 'errada123'; await l2.enviar();
    expect(l2.erro).toContain('incorreta');
    const m = new MenuComponent(auth, { navigate: nav } as any);
    m.sair();
    expect(auth.ativa()).toBe(false);
  });
});
