import ServiceCard from "./ServiceCard";

export default function Services({
  servicos,
  onAgendar
}) {
  return (
    <section
      id="servicos"
      className="services"
    >

      <div className="servicesTop">

        <span>
          NOSSOS SERVIÇOS
        </span>

        <h2>
          Beleza e qualidade
          <br />
          em cada detalhe
        </h2>

        <p className="servicesDescription">
          Serviços premium para deixar suas unhas
          impecáveis com acabamento profissional.
        </p>

      </div>

      <div className="servicesGrid">

        {servicos.map((servico) => (

          <ServiceCard
            key={servico.id}
            servico={servico}
            onAgendar={onAgendar}
          />

        ))}

      </div>

    </section>
  );
}