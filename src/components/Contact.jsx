export default function Contact({ config = {} }) {
  const whatsapp = config.whatsapp || "";
  const instagram = config.instagram || "";
  const endereco = config.endereco || "";

  return (
    <section id="contato" className="contactSection">
      <div className="contactBox">
        <div>
          <span>CONTATO</span>

          <h2>Agende seu horário</h2>

          <p>
            Atendimento personalizado para deixar suas unhas ainda mais bonitas.
          </p>
        </div>

        <div className="contactInfo">
          <p>
            <strong>WhatsApp:</strong> {whatsapp || "Não informado"}
          </p>

          <p>
            <strong>Instagram:</strong> {instagram || "Não informado"}
          </p>

          <p>
            <strong>Endereço:</strong> {endereco || "Não informado"}
          </p>

          {whatsapp && (
            <a
              href={`https://wa.me/55${whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}