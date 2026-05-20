import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  onSnapshot
} from "firebase/firestore";

import { db } from "../firebase";



export default function BookingModal({
  servicoSelecionado,
  servicos = [],
  onFechar
}) {
  const [servicoEscolhido, setServicoEscolhido] = useState(
    servicoSelecionado || null
  );

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  const [loading, setLoading] = useState(false);

  const [mensagem, setMensagem] = useState("");

  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [horariosBloqueados, setHorariosBloqueados] = useState([]);

  const [diaBloqueado, setDiaBloqueado] = useState(false);
  const [whatsappLoja, setWhatsappLoja] = useState("");
  const [horariosSemana, setHorariosSemana] =
  useState({});

  const horariosDisponiveis =
  pegarHorariosDoDia(data);

  const [configAgenda, setConfigAgenda] = useState({
    agendaAberta: true,
    dataInicioAgendamento: "",
    mensagemFechado: "Agenda indisponível no momento."
  });

  const [horarios, setHorarios] =
  useState([]);

  function dataHoje() {
    return new Date().toISOString().split("T")[0];
  }

  function formatarTelefone(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11);
  }

  function precoFinal() {
    const temPromocao =
      servicoEscolhido?.promocaoAtiva &&
      Number(servicoEscolhido?.precoPromocional) > 0 &&
      Number(servicoEscolhido?.precoPromocional) <
        Number(servicoEscolhido?.preco);

    return temPromocao
      ? Number(servicoEscolhido.precoPromocional)
      : Number(servicoEscolhido?.preco || 0);
  }

  function dataDentroDoBloqueio(
    dataSelecionada,
    inicio,
    fim
  ) {
    const dataFinal = fim || inicio;

    return (
      dataSelecionada >= inicio &&
      dataSelecionada <= dataFinal
    );
  }

  async function carregarHorarios() {

  try {

    const snap = await getDoc(
      doc(db, "configAgenda", "horarios")
    );

    if (snap.exists()) {

      const dados = snap.data();

      setHorarios(
        Array.isArray(dados.lista)
          ? dados.lista
          : []
      );

    } else {

      // evita tela branca
      setHorarios([
        "08:00",
        "11:00",
        "14:00",
        "17:00",
        "19:00"
      ]);
    }

  } catch (e) {

    console.log(e);

    setHorarios([
      "08:00",
      "11:00",
      "14:00",
      "17:00",
      "19:00"
    ]);
  }
}

  async function carregarConfigAgenda() {

  const ref = doc(
    db,
    "configAgenda",
    "principal"
  );

  const snap = await getDoc(ref);

  if (snap.exists()) {

    const dados = snap.data();

    setConfigAgenda({
      agendaAberta:
        dados.agendaAberta === true,

      dataInicioAgendamento:
        dados.dataInicioAgendamento || "",

      mensagemFechado:
        dados.mensagemFechado ||
        "Agenda indisponível no momento."
    });
  }

  const siteRef = doc(
    db,
    "siteConfig",
    "principal"
  );

  const siteSnap = await getDoc(siteRef);

  if (siteSnap.exists()) {

    const siteDados = siteSnap.data();

    setWhatsappLoja(
      String(
        siteDados.whatsapp || ""
      ).replace(/\D/g, "")
    );
  }
}


async function carregarHorariosSemana() {

  try {

    const snap = await getDoc(
      doc(
        db,
        "configAgenda",
        "horariosSemana"
      )
    );

    if (snap.exists()) {

      setHorariosSemana(
        snap.data()
      );
    }

  } catch (error) {

    console.log(error);
  }
}

  async function buscarHorariosOcupados(
    dataSelecionada
  ) {
    setData(dataSelecionada);

    setHorario("");

    setMensagem("");

    setDiaBloqueado(false);

    setHorariosOcupados([]);

    setHorariosBloqueados([]);

    if (!dataSelecionada) {
      return;
    }

    const dataObj =
  new Date(
    dataSelecionada + "T00:00:00"
  );

const diasSemana = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado"
];

const nomeDia =
  diasSemana[
    dataObj.getDay()
  ];

const configDia =
  horariosSemana[nomeDia];

