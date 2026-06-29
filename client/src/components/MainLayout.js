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
import { BRAND_LOGO_LIGHT } from "../utils/brandAssets";
import { canAccessModule, normalizeRole } from "../utils/accessControl";
import ChatWidget from "./ChatWidget";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

const ROLES = {
  super_admin: { label: "Super Admin", color: "red" },
  administrateur: { label: "Administrateur", color: "orange" },
  manager: { label: "Chef de projet (Manager)", color: "blue" },
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
    } else if (key === "settings") {
      navigate("/settings");
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
    if (path === "/tasks") return "4";
    if (path.startsWith("/invoices")) return "5";
    if (path.startsWith("/finances")) return "6";
    if (path.startsWith("/hr")) return "7";
    if (path.startsWith("/settings")) return "10";
    if (path === "/users") return "9";
    return "1";
  };

  const menuItems = [
    // Use normalized role checks to handle legacy values like "Commercial".
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
      onClick: () => navigate("/dashboard"),
    },
    ...(user && canAccessModule(user, "clients")
      ? [
          {
            key: "2",
            icon: <UserOutlined />,
            label: "Clients",
            onClick: () => navigate("/clients"),
          },
        ]
      : []),
    ...(user && normalizeRole(user.role) === "super_admin"
      ? [
          {
            key: "9",
            icon: <TeamOutlined />,
            label: "Utilisateurs",
            onClick: () => navigate("/users"),
          },
        ]
      : []),
    ...(user && canAccessModule(user, "prospects")
      ? [
          {
            key: "3",
            icon: <TeamOutlined />,
            label: "Prospects",
            onClick: () => navigate("/prospects"),
          },
        ]
      : []),
    ...(user && canAccessModule(user, "tasks")
      ? [
          {
            key: "4",
            icon: <CheckSquareOutlined />,
            label: "Tâches",
            onClick: () => navigate("/tasks"),
          },
        ]
      : []),
    ...(user && canAccessModule(user, "invoices")
      ? [
          {
            key: "5",
            icon: <FileTextOutlined />,
            label: "Devis & Facturation",
            onClick: () => navigate("/invoices"),
          },
        ]
      : []),
    ...(user && canAccessModule(user, "finances")
      ? [
          {
            key: "6",
            icon: <EuroOutlined />,
            label: "Finances",
            onClick: () => navigate("/finances"),
          },
        ]
      : []),
    ...(user && canAccessModule(user, "hr")
      ? [
          {
            key: "7",
            icon: <UserSwitchOutlined />,
            label: "RH",
            onClick: () => navigate("/hr"),
          },
        ]
      : []),
    ...(user && normalizeRole(user.role) === "super_admin"
      ? [
          {
            key: "10",
            icon: <SettingOutlined />,
            label: "Parametres",
            onClick: () => navigate("/settings"),
          },
        ]
      : []),
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
          <img
            src={BRAND_LOGO_LIGHT}
            alt="Nexia Digital"
            className="logo-corner-img"
          />
        </div>
        <div style={{ marginBottom: 60 }}>
          <div className="menu-section-title">
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
          <Menu
            mode="inline"
            className="dashboard-menu"
            items={[
              {
                key: "params",
                icon: <SettingOutlined />,
                label: "Paramètres",
                onClick: () => navigate("/settings"),
              },
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Déconnexion",
                danger: true,
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <div className="header-branding">
            <h1 className="header-title">Nexia Digital CRM</h1>
          </div>
          <div className="header-actions">
            <Button
              type="primary"
              className="header-cta"
              onClick={() => navigate("/invoices")}
            >
              Demander un devis
            </Button>
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
                <Avatar
                  src={user?.profilePicture}
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
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
                      color={
                        ROLES[normalizeRole(user.role)]?.color || "default"
                      }
                      style={{ fontSize: "10px", padding: "0 4px", margin: 0 }}
                    >
                      {ROLES[normalizeRole(user.role)]?.label || user.role}
                    </Tag>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 0, overflow: "initial" }}>{children}</Content>
        <ChatWidget />
      </Layout>
    </Layout>
  );
};

export default MainLayout;
