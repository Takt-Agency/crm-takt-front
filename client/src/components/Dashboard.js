import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Row,
  Space,
  Spin,
  Tag,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FireOutlined,
  FundProjectionScreenOutlined,
  ReloadOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getAllInvoices,
  getAllProjects,
  getClientStats,
  getFinanceStats,
  getHRStats,
  getInvoiceStats,
  getMe,
  getPipelineStats,
  getTaskAlerts,
  getTaskStats,
} from "../utils/api";
import { canAccessModule, normalizeRole } from "../utils/accessControl";
import "./Dashboard.css";

const DEFAULT_WIDGETS = {
  kpis: true,
  charts: true,
  alerts: true,
  financial: true,
  tasks: true,
};

const ROLE_WIDGET_PRESETS = {
  super_admin: { ...DEFAULT_WIDGETS },
  administrateur: { ...DEFAULT_WIDGETS },
  manager: { ...DEFAULT_WIDGETS },
  commercial: {
    ...DEFAULT_WIDGETS,
    financial: false,
  },
  comptable: { ...DEFAULT_WIDGETS },
  employe: {
    kpis: true,
    charts: false,
    alerts: true,
    financial: false,
    tasks: true,
  },
};

const ROLE_GROUPS = {
  sales: ["super_admin", "administrateur", "manager", "commercial", "comptable"],
  invoice: ["super_admin", "administrateur", "manager", "commercial", "comptable"],
  finance: ["super_admin", "administrateur", "manager", "comptable"],
  hr: ["super_admin", "administrateur", "manager", "employe"],
};

const getWidgetsStorageKey = (role) => `dashboard.widgets.v2.${role || "default"}`;

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const toNumber = (value) => Number(value || 0);

const buildRevenueSeries = (invoices = []) => {
  const months = Array.from({ length: 6 }).map((_, index) =>
    dayjs().subtract(5 - index, "month").startOf("month"),
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice?.type === "Facture" && invoice?.status === "Payée",
  );

  return months.map((month) => {
    const monthKey = month.format("YYYY-MM");
    const value = paidInvoices
      .filter((invoice) =>
        dayjs(invoice.paidDate || invoice.date).format("YYYY-MM") === monthKey,
      )
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0);

    return {
      month: month.format("MMM"),
      value,
    };
  });
};

const computeAveragePaymentDelay = (invoices = []) => {
  const paidInvoices = invoices.filter(
    (invoice) =>
      invoice?.type === "Facture" &&
      invoice?.status === "Payée" &&
      invoice?.paidDate &&
      invoice?.date,
  );

  if (!paidInvoices.length) return 0;

  const totalDays = paidInvoices.reduce((sum, invoice) => {
    const diff = dayjs(invoice.paidDate).diff(dayjs(invoice.date), "day");
    return sum + Math.max(diff, 0);
  }, 0);

  return Math.round(totalDays / paidInvoices.length);
};

