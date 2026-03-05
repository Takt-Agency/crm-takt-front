import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Button, Alert, message, Result } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { forgotPassword } from "../utils/api";
import "./Auth.css";

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const data = await forgotPassword(values.email);
      setEmail(values.email);
      setSuccess(true);
      message.success(data.message || "Email envoyé!");
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <Result
            status="success"
            title="Email envoyé!"
            subTitle={
              <div>
                <p>
                  Si un compte existe avec l'adresse <strong>{email}</strong>,
                  vous recevrez un email avec les instructions pour
                  réinitialiser votre mot de passe.
                </p>
                <p style={{ marginTop: 16 }}>
                  Le lien est valide pendant <strong>1 heure</strong>.
                </p>
                <Alert
                  title="Vérifiez votre boîte email"
                  description="N'oubliez pas de vérifier votre dossier spam si vous ne recevez pas l'email."
                  type="info"
                  showIcon
                  style={{ marginTop: 16, textAlign: "left" }}
                />
              </div>
            }
            extra={[
              <Link to="/signin" key="signin">
                <Button type="primary" size="large">
                  Retour à la connexion
                </Button>
              </Link>,
              <Button
                key="resend"
                type="link"
                onClick={() => setSuccess(false)}
              >
                Renvoyer l'email
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">N</div>
            <span className="logo-text">Nexia Digital CRM</span>
          </div>
          <h2>Mot de passe oublié</h2>
          <p className="auth-subtitle">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
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

        <Alert
          title="Comment ça marche?"
          description="Nous vous enverrons un email avec un lien sécurisé pour créer un nouveau mot de passe. Ce lien sera valide pendant 1 heure."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          name="forgot-password"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Adresse email"
            rules={[
              { required: true, message: "Veuillez entrer votre email" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="votre@email.com"
              autoFocus
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="btn-submit"
            >
              Envoyer le lien de réinitialisation
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Link to="/signin" className="link-secondary">
            <ArrowLeftOutlined /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
