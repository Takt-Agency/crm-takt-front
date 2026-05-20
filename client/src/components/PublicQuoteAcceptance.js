import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  acceptPublicQuoteByToken,
  getPublicQuoteByToken,
  rejectPublicQuoteByToken,
} from "../utils/api";
import "./PublicQuoteAcceptance.css";

const { Title, Text } = Typography;

const STATUS_COLORS = {
  Brouillon: "default",
  "Envoyée": "processing",
  "Accepté": "success",
  "Refusé": "error",
};

function PublicQuoteAcceptance() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [canAccept, setCanAccept] = useState(false);
  const [clientName, setClientName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadQuote = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const data = await getPublicQuoteByToken(token);
        setQuote(data.quote || null);
        setCanAccept(Boolean(data.canAccept));
      } catch (error) {
        setErrorMessage(error.message || "Lien invalide ou expiré");
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [token]);

  const rows = useMemo(() => quote?.items || [], [quote]);

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      const data = await acceptPublicQuoteByToken(token, {
        clientName,
      });
      setQuote(data.quote || quote);
      setCanAccept(false);
      message.success("Merci, votre devis a bien ete accepte.");
    } catch (error) {
      message.error(error.message || "Impossible d'accepter ce devis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      const data = await rejectPublicQuoteByToken(token, {
        clientName,
        reason: rejectionReason,
      });
      setQuote(data.quote || quote);
      setCanAccept(false);
      message.success("Votre refus a bien ete enregistre.");
    } catch (error) {
      message.error(error.message || "Impossible de refuser ce devis");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quote-public-page quote-public-center">
        <Spin size="large" />
      </div>
    );
  }

  if (errorMessage || !quote) {
    return (
      <div className="quote-public-page quote-public-center">
        <Card className="quote-public-card" bordered>
          <Alert
            type="error"
            showIcon
            title="Lien indisponible"
            description={errorMessage || "Le devis est introuvable."}
          />
        </Card>
      </div>
    );
  }

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Qte",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Prix unitaire",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 160,
      align: "right",
      render: (value) => `EUR ${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 160,
      align: "right",
      render: (value) => `EUR ${Number(value || 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="quote-public-page">
      <Card className="quote-public-card" bordered>
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
          <Text type="secondary">CRM TAKT</Text>
          <Title level={3} style={{ margin: 0 }}>
            Validation du devis
          </Title>
          <Space>
            <Text strong>{quote.number}</Text>
            <Tag color={STATUS_COLORS[quote.status] || "default"}>{quote.status}</Tag>
          </Space>
          <Text>
            Date: {quote.date ? dayjs(quote.date).format("DD/MM/YYYY") : "-"}
          </Text>
          <Text>
            Echeance: {quote.dueDate ? dayjs(quote.dueDate).format("DD/MM/YYYY") : "-"}
          </Text>
        </Space>

        <Divider />

        <Table
          rowKey={(record, index) => `${record.description}-${index}`}
          dataSource={rows}
          columns={columns}
          pagination={false}
          size="small"
        />

        <Divider />

        <div className="quote-totals">
          <div>
            <Text>Sous-total</Text>
            <Text strong>EUR {Number(quote.subtotal || 0).toFixed(2)}</Text>
          </div>
          <div>
            <Text>TVA ({quote.taxRate || 0}%)</Text>
            <Text strong>EUR {Number(quote.taxAmount || 0).toFixed(2)}</Text>
          </div>
          <div className="quote-total-final">
            <Text strong>Total</Text>
            <Text strong>EUR {Number(quote.total || 0).toFixed(2)}</Text>
          </div>
        </div>

        {quote.notes ? (
          <>
            <Divider />
            <Text>{quote.notes}</Text>
          </>
        ) : null}

        <Divider />

        {canAccept ? (
          <Space orientation="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="Votre nom (optionnel)"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            />
            <Input.TextArea
              rows={3}
              placeholder="Motif de refus (optionnel)"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
            <Space wrap>
              <Button type="primary" loading={submitting} onClick={handleAccept}>
                Accepter le devis
              </Button>
              <Button danger loading={submitting} onClick={handleReject}>
                Refuser le devis
              </Button>
            </Space>
          </Space>
        ) : (
          <Alert
            type={quote.status === "Refusé" ? "warning" : "success"}
            showIcon
            title={
              quote.status === "Refusé"
                ? "Ce devis est refuse"
                : "Ce devis est deja accepte"
            }
            description={
              quote.status === "Refusé"
                ? quote.quoteRejectedAt
                  ? `Refuse le ${dayjs(quote.quoteRejectedAt).format("DD/MM/YYYY HH:mm")}`
                  : "Merci pour votre retour."
                : quote.quoteAcceptedAt
                  ? `Accepte le ${dayjs(quote.quoteAcceptedAt).format("DD/MM/YYYY HH:mm")}`
                  : "Merci pour votre retour."
            }
          />
        )}
      </Card>
    </div>
  );
}

export default PublicQuoteAcceptance;
