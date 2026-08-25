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
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Checkbox,
  Tabs,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  getMe,
  getDepartments,
} from "../utils/api";
import { useOngletUrl } from "../hooks/useOngletUrl";
import {
  MODULE_PERMISSIONS,
  getDefaultPermissionsForRole,
  sanitizePermissions,
} from "../utils/accessControl";
import "./UserManagement.css";

const { Option } = Select;

const ROLES = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Chef de projet (Manager)", color: "blue" },
  commercial: { label: "Commercial", color: "green" },
  comptable: { label: "Comptable", color: "purple" },
  rh: { label: "Responsable RH", color: "cyan" },
  directeur_general: { label: "Directeur général", color: "magenta" },
  directeur_administratif_financier: {
    label: "Directeur administratif et financier (DAF)",
    color: "gold",
  },
  directeur_ressources_humaines: {
    label: "Directeur des ressources humaines (DRH)",
    color: "cyan",
  },
  directeur_commercial: { label: "Directeur commercial", color: "green" },
  directeur_systemes_information: {
    label: "Directeur des systèmes d'information (DSI)",
    color: "blue",
  },
  directeur_production: { label: "Directeur de production", color: "purple" },
  directeur_marketing: { label: "Directeur marketing", color: "magenta" },
  gestionnaire_achat: { label: "Gestionnaire achat", color: "geekblue" },
  employe: { label: "Employé", color: "default" },
};

const PERMISSION_OPTIONS = [
  { value: "clients", label: "Clients" },
  { value: "prospects", label: "Prospects" },
  { value: "tasks", label: "Tâches" },
  { value: "invoices", label: "Devis & Facturation" },
  { value: "finances", label: "Finances" },
  { value: "hr", label: "RH" },
  { value: "users", label: "Utilisateurs" },
].filter((option) => MODULE_PERMISSIONS.includes(option.value));

// Les onglets reprennent exactement les compteurs affiches au-dessus :
// ce que l'on denombre, on peut le consulter.
const ONGLETS = [
  { key: "tous", label: "Tous" },
  { key: "actifs", label: "Actifs" },
  { key: "inactifs", label: "Inactifs" },
  { key: "administrateurs", label: "Administrateurs" },
];
const FILTRE_PAR_ONGLET = {
  tous: {},
  actifs: { isActive: "true" },
  inactifs: { isActive: "false" },
  administrateurs: { role: "administrateur" },
};

