import React from "react";
import { Card, Row, Col } from "antd";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h2 className="page-title">Tableau de bord</h2>
          <p className="page-subtitle">
            Bienvenue dans votre CRM Nexia Digital
          </p>
        </div>
      </div>

      {/* TODO: Implement dynamic KPI cards and charts */}
      <Row gutter={[24, 24]} style={{ marginTop: "24px" }}>
        <Col span={24}>
          <Card>
            <p
              style={{ textAlign: "center", color: "#999", padding: "60px 0" }}
            >
              Les données du tableau de bord seront affichées ici
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
