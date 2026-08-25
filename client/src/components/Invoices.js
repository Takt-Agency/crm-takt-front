import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Modal,
  Form,
  message,
  Tag,
  DatePicker,
  Row,
  Col,
  Statistic,
  InputNumber,
  Space,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  SwapOutlined,
  SendOutlined,
  FileTextOutlined,
  EuroOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RollbackOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "./Dashboard.css";
import "./Invoices.css";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import { CreditNotesDrawer, CreateCreditNoteModal } from "./CreditNotes";
import CurrenciesDrawer from "./Currencies";
import {
  getCurrencies,
  formatDevise,
  getAllInvoices,
  getInvoiceStats,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  convertQuoteToInvoice,
  sendQuoteToClient,
  exportAccountingInvoicesCsv,
  getMe,
  getAllClients,
  getAllDeals,
} from "../utils/api";

dayjs.locale("fr");

const { TextArea } = Input;
const { Option } = Select;

const TYPES = {
  Devis: { label: "Devis", color: "blue" },
  Facture: { label: "Facture", color: "green" },
};

// Un onglet par nature de document. Le serveur filtre deja sur ce champ :
// l'onglet ne fait que porter le choix dans l'URL.
const TYPE_PAR_ONGLET = {
  tous: null,
  devis: "Devis",
  factures: "Facture",
  avoirs: "Avoir",
};

const QUOTE_STATUSES = {
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
};

