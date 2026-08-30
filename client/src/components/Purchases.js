import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Steps,
  Tooltip,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
  TrophyOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMe,
  getPurchaseStats,
  getPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  submitPurchaseRequest,
  decidePurchaseRequest,
  deletePurchaseRequest,
  getQuotations,
  createQuotation,
  sendQuotation,
  recordQuotationOffer,
  awardQuotation,
  getPurchaseOrders,
  createOrderFromQuotation,
  decidePurchaseOrder,
  receivePurchaseOrder,
  downloadPurchaseOrderPdf,
  getAllSuppliers,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./Purchases.css";

const { Option } = Select;

// Les trois etapes du flux, dans l'ordre ou elles se franchissent.
const ONGLETS = [
  { key: "demandes", label: "Demandes d'achat" },
  { key: "consultations", label: "Demandes de prix" },
  { key: "commandes", label: "Commandes d'achat" },
];

const COULEUR_STATUT = {
  Brouillon: "default",
  Soumise: "processing",
  Approuvée: "success",
  Refusée: "error",
  Clôturée: "purple",
  Annulée: "default",
  Envoyée: "processing",
  Dépouillée: "warning",
  Attribuée: "success",
  "En attente d'approbation": "processing",
  Validée: "success",
  "Partiellement payée": "warning",
  Payée: "green",
};

const COULEUR_URGENCE = {
  Basse: "default",
  Normale: "blue",
  Haute: "orange",
  Critique: "red",
};

const COULEUR_RECEPTION = {
  "Non réceptionnée": "default",
  Partielle: "warning",
  Complète: "success",
};

const montant = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(valeur || 0));

