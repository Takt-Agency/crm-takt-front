import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  BarChartOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FundOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  getMe,
  getBudgets,
  getBudgetStats,
  getBudgetSuivi,
  getBudgetCibles,
  getRoiCampagnes,
  createBudget,
  updateBudget,
  decideBudget,
  deleteBudget,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./Budget.css";

const { Option } = Select;

const ONGLETS = [
  { key: "budgets", label: "Budgets" },
  { key: "suivi", label: "Suivi budgétaire" },
  { key: "campagnes", label: "ROI des campagnes" },
];

const AXES = ["Département", "Campagne", "Projet", "Commercial", "Client", "Global"];

const CATEGORIES = {
  Dépense: [
    "Achats et fournitures", "Prestations externes", "Masse salariale",
    "Logiciels et abonnements", "Matériel et équipement",
    "Marketing et communication", "Publicité", "Événements",
    "Déplacements", "Frais généraux", "Autre",
  ],
  Revenu: [
    "Chiffre d'affaires", "Prestations récurrentes", "Nouveaux clients", "Autre",
  ],
};

const MOIS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

const COULEUR_STATUT = { Brouillon: "default", Validé: "green", Clôturé: "purple" };

const montant = (valeur) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Number(valeur || 0),
  );

/**
 * Un taux de consommation ne se lit pas de la même façon selon la nature :
 * 120 % de dépense est une dérive, 120 % d'objectif commercial une réussite.
 */
const couleurTaux = (taux, nature) => {
  if (nature === "Revenu") {
    if (taux >= 100) return "var(--accent-green)";
    if (taux >= 75) return "var(--accent-yellow)";
    return "var(--accent-red)";
  }
  if (taux > 100) return "var(--accent-red)";
  if (taux >= 90) return "var(--accent-yellow)";
  return "var(--accent-green)";
};

