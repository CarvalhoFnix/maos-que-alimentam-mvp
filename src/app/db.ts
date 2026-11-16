import Dexie, { Table } from 'dexie';

export interface Familia { id?: number; responsavel: string; endereco: string; telefone?: string; pessoas: number; dataCadastro: string; status: 'ativo' | 'inativo'; chave: string; }
export interface Alimento { id?: number; nome: string; unidade: string; quantidade: number; validade: string; status: 'disponivel' | 'vencido' | 'esgotado'; }
export interface Movimentacao { id?: number; alimentoId: number; tipo: 'entrada' | 'saida' | 'descarte'; quantidade: number; data: string; atendimentoId?: number; }
export interface Atendimento { id?: number; familiaId: number; data: string; cestas: number; observacao?: string; }
export interface Config { chave: string; valor: any; }

class AppDb extends Dexie {
  familias!: Table<Familia, number>;
  alimentos!: Table<Alimento, number>;
  movimentacoes!: Table<Movimentacao, number>;
  atendimentos!: Table<Atendimento, number>;
  config!: Table<Config, string>;
  constructor() {
    super('maos-que-alimentam');
    this.version(1).stores({
      familias: '++id,&chave,status',
      alimentos: '++id,validade,status',
      movimentacoes: '++id,alimentoId,data',
      atendimentos: '++id,familiaId,data',
      config: 'chave'
    });
  }
}
export const db = new AppDb();
export const hoje = () => new Date().toISOString().slice(0, 10);
export const diasAte = (iso: string) => Math.round((new Date(iso).getTime() - new Date(hoje()).getTime()) / 864e5);
