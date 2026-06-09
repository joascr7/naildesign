import { useEffect, useState } from "react";
import "../App.css";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";

// ==========================================
// ESTADOS INICIAIS (Fora do componente para evitar recriação)
// ==========================================
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

const diasSemanaIniciais = [
  "domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Admin() {
  // 🔥 ESTADOS GERAIS
  const [mensagem, setMensagem] = useState("");
  const [grupoFinalizadosAberto, setGrupoFinalizadosAberto] = useState(false);
  const [grupoCanceladosAberto, setGrupoCanceladosAberto] = useState(false);
  const [diasAbertosExpandidos, setDiasAbertosExpandidos] = useState({});

  // 🔥 ESTADO DO MODAL DE CONFIRMAÇÃO (Substitui o window.confirm)
  const [modalConfirmacao, setModalConfirmacao] = useState({
    aberto: false,
    mensagem: "",
    acao: null
  });

  // 🔥 ESTADOS DE DADOS
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [novoServico, setNovoServico] = useState(servicoVazio);
  const [galeria, setGaleria] = useState([]);
  const [novaGaleria, setNovaGaleria] = useState(galeriaVazia);
  const [bloqueios, setBloqueios] = useState([]);
  const [novoBloqueio, setNovoBloqueio] = useState(bloqueioVazio);
  
  // 🔥 ESTADOS DE CONFIGURAÇÃO E AGENDA
  const [horariosAdmin, setHorariosAdmin] = useState([]);
  const [horariosSemana, setHorariosSemana] = useState({});
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

  // ==========================================
  // FUNÇÕES DO MODAL DE CONFIRMAÇÃO
  // ==========================================
  function pedirConfirmacao(mensagem, acaoCallback) {
    setModalConfirmacao({
      aberto: true,
      mensagem,
      acao: acaoCallback
    });
  }

  function executarConfirmacao() {
    if (modalConfirmacao.acao) modalConfirmacao.acao();
    fecharModal();
  }

  function fecharModal() {
    setModalConfirmacao({ aberto: false, mensagem: "", acao: null });
  }

  // ==========================================
  // FUNÇÕES UTILITÁRIAS E FEEDBACK
  // ==========================================
  function exibirMensagem(texto, tempo = 3000) {
    setMensagem(texto);
    setTimeout(() => setMensagem(""), tempo);
  }

  function imagemParaBase64(arquivo, callback) {
    if (!arquivo) return;
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => { img.src = e.target.result; };
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

  function formatarDataBrasil(data) {
    if (!data) return "";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function alternarDiaAcordeon(dataChave) {
    setDiasAbertosExpandidos(prev => ({
      ...prev,
      [dataChave]: prev[dataChave] !== undefined ? !prev[dataChave] : false
    }));
  }

  // ==========================================
  // BUSCA INICIAL DE DADOS (READ)
  // ==========================================
  async function carregarServicos() {
    const snap = await getDocs(collection(db, "servicos"));
    setServicos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function carregarConfigAgenda() {
    const snap = await getDoc(doc(db, "configAgenda", "principal"));
    if (snap.exists()) setConfigAgenda((prev) => ({ ...prev, ...snap.data() }));
  }

  async function carregarConfigSite() {
    const snap = await getDoc(doc(db, "siteConfig", "principal"));
    if (snap.exists()) setConfigSite((prev) => ({ ...prev, ...snap.data() }));
  }

  async function carregarBloqueios() {
    const snap = await getDocs(collection(db, "bloqueiosAgenda"));
    setBloqueios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function carregarGaleria() {
    const snap = await getDocs(collection(db, "galeria"));
    setGaleria(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function carregarHorariosSemana() {
    const snap = await getDoc(doc(db, "configAgenda", "horariosSemana"));
    if (snap.exists()) {
      setHorariosSemana(snap.data());
    } else {
      const defaultHorarios = {};
      diasSemanaIniciais.forEach(dia => {
        defaultHorarios[dia] = { fechado: false, horarios: ["08:00", "09:00"] };
      });
      setHorariosSemana(defaultHorarios);
    }
  }

  async function carregarHorariosAdmin() {
    const snap = await getDoc(doc(db, "configAgenda", "horarios"));
    if (snap.exists() && Array.isArray(snap.data().lista)) {
      setHorariosAdmin(snap.data().lista);
    } else {
      setHorariosAdmin([]);
    }
  }

  // ==========================================
  // EFEITOS (LIFECYCLE)
  // ==========================================
  useEffect(() => {
    carregarServicos();
    carregarConfigAgenda();
    carregarConfigSite();
    carregarBloqueios();
    carregarGaleria();
    carregarHorariosSemana();
    carregarHorariosAdmin();

    // Listener Real-time para Agendamentos
    const unsub = onSnapshot(collection(db, "agendamentos"), (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
      setAgendamentos(lista);
    });

    return () => unsub();
  }, []);

  // ==========================================
  // OPERAÇÕES DE MUTAÇÃO (CREATE, UPDATE, DELETE)
  // ==========================================
  async function sairAdmin() {
    await signOut(auth);
    window.location.href = "/admin-login";
  }

  // --- CONFIGURAÇÕES DO SITE ---
  async function salvarConfigSite() {
    try {
      exibirMensagem("Salvando configurações do site...");
      await setDoc(doc(db, "siteConfig", "principal"), configSite);
      exibirMensagem("Configurações do site salvas com sucesso.");
    } catch (error) {
      exibirMensagem(`Erro ao salvar contato: ${error.message}`);
    }
  }

  // --- SERVIÇOS ---
  async function criarServico() {
    if (!novoServico.nome || !novoServico.preco) {
      exibirMensagem("Preencha pelo menos nome e preço.");
      return;
    }
    try {
      exibirMensagem("Criando serviço...");
      await addDoc(collection(db, "servicos"), novoServico);
      setNovoServico(servicoVazio);
      await carregarServicos();
      exibirMensagem("Novo serviço criado com sucesso.");
    } catch (error) {
      exibirMensagem(`Erro ao criar serviço: ${error.message}`);
    }
  }

  async function salvarServico(servico) {
    try {
      exibirMensagem(`Salvando "${servico.nome}"...`);
      await updateDoc(doc(db, "servicos", servico.id), servico);
      exibirMensagem(`Serviço "${servico.nome}" salvo com sucesso.`);
    } catch (error) {
      exibirMensagem("Erro ao salvar serviço.");
    }
  }

  async function excluirServico(id) {
    try {
      await deleteDoc(doc(db, "servicos", id));
      await carregarServicos();
      exibirMensagem("Serviço removido com sucesso.");
    } catch (error) {
      exibirMensagem("Erro ao excluir serviço.");
    }
  }

  function alterarServico(index, campo, valor) {
    const copia = [...servicos];
    copia[index] = { ...copia[index], [campo]: valor };
    setServicos(copia);
  }

  // --- AGENDA E BLOQUEIOS ---
  async function salvarConfigAgenda() {
    try {
      exibirMensagem("Salvando controle da agenda...");
      await setDoc(doc(db, "configAgenda", "principal"), configAgenda);
      exibirMensagem("Controle da agenda salvo com sucesso.");
    } catch (error) {
      exibirMensagem(`Erro ao salvar agenda: ${error.message}`);
    }
  }

  async function salvarHorariosSemana() {
    try {
      await setDoc(doc(db, "configAgenda", "horariosSemana"), horariosSemana);
      exibirMensagem("Horários salvos com sucesso.");
    } catch (error) {
      exibirMensagem("Erro ao salvar horários.");
    }
  }

  async function criarBloqueio() {
    if (!novoBloqueio.dataInicio || !novoBloqueio.motivo) {
      exibirMensagem("Preencha data inicial e motivo do bloqueio.");
      return;
    }
    try {
      exibirMensagem("Criando bloqueio...");
      await addDoc(collection(db, "bloqueiosAgenda"), {
        ...novoBloqueio,
        dataFim: novoBloqueio.dataFim || novoBloqueio.dataInicio,
        horario: novoBloqueio.diaTodo ? "" : novoBloqueio.horario,
        criadoEm: new Date()
      });
      setNovoBloqueio(bloqueioVazio);
      await carregarBloqueios();
      exibirMensagem("Bloqueio criado com sucesso.");
    } catch (error) {
      exibirMensagem(`Erro ao criar bloqueio: ${error.message}`);
    }
  }

  async function removerBloqueio(id) {
    try {
      await deleteDoc(doc(db, "bloqueiosAgenda", id));
      await carregarBloqueios();
      exibirMensagem("Bloqueio removido.");
    } catch (error) {
      exibirMensagem(`Erro ao remover bloqueio: ${error.message}`);
    }
  }

  // --- GALERIA ---
  async function criarGaleria() {
    if (!novaGaleria.imagemUrl) {
      exibirMensagem("Escolha uma imagem para a galeria.");
      return;
    }
    try {
      exibirMensagem("Adicionando foto...");
      await addDoc(collection(db, "galeria"), { ...novaGaleria, criadoEm: new Date() });
      setNovaGaleria(galeriaVazia);
      await carregarGaleria();
      exibirMensagem("Foto adicionada à galeria.");
    } catch (error) {
      exibirMensagem(`Erro ao adicionar foto: ${error.message}`);
    }
  }

  async function salvarGaleria(item) {
    try {
      exibirMensagem(`Salvando "${item.titulo || "foto"}"...`);
      await updateDoc(doc(db, "galeria", item.id), item);
      exibirMensagem("Foto salva com sucesso.");
    } catch (error) {
      exibirMensagem(`Erro ao salvar foto: ${error.message}`);
    }
  }

  async function removerGaleria(id) {
    try {
      await deleteDoc(doc(db, "galeria", id));
      setGaleria((atual) => atual.filter((item) => item.id !== id));
      exibirMensagem("Foto removida.");
    } catch (error) {
      exibirMensagem(`Erro ao remover foto: ${error.message}`);
    }
  }

  function alterarGaleria(index, campo, valor) {
    const copia = [...galeria];
    copia[index] = { ...copia[index], [campo]: valor };
    setGaleria(copia);
  }

  // --- AGENDAMENTOS ---
  async function alterarStatus(id, status) {
    try {
      await updateDoc(doc(db, "agendamentos", id), { status });
      exibirMensagem(`Status atualizado para: ${status}`);
    } catch (error) {
      exibirMensagem(`Erro ao atualizar: ${error.message}`);
    }
  }

  async function excluirAgendamento(id) {
    try {
      await deleteDoc(doc(db, "agendamentos", id));
      exibirMensagem("Agendamento removido com sucesso.");
    } catch (error) {
      exibirMensagem("Erro ao excluir agendamento.");
    }
  }

  function chamarClienteWhatsApp(item) {
    const telefone = String(item.clienteTelefone || "").replace(/\D/g, "");
    const dataBrasil = item.data && item.data.includes("-")
      ? item.data.split("-").reverse().join("/")
      : item.data;
    const valorFormatated = item.valor
      ? Number(item.valor).toFixed(2).replace(".", ",")
      : "0,00";

    const texto = encodeURIComponent(
`Olá ${item.clienteNome}, tudo bem? 

Aqui é a Lays Nails Designer. É um prazer imenso receber você! Seu horário já está confirmado com muito carinho em nossa agenda:

 Serviço: ${item.servicoNome}
 Data: ${dataBrasil} às ${item.horario}
 Valor: R$ ${valorFormatated}

Já deixei tudo preparado exclusivamente para o seu atendimento. Se precisar de qualquer alteração, é só me avisar por aqui.

Mal posso esperar para deixar suas unhas perfeitas! Nos vemos em breve? `
    );

    const telefoneDestino = telefone || configSite.whatsapp; 
    window.open(`https://wa.me/55${telefoneDestino}?text=${texto}`, "_blank");
  }

  // ==========================================
  // CÁLCULOS DERIVADOS (ESTATÍSTICAS E GRUPOS)
  // ==========================================
  const abertos = agendamentos.filter((a) => a.status === "agendado" || a.status === "confirmado");
  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const cancelados = agendamentos.filter((a) => a.status === "cancelado");
  const faturamento = concluidos.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const abertosPorDia = abertos.reduce((acc, item) => {
    const dataAlvo = item.data || "Sem Data";
    if (!acc[dataAlvo]) {
      acc[dataAlvo] = [];
    }
    acc[dataAlvo].push(item);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(abertosPorDia).sort((a, b) => new Date(a) - new Date(b));

  // O primeiro dia carrega aberto por padrão se o estado ainda não foi definido
  if (datasOrdenadas.length > 0 && diasAbertosExpandidos[datasOrdenadas[0]] === undefined) {
    setDiasAbertosExpandidos({ [datasOrdenadas[0]]: true });
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="adminPage adminPremium">

      {/* --- MODAL DE CONFIRMAÇÃO GLOBAL --- */}
      {modalConfirmacao.aberto && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex",
          justifyContent: "center", alignItems: "center", padding: "20px",
          backdropFilter: "blur(3px)"
        }}>
          <div style={{
            background: "#fff", padding: "30px", borderRadius: "15px",
            maxWidth: "400px", width: "100%", textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "1.4rem" }}>Confirmar Ação</h3>
            <p style={{ color: "#555", marginBottom: "25px", fontSize: "1.1rem", lineHeight: "1.4" }}>
              {modalConfirmacao.mensagem}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                onClick={fecharModal} 
                style={{ flex: 1, background: "#e0e0e0", color: "#333", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
              >
                Cancelar
              </button>
              <button 
                onClick={executarConfirmacao} 
                style={{ flex: 1, background: "var(--accent-color, #d4a373)", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- TOPO --- */}
      <div className="adminTopBar">
        <div>
          <span className="adminEyebrow">{configSite.nomeLoja}</span>
          <h1>Painel Admin</h1>
          <p>Controle serviços, agenda, galeria, contato e faturamento.</p>
        </div>
        <div className="adminTopActions">
          <div className={configAgenda.agendaAberta ? "storeOpen" : "storeClosed"}>
            {configAgenda.agendaAberta ? "Agenda aberta" : "Agenda fechada"}
          </div>
          <button type="button" className="logoutBtn" onClick={() => pedirConfirmacao("Deseja realmente sair da sua conta administrativa?", sairAdmin)}>
            Sair
          </button>
        </div>
      </div>

      {/* --- MENU ÂNCORA --- */}
      <div className="adminMenu">
        <a href="#site">Site</a>
        <a href="#galeriaAdmin">Galeria</a>
        <a href="#agenda">Agenda</a>
        <a href="#abertos">Abertos</a>
        <a href="#concluidos">Concluídos</a>
        <a href="#cancelados">Cancelados</a>
        <a href="#servicosAdmin">Serviços</a>
      </div>

      {/* --- FEEDBACK FLUTUANTE --- */}
      {mensagem && <div className="adminMessage">{mensagem}</div>}

      {/* --- DASHBOARD ESTATÍSTICAS --- */}
      <div className="statsGrid premiumStats">
        <div className="statCard">
          <span>Em aberto</span>
          <strong>{abertos.length}</strong>
        </div>
        <div className="statCard successCard">
          <div className="statTop">
            <span>Concluídos</span>
            <div className="statIcon">✓</div>
          </div>
          <strong>{concluidos.length}</strong>
          <small>Serviços finalizados</small>
        </div>
        <div className="statCard">
          <span>Cancelados</span>
          <strong>{cancelados.length}</strong>
        </div>
        <div className="statCard statMoney">
          <span>Faturamento Global</span>
          <strong>R$ {faturamento.toFixed(2).replace(".", ",")}</strong>
        </div>
      </div>

      {/* --- CONFIGURAÇÕES DO SITE --- */}
      <h2 id="site" className="adminTitle">Configurações do site</h2>
      <div className="agendaControlGrid">
        <div className="agendaControlCard">
          <label className="formLabel">Nome da loja</label>
          <input
            value={configSite.nomeLoja}
            onChange={(e) => setConfigSite({ ...configSite, nomeLoja: e.target.value })}
          />

          <label className="formLabel">WhatsApp de Contato (Seu número)</label>
          <input
            value={configSite.whatsapp}
            onChange={(e) => setConfigSite({ ...configSite, whatsapp: e.target.value.replace(/\D/g, "") })}
          />

          <label className="formLabel">Instagram (Apenas o @usuario)</label>
          <input
            value={configSite.instagram}
            onChange={(e) => setConfigSite({ ...configSite, instagram: e.target.value })}
          />

          <label className="formLabel">Endereço Completo</label>
          <input
            value={configSite.endereco}
            onChange={(e) => setConfigSite({ ...configSite, endereco: e.target.value })}
          />

          <label className="formLabel">Texto de Apresentação</label>
          <textarea
            value={configSite.textoContato}
            onChange={(e) => setConfigSite({ ...configSite, textoContato: e.target.value })}
          />

          <label className="formLabel">Imagem Principal (Topo do site)</label>
          <div className="imagePreview">
            {configSite.heroImagem ? (
              <img src={configSite.heroImagem} alt="Capa" />
            ) : (
              <span>Nenhuma imagem enviada</span>
            )}
          </div>
          <label className="uploadBox">
            Escolher nova imagem
            <input
              type="file"
              accept="image/*"
              onChange={(e) => imagemParaBase64(e.target.files?.[0], (base64) =>
                setConfigSite({ ...configSite, heroImagem: base64 })
              )}
            />
          </label>

          <button type="button" onClick={() => pedirConfirmacao("Tem certeza que deseja salvar essas informações no site ao vivo?", salvarConfigSite)}>
            Salvar Configurações Visuais
          </button>
        </div>
      </div>

      {/* --- GALERIA DE FOTOS --- */}
      <h2 id="galeriaAdmin" className="adminTitle">Galeria / Prova Social</h2>
      <div className="servicesAdminGrid">
        <div className="serviceAdminCard premiumForm">
          <h3 style={{marginTop: 0}}>Adicionar Nova Foto</h3>
          <div className="imagePreview">
            {novaGaleria.imagemUrl ? <img src={novaGaleria.imagemUrl} alt="Preview" /> : <span>Pré-visualização</span>}
          </div>
          <label className="uploadBox">
            Carregar Imagem
            <input
              type="file"
              accept="image/*"
              onChange={(e) => imagemParaBase64(e.target.files?.[0], (base64) => setNovaGaleria({ ...novaGaleria, imagemUrl: base64 }))}
            />
          </label>
          <input
            placeholder="Título (Ex: Alongamento em Gel)"
            value={novaGaleria.titulo}
            onChange={(e) => setNovaGaleria({ ...novaGaleria, titulo: e.target.value })}
          />
          <textarea
            placeholder="Descrição breve do serviço feito"
            value={novaGaleria.descricao}
            onChange={(e) => setNovaGaleria({ ...novaGaleria, descricao: e.target.value })}
          />
          <label className="checkLine">
            <input
              type="checkbox"
              checked={novaGaleria.ativo}
              onChange={(e) => setNovaGaleria({ ...novaGaleria, ativo: e.target.checked })}
            />
            Exibir no site
          </label>
          <button type="button" onClick={() => pedirConfirmacao("Deseja publicar esta foto na galeria do site?", criarGaleria)}>
            Adicionar à Galeria
          </button>
        </div>

        {galeria.map((item, index) => (
          <div className="serviceAdminCard premiumForm" key={item.id}>
            <div className="imagePreview">
              {item.imagemUrl ? <img src={item.imagemUrl} alt="Galeria" /> : <span>Sem imagem</span>}
            </div>
            <label className="uploadBox">
              Trocar imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) => imagemParaBase64(e.target.files?.[0], (base64) => alterarGaleria(index, "imagemUrl", base64))}
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
              Exibir no site
            </label>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => pedirConfirmacao("Salvar as alterações desta foto?", () => salvarGaleria(item))} style={{ flex: 1 }}>Salvar</button>
              <button type="button" className="dangerFullBtn" onClick={() => pedirConfirmacao("Tem certeza que deseja apagar esta foto do site?", () => removerGaleria(item.id))} style={{ flex: 1 }}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- AGENDA: CONTROLE E BLOQUEIOS --- */}
      <h2 id="agenda" className="adminTitle">Controle de Agenda Diária</h2>
      
      <div className="agendaDiasGrid">
        {diasSemanaIniciais.map((dia) => (
          <div key={dia} className="agendaDiaCard">
            <h3 style={{ textTransform: "capitalize" }}>{dia}</h3>
            <label className="checkLine">
              <input
                type="checkbox"
                checked={horariosSemana[dia]?.fechado || false}
                onChange={(e) => setHorariosSemana({
                  ...horariosSemana,
                  [dia]: { ...horariosSemana[dia], fechado: e.target.checked }
                })}
              />
              Dia Fechado (sem atendimento)
            </label>
            <textarea
              placeholder="08:00, 09:00, 10:00"
              value={horariosSemana[dia]?.horarios?.join(", ") || ""}
              disabled={horariosSemana[dia]?.fechado}
              onChange={(e) => {
                const lista = e.target.value.split(",").map((h) => h.trim()).filter(Boolean);
                setHorariosSemana({
                  ...horariosSemana,
                  [dia]: { ...horariosSemana[dia], horarios: lista }
                });
              }}
            />
          </div>
        ))}
      </div>
      <button style={{ marginBottom: "2rem" }} onClick={() => pedirConfirmacao("Salvar todas as regras de horários da semana?", salvarHorariosSemana)}>
        Salvar Horários da Semana
      </button>

      <div className="agendaControlGrid">
        <div className="agendaControlCard">
          <label className="switchLine">
            <input
              type="checkbox"
              checked={configAgenda.agendaAberta}
              onChange={(e) => setConfigAgenda({ ...configAgenda, agendaAberta: e.target.checked })}
            />
            <div>
              <strong>Abertura Geral da Agenda</strong>
              <span>Desative para interromper agendamentos totalmente no site.</span>
            </div>
          </label>
          <label className="formLabel">A partir de qual data o cliente pode agendar?</label>
          <input
            type="date"
            value={configAgenda.dataInicioAgendamento}
            onChange={(e) => setConfigAgenda({ ...configAgenda, dataInicioAgendamento: e.target.value })}
          />
          <label className="formLabel">Aviso quando a agenda estiver fechada</label>
          <textarea
            value={configAgenda.mensagemFechado}
            onChange={(e) => setConfigAgenda({ ...configAgenda, mensagemFechado: e.target.value })}
          />
          <button type="button" onClick={() => pedirConfirmacao("Deseja aplicar estas regras gerais na agenda?", salvarConfigAgenda)}>Salvar Regras de Agenda</button>
        </div>

        <div className="agendaControlCard">
          <h3>Cadastrar Bloqueio Temporário (Férias/Feriados)</h3>
          <label className="formLabel">Data de Início</label>
          <input
            type="date"
            value={novoBloqueio.dataInicio}
            onChange={(e) => setNovoBloqueio({ ...novoBloqueio, dataInicio: e.target.value })}
          />
          <label className="formLabel">Data Final (Deixe em branco se for só um dia)</label>
          <input
            type="date"
            value={novoBloqueio.dataFim}
            onChange={(e) => setNovoBloqueio({ ...novoBloqueio, dataFim: e.target.value })}
          />
          <label className="checkLine">
            <input
              type="checkbox"
              checked={novoBloqueio.diaTodo}
              onChange={(e) => setNovoBloqueio({ ...novoBloqueio, diaTodo: e.target.checked })}
            />
            Bloquear os dias inteiros
          </label>
          {!novoBloqueio.diaTodo && (
            <>
              <label className="formLabel">Bloquear apenas horário específico</label>
              <input
                placeholder="Ex: 14:00"
                value={novoBloqueio.horario}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, horario: e.target.value })}
              />
            </>
          )}
          <label className="formLabel">Motivo Interno</label>
          <input
            placeholder="Ex: Feriado Nacional, Viagem..."
            value={novoBloqueio.motivo}
            onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
          />
          <button type="button" onClick={() => pedirConfirmacao("Confirmar criação deste bloqueio na agenda?", criarBloqueio)}>Aplicar Bloqueio</button>
        </div>
      </div>

      {bloqueios.length > 0 && (
        <div className="bloqueiosList">
          <h3 style={{ marginTop: "1rem" }}>Bloqueios Ativos</h3>
          {bloqueios.map((b) => (
            <div className="bloqueioItem" key={b.id}>
              <div>
                <strong>{b.motivo}</strong>
                <span>
                  {formatarDataBrasil(b.dataInicio)} até {formatarDataBrasil(b.dataFim || b.dataInicio)}
                  {b.diaTodo ? " • Dia Inteiro" : ` • Das ${b.horario}h`}
                </span>
              </div>
              <button className="dangerFullBtn" type="button" onClick={() => pedirConfirmacao("Deseja excluir este bloqueio e liberar a data?", () => removerBloqueio(b.id))}>Remover</button>
            </div>
          ))}
        </div>
      )}

      {/* --- LISTAGEM E EDIÇÃO DE SERVIÇOS CADASTRADOS --- */}
      <h2 id="servicosAdmin" className="adminTitle">Gerenciar Serviços</h2>
      <div className="servicesAdminGrid">
        {/* Card para Novo Serviço */}
        <div className="serviceAdminCard premiumForm">
          <h3>Cadastrar Novo Serviço</h3>
          <input placeholder="Nome do Serviço" value={novoServico.nome} onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })} />
          <textarea placeholder="Descrição" value={novoServico.descricao} onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })} />
          <input type="number" placeholder="Preço Base" value={novoServico.preco} onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })} />
          <button type="button" onClick={() => pedirConfirmacao("Deseja criar este novo serviço?", criarServico)}>Adicionar Serviço</button>
        </div>

        {/* Mapeamento dos serviços existentes */}
        {servicos.map((servico, index) => (
          <div className="serviceAdminCard premiumForm" key={servico.id}>
            <div className="imagePreview">
              {servico.imagemUrl ? <img src={servico.imagemUrl} alt="Serviço" /> : <span>Sem imagem</span>}
            </div>
            
            <label className="uploadBox">
              Trocar imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) => imagemParaBase64(e.target.files?.[0], (base64) => alterarServico(index, "imagemUrl", base64))}
              />
            </label>

            <input
              placeholder="Nome do Serviço"
              value={servico.nome}
              onChange={(e) => alterarServico(index, "nome", e.target.value)}
            />
            
            <textarea
              placeholder="Descrição"
              value={servico.descricao}
              onChange={(e) => alterarServico(index, "descricao", e.target.value)}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                placeholder="Preço Base"
                value={servico.preco}
                onChange={(e) => alterarServico(index, "preco", e.target.value)}
              />
              <input
                type="number"
                placeholder="Preço Promo"
                value={servico.precoPromocional}
                onChange={(e) => alterarServico(index, "precoPromocional", e.target.value)}
              />
            </div>

            <label className="checkLine">
              <input
                type="checkbox"
                checked={servico.promocaoAtiva}
                onChange={(e) => alterarServico(index, "promocaoAtiva", e.target.checked)}
              />
              Ativar Preço Promocional
            </label>

            <label className="checkLine">
              <input
                type="checkbox"
                checked={servico.ativo}
                onChange={(e) => alterarServico(index, "ativo", e.target.checked)}
              />
              Exibir no site
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button 
                type="button" 
                onClick={() => pedirConfirmacao(`Salvar alterações em "${servico.nome}"?`, () => salvarServico(servico))} 
                style={{ flex: 1 }}
              >
                Salvar
              </button>
              <button 
                type="button" 
                className="dangerFullBtn" 
                onClick={() => pedirConfirmacao(`Tem certeza que deseja excluir "${servico.nome}"?`, () => excluirServico(servico.id))} 
                style={{ flex: 1 }}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- AGENDAMENTOS EM ABERTO (SEPARADOS POR DIA COM SCROLL) --- */}
      <h2 id="abertos" className="adminTitle">Agendamentos em Aberto</h2>
      
      {datasOrdenadas.length === 0 ? (
        <p style={{ padding: "0 10px" }}>Nenhum agendamento pendente em aberto.</p>
      ) : (
        datasOrdenadas.map((dataChave) => {
          const listaDoDia = abertosPorDia[dataChave];
          const listaOrdenadaPorHorario = [...listaDoDia].sort((a, b) => String(a.horario).localeCompare(String(b.horario)));
          const expandido = diasAbertosExpandidos[dataChave];
          
          return (
            <div key={dataChave} className="adminDataGrupo" style={{ marginBottom: "1.5rem", background: "#fff", borderRadius: "10px", border: "1px solid #eaeaea", overflow: "hidden" }}>
              
              {/* CABEÇALHO DO DIA (CLICÁVEL PARA ABRIR/FECHAR) */}
              <div 
                onClick={() => alternarDiaAcordeon(dataChave)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "15px 20px", cursor: "pointer", background: expandido ? "#fcf6f0" : "#fff",
                  borderBottom: expandido ? "1px solid #d4a373" : "none",
                  transition: "all 0.3s ease"
                }}
              >
                <h3 style={{ margin: 0, color: "#333", fontSize: "1.2rem" }}>
                  📅 {formatarDataBrasil(dataChave)}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ background: "linear-gradient(135deg, #d4a373, #faedcd)", color: "#333", padding: "4px 12px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                    {listaDoDia.length} {listaDoDia.length === 1 ? "cliente" : "clientes"}
                  </span>
                  <span style={{ fontSize: "1.2rem", color: "#666" }}>{expandido ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* CORPO DO DIA (LIMITA A ALTURA PARA EVITAR TELA INFINITA) */}
              {expandido && (
                <div style={{ maxHeight: "500px", overflowY: "auto", padding: "20px", background: "#fafafa" }}>
                  <div className="adminGrid">
                    {listaOrdenadaPorHorario.map((item) => (
                      <div className="adminCard orderCard" key={item.id}>
                        <div className="cardHeader">
                          <div className={`statusPill status-${item.status}`}>
                            {item.status === 'agendado' ? 'Novo!' : 'Confirmado'}
                          </div>
                          <strong>{item.horario}</strong>
                        </div>
                        
                        <div className="cardBody">
                          <p><strong>Cliente:</strong> {item.clienteNome}</p>
                          <p><strong>Tel:</strong> {item.clienteTelefone}</p>
                          <p><strong>Serviço:</strong> {item.servicoNome}</p>
                          <p><strong>Valor Estimado:</strong> R$ {Number(item.valor || 0).toFixed(2).replace(".", ",")}</p>
                        </div>

                        <div className="cardActions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px" }}>
                          {/* Botão de WhatsApp não precisa de confirmação pois só redireciona de aba */}
                          <button onClick={() => chamarClienteWhatsApp(item)} style={{ flex: "1 1 100%", background: "#25D366", color: "#fff" }}>
                            📲 Enviar Confirmação
                          </button>
                          <button onClick={() => pedirConfirmacao("Deseja marcar este horário como Confirmado?", () => alterarStatus(item.id, "confirmado"))} style={{ flex: "1" }}>Confirmar</button>
                          <button onClick={() => pedirConfirmacao("O atendimento já foi realizado? Deseja finalizar este agendamento?", () => alterarStatus(item.id, "concluido"))} style={{ flex: "1", background: "#4caf50", color: "#fff" }}>Finalizar</button>
                          <button onClick={() => pedirConfirmacao("Atenção: Tem certeza que deseja CANCELAR este atendimento?", () => alterarStatus(item.id, "cancelado"))} className="dangerFullBtn" style={{ flex: "1" }}>Cancelar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* --- AGENDAMENTOS CONCLUÍDOS (COM SCROLL) --- */}
      <h2 id="concluidos" className="adminTitle" onClick={() => setGrupoFinalizadosAberto(!grupoFinalizadosAberto)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
        Concluídos ({concluidos.length}) {grupoFinalizadosAberto ? "▲" : "▼"}
      </h2>
      {grupoFinalizadosAberto && (
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "10px", border: "1px solid #eee", borderRadius: "10px", background: "#fafafa", marginBottom: "2rem" }}>
          <div className="adminGrid">
            {concluidos.map((item) => (
              <div className="adminCard orderCard" key={item.id} style={{ opacity: 0.8 }}>
                <div className="cardHeader">
                  <div className="statusPill status-concluido">Finalizado</div>
                  <strong>{formatarDataBrasil(item.data)} - {item.horario}</strong>
                </div>
                <div className="cardBody">
                  <p><strong>Cliente:</strong> {item.clienteNome}</p>
                  <p><strong>Serviço:</strong> {item.servicoNome}</p>
                  <p><strong>Valor:</strong> R$ {Number(item.valor || 0).toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- AGENDAMENTOS CANCELADOS (COM SCROLL) --- */}
      <h2 id="cancelados" className="adminTitle" onClick={() => setGrupoCanceladosAberto(!grupoCanceladosAberto)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
        Cancelados ({cancelados.length}) {grupoCanceladosAberto ? "▲" : "▼"}
      </h2>
      {grupoCanceladosAberto && (
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "10px", border: "1px solid #eee", borderRadius: "10px", background: "#fafafa", marginBottom: "2rem" }}>
          <div className="adminGrid">
            {cancelados.map((item) => (
              <div className="adminCard orderCard" key={item.id} style={{ opacity: 0.7, borderLeft: "4px solid #f44336" }}>
                <div className="cardHeader">
                  <div className="statusPill status-cancelado" style={{ background: "#fce4e4", color: "#f44336" }}>Cancelado</div>
                  <strong>{formatarDataBrasil(item.data)} - {item.horario}</strong>
                </div>
                <div className="cardBody">
                  <p><strong>Cliente:</strong> {item.clienteNome}</p>
                  <p><strong>Serviço:</strong> {item.servicoNome}</p>
                </div>
                <button className="dangerFullBtn" onClick={() => pedirConfirmacao("EXCLUIR PERMANENTE: Isso apagará este registro do banco de dados de vez. Continuar?", () => excluirAgendamento(item.id))} style={{ width: "100%", marginTop: "10px" }}>Excluir Permanentemente</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}