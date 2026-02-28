import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, message, Result, Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { verifyResetToken, resetPassword } from '../utils/api';
import './Auth.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      try {
        const data = await verifyResetToken(token);
        setTokenValid(true);
        setUserEmail(data.data.email);
      } catch (err) {
        setError(err.message || "Token invalide ou expiré");
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      checkToken();
    } else {
      setError("Token manquant");
      setVerifying(false);
    }
  }, [token]);

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const data = await resetPassword(token, values.newPassword);
      message.success(data.message || 'Mot de passe réinitialisé!');
      setSuccess(true);
      
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20, color: '#666' }}>Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <Result
            status="error"
            title="Lien invalide ou expiré"
            subTitle={
              <div>
                <p>Ce lien de réinitialisation n'est plus valide. Les raisons possibles:</p>
                <ul style={{ textAlign: 'left', marginTop: 16 }}>
                  <li>Le lien a expiré (valide pendant 1 heure)</li>
                  <li>Le lien a déjà été utilisé</li>
                  <li>Le lien est incorrect</li>
                </ul>
              </div>
            }
            extra={[
              <Link to="/forgot-password" key="forgot">
                <Button type="primary" size="large">
                  Demander un nouveau lien
                </Button>
              </Link>,
              <Link to="/signin" key="signin">
                <Button size="large">
                  Retour à la connexion
                </Button>
              </Link>,
            ]}
          />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            status="success"
            title="Mot de passe réinitialisé!"
            subTitle={
              <div>
                <p>Votre mot de passe a été réinitialisé avec succès.</p>
                <p style={{ marginTop: 16 }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                <p style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
                  Redirection automatique dans 3 secondes...
                </p>
              </div>
            }
            extra={[
              <Link to="/signin" key="signin">
                <Button type="primary" size="large">
                  Se connecter maintenant
                </Button>
              </Link>,
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
          <h2>Nouveau mot de passe</h2>
          <p className="auth-subtitle">
            {userEmail ? `Réinitialisation pour ${userEmail}` : 'Créez votre nouveau mot de passe'}
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
          title="Conseils pour un mot de passe sécurisé"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Au moins 6 caractères</li>
              <li>Mélangez lettres majuscules et minuscules</li>
              <li>Incluez des chiffres et caractères spéciaux</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          name="reset-password"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: "Veuillez entrer un mot de passe" },
              { min: 6, message: "Le mot de passe doit contenir au moins 6 caractères" },
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nouveau mot de passe"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmer le mot de passe"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: "Veuillez confirmer votre mot de passe" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirmer le mot de passe"
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
              Réinitialiser le mot de passe
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Link to="/signin" className="link-secondary">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
