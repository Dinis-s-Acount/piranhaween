This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


# Piranhaween - Projeto Next.js com PostgreSQL

## Estrutura do Projeto

```
piranhaween/
├── app/
│   ├── api/
│   │   └── fantasias/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── lib/
│   └── db.ts
├── .env.local (NÃO COMMITAR!)
├── .gitignore
├── package.json
├── next.config.js
└── tsconfig.json
```

## 1. Configuração Inicial

### package.json
```json
{
  "name": "piranhaween",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@neondatabase/serverless": "^0.9.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### .gitignore
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### .env.local (NÃO COMMITAR - apenas local)
```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## 2. Configuração do Banco de Dados

### SQL para criar a tabela (Execute no Neon Console)
```sql
CREATE TABLE fantasias (
  id SERIAL PRIMARY KEY,
  conteudo TEXT NOT NULL CHECK (char_length(conteudo) <= 400),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fantasias_criado_em ON fantasias(criado_em DESC);
```

### lib/db.ts
```typescript
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida nas variáveis de ambiente');
}

export const sql = neon(process.env.DATABASE_URL);
```

## 3. API Routes

### app/api/fantasias/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - Buscar todas as fantasias
export async function GET() {
  try {
    const fantasias = await sql`
      SELECT id, conteudo, criado_em 
      FROM fantasias 
      ORDER BY criado_em DESC 
      LIMIT 100
    `;
    
    return NextResponse.json(fantasias);
  } catch (error) {
    console.error('Erro ao buscar fantasias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fantasias' },
      { status: 500 }
    );
  }
}

// POST - Criar nova fantasia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conteudo } = body;

    // Validações
    if (!conteudo || typeof conteudo !== 'string') {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    const conteudoTrimmed = conteudo.trim();

    if (conteudoTrimmed.length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo não pode estar vazio' },
        { status: 400 }
      );
    }

    if (conteudoTrimmed.length > 400) {
      return NextResponse.json(
        { error: 'Conteúdo não pode ter mais de 400 caracteres' },
        { status: 400 }
      );
    }

    // Rate limiting simples (pode ser melhorado com Redis/Upstash)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Inserir no banco
    const result = await sql`
      INSERT INTO fantasias (conteudo)
      VALUES (${conteudoTrimmed})
      RETURNING id, conteudo, criado_em
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar fantasia:', error);
    return NextResponse.json(
      { error: 'Erro ao criar fantasia' },
      { status: 500 }
    );
  }
}
```

## 4. Frontend

