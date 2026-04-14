import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  message,
  Spin,
  Descriptions,
  Table,
  Space,
  Tag,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "./InvoiceDetail.css";
import { getInvoiceById, downloadInvoicePDF } from "../utils/api";

dayjs.locale("fr");

const STATUSES = {
  Brouillon: {
    label: "Brouillon",
    color: "default",
    icon: <FileTextOutlined />,
  },
  Envoyée: {
    label: "Envoyée",
    color: "processing",
    icon: <ClockCircleOutlined />,
  },
  "Accepté": { label: "Accepté", color: "success", icon: <CheckCircleOutlined /> },
  "Refusé": { label: "Refusé", color: "error", icon: <WarningOutlined /> },
  "Partiellement payée": {
    label: "Partiellement payée",
    color: "warning",
    icon: <ClockCircleOutlined />,
  },
  Payée: { label: "Payée", color: "success", icon: <CheckCircleOutlined /> },
  "En retard": {
    label: "En retard",
    color: "error",
    icon: <WarningOutlined />,
  },
  Annulée: { label: "Annulée", color: "default", icon: <FileTextOutlined /> },
};

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      message.error("Erreur lors du chargement de la facture");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePDF(id);
      message.success("PDF téléchargé avec succès");
    } catch (error) {
      message.error("Erreur lors du téléchargement du PDF");
    }
  };

  const itemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Quantité",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "right",
    },
    {
      title: "Prix unitaire",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 150,
      align: "right",
      render: (price) => `€${price.toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 150,
      align: "right",
      render: (total) => `€${total.toFixed(2)}`,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Facture introuvable</p>
        <Button onClick={() => navigate("/invoices")}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="invoice-detail-container">
      {/* Action buttons (hidden when printing) */}
      <div className="no-print" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/invoices")}
          >
            Retour
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Imprimer
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            Télécharger PDF
          </Button>
        </Space>
      </div>

      {/* Invoice content (printable) */}
      <Card className="invoice-card">
        <div className="invoice-header">
          <div className="company-info">
            <h1 className="company-name">Votre Entreprise</h1>
            <p className="company-tagline">Excellence & Innovation</p>
          </div>
          <div className="invoice-info">
            <h1 className="invoice-type">{invoice.type}</h1>
            <h2 className="invoice-number">{invoice.number}</h2>
            <Tag
              icon={(STATUSES[invoice.status] || STATUSES.Brouillon).icon}
              color={(STATUSES[invoice.status] || STATUSES.Brouillon).color}
              style={{ fontSize: 14, padding: "4px 12px" }}
            >
              {(STATUSES[invoice.status] || { label: invoice.status }).label}
            </Tag>
          </div>
        </div>

        <Divider />

        <div className="invoice-parties">
          <div className="client-info">
            <h3>Client:</h3>
            <p>
              <strong>{invoice.client.entreprise}</strong>
            </p>
            {invoice.client.adresse && <p>{invoice.client.adresse}</p>}
            {(invoice.client.codePostal || invoice.client.localite) && (
              <p>
                {invoice.client.codePostal} {invoice.client.localite}
              </p>
            )}
            {invoice.client.email && <p>Email: {invoice.client.email}</p>}
            {invoice.client.phone && <p>Tél: {invoice.client.phone}</p>}
          </div>
          <div className="invoice-dates">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Date">
                {dayjs(invoice.date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              {invoice.dueDate && (
                <Descriptions.Item label="Échéance">
                  {dayjs(invoice.dueDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              )}
              {invoice.paidDate && (
                <Descriptions.Item label="Date de paiement">
                  {dayjs(invoice.paidDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        </div>

        <Divider />

        {/* Items table */}
        <div className="invoice-items">
          <Table
            columns={itemColumns}
            dataSource={invoice.items}
            pagination={false}
            rowKey={(record, index) => index}
            bordered
          />
        </div>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="total-row">
            <span>Sous-total:</span>
            <span className="amount">€{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>TVA ({invoice.taxRate}%):</span>
            <span className="amount">€{invoice.taxAmount.toFixed(2)}</span>
          </div>
          <Divider />
          <div className="total-row total-final">
            <span>
              <strong>Total:</strong>
            </span>
            <span className="amount">
              <strong>€{invoice.total.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Notes and terms */}
        {invoice.notes && (
          <>
            <Divider />
            <div className="invoice-notes">
              <h4>Notes:</h4>
              <p>{invoice.notes}</p>
            </div>
          </>
        )}

        {invoice.terms && (
          <>
            <Divider />
            <div className="invoice-terms">
              <h4>Conditions:</h4>
              <p>{invoice.terms}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <p>Merci pour votre confiance!</p>
        </div>
      </Card>
    </div>
  );
}

export default InvoiceDetail;
