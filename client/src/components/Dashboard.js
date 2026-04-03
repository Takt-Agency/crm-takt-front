import React from "react";
import { Card, Row, Col, Tag, Button } from "antd";
import {
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";

function Dashboard() {
  const kpis = [
    {
      label: "Trafic Organique",
      value: "+142%",
      hint: "30 derniers jours",
      icon: <RiseOutlined />,
    },
    {
      label: "Nouveaux Prospects",
      value: "38",
      hint: "Pipeline actif",
      icon: <TeamOutlined />,
    },
    {
      label: "Taches Terminees",
      value: "91%",
      hint: "Semaine en cours",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Revenus Projetes",
      value: "84K EUR",
      hint: "Mois en cours",
      icon: <WalletOutlined />,
    },
  ];

  const techPills = [
    "React",
    "Node.js",
    "Meta Ads",
    "Google Ads",
    "LinkedIn",
    "Figma",
  ];

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <p className="section-kicker">NOTRE VISION</p>
          <h2 className="page-title">
            Transformons Votre <span>Business</span>
          </h2>
          <p className="page-subtitle">
            Bienvenue dans votre CRM Nexia Digital. Suivez votre croissance,
            vos leads et vos performances en temps reel.
          </p>
        </div>
        <Button type="primary" className="export-btn">
          Voir le portfolio <ArrowRightOutlined />
        </Button>
      </div>

      <div className="tech-strip">
        {techPills.map((tech) => (
          <Tag key={tech} className="tech-pill">
            {tech}
          </Tag>
        ))}
      </div>

      <Row gutter={[20, 20]} style={{ marginTop: "20px" }}>
        {kpis.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.label}>
            <Card className="kpi-card hero-kpi-card">
              <div className="kpi-icon">{item.icon}</div>
              <div className="kpi-content">
                <p className="kpi-label">{item.label}</p>
                <h3 className="kpi-value">{item.value}</h3>
                <span className="kpi-change positive">{item.hint}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: "8px" }}>
        <Col span={24}>
          <Card className="highlight-card">
            <h3>Des projets qui parlent d'eux-memes</h3>
            <p>
              Le module portfolio et les tableaux avances seront affiches ici.
              Cette zone est prete pour connecter vos donnees reelles API.
            </p>
            <Button className="ghost-cta" type="default">
              Explorer les modules <ArrowRightOutlined />
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
