"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Fantasia {
  id: number;
  conteudo: string;
  criado_em: string;
}

export default function Home() {
  const [fantasias, setFantasias] = useState<Fantasia[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarFantasias();
  }, []);

  const carregarFantasias = async () => {
    try {
      const res = await fetch("/api/fantasias");
      if (res.ok) {
        const data = await res.json();
        setFantasias(data);
      }
    } catch (err) {
      console.error("Erro ao carregar fantasias:", err);
    }
  };

  const adicionarFantasia = async () => {
    if (input.trim().length === 0) {
      setError("💀Digite logo uma fantasia!💀"); 
      return;
    }

    if (input.length > 400) {
      setError("Máximo de 400 caracteres!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fantasias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conteudo: input }),
      });

      if (res.ok) {
        const novaFantasia = await res.json();
        setFantasias([novaFantasia, ...fantasias]);
        setInput("");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao adicionar fantasia");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      adicionarFantasia();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <img src="title.png" alt="Piranhaween" />
      </h1>

      <div className={styles.inputSection}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua fantasia aqui..."
          maxLength={400}
          disabled={loading}
          className={styles.textarea}
        />
        <div
          className={`${styles.charCount} ${
            input.length > 350 ? styles.warning : ""
          }`}
        >
          {input.length} / 400
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button
          onClick={adicionarFantasia}
          disabled={loading}
          className={styles.button}
        >
          {loading ? "ENVIANDO..." : "ADICIONAR FANTASIA"}
        </button>
      </div>

      <div className={styles.fantasiasList}>
        {fantasias.length === 0 ? (
          <div className={styles.emptyState}>
            <img src="plant.gif" alt="Plant" height="48px"/>
            <img src="plant.gif" alt="Plant" height="48px"/>
            <img src="plant.gif" alt="Plant" height="48px"/>
            <img src="plant.gif" alt="Plant" height="48px"/>
          </div>
        ) : (
          fantasias.map((fantasia) => (
            <div key={fantasia.id} className={styles.fantasiaItem}>
              {fantasia.conteudo}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
