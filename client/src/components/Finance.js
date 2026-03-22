import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Space,
  Button,
  Input,
  Modal,
  Form,
  message,
  InputNumber,
  DatePicker,
  Select,
  Tag,
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./Dashboard.css";
import {
  getFinanceStats,
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getAllEncaissements,
  createEncaissement,
  updateEncaissement,
  deleteEncaissement,
  getAllDecaissements,
  createDecaissement,
  updateDecaissement,
  deleteDecaissement,
  getAllTresorerieEntries,
  createTresorerieEntry,
  updateTresorerieEntry,
  deleteTresorerieEntry,
  getAllClients,
} from "../utils/api";

const { Option } = Select;

const PAYMENT_MODES = ["Virement", "Espèces", "Chèque", "Carte", "Prélèvement", "Autre"];
const TRESORERIE_TYPES = ["Entrée", "Sortie", "Ajustement"];

function Finance() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [encaissements, setEncaissements] = useState([]);
  const [decaissements, setDecaissements] = useState([]);
  const [tresorerieEntries, setTresorerieEntries] = useState([]);
  const [clients, setClients] = useState([]);

  const [bankSearch, setBankSearch] = useState("");
  const [encSearch, setEncSearch] = useState("");
  const [decSearch, setDecSearch] = useState("");
  const [treSearch, setTreSearch] = useState("");

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [encModalOpen, setEncModalOpen] = useState(false);
  const [decModalOpen, setDecModalOpen] = useState(false);
  const [treModalOpen, setTreModalOpen] = useState(false);

  const [editingBank, setEditingBank] = useState(null);
  const [editingEnc, setEditingEnc] = useState(null);
  const [editingDec, setEditingDec] = useState(null);
  const [editingTre, setEditingTre] = useState(null);

  const [bankForm] = Form.useForm();
  const [encForm] = Form.useForm();
  const [decForm] = Form.useForm();
  const [treForm] = Form.useForm();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        const [statsData, bankData, encData, decData, treData, clientsData] =
          await Promise.all([
            getFinanceStats(),
            getAllBankAccounts({ search: "" }),
            getAllEncaissements({ search: "" }),
            getAllDecaissements({ search: "" }),
            getAllTresorerieEntries({ search: "" }),
            getAllClients({ limit: 200 }),
          ]);

        setStats(statsData);
        setBankAccounts(bankData.comptes || []);
        setEncaissements(encData.encaissements || []);
        setDecaissements(decData.decaissements || []);
        setTresorerieEntries(treData.entries || []);
        setClients(clientsData.clients || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadStats = async () => {
    const data = await getFinanceStats();
    setStats(data);
  };

  const loadBankAccounts = async (search = bankSearch) => {
    const data = await getAllBankAccounts({ search });
    setBankAccounts(data.comptes || []);
  };

  const loadEncaissements = async (search = encSearch) => {
    const data = await getAllEncaissements({ search });
    setEncaissements(data.encaissements || []);
  };

  const loadDecaissements = async (search = decSearch) => {
    const data = await getAllDecaissements({ search });
    setDecaissements(data.decaissements || []);
  };

  const loadTresorerieEntries = async (search = treSearch) => {
    const data = await getAllTresorerieEntries({ search });
    setTresorerieEntries(data.entries || []);
  };

  const refreshFinancialData = async () => {
    await Promise.all([
      loadStats(),
      loadBankAccounts(),
      loadEncaissements(),
      loadDecaissements(),
      loadTresorerieEntries(),
    ]);
  };

  const confirmDelete = (title, action) => {
    Modal.confirm({
      title,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: action,
    });
  };

  const bankColumns = [
    {
      title: "Compte",
      key: "name",
      render: (_, record) => (
        <div>
          <strong>{record.name}</strong>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>{record.bankName}</div>
        </div>
      ),
    },
    {
      title: "IBAN",
      dataIndex: "iban",
      key: "iban",
      render: (value) => value || "-",
    },
    {
      title: "Devise",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Solde",
      dataIndex: "currentBalance",
      key: "currentBalance",
      render: (value, record) => `${record.currency || "EUR"} ${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Actif",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "default"}>{isActive ? "Oui" : "Non"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openBankModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer ce compte bancaire ?", async () => {
                try {
                  await deleteBankAccount(record._id);
                  message.success("Compte bancaire supprimé");
                  await refreshFinancialData();
                } catch (error) {
                  message.error(error.message || "Erreur lors de la suppression");
                }
              })
            }
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  const encColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      render: (value) => `${Number(value || 0).toFixed(2)} €`,
    },
    {
      title: "Compte bancaire",
      key: "compteBancaire",
      render: (_, record) => record.compteBancaire?.name || "-",
    },
    {
      title: "Client",
      key: "client",
      render: (_, record) => record.client?.entreprise || "-",
    },
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEncModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer cet encaissement ?", async () => {
                try {
                  await deleteEncaissement(record._id);
                  message.success("Encaissement supprimé");
                  await refreshFinancialData();
                } catch (error) {
                  message.error(error.message || "Erreur lors de la suppression");
                }
              })
            }
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  const decColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      render: (value) => `${Number(value || 0).toFixed(2)} €`,
    },
    {
      title: "Compte bancaire",
      key: "compteBancaire",
      render: (_, record) => record.compteBancaire?.name || "-",
    },
    {
      title: "Bénéficiaire",
      dataIndex: "beneficiaire",
      key: "beneficiaire",
      render: (value) => value || "-",
    },
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openDecModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer ce décaissement ?", async () => {
                try {
                  await deleteDecaissement(record._id);
                  message.success("Décaissement supprimé");
                  await refreshFinancialData();
                } catch (error) {
                  message.error(error.message || "Erreur lors de la suppression");
                }
              })
            }
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  const tresorerieColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value) => {
        const color = value === "Entrée" ? "success" : value === "Sortie" ? "error" : "processing";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      render: (value) => `${Number(value || 0).toFixed(2)} €`,
    },
    {
      title: "Catégorie",
      dataIndex: "categorie",
      key: "categorie",
      render: (value) => value || "-",
    },
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openTreModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer cette entrée de trésorerie ?", async () => {
                try {
                  await deleteTresorerieEntry(record._id);
                  message.success("Entrée de trésorerie supprimée");
                  await refreshFinancialData();
                } catch (error) {
                  message.error(error.message || "Erreur lors de la suppression");
                }
              })
            }
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  const openBankModal = (record = null) => {
    setEditingBank(record);
    if (record) {
      bankForm.setFieldsValue(record);
    } else {
      bankForm.resetFields();
      bankForm.setFieldsValue({ currency: "EUR", isActive: true, initialBalance: 0 });
    }
    setBankModalOpen(true);
  };

  const openEncModal = (record = null) => {
    setEditingEnc(record);
    if (record) {
      encForm.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : dayjs(),
        compteBancaire: record.compteBancaire?._id,
        client: record.client?._id,
      });
    } else {
      encForm.resetFields();
      encForm.setFieldsValue({ date: dayjs(), modePaiement: "Virement", montant: 0 });
    }
    setEncModalOpen(true);
  };

  const openDecModal = (record = null) => {
    setEditingDec(record);
    if (record) {
      decForm.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : dayjs(),
        compteBancaire: record.compteBancaire?._id,
      });
    } else {
      decForm.resetFields();
      decForm.setFieldsValue({ date: dayjs(), modePaiement: "Virement", montant: 0 });
    }
    setDecModalOpen(true);
  };

  const openTreModal = (record = null) => {
    setEditingTre(record);
    if (record) {
      treForm.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : dayjs(),
      });
    } else {
      treForm.resetFields();
      treForm.setFieldsValue({ date: dayjs(), type: "Entrée", montant: 0 });
    }
    setTreModalOpen(true);
  };

  const submitBank = async (values) => {
    try {
      if (editingBank) {
        await updateBankAccount(editingBank._id, values);
        message.success("Compte bancaire mis à jour");
      } else {
        await createBankAccount(values);
        message.success("Compte bancaire créé");
      }
      setBankModalOpen(false);
      await refreshFinancialData();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const submitEnc = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date?.toISOString(),
      };
      if (editingEnc) {
        await updateEncaissement(editingEnc._id, payload);
        message.success("Encaissement mis à jour");
      } else {
        await createEncaissement(payload);
        message.success("Encaissement créé");
      }
      setEncModalOpen(false);
      await refreshFinancialData();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const submitDec = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date?.toISOString(),
      };
      if (editingDec) {
        await updateDecaissement(editingDec._id, payload);
        message.success("Décaissement mis à jour");
      } else {
        await createDecaissement(payload);
        message.success("Décaissement créé");
      }
      setDecModalOpen(false);
      await refreshFinancialData();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const submitTre = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date?.toISOString(),
      };
      if (editingTre) {
        await updateTresorerieEntry(editingTre._id, payload);
        message.success("Entrée de trésorerie mise à jour");
      } else {
        await createTresorerieEntry(payload);
        message.success("Entrée de trésorerie créée");
      }
      setTreModalOpen(false);
      await refreshFinancialData();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Comptes bancaires",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher un compte..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              onPressEnter={() => loadBankAccounts(bankSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openBankModal()}>
              Nouveau compte
            </Button>
          </Space>
          <Table rowKey="_id" columns={bankColumns} dataSource={bankAccounts} loading={loading} />
        </Card>
      ),
    },
    {
      key: "2",
      label: "Encaissements",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher un encaissement..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={encSearch}
              onChange={(e) => setEncSearch(e.target.value)}
              onPressEnter={() => loadEncaissements(encSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEncModal()}>
              Nouvel encaissement
            </Button>
          </Space>
          <Table rowKey="_id" columns={encColumns} dataSource={encaissements} loading={loading} />
        </Card>
      ),
    },
    {
      key: "3",
      label: "Décaissements",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher un décaissement..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={decSearch}
              onChange={(e) => setDecSearch(e.target.value)}
              onPressEnter={() => loadDecaissements(decSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openDecModal()}>
              Nouveau décaissement
            </Button>
          </Space>
          <Table rowKey="_id" columns={decColumns} dataSource={decaissements} loading={loading} />
        </Card>
      ),
    },
    {
      key: "4",
      label: "Trésorerie",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher en trésorerie..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={treSearch}
              onChange={(e) => setTreSearch(e.target.value)}
              onPressEnter={() => loadTresorerieEntries(treSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openTreModal()}>
              Nouvelle entrée
            </Button>
          </Space>
          <Table rowKey="_id" columns={tresorerieColumns} dataSource={tresorerieEntries} loading={loading} />
        </Card>
      ),
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h2 className="page-title">Finance</h2>
          <p className="page-subtitle">Encaissements, décaissements, comptes bancaires et trésorerie</p>
        </div>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Encaissements" value={stats.totalEncaissements || 0} precision={2} prefix={<ArrowUpOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Décaissements" value={stats.totalDecaissements || 0} precision={2} prefix={<ArrowDownOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Trésorerie globale" value={stats.tresorerieGlobale || 0} precision={2} prefix={<WalletOutlined />} />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs defaultActiveKey="1" items={tabItems} />

      <Modal
        open={bankModalOpen}
        title={editingBank ? "Modifier compte bancaire" : "Créer compte bancaire"}
        onCancel={() => setBankModalOpen(false)}
        onOk={() => bankForm.submit()}
        okText={editingBank ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={bankForm} layout="vertical" onFinish={submitBank}>
          <Form.Item name="name" label="Nom du compte" rules={[{ required: true, message: "Champ requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="bankName" label="Banque" rules={[{ required: true, message: "Champ requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="iban" label="IBAN">
            <Input />
          </Form.Item>
          <Form.Item name="accountNumber" label="Numéro de compte">
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="Devise" rules={[{ required: true, message: "Champ requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="initialBalance" label="Solde initial" rules={[{ required: true, message: "Champ requis" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="Compte actif" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={encModalOpen}
        title={editingEnc ? "Modifier encaissement" : "Créer encaissement"}
        onCancel={() => setEncModalOpen(false)}
        onOk={() => encForm.submit()}
        okText={editingEnc ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={encForm} layout="vertical" onFinish={submitEnc}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Champ requis" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="montant" label="Montant" rules={[{ required: true, message: "Champ requis" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="compteBancaire" label="Compte bancaire">
            <Select allowClear>
              {bankAccounts.map((account) => (
                <Option key={account._id} value={account._id}>
                  {account.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="client" label="Client">
            <Select allowClear showSearch optionFilterProp="children">
              {clients.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.entreprise}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="modePaiement" label="Mode de paiement">
            <Select>
              {PAYMENT_MODES.map((mode) => (
                <Option key={mode} value={mode}>
                  {mode}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="categorie" label="Catégorie">
            <Input />
          </Form.Item>
          <Form.Item name="reference" label="Référence">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={decModalOpen}
        title={editingDec ? "Modifier décaissement" : "Créer décaissement"}
        onCancel={() => setDecModalOpen(false)}
        onOk={() => decForm.submit()}
        okText={editingDec ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={decForm} layout="vertical" onFinish={submitDec}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Champ requis" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="montant" label="Montant" rules={[{ required: true, message: "Champ requis" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="compteBancaire" label="Compte bancaire">
            <Select allowClear>
              {bankAccounts.map((account) => (
                <Option key={account._id} value={account._id}>
                  {account.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="beneficiaire" label="Bénéficiaire">
            <Input />
          </Form.Item>
          <Form.Item name="modePaiement" label="Mode de paiement">
            <Select>
              {PAYMENT_MODES.map((mode) => (
                <Option key={mode} value={mode}>
                  {mode}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="categorie" label="Catégorie">
            <Input />
          </Form.Item>
          <Form.Item name="reference" label="Référence">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={treModalOpen}
        title={editingTre ? "Modifier entrée trésorerie" : "Créer entrée trésorerie"}
        onCancel={() => setTreModalOpen(false)}
        onOk={() => treForm.submit()}
        okText={editingTre ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={treForm} layout="vertical" onFinish={submitTre}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Champ requis" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Champ requis" }]}>
            <Select>
              {TRESORERIE_TYPES.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="montant" label="Montant" rules={[{ required: true, message: "Champ requis" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="categorie" label="Catégorie">
            <Input />
          </Form.Item>
          <Form.Item name="reference" label="Référence">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Finance;
