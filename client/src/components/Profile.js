import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Form, Input, Button, Card, message, Spin, Avatar, Dropdown, Tag } from 'antd';
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
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { getMe, updateProfile, logout } from '../utils/api';
import './Profile.css';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;

const ROLES = {
  super_admin: { label: 'Super Admin', color: 'red' },
  administrateur: { label: 'Administrateur', color: 'orange' },
  manager: { label: 'Manager', color: 'blue' },
  commercial: { label: 'Commercial', color: 'green' },
  comptable: { label: 'Comptable', color: 'purple' },
  employe: { label: 'Employé', color: 'default' },
};

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        form.setFieldsValue({
          name: userData.name,
          email: userData.email,
        });
      } catch (error) {
        message.error('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [form]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const updateData = {
        name: values.name,
        email: values.email,
      };

      // Only include password if it's being changed
      if (values.newPassword) {
        updateData.currentPassword = values.currentPassword;
        updateData.newPassword = values.newPassword;
      }

      const updatedUser = await updateProfile(updateData);
      setUser(updatedUser);
      message.success('Profil mis à jour avec succès');
      
      // Clear password fields
      form.setFieldsValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      message.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSubmitting(false);
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
      onClick: () => navigate('/dashboard'),
    },
    // Show user management for super admin, administrateur, and manager
    ...(user && ['super_admin', 'administrateur', 'manager'].includes(user.role) ? [{
      key: '9',
      icon: <TeamOutlined />,
      label: 'Utilisateurs',
      onClick: () => navigate('/users'),
    }] : []),
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

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

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
          selectedKeys={[]}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {user && <span className="user-name">{user.name}</span>}
                  {user?.role && (
                    <Tag color={ROLES[user.role]?.color || 'default'} style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}>
                      {ROLES[user.role]?.label || user.role}
                    </Tag>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="dashboard-content">
          <div className="profile-container">
            <div className="profile-header">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/dashboard')}
                className="back-button"
              >
                Retour au tableau de bord
              </Button>
              <h2>Mon Profil</h2>
              <p>Gérez vos informations personnelles</p>
            </div>

            <Card className="profile-card">
              <div className="profile-avatar-section">
                <Avatar size={80} icon={<UserOutlined />} className="profile-avatar-large" />
                <div className="profile-info">
                  <h3>{user?.name}</h3>
                  <p>{user?.email}</p>
                  {user?.role && (
                    <Tag color={ROLES[user.role]?.color || 'default'} style={{ marginTop: '8px' }}>
                      {ROLES[user.role]?.label || user.role}
                    </Tag>
                  )}
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
                className="profile-form"
              >
                <h4 className="form-section-title">Informations personnelles</h4>
                
                <Form.Item
                  name="name"
                  label="Nom complet"
                  rules={[{ required: true, message: 'Le nom est requis' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Votre nom" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'L\'email est requis' },
                    { type: 'email', message: 'Email invalide' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="votre@email.com" />
                </Form.Item>

                <h4 className="form-section-title">Changer le mot de passe</h4>
                <p className="form-section-subtitle">Laissez vide si vous ne souhaitez pas changer votre mot de passe</p>

                <Form.Item
                  name="currentPassword"
                  label="Mot de passe actuel"
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="Nouveau mot de passe"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (value && value.length < 6) {
                          return Promise.reject(new Error('Le mot de passe doit contenir au moins 6 caractères'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirmer le nouveau mot de passe"
                  dependencies={['newPassword']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue('newPassword') && !value) {
                          return Promise.reject(new Error('Veuillez confirmer votre nouveau mot de passe'));
                        }
                        if (value && getFieldValue('newPassword') !== value) {
                          return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    block
                    className="profile-submit-btn"
                  >
                    Enregistrer les modifications
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Profile;
