import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Tabs,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import {
  getMe,
  getHRStats,
  getLeaveBalances,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  getAllAttendance,
  recordAttendance,
  exportLeavesExcel,
  exportLeavesPDF,
  exportAttendanceExcel,
  exportAttendancePDF,
  getPayrollPeriods,
  createPayrollPeriod,
  generatePayrollSlips,
  getPayrollSlips,
  approvePayrollPeriod,
  markPayrollPeriodPaid,
  exportPayrollExcel,
  exportPayrollPDF,
} from "../utils/api";
import "./HRManagement.css";

dayjs.locale("fr");

const { Option } = Select;

const EMPLOYEE_STATUS = {
  actif: { label: "Actif", color: "success" },
  inactif: { label: "Inactif", color: "default" },
  en_conge: { label: "En congé", color: "warning" },
};

const LEAVE_STATUS = {
  en_attente: { label: "En attente", color: "processing" },
  approuve: { label: "Approuvé", color: "success" },
  refuse: { label: "Refusé", color: "error" },
};

const ATTENDANCE_STATUS = {
  present: { label: "Présent", color: "success" },
  absent: { label: "Absent", color: "error" },
  retard: { label: "Retard", color: "warning" },
  conge: { label: "En congé", color: "processing" },
};

function HRManagement() {
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [payrollSlips, setPayrollSlips] = useState([]);
  const [activePayrollPeriodId, setActivePayrollPeriodId] = useState(null);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingLeaveBalances, setLoadingLeaveBalances] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  const [searchEmployee, setSearchEmployee] = useState("");

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [payrollPeriodModalOpen, setPayrollPeriodModalOpen] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);

  const [employeeForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [payrollPeriodForm] = Form.useForm();

  const canApproveLeave = ["super_admin", "administrateur", "manager"].includes(
    currentUser?.role,
  );
  const canManageEmployees = [
    "super_admin",
    "administrateur",
    "manager",
  ].includes(currentUser?.role);
  const canViewAllLeaveBalances = [
    "super_admin",
    "administrateur",
    "manager",
  ].includes(currentUser?.role);
  const canManagePayroll = [
    "super_admin",
    "administrateur",
    "manager",
    "comptable",
  ].includes(currentUser?.role);

  useEffect(() => {
    const initialize = async () => {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch (error) {
        console.error("Error loading current user:", error);
      }

      await Promise.all([
        loadStats(),
        loadEmployees(),
        loadLeaves(),
        loadAttendance(),
        loadLeaveBalances(),
        loadPayrollPeriods(),
      ]);
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const data = await getHRStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getAllEmployees({ search: searchEmployee });
      setEmployees(data.employees || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des employés");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const data = await getAllLeaves();
      setLeaves(data.leaves || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des congés");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const data = await getAllAttendance();
      setAttendance(data.attendance || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement du pointage");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadLeaveBalances = async () => {
    try {
      setLoadingLeaveBalances(true);
      const data = await getLeaveBalances({ year: dayjs().year() });
      setLeaveBalances(data.leaveBalances || []);
    } catch (error) {
      message.error(
        error.message || "Erreur lors du chargement des soldes de congés",
      );
    } finally {
      setLoadingLeaveBalances(false);
    }
  };

  const loadPayrollPeriods = async () => {
    try {
      setLoadingPayroll(true);
      const data = await getPayrollPeriods();
      const periods = data.periods || [];
      setPayrollPeriods(periods);

      if (!activePayrollPeriodId && periods.length > 0) {
        setActivePayrollPeriodId(periods[0]._id);
        await loadPayrollSlips(periods[0]._id);
      } else if (activePayrollPeriodId) {
        await loadPayrollSlips(activePayrollPeriodId);
      }
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement de la paie");
    } finally {
      setLoadingPayroll(false);
    }
  };

  const loadPayrollSlips = async (periodId) => {
    if (!periodId) return;
    try {
      setLoadingPayroll(true);
      const data = await getPayrollSlips({ periodId });
      setPayrollSlips(data.slips || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des fiches");
    } finally {
      setLoadingPayroll(false);
    }
  };

  const onCreatePayrollPeriod = async (values) => {
    try {
      await createPayrollPeriod(values);
      message.success("Période créée");
      setPayrollPeriodModalOpen(false);
      payrollPeriodForm.resetFields();
      await loadPayrollPeriods();
    } catch (error) {
      message.error(error.message || "Erreur lors de la création de la période");
    }
  };

  const onGeneratePayroll = async () => {
    let periodId = activePayrollPeriodId;

    if (!periodId && payrollPeriods.length > 0) {
      periodId = payrollPeriods[0]._id;
      setActivePayrollPeriodId(periodId);
    }

    if (!periodId) {
      message.warning("Veuillez sélectionner une période");
      return;
    }

    try {
      await generatePayrollSlips({ periodId });
      message.success("Paie générée");
      await loadPayrollSlips(periodId);
      await loadPayrollPeriods();
    } catch (error) {
      message.error(error.message || "Erreur lors de la génération");
    }
  };

  const onApprovePayroll = async () => {
    if (!activePayrollPeriodId) return;
    try {
      await approvePayrollPeriod(activePayrollPeriodId);
      message.success("Période approuvée");
      await loadPayrollPeriods();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'approbation");
    }
  };

  const onMarkPayrollPaid = async () => {
    if (!activePayrollPeriodId) return;
    try {
      await markPayrollPeriodPaid(activePayrollPeriodId);
      message.success("Période marquée payée");
      await loadPayrollPeriods();
      await loadPayrollSlips(activePayrollPeriodId);
    } catch (error) {
      message.error(error.message || "Erreur lors du paiement");
    }
  };

  const onSubmitEmployee = async (values) => {
    try {
      const payload = {
        ...values,
        hireDate: values.hireDate ? values.hireDate.toISOString() : undefined,
        salaryEffectiveFrom: values.salaryEffectiveFrom
          ? values.salaryEffectiveFrom.toISOString()
          : undefined,
        salaryEffectiveTo: values.salaryEffectiveTo
          ? values.salaryEffectiveTo.toISOString()
          : undefined,
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee._id, payload);
        message.success("Employé mis à jour avec succès");
      } else {
        await createEmployee(payload);
        message.success("Employé créé avec succès");
      }

      setEmployeeModalOpen(false);
      setEditingEmployee(null);
      employeeForm.resetFields();
      await loadEmployees();
      await loadStats();
      await loadLeaveBalances();
    } catch (error) {
      message.error(
        error.message || "Erreur lors de l'enregistrement de l'employé",
      );
    }
  };

  const onEditEmployee = (employee) => {
    setEditingEmployee(employee);
    employeeForm.setFieldsValue({
      ...employee,
      hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
      salaryEffectiveFrom: employee.salaryEffectiveFrom
        ? dayjs(employee.salaryEffectiveFrom)
        : null,
      salaryEffectiveTo: employee.salaryEffectiveTo
        ? dayjs(employee.salaryEffectiveTo)
        : null,
    });
    setEmployeeModalOpen(true);
  };

  const onDeleteEmployee = async (id) => {
    try {
      await deleteEmployee(id);
      message.success("Employé supprimé avec succès");
      await loadEmployees();
      await loadLeaves();
      await loadAttendance();
      await loadStats();
      await loadLeaveBalances();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const onSubmitLeave = async (values) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };

      await createLeave(payload);
      message.success("Demande de congé créée avec succès");
      setLeaveModalOpen(false);
      leaveForm.resetFields();
      await loadLeaves();
      await loadStats();
      await loadLeaveBalances();
    } catch (error) {
      message.error(error.message || "Erreur lors de la création du congé");
    }
  };

  const onExportLeavesExcel = async () => {
    try {
      await exportLeavesExcel();
      message.success("Export Excel des congés lancé");
    } catch (error) {
      message.error(error.message || "Erreur export Excel des congés");
    }
  };

  const onExportLeavesPDF = async () => {
    try {
      await exportLeavesPDF();
      message.success("Export PDF des congés lancé");
    } catch (error) {
      message.error(error.message || "Erreur export PDF des congés");
    }
  };

  const onExportAttendanceExcel = async () => {
    try {
      await exportAttendanceExcel();
      message.success("Export Excel des présences lancé");
    } catch (error) {
      message.error(error.message || "Erreur export Excel des présences");
    }
  };

  const onExportAttendancePDF = async () => {
    try {
      await exportAttendancePDF();
      message.success("Export PDF des présences lancé");
    } catch (error) {
      message.error(error.message || "Erreur export PDF des présences");
    }
  };

  const onExportPayrollExcel = async () => {
    if (!activePayrollPeriodId) {
      message.warning("Veuillez sélectionner une période");
      return;
    }

    try {
      await exportPayrollExcel({ periodId: activePayrollPeriodId });
      message.success("Export Excel de la paie lancé");
    } catch (error) {
      message.error(error.message || "Erreur export Excel de la paie");
    }
  };

  const onExportPayrollPDF = async () => {
    if (!activePayrollPeriodId) {
      message.warning("Veuillez sélectionner une période");
      return;
    }

    try {
      await exportPayrollPDF({ periodId: activePayrollPeriodId });
      message.success("Export PDF de la paie lancé");
    } catch (error) {
      message.error(error.message || "Erreur export PDF de la paie");
    }
  };

  const onLeaveDecision = async (leaveId, status) => {
    try {
      await updateLeaveStatus(leaveId, { status });
      message.success("Statut du congé mis à jour");
      await loadLeaves();
      await loadEmployees();
      await loadStats();
      await loadLeaveBalances();
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour du congé");
    }
  };

  const onSubmitAttendance = async (values) => {
    try {
      const date = values.date.startOf("day");

      let checkInISO;
      let checkOutISO;

      if (values.checkIn) {
        checkInISO = date
          .hour(values.checkIn.hour())
          .minute(values.checkIn.minute())
          .second(0)
          .toISOString();
      }

      if (values.checkOut) {
        checkOutISO = date
          .hour(values.checkOut.hour())
          .minute(values.checkOut.minute())
          .second(0)
          .toISOString();
      }

      await recordAttendance({
        employee: values.employee,
        date: date.toISOString(),
        checkIn: checkInISO,
        checkOut: checkOutISO,
        status: values.status,
        notes: values.notes,
      });

      message.success("Pointage enregistré avec succès");
      setAttendanceModalOpen(false);
      attendanceForm.resetFields();
      await loadAttendance();
      await loadStats();
      await loadLeaveBalances();
    } catch (error) {
      message.error(
        error.message || "Erreur lors de l'enregistrement du pointage",
      );
    }
  };

  const employeeColumns = [
    {
      title: "Employé",
      key: "fullName",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Poste",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Département",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Date d'embauche",
      dataIndex: "hireDate",
      key: "hireDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={EMPLOYEE_STATUS[status]?.color || "default"}>
          {EMPLOYEE_STATUS[status]?.label || status}
        </Tag>
      ),
    },
    ...(canManageEmployees
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <div className="hr-actions">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => onEditEmployee(record)}
                >
                  Modifier
                </Button>
                <Popconfirm
                  title="Supprimer cet employé ?"
                  okText="Supprimer"
                  cancelText="Annuler"
                  onConfirm={() => onDeleteEmployee(record._id)}
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    Supprimer
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];

  const leaveColumns = [
    {
      title: "Employé",
      key: "employee",
      render: (_, record) =>
        record.employee
          ? `${record.employee.firstName} ${record.employee.lastName}`
          : "-",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value) => value?.replaceAll("_", " "),
    },
    {
      title: "Période",
      key: "period",
      render: (_, record) =>
        `${dayjs(record.startDate).format("DD/MM/YYYY")} - ${dayjs(record.endDate).format("DD/MM/YYYY")}`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={LEAVE_STATUS[status]?.color || "default"}>
          {LEAVE_STATUS[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const balance = leaveBalanceByEmployeeId[record.employee?._id];
        const remainingDays = balance?.remainingDays;
        const requestedDays = getLeaveRequestDays(record);
        const exceedsLimit =
          record.type === "annuel" &&
          typeof remainingDays === "number" &&
          requestedDays > remainingDays;

        return canApproveLeave ? (
          <div className="hr-actions">
            <span style={{ marginRight: 8, color: "#4b5563" }}>
              Restants:{" "}
              {typeof remainingDays === "number" ? `${remainingDays} j` : "-"}
            </span>
            <Button
              type="link"
              disabled={record.status === "approuve" || exceedsLimit}
              onClick={() => onLeaveDecision(record._id, "approuve")}
            >
              Approuver
            </Button>
            <Button
              type="link"
              danger
              disabled={record.status === "refuse"}
              onClick={() => onLeaveDecision(record._id, "refuse")}
            >
              Refuser
            </Button>
          </div>
        ) : (
          <span>-</span>
        );
      },
    },
  ];

  const attendanceColumns = [
    {
      title: "Employé",
      key: "employee",
      render: (_, record) =>
        record.employee
          ? `${record.employee.firstName} ${record.employee.lastName}`
          : "-",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Entrée",
      dataIndex: "checkIn",
      key: "checkIn",
      render: (value) => (value ? dayjs(value).format("HH:mm") : "-"),
    },
    {
      title: "Sortie",
      dataIndex: "checkOut",
      key: "checkOut",
      render: (value) => (value ? dayjs(value).format("HH:mm") : "-"),
    },
    {
      title: "Heures",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (value) => (value ? `${value} h` : "0 h"),
    },
    {
      title: "Présence",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={ATTENDANCE_STATUS[status]?.color || "default"}>
          {ATTENDANCE_STATUS[status]?.label || status}
        </Tag>
      ),
    },
  ];

  const leaveBalanceColumns = [
    {
      title: "Employé",
      key: "employee",
      render: (_, record) =>
        record.employee
          ? `${record.employee.firstName} ${record.employee.lastName}`
          : "-",
    },
    {
      title: "Département",
      key: "department",
      render: (_, record) => record.employee?.department || "-",
    },
    {
      title: "Quota annuel",
      dataIndex: "annualAllowance",
      key: "annualAllowance",
      render: (value) => `${value || 0} j`,
    },
    {
      title: "Congés pris",
      dataIndex: "approvedDays",
      key: "approvedDays",
      render: (value) => `${value || 0} j`,
    },
    {
      title: "En attente",
      dataIndex: "pendingDays",
      key: "pendingDays",
      render: (value) => `${value || 0} j`,
    },
    {
      title: "Restants",
      dataIndex: "remainingDays",
      key: "remainingDays",
      render: (value) => (
        <Tag color={value < 0 ? "error" : "success"}>{`${value || 0} j`}</Tag>
      ),
    },
  ];

  const leaveBalanceByEmployeeId = useMemo(() => {
    return leaveBalances.reduce((accumulator, entry) => {
      const employeeId = entry?.employee?._id;
      if (employeeId) {
        accumulator[employeeId] = entry;
      }
      return accumulator;
    }, {});
  }, [leaveBalances]);

  const getLeaveRequestDays = (record) => {
    if (!record?.startDate || !record?.endDate) return 0;
    const start = dayjs(record.startDate).startOf("day");
    const end = dayjs(record.endDate).startOf("day");
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;
    return end.diff(start, "day") + 1;
  };

  const payrollPeriodColumns = [
    {
      title: "Période",
      key: "period",
      render: (_, record) => `${String(record.month).padStart(2, "0")}/${record.year}`,
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, record) =>
        `${dayjs(record.startDate).format("DD/MM/YYYY")} - ${dayjs(record.endDate).format("DD/MM/YYYY")}`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "paid" ? "success" : status === "approved" ? "processing" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="hr-actions">
          <Button type="link" onClick={() => {
            setActivePayrollPeriodId(record._id);
            loadPayrollSlips(record._id);
          }}>
            Ouvrir
          </Button>
        </div>
      ),
    },
  ];

  const payrollSlipColumns = [
    {
      title: "Employé",
      key: "employee",
      render: (_, record) =>
        record.employee
          ? `${record.employee.firstName} ${record.employee.lastName}`
          : "-",
    },
    {
      title: "Salaire base",
      dataIndex: "baseSalary",
      key: "baseSalary",
      render: (value) => `${value || 0}`,
    },
    {
      title: "Heures sup",
      dataIndex: "overtimeHours",
      key: "overtimeHours",
      render: (value) => `${value || 0} h`,
    },
    {
      title: "Bonus",
      dataIndex: "bonusAmount",
      key: "bonusAmount",
      render: (value) => `${value || 0}`,
    },
    {
      title: "Absences",
      dataIndex: "absentDays",
      key: "absentDays",
      render: (value) => `${value || 0} j`,
    },
    {
      title: "Congés sans solde",
      dataIndex: "leaveDaysUnpaid",
      key: "leaveDaysUnpaid",
      render: (value) => `${value || 0} j`,
    },
    {
      title: "Brut",
      dataIndex: "grossSalary",
      key: "grossSalary",
      render: (value) => `${value || 0}`,
    },
    {
      title: "Net",
      dataIndex: "netSalary",
      key: "netSalary",
      render: (value) => `${value || 0}`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "paid" ? "success" : status === "approved" ? "processing" : "default"}>
          {status}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: "employees",
      label: "Employés",
      children: (
        <Card>
          <div className="hr-toolbar">
            <Input.Search
              placeholder="Rechercher un employé"
              allowClear
              style={{ maxWidth: 360 }}
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              onSearch={loadEmployees}
            />
            {canManageEmployees ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingEmployee(null);
                  employeeForm.resetFields();
                  setEmployeeModalOpen(true);
                }}
              >
                Nouvel employé
              </Button>
            ) : null}
          </div>
          <Table
            rowKey="_id"
            dataSource={employees}
            columns={employeeColumns}
            loading={loadingEmployees}
            pagination={{ pageSize: 10 }}
          />

          {canViewAllLeaveBalances ? (
            <Card
              title="Soldes de congés (année en cours)"
              style={{ marginTop: 16 }}
            >
              <Table
                rowKey={(record) =>
                  record.employee?._id ||
                  `${record.year}-${record.employee?.email}`
                }
                dataSource={leaveBalances}
                columns={leaveBalanceColumns}
                loading={loadingLeaveBalances}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          ) : null}
        </Card>
      ),
    },
    {
      key: "leaves",
      label: "Congés",
      children: (
        <Card>
          <div className="hr-toolbar">
            <div className="hr-actions">
              <Button icon={<DownloadOutlined />} onClick={onExportLeavesExcel}>
                Export Excel
              </Button>
              <Button icon={<DownloadOutlined />} onClick={onExportLeavesPDF}>
                Export PDF
              </Button>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                leaveForm.resetFields();
                setLeaveModalOpen(true);
              }}
            >
              Nouvelle demande
            </Button>
          </div>
          <Table
            rowKey="_id"
            dataSource={leaves}
            columns={leaveColumns}
            loading={loadingLeaves}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: "attendance",
      label: "Pointage & Présence",
      children: (
        <Card>
          <div className="hr-toolbar">
            <div className="hr-actions">
              <Button
                icon={<DownloadOutlined />}
                onClick={onExportAttendanceExcel}
              >
                Export Excel
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={onExportAttendancePDF}
              >
                Export PDF
              </Button>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                attendanceForm.resetFields();
                setAttendanceModalOpen(true);
              }}
            >
              Pointer une présence
            </Button>
          </div>
          <Table
            rowKey="_id"
            dataSource={attendance}
            columns={attendanceColumns}
            loading={loadingAttendance}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: "payroll",
      label: "Paie",
      children: (
        <Card>
          <div className="hr-toolbar">
            <div className="hr-actions">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  payrollPeriodForm.resetFields();
                  setPayrollPeriodModalOpen(true);
                }}
                disabled={!canManagePayroll}
              >
                Nouvelle période
              </Button>
              <Button onClick={onGeneratePayroll} disabled={!canManagePayroll}>
                Générer la paie
              </Button>
              <Button onClick={onApprovePayroll} disabled={!canManagePayroll}>
                Approuver
              </Button>
              <Button onClick={onMarkPayrollPaid} disabled={!canManagePayroll}>
                Marquer payée
              </Button>
              <Button onClick={onExportPayrollExcel}>
                Export Excel
              </Button>
              <Button onClick={onExportPayrollPDF}>
                Export PDF
              </Button>
            </div>
          </div>

          <Row gutter={12}>
            <Col xs={24} md={10}>
              <Card title="Périodes de paie">
                <Table
                  rowKey="_id"
                  dataSource={payrollPeriods}
                  columns={payrollPeriodColumns}
                  loading={loadingPayroll}
                  pagination={{ pageSize: 6 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={14}>
              <Card
                title={
                  activePayrollPeriodId
                    ? "Fiches de paie"
                    : "Sélectionnez une période"
                }
              >
                <Table
                  rowKey="_id"
                  dataSource={payrollSlips}
                  columns={payrollSlipColumns}
                  loading={loadingPayroll}
                  pagination={{ pageSize: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div className="dashboard-content hr-page">
      <div className="content-header">
        <div>
          <p className="section-kicker">RESSOURCES HUMAINES</p>
          <h2 className="page-title">Ressources humaines</h2>
          <p className="page-subtitle">
            Gérez les employés, les congés, le pointage et la présence
          </p>
        </div>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Employés total"
                value={stats.employees?.total || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Congés en attente"
                value={stats.leaves?.pending || 0}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Présents aujourd'hui"
                value={stats.attendanceToday?.present || 0}
                prefix={<CheckSquareOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Retards aujourd'hui"
                value={stats.attendanceToday?.retard || 0}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs items={tabItems} />

      <Modal
        title={editingEmployee ? "Modifier l'employé" : "Nouvel employé"}
        open={employeeModalOpen}
        onCancel={() => {
          setEmployeeModalOpen(false);
          setEditingEmployee(null);
          employeeForm.resetFields();
        }}
        onOk={() => employeeForm.submit()}
        okText={editingEmployee ? "Enregistrer" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={employeeForm} layout="vertical" onFinish={onSubmitEmployee}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="Prénom"
                rules={[{ required: true, message: "Prénom requis" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Nom"
                rules={[{ required: true, message: "Nom requis" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Email requis" }]}
          >
            <Input type="email" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Poste"
                rules={[{ required: true, message: "Poste requis" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Département">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="hireDate"
                label="Date d'embauche"
                rules={[{ required: true, message: "Date d'embauche requise" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Statut" initialValue="actif">
                <Select>
                  <Option value="actif">Actif</Option>
                  <Option value="inactif">Inactif</Option>
                  <Option value="en_conge">En congé</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Téléphone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary" label="Salaire">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryType" label="Type de salaire" initialValue="monthly">
                <Select>
                  <Option value="monthly">Mensuel</Option>
                  <Option value="hourly">Horaire</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentFrequency"
                label="Fréquence de paiement"
                initialValue="monthly"
              >
                <Select>
                  <Option value="monthly">Mensuel</Option>
                  <Option value="biweekly">Bi-hebdomadaire</Option>
                  <Option value="weekly">Hebdomadaire</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="Devise" initialValue="MAD">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="annualLeaveAllowance"
                label="Quota congés annuel (jours)"
                initialValue={22}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="bankName" label="Banque">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankAccountName" label="Titulaire du compte">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="iban" label="IBAN">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rib" label="RIB">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="salaryEffectiveFrom" label="Salaire effectif du">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryEffectiveTo" label="Salaire effectif au">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="overtimeRate" label="Taux heures sup">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bonusAmount" label="Bonus mensuel">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="allowanceAmount" label="Prime mensuelle">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="advanceAmount" label="Avance mensuelle">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxRate" label="Taux d'impot (%)">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="socialChargesRate" label="Charges sociales (%)">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="payrollNotes" label="Notes paie">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nouvelle demande de congé"
        open={leaveModalOpen}
        onCancel={() => {
          setLeaveModalOpen(false);
          leaveForm.resetFields();
        }}
        onOk={() => leaveForm.submit()}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={leaveForm} layout="vertical" onFinish={onSubmitLeave}>
          {!currentUser || currentUser.role !== "employe" ? (
            <Form.Item
              name="employee"
              label="Employé"
              rules={[{ required: true, message: "Employé requis" }]}
            >
              <Select showSearch optionFilterProp="children">
                {employees.map((employee) => (
                  <Option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}

          <Form.Item name="type" label="Type de congé" initialValue="annuel">
            <Select>
              <Option value="annuel">Annuel</Option>
              <Option value="maladie">Maladie</Option>
              <Option value="sans_solde">Sans solde</Option>
              <Option value="maternite">Maternité</Option>
              <Option value="autre">Autre</Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Date de début"
                rules={[{ required: true, message: "Date de début requise" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Date de fin"
                rules={[{ required: true, message: "Date de fin requise" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Motif"
            rules={[{ required: true, message: "Motif requis" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Enregistrer le pointage"
        open={attendanceModalOpen}
        onCancel={() => {
          setAttendanceModalOpen(false);
          attendanceForm.resetFields();
        }}
        onOk={() => attendanceForm.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form
          form={attendanceForm}
          layout="vertical"
          onFinish={onSubmitAttendance}
        >
          {!currentUser || currentUser.role !== "employe" ? (
            <Form.Item
              name="employee"
              label="Employé"
              rules={[{ required: true, message: "Employé requis" }]}
            >
              <Select showSearch optionFilterProp="children">
                {employees.map((employee) => (
                  <Option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: "Date requise" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Statut" initialValue="present">
                <Select>
                  <Option value="present">Présent</Option>
                  <Option value="absent">Absent</Option>
                  <Option value="retard">Retard</Option>
                  <Option value="conge">En congé</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="checkIn" label="Heure d'entrée">
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkOut" label="Heure de sortie">
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nouvelle période de paie"
        open={payrollPeriodModalOpen}
        onCancel={() => {
          setPayrollPeriodModalOpen(false);
          payrollPeriodForm.resetFields();
        }}
        onOk={() => payrollPeriodForm.submit()}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form
          form={payrollPeriodForm}
          layout="vertical"
          onFinish={onCreatePayrollPeriod}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="month"
                label="Mois"
                rules={[{ required: true, message: "Mois requis" }]}
              >
                <Select>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <Option key={index + 1} value={index + 1}>
                      {dayjs().month(index).format("MMMM")}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="year"
                label="Année"
                rules={[{ required: true, message: "Année requise" }]}
              >
                <Select>
                  {Array.from({ length: 5 }).map((_, offset) => {
                    const year = dayjs().year() - 2 + offset;
                    return (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default HRManagement;