const jour = (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—");

/** Niveau en attente d'une demande, ou null si le circuit est achevé. */
const niveauCourant = (demande) =>
  (demande.circuit || []).find((n) => n.statut === "En attente") || null;

/**
 * Une permission d'approbation n'autorise pas à trancher n'importe quelle
 * demande : le circuit désigne qui décide maintenant. Le bouton ne s'affiche
 * donc que pour le titulaire du niveau courant — le serveur applique la même
 * règle, ceci n'est que sa traduction visible.
 */
const peutTrancher = (utilisateur, dossier) => {
  const niveau = niveauCourant(dossier);
  if (!niveau || !utilisateur) return false;
  if (niveau.ouvert) return true; // la permission a déjà été vérifiée en amont

  // Le titulaire désigné, d'abord.
  if (
    String(niveau.approbateur?._id || niveau.approbateur) ===
    String(utilisateur._id)
  ) {
    return true;
  }

  // À défaut, tout détenteur du même titre : c'est ce qui évite qu'un départ
  // ne fige durablement le circuit. Le super administrateur, lui, n'est pas
  // titulaire d'office — il dispose d'un déblocage explicite, que le serveur
  // exige motivé. L'inclure ici masquerait ce bouton et lui proposerait une
  // approbation que le serveur refuserait.
  return Boolean(
    niveau.roleApprobateur && utilisateur.role === niveau.roleApprobateur,
  );
};

const ETAT_NIVEAU = {
  Approuvé: "finish",
  Refusé: "error",
  "En attente": "process",
  "Sans objet": "wait",
};

/**
 * Circuit d'approbation d'un dossier — demande d'achat ou commande.
 *
 * Les deux étapes qui demandent une approbation l'affichent à l'identique :
 * c'est lui qui explique où en est le dossier, qui doit trancher, et pourquoi
 * il attend.
 */
const CircuitApprobation = ({ dossier }) => {
  const circuit = dossier.circuit || [];
  if (!circuit.length) return null;

  return (
    <div className="achats-circuit">
      <div className="achats-circuit-titre">Circuit d'approbation</div>
      <Steps
        size="small"
        direction="horizontal"
        responsive
        current={circuit.findIndex((n) => n.statut === "En attente")}
        items={circuit.map((n) => ({
          title: n.intitule,
          status: ETAT_NIVEAU[n.statut] || "wait",
          description: (
            <span className="achats-sous-titre">
              {n.approbateur?.name || (n.ouvert ? "toute habilitation" : "—")}
              {n.date ? ` · ${jour(n.date)}` : ""}
              {n.motif ? ` · ${n.motif}` : ""}
            </span>
          ),
        }))}
      />
    </div>
  );
};

const Purchases = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);

  const [stats, setStats] = useState({});
  const [demandes, setDemandes] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [chargement, setChargement] = useState(false);

  const [demandeModale, setDemandeModale] = useState(false);
  const [demandeEnEdition, setDemandeEnEdition] = useState(null);
  const [consultModale, setConsultModale] = useState(false);
  const [demandeAConsulter, setDemandeAConsulter] = useState(null);
  const [offreModale, setOffreModale] = useState(null);
  const [attributionModale, setAttributionModale] = useState(null);
  const [receptionModale, setReceptionModale] = useState(null);

  const [formDemande] = Form.useForm();
  const [formConsult] = Form.useForm();
  const [formOffre] = Form.useForm();
  const [formAttribution] = Form.useForm();
  const [formReception] = Form.useForm();

  const peut = useCallback(
    (permission) => utilisateur && canAccessModule(utilisateur, permission),
    [utilisateur],
  );

  useEffect(() => {
    getMe().then(setUtilisateur).catch(() => {});
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [s, d, c, o] = await Promise.all([
        getPurchaseStats(),
        getPurchaseRequests(),
        getQuotations(),
        getPurchaseOrders({ flux: "achats" }),
      ]);
      setStats(s);
      setDemandes(d);
      setConsultations(c);
      setCommandes(o);
    } catch (error) {
      message.error(error.message || "Chargement du module achats impossible");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Les fournisseurs ne servent qu'a monter une consultation.
  useEffect(() => {
    if (!peut("purchases.rfq.manage")) return;
    getAllSuppliers()
      .then((liste) =>
        setFournisseurs(Array.isArray(liste) ? liste : liste?.suppliers || []),
      )
      .catch(() => {});
  }, [peut]);

  // Ses propres brouillons : ceux qui attendent une action de sa part.
  const mesBrouillons = demandes.filter(
    (d) =>
      d.statut === "Brouillon" &&
      String(d.demandeur?._id || d.demandeur) === String(utilisateur?._id),
  );

  const indicateurs = useMemo(
    () => [
      {
        libelle: "Demandes à approuver",
        valeur: stats.aApprouver ?? 0,
        icone: <SolutionOutlined />,
      },
      {
        libelle: "Consultations ouvertes",
        valeur: stats.consultationsOuvertes ?? 0,
        icone: <FileDoneOutlined />,
      },
      {
        libelle: "Commandes à approuver",
        valeur: stats.aValider ?? 0,
        icone: <ShoppingCartOutlined />,
      },
      {
        libelle: "Montant engagé",
        valeur: montant(stats.montantEngage),
        icone: <TrophyOutlined />,
      },
    ],
    [stats],
  );

  // --- Demandes d'achat -----------------------------------------------------

  const ouvrirDemande = (demande = null) => {
    setDemandeEnEdition(demande);
    if (demande) {
      formDemande.setFieldsValue({
        ...demande,
        dateBesoin: demande.dateBesoin ? dayjs(demande.dateBesoin) : null,
      });
    } else {
      formDemande.resetFields();
      formDemande.setFieldsValue({
        urgence: "Normale",
        lignes: [{ unite: "unité", quantite: 1, prixEstime: 0 }],
      });
    }
    setDemandeModale(true);
  };

  const enregistrerDemande = async (soumettre = false) => {
    try {
      const valeurs = await formDemande.validateFields();
      const charge = {
        ...valeurs,
        dateBesoin: valeurs.dateBesoin
          ? valeurs.dateBesoin.toISOString()
          : undefined,
      };
      if (demandeEnEdition) {
        await updatePurchaseRequest(demandeEnEdition._id, charge);
        if (soumettre) {
          await submitPurchaseRequest(demandeEnEdition._id);
          message.success("Demande soumise à approbation");
        } else {
          message.success("Demande mise à jour");
        }
      } else {
        const reponse = await createPurchaseRequest(charge);
        const creee = reponse?.data?.demande;
        if (soumettre && creee?._id) {
          // Le circuit ne se construit qu'a la soumission : sans elle, aucun
          // approbateur n'est saisi et la demande dort en brouillon.
          await submitPurchaseRequest(creee._id);
          message.success("Demande créée et soumise à approbation");
        } else {
          message.warning(
            "Brouillon enregistré — il faut le soumettre pour qu'il parte en approbation",
          );
        }
      }
      setDemandeModale(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Enregistrement impossible");
    }
  };

  const telechargerBon = async (commande) => {
    try {
      await downloadPurchaseOrderPdf(commande._id, commande.orderNumber);
    } catch (error) {
      message.error(error.message || "Téléchargement impossible");
    }
  };

  /** Le demandeur de la demande d'achat dont la commande découle. */
  const estDemandeurDe = (commande) => {
    const demandeur =
      commande.demandeAchat?.demandeur?._id || commande.demandeAchat?.demandeur;
    return Boolean(demandeur) && String(demandeur) === String(utilisateur?._id);
  };

  const agir = async (action, succes) => {
    try {
      await action();
      message.success(succes);
      charger();
    } catch (error) {
      message.error(error.message || "Opération impossible");
    }
  };

  const colonnesDemandes = [
    { title: "N°", dataIndex: "numero", key: "numero", width: 130 },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      render: (objet, d) => (
        <div>
          <div className="achats-titre">{objet}</div>
          <div className="achats-sous-titre">
            {d.departement} · {(d.lignes || []).length} ligne(s)
          </div>
        </div>
      ),
    },
    {
      title: "Urgence",
      dataIndex: "urgence",
      key: "urgence",
      width: 110,
      render: (u) => <Tag color={COULEUR_URGENCE[u]}>{u}</Tag>,
    },
    {
      title: "Estimé",
      key: "montantEstime",
      width: 130,
      align: "right",
      render: (_, d) => montant(d.montantEstime),
    },
    {
      title: "Demandeur",
      key: "demandeur",
      width: 160,
      render: (_, d) => d.demandeur?.name || "—",
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 190,
      render: (s, d) => {
        const niveau = niveauCourant(d);
        return (
          <div>
            <Tag color={COULEUR_STATUT[s]}>{s}</Tag>
            {niveau && (
              <div className="achats-sous-titre">en attente de {niveau.intitule}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, d) => {
        const mienne = String(d.demandeur?._id || d.demandeur) === String(utilisateur?._id);
        return (
          <Space size={4} wrap>
            {d.statut === "Brouillon" && mienne && (
              <>
                <Tooltip title="Modifier">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => ouvrirDemande(d)}
                  />
                </Tooltip>
                <Tooltip title="Soumettre à approbation">
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    onClick={() =>
                      agir(() => submitPurchaseRequest(d._id), "Demande soumise")
                    }
                  />
                </Tooltip>
                <Popconfirm
                  title="Supprimer ce brouillon ?"
                  okText="Supprimer"
                  cancelText="Annuler"
                  onConfirm={() =>
                    agir(() => deletePurchaseRequest(d._id), "Demande supprimée")
                  }
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            )}
            {d.statut === "Soumise" &&
              peut("purchases.requests.approve") &&
              !mienne &&
              peutTrancher(utilisateur, d) && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() =>
                    agir(
                      () => decidePurchaseRequest(d._id, { decision: "Approuvée" }),
                      "Demande approuvée",
                    )
                  }
                >
                  Approuver
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => refuser(d)}
                >
                  Refuser
                </Button>
              </>
            )}
            {/* Déblocage : un circuit figé — directeur absent, compte
                désactivé — ne doit pas immobiliser les achats. L'acte est
                réservé au super administrateur, motivé, et tracé. */}
            {d.statut === "Soumise" &&
              utilisateur?.role === "super_admin" &&
              !peutTrancher(utilisateur, d) && (
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<UnlockOutlined />}
                  onClick={() => debloquer(d)}
                >
                  Débloquer
                </Button>
              )}
            {d.statut === "Approuvée" && peut("purchases.rfq.manage") && (
              <Button
                size="small"
                icon={<FileDoneOutlined />}
                onClick={() => ouvrirConsultation(d)}
              >
                Consulter
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Un refus se motive : la modale l'impose, comme le serveur.
  const refuser = (demande) => {
    let motif = "";
    Modal.confirm({
      title: `Refuser la demande ${demande.numero}`,
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Motif du refus (obligatoire)"
          onChange={(e) => {
            motif = e.target.value;
          }}
        />
      ),
      okText: "Refuser",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        if (!motif.trim()) {
          message.error("Un refus doit être motivé");
          throw new Error("motif manquant");
        }
        await agir(
          () =>
            decidePurchaseRequest(demande._id, {
              decision: "Refusée",
              motif: motif.trim(),
            }),
          "Demande refusée",
        );
      },
    });
  };

  /**
   * Sort une demande d'un circuit figé. Le motif est obligatoire : c'est lui
   * qui distinguera plus tard un déblocage justifié d'un passage en force.
   */
  const debloquer = (demande) => {
    const niveau = niveauCourant(demande);
    let motif = "";
    Modal.confirm({
      title: `Débloquer ${demande.numero}`,
      content: (
        <div>
          <p className="achats-sous-titre">
            Cette demande attend la décision de <strong>{niveau?.intitule}</strong>.
            Le déblocage passe outre et reste inscrit dans le circuit.
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Motif du déblocage (obligatoire)"
            onChange={(e) => {
              motif = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Débloquer et approuver",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        if (!motif.trim()) {
          message.error("Un déblocage doit être motivé");
          throw new Error("motif manquant");
        }
        await agir(
          () =>
            decidePurchaseRequest(demande._id, {
              decision: "Approuvée",
              forcer: true,
              motif: motif.trim(),
            }),
          "Demande débloquée",
        );
      },
    });
  };

  /**
   * Refus d'un engagement. Comme pour la demande d'achat, le motif est
   * obligatoire : c'est la seule trace qui expliquera, plus tard, pourquoi
   * une consultation menée à son terme n'a pas donné de commande.
   */
  const refuserCommande = (commande) => {
    let motif = "";
    Modal.confirm({
      title: `Refuser la commande ${commande.orderNumber}`,
      content: (
        <div>
          <p className="achats-sous-titre">
            La demande d'achat d'origine reste approuvée : une autre
            consultation pourra être lancée sans la ressaisir.
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Motif du refus (obligatoire)"
            onChange={(e) => {
              motif = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Refuser",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        if (!motif.trim()) {
          message.error("Un refus doit être motivé");
          throw new Error("motif manquant");
        }
        await agir(
          () =>
            decidePurchaseOrder(commande._id, {
              decision: "Refusée",
              motif: motif.trim(),
            }),
          "Commande refusée",
        );
      },
    });
  };

  /** Sort une commande d'un circuit figé. Motivé, tracé dans le circuit. */
  const debloquerCommande = (commande) => {
    const niveau = niveauCourant(commande);
    let motif = "";
    Modal.confirm({
      title: `Débloquer ${commande.orderNumber}`,
      content: (
        <div>
          <p className="achats-sous-titre">
            Cette commande attend la décision de{" "}
            <strong>{niveau?.intitule}</strong>. Le déblocage passe outre et
            reste inscrit dans le circuit.
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Motif du déblocage (obligatoire)"
            onChange={(e) => {
              motif = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Débloquer et approuver",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        if (!motif.trim()) {
          message.error("Un déblocage doit être motivé");
          throw new Error("motif manquant");
        }
        await agir(
          () =>
            decidePurchaseOrder(commande._id, {
              decision: "Approuvée",
              forcer: true,
              motif: motif.trim(),
            }),
          "Commande débloquée",
        );
      },
    });
  };

  // --- Consultations --------------------------------------------------------

  const ouvrirConsultation = (demande) => {
    setDemandeAConsulter(demande);
    formConsult.resetFields();
    formConsult.setFieldsValue({ objet: demande.objet });
    setConsultModale(true);
  };

  const enregistrerConsultation = async () => {
    try {
      const valeurs = await formConsult.validateFields();
      await createQuotation({
        demandeAchat: demandeAConsulter._id,
        objet: valeurs.objet,
        fournisseurs: valeurs.fournisseurs,
        dateLimiteReponse: valeurs.dateLimiteReponse
          ? valeurs.dateLimiteReponse.toISOString()
          : undefined,
        notes: valeurs.notes,
      });
      message.success("Consultation créée");
      setConsultModale(false);
      choisirOnglet("consultations");
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Création impossible");
    }
  };

  const colonnesConsultations = [
    { title: "N°", dataIndex: "numero", key: "numero", width: 130 },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      render: (objet, c) => (
        <div>
          <div className="achats-titre">{objet}</div>
          <div className="achats-sous-titre">
            issue de {c.demandeAchat?.numero || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Réponses",
      key: "reponses",
      width: 120,
      align: "center",
      render: (_, c) => {
        const chiffrees = (c.offres || []).filter((o) => o.montantHT != null);
        return (
          <Tag color={chiffrees.length >= 2 ? "green" : "default"}>
            {chiffrees.length} / {(c.offres || []).length}
          </Tag>
        );
      },
    },
    {
      title: "Retenue",
      key: "retenue",
      width: 190,
      render: (_, c) => {
        const gagnante = (c.offres || []).find((o) => o.retenue);
        if (!gagnante) return <span className="achats-sous-titre">—</span>;
        return (
          <div>
            <div className="achats-titre">{gagnante.fournisseur?.name}</div>
            <div className="achats-sous-titre">{montant(gagnante.montantHT)}</div>
          </div>
        );
      },
    },
    {
      title: "Limite",
      dataIndex: "dateLimiteReponse",
      key: "dateLimiteReponse",
      width: 110,
      render: jour,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      render: (s) => <Tag color={COULEUR_STATUT[s]}>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      align: "right",
      render: (_, c) => (
        <Space size={4} wrap>
          {c.statut === "Brouillon" && peut("purchases.rfq.manage") && (
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => agir(() => sendQuotation(c._id), "Consultation envoyée")}
            >
              Envoyer
            </Button>
          )}
          {["Envoyée", "Dépouillée"].includes(c.statut) &&
            peut("purchases.rfq.manage") && (
              <Button size="small" onClick={() => setOffreModale(c)}>
                Saisir les offres
              </Button>
            )}
          {c.statut === "Dépouillée" && peut("purchases.rfq.award") && (
            <Button
              size="small"
              type="primary"
              icon={<TrophyOutlined />}
              onClick={() => {
                formAttribution.resetFields();
                setAttributionModale(c);
              }}
            >
              Attribuer
            </Button>
          )}
          {c.statut === "Attribuée" &&
            !c.commande &&
            peut("purchases.orders.create") && (
              <Button
                size="small"
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() =>
                  agir(
                    () => createOrderFromQuotation(c._id),
                    "Commande émise",
                  ).then(() => choisirOnglet("commandes"))
                }
              >
                Commander
              </Button>
            )}
        </Space>
      ),
    },
  ];

  // --- Commandes ------------------------------------------------------------

  const colonnesCommandes = [
    { title: "N°", dataIndex: "orderNumber", key: "orderNumber", width: 130 },
    {
      title: "Objet",
      dataIndex: "title",
      key: "title",
      render: (titre, c) => (
        <div>
          <div className="achats-titre">{titre}</div>
          <div className="achats-sous-titre">
            {c.supplier?.name || "—"}
            {c.demandeAchat?.numero ? ` · ${c.demandeAchat.numero}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Montant",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      align: "right",
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (m) => <strong>{montant(m)}</strong>,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (s) => <Tag color={COULEUR_STATUT[s]}>{s}</Tag>,
    },
    {
      title: "Réception",
      dataIndex: "receptionStatut",
      key: "receptionStatut",
      width: 150,
      render: (r) => <Tag color={COULEUR_RECEPTION[r]}>{r}</Tag>,
    },
    { title: "Date", dataIndex: "date", key: "date", width: 110, render: jour },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, c) => {
        const emetteur = String(c.createdBy?._id || c.createdBy) === String(utilisateur?._id);

        // Une commande attend une décision tant qu'elle n'est ni approuvée ni
        // refusée. « Brouillon » couvre les commandes saisies hors flux
        // achats, qui n'ont pas de service demandeur, donc pas de circuit :
        // l'habilitation seule y décide, comme auparavant.
        const aDecider =
          c.status === "Brouillon" || c.status === "En attente d'approbation";
        const sousCircuit = (c.circuit || []).length > 0;

        return (
          <Space size={4} wrap>
            {aDecider &&
              peut("purchases.orders.validate") &&
              !emetteur &&
              (!sousCircuit || peutTrancher(utilisateur, c)) && (
                <>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() =>
                      agir(
                        () =>
                          decidePurchaseOrder(c._id, {
                            decision: "Approuvée",
                          }),
                        "Commande approuvée",
                      )
                    }
                  >
                    Approuver
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => refuserCommande(c)}
                  >
                    Refuser
                  </Button>
                </>
              )}
            {/* Déblocage : un circuit figé — directeur absent, compte
                désactivé — ne doit pas immobiliser un engagement. Réservé au
                super administrateur, motivé, et tracé. */}
            {aDecider &&
              sousCircuit &&
              utilisateur?.role === "super_admin" &&
              !peutTrancher(utilisateur, c) && (
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<UnlockOutlined />}
                  onClick={() => debloquerCommande(c)}
                >
                  Débloquer
                </Button>
              )}
            <Tooltip title="Bon de commande (PDF)">
              <Button
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => telechargerBon(c)}
              />
            </Tooltip>
            {/* On ne réceptionne que ce qui a été réellement commandé : ni un
                brouillon, ni une commande en attente, refusée ou annulée. */}
            {!aDecider &&
              c.status !== "Annulée" &&
              c.status !== "Refusée" &&
              c.receptionStatut !== "Complète" &&
              // Celui qui a exprimé le besoin constate sa propre livraison,
              // sans détenir de droit général sur les commandes.
              (peut("purchases.orders.receive") || estDemandeurDe(c)) && (
                <Button
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => {
                    formReception.resetFields();
                    setReceptionModale(c);
                  }}
                >
                  Réceptionner
                </Button>
              )}
          </Space>
        );
      },
    },
  ];

  const tableParOnglet = {
    demandes: (
      <Table
        rowKey="_id"
        columns={colonnesDemandes}
        dataSource={demandes}
        loading={chargement}
        pagination={{ pageSize: 12, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: (d) => (
            <div>
              {/* Le circuit d'abord : c'est lui qui explique où en est la
                  demande, et pourquoi elle attend. */}
              <CircuitApprobation dossier={d} />
              <Table
                rowKey="_id"
                size="small"
                pagination={false}
                dataSource={d.lignes || []}
                columns={[
                  { title: "Désignation", dataIndex: "designation", key: "designation" },
                  { title: "Quantité", dataIndex: "quantite", key: "quantite", width: 100 },
                  { title: "Unité", dataIndex: "unite", key: "unite", width: 100 },
                  {
                    title: "Prix estimé",
                    dataIndex: "prixEstime",
                    key: "prixEstime",
                    width: 130,
                    align: "right",
                    render: montant,
                  },
                  {
                    title: "Total",
                    key: "total",
                    width: 130,
                    align: "right",
                    render: (_, l) => montant(l.quantite * l.prixEstime),
                  },
                ]}
              />
            </div>
          ),
        }}
      />
    ),
    consultations: (
      <Table
        rowKey="_id"
        columns={colonnesConsultations}
        dataSource={consultations}
        loading={chargement}
        pagination={{ pageSize: 12, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: (c) => (
            <Table
              rowKey="_id"
              size="small"
              pagination={false}
              dataSource={c.offres || []}
              columns={[
                {
                  title: "Fournisseur",
                  key: "fournisseur",
                  render: (_, o) => o.fournisseur?.name || "—",
                },
                {
                  title: "Montant HT",
                  dataIndex: "montantHT",
                  key: "montantHT",
                  width: 140,
                  align: "right",
                  render: (m) =>
                    m == null ? (
                      <span className="achats-sous-titre">en attente</span>
                    ) : (
                      montant(m)
                    ),
                },
                {
                  title: "Délai",
                  dataIndex: "delaiLivraisonJours",
                  key: "delai",
                  width: 110,
                  render: (d) => (d == null ? "—" : `${d} j`),
                },
                {
                  title: "Conditions",
                  dataIndex: "conditionsPaiement",
                  key: "conditions",
                },
                {
                  title: "",
                  key: "retenue",
                  width: 110,
                  render: (_, o) =>
                    o.retenue ? <Tag color="green">Retenue</Tag> : null,
                },
              ]}
            />
          ),
        }}
      />
    ),
    commandes: (
      <Table
        rowKey="_id"
        columns={colonnesCommandes}
        dataSource={commandes}
        loading={chargement}
        pagination={{ pageSize: 12, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: (c) => (
            <div>
              {/* Le circuit d'abord : c'est lui qui dit qui doit approuver
                  l'engagement, et ce qu'il en a décidé. */}
              <CircuitApprobation dossier={c} />
              <Table
              rowKey="_id"
              size="small"
              pagination={false}
              dataSource={c.lignes || []}
              columns={[
                { title: "Désignation", dataIndex: "designation", key: "designation" },
                { title: "Commandé", dataIndex: "quantite", key: "quantite", width: 110 },
                {
                  title: "Reçu",
                  dataIndex: "quantiteRecue",
                  key: "quantiteRecue",
                  width: 110,
                  render: (recu, l) => (
                    <Tag color={recu >= l.quantite ? "green" : "orange"}>
                      {recu || 0}
                    </Tag>
                  ),
                },
                {
                  title: "Prix unitaire",
                  dataIndex: "prixUnitaire",
                  key: "prixUnitaire",
                  width: 140,
                  align: "right",
                  render: montant,
                },
              ]}
              />
            </div>
          ),
        }}
      />
    ),
  };

  return (
    <div className="dashboard-content achats-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Achats
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={charger}>
            Actualiser
          </Button>
          {peut("purchases.requests.create") && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => ouvrirDemande()}
            >
              Nouvelle demande
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {indicateurs.map((indicateur) => (
          <Col xs={24} sm={12} lg={6} key={indicateur.libelle}>
            <Card className="kpi-card">
              <div className="achats-kpi">
                <div className="kpi-icon">{indicateur.icone}</div>
                <div>
                  <div className="kpi-label">{indicateur.libelle}</div>
                  <div className="kpi-value">{indicateur.valeur}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Un brouillon n'est parti nulle part : tant qu'il n'est pas soumis,
          aucun approbateur ne le voit. Le rappel evite d'attendre une
          approbation qui n'a jamais ete demandee. */}
      {ongletActif === "demandes" && mesBrouillons.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${mesBrouillons.length} brouillon(s) non soumis`}
          description="Un brouillon n'est pas transmis : cliquez sur l'icône d'envoi pour le soumettre à son approbateur."
        />
      )}

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      {tableParOnglet[ongletActif]}

      {/* --- Demande d'achat --- */}
      <Modal
        title={demandeEnEdition ? "Modifier la demande" : "Nouvelle demande d'achat"}
        open={demandeModale}
        onCancel={() => setDemandeModale(false)}
        width={820}
        // Deux issues explicites : le brouillon se garde pour plus tard, la
        // soumission engage le circuit. Un bouton unique laissait croire que
        // « Enregistrer » suffisait a demander l'approbation.
        footer={[
          <Button key="annuler" onClick={() => setDemandeModale(false)}>
            Annuler
          </Button>,
          <Button key="brouillon" onClick={() => enregistrerDemande(false)}>
            Enregistrer le brouillon
          </Button>,
          <Button
            key="soumettre"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => enregistrerDemande(true)}
          >
            Enregistrer et soumettre
          </Button>,
        ]}
      >
        <Form form={formDemande} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="objet"
                label="Objet"
                rules={[{ required: true, message: "L'objet est obligatoire" }]}
              >
                <Input placeholder="Renouvellement des postes de travail" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="urgence" label="Urgence">
                <Select>
                  {["Basse", "Normale", "Haute", "Critique"].map((u) => (
                    <Option key={u} value={u}>
                      {u}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="justification"
            label="Justification"
            extra="Ce qui motive la dépense : c'est ce que lira l'approbateur."
          >
            <Input.TextArea rows={2} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="dateBesoin" label="Besoin pour le">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.List name="lignes">
            {(champs, { add, remove }) => (
              <>
                <div className="achats-lignes-entete">
                  <span>Lignes de la demande</span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => add({ unite: "unité", quantite: 1, prixEstime: 0 })}
                  >
                    Ajouter
                  </Button>
                </div>
                {champs.map((champ) => (
                  <Row gutter={8} key={champ.key} align="middle">
                    <Col xs={24} sm={9}>
                      <Form.Item
                        name={[champ.name, "designation"]}
                        rules={[{ required: true, message: "Désignation requise" }]}
                      >
                        <Input placeholder="Désignation" />
                      </Form.Item>
                    </Col>
                    <Col xs={8} sm={4}>
                      <Form.Item
                        name={[champ.name, "quantite"]}
                        rules={[{ required: true, message: "Quantité" }]}
                      >
                        <InputNumber
                          min={0.01}
                          placeholder="Qté"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={8} sm={4}>
                      <Form.Item name={[champ.name, "unite"]}>
                        <Select>
                          {["unité", "heure", "jour", "mois", "forfait", "kg", "litre"].map(
                            (u) => (
                              <Option key={u} value={u}>
                                {u}
                              </Option>
                            ),
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={8} sm={5}>
                      <Form.Item name={[champ.name, "prixEstime"]}>
                        <InputNumber
                          min={0}
                          step={10}
                          placeholder="Prix estimé"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={2}>
                      <Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={champs.length === 1}
                          onClick={() => remove(champ.name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* --- Consultation --- */}
      <Modal
        title={`Consulter les fournisseurs — ${demandeAConsulter?.numero || ""}`}
        open={consultModale}
        onCancel={() => setConsultModale(false)}
        onOk={enregistrerConsultation}
        okText="Créer la consultation"
        cancelText="Annuler"
        width={640}
      >
        <Form form={formConsult} layout="vertical">
          <Form.Item name="objet" label="Objet">
            <Input />
          </Form.Item>
          <Form.Item
            name="fournisseurs"
            label="Fournisseurs consultés"
            extra="Deux au minimum : sans mise en concurrence, le prix retenu n'est pas défendable."
            rules={[
              {
                required: true,
                message: "Sélectionnez au moins deux fournisseurs",
              },
              {
                validator: (_, valeur) =>
                  (valeur || []).length >= 2
                    ? Promise.resolve()
                    : Promise.reject(new Error("Deux fournisseurs au minimum")),
              },
            ]}
          >
            <Select mode="multiple" placeholder="Choisir les fournisseurs">
              {fournisseurs.map((f) => (
                <Option key={f._id} value={f._id}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateLimiteReponse" label="Date limite de réponse">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Saisie des offres --- */}
      <Modal
        title={`Offres reçues — ${offreModale?.numero || ""}`}
        open={!!offreModale}
        onCancel={() => setOffreModale(null)}
        footer={null}
        width={720}
      >
        <Table
          rowKey="_id"
          size="small"
          pagination={false}
          dataSource={offreModale?.offres || []}
          columns={[
            {
              title: "Fournisseur",
              key: "fournisseur",
              render: (_, o) => o.fournisseur?.name || "—",
            },
            {
              title: "Montant HT",
              dataIndex: "montantHT",
              key: "montantHT",
              width: 130,
              align: "right",
              render: (m) =>
                m == null ? (
                  <span className="achats-sous-titre">en attente</span>
                ) : (
                  montant(m)
                ),
            },
            {
              title: "",
              key: "action",
              width: 110,
              align: "right",
              render: (_, o) => (
                <Button
                  size="small"
                  onClick={() => {
                    formOffre.setFieldsValue({
                      montantHT: o.montantHT,
                      delaiLivraisonJours: o.delaiLivraisonJours,
                      conditionsPaiement: o.conditionsPaiement,
                    });
                    Modal.confirm({
                      title: `Réponse de ${o.fournisseur?.name}`,
                      content: (
                        <Form form={formOffre} layout="vertical">
                          <Form.Item
                            name="montantHT"
                            label="Montant HT (€)"
                            rules={[{ required: true, message: "Montant requis" }]}
                          >
                            <InputNumber min={0} style={{ width: "100%" }} />
                          </Form.Item>
                          <Form.Item
                            name="delaiLivraisonJours"
                            label="Délai de livraison (jours)"
                          >
                            <InputNumber min={0} style={{ width: "100%" }} />
                          </Form.Item>
                          <Form.Item
                            name="conditionsPaiement"
                            label="Conditions de paiement"
                          >
                            <Input placeholder="30 jours fin de mois" />
                          </Form.Item>
                        </Form>
                      ),
                      okText: "Enregistrer",
                      cancelText: "Annuler",
                      onOk: async () => {
                        const v = await formOffre.validateFields();
                        await recordQuotationOffer(offreModale._id, o._id, v);
                        message.success("Offre enregistrée");
                        setOffreModale(null);
                        charger();
                      },
                    });
                  }}
                >
                  Saisir
                </Button>
              ),
            },
          ]}
        />
      </Modal>

      {/* --- Attribution --- */}
      <Modal
        title={`Attribuer — ${attributionModale?.numero || ""}`}
        open={!!attributionModale}
        onCancel={() => setAttributionModale(null)}
        okText="Attribuer"
        cancelText="Annuler"
        onOk={async () => {
          try {
            const v = await formAttribution.validateFields();
            await awardQuotation(attributionModale._id, v);
            message.success("Offre attribuée");
            setAttributionModale(null);
            charger();
          } catch (error) {
            if (error?.errorFields) return;
            message.error(error.message || "Attribution impossible");
          }
        }}
      >
        <Form form={formAttribution} layout="vertical">
          <Form.Item
            name="offreId"
            label="Offre retenue"
            rules={[{ required: true, message: "Sélectionnez une offre" }]}
          >
            <Select placeholder="Choisir l'offre">
              {(attributionModale?.offres || [])
                .filter((o) => o.montantHT != null)
                .sort((a, b) => a.montantHT - b.montantHT)
                .map((o, index) => (
                  <Option key={o._id} value={o._id}>
                    {o.fournisseur?.name} — {montant(o.montantHT)}
                    {index === 0 ? " (moins-disant)" : ""}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="motif"
            label="Motif"
            extra="Obligatoire si l'offre retenue n'est pas la moins-disante."
          >
            <Input.TextArea
              rows={3}
              placeholder="Délai plus court, qualité supérieure, références…"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Réception --- */}
      <Modal
        title={`Réception — ${receptionModale?.orderNumber || ""}`}
        open={!!receptionModale}
        onCancel={() => setReceptionModale(null)}
        okText="Enregistrer la réception"
        cancelText="Annuler"
        width={640}
        onOk={async () => {
          try {
            const v = await formReception.validateFields();
            const receptions = (receptionModale.lignes || [])
              .map((l) => ({ ligneId: l._id, quantite: v[`q_${l._id}`] || 0 }))
              .filter((r) => r.quantite > 0);
            await receivePurchaseOrder(receptionModale._id, { receptions });
            message.success("Réception enregistrée");
            setReceptionModale(null);
            charger();
          } catch (error) {
            if (error?.errorFields) return;
            message.error(error.message || "Réception impossible");
          }
        }}
      >
        <Form form={formReception} layout="vertical">
          <p className="achats-sous-titre" style={{ marginTop: 0 }}>
            Indiquez les quantités reçues lors de cette livraison. Elles
            s'ajoutent à ce qui a déjà été réceptionné.
          </p>
          {(receptionModale?.lignes || []).map((l) => (
            <Form.Item
              key={l._id}
              name={`q_${l._id}`}
              label={`${l.designation} — reçu ${l.quantiteRecue || 0} / ${l.quantite}`}
            >
              <InputNumber
                min={0}
                max={l.quantite - (l.quantiteRecue || 0)}
                style={{ width: "100%" }}
                placeholder="0"
              />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default Purchases;