const INVOICE_STATUSES = {
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

const getStatusConfig = (type, status) => {
  const map = type === "Devis" ? QUOTE_STATUSES : INVOICE_STATUSES;
  return map[status] || { label: status, color: "default", icon: <FileTextOutlined /> };
};

const getAllowedStatusesForType = (type) =>
  Object.keys(type === "Devis" ? QUOTE_STATUSES : INVOICE_STATUSES);

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [avoirsOuverts, setAvoirsOuverts] = useState(false);
  const [factureAvoir, setFactureAvoir] = useState(null);
  const [devisesOuvertes, setDevisesOuvertes] = useState(false);
  const [devises, setDevises] = useState([]);
  const [deviseBase, setDeviseBase] = useState("EUR");
  const [form] = Form.useForm();
  const watchedType = Form.useWatch("type", form) || "Facture";
  const navigate = useNavigate();

  // Les avoirs sont gouvernes par la permission, non par le role : preparer
  // et imputer sont deux droits distincts.
  const peutAvoirs =
    currentUser && canAccessModule(currentUser, "invoices.credit");
  const peutEmettreAvoirs =
    currentUser && canAccessModule(currentUser, "invoices.credit.issue");
  const peutTenirLesTaux =
    currentUser && canAccessModule(currentUser, "finances.currencies");

  // L'onglet « Avoirs » suit la permission qui gouverne deja le bouton : le
  // masquer evite d'offrir une vue que le serveur refuserait de remplir.
  const onglets = [
    { key: "tous", label: "Tous" },
    { key: "devis", label: "Devis" },
    { key: "factures", label: "Factures" },
    ...(peutAvoirs ? [{ key: "avoirs", label: "Avoirs" }] : []),
  ];
  const [ongletActif, choisirOnglet] = useOngletUrl(onglets);
  const filterType = TYPE_PAR_ONGLET[ongletActif];

  useEffect(() => {
    loadStats();
    loadClients();
    loadDeals();
    loadCurrentUser();
    loadCurrencies();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [filterType, filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchText) params.search = searchText;
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;

      const data = await getAllInvoices(params);
      setInvoices(data.invoices || []);
    } catch (error) {
      message.error("Erreur lors du chargement des factures");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getInvoiceStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading invoice stats:", error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await getAllClients({ limit: 100 });
      setClients(data.clients || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadDeals = async () => {
    try {
      const data = await getAllDeals();
      setDeals(data || []);
    } catch (error) {
      console.error("Error loading deals:", error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const data = await getCurrencies({ actif: "true" });
      setDevises(data.devises || []);
      setDeviseBase(data.deviseBase || "EUR");
    } catch (error) {
      // Sans referentiel, la facturation reste possible en devise de base.
      console.error("Error loading currencies:", error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const me = await getMe();
      setCurrentUser(me);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const canConvertQuote = [
    "super_admin",
    "administrateur",
    "manager",
    "comptable",
  ].includes(currentUser?.role);

  const canSendQuote = [
    "super_admin",
    "administrateur",
    "manager",
    "commercial",
  ].includes(currentUser?.role);

  const canExportAccounting = [
    "super_admin",
    "administrateur",
    "manager",
    "comptable",
  ].includes(currentUser?.role);

  const handleSearch = () => {
    loadInvoices();
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    form.resetFields();
    form.setFieldsValue({
      type: "Facture",
      status: "Brouillon",
      taxRate: 20,
      paidAmount: 0,
      devise: deviseBase,
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    });
    setModalVisible(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue({
      ...invoice,
      date: invoice.date ? dayjs(invoice.date) : null,
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : null,
      client: invoice.client?._id,
      deal: invoice.deal?._id,
    });
    setModalVisible(true);
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice._id}`);
  };

  const handleSubmit = async (values) => {
    try {
      const invoiceData = {
        ...values,
        date: values.date
          ? values.date.toISOString()
          : new Date().toISOString(),
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };

      if (editingInvoice) {
        await updateInvoice(editingInvoice._id, invoiceData);
        message.success("Facture/Devis mise à jour avec succès");
      } else {
        await createInvoice(invoiceData);
        message.success("Facture/Devis créée avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      loadInvoices();
      loadStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleConvertQuote = async (invoice) => {
    try {
      await convertQuoteToInvoice(invoice._id);
      message.success("Devis converti en facture avec succès");
      loadInvoices();
      loadStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de la conversion du devis");
    }
  };

  const handleSendQuote = async (invoice) => {
    try {
      const result = await sendQuoteToClient(invoice._id);
      message.success(
        `Devis envoye a ${result.recipientEmail || "l'adresse client"}`,
      );
      loadInvoices();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'envoi du devis");
    }
  };

  const handleExportAccounting = async () => {
    try {
      await exportAccountingInvoicesCsv();
      message.success("Export comptable généré");
    } catch (error) {
      message.error(error.message || "Erreur lors de l'export comptable");
    }
  };

  const handleDeleteInvoice = (id) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Êtes-vous sûr de vouloir supprimer cette facture/devis ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await deleteInvoice(id);
          message.success("Facture/Devis supprimée avec succès");
          loadInvoices();
          loadStats();
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      await downloadInvoicePDF(invoice._id);
      message.success("PDF téléchargé avec succès");
    } catch (error) {
      message.error("Erreur lors du téléchargement du PDF");
    }
  };

  const columns = [
    {
      title: "Numéro",
      dataIndex: "number",
      key: "number",
      width: 150,
      render: (number) => <strong>{number}</strong>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color={TYPES[type].color}>{TYPES[type].label}</Tag>
      ),
    },
    {
      title: "Client",
      dataIndex: ["client", "entreprise"],
      key: "client",
      width: 200,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Échéance",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (dueDate) =>
        dueDate ? dayjs(dueDate).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Montant",
      dataIndex: "total",
      key: "total",
      width: 120,
      render: (total, record) => formatDevise(total, record.devise || deviseBase),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => (
        <Tag
          icon={getStatusConfig(record?.type, status).icon}
          color={getStatusConfig(record?.type, status).color}
        >
          {getStatusConfig(record?.type, status).label}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewInvoice(record)}
          >
            Voir
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownloadPDF(record)}
          >
            PDF
          </Button>
          {record.type === "Devis" && canConvertQuote ? (
            <Button
              type="link"
              icon={<SwapOutlined />}
              size="small"
              disabled={record.status !== "Accepté" || !!record.convertedToInvoice}
              onClick={() => handleConvertQuote(record)}
            >
              Convertir
            </Button>
          ) : null}
          {record.type === "Facture" && peutAvoirs ? (
            <Button
              type="link"
              icon={<RollbackOutlined />}
              size="small"
              onClick={() => setFactureAvoir(record)}
              disabled={
                record.status === "Brouillon" || record.status === "Annulée"
              }
            >
              Avoir
            </Button>
          ) : null}
          {record.type === "Devis" && canSendQuote ? (
            <Button
              type="link"
              icon={<SendOutlined />}
              size="small"
              onClick={() => handleSendQuote(record)}
            >
              Envoyer
            </Button>
          ) : null}
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditInvoice(record)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteInvoice(record._id)}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard-content invoices-page">
      <div className="content-header">
        <div>
          <p className="section-kicker">FACTURATION</p>
          <h2 className="page-title">Devis & Facturation</h2>
          <p className="page-subtitle">Gérez vos devis et factures</p>
        </div>
        <Space>
          {canExportAccounting ? (
            <Button icon={<DownloadOutlined />} onClick={handleExportAccounting}>
              Export comptable
            </Button>
          ) : null}
          {peutAvoirs ? (
            <Button
              icon={<RollbackOutlined />}
              onClick={() => setAvoirsOuverts(true)}
            >
              Avoirs
            </Button>
          ) : null}
          <Button
            icon={<GlobalOutlined />}
            onClick={() => setDevisesOuvertes(true)}
          >
            Devises
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateInvoice}
          >
            Nouveau document
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Chiffre d'affaires"
                value={stats.totalRevenue || 0}
                prefix={<EuroOutlined />}
                precision={2}
                styles={{ value: { color: "var(--accent-green)" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="En attente"
                value={stats.pendingRevenue || 0}
                prefix={<ClockCircleOutlined />}
                precision={2}
                styles={{ value: { color: "var(--brand-cyan)" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="En retard"
                value={stats.overdueCount || 0}
                prefix={<WarningOutlined />}
                styles={{ value: { color: "var(--accent-red)" } }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={onglets}
        className="module-tabs"
      />

      {/* Search and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap style={{ width: "100%" }}>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Tous les statuts"
            style={{ width: 150 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
          >
            {Object.keys({ ...QUOTE_STATUSES, ...INVOICE_STATUSES }).map(
              (status) => (
              <Option key={status} value={status}>
                {getStatusConfig("Facture", status).label}
              </Option>
              ),
            )}
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Rechercher
          </Button>
        </Space>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingInvoice ? "Modifier" : "Nouveau document"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        okText={editingInvoice ? "Enregistrer" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: "Le type est requis" }]}
              >
                <Select>
                  {Object.keys(TYPES).map((type) => (
                    <Option key={type} value={type}>
                      {TYPES[type].label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Statut"
                rules={[{ required: true }]}
              >
                <Select>
                  {getAllowedStatusesForType(watchedType).map((status) => (
                    <Option key={status} value={status}>
                      {getStatusConfig(watchedType, status).label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: "Le client est requis" }]}
          >
            <Select
              placeholder="Sélectionner un client"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {clients.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.entreprise}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="deal" label="Deal (optionnel)">
            <Select
              placeholder="Sélectionner un deal"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {deals.map((deal) => (
                <Option key={deal._id} value={deal._id}>
                  {deal.title} - {deal.company}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Sélectionner une date"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Date d'échéance">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Sélectionner une date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Articles">
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: "flex", marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[name, "description"]}
                        rules={[
                          { required: true, message: "Description requise" },
                        ]}
                      >
                        <Input
                          placeholder="Description"
                          style={{ width: 250 }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "quantity"]}
                        rules={[{ required: true, message: "Qté requise" }]}
                      >
                        <InputNumber
                          placeholder="Quantité"
                          min={1}
                          style={{ width: 100 }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "unitPrice"]}
                        rules={[{ required: true, message: "Prix requis" }]}
                      >
                        <InputNumber
                          placeholder="Prix unitaire"
                          min={0}
                          prefix="€"
                          style={{ width: 120 }}
                        />
                      </Form.Item>
                      <Button type="link" danger onClick={() => remove(name)}>
                        <DeleteOutlined />
                      </Button>
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Ajouter un article
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="taxRate" label="TVA (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="devise"
                label="Devise"
                extra={
                  editingInvoice && editingInvoice.status !== "Brouillon"
                    ? "Figée : le document n'est plus en brouillon"
                    : `Comptabilité tenue en ${deviseBase}`
                }
              >
                <Select
                  disabled={
                    Boolean(editingInvoice) &&
                    editingInvoice.status !== "Brouillon"
                  }
                >
                  {devises.map((devise) => (
                    <Option key={devise.code} value={devise.code}>
                      {devise.code} — {devise.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Notes additionnelles..." />
          </Form.Item>

          <Form.Item name="terms" label="Conditions">
            <TextArea rows={2} placeholder="Conditions de paiement..." />
          </Form.Item>
        </Form>
      </Modal>

      <CreditNotesDrawer
        ouvert={avoirsOuverts}
        onFermer={() => setAvoirsOuverts(false)}
        peutEmettre={peutEmettreAvoirs}
      />

      <CurrenciesDrawer
        ouvert={devisesOuvertes}
        onFermer={() => setDevisesOuvertes(false)}
        peutTenirLesTaux={peutTenirLesTaux}
      />

      <CreateCreditNoteModal
        facture={factureAvoir}
        ouvert={Boolean(factureAvoir)}
        onFermer={() => setFactureAvoir(null)}
        // L'avoir modifie le reste du : la liste doit refleter la facture
        // corrigee sans attendre un rechargement manuel.
        onCree={loadInvoices}
      />
    </div>
  );
}

export default Invoices;
