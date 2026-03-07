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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  EuroOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "./Dashboard.css";
import {
  getAllInvoices,
  getInvoiceStats,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
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

const STATUSES = {
  Brouillon: { label: "Brouillon", color: "default", icon: <FileTextOutlined /> },
  Envoyée: { label: "Envoyée", color: "processing", icon: <ClockCircleOutlined /> },
  Payée: { label: "Payée", color: "success", icon: <CheckCircleOutlined /> },
  "En retard": { label: "En retard", color: "error", icon: <WarningOutlined /> },
  Annulée: { label: "Annulée", color: "default", icon: <FileTextOutlined /> },
};

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadClients();
    loadDeals();
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
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
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
      render: (total) => `€${total?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag icon={STATUSES[status].icon} color={STATUSES[status].color}>
          {STATUSES[status].label}
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
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h2 className="page-title">Devis & Facturation</h2>
          <p className="page-subtitle">Gérez vos devis et factures</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateInvoice}
        >
          Nouveau document
        </Button>
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
                styles={{ value: { color: "#52c41a" } }}
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
                styles={{ value: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="En retard"
                value={stats.overdueCount || 0}
                prefix={<WarningOutlined />}
                styles={{ value: { color: "#ff4d4f" } }}
              />
            </Card>
          </Col>
        </Row>
      )}

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
            placeholder="Tous les types"
            style={{ width: 150 }}
            allowClear
            value={filterType}
            onChange={setFilterType}
          >
            {Object.keys(TYPES).map((type) => (
              <Option key={type} value={type}>
                {TYPES[type].label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Tous les statuts"
            style={{ width: 150 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
          >
            {Object.keys(STATUSES).map((status) => (
              <Option key={status} value={status}>
                {STATUSES[status].label}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
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
                  {Object.keys(STATUSES).map((status) => (
                    <Option key={status} value={status}>
                      {STATUSES[status].label}
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
                        rules={[{ required: true, message: "Description requise" }]}
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

          <Form.Item name="taxRate" label="TVA (%)">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Notes additionnelles..." />
          </Form.Item>

          <Form.Item name="terms" label="Conditions">
            <TextArea rows={2} placeholder="Conditions de paiement..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Invoices;
