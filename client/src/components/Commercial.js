import React, { useCallback, useEffect, useState } from "react";
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
  AimOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  TrophyOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  getMe,
  getCommercialDashboard,
  getCommercialObjectifs,
  getCommercialCibles,
  createCommercialObjectif,
  updateCommercialObjectif,
  decideCommercialObjectif,
  deleteCommercialObjectif,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./Budget.css";

const { Option } = Select;

const ONGLETS = [
  { key: "tableau", label: "Tableau de bord" },
  { key: "objectifs", label: "Objectifs commerciaux" },
];

/** Un objectif se fixe par vendeur, par équipe, par client ou globalement. */
const AXES = ["Commercial", "Département", "Client", "Projet", "Campagne", "Global"];

const CATEGORIES = [
  "Chiffre d'affaires",
  "Prestations récurrentes",
  "Nouveaux clients",
  "Autre",
];

const MOIS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

const PERIODES = [
  { valeur: "1-12", libelle: "Année entière" },
  { valeur: "1-3", libelle: "1er trimestre" },
  { valeur: "4-6", libelle: "2e trimestre" },
  { valeur: "7-9", libelle: "3e trimestre" },
  { valeur: "10-12", libelle: "4e trimestre" },
  { valeur: "1-6", libelle: "1er semestre" },
  { valeur: "7-12", libelle: "2e semestre" },
];

const COULEUR_STATUT = { Brouillon: "default", Validé: "green", Clôturé: "purple" };

const montant = (v) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(v || 0));

/** Sur un objectif, le dépassement est une réussite : la couleur le dit. */
const couleurAtteinte = (taux) => {
  if (taux >= 100) return "var(--accent-green)";
  if (taux >= 75) return "var(--accent-yellow)";
  return "var(--accent-red)";
};