if (
  configDia?.fechado
) {

  setDiaBloqueado(true);

  setMensagem(
    "Não atendemos nesse dia."
  );

  return;
}
    
    if (!configAgenda.agendaAberta) {
      setDiaBloqueado(true);

      setMensagem(
        configAgenda.mensagemFechado
      );

      return;
    }

    if (
      configAgenda.dataInicioAgendamento &&
      dataSelecionada <
        configAgenda.dataInicioAgendamento
    ) {
      setDiaBloqueado(true);

      setMensagem(
        `Agendamentos disponíveis a partir de ${configAgenda.dataInicioAgendamento}.`
      );

      return;
    }

    const qAgendamentos = query(
      collection(db, "agendamentos"),

      where("data", "==", dataSelecionada),

      where(
        "status",
        "in",
        ["agendado", "confirmado"]
      )
    );

    const snapAgendamentos =
      await getDocs(qAgendamentos);

    const ocupados =
      snapAgendamentos.docs.map(
        (docItem) =>
          docItem.data().horario
      );

    const snapBloqueios =
      await getDocs(
        collection(db, "bloqueiosAgenda")
      );

    const bloqueiosAtivos =
      snapBloqueios.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }))

        .filter(
          (b) => b.ativo !== false
        )

        .filter((b) =>
          dataDentroDoBloqueio(
            dataSelecionada,
            b.dataInicio,
            b.dataFim
          )
        );

    const bloqueioDiaTodo =
      bloqueiosAtivos.find(
        (b) => b.diaTodo === true
      );

    if (bloqueioDiaTodo) {
      setDiaBloqueado(true);

      setMensagem(
        bloqueioDiaTodo.motivo
          ? `Data indisponível: ${bloqueioDiaTodo.motivo}`
          : "Data indisponível."
      );

      return;
    }

    const bloqueados =
      bloqueiosAtivos
        .filter((b) => b.horario)
        .map((b) => b.horario);

    setHorariosOcupados(ocupados);

    setHorariosBloqueados(
      bloqueados
    );
  }

  function pegarHorariosDoDia(
  dataSelecionada
) {

  if (!dataSelecionada) {
    return [];
  }

  const dataObj =
    new Date(
      dataSelecionada + "T00:00:00"
    );

  const diasSemana = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado"
  ];

  const nomeDia =
    diasSemana[
      dataObj.getDay()
    ];

  const configDia =
    horariosSemana?.[nomeDia];

  if (!configDia) {
    return [];
  }

  if (configDia.fechado === true) {
    return [];
  }

  return Array.isArray(
    configDia.horarios
  )
    ? configDia.horarios
    : [];
}

  async function confirmarAgendamento() {
    setMensagem("");

    if (!configAgenda.agendaAberta) {
      setMensagem(
        configAgenda.mensagemFechado
      );

      return;
    }

    if (!servicoEscolhido) {
      setMensagem(
        "Escolha um serviço para agendar."
      );

      return;
    }

    if (
      !nome ||
      !telefone ||
      !data ||
      !horario
    ) {
      setMensagem(
        "Preencha todos os campos e escolha um horário."
      );

      return;
    }

    if (diaBloqueado) {
      setMensagem(
        "Essa data está indisponível."
      );

      return;
    }

    if (
      horariosOcupados.includes(
        horario
      ) ||
      horariosBloqueados.includes(
        horario
      )
    ) {
      setMensagem(
        "Esse horário não está mais disponível."
      );

      return;
    }

    try {
  setLoading(true);

  await addDoc(
    collection(db, "agendamentos"),
    {
      clienteNome: nome,
      clienteTelefone: telefone,
      servicoId: servicoEscolhido.id,
      servicoNome: servicoEscolhido.nome,
      valor: precoFinal(),
      data,
      horario,
      status: "agendado",
      criadoEm: new Date()
    }
  );

  setMensagem(
    "Agendamento realizado com sucesso!"
  );

  const texto = encodeURIComponent(
`Novo agendamento pelo site 

Cliente: ${nome}
WhatsApp: ${telefone}

Serviço: ${servicoEscolhido.nome}
Data: ${data}
Horário: ${horario}

Valor: R$ ${precoFinal().toFixed(2)}

Já deixei tudo preparado exclusivamente para o seu atendimento. Se precisar de qualquer alteração, é só me avisar por aqui.`
  );

  const numeroLoja =
    whatsappLoja || "8183339398";

  window.location.href =
    `https://wa.me/55${numeroLoja}?text=${texto}`;

  setTimeout(() => {
    onFechar();
  }, 500);

} catch (error) {

  console.log(error);

  setMensagem(
    "Erro ao realizar agendamento. Tente novamente."
  );

} finally {

  setLoading(false);
}
  }