const Budget = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);

  const exerciceCourant = new Date().getFullYear();
  const [exercice, setExercice] = useState(exerciceCourant);
  const [natureFiltre, setNatureFiltre] = useState("");
  // Un intervalle libre : comparer un trimestre a son budget suppose de
  // pouvoir l'isoler.
  const [periode, setPeriode] = useState([1, 12]);

  const [stats, setStats] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [suivi, setSuivi] = useState({ lignes: [], totaux: {} });
  const [campagnes, setCampagnes] = useState([]);
  const [chargement, setChargement] = useState(false);

  const [modale, setModale] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [cibles, setCibles] = useState([]);
  const [form] = Form.useForm();
  const axeChoisi = Form.useWatch("axe", form);
  const natureChoisie = Form.useWatch("nature", form) || "Dépense";

  const peut = useCallback(
    (p) => utilisateur && canAccessModule(utilisateur, p),
    [utilisateur],
  );

  useEffect(() => {
    getMe().then(setUtilisateur).catch(() => {});
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const bornes = { moisDebut: periode[0], moisFin: periode[1] };
      const [s, b, v] = await Promise.all([
        getBudgetStats(exercice),
        getBudgets({ exercice, nature: natureFiltre }),
        getBudgetSuivi({ exercice, nature: natureFiltre, ...bornes }),
      ]);
      setStats(s);
      setBudgets(b.budgets || []);
      setSuivi(v);
    } catch (error) {
      message.error(error.message || "Chargement du contrôle de gestion impossible");
    } finally {
      setChargement(false);
    }
  }, [exercice, natureFiltre, periode]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Le ROI croise coûts et revenus : réservé à l'analyse.
  useEffect(() => {
    if (ongletActif !== "campagnes" || !peut("budget.analysis")) return;
    getRoiCampagnes(exercice).then(setCampagnes).catch(() => {});
  }, [ongletActif, exercice, peut]);

  // Les cibles dépendent de l'axe : on les recharge à chaque changement.
  useEffect(() => {
    if (!axeChoisi || axeChoisi === "Global") {
      setCibles([]);
      return;
    }
    getBudgetCibles(axeChoisi).then(setCibles).catch(() => setCibles([]));
  }, [axeChoisi]);

  const indicateurs = useMemo(() => {
    const d = stats.depense || {};
    const r = stats.revenu || {};
    return [
      {
        libelle: "Objectif commercial",
        valeur: montant(r.dotation),
        indice: `${montant(r.consomme)} réalisés · ${r.taux || 0} %`,
        icone: <RiseOutlined />,
      },
      {
        libelle: "Budget de dépense",
        valeur: montant(d.dotation),
        indice: `${montant(d.consomme)} consommés · ${d.taux || 0} %`,
        icone: <FundOutlined />,
      },
      {
        libelle: "Marge suivie",
        valeur: montant(stats.margeSuivie),
        indice: "revenus réalisés moins dépenses",
        icone: <LineChartOutlined />,
      },
      {
        libelle: "Dérives",
        valeur: (d.derives || 0) + (r.derives || 0),
        indice: `${d.derives || 0} dépassement(s), ${r.derives || 0} objectif(s) en retard`,
        icone: <BarChartOutlined />,
      },
    ];
  }, [stats]);

  // --- Formulaire ---

  const ouvrir = (budget = null) => {
    setEnEdition(budget);
    if (budget) {
      form.setFieldsValue({
        ...budget,
        dotations: budget.dotations?.map((d) => d.montant) || Array(12).fill(0),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        exercice,
        nature: "Dépense",
        axe: "Département",
        seuilAlerte: 90,
        dotations: Array(12).fill(0),
      });
    }
    setModale(true);
  };

  const enregistrer = async () => {
    try {
      const v = await form.validateFields();
      const charge = {
        ...v,
        dotations: (v.dotations || []).map((m, i) => ({
          mois: i + 1,
          montant: Number(m || 0),
        })),
      };
      if (enEdition) {
        await updateBudget(enEdition._id, charge);
        message.success("Ligne mise à jour");
      } else {
        await createBudget(charge);
        message.success("Ligne créée — elle reste un brouillon jusqu'à son vote");
      }
      setModale(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Enregistrement impossible");
    }
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

  /** Répartit un montant annuel en douze mensualités égales. */
  const repartir = () => {
    const annuel = Number(form.getFieldValue("montantAnnuel") || 0);
    if (annuel <= 0) return message.warning("Indiquez un montant annuel");
    const part = Math.round((annuel / 12) * 100) / 100;
    form.setFieldsValue({ dotations: Array(12).fill(part) });
  };

  // --- Colonnes ---

  const colonnesBudgets = [
    {
      title: "Nature",
      dataIndex: "nature",
      key: "nature",
      width: 100,
      render: (n) => (
        <Tag color={n === "Revenu" ? "green" : "blue"}>{n}</Tag>
      ),
    },
    {
      title: "Axe",
      key: "axe",
      width: 210,
      render: (_, b) => (
        <div>
          <div className="budget-titre">{b.cibleLibelle || "Toute l'entreprise"}</div>
          <div className="budget-sous-titre">{b.axe} · {b.categorie}</div>
        </div>
      ),
    },
    {
      title: "Dotation",
      dataIndex: "dotation",
      key: "dotation",
      width: 130,
      align: "right",
      sorter: (a, b) => a.dotation - b.dotation,
      render: (v) => <strong>{montant(v)}</strong>,
    },
    {
      title: "Réalisé",
      dataIndex: "consomme",
      key: "consomme",
      width: 130,
      align: "right",
      render: (v, b) => (
        <Tooltip
          title={
            b.nature === "Revenu"
              ? `Facturé ${montant(b.facture)} · encaissé ${montant(b.encaisse)}`
              : `Engagé ${montant(b.engage)} · décaissé ${montant(b.realise)}`
          }
        >
          <span>{montant(v)}</span>
        </Tooltip>
      ),
    },
    {
      title: "Consommation",
      key: "taux",
      width: 160,
      render: (_, b) => (
        <Progress
          percent={Math.min(100, b.taux || 0)}
          size="small"
          strokeColor={couleurTaux(b.taux, b.nature)}
          format={() => `${b.taux || 0} %`}
        />
      ),
    },
    {
      title: "Écart",
      dataIndex: "ecart",
      key: "ecart",
      width: 120,
      align: "right",
      render: (v, b) => (
        <span style={{ color: b.favorable ? "var(--accent-green)" : "var(--accent-red)" }}>
          {v >= 0 ? "+" : ""}{montant(v)}
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 110,
      render: (s) => <Tag color={COULEUR_STATUT[s]}>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 170,
      align: "right",
      render: (_, b) => (
        <Space size={4} wrap>
          {b.statut === "Brouillon" && peut("budget.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => ouvrir(b)} />
          )}
          {b.statut === "Brouillon" && peut("budget.validate") && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => agir(() => decideBudget(b._id, "valider"), "Ligne votée")}
            >
              Voter
            </Button>
          )}
          {b.statut === "Validé" && peut("budget.validate") && (
            <Tooltip title="Rouvrir pour correction">
              <Button
                size="small"
                icon={<UnlockOutlined />}
                onClick={() => agir(() => decideBudget(b._id, "rouvrir"), "Ligne rouverte")}
              />
            </Tooltip>
          )}
          {b.statut === "Brouillon" && peut("budget.delete") && (
            <Popconfirm
              title="Supprimer ce brouillon ?"
              okText="Supprimer"
              cancelText="Annuler"
              onConfirm={() => agir(() => deleteBudget(b._id), "Ligne supprimée")}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const colonnesSuivi = [
    {
      title: "Nature",
      dataIndex: "nature",
      key: "nature",
      width: 100,
      render: (n) => <Tag color={n === "Revenu" ? "green" : "blue"}>{n}</Tag>,
    },
    {
      title: "Axe",
      key: "libelle",
      render: (_, l) => (
        <div>
          <div className="budget-titre">{l.libelle}</div>
          <div className="budget-sous-titre">
            {l.axe} · {l.categories.join(", ")}
          </div>
        </div>
      ),
    },
    {
      title: "Prévu",
      dataIndex: "dotation",
      key: "dotation",
      width: 130,
      align: "right",
      render: (v) => montant(v),
    },
    {
      title: "Réel",
      dataIndex: "consomme",
      key: "consomme",
      width: 130,
      align: "right",
      render: (v) => <strong>{montant(v)}</strong>,
    },
    {
      title: "Écart",
      dataIndex: "ecart",
      key: "ecart",
      width: 130,
      align: "right",
      sorter: (a, b) => a.ecart - b.ecart,
      render: (v, l) => (
        <span style={{ color: l.favorable ? "var(--accent-green)" : "var(--accent-red)" }}>
          {v >= 0 ? "+" : ""}{montant(v)}
        </span>
      ),
    },
    {
      title: "Consommation",
      key: "taux",
      width: 180,
      render: (_, l) => (
        <Progress
          percent={Math.min(100, l.taux || 0)}
          size="small"
          strokeColor={couleurTaux(l.taux, l.nature)}
          format={() => `${l.taux || 0} %`}
        />
      ),
    },
    {
      title: "",
      key: "alerte",
      width: 130,
      render: (_, l) =>
        l.depassement ? (
          <Tag color="red">Dépassement</Tag>
        ) : l.alerte ? (
          <Tag color="orange">{l.nature === "Revenu" ? "En retard" : "Seuil atteint"}</Tag>
        ) : null,
    },
  ];

  const colonnesCampagnes = [
    {
      title: "Campagne",
      key: "nom",
      render: (_, c) => (
        <div>
          <div className="budget-titre">{c.nom}</div>
          <div className="budget-sous-titre">{c.canal} · {c.statut}</div>
        </div>
      ),
    },
    { title: "Leads", dataIndex: "leads", key: "leads", width: 90, align: "center" },
    {
      title: "Coût",
      dataIndex: "cout",
      key: "cout",
      width: 120,
      align: "right",
      render: (v) => montant(v),
    },
    {
      title: "Revenu",
      dataIndex: "revenu",
      key: "revenu",
      width: 120,
      align: "right",
      render: (v) => montant(v),
    },
    {
      title: "Marge",
      dataIndex: "marge",
      key: "marge",
      width: 120,
      align: "right",
      sorter: (a, b) => a.marge - b.marge,
      render: (v) => (
        <strong style={{ color: v >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          {v >= 0 ? "+" : ""}{montant(v)}
        </strong>
      ),
    },
    {
      title: "ROI",
      dataIndex: "roi",
      key: "roi",
      width: 110,
      align: "right",
      sorter: (a, b) => (a.roi ?? -9999) - (b.roi ?? -9999),
      render: (v) =>
        v === null ? (
          // Sans coût connu, le rapport n'a pas de sens : le dire vaut mieux
          // que d'afficher un taux infini.
          <Tooltip title="Aucune dépense rattachée à cette campagne">
            <span className="budget-sous-titre">—</span>
          </Tooltip>
        ) : (
          <Tag color={v >= 0 ? "green" : "red"}>{v} %</Tag>
        ),
    },
  ];

  const exercices = [exerciceCourant + 1, exerciceCourant, exerciceCourant - 1];

  return (
    <div className="dashboard-content budget-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <FundOutlined style={{ marginRight: 8 }} />
          Contrôle de gestion
        </h2>
        <Space wrap>
          <Select value={exercice} onChange={setExercice} style={{ width: 120 }}>
            {exercices.map((e) => (
              <Option key={e} value={e}>Exercice {e}</Option>
            ))}
          </Select>
          <Select
            value={natureFiltre}
            onChange={setNatureFiltre}
            style={{ width: 150 }}
          >
            <Option value="">Tout</Option>
            <Option value="Dépense">Dépenses</Option>
            <Option value="Revenu">Revenus</Option>
          </Select>
          <Select
            value={`${periode[0]}-${periode[1]}`}
            onChange={(v) => setPeriode(v.split("-").map(Number))}
            style={{ width: 180 }}
          >
            <Option value="1-12">Année entière</Option>
            <Option value="1-3">1er trimestre</Option>
            <Option value="4-6">2e trimestre</Option>
            <Option value="7-9">3e trimestre</Option>
            <Option value="10-12">4e trimestre</Option>
            <Option value="1-6">1er semestre</Option>
            <Option value="7-12">2e semestre</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={charger}>Actualiser</Button>
          {peut("budget.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => ouvrir()}>
              Nouvelle ligne
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {indicateurs.map((i) => (
          <Col xs={24} sm={12} lg={6} key={i.libelle}>
            <Card className="kpi-card">
              <div className="budget-kpi">
                <div className="kpi-icon">{i.icone}</div>
                <div>
                  <div className="kpi-label">{i.libelle}</div>
                  <div className="kpi-value">{i.valeur}</div>
                  <div className="budget-sous-titre">{i.indice}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {suivi.enDepassement > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${suivi.enDepassement} dépassement(s) budgétaire(s)`}
          description="Une enveloppe consommée au-delà de sa dotation appelle un arbitrage : réaffectation, rallonge, ou gel des engagements."
        />
      )}

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      {ongletActif === "budgets" && (
        <Table
          rowKey="_id"
          columns={colonnesBudgets}
          dataSource={budgets}
          loading={chargement}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (b) => (
              <div className="budget-mensuel">
                {(b.dotations || []).map((d) => (
                  <div key={d.mois} className="budget-mois">
                    <div className="budget-sous-titre">{MOIS[d.mois - 1]}</div>
                    <div>{montant(d.montant)}</div>
                  </div>
                ))}
              </div>
            ),
          }}
        />
      )}

      {ongletActif === "suivi" && (
        <>
          <Table
            rowKey={(l) => `${l.nature}|${l.axe}|${l.cible}`}
            columns={colonnesSuivi}
            dataSource={suivi.lignes}
            loading={chargement}
            pagination={false}
            scroll={{ x: 1100 }}
          />
          {(suivi.lignes || []).length === 0 && !chargement && (
            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              message="Aucune ligne votée pour cet exercice"
              description="Le suivi ne porte que sur les budgets votés : un brouillon n'engage rien et n'a donc pas d'écart."
            />
          )}
        </>
      )}

      {ongletActif === "campagnes" &&
        (peut("budget.analysis") ? (
          <Table
            rowKey="_id"
            columns={colonnesCampagnes}
            dataSource={campagnes}
            pagination={{ pageSize: 12 }}
            scroll={{ x: 900 }}
            locale={{
              emptyText:
                "Aucune campagne n'a de coût ni de revenu rattaché sur cet exercice.",
            }}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Analyse réservée"
            description="Le rapprochement du coût et du revenu d'une campagne relève de la permission d'analyse budgétaire."
          />
        ))}

      <Modal
        title={enEdition ? "Modifier la ligne budgétaire" : "Nouvelle ligne budgétaire"}
        open={modale}
        onCancel={() => setModale(false)}
        onOk={enregistrer}
        okText="Enregistrer"
        cancelText="Annuler"
        width={860}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Form.Item name="exercice" label="Exercice">
                <Select disabled={!!enEdition}>
                  {exercices.map((e) => (
                    <Option key={e} value={e}>{e}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="nature"
                label="Nature"
                extra="Enveloppe ou objectif"
              >
                <Select disabled={!!enEdition}>
                  <Option value="Dépense">Dépense</Option>
                  <Option value="Revenu">Revenu</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="axe" label="Axe">
                <Select disabled={!!enEdition}>
                  {AXES.map((a) => (
                    <Option key={a} value={a}>{a}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="seuilAlerte" label="Seuil d'alerte (%)">
                <InputNumber min={0} max={200} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cible"
                label="Cible"
                rules={[
                  {
                    required: axeChoisi && axeChoisi !== "Global",
                    message: "Choisissez une cible",
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  disabled={!!enEdition || axeChoisi === "Global"}
                  placeholder={
                    axeChoisi === "Global" ? "Toute l'entreprise" : "Choisir"
                  }
                >
                  {cibles.map((c) => (
                    <Option key={c.valeur} value={c.valeur}>{c.libelle}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="categorie"
                label="Catégorie"
                rules={[{ required: true, message: "La catégorie est obligatoire" }]}
              >
                <Select>
                  {(CATEGORIES[natureChoisie] || []).map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="budget-lignes-entete">
            <span>Ventilation mensuelle</span>
            <Space>
              <Form.Item name="montantAnnuel" noStyle>
                <InputNumber min={0} step={1000} placeholder="Montant annuel" style={{ width: 160 }} />
              </Form.Item>
              <Button size="small" onClick={repartir}>Répartir sur 12 mois</Button>
            </Space>
          </div>

          <Row gutter={[8, 8]}>
            {MOIS.map((m, i) => (
              <Col xs={8} sm={6} md={4} key={m}>
                <Form.Item name={["dotations", i]} label={m}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Budget;
