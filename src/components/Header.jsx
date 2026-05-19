export default function Header({ onAgendar }) {
  return (
    <header className="header">

      <div>
        <h2>Lays Nails Designer</h2>
        <span>UNHAS EM GEL</span>
      </div>

      <nav>

        <a href="#inicio">
          Início
        </a>

        <a href="#servicos">
          Serviços
        </a>

        <a href="#galeria">
          Galeria
        </a>

        <a href="#contato">
          Contato
        </a>

      </nav>

      <button onClick={onAgendar}>
        Agendar horário
      </button>

    </header>
  );
}