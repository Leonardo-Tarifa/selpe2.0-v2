export type UserRole = 'aluno' | 'monitor' | 'coordenador' | 'secretaria';

export interface UserPayload {
  uid: string;
  role: UserRole;
  associacaoId?: string;
  nome: string;
  cpf: string;
  email?: string;
}
