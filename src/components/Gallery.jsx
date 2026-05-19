export default function Gallery({ galeria = [] }) {
  const fotosAtivas = galeria.filter((item) => item.ativo);

  return (
    <section id="galeria" className="gallerySection">
      <div className="servicesTop">
        <span>GALERIA</span>

        <h2>
          Trabalhos que falam
          <br />
          por si
        </h2>

        <p className="servicesDescription">
          Confira alguns resultados reais de unhas em gel e
          acabamentos personalizados.
        </p>
      </div>

      <div className="galleryGrid">
        {fotosAtivas.map((item) => (
          <div className="galleryCard" key={item.id}>
            <img src={item.imagemUrl} alt={item.titulo || "Lais Eduarda"} />

            <div>
              <strong>{item.titulo}</strong>
              <span>{item.descricao}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}