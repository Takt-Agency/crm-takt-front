import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
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
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SyncOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  createCatalogService,
  deleteCatalogService,
  getCatalogServices,
  getCatalogStats,
  getMe,
  updateCatalogService,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./ServiceCatalog.css";

const { Option } = Select;

const formatMontant = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(valeur || 0));

/** La marge se lit d'un coup d'oeil par sa couleur, pas par son chiffre. */
const couleurMarge = (taux) => {
  if (taux >= 50) return "green";
  if (taux >= 25) return "gold";
  return "red";
};

const ONGLETS = [
  { key: "toutes", label: "Toutes" },
  { key: "actives", label: "Actives" },
  { key: "retirees", label: "Retirées" },
  { key: "recurrentes", label: "Récurrentes" },
  { key: "ponctuelles", label: "Ponctuelles" },
];
const FILTRE_PAR_ONGLET = {
  toutes: {},
  actives: { actif: "true" },
  retirees: { actif: "false" },
  recurrentes: { recurrent: "true" },
  ponctuelles: { recurrent: "false" },
};

const ServiceCatalog = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unites, setUnites] = useState([]);
  const [stats, setStats] = useState({});
  const [chargement, setChargement] = useState(false);
  const [filtres, setFiltres] = useState({
    recherche: "",
    categorie: undefined,
  });

  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);

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
        getCatalogServices({ ...filtres, ...FILTRE_PAR_ONGLET[ongletActif] }),
        getCatalogStats(),
      ]);
      setServices(donnees.services || []);
      setCategories(donnees.categories || []);
      setUnites(donnees.unites || []);
      setStats(statistiques);
    } catch (error) {
      message.error(error.message || "Chargement du catalogue impossible");
    } finally {
      setChargement(false);
    }
  }, [filtres, ongletActif]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirCreation = () => {
    setEnEdition(null);
    form.resetFields();
    form.setFieldsValue({
      categorie: "Autre",
      unite: "forfait",
      tauxTVA: 20,
      coutRevient: 0,
      recurrent: false,
      actif: true,
    });
    setModaleOuverte(true);
  };

  const ouvrirEdition = (service) => {
    setEnEdition(service);
    form.setFieldsValue({
      code: service.code,
      nom: service.nom,
      description: service.description,
      categorie: service.categorie,
      prixUnitaire: service.prixUnitaire,
      unite: service.unite,
      tauxTVA: service.tauxTVA,
      coutRevient: service.coutRevient,
      recurrent: service.recurrent,
      actif: service.actif,
    });
    setModaleOuverte(true);
  };

  const enregistrer = async () => {
    try {
      const valeurs = await form.validateFields();
      if (enEdition) {
        await updateCatalogService(enEdition._id, valeurs);
        message.success("Service mis à jour");
      } else {
        await createCatalogService(valeurs);
        message.success("Service ajouté au catalogue");
      }
      setModaleOuverte(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return; // validation du formulaire
      message.error(error.message || "Enregistrement impossible");
    }
  };

  const supprimer = async (service) => {
    try {
      const reponse = await deleteCatalogService(service._id);
      message.success(reponse.message || "Service supprimé");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const indicateurs = useMemo(
    () => [
      {
        libelle: "Prestations actives",
        valeur: stats.actifs ?? 0,
        indice: `${stats.total ?? 0} au total`,
        icone: <AppstoreOutlined />,
      },
      {
        libelle: "Récurrentes",
        valeur: stats.recurrents ?? 0,
        indice: "éligibles aux abonnements",
        icone: <SyncOutlined />,
      },
      {
        libelle: "Catégories",
        valeur: (stats.parCategorie || []).length,
        indice: "représentées au catalogue",
        icone: <TagsOutlined />,
      },
      {
        libelle: "Prix moyen",
        valeur: formatMontant(
          (stats.parCategorie || []).reduce((s, c) => s + (c.prixMoyen || 0), 0) /
            ((stats.parCategorie || []).length || 1),
        ),
        indice: "toutes catégories",
        icone: <RiseOutlined />,
      },
    ],
    [stats],
  );

  const colonnes = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 130,
      render: (code) => <span className="catalogue-code">{code}</span>,
    },
    {
      title: "Prestation",
      dataIndex: "nom",
      key: "nom",
      render: (nom, service) => (
        <div>
          <div className="catalogue-titre">{nom}</div>
          {service.description && (
            <div className="catalogue-sous-titre">{service.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Catégorie",
      dataIndex: "categorie",
      key: "categorie",
      width: 190,
      render: (categorie) => <Tag>{categorie}</Tag>,
    },
    {
      title: "Prix",
      dataIndex: "prixUnitaire",
      key: "prixUnitaire",
      width: 150,
      align: "right",
      sorter: (a, b) => a.prixUnitaire - b.prixUnitaire,
      render: (prix, service) => (
        <div>
          <div className="catalogue-prix">{formatMontant(prix)}</div>
          <div className="catalogue-sous-titre">
            par {service.unite} · TVA {service.tauxTVA} %
          </div>
        </div>
      ),
    },
    {
      title: "Marge",
      dataIndex: "tauxMarge",
      key: "tauxMarge",
      width: 110,
      align: "center",
      sorter: (a, b) => (a.tauxMarge || 0) - (b.tauxMarge || 0),
      render: (taux, service) =>
        service.coutRevient ? (
          <Tooltip title={`Coût de revient : ${formatMontant(service.coutRevient)}`}>
            <Tag color={couleurMarge(taux)}>{taux} %</Tag>
          </Tooltip>
        ) : (
          <span className="catalogue-sous-titre">—</span>
        ),
    },
    {
      title: "État",
      key: "etat",
      width: 160,
      render: (_, service) => (
        <Space size={4} wrap>
          <Tag color={service.actif ? "green" : "default"}>
            {service.actif ? "Actif" : "Retiré"}
          </Tag>
          {service.recurrent && <Tag color="blue">Récurrent</Tag>}
        </Space>
      ),
    },
    ...(peut("catalog.manage")
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 110,
            align: "right",
            render: (_, service) => (
              <Space size={4}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => ouvrirEdition(service)}
                />
                <Popconfirm
                  title="Retirer cette prestation ?"
                  description="Si elle figure sur un document, elle sera désactivée plutôt que supprimée."
                  okText="Retirer"
                  cancelText="Annuler"
                  onConfirm={() => supprimer(service)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="dashboard-content">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          Catalogue de services
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={charger}>
            Actualiser
          </Button>
          {peut("catalog.manage") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirCreation}>
              Nouvelle prestation
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {indicateurs.map((indicateur) => (
          <Col xs={24} sm={12} lg={6} key={indicateur.libelle}>
            <Card className="kpi-card">
              <div className="catalogue-kpi">
                <div className="kpi-icon">{indicateur.icone}</div>
                <div>
                  <div className="kpi-label">{indicateur.libelle}</div>
                  <div className="kpi-value">{indicateur.valeur}</div>
                  <div className="catalogue-kpi-indice">{indicateur.indice}</div>
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

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Rechercher une prestation"
          allowClear
          style={{ width: 260 }}
          onSearch={(valeur) => setFiltres((f) => ({ ...f, recherche: valeur }))}
        />
        <Select
          placeholder="Catégorie"
          allowClear
          style={{ width: 210 }}
          value={filtres.categorie}
          onChange={(valeur) => setFiltres((f) => ({ ...f, categorie: valeur }))}
        >
          {categories.map((categorie) => (
            <Option key={categorie} value={categorie}>
              {categorie}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        rowKey="_id"
        columns={colonnes}
        dataSource={services}
        loading={chargement}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={enEdition ? "Modifier la prestation" : "Nouvelle prestation"}
        open={modaleOuverte}
        onCancel={() => setModaleOuverte(false)}
        onOk={enregistrer}
        okText="Enregistrer"
        cancelText="Annuler"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="code"
                label="Code"
                rules={[
                  { required: true, message: "Le code est obligatoire" },
                  {
                    pattern: /^[A-Za-z0-9-]{2,20}$/,
                    message: "2 à 20 caractères : lettres, chiffres, tirets",
                  },
                ]}
                extra="Référence courte, unique"
              >
                <Input placeholder="SEO-MENS" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item
                name="nom"
                label="Intitulé"
                rules={[{ required: true, message: "L'intitulé est obligatoire" }]}
              >
                <Input placeholder="Référencement naturel — forfait mensuel" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} maxLength={1000} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="categorie" label="Catégorie">
                <Select>
                  {categories.map((categorie) => (
                    <Option key={categorie} value={categorie}>
                      {categorie}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="unite" label="Unité de facturation">
                <Select>
                  {unites.map((unite) => (
                    <Option key={unite} value={unite}>
                      {unite}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="prixUnitaire"
                label="Prix unitaire (€ HT)"
                rules={[{ required: true, message: "Le prix est obligatoire" }]}
              >
                <InputNumber min={0} step={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="coutRevient"
                label="Coût de revient (€)"
                extra="Interne : sert au calcul de la marge"
              >
                <InputNumber min={0} step={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="tauxTVA" label="TVA (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="recurrent"
                label="Prestation récurrente"
                valuePropName="checked"
                extra="Proposée lors de la création d'un abonnement"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="actif"
                label="Disponible à la vente"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceCatalog;
