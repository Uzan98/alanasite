#!/usr/bin/env node
// Utilitário para definir a senha do painel admin
// Uso: npm run set-password

const bcrypt   = require('bcrypt');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '..', '.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('\nDigite a nova senha para o painel admin: ', async (senha) => {
  rl.close();

  if (!senha || senha.length < 6) {
    console.error('\n❌ A senha deve ter pelo menos 6 caracteres.\n');
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 12);

  // Cria ou atualiza o .env
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  } else {
    envContent = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf-8');
  }

  if (envContent.includes('ADMIN_PASSWORD_HASH=')) {
    envContent = envContent.replace(/ADMIN_PASSWORD_HASH=.*/m, `ADMIN_PASSWORD_HASH=${hash}`);
  } else {
    envContent += `\nADMIN_PASSWORD_HASH=${hash}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');

  console.log('\n✅ Senha definida com sucesso! Hash salvo em .env\n');
  console.log('   Agora rode: npm start\n');
});
