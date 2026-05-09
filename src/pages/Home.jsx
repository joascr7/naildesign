import { useEffect, useState } from "react";
import "../App.css";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import BookingModal from "../components/BookingModal";
import Gallery from "../components/Gallery";
import Contact from "../components/Contact";

import {
  collection,
  getDocs,
  getDoc,
  doc
} from "firebase/firestore";

import { db } from "../firebase";

export default function Home() {
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [galeria, setGaleria] = useState([]);
  const [configSite, setConfigSite] = useState({});

  function abrirModal(servico = null) {
    setServicoSelecionado(servico);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setServicoSelecionado(null);
  }

  async function carregarServicos() {
    const snap = await getDocs(collection(db, "servicos"));

    const lista = snap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    setServicos(lista.filter((s) => s.ativo === true));
  }

  async function carregarGaleria() {
    const snap = await getDocs(collection(db, "galeria"));

    const lista = snap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    setGaleria(lista.filter((item) => item.ativo === true));
  }

  async function carregarConfigSite() {
    const snap = await getDoc(doc(db, "siteConfig", "principal"));

    if (snap.exists()) {
      setConfigSite(snap.data());
    }
  }

  useEffect(() => {
    carregarServicos();
    carregarGaleria();
    carregarConfigSite();
  }, []);

  return (
    <div className="app">
      <Header onAgendar={() => abrirModal()} />

      <Hero
  config={configSite}
  onAgendar={() => abrirModal()}
/>

      <Services
        servicos={servicos}
        onAgendar={abrirModal}
      />

      <Gallery galeria={galeria} />

      <Contact
        config={configSite}
        onAgendar={() => abrirModal()}
      />

      {modalAberto && (
        <BookingModal
          servicoSelecionado={servicoSelecionado}
          servicos={servicos}
          onFechar={fecharModal}
        />
      )}
    </div>
  );
}