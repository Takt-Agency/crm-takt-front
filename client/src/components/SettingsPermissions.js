import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { getAllUsers, updateUser } from "../utils/api";
import {
  FUNCTIONALITY_DEFINITIONS,
  getEffectivePermissions,
  normalizeRole,
} from "../utils/accessControl";
import "./SettingsPermissions.css";

const { Title, Text } = Typography;

const ROLE_LABELS = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Manager", color: "blue" },
  commercial: { label: "Commercial", color: "green" },
  comptable: { label: "Comptable", color: "purple" },
  employe: { label: "Employe", color: "default" },
};

const PERMISSION_COLUMNS = FUNCTIONALITY_DEFINITIONS;

function SettingsPermissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserIds, setSavingUserIds] = useState({});
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState(undefined);

  const loadUsers = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { limit: 300, page: 1 };
      const nextSearchText = overrides.searchText ?? searchText;
      const nextRoleFilter = overrides.roleFilter ?? roleFilter;

      if (String(nextSearchText).trim()) {
        params.search = String(nextSearchText).trim();
      }
      if (nextRoleFilter) {
        params.role = nextRoleFilter;
      }

      const data = await getAllUsers(params);
      setUsers(data.users || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des parametres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const visibleUsers = useMemo(() => users, [users]);

  const handleTogglePermission = async (user, permissionKey, checked) => {
    const userId = user.id || user._id;
    const currentPermissions = getEffectivePermissions(user);
    const nextPermissions = checked
      ? Array.from(new Set([...currentPermissions, permissionKey]))
      : currentPermissions.filter((permission) => permission !== permissionKey);

    const previousUsers = users;
    setUsers((currentUsers) =>
      currentUsers.map((item) =>
        (item.id || item._id) === userId
          ? {
              ...item,
              permissions: nextPermissions,
              permissionMode: "custom",
            }
          : item,
      ),
    );
    setSavingUserIds((current) => ({ ...current, [userId]: true }));

    try {
      await updateUser(userId, {
        permissions: nextPermissions,
        permissionMode: "custom",
      });
      message.success("Acces mis a jour");
    } catch (error) {
      setUsers(previousUsers);
      message.error(error.message || "Impossible de sauvegarder les acces");
    } finally {
      setSavingUserIds((current) => ({ ...current, [userId]: false }));
    }
  };

  const columns = [
    {
      title: "Code utilisateur",
      dataIndex: "email",
      key: "email",
      width: 240,
      fixed: "left",
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{record.name || "Utilisateur"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 150,
      render: (role) => {
        const normalizedRole = normalizeRole(role);
        const roleInfo = ROLE_LABELS[normalizedRole] || { label: role, color: "default" };
        return <Tag color={roleInfo.color}>{roleInfo.label}</Tag>;
      },
    },
    {
      title: "Mode",
      dataIndex: "permissionMode",
      key: "permissionMode",
      width: 120,
      render: (value) => (
        <Tag color={value === "custom" ? "geekblue" : "default"}>
          {value === "custom" ? "Personnalise" : "Par role"}
        </Tag>
      ),
    },
    ...PERMISSION_COLUMNS.map((column) => ({
      title: column.label,
      dataIndex: column.key,
      key: column.key,
      width: 160,
      align: "center",
      render: (_, record) => {
        const userId = record.id || record._id;
        const activePermissions = getEffectivePermissions(record);
        const checked = activePermissions.includes(column.key);
        const locked = normalizeRole(record.role) === "super_admin";
        const saving = Boolean(savingUserIds[userId]);

        return (
          <Checkbox
            checked={checked}
            disabled={locked || saving}
            onChange={(event) =>
              handleTogglePermission(record, column.key, event.target.checked)
            }
          />
        );
      },
    })),
  ];

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div>
          <p className="settings-kicker">Parametres utilisateur</p>
          <Title level={2} style={{ margin: 0 }}>
            Matrice des fonctionnalites par utilisateur
          </Title>
          <Text type="secondary">
            Le super admin peut cocher ou decocher chaque fonctionnalite par
            personne. Les changements sont enregistres immediatement.
          </Text>
        </div>
        <SettingOutlined className="settings-hero-icon" />
      </div>

      <Card className="settings-toolbar" bordered={false}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Space wrap>
              <Input
                allowClear
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onPressEnter={loadUsers}
                placeholder="Entrer une valeur pour rechercher un utilisateur"
                prefix={<SearchOutlined />}
                style={{ width: 320 }}
              />
              <Select
                allowClear
                placeholder="Role"
                style={{ width: 180 }}
                value={roleFilter}
                onChange={(value) => setRoleFilter(value)}
              >
                {Object.keys(ROLE_LABELS).map((role) => (
                  <Select.Option key={role} value={role}>
                    {ROLE_LABELS[role].label}
                  </Select.Option>
                ))}
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadUsers}>
                Chercher
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText("");
                  setRoleFilter(undefined);
                  loadUsers({ searchText: "", roleFilter: undefined });
                }}
              >
                Reinitialiser
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={10} style={{ textAlign: "right" }}>
            <Alert
              showIcon
              type="info"
              title="Aucun filtre n'est applique"
              description="L'ecran affiche la liste des utilisateurs et leurs acces fonctionnalite par fonctionnalite."
            />
          </Col>
        </Row>
      </Card>

      <Card className="settings-table-card" bordered={false}>
        <div className="settings-table-wrap">
          <Spin spinning={loading} tip="Chargement des parametres...">
            <Table
              className="settings-table"
              columns={columns}
              dataSource={visibleUsers}
              rowKey={(record) => record.id || record._id}
              pagination={false}
              scroll={{ x: 2600, y: 620 }}
              sticky
              size="middle"
            />
          </Spin>
        </div>
      </Card>
    </div>
  );
}

export default SettingsPermissions;
