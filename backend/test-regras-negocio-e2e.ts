import { cleanCPF } from './src/shared/utils/cpf.js';

function generateValidCPF(): string {
  const rnd = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rnd);
  let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0);
  d1 = 11 - (d1 % 11);
  d1 = d1 >= 10 ? 0 : d1;
  n.push(d1);
  let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0);
  d2 = 11 - (d2 % 11);
  d2 = d2 >= 10 ? 0 : d2;
  n.push(d2);
  return n.join('');
}

async function runBusinessRulesTests() {
  console.log('🚀 Iniciando Bateria de Testes E2E de Regras de Negócio do SELPE...\n');
  const BASE_URL = process.env.API_URL || 'http://localhost:3333';
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✅ [PASSOU] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FALHOU] ${testName}`, details || '');
      failedCount++;
    }
  }

  // =========================================================================
  // 1. Cadastro de Atleta Maior de Idade
  // =========================================================================
  console.log('--- Cenário 1: Cadastro de Atleta Maior de Idade (> 18 anos) ---');
  const adultCpf = generateValidCPF();
  const adultEmail = `atleta.adulto.${Date.now()}@selpe.teste`;
  const adultPass = 'senhaSegura123';

  const adultRes = await fetch(`${BASE_URL}/auth/register-aluno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Carlos Eduardo Oliveira',
      cpf: adultCpf,
      email: adultEmail,
      password: adultPass,
      telefone: '13998877112',
      endereco: 'Av. Padre Anchieta, 1200 - Peruíbe/SP',
      nomeResponsavel: 'Carlos Eduardo Oliveira',
      telefoneEmergencia: '13998877112',
      turmaId: 'turma-1',
      dataNascimento: '1995-04-12',
    }),
  });
  const adultData = await adultRes.json();

  assert(adultRes.status === 201, 'Status code é 201 Created para maior de idade');
  assert(typeof adultData.token === 'string', 'Retornou token JWT ativo');
  assert(adultData.user?.role === 'aluno', 'Role é "aluno"');
  assert(adultData.carteirinha?.modalidadeNome === 'Futebol', 'Carteirinha gerada vinculada à modalidade da turma');
  assert(typeof adultData.carteirinha?.qrValidationHash === 'string', 'Carteirinha possui hash de validação');

  // =========================================================================
  // 2. Cadastro de Atleta Menor de Idade (< 18 anos)
  // =========================================================================
  console.log('\n--- Cenário 2: Cadastro de Atleta Menor de Idade (< 18 anos) ---');
  const minorCpf = generateValidCPF();
  const minorEmail = `atleta.menor.${Date.now()}@selpe.teste`;
  const minorPass = 'senhaSegura123';

  const minorRes = await fetch(`${BASE_URL}/auth/register-aluno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Gabriel Souza Menor',
      cpf: minorCpf,
      email: minorEmail,
      password: minorPass,
      telefone: '13991122334',
      endereco: 'Rua das Flores, 88 - Centro - Peruíbe/SP',
      nomeResponsavel: 'Fernanda Souza',
      telefoneEmergencia: '13991122999',
      turmaId: 'turma-1',
      dataNascimento: '2012-09-20', // ~14 anos
    }),
  });
  const minorData = await minorRes.json();

  assert(minorRes.status === 202, 'Status code é 202 Accepted para menor de idade', minorData);
  assert(minorData.status === 'aguardando_responsavel', 'Status do cadastro é "aguardando_responsavel"');
  assert(typeof minorData.token === 'string' && minorData.token.length >= 32, 'Retornou token criptográfico de confirmação');
  assert(typeof minorData.linkResponsavel === 'string', 'Retornou link para o responsável');
  assert(!minorData.tokenJwt, 'Não emite token de sessão JWT ativa para o menor');

  const tokenResponsavel = minorData.token;

  // =========================================================================
  // 3. Bloqueio de Login para Menor Aguardando Responsável
  // =========================================================================
  console.log('\n--- Cenário 3: Tentativa de Login de Menor com Cadastro Pendente ---');
  const loginMinorRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: minorCpf,
      password: minorPass,
    }),
  });
  const loginMinorData = await loginMinorRes.json();

  assert(loginMinorRes.status === 403, 'Login bloqueado com HTTP 403');
  assert(loginMinorData.code === 'AGUARDANDO_RESPONSAVEL', 'Código de erro é AGUARDANDO_RESPONSAVEL');

  // =========================================================================
  // 4. Consulta Pública do Convite do Responsável
  // =========================================================================
  console.log('\n--- Cenário 4: Consulta Pública do Convite pelo Responsável Legal ---');
  const getConviteRes = await fetch(`${BASE_URL}/responsavel/convite/${tokenResponsavel}`);
  const getConviteData = await getConviteRes.json();

  assert(getConviteRes.status === 200, 'Consulta pública do token retorna 200 OK');
  assert(getConviteData.alunoPrimeiroNome === 'Gabriel', 'Identifica o primeiro nome do menor');
  assert(getConviteData.modalidadeNome === 'Futebol', 'Identifica a modalidade');
  assert(getConviteData.status === 'pendente', 'Status da solicitação é pendente');

  // =========================================================================
  // 5. Tentativa de Confirmação com Mesmo CPF do Menor
  // =========================================================================
  console.log('\n--- Cenário 5: Tentativa de Confirmação do Responsável com Mesmo CPF do Menor ---');
  const sameCpfRes = await fetch(`${BASE_URL}/responsavel/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokenResponsavel,
      nomeResponsavel: 'Fernanda Souza',
      cpfResponsavel: minorCpf, // CPF IDÊNTICO
      telefoneResponsavel: '13991122999',
      parentesco: 'mae',
      termoAceito: true,
    }),
  });
  const sameCpfData = await sameCpfRes.json();

  assert(sameCpfRes.status === 400, 'Rejeitado com HTTP 400');
  assert(sameCpfData.code === 'INVALID_RESPONSAVEL_CPF', 'Código INVALID_RESPONSAVEL_CPF');

  // =========================================================================
  // 6. Confirmação do Responsável Legal com Sucesso
  // =========================================================================
  console.log('\n--- Cenário 6: Confirmação Legítima do Responsável Legal ---');
  const guardianCpf = generateValidCPF();

  const confirmRes = await fetch(`${BASE_URL}/responsavel/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokenResponsavel,
      nomeResponsavel: 'Fernanda Souza Santos',
      cpfResponsavel: guardianCpf,
      telefoneResponsavel: '13991122999',
      parentesco: 'mae',
      termoAceito: true,
    }),
  });
  const confirmData = await confirmRes.json();

  assert(confirmRes.status === 200, 'Confirmação concluída com 200 OK', confirmData);
  assert(typeof confirmData.numeroMatricula === 'string', 'Matrícula ativada e retornada');
  assert(confirmData.carteirinha?.modalidadeNome === 'Futebol', 'Carteirinha gerada para o atleta confirmado');

  // =========================================================================
  // 7. Tentativa de Reutilização de Token de Confirmação (Single-Use)
  // =========================================================================
  console.log('\n--- Cenário 7: Tentativa de Reutilizar o Token de Confirmação ---');
  const reuseRes = await fetch(`${BASE_URL}/responsavel/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokenResponsavel,
      nomeResponsavel: 'Outro Responsavel',
      cpfResponsavel: generateValidCPF(),
      telefoneResponsavel: '13991122999',
      parentesco: 'pai',
      termoAceito: true,
    }),
  });
  const reuseData = await reuseRes.json();

  assert(reuseRes.status === 400, 'Reutilização rejeitada com HTTP 400');
  assert(reuseData.code === 'ALREADY_USED', 'Código ALREADY_USED');

  // =========================================================================
  // 8. Login do Aluno Pós-Confirmação
  // =========================================================================
  console.log('\n--- Cenário 8: Login do Menor Agora Ativado com Sucesso ---');
  const loginPostRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: minorCpf,
      password: minorPass,
    }),
  });
  const loginPostData = await loginPostRes.json();

  assert(loginPostRes.status === 200, 'Login do aluno agora aceito com HTTP 200 OK');
  assert(typeof loginPostData.token === 'string', 'Recebeu JWT de sessão ativo');
  const minorJwt = loginPostData.token;

  // =========================================================================
  // 9. Gerenciamento de Inscrições do Aluno (/auth/me/inscricoes)
  // =========================================================================
  console.log('\n--- Cenário 9: Inscrição em Nova Turma e Bloqueio de Duplicidade ---');
  // Tentativa de se inscrever na mesma turma que já está matriculado
  const dupRes = await fetch(`${BASE_URL}/auth/me/inscricoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${minorJwt}`,
    },
    body: JSON.stringify({ turmaId: 'turma-1' }),
  });
  const dupData = await dupRes.json();

  assert(dupRes.status === 409, 'Inscrição duplicada na mesma turma rejeitada com HTTP 409 Conflict');

  // =========================================================================
  // 10. Matriz de Autorização de Convites Profissionais (Anti-Privilege Escalation)
  // =========================================================================
  console.log('\n--- Cenário 10: Convites Profissionais e Prevenção de Escalação de Privilégios ---');
  // 10.1 Login Secretaria
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@selpe.peruibe.sp.gov.br',
      password: 'senhaSegura123',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const secretariaJwt = adminLoginData.token;
  assert(typeof secretariaJwt === 'string', 'Secretaria autenticada');

  // 10.2 Secretaria emite convite de Coordenador
  const coordInviteRes = await fetch(`${BASE_URL}/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretariaJwt}`,
    },
    body: JSON.stringify({
      role: 'coordenador',
      associacaoId: 'assoc-centro',
      modalidadesIds: ['mod-1'],
    }),
  });
  const coordInviteData = await coordInviteRes.json();
  assert(coordInviteRes.status === 201, 'Secretaria gerou convite para Coordenador com HTTP 201');
  const coordInviteToken = coordInviteData.token;

  // 10.3 Coordenador conclui cadastro via token
  const coordCpf = generateValidCPF();
  const coordAcceptRes = await fetch(`${BASE_URL}/convites/${coordInviteToken}/aceitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Coordenador Roberto Costa',
      cpf: coordCpf,
      email: `coord.roberto.${Date.now()}@selpe.teste`,
      password: 'senhaSegura123',
      telefone: '13988223344',
      endereco: 'Av. São João, 500 - Peruíbe/SP',
    }),
  });
  const coordAcceptData = await coordAcceptRes.json();
  assert(coordAcceptRes.status === 201, 'Coordenador aceitou convite e cadastrou-se com sucesso');
  const coordJwt = coordAcceptData.token;

  // 10.4 Coordenador tenta convidar outro Coordenador (deve falhar 403)
  const failCoordRes = await fetch(`${BASE_URL}/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordJwt}`,
    },
    body: JSON.stringify({
      role: 'coordenador',
      associacaoId: 'assoc-centro',
    }),
  });
  assert(failCoordRes.status === 403, 'Coordenador tentando convidar outro Coordenador é barrado (HTTP 403)');

  // 10.5 Coordenador tenta convidar Monitor para OUTRA associação (deve falhar 403)
  const failAssocRes = await fetch(`${BASE_URL}/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordJwt}`,
    },
    body: JSON.stringify({
      role: 'monitor',
      associacaoId: 'assoc-outra',
    }),
  });
  assert(failAssocRes.status === 403, 'Coordenador tentando convidar para outra associação é barrado (HTTP 403)');

  // 10.6 Coordenador convida Monitor para sua associação (deve ter sucesso 201)
  const monitorInviteRes = await fetch(`${BASE_URL}/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordJwt}`,
    },
    body: JSON.stringify({
      role: 'monitor',
      associacaoId: 'assoc-centro',
      modalidadesIds: ['mod-1'],
    }),
  });
  const monitorInviteData = await monitorInviteRes.json();
  assert(monitorInviteRes.status === 201, 'Coordenador gerou convite para Monitor da sua associação (HTTP 201)');
  const monitorInviteToken = monitorInviteData.token;

  // 10.7 Monitor aceita convite
  const monitorCpf = generateValidCPF();
  const monitorAcceptRes = await fetch(`${BASE_URL}/convites/${monitorInviteToken}/aceitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Monitor Juliana Santos',
      cpf: monitorCpf,
      email: `monitor.juliana.${Date.now()}@selpe.teste`,
      password: 'senhaSegura123',
      telefone: '13977665544',
      endereco: 'Rua do Porto, 12 - Peruíbe/SP',
    }),
  });
  const monitorAcceptData = await monitorAcceptRes.json();
  assert(monitorAcceptRes.status === 201, 'Monitor cadastrado com sucesso');
  const monitorJwt = monitorAcceptData.token;

  // =========================================================================
  // 11. Relatórios: Presets de Período, Observações no PDF e Permissões de Monitor
  // =========================================================================
  console.log('\n--- Cenário 11: Relatórios com Presets de Período, Observações e PDF ---');
  // 11.1 Consulta JSON com preset mensal e observações
  const repJsonRes = await fetch(
    `${BASE_URL}/relatorios/frequencia?turmaId=turma-1&periodoPreset=mensal&observacoes=Turma%20com%20excelente%20rendimento`,
    {
      headers: { Authorization: `Bearer ${secretariaJwt}` },
    }
  );
  const repJsonData = await repJsonRes.json();
  assert(repJsonRes.status === 200, 'Relatório de frequência JSON retornado com 200 OK');
  assert(repJsonData.periodo?.label?.includes('Mensal'), 'Período resolvido com preset Mensal');
  assert(repJsonData.observacoes === 'Turma com excelente rendimento', 'Observação preservada');

  // 11.2 Download de PDF de frequência
  const repPdfRes = await fetch(
    `${BASE_URL}/relatorios/frequencia/pdf?turmaId=turma-1&periodoPreset=mensal&observacoes=Turma%20com%20excelente%20rendimento`,
    {
      headers: { Authorization: `Bearer ${secretariaJwt}` },
    }
  );
  assert(repPdfRes.status === 200, 'PDF de frequência gerado com HTTP 200');
  assert(repPdfRes.headers.get('content-type')?.includes('application/pdf') === true, 'Header Content-Type é application/pdf');

  // 11.3 Monitor tentando acessar relatório quantitativo global da Secretaria (deve falhar 403)
  const failQuantRes = await fetch(`${BASE_URL}/relatorios/quantitativo`, {
    headers: { Authorization: `Bearer ${monitorJwt}` },
  });
  assert(failQuantRes.status === 403, 'Monitor tentando acessar quantitativo da Secretaria é bloqueado (HTTP 403)');

  // =========================================================================
  // 12. Relatório Quantitativo Executivo Global da Secretaria
  // =========================================================================
  console.log('\n--- Cenário 12: Relatório Quantitativo Executivo Global da Secretaria ---');
  const quantRes = await fetch(`${BASE_URL}/relatorios/quantitativo`, {
    headers: { Authorization: `Bearer ${secretariaJwt}` },
  });
  const quantData = await quantRes.json();

  assert(quantRes.status === 200, 'Relatório quantitativo JSON retornado com HTTP 200 OK');
  assert(typeof quantData.resumo?.totalAlunosGeral === 'number', 'Total geral de alunos calculado');
  assert(Array.isArray(quantData.modalidades), 'Lista de modalidades agregadas presente');
  assert(Array.isArray(quantData.associacoes), 'Lista de associações agregadas presente');

  // Download PDF do relatório quantitativo
  const quantPdfRes = await fetch(`${BASE_URL}/relatorios/quantitativo/pdf`, {
    headers: { Authorization: `Bearer ${secretariaJwt}` },
  });
  assert(quantPdfRes.status === 200, 'PDF executivo quantitativo gerado com HTTP 200 OK');
  assert(quantPdfRes.headers.get('content-type')?.includes('application/pdf') === true, 'Content-Type é application/pdf');

  console.log('\n======================================================');
  console.log(`📊 RESULTADO DOS TESTES: ${passedCount} Passaram | ${failedCount} Falharam`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runBusinessRulesTests().catch((err) => {
  console.error('❌ Erro fatal durante a execução dos testes:', err);
  process.exit(1);
});
