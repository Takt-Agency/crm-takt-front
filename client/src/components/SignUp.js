import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox, Alert, message, Select } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import "./Auth.css";

const { Option } = Select;

function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role || "employe",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Token is in data.data.token based on backend response
        const token = data.data?.token || data.token;

        if (token) {
          localStorage.setItem("token", token);
          message.success(data.message || "Compte créé avec succès!");
          navigate("/dashboard");
        } else {
          setError("Token non reçu du serveur");
        }
      } else {
        setError(data.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
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
          <h2>Créer un compte</h2>
          <p className="auth-subtitle">Rejoignez Nexia Digital CRM</p>
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

        <Form name="signup" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="name"
            label="Nom complet"
            rules={[{ required: true, message: "Veuillez entrer votre nom" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Jean Dupont" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Veuillez entrer votre email" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="votre@email.com" />
          </Form.Item>

          <Form.Item name="role" label="Rôle" initialValue="employe">
            <Select
              prefix={<TeamOutlined />}
              placeholder="Sélectionnez votre rôle"
            >
              <Option value="employe">Employé</Option>
              <Option value="commercial">Commercial</Option>
              <Option value="comptable">Comptable</Option>
              <Option value="manager">Manager</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[
              { required: true, message: "Veuillez entrer un mot de passe" },
              {
                min: 6,
                message: "Le mot de passe doit contenir au moins 6 caractères",
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmer le mot de passe"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "Veuillez confirmer votre mot de passe",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Les mots de passe ne correspondent pas"),
                  );
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Vous devez accepter les conditions"),
                      ),
              },
            ]}
          >
            <Checkbox>
              J'accepte les <a href="#terms">conditions d'utilisation</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="btn-submit"
            >
              Créer mon compte
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <p>
            Vous avez déjà un compte ?{" "}
            <Link to="/signin" className="link-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
