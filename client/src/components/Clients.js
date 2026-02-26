import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Dropdown,
  DatePicker,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  LogoutOutlined,
  BellOutlined,
  EuroOutlined,
  RiseOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  CheckSquareOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  updateLastContact,
  getMe,
  logout,
} from "../utils/api";
import dayjs from "dayjs";
import "./Clients.css";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const ROLES = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Manager", color: "blue" },
  commercial: { label: "Commercial", color: "green" },
  comptable: { label: "Comptable", color: "purple" },
  employe: { label: "Employé", color: "default" },
};

const STATUTS = {
  Actif: { label: "Actif", color: "green", icon: <CheckCircleOutlined /> },
  Inactif: { label: "Inactif", color: "red", icon: <CloseCircleOutlined /> },
  Prospect: {
    label: "Prospect",
    color: "orange",
    icon: <QuestionCircleOutlined />,
  },
};

function Clients() {
  const [collapsed, setCollapsed] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchClients();
    fetchStats();
  }, []);

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
        dernierContact: values.dernierContact
          ? values.dernierContact.toISOString()
          : undefined,
      };

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

  const handleUpdateContact = async (id) => {
    try {
      await updateLastContact(id);
      message.success("Date de contact mise à jour");
      fetchClients(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleMenuClick = (key) => {
    if (key === "1") {
      navigate("/dashboard");
    } else if (key === "2") {
      navigate("/clients");
    } else if (key === "9") {
      navigate("/users");
    } else if (key === "profile") {
      navigate("/profile");
    } else if (key === "logout") {
      logout();
    }
  };

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Mon Profil",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Déconnexion",
      danger: true,
    },
  ];

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
          );
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

  const menuItems = [
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "2",
      icon: <UserOutlined />,
      label: "Clients",
      onClick: () => navigate("/clients"),
    },
    // Show user management for super admin, administrateur, and manager
    ...(currentUser &&
    ["super_admin", "administrateur", "manager"].includes(currentUser.role)
      ? [
          {
            key: "9",
            icon: <TeamOutlined />,
            label: "Utilisateurs",
            onClick: () => navigate("/users"),
          },
        ]
      : []),
    {
      key: "3",
      icon: <TeamOutlined />,
      label: "Prospects",
    },
    {
      key: "4",
      icon: <CheckSquareOutlined />,
      label: "Tâches",
    },
    {
      key: "5",
      icon: <FileTextOutlined />,
      label: "Devis & Facturation",
    },
    {
      key: "6",
      icon: <EuroOutlined />,
      label: "Finances",
    },
    {
      key: "7",
      icon: <UserSwitchOutlined />,
      label: "RH",
    },
    {
      key: "8",
      icon: <RiseOutlined />,
      label: "Marketing",
    },
  ];

  return (
    <Layout className="dashboard-layout" style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="dashboard-sider"
        width={240}
      >
        <div className="logo-container">
          <div className="logo-icon">N</div>
          {!collapsed && <span className="logo-text">Nexia Digital</span>}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={["2"]}
          items={menuItems}
          className="dashboard-menu"
        />
        <div className="sidebar-footer">
          <Menu mode="inline" className="dashboard-menu">
            <Menu.Item key="params" icon={<SettingOutlined />}>
              Paramètres
            </Menu.Item>
            <Menu.Item
              key="logout"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              Déconnexion
            </Menu.Item>
          </Menu>
        </div>
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <h1 className="header-title">Nexia Digital CRM</h1>
          <div className="header-actions">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="header-icon-btn"
            />
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
            >
              <div className="user-info-wrapper">
                <Avatar icon={<UserOutlined />} className="user-avatar" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <span className="user-name">
                    {currentUser?.name || "Utilisateur"}
                  </span>
                  {currentUser?.role && (
                    <Tag
                      color={ROLES[currentUser.role]?.color || "default"}
                      style={{ fontSize: "10px", padding: "0 4px", margin: 0 }}
                    >
                      {ROLES[currentUser.role]?.label || currentUser.role}
                    </Tag>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          className="dashboard-content"
          style={{ margin: "24px 16px 0", overflow: "initial" }}
        >
          {/* Statistics Cards */}
          {stats && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Clients"
                    value={stats.totalClients}
                    prefix={<ShopOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Clients Actifs"
                    value={stats.actifClients}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Prospects"
                    value={stats.prospectClients}
                    prefix={<QuestionCircleOutlined />}
                    valueStyle={{ color: "#faad14" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="CA Total"
                    value={stats.totalCA}
                    prefix={<EuroOutlined />}
                    valueStyle={{ color: "#722ed1" }}
                    suffix="€"
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Search and Filter Bar */}
          <Card style={{ marginBottom: 16 }}>
            <Space
              wrap
              style={{ width: "100%", justifyContent: "space-between" }}
            >
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
        </Content>
      </Layout>

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
    </Layout>
  );
}

export default Clients;
