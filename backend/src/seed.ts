import { auth, firestore } from './shared/firebase/admin.js';
import { getBrasiliaNow } from './shared/utils/date.js';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados do SELPE baseado no selpe.sql...');

  const agora = getBrasiliaNow().toISOString();

  // 1. Criar Associações Parceiras (conforme wireframe oficial SELPE)
  const associacoes = [
    {
      id: 'assoc-amigos-bem',
      nome: 'ASSOCIAÇÃO AMIGOS DO BEM',
      cnpj: '53.123.456/0001-99',
      endereco: 'Av. Gov. Mario Covas Jr. 1234 - Orla da Praia, Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-pernas-pau',
      nome: 'ASSOCIAÇÃO PERNAS DE PAU',
      cnpj: '53.123.456/0002-88',
      endereco: 'Rua das Gaivotas, 450 - Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-e-noix',
      nome: 'É NOIX',
      cnpj: '53.123.456/0003-77',
      endereco: 'Av. Padre Anchieta, 2200 - Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-quase-nada',
      nome: 'QUASE NADA',
      cnpj: '53.123.456/0004-66',
      endereco: 'Av. Luciano de Bona, 300 - Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-tudo-indo',
      nome: 'TUDO INDO',
      cnpj: '53.123.456/0005-55',
      endereco: 'Rua Riachuelo, 120 - Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-traz-volta',
      nome: 'TRAZ DE VOLTA',
      cnpj: '53.123.456/0006-44',
      endereco: 'Av. 24 de Dezembro, 800 - Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'assoc-centro',
      nome: 'Polo Esportivo Central de Peruíbe',
      cnpj: '53.123.456/0007-33',
      endereco: 'Av. Padre Anchieta, 1000 - Centro, Peruíbe - SP',
      ativo: true,
      criadoEm: agora,
    },
  ];

  for (const assoc of associacoes) {
    await firestore.collection('associacoes').doc(assoc.id).set(assoc);
  }
  console.log('✅ Associações oficiais cadastradas (Amigos do Bem, Pernas de Pau, É Noix, etc.)');

  // 2. Criar Unidades Esportivas (conforme selpe.sql)
  const unidades = [
    {
      id: 'unidade-1',
      id_unidade: 1,
      nome: 'Unidade Esportiva Central',
      endereco: 'Endereço de teste',
      numero: '100',
      bairro: 'Centro',
      cidade: 'Peruíbe',
      estado: 'SP',
      cep: '11750-000',
      telefone: '(13) 3451-1000',
      ativo: true,
      criadoEm: agora,
    },
    {
      id: 'unidade-2',
      id_unidade: 2,
      nome: 'Unidade Esportiva Norte',
      endereco: 'Endereço de teste',
      numero: '200',
      bairro: 'Bairro Norte',
      cidade: 'Peruíbe',
      estado: 'SP',
      cep: '11750-000',
      telefone: '(13) 3451-2000',
      ativo: true,
      criadoEm: agora,
    },
  ];

  for (const u of unidades) {
    await firestore.collection('unidades').doc(u.id).set(u);
  }
  console.log('✅ Unidades cadastradas (Central, Norte)');

  // 3. Criar Horários (conforme selpe.sql)
  const horarios = [
    { id: 'horario-1', id_horario: 1, diaSemana: 'segunda', horaInicio: '08:00:00', horaFim: '09:00:00', ativo: true },
    { id: 'horario-2', id_horario: 2, diaSemana: 'segunda', horaInicio: '09:00:00', horaFim: '10:00:00', ativo: true },
    { id: 'horario-3', id_horario: 3, diaSemana: 'terca', horaInicio: '14:00:00', horaFim: '15:00:00', ativo: true },
    { id: 'horario-4', id_horario: 4, diaSemana: 'quarta', horaInicio: '15:00:00', horaFim: '16:00:00', ativo: true },
    { id: 'horario-5', id_horario: 5, diaSemana: 'quinta', horaInicio: '16:00:00', horaFim: '17:00:00', ativo: true },
    { id: 'horario-6', id_horario: 6, diaSemana: 'sexta', horaInicio: '17:00:00', horaFim: '18:00:00', ativo: true },
  ];

  for (const h of horarios) {
    await firestore.collection('horarios').doc(h.id).set(h);
  }
  console.log('✅ Horários cadastrados (6 horários padrão)');

  // 4. Criar Modalidades (conforme imagem oficial do SELPE)
  const modalidades = [
    { id: 'mod-1', id_modalidade: 1, nome: 'Futebol', descricao: 'Atividade esportiva de futebol', faixaEtariaMinima: 7, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-2', id_modalidade: 2, nome: 'Futsal', descricao: 'Atividade esportiva de futsal', faixaEtariaMinima: 7, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-3', id_modalidade: 3, nome: 'Surf', descricao: 'Aulas e treinos de surf no litoral', faixaEtariaMinima: 7, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-4', id_modalidade: 4, nome: 'Basquete', descricao: 'Atividade esportiva de basquetebol', faixaEtariaMinima: 10, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-5', id_modalidade: 5, nome: 'Vôlei', descricao: 'Atividade esportiva de voleibol', faixaEtariaMinima: 10, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-6', id_modalidade: 6, nome: 'Judô', descricao: 'Arte marcial e disciplina de judô', faixaEtariaMinima: 6, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-7', id_modalidade: 7, nome: 'Boxe', descricao: 'Treinamento e prática de boxe', faixaEtariaMinima: 12, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-8', id_modalidade: 8, nome: 'Handebol', descricao: 'Prática esportiva de handebol', faixaEtariaMinima: 8, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-9', id_modalidade: 9, nome: 'Capoeira', descricao: 'Expressão cultural e esporte de capoeira', faixaEtariaMinima: 6, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-10', id_modalidade: 10, nome: 'Karatê', descricao: 'Arte marcial e treinamento de karatê', faixaEtariaMinima: 6, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-11', id_modalidade: 11, nome: 'Ginástica', descricao: 'Ginástica artística e rítmica', faixaEtariaMinima: 5, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-12', id_modalidade: 12, nome: 'Xadrez', descricao: 'Esporte da mente e raciocínio lógico', faixaEtariaMinima: 6, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
    { id: 'mod-13', id_modalidade: 13, nome: 'Tênis', descricao: 'Prática e treinos de tênis', faixaEtariaMinima: 7, faixaEtariaMaxima: 17, associacaoId: 'assoc-centro', ativo: true, criadoEm: agora },
  ];

  for (const m of modalidades) {
    await firestore.collection('modalidades').doc(m.id).set(m);
  }
  console.log('✅ Modalidades cadastradas (Futsal, Futebol, Surf, Basquete, Vôlei, Judô, Boxe, Handebol, Capoeira, Karatê, Ginástica, Xadrez, Tênis)');


  // Helper para criar ou recuperar usuários no Firebase Auth
  async function createOrGetUser(email: string, pass: string, name: string) {
    try {
      return await auth.createUser({
        email,
        password: pass,
        displayName: name,
      });
    } catch (err: any) {
      try {
        return await auth.getUserByEmail(email);
      } catch (e) {
        throw err;
      }
    }
  }

  // 5. Criar Usuário Admin (Secretaria)
  const adminFb = await createOrGetUser('admin@selpe.peruibe.sp.gov.br', 'senhaSegura123', 'Administrador SELPE');
  await auth.setCustomUserClaims(adminFb.uid, { role: 'secretaria' });
  await firestore.collection('users').doc(adminFb.uid).set({
    uid: adminFb.uid,
    login: 'admin',
    nome: 'Administrador SELPE',
    cpf: '52998224725',
    email: 'admin@selpe.peruibe.sp.gov.br',
    telefone: '(13) 3451-1000',
    role: 'secretaria',
    associacaoId: 'assoc-centro',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Usuário Secretaria criado (admin)');

  // 6. Criar Usuário Professor (conforme selpe.sql: login "professor", senha "1234")
  // Observação: Como Firebase Auth exige no mínimo 6 caracteres para senhas via SDK em alguns modos, cadastramos '123456' e '1234' se possível.
  const professorPass = '123456';
  const professorFb = await createOrGetUser('professor@teste.com', professorPass, 'Professor Teste');
  await auth.setCustomUserClaims(professorFb.uid, {
    role: 'monitor',
    associacaoId: 'assoc-centro',
  });
  await firestore.collection('users').doc(professorFb.uid).set({
    uid: professorFb.uid,
    id_usuario: 2,
    id_professor: 1,
    login: 'professor',
    nome: 'Professor Teste',
    cpf: '11111111111',
    cpfFormatted: '111.111.111-11',
    telefone: '(13) 98888-8888',
    email: 'professor@teste.com',
    codigoProfessor: 'PROF001',
    especialidade: 'Educação Física',
    role: 'monitor',
    associacaoId: 'assoc-centro',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Usuário Professor criado (login: professor / senha: 1234 / 123456)');

  // 7. Criar Usuário Aluno (conforme selpe.sql: login "aluno", senha "1234")
  const alunoPass = '123456';
  const alunoFb = await createOrGetUser('aluno@teste.com', alunoPass, 'Aluno Teste');
  await auth.setCustomUserClaims(alunoFb.uid, {
    role: 'aluno',
    associacaoId: 'assoc-centro',
  });
  await firestore.collection('users').doc(alunoFb.uid).set({
    uid: alunoFb.uid,
    id_usuario: 1,
    id_aluno: 1,
    login: 'aluno',
    nome: 'Aluno Teste',
    cpf: '00000000000',
    cpfFormatted: '000.000.000-00',
    dataNascimento: '2010-01-01',
    telefone: '(13) 99999-9999',
    email: 'aluno@teste.com',
    endereco: 'Endereço de teste',
    bairro: 'Centro',
    cidade: 'Peruíbe',
    estado: 'SP',
    role: 'aluno',
    associacaoId: 'assoc-centro',
    numeroMatricula: '2026-000001',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Usuário Aluno criado (login: aluno / senha: 1234 / 123456)');

  // 8. Criar Turma (conforme selpe.sql: Futebol - Turma A)
  const turmaRef = firestore.collection('turmas').doc('turma-1');
  await turmaRef.set({
    id: 'turma-1',
    id_turma: 1,
    nomeTurma: 'Futebol - Turma A',
    modalidadeId: 'mod-1',
    modalidadeNome: 'Futebol',
    unidadeId: 'unidade-1',
    unidadeNome: 'Unidade Esportiva Central',
    monitorId: professorFb.uid,
    professorNome: 'Professor Teste',
    horarioId: 'horario-1',
    diasSemana: ['segunda'],
    horarioInicio: '08:00',
    horarioFim: '09:00',
    capacidadeMax: 30,
    vagasDisponiveis: 29,
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Turma cadastrada: Futebol - Turma A (Segunda, 08:00 - 09:00, Unidade Central)');

  // 9. Criar Inscrição / Matrícula (conforme selpe.sql)
  const matriculaRef = firestore.collection('matriculas').doc('inscricao-1');
  await matriculaRef.set({
    id: 'inscricao-1',
    id_inscricao: 1,
    alunoId: alunoFb.uid,
    alunoNome: 'Aluno Teste',
    turmaId: 'turma-1',
    turmaNome: 'Futebol - Turma A',
    modalidadeId: 'mod-1',
    modalidadeNome: 'Futebol',
    status: 'ativo',
    dataInscricao: agora,
    criadoEm: agora,
  });
  console.log('✅ Inscrição / Matrícula cadastrada para Aluno Teste na turma Futebol - Turma A');

  // 10. Criar Frequência Inicial (conforme selpe.sql / schema oficial)
  const chamadaRef = firestore.collection('chamadas').doc('frequencia-1');
  await chamadaRef.set({
    id: 'frequencia-1',
    turmaId: 'turma-1',
    data: getBrasiliaNow().toISOString().split('T')[0],
    monitorId: professorFb.uid,
    presentes: [alunoFb.uid],
    ausentes: [],
    observacoes: 'Presença confirmada',
    fechadaEm: agora,
    criadoEm: agora,
    sincronizadoOffline: false,
  });
  // 11. Criar Coordenador Oficial do Wireframe (Augusto Figueiredo - Amigos do Bem)
  const coordFb = await createOrGetUser('coordenador@teste.com', '123456', 'Augusto Figueiredo');
  await auth.setCustomUserClaims(coordFb.uid, {
    role: 'coordenador',
    associacaoId: 'assoc-amigos-bem',
  });
  await firestore.collection('users').doc(coordFb.uid).set({
    uid: coordFb.uid,
    login: 'coordenador',
    nome: 'Augusto Figueiredo',
    cpf: '22222222222',
    cpfFormatted: '222.222.222-22',
    telefone: '(13) 98765-4321',
    email: 'coordenador@teste.com',
    cargo: 'Coordenador Esportivo',
    role: 'coordenador',
    associacaoId: 'assoc-amigos-bem',
    associacaoNome: 'ASSOCIAÇÃO AMIGOS DO BEM',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Coordenador Augusto Figueiredo cadastrado (login: coordenador / senha: 123456)');

  // 12. Criar Monitor Pedro Magalhães (do wireframe)
  const pedroFb = await createOrGetUser('monitor.pedro@teste.com', '123456', 'Pedro Magalhães');
  await auth.setCustomUserClaims(pedroFb.uid, {
    role: 'monitor',
    associacaoId: 'assoc-amigos-bem',
  });
  await firestore.collection('users').doc(pedroFb.uid).set({
    uid: pedroFb.uid,
    login: 'pedro',
    nome: 'Pedro Magalhães',
    cpf: '33333333333',
    cpfFormatted: '333.333.333-33',
    telefone: '(13) 98111-2222',
    email: 'monitor.pedro@teste.com',
    codigoProfessor: 'PROF002',
    especialidade: 'Futsal e Esportes Coletivos',
    role: 'monitor',
    associacaoId: 'assoc-amigos-bem',
    associacaoNome: 'ASSOCIAÇÃO AMIGOS DO BEM',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Monitor Pedro Magalhães cadastrado (login: pedro / senha: 123456)');

  // 13. Criar Usuário Secretaria Oficial
  const secOficialFb = await createOrGetUser('secretaria@teste.com', '123456', 'Secretaria de Esportes e Lazer');
  await auth.setCustomUserClaims(secOficialFb.uid, { role: 'secretaria' });
  await firestore.collection('users').doc(secOficialFb.uid).set({
    uid: secOficialFb.uid,
    login: 'secretaria',
    nome: 'Secretaria de Esportes e Lazer',
    cpf: '44444444444',
    cpfFormatted: '444.444.444-44',
    email: 'secretaria@teste.com',
    telefone: '(13) 3451-1000',
    role: 'secretaria',
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Usuário Secretaria Oficial criado (login: secretaria / senha: 123456)');

  // 14. Criar Turmas da Associação Amigos do Bem do Wireframe
  const turmaFutevolei = firestore.collection('turmas').doc('turma-futevolei');
  await turmaFutevolei.set({
    id: 'turma-futevolei',
    nomeTurma: 'Futevôlei - Arena',
    modalidadeId: 'mod-9',
    modalidadeNome: 'Futevôlei',
    associacaoId: 'assoc-amigos-bem',
    associacaoNome: 'ASSOCIAÇÃO AMIGOS DO BEM',
    unidadeId: 'unidade-arena',
    unidadeNome: 'Arena da Praia - Av. Gov. Mario Covas Jr. 1234',
    monitorId: pedroFb.uid,
    professorNome: 'Pedro Magalhães',
    coordenadorNome: 'Augusto Figueiredo',
    diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    horarios: ['08:00', '09:00', '18:00', '19:00'],
    horarioInicio: '08:00',
    horarioFim: '09:00',
    capacidadeMax: 30,
    vagasDisponiveis: 28,
    ativo: true,
    criadoEm: agora,
  });

  const turmaFutsalCaraguava = firestore.collection('turmas').doc('turma-futsal-caraguava');
  await turmaFutsalCaraguava.set({
    id: 'turma-futsal-caraguava',
    nomeTurma: 'Futsal Polo Caraguava',
    modalidadeId: 'mod-2',
    modalidadeNome: 'Futsal',
    associacaoId: 'assoc-amigos-bem',
    associacaoNome: 'ASSOCIAÇÃO AMIGOS DO BEM',
    unidadeId: 'unidade-caraguava',
    unidadeNome: 'Polo Esportivo Caraguava - Av. Principal, 500',
    monitorId: pedroFb.uid,
    professorNome: 'Pedro Magalhães',
    coordenadorNome: 'Augusto Figueiredo',
    diasSemana: ['segunda', 'quarta', 'sexta'],
    horarios: ['08:00', '09:00', '18:00', '19:00'],
    horarioInicio: '08:00',
    horarioFim: '09:00',
    capacidadeMax: 30,
    vagasDisponiveis: 22,
    ativo: true,
    criadoEm: agora,
  });
  console.log('✅ Turmas do wireframe cadastradas (Futevôlei - Arena e Futsal Polo Caraguava)');

  // 15. Check-ins de Visitas Técnicas do Coordenador (Wireframe Página 8)
  const checkinsWireframe = [
    {
      id: 'checkin-1',
      userId: coordFb.uid,
      userName: 'Augusto Figueiredo',
      role: 'coordenador',
      associacaoId: 'assoc-amigos-bem',
      polo: 'FUTEVOLEI ARENA',
      modalidade: 'Futevôlei',
      horario: '08:00',
      data: '2026-08-22',
      dataHoraServidor: '2026-08-22T08:05:00.000Z',
      enderecoAproximado: 'Av. Gov. Mario Covas Jr. 1234',
      observacoes: 'Visita técnica realizada com sucesso. Condições da quadra e equipamentos aprovados.',
      sincronizado: true,
    },
    {
      id: 'checkin-2',
      userId: coordFb.uid,
      userName: 'Augusto Figueiredo',
      role: 'coordenador',
      associacaoId: 'assoc-amigos-bem',
      polo: 'BEACH TENIS',
      modalidade: 'Beach Tênis',
      horario: '17:00',
      data: '2026-08-23',
      dataHoraServidor: '2026-08-23T17:02:00.000Z',
      enderecoAproximado: 'Arena da Praia, Posto 2',
      observacoes: 'Acompanhamento do treino da tarde. Alta frequência de alunos.',
      sincronizado: true,
    },
    {
      id: 'checkin-3',
      userId: coordFb.uid,
      userName: 'Augusto Figueiredo',
      role: 'coordenador',
      associacaoId: 'assoc-amigos-bem',
      polo: 'FUTSAL CARAGUAVA',
      modalidade: 'Futsal',
      horario: '09:00',
      data: '2026-08-23',
      dataHoraServidor: '2026-08-23T09:10:00.000Z',
      enderecoAproximado: 'Polo Caraguava',
      observacoes: 'Visita técnica sem intercorrências.',
      sincronizado: true,
    },
    {
      id: 'checkin-4',
      userId: coordFb.uid,
      userName: 'Augusto Figueiredo',
      role: 'coordenador',
      associacaoId: 'assoc-amigos-bem',
      polo: 'TENIS DE MESA JD BRASIL',
      modalidade: 'Tênis de Mesa',
      horario: '19:00',
      data: '2026-08-25',
      dataHoraServidor: '2026-08-25T19:04:00.000Z',
      enderecoAproximado: 'Ginásio Jardim Brasil',
      observacoes: 'Supervisão do treino noturno.',
      sincronizado: true,
    },
    {
      id: 'checkin-5',
      userId: coordFb.uid,
      userName: 'Augusto Figueiredo',
      role: 'coordenador',
      associacaoId: 'assoc-amigos-bem',
      polo: 'ATLETISMO BECHIR',
      modalidade: 'Atletismo',
      horario: '18:00',
      data: '2026-08-26',
      dataHoraServidor: '2026-08-26T18:00:00.000Z',
      enderecoAproximado: 'Complexo Esportivo Bechir',
      observacoes: 'Treino técnico de velocidade supervisionado.',
      sincronizado: true,
    },
  ];

  for (const c of checkinsWireframe) {
    await firestore.collection('checkins_profissionais').doc(c.id).set(c);
  }
  console.log('✅ Visitas técnicas de teste do Coordenador inseridas (Página 8 do wireframe)');

  console.log('🎉 Seed do SELPE baseado no selpe.sql finalizado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
