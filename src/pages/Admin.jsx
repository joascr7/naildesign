import { useEffect, useState } from "react";
import "../App.css";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

import { db } from "../firebase";

const servicoVazio = {
  nome: "",
  descricao: "",
  preco: "",
  precoPromocional: "",
  promocaoAtiva: false,
  imagemUrl: "",
  ativo: true
};

const bloqueioVazio = {
  dataInicio: "",
  dataFim: "",
  horario: "",
  motivo: "",
  diaTodo: true,
  ativo: true
};

const galeriaVazia = {
  titulo: "",
  descricao: "",
  imagemUrl: "",
  ativo: true
};

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [novoServico, setNovoServico] = useState(servicoVazio);
  const [mensagem, setMensagem] = useState("");
  // 🔥 ESTADO
const [grupoFinalizadosAberto, setGrupoFinalizadosAberto] =
  useState(false);

const [grupoCanceladosAberto, setGrupoCanceladosAberto] =
  useState(false);

  const [configAgenda, setConfigAgenda] = useState({
    agendaAberta: true,
    dataInicioAgendamento: "",
    mensagemFechado: "Agenda indisponível no momento."
  });

  const [configSite, setConfigSite] = useState({
    nomeLoja: "Lays Nails Designer",
    whatsapp: "",
    instagram: "",
    endereco: "",
    textoContato: "Atendimento personalizado para deixar suas unhas ainda mais bonitas.",
    heroImagem: ""
  });


  const diasSemana = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado"
];