useEffect(() => {

  const unsubAgenda = onSnapshot(
    doc(db, "configAgenda", "principal"),
    (snap) => {

      if (snap.exists()) {

        const dados = snap.data();

        setConfigAgenda({
          agendaAberta:
            dados.agendaAberta === true,

          dataInicioAgendamento:
            dados.dataInicioAgendamento || "",

          mensagemFechado:
            dados.mensagemFechado ||
            "Agenda indisponível no momento."
        });
      }
    }
  );

  const unsubHorarios = onSnapshot(
    doc(db, "configAgenda", "horariosSemana"),
    (snap) => {

      if (snap.exists()) {

        setHorariosSemana(
          snap.data()
        );
      }
    }
  );

  const unsubSite = onSnapshot(
    doc(db, "siteConfig", "principal"),
    (snap) => {

      if (snap.exists()) {

        const dados = snap.data();

        setWhatsappLoja(
          String(
            dados.whatsapp || ""
          ).replace(/\D/g, "")
        );
      }
    }
  );

  return () => {

    unsubAgenda();
    unsubHorarios();
    unsubSite();
  };

}, []);

useEffect(() => {

  if (data) {

    buscarHorariosOcupados(data);
  }

}, [horariosSemana]);

  return (
    <div className="modalOverlay">
      <div className="modalBox modalPremium">

        <button
          className="closeModal"
          onClick={onFechar}
        >
          ×
        </button>

        <span className="modalTag">
          Lays Eduarda
        </span>

        <h2>
          Agendar horário
        </h2>

        <p className="modalService">
          {servicoEscolhido?.nome ||
            "Escolha um serviço"}
        </p>

        {!configAgenda.agendaAberta && (
          <div className="modalMessage">
            {
              configAgenda.mensagemFechado
            }
          </div>
        )}

        {!servicoSelecionado && (
          <select
            className="modalSelect"
            value={
              servicoEscolhido?.id ||
              ""
            }
            onChange={(e) => {
              const servico =
                servicos.find(
                  (s) =>
                    s.id ===
                    e.target.value
                );

              setServicoEscolhido(
                servico || null
              );

              setMensagem("");
            }}
          >
            <option value="">
              Selecione um serviço
            </option>

            {servicos.map(
              (servico) => {
                const temPromocao =
                  servico.promocaoAtiva &&
                  Number(
                    servico.precoPromocional
                  ) > 0 &&
                  Number(
                    servico.precoPromocional
                  ) <
                    Number(
                      servico.preco
                    );

                const valor =
                  temPromocao
                    ? Number(
                        servico.precoPromocional
                      )
                    : Number(
                        servico.preco
                      );

                return (
                  <option
                    key={servico.id}
                    value={servico.id}
                  >
                    {servico.nome} -
                    {" "}
                    R$
                    {" "}
                    {valor.toFixed(2)}
                  </option>
                );
              }
            )}
          </select>
        )}

        <input
          placeholder="Seu nome"
          value={nome}
          onChange={(e) =>
            setNome(e.target.value)
          }
        />

        <input
          placeholder="WhatsApp"
          value={telefone}
          onChange={(e) =>
            setTelefone(
              formatarTelefone(
                e.target.value
              )
            )
          }
        />

      <div className="dateField">

  <label className="modalFieldLabel">
    Escolha a data do atendimento
  </label>

  <input
    className="dateInput"
    type="date"
    min={
      configAgenda.dataInicioAgendamento ||
      dataHoje()
    }
    value={data}
    onChange={(e) =>
      buscarHorariosOcupados(
        e.target.value
      )
    }
  />

</div>
        <div className="horariosGrid">
          {horariosDisponiveis.map((h) => {
            const ocupado =
              horariosOcupados.includes(
                h
              );

            const bloqueado =
              horariosBloqueados.includes(
                h
              );

            const indisponivel =
              ocupado ||
              bloqueado ||
              diaBloqueado ||
              !configAgenda.agendaAberta;

            const selecionado =
              horario === h;

            return (
              <button
                key={h}
                disabled={
                  indisponivel
                }
                className={
                  indisponivel
                    ? "indisponivel"
                    : selecionado
                    ? "selecionado"
                    : ""
                }
                onClick={() =>
                  setHorario(h)
                }
              >
                {indisponivel
                  ? "Indisponível"
                  : h}
              </button>
            );
          })}
        </div>

        {mensagem && (
  <div
    className={
      mensagem.includes("sucesso")
        ? "modalMessage success"
        : "modalMessage error"
    }
  >
    {mensagem}
  </div>
)}

<div className="confirmArea">

  <div className="confirmInfo">
    Ao confirmar, você será redirecionada
    para o WhatsApp para finalizar o
    agendamento 💖
  </div>

  <button
    className="confirmBtn pulseBtn"
    onClick={confirmarAgendamento}
    disabled={
      loading ||
      !configAgenda.agendaAberta
    }
  >
    {loading
      ? "Agendando..."
      : "Confirmar agendamento"}
  </button>

</div>

      </div>
    </div>
  );
}