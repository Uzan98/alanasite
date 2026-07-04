# Site — Dra. Alana Chineider Librelon (Odontopediatria)

Site com página pública (informações, serviços, contato) e um **painel administrativo protegido por login**, onde é possível editar todos os textos, fotos e mensagens recebidas sem tocar em código.

## O que já vem pronto

- Site responsivo (celular, tablet, notebook), em tons de rosa pastel, com identidade visual própria (mascote de dentinho, formas orgânicas, tipografia lúdica).
- Seções: capa, sobre a Dra. Alana, serviços, diferenciais, depoimentos, dúvidas frequentes (FAQ), contato com formulário + botão de WhatsApp flutuante, política de privacidade.
- SEO: título e descrição configuráveis, dados estruturados (Schema.org "Dentist") para o Google entender que é um consultório odontológico local, `sitemap.xml` e `robots.txt`.
- Painel administrativo em `/admin` com:
  - Login com usuário e senha (senha nunca fica salva em texto puro, apenas um hash seguro).
  - Proteção contra tentativas repetidas de login (rate limiting).
  - Edição de todos os textos do site (capa, sobre, serviços, diferenciais, depoimentos, FAQ, contato, rodapé, SEO).
  - Upload da foto de perfil e da foto da seção "Sobre".
  - Visualização e exclusão das mensagens enviadas pelo formulário de contato.

## 1. Instalar e rodar localmente

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
cd odontopediatria-site
npm install
cp .env.example .env
npm run set-password
```

O comando `npm run set-password` vai perguntar a senha que você quer usar no painel admin e gravá-la (com segurança, como hash) no arquivo `.env`.

Abra o arquivo `.env` e defina também:
- `ADMIN_USERNAME` — o nome de usuário do login (ex: `alana`)
- `SESSION_SECRET` — troque pelo texto aleatório que preferir (só precisa fazer isso uma vez)

Depois, rode:

```bash
npm start
```

O site vai ficar disponível em `http://localhost:3000` e o painel admin em `http://localhost:3000/admin`.

## 2. Usando o painel administrativo

1. Acesse `/admin` (ou clique em "Acesso administrativo" no rodapé do site).
2. Entre com o usuário e a senha definidos no passo anterior.
3. Edite qualquer texto do site nos painéis (capa, sobre, serviços, etc.) e clique em **"Salvar alterações"** no final da página.
4. Para trocar as fotos, use os botões de upload no topo do painel — a foto é trocada na hora, sem precisar clicar em salvar.
5. Em **"Mensagens recebidas"**, você vê tudo o que foi enviado pelo formulário de contato do site.

Se esquecer a senha, rode `npm run set-password` novamente no servidor para definir uma nova.

## 3. Personalizando o que ainda está com texto de exemplo

Alguns campos vêm com um placeholder e devem ser ajustados no painel admin antes de publicar:

- **Cidade/UF** (aba SEO) — hoje está como "Sua Cidade / UF".
- **Telefone, WhatsApp, e-mail e endereço** (aba Contato).
- **Número do CRO** (aba Identidade).
- **Link do mapa**: no Google Maps, abra o endereço → "Compartilhar" → "Incorporar um mapa" → copie apenas o link que está dentro de `src="..."` e cole no campo "Link do mapa incorporado".
- **Convênios aceitos**: hoje há uma pergunta de exemplo no FAQ sobre isso — edite a resposta com a informação real.
- **Fotos**: enquanto uma foto real não é enviada, aparece uma imagem ilustrativa no lugar.

## 4. Publicando o site na internet

Este é um site com um pequeno servidor (Node.js/Express) por trás — por isso ele precisa de uma hospedagem que rode Node.js (não é só "arrastar arquivos" como em um site puramente estático). Algumas opções simples e com plano gratuito/baixo custo:

- [Render](https://render.com) (bem simples para projetos Node/Express)
- [Railway](https://railway.app)
- Uma VPS própria (ex: com Nginx + PM2 na frente do Node)

Ao publicar:
1. Configure as mesmas variáveis do `.env` no painel de "variáveis de ambiente" do serviço escolhido.
2. Defina `NODE_ENV=production` (isso ativa cookies de sessão seguros, exigindo HTTPS).
3. Atualize o `sitemap.xml` e as tags `og:url`/`canonical` com o domínio final (ex: `https://www.draalanaOdontopediatria.com.br`).
4. Cadastre o site no [Google Search Console](https://search.google.com/search-console) e envie o `sitemap.xml` para acelerar a indexação.
5. Crie/atualize o perfil da clínica no **Google Perfil da Empresa (Google Business)** — para uma odontopediatra, isso costuma ajudar tanto ou mais que o próprio site a aparecer nas buscas locais ("dentista infantil perto de mim").

## 5. Segurança — o que já está implementado

- Senha do admin nunca é armazenada em texto puro (hash com `bcrypt`).
- Sessão de login protegida por cookie `httpOnly`, `sameSite=strict` e (em produção) `secure` (exige HTTPS).
- Proteção CSRF nos formulários administrativos.
- Limite de tentativas de login por IP (10 tentativas a cada 15 minutos).
- Cabeçalhos de segurança HTTP via `helmet`.
- Rotas `/admin` e `/api` bloqueadas para indexação (`robots.txt`) e protegidas por login.

Recomendações extras para produção:
- Sempre publique com HTTPS (a maioria das hospedagens acima já oferece isso de forma automática/gratuita).
- Troque a senha periodicamente com `npm run set-password`.
- Faça backup do arquivo `data/content.json` de tempos em tempos.

## 6. Estrutura de arquivos

```
odontopediatria-site/
├── server.js                # servidor e todas as rotas
├── data/
│   ├── content.json         # todo o conteúdo editável do site
│   └── messages.json        # mensagens recebidas pelo formulário
├── views/                   # templates HTML (EJS)
│   ├── index.ejs            # página pública
│   ├── privacidade.ejs
│   └── admin/
│       ├── login.ejs
│       └── dashboard.ejs
├── public/
│   ├── css/                 # estilos do site e do admin
│   ├── js/                  # scripts do site e do admin
│   ├── images/uploads/      # fotos enviadas pelo painel admin
│   ├── robots.txt
│   └── sitemap.xml
└── scripts/set-admin-password.js
```

Qualquer texto também pode ser editado diretamente em `data/content.json`, se preferir — mas o painel admin foi feito justamente para isso não ser necessário.
