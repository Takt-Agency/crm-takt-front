import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EuroOutlined,
  FileAddOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createSubscription,
  deleteSubscription,
  generateSubscriptionInvoice,
  getAllClients,
  getCatalogServices,
  getMe,
  getSubscriptionStats,
  getSubscriptions,
  updateSubscription,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./Subscriptions.css";

const { Option } = Select;

const formatMontant = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(valeur || 0));

const COULEURS_STATUT = {
  active: "green",
  suspendue: "orange",
  terminee: "default",
};

const LIBELLES_STATUT = {
  active: "Actif",
  suspendue: "Suspendu",
  terminee: "Terminé",
};

// Un onglet par statut d'abonnement, porte par l'URL.
const ONGLETS = [
  { key: "tous", label: "Tous" },
  { key: "actifs", label: "Actifs" },
  { key: "suspendus", label: "Suspendus" },
  { key: "termines", label: "Terminés" },
];
const STATUT_PAR_ONGLET = {
  tous: undefined,
  actifs: "active",
  suspendus: "suspendue",
  termines: "terminee",
};

const Subscriptions = () => {
  const navigate = useNavigate();
  const [utilisateur, setUtilisateur] = useState(null);
  const [abonnements, setAbonnements] = useState([]);
  const [periodicites, setPeriodicites] = useState([]);
  const [clients, setClients] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [stats, setStats] = useState({});
  const [chargement, setChargement] = useState(false);
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);
  const filtreStatut = STATUT_PAR_ONGLET[ongletActif];

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [form] = Form.useForm();

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
      const [donnees, statistiques] = await Promise.all([
        getSubscriptions(filtreStatut ? { statut: filtreStatut } : {}),
        getSubscriptionStats(),
      ]);
      setAbonnements(donnees.abonnements || []);
      setPeriodicites(donnees.periodicites || []);
      setStats(statistiques);
    } catch (error) {
      message.error(error.message || "Chargement des abonnements impossible");
    } finally {
      setChargement(false);
    }
  }, [filtreStatut]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Clients et prestations ne servent qu'au formulaire : ils sont charges une
  // fois, et seulement si l'utilisateur peut creer un abonnement.
  useEffect(() => {
    if (!peut("subscriptions.manage")) return;
    getAllClients()
      .then((liste) => setClients(Array.isArray(liste) ? liste : liste?.clients || []))
      .catch(() => {});
    getCatalogServices({ actif: "true", recurrent: "true" })
      .then((donnees) => setPrestations(donnees.services || []))
      .catch(() => {});
  }, [peut]);

  const ouvrirCreation = () => {
    setEnEdition(null);
    form.resetFields();
    form.setFieldsValue({
      periodicite: "mensuelle",
      taxRate: 20,
      delaiPaiementJours: 30,
      genererAutomatiquement: true,
      dateDebut: dayjs(),
      items: [{ quantity: 1 }],
    });
    setModaleOuverte(true);
  };

  const ouvrirEdition = (abonnement) => {
    setEnEdition(abonnement);
    form.setFieldsValue({
      client: abonnement.client?._id || abonnement.client,
      libelle: abonnement.libelle,
      periodicite: abonnement.periodicite,
      taxRate: abonnement.taxRate,
      delaiPaiementJours: abonnement.delaiPaiementJours,
      genererAutomatiquement: abonnement.genererAutomatiquement,
      statut: abonnement.statut,
      dateDebut: abonnement.dateDebut ? dayjs(abonnement.dateDebut) : null,
      dateFin: abonnement.dateFin ? dayjs(abonnement.dateFin) : null,
      notes: abonnement.notes,
      items: (abonnement.items || []).map((l) => ({
        description: l.description,
        serviceCode: l.serviceCode,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    });
    setModaleOuverte(true);
  };

  const enregistrer = async () => {
    try {
      const valeurs = await form.validateFields();
      const charge = {
        ...valeurs,
        dateDebut: valeurs.dateDebut?.toISOString(),
        dateFin: valeurs.dateFin ? valeurs.dateFin.toISOString() : null,
      };

      if (enEdition) {
        // La date de debut est verrouillee des qu'une facture existe : la
        // renvoyer inchangee ferait echouer la requete.
        if (enEdition.facturesGenerees?.length > 0) delete charge.dateDebut;
        await updateSubscription(enEdition._id, charge);
        message.success("Abonnement mis à jour");
      } else {
        await createSubscription(charge);
        message.success("Abonnement créé");
      }
      setModaleOuverte(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Enregistrement impossible");
    }
  };

  const facturerMaintenant = async (abonnement) => {
    try {
      const reponse = await generateSubscriptionInvoice(abonnement._id);
      message.success(reponse.message || "Facture émise");
      charger();
    } catch (error) {
      message.error(error.message || "Facturation impossible");
    }
  };

  const supprimer = async (abonnement) => {
    try {
      const reponse = await deleteSubscription(abonnement._id);
      message.success(reponse.message || "Abonnement supprimé");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const indicateurs = useMemo(
    () => [
      {
        libelle: "Revenu récurrent annuel",
        valeur: formatMontant(stats.revenuAnnuelHT),
        indice: `${formatMontant(stats.revenuMensuelMoyenHT)} par mois en moyenne`,
        icone: <EuroOutlined />,
      },
      {
        libelle: "Contrats actifs",
        valeur: stats.actifs ?? 0,
        indice: `${stats.suspendus ?? 0} suspendu(s), ${stats.termines ?? 0} terminé(s)`,
        icone: <SyncOutlined />,
      },
      {
        libelle: "Échéances sous 30 jours",
        valeur: stats.echeancesProches ?? 0,
        indice: "factures à venir",
        icone: <CalendarOutlined />,
      },
      {
        libelle: "Factures émises",
        valeur: stats.facturesEmises ?? 0,
        indice: "depuis la mise en service",
        icone: <FileAddOutlined />,
      },
    ],
    [stats],
  );

  const colonnes = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 140,
      render: (reference) => (
        <span className="abonnement-reference">{reference}</span>
      ),
    },
    {
      title: "Contrat",
      dataIndex: "libelle",
      key: "libelle",
      render: (libelle, abonnement) => (
        <div>
          <div className="abonnement-titre">{libelle}</div>
          <div className="abonnement-sous-titre">
            {abonnement.client?.entreprise || "Client inconnu"}
          </div>
        </div>
      ),
    },
    {
      title: "Rythme",
      dataIndex: "periodiciteLabel",
      key: "periodicite",
      width: 140,
      render: (label, abonnement) => (
        <Space direction="vertical" size={2}>
          <Tag>{label || abonnement.periodicite}</Tag>
          {!abonnement.genererAutomatiquement && (
            <Tooltip title="La facture doit être déclenchée à la main">
              <Tag color="orange">Manuel</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Montant",
      dataIndex: "montantTTC",
      key: "montantTTC",
      width: 160,
      align: "right",
      sorter: (a, b) => (a.montantTTC || 0) - (b.montantTTC || 0),
      render: (montant, abonnement) => (
        <div>
          <div className="abonnement-montant">{formatMontant(montant)}</div>
          <div className="abonnement-sous-titre">
            {formatMontant(abonnement.montantAnnuelHT)} HT / an
          </div>
        </div>
      ),
    },
    {
      title: "Prochaine échéance",
      dataIndex: "prochaineEcheance",
      key: "prochaineEcheance",
      width: 170,
      sorter: (a, b) =>
        new Date(a.prochaineEcheance || 0) - new Date(b.prochaineEcheance || 0),
      render: (date, abonnement) => {
        if (abonnement.statut !== "active" || !date) {
          return <span className="abonnement-sous-titre">—</span>;
        }
        const echeance = dayjs(date);
        const jours = echeance.diff(dayjs(), "day");
        return (
          <div>
            <div>{echeance.format("DD/MM/YYYY")}</div>
            <div
              className={
                jours <= 0 ? "abonnement-echu" : "abonnement-sous-titre"
              }
            >
              {jours <= 0 ? "à facturer" : `dans ${jours} j`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 110,
      render: (statut) => (
        <Tag color={COULEURS_STATUT[statut]}>
          {LIBELLES_STATUT[statut] || statut}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, abonnement) => (
        <Space size={4}>
          {peut("invoices.create") && abonnement.statut === "active" && (
            <Tooltip title="Émettre la facture de l'échéance courante">
              <Popconfirm
                title="Facturer maintenant ?"
                description="Une facture sera émise pour la période en cours."
                okText="Facturer"
                cancelText="Annuler"
                onConfirm={() => facturerMaintenant(abonnement)}
              >
                <Button type="text" icon={<ThunderboltOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {peut("subscriptions.manage") && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => ouvrirEdition(abonnement)}
              />
              <Popconfirm
                title="Retirer cet abonnement ?"
                description="S'il a produit des factures, il sera clôturé plutôt que supprimé."
                okText="Retirer"
                cancelText="Annuler"
                onConfirm={() => supprimer(abonnement)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const enRetard = abonnements.filter(
    (a) => a.statut === "active" && a.prochaineEcheance &&
      dayjs(a.prochaineEcheance).isBefore(dayjs(), "day"),
  ).length;

  return (
    <div className="dashboard-content">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <SyncOutlined style={{ marginRight: 8 }} />
          Abonnements
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={charger}>
            Actualiser
          </Button>
          {peut("subscriptions.manage") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirCreation}>
              Nouvel abonnement
            </Button>
          )}
        </Space>
      </div>

      {enRetard > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${enRetard} échéance(s) atteinte(s)`}
          description="Le planificateur émet les factures chaque jour. Vous pouvez aussi les déclencher immédiatement depuis la colonne Actions."
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {indicateurs.map((indicateur) => (
          <Col xs={24} sm={12} lg={6} key={indicateur.libelle}>
            <Card className="kpi-card">
              <div className="abonnement-kpi">
                <div className="kpi-icon">{indicateur.icone}</div>
                <div>
                  <div className="kpi-label">{indicateur.libelle}</div>
                  <div className="kpi-value">{indicateur.valeur}</div>
                  <div className="abonnement-kpi-indice">{indicateur.indice}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      <Table
        rowKey="_id"
        columns={colonnes}
        dataSource={abonnements}
        loading={chargement}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: (abonnement) => (
            <div className="abonnement-detail">
              <div className="abonnement-detail-titre">Lignes du contrat</div>
              {(abonnement.items || []).map((ligne, index) => (
                <div key={index} className="abonnement-ligne">
                  <span>{ligne.description}</span>
                  <span className="abonnement-sous-titre">
                    {ligne.quantity} × {formatMontant(ligne.unitPrice)} ={" "}
                    {formatMontant(ligne.total)}
                  </span>
                </div>
              ))}
              {abonnement.facturesGenerees?.length > 0 && (
                <div className="abonnement-detail-pied">
                  {abonnement.facturesGenerees.length} facture(s) émise(s)
                  {abonnement.derniereFacturation &&
                    ` — dernière le ${dayjs(abonnement.derniereFacturation).format("DD/MM/YYYY")}`}
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate("/invoices")}
                  >
                    Voir la facturation
                  </Button>
                </div>
              )}
              {abonnement.notes && (
                <div className="abonnement-notes">{abonnement.notes}</div>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title={enEdition ? "Modifier l'abonnement" : "Nouvel abonnement"}
        open={modaleOuverte}
        onCancel={() => setModaleOuverte(false)}
        onOk={enregistrer}
        okText="Enregistrer"
        cancelText="Annuler"
        width={860}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="client"
                label="Client"
                rules={[{ required: true, message: "Le client est obligatoire" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Sélectionner un client"
                >
                  {clients.map((client) => (
                    <Option key={client._id} value={client._id}>
                      {client.entreprise}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="libelle"
                label="Libellé du contrat"
                rules={[{ required: true, message: "Le libellé est obligatoire" }]}
              >
                <Input placeholder="Hébergement et maintenance" />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="items">
            {(champs, { add, remove }) => (
              <div className="abonnement-lignes">
                <div className="abonnement-lignes-entete">
                  <span>Lignes facturées à chaque échéance</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => add({ quantity: 1 })}
                  >
                    Ajouter
                  </Button>
                </div>
                {champs.map((champ) => (
                  <Row gutter={8} key={champ.key} align="middle">
                    <Col xs={24} sm={10}>
                      <Form.Item
                        name={[champ.name, "description"]}
                        rules={[{ required: true, message: "Description requise" }]}
                      >
                        <Input placeholder="Description de la prestation" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={5}>
                      <Form.Item name={[champ.name, "serviceCode"]}>
                        <Select
                          allowClear
                          showSearch
                          placeholder="Catalogue"
                          optionFilterProp="children"
                          onChange={(code) => {
                            const presta = prestations.find((p) => p.code === code);
                            if (!presta) return;
                            // Reprendre la prestation evite de resaisir un prix
                            // qui doit rester coherent avec le catalogue.
                            const items = form.getFieldValue("items") || [];
                            items[champ.name] = {
                              ...items[champ.name],
                              description: presta.nom,
                              unitPrice: presta.prixUnitaire,
                            };
                            form.setFieldsValue({ items });
                          }}
                        >
                          {prestations.map((presta) => (
                            <Option key={presta.code} value={presta.code}>
                              {presta.code}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={5} sm={3}>
                      <Form.Item
                        name={[champ.name, "quantity"]}
                        rules={[{ required: true, message: "Qté" }]}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} placeholder="Qté" />
                      </Form.Item>
                    </Col>
                    <Col xs={14} sm={5}>
                      <Form.Item
                        name={[champ.name, "unitPrice"]}
                        rules={[{ required: true, message: "Prix" }]}
                      >
                        <InputNumber
                          min={0}
                          step={10}
                          style={{ width: "100%" }}
                          placeholder="Prix HT"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={5} sm={1}>
                      <Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(champ.name)}
                          disabled={champs.length === 1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </div>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="periodicite" label="Périodicité">
                <Select>
                  {periodicites.map((p) => (
                    <Option key={p.cle} value={p.cle}>
                      {p.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dateDebut"
                label="Première échéance"
                rules={[{ required: !enEdition, message: "La date est obligatoire" }]}
                extra={
                  enEdition?.facturesGenerees?.length > 0
                    ? "Verrouillée : des factures ont été émises"
                    : undefined
                }
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  disabled={enEdition?.facturesGenerees?.length > 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dateFin"
                label="Terme"
                extra="Vide : reconduction sans terme"
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Form.Item name="taxRate" label="TVA (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="delaiPaiementJours" label="Délai de paiement (j)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="genererAutomatiquement"
                label="Facturation auto."
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            {enEdition && (
              <Col xs={24} sm={6}>
                <Form.Item name="statut" label="Statut">
                  <Select>
                    <Option value="active">Actif</Option>
                    <Option value="suspendue">Suspendu</Option>
                    <Option value="terminee">Terminé</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
