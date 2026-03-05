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
} from "../utils/api";
import "./UserManagement.css";

const { Option } = Select;

const ROLES = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Manager", color: "blue" },
  commercial: { label: "Commercial", color: "green" },
  comptable: { label: "Comptable", color: "purple" },
  employe: { label: "Employé", color: "default" },
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
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
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

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters,
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

  const columns = [
    {
      title: "Utilisateur",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>
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
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Utilisateurs Actifs"
                value={stats.activeUsers}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Utilisateurs Inactifs"
                value={stats.inactiveUsers}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
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
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>
      )}

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
            <Select
              placeholder="Statut"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => handleFilterChange("isActive", value)}
            >
              <Option value="true">Actif</Option>
              <Option value="false">Inactif</Option>
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
                // Only super admin can create/assign super admin role
                if (
                  role === "super_admin" &&
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
              <Form.Item name="department" label="Département">
                <Input placeholder="Ventes, IT, RH..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Statut" valuePropName="checked">
            <Select>
              <Option value={true}>Actif</Option>
              <Option value={false}>Inactif</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagement;
