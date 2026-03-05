import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox, Alert, message, Space } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { verifyTwoFactorLogin, completeTwoFactorLogin } from "../utils/api";
import "./Auth.css";

function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if 2FA is required
        if (data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setUserId(data.data.userId);
          setUserEmail(data.data.email);
          message.info("Veuillez entrer votre code 2FA");
        } else {
          // Normal login - no 2FA
          const token = data.data?.token || data.token;

          if (token) {
            localStorage.setItem("token", token);
            message.success(data.message || "Connexion réussie!");
            navigate("/dashboard");
          } else {
            setError("Token non reçu du serveur");
          }
        }
      } else {
        setError(data.message || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FA = async (values) => {
    setLoading(true);
    setError("");

    try {
      // Normalize the token: remove spaces and convert to uppercase
      let normalizedToken = values.token.replace(/\s/g, "").toUpperCase();

      // If token is longer than 6 chars, it's likely a backup code
      // Remove any non-hex characters (only keep 0-9, A-F)
      if (normalizedToken.length > 6) {
        normalizedToken = normalizedToken.replace(/[^0-9A-F]/g, "");
        console.log("Cleaned backup code:", normalizedToken);
      }

      // First verify the 2FA token
      const verifyResult = await verifyTwoFactorLogin(userId, normalizedToken);

      // Show warning if backup code was used (contains info about remaining codes)
      if (verifyResult.warning) {
        message.warning({
          content: verifyResult.warning,
          duration: 5,
        });
      }

      // If verified, complete the login to get the JWT token
      const loginData = await completeTwoFactorLogin(userId);
      const token = loginData.token;

      if (token) {
        localStorage.setItem("token", token);
        message.success("Connexion réussie!");
        navigate("/dashboard");
      } else {
        setError("Token non reçu du serveur");
      }
    } catch (err) {
      setError(err.message || "Code 2FA invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setUserId(null);
    setUserEmail("");
    setError("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">N</div>
            <span className="logo-text">Nexia Digital CRM</span>
          </div>
          <h2>{requiresTwoFactor ? "Vérification 2FA" : "Connexion"}</h2>
          <p className="auth-subtitle">
            {requiresTwoFactor
              ? `Code de vérification pour ${userEmail}`
              : "Bienvenue dans votre CRM Nexia Digital"}
          </p>
        </div>

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 24 }}
          />
        )}

        {!requiresTwoFactor ? (
          // Login Form
          <Form
            name="signin"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Veuillez entrer votre email" },
                { type: "email", message: "Email invalide" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="votre@email.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                {
                  required: true,
                  message: "Veuillez entrer votre mot de passe",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item>
              <div className="form-footer">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Se souvenir de moi</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" className="link-text">
                  Mot de passe oublié ?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="btn-submit"
              >
                Se connecter
              </Button>
            </Form.Item>
          </Form>
        ) : (
          // 2FA Verification Form
          <Form
            name="verify2fa"
            onFinish={onVerify2FA}
            size="large"
            layout="vertical"
          >
            <Alert
              title="Authentification à deux facteurs"
              description={
                <div>
                  <p>
                    Entrez le code à 6 chiffres de votre application
                    d'authentification.
                  </p>
                  <p style={{ marginTop: 8, fontStyle: "italic" }}>
                    <strong>Perdu votre téléphone?</strong> Vous pouvez utiliser
                    un de vos codes de secours (8 caractères).
                  </p>
                </div>
              }
              type="info"
              showIcon
              icon={<SafetyOutlined />}
              style={{ marginBottom: 24 }}
            />

            <Form.Item
              name="token"
              label="Code de vérification"
              rules={[{ required: true, message: "Code requis" }]}
              extra="6 chiffres d'authentificateur OU 8 caractères de code de secours"
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="123456 ou A1B2C3D4"
                maxLength={12}
                size="large"
                style={{
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "4px",
                }}
              />
            </Form.Item>

            <Form.Item>
              <Space
                orientation="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="btn-submit"
                >
                  Vérifier
                </Button>
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToLogin}
                  block
                >
                  Retour à la connexion
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        <div className="auth-footer">
          <p>
            Vous n'avez pas de compte ?{" "}
            <Link to="/signup" className="link-primary">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