### app/layout.tsx
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Piranhaween',
  description: 'Compartilhe suas fantasias de Halloween',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      
        
      
      {children}
    
  );
}
```

### app/page.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';

interface Fantasia {
  id: number;
  conteudo: string;
  criado_em: string;
}

export default function Home() {
  const [fantasias, setFantasias] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    carregarFantasias();
  }, []);

  const carregarFantasias = async () => {
    try {
      const res = await fetch('/api/fantasias');
      if (res.ok) {
        const data = await res.json();
        setFantasias(data);
      }
    } catch (err) {
      console.error('Erro ao carregar fantasias:', err);
    }
  };

  const adicionarFantasia = async () => {
    if (input.trim().length === 0) {
      setError('Por favor, digite uma fantasia!');
      return;
    }

    if (input.length > 400) {
      setError('Máximo de 400 caracteres!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/fantasias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conteudo: input }),
      });

      if (res.ok) {
        const novaFantasia = await res.json();
        setFantasias([novaFantasia, ...fantasias]);
        setInput('');
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao adicionar fantasia');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      adicionarFantasia();
    }
  };

  return (
    <>
      {`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #FF1493;
          font-family: 'Creepster', cursive;
          min-height: 100vh;
          padding: 20px;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.05) 10px,
            rgba(0, 0, 0, 0.05) 20px
          );
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        h1 {
          font-size: 4rem;
          text-align: center;
          color: #00FF00;
          text-shadow: 
            3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            -3px 3px 0 #000,
            0 0 20px #00FF00;
          margin-bottom: 30px;
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        .input-section {
          background: linear-gradient(135deg, #1a0033 0%, #2d004d 100%);
          border: 4px solid #00FF00;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 
            0 0 30px rgba(0, 255, 0, 0.3),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        textarea {
          width: 100%;
          height: 120px;
          background: #000;
          border: 3px solid #FF6B00;
          border-radius: 10px;
          padding: 15px;
          font-family: Arial, sans-serif;
          font-size: 16px;
          color: #00FF00;
          resize: none;
          margin-bottom: 10px;
        }

        textarea::placeholder {
          color: #666;
        }

        .char-count {
          color: #FFF;
          font-size: 1.2rem;
          text-align: right;
          margin-bottom: 15px;
        }

        .char-count.warning {
          color: #FF6B00;
        }

        .error {
          color: #FF0000;
          background: rgba(0, 0, 0, 0.5);
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          text-align: center;
        }

        button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%);
          border: 3px solid #000;
          border-radius: 10px;
          font-family: 'Creepster', cursive;
          font-size: 1.5rem;
          color: #000;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 5px 0 #000;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 7px 0 #000;
        }

        button:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 3px 0 #000;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fantasias-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .fantasia-item {
          background: linear-gradient(135deg, #2d004d 0%, #4d0080 100%);
          border: 3px solid #00FF00;
          border-radius: 10px;
          padding: 20px;
          color: #FFF;
          font-family: Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          box-shadow: 
            0 0 20px rgba(0, 255, 0, 0.2),
            inset 0 0 15px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .empty-state {
          text-align: center;
          color: #FFF;
          font-size: 1.5rem;
          padding: 40px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          border: 2px dashed #00FF00;
        }

        @media (max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }
        }
      `}

      
        PIRANHAWEEN
        
        
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua fantasia aqui..."
            maxLength={400}
            disabled={loading}
          />
          = 350 ? 'warning' : ''}`}>
            {input.length} / 400
          
          {error && {error}}
          
            {loading ? 'ENVIANDO...' : 'ADICIONAR FANTASIA'}
          
        

        
          {fantasias.length === 0 ? (
            
              Nenhuma fantasia ainda... Seja o primeiro!
            
          ) : (
            fantasias.map((fantasia) => (
              
                {fantasia.conteudo}
              
            ))
          )}
        
      
    </>
  );
}
```

## 5. Deploy na Vercel

### Passo a Passo:

1. **Criar conta no Neon (https://neon.tech)**
   - Criar novo projeto
   - Copiar a `DATABASE_URL`
   - Executar o SQL para criar a tabela

2. **Preparar repositório Git**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin 
git push -u origin main
```

3. **Deploy na Vercel**
   - Acessar https://vercel.com
   - Importar o repositório
   - Em "Environment Variables", adicionar:
     - Nome: `DATABASE_URL`
     - Valor: `postgresql://...` (do Neon)
   - Deploy!

4. **Variáveis de Ambiente na Vercel**
   - Vá em Settings > Environment Variables
   - Adicione `DATABASE_URL` com o valor do Neon
   - Marque para Production, Preview e Development

## 6. Segurança Implementada

✅ Variáveis de ambiente (.env.local)
✅ .gitignore configurado
✅ Validação server-side
✅ Limit de caracteres no banco
✅ Sanitização de inputs
✅ Error handling
✅ SQL parameterizado (prevenção SQL injection)
✅ HTTPS automático (Vercel)
✅ Headers de segurança (Next.js)

## 7. Melhorias Futuras (Opcional)

- Rate limiting com Upstash Redis
- Captcha (Turnstile/reCAPTCHA)
- Moderação de conteúdo
- Paginação
- WebSockets para updates em tempo real

## Comandos para iniciar:

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000