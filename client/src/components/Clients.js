import React, { useState, useEffect } from "react";
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
  Card,
  Row,
  Col,
  Statistic,
  Dropdown,
  DatePicker,
  InputNumber,
  Timeline,
  Divider,
  Descriptions,
  Empty,
  Popconfirm,
  Tabs,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  EuroOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  getAllClients,
  createClient,
  createProject,
  updateProjectById,
  deleteProjectById,
  updateClient,
  deleteClient,
  getClientStats,
  getClientById,
  updateLastContact,
  addClientInteraction,
  exportClientsCsv,
  getMe,
  getAllProjects,
} from "../utils/api";
import { useOngletUrl } from "../hooks/useOngletUrl";
import dayjs from "dayjs";
import "./Clients.css";
import "./Dashboard.css";
import { canAccessModule } from "../utils/accessControl";
import {
  ClientDocumentsDrawer,
  ClientRgpdModal,
} from "./ClientDocuments";

const { Option } = Select;

const STATUTS = {
  Actif: { label: "Actif", color: "green", icon: <CheckCircleOutlined /> },
  Inactif: { label: "Inactif", color: "red", icon: <CloseCircleOutlined /> },
  Prospect: {
    label: "Prospect",
    color: "orange",
    icon: <QuestionCircleOutlined />,
  },
};

