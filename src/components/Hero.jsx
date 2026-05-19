export default function Hero({ onAgendar, config = {} }) {
  return (
    <section id="inicio" className="hero">
      <div className="heroText">
        <span className="heroBadge">
          Lays Nails Desginer 
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

        <a 
  href="https://wa.me/5581983339398?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20seus%20atendimentos%21"
  target="_blank" 
  rel="noopener noreferrer"
  className="heroFloatingCard" 
  style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    minWidth: '240px',
    textDecoration: 'none', // Remove o sublinhado de link do card inteiro
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}
  // Efeito sutil ao passar o mouse no computador (opcional)
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'scale(1.02)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <strong style={{ fontSize: '14px', color: '#211512', textTransform: 'uppercase', letterSpacing: '1px' }}>
      Atendimento Premium
    </strong>
    {/* Uma bolinha verde pulsante sutil indicando que você está online/disponível */}
    <span style={{ width: '8px', height: '8px', backgroundColor: '#25d366', borderRadius: '50%', display: 'inline-block' }}></span>
  </div>

  <span style={{ fontSize: '15px', color: '#402e29', fontWeight: '800' }}>
    (81) 98333-9398
  </span>

  <span style={{ fontSize: '11px', color: '#8a7a73', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: '700' }}>
    ✨ Toque para iniciar o atendimento
  </span>
</a>
      </div>
    </section>
  );
}