function UserManagement() {
  const [users, setUsers] = useState([]);
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
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCurrentUser();
    fetchStats();
    // Le rattachement doit designer un departement reel : la liste vient donc
    // de la collection, jamais d'une saisie libre.
    getDepartments({ actif: true })
      .then(setDepartements)
      .catch(() => {});
    // Le chargement de la liste revient a l'effet suivant, qui s'execute
    // aussi au montage : l'appeler ici ferait un doublon.
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getMe();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters,
        ...FILTRE_PAR_ONGLET[ongletActif],
        ...(searchText && { search: searchText }),
      };
      const data = await getAllUsers(params);
      setUsers(data.users || []);
      setPagination({
        current: data.pagination?.page || page,
        pageSize: data.pagination?.limit || pageSize,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      message.error(
        error.message || "Erreur lors du chargement des utilisateurs",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleTableChange = (pagination) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  const handleSearch = () => {
    fetchUsers(1, pagination.pageSize);
  };

  // Changer d'onglet recharge depuis la premiere page : conserver la
  // pagination d'une autre selection n'aurait pas de sens.
  useEffect(() => {
    fetchUsers(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongletActif]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) delete newFilters[key];
    setFilters(newFilters);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      permissions:
        sanitizePermissions(user.permissions).length > 0
          ? sanitizePermissions(user.permissions)
          : getDefaultPermissionsForRole(user.role).filter(
              (permission) => permission !== "dashboard",
            ),
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      message.success("Utilisateur supprimé avec succès");
      fetchUsers(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      message.success("Statut mis à jour avec succès");
      fetchUsers(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await updateUser(editingUser.id || editingUser._id, values);
        message.success("Utilisateur mis à jour avec succès");
      } else {
        await createUser(values);
        message.success("Utilisateur créé avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      fetchUsers(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.message || "Erreur lors de l'opération");
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  };

  const canManagePermissions = currentUser?.role === "super_admin";

  const columns = [
    {
      title: "Utilisateur",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "var(--brand-cyan)" }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Rôle",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const roleInfo = ROLES[role] || { label: role, color: "default" };
        return <Tag color={roleInfo.color}>{roleInfo.label}</Tag>;
      },
      filters: Object.keys(ROLES).map((key) => ({
        text: ROLES[key].label,
        value: key,
      })),
    },
    {
      title: "Département",
      dataIndex: "department",
      key: "department",
      render: (text) => text || "-",
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
      render: (text) => text || "-",
    },
    {
      title: "Statut",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isActive ? "success" : "error"}
        >
          {isActive ? "Actif" : "Inactif"}
        </Tag>
      ),
      filters: [
        { text: "Actif", value: "true" },
        { text: "Inactif", value: "false" },
      ],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const canModify =
          currentUser?.role === "super_admin" ||
          (currentUser?.role === "administrateur" &&
            record.role !== "super_admin");

        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              disabled={!canModify}
            >
              Modifier
            </Button>
            <Popconfirm
              title="Changer le statut?"
              description={`Voulez-vous ${record.isActive ? "désactiver" : "activer"} cet utilisateur?`}
              onConfirm={() => handleToggleStatus(record.id || record._id)}
              okText="Oui"
              cancelText="Non"
              disabled={!canModify}
            >
              <Button
                type="link"
                icon={<PoweroffOutlined />}
                disabled={!canModify}
              >
                {record.isActive ? "Désactiver" : "Activer"}
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Supprimer l'utilisateur?"
              description="Cette action est irréversible."
              onConfirm={() => handleDeleteUser(record.id || record._id)}
              okText="Oui"
              cancelText="Non"
              disabled={!canModify}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={!canModify}
              >
                Supprimer
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="dashboard-content">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Utilisateurs"
                value={stats.totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "var(--brand-cyan)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Utilisateurs Actifs"
                value={stats.activeUsers}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "var(--accent-green)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Utilisateurs Inactifs"
                value={stats.inactiveUsers}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "var(--accent-red)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Administrateurs"
                value={
                  (stats.roleCount?.super_admin || 0) +
                  (stats.roleCount?.administrateur || 0)
                }
                prefix={<UserAddOutlined />}
                valueStyle={{ color: "var(--accent-yellow)" }}
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

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space
          wrap
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Space wrap>
            <Input
              placeholder="Rechercher..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Filtrer par rôle"
              style={{ width: 180 }}
              allowClear
              onChange={(value) => handleFilterChange("role", value)}
            >
              {Object.keys(ROLES).map((role) => (
                <Option key={role} value={role}>
                  {ROLES[role].label}
                </Option>
              ))}
            </Select>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={handleSearch}
            >
              Rechercher
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setFilters({});
                fetchUsers(1, pagination.pageSize);
              }}
            >
              Réinitialiser
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateUser}
            size="large"
          >
            Nouvel Utilisateur
          </Button>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey={(record) => record.id || record._id}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingUser ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true, role: "employe" }}
        >
          <Form.Item
            name="name"
            label="Nom complet"
            rules={[{ required: true, message: "Veuillez entrer le nom" }]}
          >
            <Input placeholder="Jean Dupont" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Veuillez entrer l'email" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input placeholder="jean@example.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                { required: true, message: "Veuillez entrer un mot de passe" },
                { min: 6, message: "Minimum 6 caractères" },
              ]}
            >
              <Input.Password placeholder="Mot de passe" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rôle"
            rules={[
              { required: true, message: "Veuillez sélectionner un rôle" },
            ]}
          >
            <Select>
              {Object.keys(ROLES).map((role) => {
                // Only super admin can create/assign privileged admin roles.
                if (
                  ["super_admin", "administrateur"].includes(role) &&
                  currentUser?.role !== "super_admin"
                ) {
                  return null;
                }
                return (
                  <Option key={role} value={role}>
                    {ROLES[role].label}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Téléphone">
                <Input placeholder="+33 6 12 34 56 78" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Département"
                rules={[
                  { required: true, message: "Le département est obligatoire" },
                ]}
                extra="Détermine qui approuve ses demandes d'achat."
              >
                <Select
                  placeholder="Choisir le département"
                  showSearch
                  optionFilterProp="children"
                >
                  {departements.map((d) => (
                    <Option key={d._id} value={d.nom}>
                      {d.code} — {d.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Statut" valuePropName="checked">
            <Select>
              <Option value={true}>Actif</Option>
              <Option value={false}>Inactif</Option>
            </Select>
          </Form.Item>

          {canManagePermissions && (
            <Form.Item
              name="permissions"
              label="Accès aux fonctionnalités"
              extra="Laisser vide applique les accès par défaut du rôle."
            >
              <Checkbox.Group
                options={PERMISSION_OPTIONS}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagement;
