import React, { useState, useEffect } from "react";
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
  Checkbox,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tooltip,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import "./Tasks.css";
import {
  getAllTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getAllClients,
  getAllDeals,
  getAllUsers,
} from "../utils/api";

dayjs.extend(relativeTime);
dayjs.locale("fr");

const { TextArea } = Input;
const { Option } = Select;

const STATUSES = {
  "À faire": {
    label: "À faire",
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  "En cours": {
    label: "En cours",
    color: "processing",
    icon: <ExclamationCircleOutlined />,
  },
  Terminée: {
    label: "Terminée",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
};

const PRIORITIES = {
  Urgente: { label: "Urgente", color: "red" },
  Haute: { label: "Haute", color: "orange" },
  Moyenne: { label: "Moyenne", color: "blue" },
  Basse: { label: "Basse", color: "default" },
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStats();
    loadClients();
    loadDeals();
    loadUsers();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchText) params.search = searchText;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;

      const data = await getAllTasks(params);
      setTasks(data.tasks || []);
    } catch (error) {
      message.error("Erreur lors du chargement des tâches");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getTaskStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading task stats:", error);
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

  const loadUsers = async () => {
    try {
      const data = await getAllUsers({ limit: 100 });
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSearch = () => {
    loadTasks();
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      client: task.client?._id,
      deal: task.deal?._id,
      assignedTo: task.assignedTo?._id,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };

      if (editingTask) {
        await updateTask(editingTask._id, taskData);
        message.success("Tâche mise à jour avec succès");
      } else {
        await createTask(taskData);
        message.success("Tâche créée avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      loadTasks();
      loadStats();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteTask = async (taskId) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Êtes-vous sûr de vouloir supprimer cette tâche ?",
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTask(taskId);
          message.success("Tâche supprimée avec succès");
          loadTasks();
          loadStats();
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === "Terminée" ? "À faire" : "Terminée";
      await updateTaskStatus(task._id, newStatus);
      loadTasks();
      loadStats();
    } catch (error) {
      message.error("Erreur lors de la mise à jour");
    }
  };

  const columns = [
    {
      title: "",
      key: "checkbox",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.status === "Terminée"}
          onChange={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: "Tâche",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              textDecoration:
                record.status === "Terminée" ? "line-through" : "none",
              color: record.status === "Terminée" ? "#999" : "#000",
            }}
          >
            {text}
          </div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Priorité",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => (
        <Tag color={PRIORITIES[priority]?.color}>
          {PRIORITIES[priority]?.label}
        </Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag icon={STATUSES[status]?.icon} color={STATUSES[status]?.color}>
          {STATUSES[status]?.label}
        </Tag>
      ),
    },
    {
      title: "Échéance",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      render: (dueDate) => {
        if (!dueDate) return "-";
        const date = dayjs(dueDate);
        const isOverdue =
          date.isBefore(dayjs()) &&
          date.format("YYYY-MM-DD") !== dayjs().format("YYYY-MM-DD");
        return (
          <Tooltip title={date.format("DD/MM/YYYY HH:mm")}>
            <span style={{ color: isOverdue ? "#ff4d4f" : "#595959" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {date.format("DD/MM/YYYY")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Assigné à",
      dataIndex: "assignedTo",
      key: "assignedTo",
      width: 150,
      render: (assignedTo) => {
        if (!assignedTo) return "-";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar size="small" icon={<UserOutlined />}>
              {assignedTo.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <span style={{ fontSize: "13px" }}>{assignedTo.name}</span>
          </div>
        );
      },
    },
    {
      title: "Client/Deal",
      key: "relations",
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: "12px" }}>
          {record.client && (
            <div style={{ color: "#595959" }}>{record.client.entreprise}</div>
          )}
          {record.deal && (
            <div style={{ color: "#8c8c8c" }}>{record.deal.title}</div>
          )}
          {!record.client && !record.deal && "-"}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditTask(record)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteTask(record._id)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h2 className="page-title">Tâches</h2>
          <p className="page-subtitle">Gérez vos tâches et deadlines</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateTask}
        >
          Nouvelle tâche
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="À faire"
                value={stats.byStatus["À faire"] || 0}
                prefix={<ClockCircleOutlined />}
                styles={{ value: { color: "#595959" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="En cours"
                value={stats.byStatus["En cours"] || 0}
                prefix={<ExclamationCircleOutlined />}
                styles={{ value: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Terminées"
                value={stats.byStatus["Terminée"] || 0}
                prefix={<CheckCircleOutlined />}
                styles={{ value: { color: "#52c41a" } }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Search and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Input
            placeholder="Rechercher une tâche..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Toutes les priorités"
            style={{ width: 180 }}
            allowClear
            value={filterPriority}
            onChange={setFilterPriority}
          >
            {Object.keys(PRIORITIES).map((priority) => (
              <Option key={priority} value={priority}>
                {PRIORITIES[priority].label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Tous les statuts"
            style={{ width: 180 }}
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
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Rechercher
          </Button>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card>
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} tâches`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingTask ? "Enregistrer" : "Créer"}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Titre"
            rules={[{ required: true, message: "Le titre est requis" }]}
          >
            <Input placeholder="Ex: Appel client - Acme Corp" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description de la tâche..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priorité"
                initialValue="Moyenne"
                rules={[{ required: true }]}
              >
                <Select>
                  {Object.keys(PRIORITIES).map((priority) => (
                    <Option key={priority} value={priority}>
                      {PRIORITIES[priority].label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Statut"
                initialValue="À faire"
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

          <Form.Item name="dueDate" label="Date d'échéance">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
              showTime
            />
          </Form.Item>

          <Form.Item name="assignedTo" label="Assigné à">
            <Select
              placeholder="Sélectionner un utilisateur"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="client" label="Client (optionnel)">
            <Select
              placeholder="Sélectionner un client"
              allowClear
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
        </Form>
      </Modal>
    </div>
  );
}

export default Tasks;
