export default function Hero({ onAgendar, config = {} }) {
  return (
    <section id="inicio" className="hero">
      <div className="heroText">
        <span className="heroBadge">
          Nail Design Premium
        </span>

        <h1>
          Suas unhas,
          <br />
          sua melhor versão!
        </h1>

        <p>
          Especialista em unhas em gel e nail design para realçar ainda mais sua beleza.
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
            "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200"
          }
          alt="Unhas em gel"
        />

        <div className="heroFloatingCard">
          <strong>Atendimento premium </strong>
          <span>Alongamento, esmaltação e nail art.</span>
        </div>
      </div>
    </section>
  );
}