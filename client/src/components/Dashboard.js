import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Card, Row, Col, Button, Avatar, Dropdown, message } from 'antd';
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
  ExportOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { getMe, logout } from '../utils/api';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't show error message, just use default user state
      // The user can still use the dashboard
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'logout') {
      handleLogout();
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mon profil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Paramètres',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Déconnexion',
      danger: true,
    },
  ];

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Tableau de bord',
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: 'Clients',
    },
    {
      key: '3',
      icon: <TeamOutlined />,
      label: 'Prospects',
    },
    {
      key: '4',
      icon: <CheckSquareOutlined />,
      label: 'Tâches',
    },
    {
      key: '5',
      icon: <FileTextOutlined />,
      label: 'Devis & Facturation',
    },
    {
      key: '6',
      icon: <EuroOutlined />,
      label: 'Finances',
    },
    {
      key: '7',
      icon: <UserSwitchOutlined />,
      label: 'RH',
    },
    {
      key: '8',
      icon: <RiseOutlined />,
      label: 'Marketing',
    },
  ];

  return (
    <Layout className="dashboard-layout">
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
          defaultSelectedKeys={['1']}
          items={menuItems}
          className="dashboard-menu"
        />
        <div className="sidebar-footer">
          <Menu mode="inline" className="dashboard-menu">
            <Menu.Item key="params" icon={<SettingOutlined />}>
              Paramètres
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
              Déconnexion
            </Menu.Item>
          </Menu>
        </div>
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <h1 className="header-title">Nexia Digital CRM</h1>
          <div className="header-actions">
            <Button type="text" icon={<BellOutlined />} className="header-icon-btn" />
            <Dropdown 
              menu={{ items: userMenuItems, onClick: handleMenuClick }} 
              placement="bottomRight"
            >
              <div className="user-info-wrapper">
                <Avatar icon={<UserOutlined />} className="user-avatar" />
                <span className="user-name">{user?.name || 'Utilisateur'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="dashboard-content">
          <div className="content-header">
            <div>
              <h2 className="page-title">Tableau de bord</h2>
              <p className="page-subtitle">Bienvenue dans votre CRM Nexia Digital</p>
            </div>
            <Button type="primary" icon={<ExportOutlined />} size="large" className="export-btn">
              Exporter rapport
            </Button>
          </div>

          {/* KPI Cards */}
          <Row gutter={[24, 24]} className="kpi-section">
            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card card-blue">
                <div className="kpi-icon">€</div>
                <div className="kpi-content">
                  <p className="kpi-label">Chiffre d'affaires</p>
                  <h3 className="kpi-value">€67,000</h3>
                  <span className="kpi-change positive">
                    <ArrowUpOutlined /> +12.5%
                  </span>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card">
                <div className="kpi-icon">
                  <UserOutlined />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Clients actifs</p>
                  <h3 className="kpi-value">24</h3>
                  <span className="kpi-change positive">
                    <ArrowUpOutlined /> + 3
                  </span>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card">
                <div className="kpi-icon">
                  <TeamOutlined />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Prospects en cours</p>
                  <h3 className="kpi-value">30</h3>
                  <span className="kpi-change positive">
                    <ArrowUpOutlined /> + 8
                  </span>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="kpi-card">
                <div className="kpi-icon">
                  <RiseOutlined />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Taux de conversion</p>
                  <h3 className="kpi-value">18.5%</h3>
                  <span className="kpi-change positive">
                    <ArrowUpOutlined /> +2.3%
                  </span>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[24, 24]} className="charts-section">
            <Col xs={24} lg={14}>
              <Card title="Chiffre d'affaires mensuel" extra={<span className="card-subtitle">Comparaison avec les objectifs</span>} className="chart-card">
                <div className="bar-chart">
                  <div className="chart-bars">
                    <div className="bar-group">
                      <div className="bar" style={{ height: '45%' }}></div>
                      <span className="bar-label">Jan</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar" style={{ height: '55%' }}></div>
                      <span className="bar-label">Fév</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar" style={{ height: '50%' }}></div>
                      <span className="bar-label">Mar</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar" style={{ height: '60%' }}></div>
                      <span className="bar-label">Avr</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar" style={{ height: '56%' }}></div>
                      <span className="bar-label">Mai</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar" style={{ height: '70%' }}></div>
                      <span className="bar-label">Juin</span>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot blue"></span> Réalisé</span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card title="Pipeline commercial" extra={<span className="card-subtitle">Distribution des deals</span>} className="chart-card">
                <div className="donut-chart">
                  <svg viewBox="0 0 200 200" className="donut-svg">
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#1E90FF" strokeWidth="30" strokeDasharray="113 283" transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#FDB022" strokeWidth="30" strokeDasharray="70 283" strokeDashoffset="-113" transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#00BCD4" strokeWidth="30" strokeDasharray="56 283" strokeDashoffset="-183" transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#4CAF50" strokeWidth="30" strokeDasharray="44 283" strokeDashoffset="-239" transform="rotate(-90 100 100)" />
                  </svg>
                </div>
                <div className="pipeline-legend">
                  <div className="pipeline-item">
                    <span className="pipeline-dot" style={{ background: '#1E90FF' }}></span>
                    <span className="pipeline-label">Prospect</span>
                    <span className="pipeline-value">8</span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-dot" style={{ background: '#FDB022' }}></span>
                    <span className="pipeline-label">Qualification</span>
                    <span className="pipeline-value">12</span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-dot" style={{ background: '#00BCD4' }}></span>
                    <span className="pipeline-label">Proposition</span>
                    <span className="pipeline-value">6</span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-dot" style={{ background: '#4CAF50' }}></span>
                    <span className="pipeline-label">Négociation</span>
                    <span className="pipeline-value">4</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Tasks and Activities */}
          <Row gutter={[24, 24]} className="activities-section">
            <Col xs={24} lg={12}>
              <Card title="Tâches urgentes" className="tasks-card">
                <div className="task-item">
                  <div className="task-content">
                    <h4>Appel client - Acme Corp</h4>
                    <p className="task-time">Aujourd'hui à 14h00</p>
                  </div>
                </div>
                <div className="task-item">
                  <div className="task-content">
                    <h4>Finaliser devis - TechStart</h4>
                    <p className="task-time">Demain matin</p>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Actions récentes" className="activities-card">
                <div className="activity-item">
                  <div className="activity-content">
                    <h4>Facture #2024-001 envoyée</h4>
                    <p className="activity-time">Il y a 2 heures</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-content">
                    <h4>Nouveau client créé - Digital Pro</h4>
                    <p className="activity-time">Il y a 4 heures</p>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Financial Summary */}
          <Row gutter={[24, 24]} className="summary-section">
            <Col span={24}>
              <h3 className="section-title">Résumé financier</h3>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="summary-card">
                <p className="summary-label">Trésorerie actuelle</p>
                <h3 className="summary-value">€125,400</h3>
                <p className="summary-change">+€5,200 ce mois</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="summary-card">
                <p className="summary-label">Factures payées</p>
                <h3 className="summary-value">€89,500</h3>
                <p className="summary-change">87% du total</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="summary-card">
                <p className="summary-label">Factures impayées</p>
                <h3 className="summary-value">€3,200</h3>
                <p className="summary-change warning">2 factures en retard</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="summary-card">
                <p className="summary-label">Dépenses ce mois</p>
                <h3 className="summary-value">€12,800</h3>
                <p className="summary-change">-€1,200 vs mois dernier</p>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
