import React, { useEffect, useState } from "react";
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

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [searchEmployee, setSearchEmployee] = useState("");

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);

  const [employeeForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();

  const canApproveLeave = ["super_admin", "administrateur", "admin"].includes(
    currentUser?.role,
  );

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

  const onSubmitEmployee = async (values) => {
    try {
      const payload = {
        ...values,
        hireDate: values.hireDate ? values.hireDate.toISOString() : undefined,
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

  const onLeaveDecision = async (leaveId, status) => {
    try {
      await updateLeaveStatus(leaveId, { status });
      message.success("Statut du congé mis à jour");
      await loadLeaves();
      await loadEmployees();
      await loadStats();
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
      render: (_, record) =>
        canApproveLeave ? (
          <div className="hr-actions">
            <Button
              type="link"
              disabled={record.status === "approuve"}
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
        ),
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
          </div>
          <Table
            rowKey="_id"
            dataSource={employees}
            columns={employeeColumns}
            loading={loadingEmployees}
            pagination={{ pageSize: 10 }}
          />
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
          </Row>
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
    </div>
  );
}

export default HRManagement;
