export default function ServiceCard({
  servico,
  onAgendar
}) {

  const temPromocao =
    servico.promocaoAtiva &&
    Number(servico.precoPromocional) > 0 &&
    Number(servico.precoPromocional) < Number(servico.preco);

  const precoFinal = temPromocao
    ? Number(servico.precoPromocional)
    : Number(servico.preco);

  return (
    <div className="serviceCard">

      {temPromocao && (
        <div className="promoTag">
          PROMOÇÃO
        </div>
      )}

      <img
        src={
          servico.imagemUrl ||
          "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1200"
        }
        alt={servico.nome}
      />

      <h3>
        {servico.nome}
      </h3>

      <p>
        {servico.descricao}
      </p>

      <div className="prices">

        {temPromocao && (
          <span className="oldPrice">
            R$ {Number(servico.preco).toFixed(2)}
          </span>
        )}

        <strong>
          R$ {precoFinal.toFixed(2)}
        </strong>

      </div>

      <button onClick={() => onAgendar(servico)}>
        Agendar
      </button>

    </div>
  );
}