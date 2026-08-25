import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Tag,
  DatePicker,
  InputNumber,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Card,
  Alert,
  Divider,
  Empty,
  Tabs,
} from "antd";
import {
  RiseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  MailOutlined,
  EuroOutlined,
  AimOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMarketingStats,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  previewCampaignAudience,
  sendCampaign,
  getMe,
} from "../utils/api";
import { useOngletUrl, cleOnglet } from "../hooks/useOngletUrl";
import { canAccessModule } from "../utils/accessControl";
import "./Dashboard.css";
import "./Marketing.css";

const { Option } = Select;

const CHANNELS = [
  "Email",
  "Réseaux sociaux",
  "SEO",
  "Publicité",
  "Événement",
  "Autre",
];

const STATUSES = [
  "Brouillon",
  "Planifiée",
  "En cours",
  "Terminée",
  "Annulée",
];

const STATUS_COLORS = {
  Brouillon: "default",
  Planifiée: "blue",
  "En cours": "green",
  Terminée: "purple",
  Annulée: "red",
};

const CHANNEL_COLORS = {
  Email: "magenta",
  "Réseaux sociaux": "blue",
  SEO: "cyan",
  Publicité: "orange",
  Événement: "purple",
  Autre: "default",
};

const CLIENT_STATUTS = ["Actif", "Inactif", "Prospect"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const ONGLETS = [
  { key: "toutes", label: "Toutes" },
  ...STATUSES.map((statut) => ({ key: cleOnglet(statut), label: statut })),
];
const STATUT_PAR_ONGLET = Object.fromEntries([
  ["toutes", ""],
  ...STATUSES.map((statut) => [cleOnglet(statut), statut]),
]);

function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);
  const statusFilter = STATUT_PAR_ONGLET[ongletActif];
  const [channelFilter, setChannelFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Apercu d'audience recalcule a la demande depuis les criteres du formulaire.
  const [audience, setAudience] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const [sendingId, setSendingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const can = useCallback(
    (permission) => (currentUser ? canAccessModule(currentUser, permission) : false),
    [currentUser],
  );

  const fetchCampaigns = useCallback(
    async (searchOverride) => {
      setLoading(true);
      try {
        const data = await getAllCampaigns({
          status: statusFilter || undefined,
          channel: channelFilter || undefined,
          search: (searchOverride ?? search) || undefined,
          limit: 200,
        });
        setCampaigns(data.campaigns || []);
      } catch (error) {
        message.error(error.message || "Erreur lors du chargement des campagnes");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, channelFilter, search],
  );

  const fetchStats = useCallback(async () => {
    try {
      setStats(await getMarketingStats());
    } catch (error) {
      console.error("Erreur stats marketing:", error);
    }
  }, []);

  useEffect(() => {
    getMe()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, channelFilter]);

  const handleSearch = (value) => {
    setSearch(value);
    fetchCampaigns(value);
  };

  const openCreate = () => {
    setEditing(null);
    setAudience(null);
    form.resetFields();
    form.setFieldsValue({
      channel: "Email",
      status: "Brouillon",
      budget: 0,
      statuts: ["Prospect"],
    });
    setModalOpen(true);
  };

  const openEdit = (campaign) => {
    setEditing(campaign);
    setAudience(null);
    form.setFieldsValue({
      name: campaign.name,
      description: campaign.description,
      channel: campaign.channel,
      status: campaign.status,
      subject: campaign.subject,
      content: campaign.content,
      budget: campaign.budget,
      startDate: campaign.startDate ? dayjs(campaign.startDate) : null,
      endDate: campaign.endDate ? dayjs(campaign.endDate) : null,
      statuts: campaign.audience?.statuts || [],
      secteurActivite: campaign.audience?.secteurActivite,
      sourceLead: campaign.audience?.sourceLead,
      minScore: campaign.audience?.minScore,
      maxScore: campaign.audience?.maxScore,
      leads: campaign.metrics?.leads,
      revenue: campaign.metrics?.revenue,
    });
    setModalOpen(true);
  };

  const buildAudienceFromForm = () => {
    const values = form.getFieldsValue();
    return {
      statuts: values.statuts || [],
      secteurActivite: values.secteurActivite,
      sourceLead: values.sourceLead,
      minScore: values.minScore,
      maxScore: values.maxScore,
    };
  };

  const handlePreviewAudience = async () => {
    setAudienceLoading(true);
    try {
      setAudience(await previewCampaignAudience(buildAudienceFromForm()));
    } catch (error) {
      message.error(error.message || "Impossible de calculer l'audience");
    } finally {
      setAudienceLoading(false);
    }
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload = {
      name: values.name,
      description: values.description,
      channel: values.channel,
      status: values.status,
      subject: values.subject,
      content: values.content,
      budget: values.budget,
      startDate: values.startDate ? values.startDate.toISOString() : undefined,
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
      audience: buildAudienceFromForm(),
      leads: values.leads,
      revenue: values.revenue,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateCampaign(editing._id, payload);
        message.success("Campagne mise à jour");
      } else {
        await createCampaign(payload);
        message.success("Campagne créée");
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCampaign(id);
      message.success("Campagne supprimée");
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  // L'envoi part vers de vrais clients : on affiche la portee exacte et on
  // demande une confirmation explicite avant de declencher quoi que ce soit.
  const handleSend = (campaign) => {
    Modal.confirm({
      title: "Envoyer cette campagne ?",
      icon: <SendOutlined />,
      width: 480,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            La campagne <strong>{campaign.name}</strong> va être envoyée par
            email à <strong>{campaign.metrics?.recipients || 0}</strong> client(s)
            correspondant au ciblage.
          </p>
          <p className="marketing-warning-text">
            Cette action est irréversible : les emails partent immédiatement.
          </p>
        </div>
      ),
      okText: "Envoyer maintenant",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        setSendingId(campaign._id);
        try {
          const result = await sendCampaign(campaign._id);
          message.success(result.message || "Campagne envoyée");
          fetchCampaigns();
          fetchStats();
        } catch (error) {
          message.error(error.message || "Échec de l'envoi");
          throw error;
        } finally {
          setSendingId(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "Campagne",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div>
          <div className="marketing-cell-title">{value}</div>
          {record.description && (
            <div className="marketing-cell-sub">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Canal",
      dataIndex: "channel",
      key: "channel",
      width: 150,
      render: (value) => (
        <Tag color={CHANNEL_COLORS[value] || "default"}>{value}</Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (value) => (
        <Tag color={STATUS_COLORS[value] || "default"}>{value}</Tag>
      ),
    },
    {
      title: "Audience",
      key: "audience",
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <TeamOutlined className="marketing-cell-icon" />
          <span>{record.metrics?.recipients || 0}</span>
          {record.metrics?.sent > 0 && (
            <Tooltip title={`${record.metrics.sent} email(s) envoyé(s)`}>
              <Tag color="green" className="marketing-sent-tag">
                {record.metrics.sent} envoyés
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Période",
      key: "period",
      width: 180,
      render: (_, record) =>
        record.startDate || record.endDate ? (
          <span className="marketing-cell-sub">
            {record.startDate
              ? dayjs(record.startDate).format("DD/MM/YYYY")
              : "-"}
            {" → "}
            {record.endDate ? dayjs(record.endDate).format("DD/MM/YYYY") : "-"}
          </span>
        ) : (
          <span className="marketing-cell-sub">-</span>
        ),
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      width: 120,
      render: (value) => formatCurrency(value),
    },
    {
      title: "ROI",
      key: "roi",
      width: 110,
      render: (_, record) => {
        if (!record.budget) {
          return <span className="marketing-cell-sub">-</span>;
        }
        const roi =
          ((Number(record.metrics?.revenue || 0) - Number(record.budget)) /
            Number(record.budget)) *
          100;
        return (
          <span className={roi >= 0 ? "marketing-roi-up" : "marketing-roi-down"}>
            {roi >= 0 ? "+" : ""}
            {roi.toFixed(0)} %
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          {record.channel === "Email" && can("marketing.send") && (
            <Tooltip title="Envoyer la campagne">
              <Button
                type="text"
                icon={<SendOutlined />}
                loading={sendingId === record._id}
                onClick={() => handleSend(record)}
              />
            </Tooltip>
          )}
          {can("marketing.update") && (
            <Tooltip title="Modifier">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          )}
          {can("marketing.delete") && (
            <Popconfirm
              title="Supprimer cette campagne ?"
              okText="Supprimer"
              cancelText="Annuler"
              onConfirm={() => handleDelete(record._id)}
            >
              <Tooltip title="Supprimer">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const kpis = [
    {
      label: "Campagnes actives",
      value: stats?.active ?? 0,
      icon: <AimOutlined />,
      hint: `${stats?.total ?? 0} au total`,
    },
    {
      label: "Emails envoyés",
      value: stats?.totalSent ?? 0,
      icon: <MailOutlined />,
      hint: `${stats?.totalLeads ?? 0} leads générés`,
    },
    {
      label: "Budget engagé",
      value: formatCurrency(stats?.totalBudget),
      icon: <EuroOutlined />,
      hint: `${formatCurrency(stats?.totalRevenue)} générés`,
    },
    {
      label: "ROI global",
      value:
        stats?.roi === null || stats?.roi === undefined
          ? "-"
          : `${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(0)} %`,
      icon: <RiseOutlined />,
      hint: "revenu vs budget",
    },
  ];

  const isEmailCampaign = Form.useWatch("channel", form) === "Email";

  return (
    <div className="dashboard-content">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <RiseOutlined style={{ marginRight: 8 }} />
          Marketing
        </h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchCampaigns();
              fetchStats();
            }}
          >
            Actualiser
          </Button>
          {can("marketing.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouvelle campagne
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {kpis.map((kpi) => (
          <Col xs={24} sm={12} lg={6} key={kpi.label}>
            <Card className="kpi-card">
              <div className="marketing-kpi">
                <div className="kpi-icon">{kpi.icon}</div>
                <div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="marketing-kpi-hint">{kpi.hint}</div>
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
          placeholder="Rechercher une campagne..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 280 }}
          onSearch={handleSearch}
        />
        <Select
          value={channelFilter}
          onChange={setChannelFilter}
          style={{ width: 190 }}
        >
          <Option value="">Tous les canaux</Option>
          {CHANNELS.map((channel) => (
            <Option key={channel} value={channel}>
              {channel}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={campaigns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: (
            <Empty
              description="Aucune campagne pour le moment"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editing ? "Modifier la campagne" : "Nouvelle campagne"}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          setAudience(null);
          form.resetFields();
        }}
        okText={editing ? "Enregistrer" : "Créer"}
        cancelText="Annuler"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nom de la campagne"
            rules={[{ required: true, message: "Le nom est requis" }]}
          >
            <Input placeholder="Ex: Relance prospects T1" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Objectif de la campagne" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="channel" label="Canal">
                <Select>
                  {CHANNELS.map((channel) => (
                    <Option key={channel} value={channel}>
                      {channel}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Statut">
                <Select>
                  {STATUSES.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="budget" label="Budget (€)">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Date de début">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Date de fin">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>
            Ciblage
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="statuts" label="Statut des clients visés">
                <Select mode="multiple" placeholder="Tous" allowClear>
                  {CLIENT_STATUTS.map((statut) => (
                    <Option key={statut} value={statut}>
                      {statut}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secteurActivite" label="Secteur d'activité">
                <Input placeholder="Ex: Immobilier" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sourceLead" label="Source du lead">
                <Input placeholder="Ex: Salon, Site web" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="minScore" label="Score min.">
                <InputNumber style={{ width: "100%" }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maxScore" label="Score max.">
                <InputNumber style={{ width: "100%" }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Button
            icon={<TeamOutlined />}
            loading={audienceLoading}
            onClick={handlePreviewAudience}
            style={{ marginBottom: 12 }}
          >
            Calculer l'audience
          </Button>

          {audience && (
            <Alert
              className="marketing-audience-alert"
              type={audience.exceedsLimit ? "warning" : "info"}
              showIcon
              message={`${audience.count} destinataire(s) joignable(s) par email`}
              description={
                <div>
                  {audience.withoutEmail > 0 && (
                    <div className="marketing-cell-sub">
                      {audience.withoutEmail} client(s) correspondent au ciblage
                      mais n'ont pas d'adresse email.
                    </div>
                  )}
                  {audience.exceedsLimit && (
                    <div className="marketing-cell-sub">
                      Au-delà de {audience.maxPerSend} destinataires, l'envoi est
                      bloqué. Affinez le ciblage.
                    </div>
                  )}
                  {audience.sample?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {audience.sample.map((client) => (
                        <Tag key={client._id} className="marketing-sample-tag">
                          {client.entreprise}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
          )}

          {isEmailCampaign && (
            <>
              <Divider orientation="left" plain>
                Message
              </Divider>
              <Form.Item name="subject" label="Objet de l'email">
                <Input placeholder="Objet vu par le destinataire" />
              </Form.Item>
              <Form.Item name="content" label="Contenu">
                <Input.TextArea
                  rows={6}
                  placeholder="Corps du message. Une ligne vide sépare deux paragraphes."
                />
              </Form.Item>
            </>
          )}

          {editing && (
            <>
              <Divider orientation="left" plain>
                Résultats
              </Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="leads" label="Leads générés">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="revenue" label="Revenu généré (€)">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default Marketing;
