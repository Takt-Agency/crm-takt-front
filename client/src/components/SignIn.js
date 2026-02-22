import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Auth.css';

function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">N</div>
            <span className="logo-text">Nexia Digital CRM</span>
          </div>
          <h2>Connexion</h2>
          <p className="auth-subtitle">Bienvenue dans votre CRM Nexia Digital</p>
        </div>

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 24 }}
          />
        )}

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
              { required: true, message: 'Veuillez entrer votre email' },
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="votre@email.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: 'Veuillez entrer votre mot de passe' }]}
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
              <a href="#forgot" className="link-text">Mot de passe oublié ?</a>
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

        <div className="auth-footer">
          <p>
            Vous n'avez pas de compte ?{' '}
            <Link to="/signup" className="link-primary">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