const dashboardRequestsByUser = (user) => {
  const canAccessSales = canAccessModule(user, "clients") || canAccessModule(user, "prospects");
  const canAccessInvoice = canAccessModule(user, "invoices");
  const canAccessFinance = canAccessModule(user, "finances");
  const canAccessHR = canAccessModule(user, "hr");

  return {
    clientStats: canAccessSales ? getClientStats() : Promise.resolve(null),
    pipelineStats: canAccessSales ? getPipelineStats() : Promise.resolve(null),
    taskStats: getTaskStats(),
    taskAlerts: getTaskAlerts({ daysAhead: 3, limit: 6 }),
    financeStats: canAccessFinance ? getFinanceStats() : Promise.resolve(null),
    invoiceStats: canAccessInvoice ? getInvoiceStats() : Promise.resolve(null),
    hrStats: canAccessHR ? getHRStats() : Promise.resolve(null),
    projectsPayload: canAccessSales
      ? getAllProjects({ limit: 300, includeArchived: true })
      : Promise.resolve({ projects: [] }),
    invoicesPayload: canAccessInvoice
      ? getAllInvoices({ limit: 300, type: "Facture" })
      : Promise.resolve({ invoices: [] }),
  };
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [role, setRole] = useState("");
  const [widgetsLoaded, setWidgetsLoaded] = useState(false);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);

  const [data, setData] = useState({
    clientStats: null,
    pipelineStats: null,
    taskStats: null,
    taskAlerts: null,
    financeStats: null,
    invoiceStats: null,
    hrStats: null,
    projects: [],
    invoices: [],
  });

  useEffect(() => {
    loadDashboardData(false);

    const intervalId = setInterval(() => {
      loadDashboardData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!role) return;

    const storageKey = getWidgetsStorageKey(role);
    const preset = ROLE_WIDGET_PRESETS[role] || DEFAULT_WIDGETS;

    try {
      const saved = localStorage.getItem(storageKey);
      setWidgets(saved ? { ...preset, ...JSON.parse(saved) } : preset);
    } catch (_error) {
      setWidgets(preset);
    }

    setWidgetsLoaded(true);
  }, [role]);

  useEffect(() => {
    if (!widgetsLoaded || !role) return;
    localStorage.setItem(getWidgetsStorageKey(role), JSON.stringify(widgets));
  }, [widgets, widgetsLoaded, role]);

  const loadDashboardData = async (silentRefresh = false) => {
    if (silentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const me = await getMe();
      const normalizedRole = normalizeRole(me.role);
      setRole(normalizedRole);

      const requests = dashboardRequestsByUser(me);
      const entries = Object.entries(requests);
      const settled = await Promise.allSettled(entries.map(([, promise]) => promise));

      const nextData = {
        clientStats: null,
        pipelineStats: null,
        taskStats: null,
        taskAlerts: null,
        financeStats: null,
        invoiceStats: null,
        hrStats: null,
        projects: [],
        invoices: [],
      };

      settled.forEach((result, index) => {
        const [key] = entries[index];

        if (result.status === "fulfilled") {
          if (key === "projectsPayload") {
            nextData.projects = result.value?.projects || [];
          } else if (key === "invoicesPayload") {
            nextData.invoices = result.value?.invoices || [];
          } else {
            nextData[key] = result.value;
          }
          return;
        }

        if (["taskStats", "taskAlerts"].includes(key)) {
          setError("Certaines données critiques n'ont pas pu être chargées.");
        }
      });

      setData(nextData);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger le dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const monthlyRevenue = useMemo(() => {
    const monthKey = dayjs().format("YYYY-MM");
    return data.invoices
      .filter(
        (invoice) =>
          invoice?.type === "Facture" &&
          invoice?.status === "Payée" &&
          dayjs(invoice.paidDate || invoice.date).format("YYYY-MM") === monthKey,
      )
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0);
  }, [data.invoices]);

  const annualRevenue = useMemo(() => {
    const yearKey = dayjs().format("YYYY");
    return data.invoices
      .filter(
        (invoice) =>
          invoice?.type === "Facture" &&
          invoice?.status === "Payée" &&
          dayjs(invoice.paidDate || invoice.date).format("YYYY") === yearKey,
      )
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0);
  }, [data.invoices]);

  const projectsInProgress = useMemo(
    () =>
      data.projects.filter(
        (project) =>
          !project.isArchived && !["Termine", "Annule"].includes(project.status),
      ).length,
    [data.projects],
  );

  const conversionRate = useMemo(() => {
    const active = toNumber(data.clientStats?.actifClients);
    const pipeline = toNumber(data.clientStats?.pipelineProspects);
    const base = active + pipeline;
    if (!base) return 0;
    return Math.round((active / base) * 100);
  }, [data.clientStats]);

  const occupancyRate = useMemo(() => {
    const total = toNumber(data.hrStats?.employees?.active);
    const present = toNumber(data.hrStats?.attendanceToday?.present);
    if (!total) return 0;
    return Math.min(100, Math.round((present / total) * 100));
  }, [data.hrStats]);

  const avgPaymentDelay = useMemo(
    () => computeAveragePaymentDelay(data.invoices),
    [data.invoices],
  );

  const revenueSeries = useMemo(() => buildRevenueSeries(data.invoices), [data.invoices]);

  const pipelineSeries = useMemo(() => {
    const stages = data.pipelineStats?.stages || [];
    return stages.map((stage) => ({
      stage: stage.stage,
      deals: toNumber(stage.count),
      value: Math.round(toNumber(stage.total)),
    }));
  }, [data.pipelineStats]);

  const roleKpis = useMemo(() => {
    if (role === "employe") {
      return [
        {
          label: "Mes tâches en cours",
          value: toNumber(data.taskStats?.byStatus?.["En cours"]),
          hint: "Suivi opérationnel",
          icon: <FundProjectionScreenOutlined />,
        },
        {
          label: "Mes tâches en retard",
          value: toNumber(data.taskStats?.overdue),
          hint: "Priorité immédiate",
          icon: <WarningOutlined />,
        },
        {
          label: "Deadline aujourd'hui",
          value: toNumber(data.taskStats?.dueToday),
          hint: "À traiter aujourd'hui",
          icon: <ClockCircleOutlined />,
        },
        {
          label: "Congés approuvés",
          value: toNumber(data.hrStats?.leaves?.approved),
          hint: "Mon statut RH",
          icon: <TeamOutlined />,
        },
      ];
    }

    return [
      {
        label: "CA mensuel",
        value: formatCurrency(monthlyRevenue),
        hint: `CA annuel: ${formatCurrency(annualRevenue)}`,
        icon: <DollarOutlined />,
      },
      {
        label: "Clients actifs",
        value: toNumber(data.clientStats?.actifClients),
        hint: `${conversionRate}% conversion prospects`,
        icon: <TeamOutlined />,
      },
      {
        label: "Projets en cours",
        value: projectsInProgress,
        hint: `${toNumber(data.taskStats?.overdue)} tâches en retard`,
        icon: <FundProjectionScreenOutlined />,
      },
      {
        label: "Délai moyen paiement",
        value: `${avgPaymentDelay} j`,
        hint: `${toNumber(data.invoiceStats?.overdueCount)} factures en retard`,
        icon: <ClockCircleOutlined />,
      },
    ];
  }, [
    role,
    monthlyRevenue,
    annualRevenue,
    data.clientStats,
    conversionRate,
    projectsInProgress,
    data.taskStats,
    avgPaymentDelay,
    data.invoiceStats,
    data.hrStats,
  ]);

  const alertItems = useMemo(
    () =>
      [
        ...(data.taskAlerts?.overdue || []).map((task) => ({
          key: `task-overdue-${task._id}`,
          type: "error",
          text: `Tâche en retard: ${task.title}`,
        })),
        ...(data.taskAlerts?.dueSoon || []).map((task) => ({
          key: `task-due-${task._id}`,
          type: "warning",
          text: `Deadline proche: ${task.title}`,
        })),
        ...(toNumber(data.financeStats?.supplierOrdersOverdue) > 0
          ? [
              {
                key: "supplier-overdue",
                type: "error",
                text: `${data.financeStats.supplierOrdersOverdue} paiements fournisseurs en retard`,
              },
            ]
          : []),
      ].slice(0, 8),
    [data.taskAlerts, data.financeStats],
  );

  const exportCsv = () => {
    try {
      const rows = [
        ["Dashboard Nexia", ""],
        ["Role", role],
        ["Generated at", dayjs().format("YYYY-MM-DD HH:mm:ss")],
        ["", ""],
        ["Metric", "Value"],
        ["CA mensuel", formatCurrency(monthlyRevenue)],
        ["CA annuel", formatCurrency(annualRevenue)],
        ["Clients actifs", toNumber(data.clientStats?.actifClients)],
        ["Conversion prospects", `${conversionRate}%`],
        ["Projets en cours", projectsInProgress],
        ["Tâches en retard", toNumber(data.taskStats?.overdue)],
        ["Délai moyen paiement", `${avgPaymentDelay} jours`],
        ["", ""],
        ["Alertes", ""],
      ];

      alertItems.forEach((item) => rows.push([item.type, item.text]));
      if (!alertItems.length) rows.push(["info", "Aucune alerte"]);

      const csvContent = rows
        .map((line) =>
          line
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-${dayjs().format("YYYYMMDD-HHmm")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Export CSV généré");
    } catch (exportError) {
      message.error(exportError.message || "Erreur export CSV");
    }
  };

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      doc.setFontSize(16);
      doc.text("Nexia Digital CRM - Dashboard", 40, 42);
      doc.setFontSize(10);
      doc.text(`Role: ${role}`, 40, 60);
      doc.text(`Date: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`, 40, 74);

      autoTable(doc, {
        startY: 90,
        head: [["KPI", "Valeur"]],
        body: [
          ["CA mensuel", formatCurrency(monthlyRevenue)],
          ["CA annuel", formatCurrency(annualRevenue)],
          ["Clients actifs", String(toNumber(data.clientStats?.actifClients))],
          ["Conversion prospects", `${conversionRate}%`],
          ["Projets en cours", String(projectsInProgress)],
          ["Tâches en retard", String(toNumber(data.taskStats?.overdue))],
          ["Délai moyen paiement", `${avgPaymentDelay} jours`],
        ],
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [["Alertes", "Détail"]],
        body:
          alertItems.length > 0
            ? alertItems.map((item) => [item.type.toUpperCase(), item.text])
            : [["INFO", "Aucune alerte"]],
      });

      if (pipelineSeries.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 14,
          head: [["Pipeline", "Deals", "Valeur"]],
          body: pipelineSeries.map((stage) => [
            stage.stage,
            String(stage.deals),
            formatCurrency(stage.value),
          ]),
        });
      }

      doc.save(`dashboard-${dayjs().format("YYYYMMDD-HHmm")}.pdf`);
      message.success("Export PDF généré");
    } catch (exportError) {
      message.error(exportError.message || "Erreur export PDF");
    }
  };

  const widgetOptions = [
    { key: "kpis", label: "KPIs" },
    { key: "charts", label: "Graphiques" },
    { key: "alerts", label: "Alertes" },
    { key: "financial", label: "Résumé financier" },
    { key: "tasks", label: "Tâches urgentes" },
  ];

  if (loading) {
    return (
      <div className="dashboard-content dashboard-loading-wrap">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <p className="section-kicker">TABLEAU DE BORD</p>
          <h2 className="page-title">
            Vue 360 <span>Temps Réel</span>
          </h2>
          <p className="page-subtitle">
            KPIs consolidés: clients, pipeline, opérations, finances et RH.
            {lastUpdated ? ` Dernière MAJ: ${dayjs(lastUpdated).format("HH:mm:ss")}` : ""}
          </p>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={exportPdf}>
            Export PDF
          </Button>
          <Button
            type="primary"
            className="export-btn"
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={() => loadDashboardData(true)}
          >
            Actualiser
          </Button>
        </Space>
      </div>

      {error && <Alert style={{ marginBottom: 16 }} type="warning" showIcon title={error} />}

      <Card className="dashboard-widget-config-card">
        <Space wrap>
          <span className="task-subtext">Widgets affichés:</span>
          {widgetOptions.map((option) => (
            <Checkbox
              key={option.key}
              checked={widgets[option.key]}
              onChange={(event) =>
                setWidgets((current) => ({
                  ...current,
                  [option.key]: event.target.checked,
                }))
              }
            >
              {option.label}
            </Checkbox>
          ))}
          <Tag color="processing">Preset: {role || "default"}</Tag>
        </Space>
      </Card>

      {widgets.kpis && (
        <Row gutter={[20, 20]} style={{ marginTop: "20px" }}>
          {roleKpis.map((item) => (
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
      )}

      {widgets.charts && (
        <Row gutter={[20, 20]} style={{ marginTop: "8px" }}>
          <Col xs={24} lg={12}>
            <Card className="highlight-card" title="Revenus mensuels (6 derniers mois)">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Revenus"
                      stroke="#ff1f8f"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card className="highlight-card" title="Évolution du pipeline">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={pipelineSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip formatter={(value, name) =>
                      name === "value" ? formatCurrency(value) : value
                    }
                    />
                    <Legend />
                    <Bar dataKey="deals" name="Deals" fill="#37c6f5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="value" name="Valeur" fill="#7082ff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {(widgets.alerts || widgets.financial || widgets.tasks) && (
        <Row gutter={[24, 24]} style={{ marginTop: "8px" }}>
          {widgets.alerts && (
            <Col xs={24} lg={8}>
              <Card className="highlight-card" title="Alertes en temps réel" extra={<WarningOutlined />}>
                {alertItems.length === 0 ? (
                  <p className="task-subtext">Aucune alerte critique actuellement.</p>
                ) : (
                  <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                    {alertItems.map((item) => (
                      <Alert key={item.key} type={item.type} title={item.text} showIcon />
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          )}

          {widgets.financial && (
            <Col xs={24} lg={8}>
              <Card className="highlight-card" title="Résumé financier">
                <div className="summary-grid">
                  <div>
                    <p className="summary-label">Trésorerie globale</p>
                    <h4>{formatCurrency(data.financeStats?.tresorerieGlobale)}</h4>
                  </div>
                  <div>
                    <p className="summary-label">Factures en attente</p>
                    <h4>{formatCurrency(data.invoiceStats?.pendingRevenue)}</h4>
                  </div>
                  <div>
                    <p className="summary-label">Flux net</p>
                    <h4>{formatCurrency(data.financeStats?.fluxNet)}</h4>
                  </div>
                  <div>
                    <p className="summary-label">Occupation équipes</p>
                    <h4>{occupancyRate}%</h4>
                  </div>
                </div>
              </Card>
            </Col>
          )}

          {widgets.tasks && (
            <Col xs={24} lg={8}>
              <Card className="highlight-card" title="Tâches urgentes" extra={<FireOutlined />}>
                <div className="summary-grid compact">
                  <div>
                    <p className="summary-label">En retard</p>
                    <h4>{toNumber(data.taskStats?.overdue)}</h4>
                  </div>
                  <div>
                    <p className="summary-label">Échéance aujourd'hui</p>
                    <h4>{toNumber(data.taskStats?.dueToday)}</h4>
                  </div>
                  <div>
                    <p className="summary-label">À faire</p>
                    <h4>{toNumber(data.taskStats?.byStatus?.["À faire"])}</h4>
                  </div>
                  <div>
                    <p className="summary-label">En cours</p>
                    <h4>{toNumber(data.taskStats?.byStatus?.["En cours"])}</h4>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Tag color="processing">Rôle actif: {role || "-"}</Tag>
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
}

export default Dashboard;
