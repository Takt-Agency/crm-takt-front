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
  notification,
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
import "./Finance.css";
import {
  getFinanceStats,
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSupplierOrders,
  createSupplierOrder,
  updateSupplierOrder,
  deleteSupplierOrder,
  getSupplierPaymentAlerts,
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
  getMe,
} from "../utils/api";

const { Option } = Select;

const PAYMENT_MODES = ["Virement", "Espèces", "Chèque", "Carte", "Prélèvement", "Autre"];
const TRESORERIE_TYPES = ["Entrée", "Sortie", "Ajustement"];

function Finance() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [supplierPaymentAlerts, setSupplierPaymentAlerts] = useState({
    dueSoon: [],
    overdue: [],
    counts: { dueSoon: 0, overdue: 0 },
  });
  const [alertsNotified, setAlertsNotified] = useState(false);
  const [encaissements, setEncaissements] = useState([]);
  const [decaissements, setDecaissements] = useState([]);
  const [tresorerieEntries, setTresorerieEntries] = useState([]);
  const [clients, setClients] = useState([]);

  const [bankSearch, setBankSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [encSearch, setEncSearch] = useState("");
  const [decSearch, setDecSearch] = useState("");
  const [treSearch, setTreSearch] = useState("");

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [encModalOpen, setEncModalOpen] = useState(false);
  const [decModalOpen, setDecModalOpen] = useState(false);
  const [treModalOpen, setTreModalOpen] = useState(false);

  const [editingBank, setEditingBank] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingEnc, setEditingEnc] = useState(null);
  const [editingDec, setEditingDec] = useState(null);
  const [editingTre, setEditingTre] = useState(null);

  const [bankForm] = Form.useForm();
  const [supplierForm] = Form.useForm();
  const [orderForm] = Form.useForm();
  const [encForm] = Form.useForm();
  const [decForm] = Form.useForm();
  const [treForm] = Form.useForm();

  const canManageSupplierPayments =
    !!currentUser &&
    ["super_admin", "administrateur", "comptable"].includes(
      currentUser.role,
    );

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        const [
          userData,
          statsData,
          bankData,
          supplierData,
          orderData,
          encData,
          decData,
          treData,
          clientsData,
        ] =
          await Promise.all([
            getMe(),
            getFinanceStats(),
            getAllBankAccounts({ search: "" }),
            getAllSuppliers({ search: "" }),
            getAllSupplierOrders({ search: "" }),
            getAllEncaissements({ search: "" }),
            getAllDecaissements({ search: "" }),
            getAllTresorerieEntries({ search: "" }),
            getAllClients({ limit: 200 }),
          ]);

        setCurrentUser(userData);
        setStats(statsData);
        setBankAccounts(bankData.comptes || []);
        setSuppliers(supplierData.suppliers || []);
        setSupplierOrders(orderData.orders || []);
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

  const loadSuppliers = async (search = supplierSearch) => {
    const data = await getAllSuppliers({ search });
    setSuppliers(data.suppliers || []);
  };

  const loadSupplierOrders = async (search = orderSearch) => {
    const data = await getAllSupplierOrders({ search });
    setSupplierOrders(data.orders || []);
  };

  const loadSupplierPaymentAlerts = async () => {
    const data = await getSupplierPaymentAlerts({ daysAhead: 7, limit: 8 });
    setSupplierPaymentAlerts({
      dueSoon: data.dueSoon || [],
      overdue: data.overdue || [],
      counts: data.counts || { dueSoon: 0, overdue: 0 },
    });
  };

  useEffect(() => {
    if (alertsNotified) return;

    const overdueCount = supplierPaymentAlerts.counts?.overdue || 0;
    const dueSoonCount = supplierPaymentAlerts.counts?.dueSoon || 0;
    if (!overdueCount && !dueSoonCount) return;

    notification.warning({
      message: "Alertes paiements fournisseurs",
      description: `${overdueCount} en retard, ${dueSoonCount} proches d'échéance`,
      duration: 6,
    });
    setAlertsNotified(true);
  }, [supplierPaymentAlerts, alertsNotified]);

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
      loadSuppliers(),
      loadSupplierOrders(),
      loadSupplierPaymentAlerts(),
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
      title: "Fournisseur",
      key: "fournisseur",
      render: (_, record) => record.fournisseur?.name || "-",
    },
    {
      title: "Commande",
      key: "commandeFournisseur",
      render: (_, record) => record.commandeFournisseur?.orderNumber || "-",
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

  const supplierColumns = [
    {
      title: "Fournisseur",
      key: "name",
      render: (_, record) => (
        <div>
          <strong>{record.name}</strong>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>{record.contactPerson || "-"}</div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value) => value || "-",
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
      render: (value) => value || "-",
    },
    {
      title: "Conditions",
      dataIndex: "paymentTerms",
      key: "paymentTerms",
      render: (value) => value || "-",
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
          <Button type="link" icon={<EditOutlined />} onClick={() => openSupplierModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer ce fournisseur ?", async () => {
                try {
                  await deleteSupplier(record._id);
                  message.success("Fournisseur supprimé");
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

  const supplierOrderColumns = [
    {
      title: "Commande",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (value) => value || "-",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Fournisseur",
      key: "supplier",
      render: (_, record) => record.supplier?.name || "-",
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => `${Number(value || 0).toFixed(2)} €`,
    },
    {
      title: "Payé",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (value) => `${Number(value || 0).toFixed(2)} €`,
    },
    {
      title: "Reste",
      key: "remaining",
      render: (_, record) => {
        const total = Number(record.totalAmount || 0);
        const paid = Number(record.paidAmount || 0);
        return `${Math.max(total - paid, 0).toFixed(2)} €`;
      },
    },
    {
      title: "Échéance",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        const color =
          value === "Payée"
            ? "success"
            : value === "Partiellement payée"
              ? "processing"
              : value === "Annulée"
                ? "error"
                : "default";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canManageSupplierPayments && (
            <Button
              type="link"
              icon={<WalletOutlined />}
              onClick={() => openQuickPayFromOrder(record)}
              disabled={
                Math.max(
                  Number(record.totalAmount || 0) - Number(record.paidAmount || 0),
                  0,
                ) <= 0
              }
            >
              Payer
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => openOrderModal(record)}>
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete("Supprimer cette commande fournisseur ?", async () => {
                try {
                  await deleteSupplierOrder(record._id);
                  message.success("Commande fournisseur supprimée");
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

  const openSupplierModal = (record = null) => {
    setEditingSupplier(record);
    if (record) {
      supplierForm.setFieldsValue(record);
    } else {
      supplierForm.resetFields();
      supplierForm.setFieldsValue({ isActive: true, paymentTerms: "30 jours" });
    }
    setSupplierModalOpen(true);
  };

  const openOrderModal = (record = null) => {
    setEditingOrder(record);
    if (record) {
      orderForm.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : dayjs(),
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
        supplier: record.supplier?._id,
      });
    } else {
      orderForm.resetFields();
      orderForm.setFieldsValue({
        date: dayjs(),
        status: "Brouillon",
        totalAmount: 0,
      });
    }
    setOrderModalOpen(true);
  };

  const openDecModal = (record = null) => {
    setEditingDec(record);
    if (record) {
      decForm.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : dayjs(),
        compteBancaire: record.compteBancaire?._id,
        fournisseur: record.fournisseur?._id,
        commandeFournisseur: record.commandeFournisseur?._id,
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

  const openQuickPayFromOrder = (order) => {
    const remaining = Math.max(
      Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
      0,
    );

    setEditingDec(null);
    decForm.resetFields();
    decForm.setFieldsValue({
      date: dayjs(),
      montant: remaining,
      modePaiement: "Virement",
      fournisseur: order.supplier?._id,
      commandeFournisseur: order._id,
      beneficiaire: order.supplier?.name || "",
      reference: `PAY-${order.orderNumber}`,
      categorie: "Paiement fournisseur",
    });
    setDecModalOpen(true);
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

  const submitSupplier = async (values) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, values);
        message.success("Fournisseur mis à jour");
      } else {
        await createSupplier(values);
        message.success("Fournisseur créé");
      }
      setSupplierModalOpen(false);
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

      if (values.fournisseur && !values.beneficiaire) {
        const selectedSupplier = suppliers.find((supplier) => supplier._id === values.fournisseur);
        if (selectedSupplier?.name) {
          payload.beneficiaire = selectedSupplier.name;
        }
      }

      if (values.commandeFournisseur && !values.fournisseur) {
        const selectedOrder = supplierOrders.find((order) => order._id === values.commandeFournisseur);
        if (selectedOrder?.supplier?._id) {
          payload.fournisseur = selectedOrder.supplier._id;
          if (!payload.beneficiaire && selectedOrder.supplier.name) {
            payload.beneficiaire = selectedOrder.supplier.name;
          }
        }
      }

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

  const submitOrder = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date?.toISOString(),
        dueDate: values.dueDate?.toISOString(),
      };

      if (editingOrder) {
        await updateSupplierOrder(editingOrder._id, payload);
        message.success("Commande fournisseur mise à jour");
      } else {
        await createSupplierOrder(payload);
        message.success("Commande fournisseur créée");
      }

      setOrderModalOpen(false);
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

  const paymentProcessingTab = {
    key: "4",
    label: "Paiements à traiter",
    children: (
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          {[...supplierPaymentAlerts.overdue, ...supplierPaymentAlerts.dueSoon]
            .sort((a, b) => {
              const prio = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
              const pDiff = (prio[a.priority] ?? 9) - (prio[b.priority] ?? 9);
              if (pDiff !== 0) return pDiff;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            })
            .map((alert) => (
              <Card key={alert._id} size="small">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <Tag color={alert.priority === "CRITICAL" ? "error" : alert.priority === "HIGH" ? "warning" : "processing"}>
                      {alert.priority}
                    </Tag>
                    <strong>{alert.orderNumber}</strong> - {alert.supplier?.name || "N/A"}
                    <div style={{ color: "#595959", marginTop: 4 }}>
                      Reste {Number(alert.remainingAmount || 0).toFixed(2)} € • Échéance {alert.dueDate ? dayjs(alert.dueDate).format("DD/MM/YYYY") : "-"}
                    </div>
                  </div>
                  <Button type="primary" onClick={() => openQuickPayFromOrder(alert)}>
                    Payer
                  </Button>
                </div>
              </Card>
            ))}
        </Space>
      </Card>
    ),
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
      label: "Fournisseurs",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher un fournisseur..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              onPressEnter={() => loadSuppliers(supplierSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openSupplierModal()}>
              Nouveau fournisseur
            </Button>
          </Space>
          <Table rowKey="_id" columns={supplierColumns} dataSource={suppliers} loading={loading} />
        </Card>
      ),
    },
    {
      key: "3",
      label: "Commandes fournisseurs",
      children: (
        <Card>
          <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher une commande fournisseur..."
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              onPressEnter={() => loadSupplierOrders(orderSearch)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openOrderModal()}>
              Nouvelle commande
            </Button>
          </Space>
          <Table
            rowKey="_id"
            columns={supplierOrderColumns}
            dataSource={supplierOrders}
            loading={loading}
          />
        </Card>
      ),
    },
    ...(canManageSupplierPayments ? [paymentProcessingTab] : []),
    {
      key: "5",
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
      key: "6",
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
            {canManageSupplierPayments && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDecModal()}>
                Nouveau décaissement
              </Button>
            )}
          </Space>
          <Table rowKey="_id" columns={decColumns} dataSource={decaissements} loading={loading} />
        </Card>
      ),
    },
    {
      key: "7",
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
    <div className="dashboard-content finance-page">
      <div className="content-header">
        <div>
          <p className="section-kicker">TRESORERIE</p>
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
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Dettes fournisseurs" value={stats.supplierRemainingTotal || 0} precision={2} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Échéances proches (7j)" value={stats.supplierOrdersDueSoon || 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Échéances en retard" value={stats.supplierOrdersOverdue || 0} />
            </Card>
          </Col>
        </Row>
      )}

      {(supplierPaymentAlerts.overdue.length > 0 || supplierPaymentAlerts.dueSoon.length > 0) && (
        <Card
          title="Alertes paiements fournisseurs"
          style={{ marginBottom: 24 }}
          extra={
            <Tag color="error">
              {supplierPaymentAlerts.counts.overdue || 0} en retard / {supplierPaymentAlerts.counts.dueSoon || 0} proches
            </Tag>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {supplierPaymentAlerts.overdue.map((alert) => (
              <div key={`overdue-${alert._id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <Tag color="error">En retard</Tag>
                  {alert.orderNumber} - {alert.supplier?.name || "N/A"} - reste {Number(alert.remainingAmount || 0).toFixed(2)} €
                </div>
                {canManageSupplierPayments && (
                  <Button size="small" onClick={() => openQuickPayFromOrder(alert)}>
                    Payer
                  </Button>
                )}
              </div>
            ))}
            {supplierPaymentAlerts.dueSoon.map((alert) => (
              <div key={`soon-${alert._id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <Tag color="warning">Proche</Tag>
                  {alert.orderNumber} - {alert.supplier?.name || "N/A"} - échéance {alert.dueDate ? dayjs(alert.dueDate).format("DD/MM/YYYY") : "-"}
                </div>
                {canManageSupplierPayments && (
                  <Button size="small" onClick={() => openQuickPayFromOrder(alert)}>
                    Payer
                  </Button>
                )}
              </div>
            ))}
          </Space>
        </Card>
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
        open={supplierModalOpen}
        title={editingSupplier ? "Modifier fournisseur" : "Créer fournisseur"}
        onCancel={() => setSupplierModalOpen(false)}
        onOk={() => supplierForm.submit()}
        okText={editingSupplier ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={supplierForm} layout="vertical" onFinish={submitSupplier}>
          <Form.Item name="name" label="Nom" rules={[{ required: true, message: "Champ requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="Contact principal">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Téléphone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="taxId" label="Identifiant fiscal">
            <Input />
          </Form.Item>
          <Form.Item name="paymentTerms" label="Conditions de paiement">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Fournisseur actif" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={orderModalOpen}
        title={editingOrder ? "Modifier commande fournisseur" : "Créer commande fournisseur"}
        onCancel={() => setOrderModalOpen(false)}
        onOk={() => orderForm.submit()}
        okText={editingOrder ? "Mettre à jour" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={orderForm} layout="vertical" onFinish={submitOrder}>
          <Form.Item name="orderNumber" label="Numéro commande">
            <Input placeholder="Auto si vide" />
          </Form.Item>
          <Form.Item
            name="supplier"
            label="Fournisseur"
            rules={[{ required: true, message: "Champ requis" }]}
          >
            <Select allowClear showSearch optionFilterProp="children">
              {suppliers.map((supplier) => (
                <Option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Objet">
            <Input />
          </Form.Item>
          <Form.Item name="reference" label="Référence interne">
            <Input />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Champ requis" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="dueDate" label="Date d'échéance">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="Montant total"
            rules={[{ required: true, message: "Champ requis" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="status" label="Statut">
            <Select>
              {[
                "Brouillon",
                "Validée",
                "Partiellement payée",
                "Payée",
                "Annulée",
              ].map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
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
          <Form.Item name="fournisseur" label="Fournisseur">
            <Select
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(supplierId) => {
                const selectedSupplier = suppliers.find((supplier) => supplier._id === supplierId);
                if (selectedSupplier?.name) {
                  decForm.setFieldValue("beneficiaire", selectedSupplier.name);
                }
              }}
            >
              {suppliers.map((supplier) => (
                <Option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="commandeFournisseur" label="Commande fournisseur">
            <Select
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(orderId) => {
                const selectedOrder = supplierOrders.find((order) => order._id === orderId);
                if (selectedOrder?.supplier?._id) {
                  decForm.setFieldValue("fournisseur", selectedOrder.supplier._id);
                  if (selectedOrder.supplier.name) {
                    decForm.setFieldValue("beneficiaire", selectedOrder.supplier.name);
                  }
                }
              }}
            >
              {supplierOrders.map((order) => {
                const remaining = Math.max(
                  Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
                  0,
                );
                return (
                  <Option key={order._id} value={order._id}>
                    {`${order.orderNumber} - ${order.supplier?.name || "N/A"} (reste ${remaining.toFixed(2)} €)`}
                  </Option>
                );
              })}
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
