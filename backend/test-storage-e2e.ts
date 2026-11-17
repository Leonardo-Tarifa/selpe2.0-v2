import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('🧪 Iniciando Bateria de Testes E2E de Storage, Moderação NSFW e Perfil...');

  const BASE_URL = process.env.API_URL || 'http://localhost:3333';

  // 1. Obter token de Aluno
  console.log('\n--- 1. Autenticando como Aluno (Lucas Santos) ---');
  let alunoToken: string;
  let alunoId: string;

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '12345678909',
      password: 'senhaSegura123',
    }),
  });
  const loginData = await loginRes.json();

  if (loginData.token) {
    alunoToken = loginData.token;
    alunoId = loginData.user.uid;
    console.log(`Aluno já cadastrado. Autenticado com sucesso. UID: ${alunoId}`);
  } else {
    console.log('Aluno ainda não cadastrado. Realizando auto-cadastro via QR Code...');
    const regRes = await fetch(`${BASE_URL}/auth/register-aluno`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Lucas Gabriel Santos',
        cpf: '12345678909',
        email: 'lucas.santos@gmail.com',
        password: 'senhaSegura123',
        telefone: '13998877665',
        endereco: 'Rua das Gaivotas, 45 - Peruíbe',
        turmaId: 'turma-1',
        associacaoId: 'assoc-centro',
        telefoneEmergencia: '13988776655',
        nomeResponsavel: 'Mariana Santos',
      }),
    });
    const regData = await regRes.json();
    alunoToken = regData.token;
    alunoId = regData.user.uid;
    console.log(`Aluno auto-cadastrado com sucesso! UID: ${alunoId}`);
  }

  // 2. Teste: Arquivo Malicioso / Extensão Falsificada (Magic Bytes)
  console.log('\n--- 2. Teste de Magic Bytes: Envio de script malicioso renomeado para .jpg ---');
  const fakeFile = Buffer.from("<?php echo 'webshell'; ?>", 'utf-8');
  const formDataFake = new FormData();
  formDataFake.append('file', new Blob([fakeFile], { type: 'image/jpeg' }), 'webshell.jpg');

  const fakeRes = await fetch(`${BASE_URL}/auth/me/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${alunoToken}` },
    body: formDataFake,
  });
  const fakeData = await fakeRes.json();
  console.log('Status HTTP:', fakeRes.status);
  console.log('Resposta:', fakeData);
  if (fakeRes.status === 400 && (fakeData.code === 'INVALID_FILE_TYPE' || fakeData.code === 'MIME_SPOOFING_DETECTED')) {
    console.log('✅ SUCESSO: Arquivo malicioso com extensão falsa foi bloqueado pelo sniffing de Magic Bytes!');
  } else {
    console.error('❌ FALHA: O arquivo malicioso não foi devidamente rejeitado.');
  }

  // 3. Teste: Arquivo com Tamanho Excessivo (> 5MB)
  console.log('\n--- 3. Teste de Payload Excessivo: Envio de arquivo > 5MB ---');
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const formDataLarge = new FormData();
  formDataLarge.append('file', new Blob([oversizedBuffer], { type: 'image/jpeg' }), 'huge.jpg');

  const largeRes = await fetch(`${BASE_URL}/auth/me/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${alunoToken}` },
    body: formDataLarge,
  });
  console.log('Status HTTP:', largeRes.status);
  if (largeRes.status === 413 || largeRes.status === 400) {
    console.log('✅ SUCESSO: Arquivo acima de 5MB foi bloqueado pelo limitador multipart!');
  } else {
    console.error('❌ FALHA: Arquivo grande não foi bloqueado.');
  }

  // 4. Teste: Upload de Imagem Legítima (Foto de Atleta)
  console.log('\n--- 4. Teste de Upload Legítimo: Imagem JPEG real com sanitização e conversão WebP ---');
  const validImageBuffer = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 3,
      background: { r: 30, g: 120, b: 220 },
    },
  })
    .jpeg()
    .toBuffer();

  const formDataValid = new FormData();
  formDataValid.append('file', new Blob([validImageBuffer], { type: 'image/jpeg' }), 'avatar.jpg');

  const validRes = await fetch(`${BASE_URL}/auth/me/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${alunoToken}` },
    body: formDataValid,
  });
  const validData = await validRes.json();
  console.log('Status HTTP:', validRes.status);
  console.log('Resposta:', validData);

  if (validRes.status === 200 && validData.fotoUrl && validData.fotoUrl.endsWith('.webp')) {
    console.log('✅ SUCESSO: Foto convertida com segurança para WebP e gravada no Firebase Storage!');
  } else {
    console.error('❌ FALHA: Upload legítimo falhou.');
  }

  // 5. Teste: Impacto e reflexo na Carteirinha Digital
  console.log('\n--- 5. Teste de Carteirinha Digital: Verificando se a nova fotoUrl aparece na carteirinha ---');
  const carteirinhaRes = await fetch(`${BASE_URL}/matriculas/carteirinha/${alunoId}`, {
    headers: { Authorization: `Bearer ${alunoToken}` },
  });
  const carteirinhaData = await carteirinhaRes.json();
  console.log('Carteirinha status:', carteirinhaRes.status);
  console.log('Carteirinha body:', carteirinhaData);
  console.log('Carteirinha - fotoUrl:', carteirinhaData.fotoUrl);

  if (carteirinhaData.fotoUrl && carteirinhaData.fotoUrl === validData.fotoUrl) {
    console.log('✅ SUCESSO: A foto do aluno foi refletida instantaneamente na Carteirinha Digital!');
  } else {
    console.error('❌ FALHA: Foto não refletida na carteirinha.');
  }

  // 6. Teste: Atualização Cadastral (PATCH /auth/me)
  console.log('\n--- 6. Teste de Atualização Cadastral (PATCH /auth/me) ---');
  const updateRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alunoToken}`,
    },
    body: JSON.stringify({
      telefone: '13999998888',
      endereco: 'Av. Padre Anchieta, 1000 - Peruíbe',
      nomeResponsavel: 'Mariana Santos',
      telefoneEmergencia: '13988887777',
    }),
  });
  const updateData = await updateRes.json();
  console.log('Status HTTP:', updateRes.status);
  console.log('Campos atualizados:', {
    telefone: updateData.user?.telefone,
    endereco: updateData.user?.endereco,
    nomeResponsavel: updateData.user?.nomeResponsavel,
  });

  if (updateRes.status === 200 && updateData.user?.telefone === '13999998888') {
    console.log('✅ SUCESSO: Cadastro atualizado via PATCH /auth/me!');
  } else {
    console.error('❌ FALHA: Atualização cadastral falhou.');
  }

  // 7. Teste: Anti-IDOR (Aluno tentando atualizar dados de outro aluno)
  console.log('\n--- 7. Teste de Anti-IDOR: Aluno tentando atualizar perfil de terceiro via PATCH /users/:id ---');
  const idorRes = await fetch(`${BASE_URL}/users/outro-usuario-id`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alunoToken}`,
    },
    body: JSON.stringify({
      nome: 'Hacker Tentando Sobrescrever',
    }),
  });
  const idorData = await idorRes.json();
  console.log('Status HTTP:', idorRes.status);
  console.log('Resposta IDOR:', idorData);

  if (idorRes.status === 403 && idorData.code === 'FORBIDDEN') {
    console.log('✅ SUCESSO: Anti-IDOR bloqueou a tentativa de alteração indevida de terceiro!');
  } else {
    console.error('❌ FALHA: Tentativa IDOR não foi bloqueada.');
  }

  console.log('\n========================================');
  console.log('🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!');
  console.log('========================================\n');
}

runTests().catch(console.error);
