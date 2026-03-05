import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Dropdown, Button, Tag } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  EuroOutlined,
  UserSwitchOutlined,
  RiseOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { getMe, logout } from "../utils/api";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

const ROLES = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Manager", color: "blue" },
  commercial: { label: "Commercial", color: "green" },
  comptable: { label: "Comptable", color: "purple" },
  employe: { label: "Employé", color: "default" },
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/profile");
    } else if (key === "logout") {
      handleLogout();
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Mon profil",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Paramètres",
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

  // Get selected menu key based on current location
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "1";
    if (path === "/clients") return "2";
    if (path === "/prospects") return "3";
    if (path === "/users") return "9";
    return "1";
  };

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
    ...(user && ["super_admin", "administrateur", "manager"].includes(user.role)
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
      onClick: () => navigate("/prospects"),
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
        <div style={{ marginBottom: 60 }}>
          <div
            style={{
              padding: "12px 16px",
              color: "#8c8c8c",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 600,
            }}
          >
            {!collapsed && "MENU PRINCIPAL"}
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            className="dashboard-menu"
          />
        </div>
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
                    {user?.name || "Utilisateur"}
                  </span>
                  {user?.role && (
                    <Tag
                      color={ROLES[user.role]?.color || "default"}
                      style={{ fontSize: "10px", padding: "0 4px", margin: 0 }}
                    >
                      {ROLES[user.role]?.label || user.role}
                    </Tag>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 0, overflow: "initial" }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
