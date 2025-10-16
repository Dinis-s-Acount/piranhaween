import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
export const runtime = "nodejs";

// GET - Buscar todas as fantasias
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, conteudo, criado_em FROM fantasias ORDER BY criado_em DESC LIMIT 100`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar fantasias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fantasias" },
      { status: 500 }
    );
  }
}

// POST - Criar nova fantasia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conteudo } = body ?? {};

    if (!conteudo || typeof conteudo !== "string") {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      );
    }

    const conteudoTrimmed = conteudo.trim();

    if (conteudoTrimmed.length === 0) {
      return NextResponse.json(
        { error: "Conteúdo não pode estar vazio" },
        { status: 400 }
      );
    }

    if (conteudoTrimmed.length > 400) {
      return NextResponse.json(
        { error: "Conteúdo não pode ter mais de 400 caracteres" },
        { status: 400 }
      );
    }

    // Inserir no banco com SQL parametrizado
    const insertResult = await pool.query(
      "INSERT INTO fantasias (conteudo) VALUES ($1) RETURNING id, conteudo, criado_em",
      [conteudoTrimmed]
    );

    return NextResponse.json(insertResult.rows[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fantasia:", error);
    return NextResponse.json(
      { error: "Erro ao criar fantasia" },
      { status: 500 }
    );
  }
}