// Un onglet par statut de client. Les compteurs affiches au-dessus
// reprennent les memes categories.
const ONGLETS = [
  { key: "tous", label: "Tous" },
  { key: "actifs", label: "Actifs" },
  { key: "prospects", label: "Prospects" },
  { key: "inactifs", label: "Inactifs" },
];
const STATUT_PAR_ONGLET = {
  tous: undefined,
  actifs: "Actif",
  prospects: "Prospect",
  inactifs: "Inactif",
};

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});

  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [documentsClient, setDocumentsClient] = useState(null);
  const [rgpdClient, setRgpdClient] = useState(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projectsManagerVisible, setProjectsManagerVisible] = useState(false);
  const [selectedProjectsClient, setSelectedProjectsClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [projectDetailsVisible, setProjectDetailsVisible] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [projectClient, setProjectClient] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [interactionForm] = Form.useForm();
  const [form] = Form.useForm();
  const [projectForm] = Form.useForm();

  useEffect(() => {
    fetchCurrentUser();
    fetchStats();
  }, []);

  // Le statut vient de l'onglet : tout changement recharge depuis la
  // premiere page, une pagination heritee n'aurait plus de sens.
  useEffect(() => {
    const statut = STATUT_PAR_ONGLET[ongletActif];
    const parametres = { ...filters, statut };
    setFilters(parametres);
    fetchClients(1, pagination.pageSize, parametres);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongletActif]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getMe();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchClients = async (page = 1, pageSize = 10, filterParams = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filterParams,
      };

      const response = await getAllClients(params);
      setClients(response.clients || []);
      setPagination({
        current: response.pagination?.page || page,
        pageSize: response.pagination?.limit || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      message.error("Erreur lors du chargement des clients");
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getClientStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    const filterParams = { ...filters };
    if (filters.statut && filters.statut.length > 0) {
      filterParams.statut = filters.statut[0];
    }
    setFilters(filterParams);
    fetchClients(
      paginationConfig.current,
      paginationConfig.pageSize,
      filterParams,
    );
  };

  const handleSearch = () => {
    const filterParams = { ...filters, search: searchText };
    setFilters(filterParams);
    fetchClients(1, pagination.pageSize, filterParams);
  };

  const handleReset = () => {
    setSearchText("");
    setFilters({});
    fetchClients(1, pagination.pageSize);
    fetchStats();
  };

  const handleAddClient = () => {
    setEditingClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    form.setFieldsValue({
      ...client,
      tagsInput: (client.tags || []).join(", "),
      contactPrincipal: client.contacts?.find((item) => item.isPrimary) || null,
      dernierContact: client.dernierContact
        ? dayjs(client.dernierContact)
        : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const clientData = {
        ...values,
        tags: values.tagsInput
          ? values.tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        dernierContact: values.dernierContact
          ? values.dernierContact.toISOString()
          : undefined,
      };

      delete clientData.tagsInput;

      if (editingClient) {
        await updateClient(editingClient._id, clientData);
        message.success("Client mis à jour avec succès");
      } else {
        await createClient(clientData);
        message.success("Client créé avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      fetchClients(pagination.current, pagination.pageSize, filters);
      fetchStats();
    } catch (error) {
      if (error.errorFields) {
        message.error("Veuillez remplir tous les champs requis");
      } else {
        message.error(error.message || "Erreur lors de l'enregistrement");
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportClientsCsv({
        statut: filters.statut,
        search: searchText,
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "clients-export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      message.success("Export CSV lancé");
    } catch (error) {
      message.error(error.message || "Erreur lors de l'export CSV");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClient(id);
      message.success("Client supprimé avec succès");
      fetchClients(pagination.current, pagination.pageSize, filters);
      fetchStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const openProjectModal = (client) => {
    setProjectClient(client);
    setEditingProject(null);
    projectForm.resetFields();
    projectForm.setFieldsValue({
      clientName: client.entreprise,
      status: "Planifie",
    });
    setProjectModalVisible(true);
  };

  const handleCreateProjectForClient = async () => {
    try {
      const values = await projectForm.validateFields();
      if (!projectClient?._id) {
        message.error("Client invalide");
        return;
      }

      const payload = {
        name: values.name,
        client: projectClient._id,
        status: values.status,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        budget: values.budget,
        description: values.description,
      };

      if (editingProject?._id) {
        await updateProjectById(editingProject._id, payload);
        message.success("Projet mis à jour");
      } else {
        await createProject(payload);
        message.success("Projet créé depuis le client");
      }

      setProjectModalVisible(false);
      setEditingProject(null);
      projectForm.resetFields();
      if (selectedProjectsClient?._id) {
        const projectsData = await getAllProjects({ client: selectedProjectsClient._id, limit: 200 });
        setClientProjects(projectsData.projects || []);
      }
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de la création du projet");
      }
    }
  };

  const openProjectsManager = async (client) => {
    try {
      setSelectedProjectsClient(client);
      const projectsData = await getAllProjects({ client: client._id, limit: 200 });
      setClientProjects(projectsData.projects || []);
      setProjectsManagerVisible(true);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des projets");
    }
  };

  const handleEditProject = (project) => {
    if (!selectedProjectsClient) return;
    setProjectClient(selectedProjectsClient);
    setEditingProject(project);
    projectForm.setFieldsValue({
      clientName: selectedProjectsClient.entreprise,
      name: project.name,
      status: project.status,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: project.endDate ? dayjs(project.endDate) : null,
      budget: project.budget,
      description: project.description,
    });
    setProjectModalVisible(true);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProjectById(projectId);
      message.success("Projet supprimé");
      if (selectedProjectsClient?._id) {
        const projectsData = await getAllProjects({ client: selectedProjectsClient._id, limit: 200 });
        setClientProjects(projectsData.projects || []);
      }
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleUpdateContact = async (id) => {
    try {
      await updateLastContact(id);
      message.success("Date de contact mise à jour");
      fetchClients(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const openTimeline = async (clientId) => {
    try {
      const clientData = await getClientById(clientId);
      setSelectedClient(clientData);
      interactionForm.resetFields();
      setTimelineVisible(true);
    } catch (error) {
      message.error(
        error.message || "Erreur lors du chargement de la fiche client",
      );
    }
  };

  const openProjectDetails = (project) => {
    setSelectedProjectDetails(project);
    setProjectDetailsVisible(true);
  };

  const handleAddInteraction = async () => {
    try {
      const values = await interactionForm.validateFields();
      await addClientInteraction(selectedClient._id, {
        type: values.type,
        summary: values.summary,
        date: values.date ? values.date.toISOString() : undefined,
      });

      const refreshed = await getClientById(selectedClient._id);
      setSelectedClient(refreshed);
      interactionForm.resetFields();
      fetchClients(pagination.current, pagination.pageSize, filters);
      message.success("Interaction ajoutée");
    } catch (error) {
      if (!error.errorFields) {
        message.error(
          error.message || "Erreur lors de l'ajout de l'interaction",
        );
      }
    }
  };

  const columns = [
    {
      title: "Entreprise",
      dataIndex: "entreprise",
      key: "entreprise",
      width: 200,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Contact",
      key: "contact",
      width: 250,
      render: (_, record) => (
        <div>
          <div>
            <MailOutlined /> {record.email}
          </div>
          <div>
            <PhoneOutlined /> {record.telephone}
          </div>
        </div>
      ),
    },
    {
      title: "Localité",
      dataIndex: "localite",
      key: "localite",
      width: 150,
      render: (text) => (
        <span>
          <EnvironmentOutlined /> {text}
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      filters: [
        { text: "Actif", value: "Actif" },
        { text: "Inactif", value: "Inactif" },
        { text: "Prospect", value: "Prospect" },
      ],
      render: (statut) => {
        const statusConfig = STATUTS[statut] || {};
        return (
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.label}
          </Tag>
        );
      },
    },
    {
      title: "CA (€)",
      dataIndex: "ca",
      key: "ca",
      width: 120,
      render: (ca) => (
        <span>
          <EuroOutlined /> {ca?.toLocaleString("fr-FR") || 0}
        </span>
      ),
    },
    {
      title: "Dernier Contact",
      dataIndex: "dernierContact",
      key: "dernierContact",
      width: 150,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record) => {
        const canEdit =
          currentUser &&
          [
            "super_admin",
            "administrateur",
            "manager",
            "commercial",
            "comptable",
          ].includes(currentUser.role);
        const canDelete =
          currentUser &&
          ["super_admin", "administrateur", "manager"].includes(
            currentUser.role,
          );
        const canManageProjects =
          currentUser &&
          ["super_admin", "administrateur", "manager"].includes(
            currentUser.role,
          );

        const menuItems = [];

        if (canEdit) {
          menuItems.push(
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Modifier",
              onClick: () => handleEditClient(record),
            },
            {
              key: "contact",
              icon: <CalendarOutlined />,
              label: "Marquer contact",
              onClick: () => handleUpdateContact(record._id),
            },
            {
              key: "timeline",
              icon: <CalendarOutlined />,
              label: "Historique",
              onClick: () => openTimeline(record._id),
            },
          );
        }

        if (currentUser && canAccessModule(currentUser, "clients.documents")) {
          menuItems.push({
            key: "documents",
            icon: <FolderOpenOutlined />,
            label: "Documents",
            onClick: () => setDocumentsClient(record),
          });
        }

        if (currentUser && canAccessModule(currentUser, "clients.rgpd")) {
          menuItems.push({
            key: "rgpd",
            icon: <SafetyCertificateOutlined />,
            label: "Données personnelles",
            onClick: () => setRgpdClient(record),
          });
        }

        if (canManageProjects) {
          menuItems.push({
            key: "projects",
            icon: <ShopOutlined />,
            label: "Projets",
            onClick: () => openProjectsManager(record),
          });

          menuItems.push({
            key: "create-project",
            icon: <PlusOutlined />,
            label: "Créer un projet",
            onClick: () => openProjectModal(record),
          });
        }

        if (canDelete) {
          if (menuItems.length > 0) {
            menuItems.push({ type: "divider" });
          }
          menuItems.push({
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Supprimer",
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: "Êtes-vous sûr de vouloir supprimer ce client ?",
                icon: <QuestionCircleOutlined />,
                content: "Cette action est irréversible.",
                okText: "Oui",
                cancelText: "Non",
                okType: "danger",
                onOk: () => handleDelete(record._id),
              });
            },
          });
        }

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: "20px" }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="dashboard-content clients-page">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic
                title="Total Clients"
                value={stats.totalClients}
                prefix={<ShopOutlined />}
                valueStyle={{ color: "var(--brand-cyan)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic
                title="Clients Actifs"
                value={stats.actifClients}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "var(--accent-green)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic
                title="Prospects (Clients)"
                value={stats.prospectClients}
                prefix={<QuestionCircleOutlined />}
                valueStyle={{ color: "var(--accent-yellow)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic
                title="Prospects Pipeline"
                value={stats.pipelineProspects || 0}
                prefix={<QuestionCircleOutlined />}
                valueStyle={{ color: "var(--accent-teal)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic
                title="CA Total"
                value={stats.totalCA}
                prefix={<EuroOutlined />}
                valueStyle={{ color: "var(--accent-purple)" }}
                suffix="€"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Rechercher..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Rechercher
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button onClick={handleExportCsv}>Exporter CSV</Button>
          </Space>
          {currentUser &&
            [
              "super_admin",
              "administrateur",
              "manager",
              "commercial",
              "comptable",
            ].includes(currentUser.role) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddClient}
              >
                Nouveau Client
              </Button>
            )}
        </Space>
      </Card>

      {/* Clients Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Client Modal */}
      <Modal
        title={editingClient ? "Modifier le Client" : "Nouveau Client"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={700}
        okText={editingClient ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            statut: "Prospect",
            ca: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Entreprise"
                name="entreprise"
                rules={[
                  {
                    required: true,
                    message: "Veuillez entrer le nom de l'entreprise",
                  },
                ]}
              >
                <Input
                  prefix={<ShopOutlined />}
                  placeholder="Nom de l'entreprise"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Veuillez entrer l'email" },
                  { type: "email", message: "Email invalide" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="email@example.com"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Téléphone"
                name="telephone"
                rules={[
                  { required: true, message: "Veuillez entrer le téléphone" },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="+216 XX XXX XXX"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Localité"
                name="localite"
                rules={[
                  { required: true, message: "Veuillez entrer la localité" },
                ]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder="Ville" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Statut" name="statut">
                <Select>
                  <Option value="Prospect">Prospect</Option>
                  <Option value="Actif">Actif</Option>
                  <Option value="Inactif">Inactif</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CA (€)" name="ca">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix={<EuroOutlined />}
                  placeholder="Chiffre d'affaires"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Score Client (0-100)" name="score">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="Score de qualification"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Source Lead" name="sourceLead">
                <Input placeholder="Site web, referral, publicité..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Adresse" name="adresse">
            <Input.TextArea rows={2} placeholder="Adresse complète" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Site Web" name="siteWeb">
                <Input placeholder="https://www.exemple.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Secteur d'Activité" name="secteurActivite">
                <Input placeholder="Ex: Informatique" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Tags (séparés par virgule)" name="tagsInput">
            <Input placeholder="VIP, SaaS, Grand compte..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contact principal - Nom"
                name={["contactPrincipal", "nom"]}
              >
                <Input placeholder="Nom du contact" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contact principal - Poste"
                name={["contactPrincipal", "poste"]}
              >
                <Input placeholder="Responsable marketing" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contact principal - Email"
                name={["contactPrincipal", "email"]}
              >
                <Input placeholder="contact@entreprise.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contact principal - Téléphone"
                name={["contactPrincipal", "telephone"]}
              >
                <Input placeholder="+216 ..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Dernier Contact" name="dernierContact">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Notes supplémentaires..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          selectedClient
            ? `Fiche Client - ${selectedClient.entreprise}`
            : "Fiche Client"
        }
        open={timelineVisible}
        onCancel={() => setTimelineVisible(false)}
        footer={null}
        width={920}
        className="client-record-modal"
      >
        {selectedClient ? (
          <>
            <Timeline
              items={(selectedClient.interactions || []).map((interaction) => ({
                color: "blue",
                children: `${dayjs(interaction.date).format("DD/MM/YYYY HH:mm")} - [${interaction.type}] ${interaction.summary}`,
              }))}
            />

            <Divider />

            <Form form={interactionForm} layout="vertical">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true, message: "Type requis" }]}
                  >
                    <Select placeholder="Type d'interaction">
                      <Option value="Appel">Appel</Option>
                      <Option value="Email">Email</Option>
                      <Option value="Réunion">Réunion</Option>
                      <Option value="Message">Message</Option>
                      <Option value="Autre">Autre</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="date" label="Date">
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label=" " style={{ marginTop: 30 }}>
                    <Button type="primary" onClick={handleAddInteraction} block>
                      Ajouter interaction
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="summary"
                label="Résumé"
                rules={[{ required: true, message: "Résumé requis" }]}
              >
                <Input.TextArea rows={3} placeholder="Résumé de l'échange..." />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Modal>

      <Modal
        title={
          selectedProjectsClient
            ? `Projets - ${selectedProjectsClient.entreprise}`
            : "Projets"
        }
        open={projectsManagerVisible}
        onCancel={() => setProjectsManagerVisible(false)}
        footer={null}
        width={920}
        className="client-record-modal"
      >
        <div className="client-projects-summary">
          <Tag color="blue">Total: {clientProjects.length}</Tag>
          <Tag color="green">
            En cours: {clientProjects.filter((project) => project.status === "En cours").length}
          </Tag>
          <Tag color="default">
            Planifiés: {clientProjects.filter((project) => project.status === "Planifie").length}
          </Tag>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => selectedProjectsClient && openProjectModal(selectedProjectsClient)}
          >
            Ajouter projet
          </Button>
        </div>

        {clientProjects.length === 0 ? (
          <Empty description="Aucun projet pour ce client" />
        ) : (
          <div className="client-projects-grid">
            {clientProjects.map((project) => (
              <Card
                key={project._id}
                size="small"
                className="client-project-card"
                title={
                  <div className="client-project-title-row">
                    <span>{project.name}</span>
                    <Tag color="blue">{project.status}</Tag>
                  </div>
                }
                extra={
                  <Space>
                    <Button type="link" onClick={() => openProjectDetails(project)}>
                      Détails
                    </Button>
                    <Button type="link" onClick={() => handleEditProject(project)}>
                      Modifier
                    </Button>
                    <Popconfirm
                      title="Supprimer ce projet ?"
                      onConfirm={() => handleDeleteProject(project._id)}
                      okText="Supprimer"
                      cancelText="Annuler"
                    >
                      <Button type="link" danger>
                        Supprimer
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <div className="client-project-meta">Code: {project.code || "-"}</div>
                <div className="client-project-meta">Deal: {project.deal?.title || "-"}</div>
                <div className="client-project-meta">
                  Début: {project.startDate ? dayjs(project.startDate).format("DD/MM/YYYY") : "-"}
                </div>
                <div className="client-project-meta">
                  Fin: {project.endDate ? dayjs(project.endDate).format("DD/MM/YYYY") : "-"}
                </div>
                <div className="client-project-meta">
                  Budget: {project.budget ? `${project.budget.toLocaleString("fr-FR")} €` : "-"}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title={selectedProjectDetails ? `Projet - ${selectedProjectDetails.name}` : "Détails projet"}
        open={projectDetailsVisible}
        onCancel={() => setProjectDetailsVisible(false)}
        footer={null}
        width={700}
      >
        {selectedProjectDetails && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Nom">{selectedProjectDetails.name}</Descriptions.Item>
            <Descriptions.Item label="Code">{selectedProjectDetails.code || "-"}</Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color="blue">{selectedProjectDetails.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Client">
              {selectedProjectDetails.client?.entreprise || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Deal lié">
              {selectedProjectDetails.deal?.title || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Période">
              {selectedProjectDetails.startDate
                ? dayjs(selectedProjectDetails.startDate).format("DD/MM/YYYY")
                : "-"}
              {" -> "}
              {selectedProjectDetails.endDate
                ? dayjs(selectedProjectDetails.endDate).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Budget">
              {selectedProjectDetails.budget
                ? `${selectedProjectDetails.budget.toLocaleString("fr-FR")} €`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedProjectDetails.description || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={
          projectClient
            ? `${editingProject ? "Modifier" : "Nouveau"} projet - ${projectClient.entreprise}`
            : `${editingProject ? "Modifier" : "Nouveau"} projet`
        }
        open={projectModalVisible}
        onCancel={() => {
          setProjectModalVisible(false);
          setEditingProject(null);
          projectForm.resetFields();
        }}
        onOk={handleCreateProjectForClient}
        okText={editingProject ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item name="clientName" label="Client">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nom du projet"
            rules={[{ required: true, message: "Nom du projet requis" }]}
          >
            <Input placeholder="Ex: Déploiement CRM 2026" />
          </Form.Item>

          <Form.Item label="Code projet">
            <Input value="Généré automatiquement" disabled />
          </Form.Item>

          <Form.Item name="status" label="Statut" initialValue="Planifie">
            <Select>
              <Option value="Planifie">Planifié</Option>
              <Option value="En cours">En cours</Option>
              <Option value="En pause">En pause</Option>
              <Option value="Termine">Terminé</Option>
              <Option value="Annule">Annulé</Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
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

          <Form.Item name="budget" label="Budget (€)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Objectifs du projet..." />
          </Form.Item>
        </Form>
      </Modal>

      <ClientDocumentsDrawer
        client={documentsClient}
        ouvert={Boolean(documentsClient)}
        onFermer={() => setDocumentsClient(null)}
      />

      <ClientRgpdModal
        client={rgpdClient}
        ouvert={Boolean(rgpdClient)}
        onFermer={() => setRgpdClient(null)}
        // L'effacement change la raison sociale affichee : la liste doit
        // refleter le dossier anonymise immediatement.
        onEfface={() => fetchClients()}
      />
    </div>
  );
}

export default Clients;
