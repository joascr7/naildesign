import Home from "./pages/Home";
import Admin from "./pages/Admin";

export default function App() {
  const rota = window.location.pathname;

  if (rota === "/admin") {
    return <Admin />;
  }

  return <Home />;
}