const [horariosSemana, setHorariosSemana] =
  useState({
    domingo: {
      fechado: true,
      horarios: []
    },

    segunda: {
      fechado: false,
      horarios: [
        "08:00",
        "09:00",
        "10:00"
      ]
    },

    terca: {
      fechado: false,
      horarios: [
        "08:00",
        "09:00",
        "10:00"
      ]
    },

    quarta: {
      fechado: false,
      horarios: [
        "14:00",
        "15:00",
        "16:00"
      ]
    },

    quinta: {
      fechado: false,
      horarios: [
        "08:00",
        "09:00"
      ]
    },

    sexta: {
      fechado: false,
      horarios: [
        "08:00",
        "09:00"
      ]
    },

    sabado: {
      fechado: false,
      horarios: [
        "08:00",
        "09:00"
      ]
    }
  });

  const [novoBloqueio, setNovoBloqueio] = useState(bloqueioVazio);
  const [bloqueios, setBloqueios] = useState([]);
  const [horariosAdmin, setHorariosAdmin] =
  useState([]);

  const [galeria, setGaleria] = useState([]);
  const [novaGaleria, setNovaGaleria] = useState(galeriaVazia);

  async function carregarTudo() {
    await Promise.all([
      carregarAgendamentos(),
      carregarServicos(),
      carregarConfigAgenda(),
      carregarConfigSite(),
      carregarBloqueios(),
      carregarGaleria(),
      carregarHorariosAdmin()
    ]);
  }

  async function carregarAgendamentos() {
    const q = query(collection(db, "agendamentos"), orderBy("criadoEm", "desc"));
    const snap = await getDocs(q);

    setAgendamentos(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  }


  function adicionarHorario() {

  setHorariosAdmin((atual) => [
    ...atual,
    ""
  ]);
}

function alterarHorario(index, valor) {

  const copia = [...horariosAdmin];

  copia[index] = valor;

  setHorariosAdmin(copia);
}

function removerHorario(index) {

  setHorariosAdmin((atual) =>
    atual.filter((_, i) => i !== index)
  );
}


async function salvarHorariosAdmin() {

  try {

    const horariosLimpos =
      horariosAdmin
        .filter((h) => h?.trim())
        .sort();

    await setDoc(
      doc(db, "configAgenda", "horarios"),
      {
        lista: horariosLimpos
      }
    );

    setMensagem(
      "Horários salvos com sucesso."
    );

  } catch (e) {

    console.log(e);

    setMensagem(
      "Erro ao salvar horários."
    );
  }
}

async function salvarHorariosSemana() {

  try {

    await setDoc(
      doc(db, "configAgenda", "horariosSemana"),
      horariosSemana
    );

    setMensagem(
      "Horários salvos com sucesso."
    );

  } catch (error) {

    console.log(error);

    setMensagem(
      "Erro ao salvar horários."
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

  

  async function excluirAgendamento(id) {
  const confirmar = window.confirm(
    "Deseja excluir este agendamento?"
  );

  if (!confirmar) return;

  try {
    await deleteDoc(
      doc(db, "agendamentos", id)
    );

    setMensagem(
      "Agendamento removido com sucesso."
    );

    await carregarAgendamentos();

  } catch (error) {

    console.log(error);

    setMensagem(
      "Erro ao excluir agendamento."
    );
  }
}

async function excluirServico(id) {
  const confirmar = window.confirm(
    "Deseja excluir este serviço?"
  );

  if (!confirmar) return;

  try {
    await deleteDoc(
      doc(db, "servicos", id)
    );

    setMensagem(
      "Serviço removido com sucesso."
    );

    await carregarServicos();

  } catch (error) {

    console.log(error);

    setMensagem(
      "Erro ao excluir serviço."
    );
  }
}

  async function carregarServicos() {
    const snap = await getDocs(collection(db, "servicos"));

    setServicos(
      snap.docs.map((d) => {
        const dados = d.data();

        return {
          id: d.id,
          nome: dados.nome || "",
          descricao: dados.descricao || "",
          preco: dados.preco || 0,
          precoPromocional: dados.precoPromocional || 0,
          promocaoAtiva: dados.promocaoAtiva === true,
          imagemUrl: dados.imagemUrl || "",
          ativo: dados.ativo === true
        };
      })
    );
  }

  async function carregarConfigAgenda() {
    const snap = await getDoc(doc(db, "configAgenda", "principal"));

    if (snap.exists()) {
      const dados = snap.data();

      setConfigAgenda({
        agendaAberta: dados.agendaAberta === true,
        dataInicioAgendamento: dados.dataInicioAgendamento || "",
        mensagemFechado:
          dados.mensagemFechado || "Agenda indisponível no momento."
      });
    }
  }

  async function carregarConfigSite() {
    const snap = await getDoc(doc(db, "siteConfig", "principal"));

    if (snap.exists()) {
      const dados = snap.data();

      setConfigSite({
        nomeLoja: dados.nomeLoja || "Lays Nails Designer",
        whatsapp: dados.whatsapp || "",
        instagram: dados.instagram || "",
        endereco: dados.endereco || "",
        textoContato:
          dados.textoContato ||
          "Atendimento personalizado para deixar suas unhas ainda mais bonitas.",
        heroImagem: dados.heroImagem || ""
      });
    }
  }

  async function carregarBloqueios() {
    const snap = await getDocs(collection(db, "bloqueiosAgenda"));

    setBloqueios(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  }

  async function carregarGaleria() {
    const snap = await getDocs(collection(db, "galeria"));

    setGaleria(
      snap.docs.map((d) => {
        const dados = d.data();

        return {
          id: d.id,
          titulo: dados.titulo || "",
          descricao: dados.descricao || "",
          imagemUrl: dados.imagemUrl || "",
          ativo: dados.ativo === true
        };
      })
    );
  }

  function alterarServico(index, campo, valor) {
    const copia = [...servicos];
    copia[index] = {
      ...copia[index],
      [campo]: valor
    };
    setServicos(copia);
  }

  function alterarNovoServico(campo, valor) {
    setNovoServico((atual) => ({
      ...atual,
      [campo]: valor
    }));
  }

  function alterarGaleria(index, campo, valor) {
    const copia = [...galeria];
    copia[index] = {
      ...copia[index],
      [campo]: valor
    };
    setGaleria(copia);
  }

  function alterarNovaGaleria(campo, valor) {
    setNovaGaleria((atual) => ({
      ...atual,
      [campo]: valor
    }));
  }

  function imagemParaBase64(arquivo, callback) {
  if (!arquivo) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = (e) => {
    img.src = e.target.result;
  };

  img.onload = () => {
    const canvas = document.createElement("canvas");

    const larguraMaxima = 900;
    const escala = larguraMaxima / img.width;

    canvas.width = larguraMaxima;
    canvas.height = img.height * escala;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imagemComprimida = canvas.toDataURL("image/jpeg", 0.65);

    callback(imagemComprimida);
  };

  reader.readAsDataURL(arquivo);
}

  async function sairAdmin() {
  await signOut(auth);
  window.location.href = "/admin-login";
}

  async function salvarConfigSite() {
    setMensagem("Salvando contato e imagem principal...");

    try {
      await setDoc(doc(db, "siteConfig", "principal"), {
        nomeLoja: configSite.nomeLoja || "Lays Nails Designer",
        whatsapp: configSite.whatsapp || "",
        instagram: configSite.instagram || "",
        endereco: configSite.endereco || "",
        textoContato: configSite.textoContato || "",
        heroImagem: configSite.heroImagem || ""
      });

      setMensagem("Configurações do site salvas com sucesso.");
      await carregarConfigSite();
    } catch (error) {
      setMensagem(`Erro ao salvar contato: ${error.message}`);
    }
  }

  async function salvarServico(servico) {

  try {

    await updateDoc(
      doc(db, "servicos", servico.id),
      {
        nome: String(servico.nome || ""),
        descricao: String(
          servico.descricao || ""
        ),

        preco: Number(
          servico.preco || 0
        ),

        precoPromocional: Number(
          servico.precoPromocional || 0
        ),

        promocaoAtiva:
          servico.promocaoAtiva === true,

        imagemUrl: String(
          servico.imagemUrl || ""
        ),

        ativo:
          servico.ativo === true
      }
    );

    setMensagem(
      `Serviço "${servico.nome}" salvo com sucesso.`
    );

    setTimeout(() => {
      setMensagem("");
    }, 2500);

  } catch (error) {

    console.log(error);

    setMensagem(
      "Erro ao salvar serviço."
    );
  }
}

  async function criarServico() {
    setMensagem("Criando serviço...");

    if (!novoServico.nome || !novoServico.preco) {
      setMensagem("Preencha pelo menos nome e preço.");
      return;
    }

    try {
      await addDoc(collection(db, "servicos"), {
        nome: String(novoServico.nome || ""),
        descricao: String(novoServico.descricao || ""),
        preco: Number(novoServico.preco || 0),
        precoPromocional: Number(novoServico.precoPromocional || 0),
        promocaoAtiva: novoServico.promocaoAtiva === true,
        imagemUrl: String(novoServico.imagemUrl || ""),
        ativo: novoServico.ativo === true
      });

      setNovoServico(servicoVazio);
      setMensagem("Novo serviço criado com sucesso.");
      await carregarServicos();
    } catch (error) {
      setMensagem(`Erro ao criar serviço: ${error.message}`);
    }
  }

  async function salvarConfigAgenda() {
    setMensagem("Salvando controle da agenda...");

    try {
      await setDoc(doc(db, "configAgenda", "principal"), {
        agendaAberta: configAgenda.agendaAberta === true,
        dataInicioAgendamento: configAgenda.dataInicioAgendamento || "",
        mensagemFechado:
          configAgenda.mensagemFechado || "Agenda indisponível no momento."
      });

      setMensagem("Controle da agenda salvo com sucesso.");
      await carregarConfigAgenda();
    } catch (error) {
      setMensagem(`Erro ao salvar agenda: ${error.message}`);
    }
  }

  async function criarBloqueio() {
    setMensagem("Criando bloqueio...");

    if (!novoBloqueio.dataInicio || !novoBloqueio.motivo) {
      setMensagem("Preencha data inicial e motivo do bloqueio.");
      return;
    }

    try {
      await addDoc(collection(db, "bloqueiosAgenda"), {
        dataInicio: novoBloqueio.dataInicio,
        dataFim: novoBloqueio.dataFim || novoBloqueio.dataInicio,
        horario: novoBloqueio.diaTodo ? "" : novoBloqueio.horario,
        motivo: novoBloqueio.motivo,
        diaTodo: novoBloqueio.diaTodo === true,
        ativo: novoBloqueio.ativo === true,
        criadoEm: new Date()
      });

      setNovoBloqueio(bloqueioVazio);
      setMensagem("Bloqueio criado com sucesso.");
      await carregarBloqueios();
    } catch (error) {
      setMensagem(`Erro ao criar bloqueio: ${error.message}`);
    }
  }

  async function removerBloqueio(id) {
    try {
      await deleteDoc(doc(db, "bloqueiosAgenda", id));
      setMensagem("Bloqueio removido.");
      await carregarBloqueios();
    } catch (error) {
      setMensagem(`Erro ao remover bloqueio: ${error.message}`);
    }
  }

  async function criarGaleria() {
    setMensagem("Adicionando foto...");

    if (!novaGaleria.imagemUrl) {
      setMensagem("Escolha uma imagem para a galeria.");
      return;
    }

    try {
      await addDoc(collection(db, "galeria"), {
        titulo: novaGaleria.titulo || "",
        descricao: novaGaleria.descricao || "",
        imagemUrl: novaGaleria.imagemUrl || "",
        ativo: novaGaleria.ativo === true,
        criadoEm: new Date()
      });

      setNovaGaleria(galeriaVazia);
      setMensagem("Foto adicionada à galeria.");
      await carregarGaleria();
    } catch (error) {
      setMensagem(`Erro ao adicionar foto: ${error.message}`);
    }
  }

 async function salvarGaleria(item) {
  try {

    // feedback instantâneo
    setMensagem(`Salvando "${item.titulo || "foto"}"...`);

    // salva SOMENTE o item alterado
    await updateDoc(
      doc(db, "galeria", item.id),
      {
        titulo: String(item.titulo || ""),
        descricao: String(item.descricao || ""),
        imagemUrl: String(item.imagemUrl || ""),
        ativo: item.ativo === true
      }
    );

    // NÃO recarrega toda galeria
    // await carregarGaleria();

    setMensagem("Foto salva com sucesso.");

    // limpa mensagem depois
    setTimeout(() => {
      setMensagem("");
    }, 2500);

  } catch (error) {

    console.log(error);

    setMensagem(
      `Erro ao salvar foto: ${error.message}`
    );
  }
}

  async function removerGaleria(id) {

  const confirmar = window.confirm(
    "Deseja remover esta foto?"
  );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "galeria", id)
    );

    // remove da tela sem reload
    setGaleria((atual) =>
      atual.filter((item) => item.id !== id)
    );

    setMensagem("Foto removida.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);

  } catch (error) {

    console.log(error);

    setMensagem(
      `Erro ao remover foto: ${error.message}`
    );
  }
}

  async function alterarStatus(id, status) {
    try {
      await updateDoc(doc(db, "agendamentos", id), {
        status
      });

      setMensagem("Status atualizado com sucesso.");
      await carregarAgendamentos();
    } catch (error) {
      setMensagem(`Erro ao atualizar: ${error.message}`);
    }
  }


  function chamarClienteWhatsApp(item) {
  const telefone = String(item.clienteTelefone || "").replace(/\D/g, "");

  const texto = encodeURIComponent(
  `Olá ${item.clienteNome}, tudo bem? 

Aqui é Lays Nails Designer sobre seu agendamento.

 Serviço: ${item.servicoNome}
 Data: ${item.data}
 Horário: ${item.horario}

Para confirmação do agendamento é necessário o pagamento antecipado de 40% do valor do procedimento.

Assim conseguimos reservar seu horário exclusivamente para você. `
);

  window.open(`https://wa.me/55${telefone}?text=${texto}`, "_blank");
}

 useEffect(() => {

  carregarTudo();

  carregarHorariosSemana();

}, []);

  const abertos = agendamentos.filter(
    (a) => a.status === "agendado" || a.status === "confirmado"
  );

  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const cancelados = agendamentos.filter((a) => a.status === "cancelado");

  const faturamento = concluidos.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  return (
   <div className="adminPage adminPremium">

  <div className="adminTopBar">

    <div>
      <span className="adminEyebrow">
        Lays Nails Designer
      </span>

      <h1>
        Painel Admin
      </h1>

      <p>
        Controle serviços, agenda,
        galeria, contato e faturamento.
      </p>
    </div>

    <div className="adminTopActions">

      <div
        className={
          configAgenda.agendaAberta
            ? "storeOpen"
            : "storeClosed"
        }
      >
        {configAgenda.agendaAberta
          ? "Agenda aberta"
          : "Agenda fechada"}
      </div>

      <button
        type="button"
        className="logoutBtn"
        onClick={sairAdmin}
      >
        Sair
      </button>

    </div>

  </div>

  <div className="adminMenu">

    

    <a href="#site">
      Site
    </a>

    <a href="#galeriaAdmin">
      Galeria
    </a>

    <a href="#agenda">
      Agenda
    </a>

    <a href="#abertos">
      Abertos
    </a>

    <a href="#concluidos">
      Concluídos
    </a>

    <a href="#cancelados">
      Cancelados
    </a>

    <a href="#servicosAdmin">
      Serviços
    </a>

  </div>



<h2 className="adminTitle">
  Horários por dia
</h2>

<div className="agendaDiasGrid">

  {diasSemana.map((dia) => (

    <div
      key={dia}
      className="agendaDiaCard"
    >

      <h3>
        {dia}
      </h3>

      <label className="checkLine">

        <input
          type="checkbox"

          checked={
            horariosSemana[dia]
              ?.fechado || false
          }

          onChange={(e) => {

            setHorariosSemana((atual) => ({
              ...atual,

              [dia]: {
                ...atual[dia],

                fechado:
                  e.target.checked
              }
            }));
          }}
        />

        Dia fechado

      </label>

      <textarea
        placeholder="08:00,09:00,10:00"

        value={
          horariosSemana[dia]
            ?.horarios
            ?.join(",") || ""
        }

        onChange={(e) => {

          const lista =
            e.target.value
              .split(",")

              .map((h) =>
                h.trim()
              )

              .filter(Boolean);

          setHorariosSemana((atual) => ({
            ...atual,

            [dia]: {
              ...atual[dia],

              horarios: lista
            }
          }));
        }}
      />

    </div>
  ))}
</div>

<button
  onClick={salvarHorariosSemana}
>
  Salvar horários
</button>



<div className="agendaControlCard">

  {horariosAdmin.map((h, index) => (

    <div
      key={index}
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 10
      }}
    >

      

      

    </div>
  ))}



</div>
      {mensagem && (
        <div className="adminMessage">
          {mensagem}
        </div>
      )}

      <div className="statsGrid premiumStats">
        <div className="statCard">
          <span>Em aberto</span>
          <strong>{abertos.length}</strong>
        </div>

        <div className="statCard successCard">
  <div className="statTop">
    <span>Concluídos</span>

    <div className="statIcon">
      ✓
    </div>
  </div>

  <strong>
    {concluidos.length}
  </strong>

  <small>
    Serviços finalizados
  </small>
</div>

        <div className="statCard">
          <span>Cancelados</span>
          <strong>{cancelados.length}</strong>
        </div>

        <div className="statCard statMoney">
          <span>Faturamento</span>
          <strong>R$ {faturamento.toFixed(2)}</strong>
        </div>
      </div>

      <h2 id="site" className="adminTitle">
  Configurações do site
</h2>

      <div className="agendaControlGrid">
        <div className="agendaControlCard">
          <label className="formLabel">Nome da loja</label>
          <input
            value={configSite.nomeLoja}
            onChange={(e) =>
              setConfigSite((a) => ({
                ...a,
                nomeLoja: e.target.value
              }))
            }
          />

          <label className="formLabel">WhatsApp</label>
          <input
            value={configSite.whatsapp}
            onChange={(e) =>
              setConfigSite((a) => ({
                ...a,
                whatsapp: e.target.value.replace(/\D/g, "")
              }))
            }
          />

          <label className="formLabel">Instagram</label>
          <input
            value={configSite.instagram}
            onChange={(e) =>
              setConfigSite((a) => ({
                ...a,
                instagram: e.target.value
              }))
            }
          />

          <label className="formLabel">Endereço</label>
          <input
            value={configSite.endereco}
            onChange={(e) =>
              setConfigSite((a) => ({
                ...a,
                endereco: e.target.value
              }))
            }
          />

          <label className="formLabel">Texto do contato</label>
          <textarea
            value={configSite.textoContato}
            onChange={(e) =>
              setConfigSite((a) => ({
                ...a,
                textoContato: e.target.value
              }))
            }
          />

          <label className="formLabel">Imagem principal do topo</label>

          <div className="imagePreview">
            {configSite.heroImagem ? (
              <img src={configSite.heroImagem} alt="" />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>

          <label className="uploadBox">
            Escolher imagem principal
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                imagemParaBase64(e.target.files?.[0], (base64) =>
                  setConfigSite((a) => ({
                    ...a,
                    heroImagem: base64
                  }))
                )
              }
            />
          </label>

          <button type="button" onClick={salvarConfigSite}>
            Salvar configurações
          </button>
        </div>
      </div>

      <h2 id="galeriaAdmin" className="adminTitle">
  Galeria / Prova social
</h2>

      <div className="servicesAdminGrid">
        <div className="serviceAdminCard premiumForm">
          <div className="imagePreview">
            {novaGaleria.imagemUrl ? (
              <img src={novaGaleria.imagemUrl} alt="" />
            ) : (
              <span>Nova foto</span>
            )}
          </div>

          <label className="uploadBox">
            Escolher imagem da galeria
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                imagemParaBase64(e.target.files?.[0], (base64) =>
                  alterarNovaGaleria("imagemUrl", base64)
                )
              }
            />
          </label>

          <input
            placeholder="Título"
            value={novaGaleria.titulo}
            onChange={(e) => alterarNovaGaleria("titulo", e.target.value)}
          />

          <textarea
            placeholder="Descrição"
            value={novaGaleria.descricao}
            onChange={(e) => alterarNovaGaleria("descricao", e.target.value)}
          />

          <label className="checkLine">
            <input
              type="checkbox"
              checked={novaGaleria.ativo}
              onChange={(e) => alterarNovaGaleria("ativo", e.target.checked)}
            />
            Foto ativa
          </label>

          <button type="button" onClick={criarGaleria}>
            Adicionar à galeria
          </button>
        </div>

        {galeria.map((item, index) => (
          <div className="serviceAdminCard premiumForm" key={item.id}>
            <div className="imagePreview">
              {item.imagemUrl ? (
                <img src={item.imagemUrl} alt="" />
              ) : (
                <span>Sem imagem</span>
              )}
            </div>

            <label className="uploadBox">
              Trocar imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  imagemParaBase64(e.target.files?.[0], (base64) =>
                    alterarGaleria(index, "imagemUrl", base64)
                  )
                }
              />
            </label>

            <input
              value={item.titulo}
              onChange={(e) => alterarGaleria(index, "titulo", e.target.value)}
            />

            <textarea
              value={item.descricao}
              onChange={(e) => alterarGaleria(index, "descricao", e.target.value)}
            />

            <label className="checkLine">
              <input
                type="checkbox"
                checked={item.ativo}
                onChange={(e) => alterarGaleria(index, "ativo", e.target.checked)}
              />
              Foto ativa
            </label>

            <button type="button" onClick={() => salvarGaleria(item)}>
              Salvar foto
            </button>

            <button
              type="button"
              className="dangerFullBtn"
              onClick={() => removerGaleria(item.id)}
            >
              Remover foto
            </button>
          </div>
        ))}
      </div>

      <h2 id="agenda" className="adminTitle">
  Controle de Agenda
</h2>

      <div className="agendaControlGrid">
        <div className="agendaControlCard">
          <label className="switchLine">
            <input
              type="checkbox"
              checked={configAgenda.agendaAberta}
              onChange={(e) =>
                setConfigAgenda((a) => ({
                  ...a,
                  agendaAberta: e.target.checked
                }))
              }
            />

            <div>
              <strong>Agenda aberta</strong>
              <span>Desative para impedir novos agendamentos.</span>
            </div>
          </label>

          <label className="formLabel">Agendar somente a partir de</label>
          <input
            type="date"
            value={configAgenda.dataInicioAgendamento}
            onChange={(e) =>
              setConfigAgenda((a) => ({
                ...a,
                dataInicioAgendamento: e.target.value
              }))
            }
          />

          <label className="formLabel">Mensagem quando fechado</label>
          <textarea
            value={configAgenda.mensagemFechado}
            onChange={(e) =>
              setConfigAgenda((a) => ({
                ...a,
                mensagemFechado: e.target.value
              }))
            }
          />

          <button type="button" onClick={salvarConfigAgenda}>
            Salvar controle da agenda
          </button>
        </div>

        <div className="agendaControlCard">
          <h3>Novo bloqueio</h3>

          <label className="formLabel">Data inicial</label>
          <input
            type="date"
            value={novoBloqueio.dataInicio}
            onChange={(e) =>
              setNovoBloqueio((a) => ({
                ...a,
                dataInicio: e.target.value
              }))
            }
          />

          <label className="formLabel">Data final</label>
          <input
            type="date"
            value={novoBloqueio.dataFim}
            onChange={(e) =>
              setNovoBloqueio((a) => ({
                ...a,
                dataFim: e.target.value
              }))
            }
          />

          <label className="checkLine">
            <input
              type="checkbox"
              checked={novoBloqueio.diaTodo}
              onChange={(e) =>
                setNovoBloqueio((a) => ({
                  ...a,
                  diaTodo: e.target.checked
                }))
              }
            />
            Bloquear dia inteiro
          </label>

          {!novoBloqueio.diaTodo && (
            <>
              <label className="formLabel">Horário específico</label>
              <input
                placeholder="Ex: 14:00"
                value={novoBloqueio.horario}
                onChange={(e) =>
                  setNovoBloqueio((a) => ({
                    ...a,
                    horario: e.target.value
                  }))
                }
              />
            </>
          )}

          <label className="formLabel">Motivo</label>
          <input
            placeholder="Férias, feriado, compromisso..."
            value={novoBloqueio.motivo}
            onChange={(e) =>
              setNovoBloqueio((a) => ({
                ...a,
                motivo: e.target.value
              }))
            }
          />

          <button type="button" onClick={criarBloqueio}>
            Criar bloqueio
          </button>
        </div>
      </div>

      <div className="bloqueiosList">
        {bloqueios.map((b) => (
          <div className="bloqueioItem" key={b.id}>
            <div>
              <strong>{b.motivo}</strong>
              <span>
                {b.dataInicio} até {b.dataFim || b.dataInicio}
                {b.diaTodo ? " • dia inteiro" : ` • ${b.horario}`}
              </span>
            </div>

            <button type="button" onClick={() => removerBloqueio(b.id)}>
              Remover
            </button>
          </div>
        ))}
      </div>

      <h2 id="abertos" className="adminTitle">
  Agendamentos em aberto
</h2>

      <div className="adminGrid">
        {abertos.map((item) => (
          <div className="adminCard orderCard" key={item.id}>
            <div className={`status ${item.status}`}>
              {item.status}
            </div>

            <strong>{item.clienteNome}</strong>
            <span>{item.clienteTelefone}</span>

            <p>{item.servicoNome}</p>
            <p>{item.data} às {item.horario}</p>

            <b>R$ {Number(item.valor).toFixed(2)}</b>

            <div className="adminActions">
              <button
                type="button"
                className="successBtn"
                onClick={() => alterarStatus(item.id, "concluido")}
              >
                Concluir
              </button>

              <button
                type="button"
                className="cancelBtn"
                onClick={() => alterarStatus(item.id, "cancelado")}
              >
                Cancelar
              </button>

              <button
              type="button"
              className="whatsappBtn"
              onClick={() => chamarClienteWhatsApp(item)}
              >
              Chamar WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

     {/* FINALIZADOS */}
<div className="adminSection">

  <button
    className="groupToggle"
    onClick={() =>
      setGrupoFinalizadosAberto(
        !grupoFinalizadosAberto
      )
    }
  >
    <div>
      <h2 className="adminTitle">
        Agendamentos finalizados
      </h2>

      <span className="groupCount">
        {concluidos.length} itens
      </span>
    </div>

    <span className="groupArrow">
      {grupoFinalizadosAberto ? "−" : "+"}
    </span>
  </button>

  {grupoFinalizadosAberto && (
    <div className="adminGrid">
      {concluidos.map((item) => (
        <div
          className="adminCard finished"
          key={item.id}
        >
          <span className="statusBadge done">
            CONCLUÍDO
          </span>

          <h3>{item.clienteNome}</h3>

          <p>{item.clienteTelefone}</p>

          <p>{item.servicoNome}</p>

          <p>
            {item.data} às {item.horario}
          </p>

          <strong>
            R$ {Number(item.valor || 0).toFixed(2)}
          </strong>

          <button
            className="deleteBtn"
            onClick={() =>
              excluirAgendamento(item.id)
            }
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  )}
</div>

{/* CANCELADOS */}
<div className="adminSection">

  <button
    className="groupToggle"
    onClick={() =>
      setGrupoCanceladosAberto(
        !grupoCanceladosAberto
      )
    }
  >
    <div>
      <h2 className="adminTitle">
        Agendamentos cancelados
      </h2>

      <span className="groupCount">
        {cancelados.length} itens
      </span>
    </div>

    <span className="groupArrow">
      {grupoCanceladosAberto ? "−" : "+"}
    </span>
  </button>

  {grupoCanceladosAberto && (
    <div className="adminGrid">
      {cancelados.map((item) => (
        <div
          className="adminCard cancelled"
          key={item.id}
        >
          <span className="statusBadge cancel">
            CANCELADO
          </span>

          <h3>{item.clienteNome}</h3>

          <p>{item.clienteTelefone}</p>

          <p>{item.servicoNome}</p>

          <p>
            {item.data} às {item.horario}
          </p>

          <strong>
            R$ {Number(item.valor || 0).toFixed(2)}
          </strong>

          <button
            className="deleteBtn"
            onClick={() =>
              excluirAgendamento(item.id)
            }
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  )}
</div>

      <h2 id="servicosAdmin" className="adminTitle">
  Criar novo serviço
</h2>

      <div className="servicesAdminGrid">
        <div className="serviceAdminCard premiumForm">
          <div className="imagePreview">
            {novoServico.imagemUrl ? (
              <img src={novoServico.imagemUrl} alt="" />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>

          <label className="uploadBox">
            Escolher imagem
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                imagemParaBase64(e.target.files?.[0], (base64) =>
                  alterarNovoServico("imagemUrl", base64)
                )
              }
            />
          </label>

          <input
            placeholder="Nome"
            value={novoServico.nome}
            onChange={(e) => alterarNovoServico("nome", e.target.value)}
          />

          <textarea
            placeholder="Descrição"
            value={novoServico.descricao}
            onChange={(e) => alterarNovoServico("descricao", e.target.value)}
          />

          <input
            type="number"
            placeholder="Preço"
            value={novoServico.preco}
            onChange={(e) => alterarNovoServico("preco", e.target.value)}
          />

          <input
            type="number"
            placeholder="Preço promocional"
            value={novoServico.precoPromocional}
            onChange={(e) => alterarNovoServico("precoPromocional", e.target.value)}
          />

          <label className="checkLine">
            <input
              type="checkbox"
              checked={novoServico.promocaoAtiva}
              onChange={(e) => alterarNovoServico("promocaoAtiva", e.target.checked)}
            />
            Promoção ativa
          </label>

          <label className="checkLine">
            <input
              type="checkbox"
              checked={novoServico.ativo}
              onChange={(e) => alterarNovoServico("ativo", e.target.checked)}
            />
            Serviço ativo
          </label>

          <button type="button" onClick={criarServico}>
            Criar serviço
          </button>
        </div>
      </div>

      <h2 className="adminTitle">Serviços cadastrados</h2>

      <div className="servicesAdminGrid">
        {servicos.map((servico, index) => (
          <div className="serviceAdminCard premiumForm" key={servico.id}>
            <div className="imagePreview">
              {servico.imagemUrl ? (
                <img src={servico.imagemUrl} alt="" />
              ) : (
                <span>Sem imagem</span>
              )}
            </div>

            <label className="uploadBox">
              Escolher imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  imagemParaBase64(e.target.files?.[0], (base64) =>
                    alterarServico(index, "imagemUrl", base64)
                  )
                }
              />
            </label>

            <input
              value={servico.nome}
              onChange={(e) => alterarServico(index, "nome", e.target.value)}
            />

            <textarea
              value={servico.descricao}
              onChange={(e) => alterarServico(index, "descricao", e.target.value)}
            />

            <input
              type="number"
              value={servico.preco}
              onChange={(e) => alterarServico(index, "preco", e.target.value)}
            />

            <input
              type="number"
              value={servico.precoPromocional}
              onChange={(e) => alterarServico(index, "precoPromocional", e.target.value)}
            />

            <label className="checkLine">
              <input
                type="checkbox"
                checked={servico.promocaoAtiva}
                onChange={(e) => alterarServico(index, "promocaoAtiva", e.target.checked)}
              />
              Promoção ativa
            </label>

            <label className="checkLine">
              <input
                type="checkbox"
                checked={servico.ativo}
                onChange={(e) => alterarServico(index, "ativo", e.target.checked)}
              />
              Serviço ativo
            </label>

           <div
  style={{
    display: "flex",
    gap: 10,
    marginTop: 12
  }}
>

  <button
    type="button"
    onClick={() =>
      salvarServico(servico)
    }
    style={{
      flex: 1,

      border: "none",
      height: 46,

      borderRadius: 14,

      background:
        "linear-gradient(135deg,#ea1d2c,#ff4d5e)",

      color: "#fff",

      fontWeight: 800,
      fontSize: 14,

      cursor: "pointer",

      boxShadow:
        "0 10px 20px rgba(234,29,44,0.20)"
    }}
  >
    Salvar
  </button>

  <button
    type="button"
    onClick={() =>
      excluirServico(servico.id)
    }
    className="dangerFullBtn"
    style={{
      flex: 1,
      height: 46,
      borderRadius: 14
    }}
  >
    Excluir
  </button>

</div>
          </div>
        ))}
      </div>
    </div>
  );
}