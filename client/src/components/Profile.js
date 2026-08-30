import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Form,
  Input,
  Button,
  Card,
  message,
  Spin,
  Avatar,
  Upload,
  Dropdown,
  Tag,
  Modal,
  Alert,
  Space,
  Typography,
  Divider,
} from "antd";
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
  ArrowLeftOutlined,
  SafetyOutlined,
  QrcodeOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  UploadOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../theme/ThemeContext";
import {
  getMe,
  updateProfile,
  logout,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
} from "../utils/api";
import {
  BRAND_LOGO_LIGHT,
} from "../utils/brandAssets";
import "./Profile.css";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;
const { Text, Paragraph } = Typography;

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
  directeur_controle_gestion: {
    label: "Directeur du contrôle de gestion",
    color: "geekblue",
  },
  controleur_gestion: { label: "Contrôleur de gestion", color: "blue" },
  gestionnaire_achat: { label: "Gestionnaire achat", color: "geekblue" },
  employe: { label: "Employé", color: "default" },
};

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const { isDark } = useTheme();
  const [profilePicture, setProfilePicture] = useState("");

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [setup2FAModal, setSetup2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyForm] = Form.useForm();
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        setProfilePicture(userData.profilePicture || "");
        form.setFieldsValue({
          name: userData.name,
          email: userData.email,
        });

        // Load 2FA status
        await refreshTwoFactorStatus();
      } catch (error) {
        message.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [form]);

  // Separate function to refresh 2FA status
  const refreshTwoFactorStatus = async () => {
    try {
      const statusData = await getTwoFactorStatus();
      setTwoFactorEnabled(statusData.twoFactorEnabled);
      setBackupCodesRemaining(statusData.backupCodesRemaining);
      console.log("[Profile] 2FA Status refreshed:", statusData);
    } catch (error) {
      console.error("[Profile] Failed to refresh 2FA status:", error);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const updateData = {
        name: values.name,
        email: values.email,
        profilePicture,
      };

      // Only include password if it's being changed
      if (values.newPassword) {
        updateData.currentPassword = values.currentPassword;
        updateData.newPassword = values.newPassword;
      }

      const updatedUser = await updateProfile(updateData);
      setUser(updatedUser);
      setProfilePicture(updatedUser.profilePicture || "");
      message.success("Profil mis à jour avec succès");

      // Clear password fields
      form.setFieldsValue({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setSubmitting(false);
    }
  };

  // 2FA Handler Functions
  const handleEnable2FA = async () => {
    try {
      const data = await setupTwoFactor();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetup2FAModal(true);
    } catch (error) {
      message.error(error.message || "Erreur lors de la configuration de 2FA");
    }
  };

  const handleVerify2FA = async (values) => {
    try {
      const result = await verifyAndEnableTwoFactor(values.token);
      message.success(result.message || "2FA activé avec succès");
      setTwoFactorEnabled(true);
      setBackupCodes(result.data.backupCodes);
      setShowBackupCodes(true);
      setSetup2FAModal(false);
      verifyForm.resetFields();

      // Refresh status
      await refreshTwoFactorStatus();
    } catch (error) {
      message.error(error.message || "Code invalide");
    }
  };

  const handleDisable2FA = () => {
    Modal.confirm({
      title: "Désactiver l'authentification à deux facteurs",
      content: (
        <Form
          id="disable2faForm"
          onFinish={async (values) => {
            try {
              await disableTwoFactor(values.password);
              message.success("2FA désactivé avec succès");
              setTwoFactorEnabled(false);
              setBackupCodesRemaining(0);
              Modal.destroyAll();
            } catch (error) {
              message.error(error.message || "Erreur lors de la désactivation");
            }
          }}
        >
          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: "Mot de passe requis" }]}
          >
            <Input.Password placeholder="Entrez votre mot de passe" />
          </Form.Item>
        </Form>
      ),
      okText: "Désactiver",
      cancelText: "Annuler",
      okButtonProps: {
        danger: true,
        htmlType: "submit",
        form: "disable2faForm",
      },
      onOk: () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(), 100);
        });
      },
    });
  };

  const handleRegenerateBackupCodes = () => {
    Modal.confirm({
      title: "Régénérer les codes de secours",
      icon: <KeyOutlined style={{ color: "var(--accent-yellow)" }} />,
      content: (
        <>
          <Alert
            title="⚠️ Attention"
            description="Ceci va remplacer TOUS vos anciens codes de secours (utilisés ou non) par 6 nouveaux codes. Les anciens codes ne fonctionneront plus."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form
            id="regenerateCodesForm"
            onFinish={async (values) => {
              try {
                const result = await regenerateBackupCodes(values.password);
                setBackupCodes(result.data.backupCodes);
                setShowBackupCodes(true);
                Modal.destroyAll();

                // Refresh status
                await refreshTwoFactorStatus();
                message.success("6 nouveaux codes de secours générés!");
              } catch (error) {
                message.error(
                  error.message || "Erreur lors de la régénération",
                );
              }
            }}
          >
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: "Mot de passe requis" }]}
            >
              <Input.Password placeholder="Entrez votre mot de passe" />
            </Form.Item>
          </Form>
        </>
      ),
      okText: "Régénérer",
      cancelText: "Annuler",
      okButtonProps: { htmlType: "submit", form: "regenerateCodesForm" },
      onOk: () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(), 100);
        });
      },
    });
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join("\\n");
    navigator.clipboard.writeText(codesText);
    message.success("Codes copiés dans le presse-papier");
  };

  const compressImageToBase64 = (file, maxSize = 512, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const output = canvas.toDataURL("image/jpeg", quality);
          resolve(output);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleBeforeUploadProfile = async (file) => {
    const isImage = file.type?.startsWith("image/");
    if (!isImage) {
      message.error("Veuillez choisir une image");
      return Upload.LIST_IGNORE;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image trop volumineuse (max 2MB)");
      return Upload.LIST_IGNORE;
    }

    try {
      const base64 = await compressImageToBase64(file);
      setProfilePicture(base64);
      message.success("Photo mise à jour. Enregistrez pour confirmer.");
    } catch (error) {
      message.error("Erreur lors de la lecture de l'image");
    }

    return false;
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

  const menuItems = [
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
      onClick: () => navigate("/dashboard"),
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
      key: "2",
      icon: <UserOutlined />,
      label: "Clients",
    },
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
          <img
            src={BRAND_LOGO_LIGHT}
            alt="Nexia Digital"
            className="logo-corner-img"
          />
        </div>
        <Menu
          theme={isDark ? "dark" : "light"}
          mode="inline"
          selectedKeys={[]}
          items={menuItems}
          className="dashboard-menu"
        />
        <div className="sidebar-footer">
          <Menu
            mode="inline"
            className="dashboard-menu"
            items={[
              {
                key: "params",
                icon: <SettingOutlined />,
                label: "Paramètres",
              },
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Déconnexion",
                onClick: handleLogout,
                danger: true,
              },
            ]}
          />
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
                <Avatar src={profilePicture || user?.profilePicture} icon={<UserOutlined />} className="user-avatar" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  {user && <span className="user-name">{user.name}</span>}
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

        <Content className="dashboard-content">
          <div className="profile-container">
            <div className="profile-header">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/dashboard")}
                className="back-button"
              >
                Retour au tableau de bord
              </Button>
              <h2>Mon Profil</h2>
              <p>Gérez vos informations personnelles</p>
            </div>

            <Card className="profile-card">
              <div className="profile-avatar-section">
                <Avatar
                  size={80}
                  src={profilePicture || user?.profilePicture}
                  icon={<UserOutlined />}
                  className="profile-avatar-large"
                />
                <div className="profile-info">
                  <h3>{user?.name}</h3>
                  <p>{user?.email}</p>
                  {user?.role && (
                    <Tag
                      color={ROLES[user.role]?.color || "default"}
                      style={{ marginTop: "8px" }}
                    >
                      {ROLES[user.role]?.label || user.role}
                    </Tag>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Upload
                      showUploadList={false}
                      beforeUpload={handleBeforeUploadProfile}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} size="small">
                        Changer la photo
                      </Button>
                    </Upload>
                  </div>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
                className="profile-form"
              >
                <h4 className="form-section-title">
                  Informations personnelles
                </h4>

                <Form.Item
                  name="name"
                  label="Nom complet"
                  rules={[{ required: true, message: "Le nom est requis" }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Votre nom" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "L'email est requis" },
                    { type: "email", message: "Email invalide" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="votre@email.com"
                  />
                </Form.Item>

                <h4 className="form-section-title">Changer le mot de passe</h4>
                <p className="form-section-subtitle">
                  Laissez vide si vous ne souhaitez pas changer votre mot de
                  passe
                </p>

                <Form.Item name="currentPassword" label="Mot de passe actuel">
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                  />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="Nouveau mot de passe"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (value && value.length < 6) {
                          return Promise.reject(
                            new Error(
                              "Le mot de passe doit contenir au moins 6 caractères",
                            ),
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirmer le nouveau mot de passe"
                  dependencies={["newPassword"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue("newPassword") && !value) {
                          return Promise.reject(
                            new Error(
                              "Veuillez confirmer votre nouveau mot de passe",
                            ),
                          );
                        }
                        if (value && getFieldValue("newPassword") !== value) {
                          return Promise.reject(
                            new Error("Les mots de passe ne correspondent pas"),
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                  />
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

            {/* Apparence */}
            <Card
              title={
                <Space>
                  <BgColorsOutlined />
                  <span>Apparence</span>
                </Space>
              }
              className="profile-card"
              style={{ marginTop: 24 }}
            >
              <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Choisissez le theme de l'interface. « Auto » suit le reglage de
                votre systeme d'exploitation.
              </Text>
              <ThemeToggle variant="segmented" />
            </Card>

            {/* 2FA Card */}
            <Card
              title={
                <Space>
                  <SafetyOutlined />
                  <span>Authentification à deux facteurs (2FA)</span>
                </Space>
              }
              className="profile-card"
              style={{ marginTop: 24 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text strong>Statut: </Text>
                    {twoFactorEnabled ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Activé
                      </Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="default">
                        Désactivé
                      </Tag>
                    )}
                  </div>

                  {twoFactorEnabled && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text strong>Codes de secours restants: </Text>
                      <Tag
                        color={backupCodesRemaining <= 2 ? "red" : "blue"}
                        style={{ fontSize: "14px" }}
                      >
                        {backupCodesRemaining}/6
                      </Tag>
                      <Button
                        size="small"
                        type="text"
                        icon={<SafetyOutlined />}
                        onClick={refreshTwoFactorStatus}
                        title="Actualiser le statut"
                      />
                    </div>
                  )}

                  {twoFactorEnabled && backupCodesRemaining <= 2 && (
                    <Alert
                      title="Attention: Codes de secours faibles!"
                      description="Il vous reste peu de codes de secours. Pensez à les régénérer."
                      type="warning"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}

                  {twoFactorEnabled && (
                    <Alert
                      title="À propos des codes de secours"
                      description={
                        <div>
                          <p>
                            • Vous avez reçu 6 codes lors de l'activation de 2FA
                          </p>
                          <p>
                            • Chaque code utilisé est automatiquement supprimé
                          </p>
                          <p>
                            • Vous ne pouvez voir les codes que lors de leur
                            génération
                          </p>
                          <p>
                            • La régénération remplace TOUS les anciens codes
                            par 6 nouveaux
                          </p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}

                  <Paragraph type="secondary">
                    L'authentification à deux facteurs ajoute une couche de
                    sécurité supplémentaire à votre compte en exigeant un code
                    de votre application d'authentification lors de la
                    connexion.
                  </Paragraph>

                  <Space wrap>
                    {!twoFactorEnabled ? (
                      <Button
                        type="primary"
                        icon={<SafetyOutlined />}
                        onClick={handleEnable2FA}
                      >
                        Activer 2FA
                      </Button>
                    ) : (
                      <>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={handleDisable2FA}
                        >
                          Désactiver 2FA
                        </Button>
                        <Button
                          icon={<KeyOutlined />}
                          onClick={handleRegenerateBackupCodes}
                        >
                          Régénérer codes de secours
                        </Button>
                      </>
                    )}
                  </Space>
                </Space>
              </div>
            </Card>
          </div>
        </Content>
      </Layout>

      {/* Setup 2FA Modal */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>Configurer l'authentification à deux facteurs</span>
          </Space>
        }
        open={setup2FAModal}
        onCancel={() => {
          setSetup2FAModal(false);
          verifyForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            title="Étape 1: Scanner le code QR"
            description="Utilisez une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator pour scanner ce code QR."
            type="info"
            showIcon
          />

          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {qrCode && (
              <img src={qrCode} alt="QR Code" style={{ maxWidth: "300px" }} />
            )}
          </div>

          <div>
            <Text strong>Ou entrez manuellement cette clé:</Text>
            <div
              style={{
                background: "var(--surface-sunken)",
                padding: "12px",
                borderRadius: "4px",
                marginTop: "8px",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {secret}
            </div>
          </div>

          <Divider />

          <Alert
            title="Étape 2: Vérifier le code"
            description="Entrez le code à 6 chiffres généré par votre application d'authentification."
            type="info"
            showIcon
          />

          <Form form={verifyForm} onFinish={handleVerify2FA} layout="vertical">
            <Form.Item
              name="token"
              label="Code de vérification"
              rules={[
                { required: true, message: "Code requis" },
                { len: 6, message: "Le code doit contenir 6 chiffres" },
              ]}
            >
              <Input
                placeholder="123456"
                maxLength={6}
                size="large"
                style={{
                  fontSize: "24px",
                  textAlign: "center",
                  letterSpacing: "8px",
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Vérifier et activer 2FA
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            <span>Vos nouveaux codes de secours</span>
          </Space>
        }
        open={showBackupCodes}
        onCancel={() => setShowBackupCodes(false)}
        footer={[
          <Button key="copy" onClick={copyBackupCodes}>
            Copier tous les codes
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => setShowBackupCodes(false)}
          >
            J'ai sauvegardé les codes
          </Button>,
        ]}
        width={600}
        closable={false}
        mask={{ closable: false }}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            title="Important: Sauvegardez ces codes en lieu sûr"
            description={
              <div>
                <p>
                  Chaque code ne peut être utilisé qu'une seule fois. Vous
                  pouvez les utiliser pour vous connecter si vous perdez l'accès
                  à votre application d'authentification.
                </p>
                <p
                    title="⚠️ Attention"
                >
                  Format: 8 caractères hexadécimaux (0-9, A-F) - Exemple:
                  A1B2C3D4
                </p>
                <p
                  style={{ marginTop: 8, fontWeight: "bold", color: "var(--accent-red)" }}
                >
                  ⚠️ Ces codes ne seront affichés qu'une seule fois! Une fois
                  fermé, vous ne pourrez plus les voir.
                </p>
              </div>
            }
            type="warning"
            showIcon
          />

          <div
            style={{
              background: "var(--surface-sunken)",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            {backupCodes.map((code, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "white",
                  marginBottom: index < backupCodes.length - 1 ? "8px" : "0",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "18px",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                  }}
                >
                  {code}
                </span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    message.success(`Code ${index + 1} copié!`);
                  }}
                >
                  Copier
                </Button>
              </div>
            ))}
          </div>
        </Space>
      </Modal>
    </Layout>
  );
}

export default Profile;
