import { useState } from "react";
import "../App.css";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setMensagem("");

    if (!email || !senha) {
      setMensagem("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      window.location.href = "/admin";
    } catch (error) {
      console.log(error);
      setMensagem("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginLogo">
          <span>N</span>
        </div>

        <h1>Painel Admin</h1>

        <p>
          Entre para gerenciar agenda, serviços,
          galeria e contatos.
        </p>

        <form onSubmit={entrar}>
          <input
            type="email"
            placeholder="E-mail do admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {mensagem && (
            <div className="loginMessage">
              {mensagem}
            </div>
          )}

          <button disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}