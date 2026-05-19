export default function Hero({ onAgendar, config = {} }) {
  return (
    <section id="inicio" className="hero">
      <div className="heroText">
        <span className="heroBadge">
          Lais Eduarda 
        </span>

        <h1>
          Suas unhas,
          <br />
          sua melhor versão!
        </h1>

        <p>
          Especialista em unhas em gel para realçar ainda mais sua beleza.
        </p>

        <div className="heroButtons">
          <button onClick={onAgendar}>
            Agendar horário
          </button>

          <a href="#servicos" className="heroSecondaryBtn">
            Ver serviços
          </a>
        </div>
      </div>

      <div className="heroImage">
        <img
          src={
            config.heroImagem ||
            "https://i.imgur.com/SVbp6Dc.jpeg"
          }
          alt="Unhas em gel"
        />

        <div className="heroFloatingCard">
          <strong>Atendimento premium </strong>
          <span>Alongamento e esmaltação.</span>
        </div>
      </div>
    </section>
  );
}