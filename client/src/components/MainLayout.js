import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Dropdown, Tag } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  EuroOutlined,
  UserSwitchOutlined,
  RiseOutlined,
  SettingOutlined,
  LogoutOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  SyncOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { getMe, logout } from "../utils/api";
import { BRAND_LOGO_LIGHT } from "../utils/brandAssets";
import { canAccessModule, normalizeRole } from "../utils/accessControl";
import ChatWidget from "./ChatWidget";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../theme/ThemeContext";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

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

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const { isDark } = useTheme();
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
    // Meme regle que dans la barre laterale : /settings est reserve au super
    // admin, l'entree ne doit pas apparaitre pour les autres roles.
    ...(user && canAccessModule(user, "users.permissions")
      ? [
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Paramètres",
          },
        ]
      : []),
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
  const getModuleKey = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "1";
    if (path === "/clients") return "2";
    if (path === "/prospects") return "3";
    if (path === "/tasks") return "4";
    if (path.startsWith("/projects")) return "11";
    if (path.startsWith("/invoices")) return "5";
    if (path.startsWith("/subscriptions")) return "12";
    if (path.startsWith("/catalog")) return "13";
    if (path.startsWith("/finances")) return "6";
    if (path.startsWith("/purchases")) return "14";
    if (path.startsWith("/departments")) return "15";
    if (path.startsWith("/hr")) return "7";
    if (path.startsWith("/marketing")) return "8";
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
            children: [
              {
                key: "2-tous",
                label: "Tous",
                onClick: () => navigate("/clients?tab=tous"),
              },
              {
                key: "2-actifs",
                label: "Actifs",
                onClick: () => navigate("/clients?tab=actifs"),
              },
              {
                key: "2-prospects",
                label: "Prospects",
                onClick: () => navigate("/clients?tab=prospects"),
              },
              {
                key: "2-inactifs",
                label: "Inactifs",
                onClick: () => navigate("/clients?tab=inactifs"),
              },
            ],
          },
        ]
      : []),
    // CDC 8.1.2 : la gestion des utilisateurs revient aussi a
    // l'Administrateur, et le Manager voit son equipe en lecture seule.
    ...(user && canAccessModule(user, "users")
      ? [
          {
            key: "9",
            icon: <TeamOutlined />,
            label: "Utilisateurs",
            children: [
              {
                key: "9-tous",
                label: "Tous",
                onClick: () => navigate("/users?tab=tous"),
              },
              {
                key: "9-actifs",
                label: "Actifs",
                onClick: () => navigate("/users?tab=actifs"),
              },
              {
                key: "9-inactifs",
                label: "Inactifs",
                onClick: () => navigate("/users?tab=inactifs"),
              },
              {
                key: "9-administrateurs",
                label: "Administrateurs",
                onClick: () => navigate("/users?tab=administrateurs"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "prospects")
      ? [
          {
            key: "3",
            icon: <TeamOutlined />,
            label: "Prospects",
            children: [
              {
                key: "3-pipeline",
                label: "Pipeline",
                onClick: () => navigate("/prospects?tab=pipeline"),
              },
              {
                key: "3-gagnes",
                label: "Gagnés",
                onClick: () => navigate("/prospects?tab=gagnes"),
              },
              {
                key: "3-perdus",
                label: "Perdus",
                onClick: () => navigate("/prospects?tab=perdus"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "tasks")
      ? [
          {
            key: "4",
            icon: <CheckSquareOutlined />,
            label: "Tâches",
            children: [
              {
                key: "4-liste",
                label: "Liste",
                onClick: () => navigate("/tasks?tab=liste"),
              },
              {
                key: "4-kanban",
                label: "Kanban",
                onClick: () => navigate("/tasks?tab=kanban"),
              },
              {
                key: "4-calendrier",
                label: "Calendrier",
                onClick: () => navigate("/tasks?tab=calendrier"),
              },
              {
                key: "4-gantt",
                label: "Gantt",
                onClick: () => navigate("/tasks?tab=gantt"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "projects")
      ? [
          {
            key: "11",
            icon: <ProjectOutlined />,
            label: "Projets",
            children: [
              {
                key: "11-tous",
                label: "Tous",
                onClick: () => navigate("/projects?tab=tous"),
              },
              {
                key: "11-planifie",
                label: "Planifié",
                onClick: () => navigate("/projects?tab=planifie"),
              },
              {
                key: "11-en-cours",
                label: "En cours",
                onClick: () => navigate("/projects?tab=en-cours"),
              },
              {
                key: "11-en-pause",
                label: "En pause",
                onClick: () => navigate("/projects?tab=en-pause"),
              },
              {
                key: "11-termine",
                label: "Terminé",
                onClick: () => navigate("/projects?tab=termine"),
              },
              {
                key: "11-annule",
                label: "Annulé",
                onClick: () => navigate("/projects?tab=annule"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "invoices")
      ? [
          {
            key: "5",
            icon: <FileTextOutlined />,
            label: "Devis & Facturation",
            children: [
              {
                key: "5-tous",
                label: "Tous",
                onClick: () => navigate("/invoices?tab=tous"),
              },
              {
                key: "5-devis",
                label: "Devis",
                onClick: () => navigate("/invoices?tab=devis"),
              },
              {
                key: "5-factures",
                label: "Factures",
                onClick: () => navigate("/invoices?tab=factures"),
              },
              ...(canAccessModule(user, "invoices.credit")
                ? [
                    {
                      key: "5-avoirs",
                      label: "Avoirs",
                      onClick: () => navigate("/invoices?tab=avoirs"),
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "subscriptions")
      ? [
          {
            key: "12",
            icon: <SyncOutlined />,
            label: "Abonnements",
            children: [
              {
                key: "12-tous",
                label: "Tous",
                onClick: () => navigate("/subscriptions?tab=tous"),
              },
              {
                key: "12-actifs",
                label: "Actifs",
                onClick: () => navigate("/subscriptions?tab=actifs"),
              },
              {
                key: "12-suspendus",
                label: "Suspendus",
                onClick: () => navigate("/subscriptions?tab=suspendus"),
              },
              {
                key: "12-termines",
                label: "Terminés",
                onClick: () => navigate("/subscriptions?tab=termines"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "catalog")
      ? [
          {
            key: "13",
            icon: <AppstoreOutlined />,
            label: "Catalogue",
            children: [
              {
                key: "13-toutes",
                label: "Toutes",
                onClick: () => navigate("/catalog?tab=toutes"),
              },
              {
                key: "13-actives",
                label: "Actives",
                onClick: () => navigate("/catalog?tab=actives"),
              },
              {
                key: "13-retirees",
                label: "Retirées",
                onClick: () => navigate("/catalog?tab=retirees"),
              },
              {
                key: "13-recurrentes",
                label: "Récurrentes",
                onClick: () => navigate("/catalog?tab=recurrentes"),
              },
              {
                key: "13-ponctuelles",
                label: "Ponctuelles",
                onClick: () => navigate("/catalog?tab=ponctuelles"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "finances")
      ? [
          {
            key: "6",
            icon: <EuroOutlined />,
            label: "Finances",
            children: [
              {
                key: "6-bilan",
                label: "Bilan comptable",
                onClick: () => navigate("/finances?tab=bilan"),
              },
              {
                key: "6-comptes",
                label: "Comptes bancaires",
                onClick: () => navigate("/finances?tab=comptes"),
              },
              {
                key: "6-fournisseurs",
                label: "Fournisseurs",
                onClick: () => navigate("/finances?tab=fournisseurs"),
              },
              {
                key: "6-commandes",
                label: "Commandes fournisseurs",
                onClick: () => navigate("/finances?tab=commandes"),
              },
              ...(["super_admin", "administrateur", "comptable"].includes(
                normalizeRole(user.role),
              )
                ? [
                    {
                      key: "6-paiements",
                      label: "Paiements à traiter",
                      onClick: () => navigate("/finances?tab=paiements"),
                    },
                  ]
                : []),
              {
                key: "6-rapprochement",
                label: "Rapprochement bancaire",
                onClick: () => navigate("/finances?tab=rapprochement"),
              },
              {
                key: "6-encaissements",
                label: "Encaissements",
                onClick: () => navigate("/finances?tab=encaissements"),
              },
              {
                key: "6-decaissements",
                label: "Décaissements",
                onClick: () => navigate("/finances?tab=decaissements"),
              },
              {
                key: "6-tresorerie",
                label: "Trésorerie",
                onClick: () => navigate("/finances?tab=tresorerie"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "purchases")
      ? [
          {
            key: "14",
            icon: <ShoppingCartOutlined />,
            label: "Achats",
            // Les trois etapes du flux, dans l'ordre ou on les franchit.
            children: [
              {
                key: "14-demandes",
                label: "Demandes d'achat",
                onClick: () => navigate("/purchases?tab=demandes"),
              },
              {
                key: "14-consultations",
                label: "Demandes de prix",
                onClick: () => navigate("/purchases?tab=consultations"),
              },
              {
                key: "14-commandes",
                label: "Commandes d'achat",
                onClick: () => navigate("/purchases?tab=commandes"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "departments")
      ? [
          {
            key: "15",
            icon: <ApartmentOutlined />,
            label: "Départements",
            children: [
              {
                key: "15-departements",
                label: "Départements",
                onClick: () => navigate("/departments?tab=departements"),
              },
              {
                key: "15-organisation",
                label: "Organisation",
                onClick: () => navigate("/departments?tab=organisation"),
              },
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "hr")
      ? [
          {
            key: "7",
            icon: <UserSwitchOutlined />,
            label: "RH",
            // Chaque entree ouvre la page RH directement sur son onglet.
            // Les volets exposant l'ensemble du personnel sont reserves ;
            // conges, pointage, soins et prets restent ouverts a tous, le
            // serveur limitant la portee au dossier de l'appelant.
            children: [
              ...(canAccessModule(user, "hr.employees")
                ? [
                    {
                      key: "7-employees",
                      label: "Employés",
                      onClick: () => navigate("/hr?tab=employees"),
                    },
                  ]
                : []),
              {
                key: "7-leaves",
                label: "Congés",
                onClick: () => navigate("/hr?tab=leaves"),
              },
              {
                key: "7-attendance",
                label: "Pointage & Présence",
                onClick: () => navigate("/hr?tab=attendance"),
              },
              {
                key: "7-soins",
                label: "Soins",
                onClick: () => navigate("/hr?tab=soins"),
              },
              ...(canAccessModule(user, "hr.employees")
                ? [
                    {
                      key: "7-assurance",
                      label: "Assurance",
                      onClick: () => navigate("/hr?tab=assurance"),
                    },
                  ]
                : []),
              {
                key: "7-prets",
                label: "Prêts",
                onClick: () => navigate("/hr?tab=prets"),
              },
              ...(canAccessModule(user, "payroll")
                ? [
                    {
                      key: "7-payroll",
                      label: "Paie",
                      onClick: () => navigate("/hr?tab=payroll"),
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(user && canAccessModule(user, "marketing")
      ? [
          {
            key: "8",
            icon: <RiseOutlined />,
            label: "Marketing",
            children: [
              {
                key: "8-toutes",
                label: "Toutes",
                onClick: () => navigate("/marketing?tab=toutes"),
              },
              {
                key: "8-brouillon",
                label: "Brouillon",
                onClick: () => navigate("/marketing?tab=brouillon"),
              },
              {
                key: "8-planifiee",
                label: "Planifiée",
                onClick: () => navigate("/marketing?tab=planifiee"),
              },
              {
                key: "8-en-cours",
                label: "En cours",
                onClick: () => navigate("/marketing?tab=en-cours"),
              },
              {
                key: "8-terminee",
                label: "Terminée",
                onClick: () => navigate("/marketing?tab=terminee"),
              },
              {
                key: "8-annulee",
                label: "Annulée",
                onClick: () => navigate("/marketing?tab=annulee"),
              },
            ],
          },
        ]
      : []),
  ];

  // Une entree depliee ne montre ou l'on se trouve que si la surbrillance
  // porte sur le volet, non sur le module. Le repli sur le premier enfant
  // reproduit celui du hook d'onglets : meme URL, meme volet designe.
  const getSelectedKey = () => {
    const racine = getModuleKey();
    const parent = menuItems.find((item) => item && item.key === racine);
    if (!parent || !parent.children || parent.children.length === 0) {
      return racine;
    }
    const onglet = new URLSearchParams(location.search).get("tab");
    const demande = parent.children.find(
      (enfant) => enfant.key === `${racine}-${onglet}`,
    );
    return (demande || parent.children[0]).key;
  };

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
            theme={isDark ? "dark" : "light"}
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            // Le module ouvert est deplie au chargement : arriver par un lien
            // direct sur un volet doit montrer ou l'on se trouve. Ant Design
            // gere ensuite les replis au gre des clics.
            defaultOpenKeys={[getModuleKey()]}
            items={menuItems}
            className="dashboard-menu"
          />
        </div>
        <div className="sidebar-footer">
          <Menu
            mode="inline"
            className="dashboard-menu"
            items={[
              // /settings est reserve au super admin : afficher l'entree aux
              // autres roles produit un clic qui rebondit vers le tableau de
              // bord, sans explication.
              ...(user && canAccessModule(user, "users.permissions")
                ? [
                    {
                      key: "params",
                      icon: <SettingOutlined />,
                      label: "Paramètres",
                      onClick: () => navigate("/settings"),
                    },
                  ]
                : []),
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
            <ThemeToggle />
            <NotificationBell />
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