const Commercial = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);

  const exerciceCourant = new Date().getFullYear();
  const [exercice, setExercice] = useState(exerciceCourant);
  const [periode, setPeriode] = useState([1, 12]);

  const [tableau, setTableau] = useState({ kpi: {}, progression: [] });
  const [objectifs, setObjectifs] = useState([]);
  const [chargement, setChargement] = useState(false);

  const [modale, setModale] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [cibles, setCibles] = useState([]);
  const [form] = Form.useForm();
  const axeChoisi = Form.useWatch("axe", form);

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
      const [d, o] = await Promise.all([
        getCommercialDashboard({ exercice, ...bornes }),
        getCommercialObjectifs({ exercice }),
      ]);
      setTableau(d);
      setObjectifs(o.budgets || []);
    } catch (error) {
      message.error(error.message || "Chargement du module commercial impossible");
    } finally {
      setChargement(false);
    }
  }, [exercice, periode]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!axeChoisi || axeChoisi === "Global") {
      setCibles([]);
      return;
    }
    getCommercialCibles(axeChoisi).then(setCibles).catch(() => setCibles([]));
  }, [axeChoisi]);

  // --- Formulaire ---

  const ouvrir = (objectif = null) => {
    setEnEdition(objectif);
    if (objectif) {
      form.setFieldsValue({
        ...objectif,
        dotations: objectif.dotations?.map((d) => d.montant) || Array(12).fill(0),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        exercice,
        axe: "Commercial",
        categorie: "Chiffre d'affaires",
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
        await updateCommercialObjectif(enEdition._id, charge);
        message.success("Objectif mis à jour");
      } else {
        await createCommercialObjectif(charge);
        message.success("Objectif créé — il reste un brouillon jusqu'à sa validation");
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

  /** Répartit un objectif annuel en douze mensualités égales. */
  const repartir = () => {
    const annuel = Number(form.getFieldValue("montantAnnuel") || 0);
    if (annuel <= 0) return message.warning("Indiquez un objectif annuel");
    const part = Math.round((annuel / 12) * 100) / 100;
    form.setFieldsValue({ dotations: Array(12).fill(part) });
  };

  // --- Colonnes ---

  const colonnesObjectifs = [
    {
      title: "Cible",
      key: "cible",
      render: (_, o) => (
        <div>
          <div className="budget-titre">{o.cibleLibelle || "Toute l'entreprise"}</div>
          <div className="budget-sous-titre">{o.axe} · {o.categorie}</div>
        </div>
      ),
    },
    {
      title: "Objectif",
      dataIndex: "dotation",
      key: "dotation",
      width: 130,
      align: "right",
      sorter: (a, b) => a.dotation - b.dotation,
      render: (v) => <strong>{montant(v)}</strong>,
    },
    {
      title: "Réalisé",
      dataIndex: "facture",
      key: "facture",
      width: 130,
      align: "right",
      render: (v, o) => (
        <Tooltip title={`Encaissé ${montant(o.encaisse)}`}>
          <span>{montant(v)}</span>
        </Tooltip>
      ),
    },
    {
      title: "Reste à atteindre",
      dataIndex: "reste",
      key: "reste",
      width: 140,
      align: "right",
      render: (v) => montant(v),
    },
    {
      title: "Atteinte",
      key: "taux",
      width: 160,
      render: (_, o) => (
        <Progress
          percent={Math.min(100, o.taux || 0)}
          size="small"
          strokeColor={couleurAtteinte(o.taux)}
          format={() => `${o.taux || 0} %`}
        />
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
      width: 180,
      align: "right",
      render: (_, o) => (
        <Space size={4} wrap>
          {o.statut === "Brouillon" && peut("commercial.manage") && (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => ouvrir(o)} />
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() =>
                  agir(() => decideCommercialObjectif(o._id, "valider"), "Objectif validé")
                }
              >
                Valider
              </Button>
              <Popconfirm
                title="Supprimer ce brouillon ?"
                okText="Supprimer"
                cancelText="Annuler"
                onConfirm={() =>
                  agir(() => deleteCommercialObjectif(o._id), "Objectif supprimé")
                }
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {o.statut === "Validé" && peut("commercial.manage") && (
            <Tooltip title="Rouvrir pour correction">
              <Button
                size="small"
                icon={<UnlockOutlined />}
                onClick={() =>
                  agir(() => decideCommercialObjectif(o._id, "rouvrir"), "Objectif rouvert")
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const kpi = tableau.kpi || {};
  const exercices = [exerciceCourant + 1, exerciceCourant, exerciceCourant - 1];

  return (
    <div className="dashboard-content budget-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <RiseOutlined style={{ marginRight: 8 }} />
          Commercial
        </h2>
        <Space wrap>
          <Select value={exercice} onChange={setExercice} style={{ width: 120 }}>
            {exercices.map((e) => (
              <Option key={e} value={e}>Exercice {e}</Option>
            ))}
          </Select>
          <Select
            value={`${periode[0]}-${periode[1]}`}
            onChange={(v) => setPeriode(v.split("-").map(Number))}
            style={{ width: 170 }}
          >
            {PERIODES.map((p) => (
              <Option key={p.valeur} value={p.valeur}>{p.libelle}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={charger}>Actualiser</Button>
          {peut("commercial.manage") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => ouvrir()}>
              Nouvel objectif
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          {
            titre: "Chiffre d'affaires",
            valeur: montant(kpi.chiffreAffaires),
            pied: `Objectif ${montant(kpi.objectif)}`,
            taux: kpi.tauxAtteinte,
            icone: <TrophyOutlined />,
          },
          {
            titre: "Reste à atteindre",
            valeur: montant(kpi.resteAAtteindre),
            pied: "pour tenir l'objectif de la période",
            icone: <AimOutlined />,
          },
          {
            titre: "Dépenses commerciales",
            valeur: montant(kpi.depenses),
            pied: `Budget ${montant(kpi.budget)} · ${kpi.tauxConsommation || 0} %`,
            icone: <RiseOutlined />,
          },
          {
            titre: "Bénéfice estimé",
            valeur: montant(kpi.beneficeEstime),
            pied: "CA facturé moins dépenses suivies",
            icone: <CheckOutlined />,
          },
        ].map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.titre}>
            <Card className="kpi-card">
              <div className="budget-kpi">
                <div className="kpi-icon">{c.icone}</div>
                <div style={{ flex: 1 }}>
                  <div className="kpi-label">{c.titre}</div>
                  <div className="kpi-value">{c.valeur}</div>
                  {c.taux !== undefined && (
                    <Progress
                      percent={Math.min(100, c.taux || 0)}
                      size="small"
                      strokeColor={couleurAtteinte(c.taux)}
                      format={() => `${c.taux || 0} %`}
                    />
                  )}
                  <div className="budget-sous-titre">{c.pied}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {tableau.alertes?.objectifsEnRetard > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${tableau.alertes.objectifsEnRetard} objectif(s) en retard sur la période`}
          description="Le taux d'atteinte se lit sur la période sélectionnée : un retard en début d'exercice n'a pas la même portée qu'en décembre."
        />
      )}

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      {ongletActif === "tableau" && (
        <Card title="Progression des objectifs" size="small">
          <Table
            rowKey={(l) => `${l.axe}|${l.cible}`}
            size="small"
            loading={chargement}
            pagination={false}
            dataSource={tableau.progression || []}
            locale={{ emptyText: "Aucun objectif validé sur la période" }}
            columns={[
              {
                title: "Cible",
                key: "libelle",
                render: (_, l) => (
                  <div>
                    <div className="budget-titre">{l.libelle}</div>
                    <div className="budget-sous-titre">{l.axe}</div>
                  </div>
                ),
              },
              {
                title: "Objectif",
                dataIndex: "objectif",
                key: "objectif",
                width: 120,
                align: "right",
                render: (v) => montant(v),
              },
              {
                title: "Réalisé",
                dataIndex: "realise",
                key: "realise",
                width: 120,
                align: "right",
                render: (v) => <strong>{montant(v)}</strong>,
              },
              {
                title: "Encaissé",
                dataIndex: "encaisse",
                key: "encaisse",
                width: 120,
                align: "right",
                render: (v) => (
                  <span className="budget-sous-titre">{montant(v)}</span>
                ),
              },
              {
                title: "Reste",
                dataIndex: "reste",
                key: "reste",
                width: 120,
                align: "right",
                render: (v) => montant(v),
              },
              {
                title: "Atteinte",
                key: "taux",
                width: 160,
                render: (_, l) => (
                  <Progress
                    percent={Math.min(100, l.taux || 0)}
                    size="small"
                    strokeColor={couleurAtteinte(l.taux)}
                    format={() => `${l.taux || 0} %`}
                  />
                ),
              },
            ]}
          />
        </Card>
      )}

      {ongletActif === "objectifs" && (
        <Table
          rowKey="_id"
          columns={colonnesObjectifs}
          dataSource={objectifs}
          loading={chargement}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          scroll={{ x: 1100 }}
          expandable={{
            expandedRowRender: (o) => (
              <div className="budget-mensuel">
                {(o.dotations || []).map((d) => (
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

      <Modal
        title={enEdition ? "Modifier l'objectif" : "Nouvel objectif commercial"}
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
              <Form.Item name="axe" label="Porte sur">
                <Select disabled={!!enEdition}>
                  {AXES.map((a) => (
                    <Option key={a} value={a}>{a}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="categorie"
                label="Nature de l'objectif"
                rules={[{ required: true, message: "La catégorie est obligatoire" }]}
              >
                <Select>
                  {CATEGORIES.map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="seuilAlerte"
                label="Seuil d'alerte (%)"
                extra="En deçà, l'objectif est signalé comme en retard."
              >
                <InputNumber min={0} max={200} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <div className="budget-lignes-entete">
            <span>Répartition mensuelle</span>
            <Space>
              <Form.Item name="montantAnnuel" noStyle>
                <InputNumber
                  min={0}
                  step={1000}
                  placeholder="Objectif annuel"
                  style={{ width: 170 }}
                />
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

export default Commercial;
