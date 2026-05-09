import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const rota = window.location.pathname;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUsuario(user);
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (carregando) {
    return (
      <div className="loadingAdmin">
        Carregando...
      </div>
    );
  }

  if (rota === "/admin-login") {
    return <Login />;
  }

  if (rota === "/admin") {
    if (!usuario) {
      window.location.href = "/admin-login";
      return null;
    }

    return <Admin />;
  }

  return <Home />;
}