import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Upload,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import {
  addChecklistItem,
  addTaskAttachment,
  addTaskComment,
  createTask,
  createTaskStatus,
  deleteChecklistItem,
  deleteTask,
  deleteTaskAttachment,
  deleteTaskComment,
  deleteTaskStatusDefinition,
  getAllClients,
  getAllDeals,
  getAllProjects,
  getAllTasks,
  getAllUsers,
  getTaskById,
  getTaskAlerts,
  getTaskStats,
  getTaskStatuses,
  toggleChecklistItem,
  updateChecklistItem,
  updateTask,
  updateTaskComment,
  updateTaskStatus,
} from "../utils/api";
import "./Tasks.css";

dayjs.extend(relativeTime);
dayjs.locale("fr");

const PRIORITIES = {
  Urgente: { label: "Urgente", color: "red" },
  Haute: { label: "Haute", color: "orange" },
  Moyenne: { label: "Moyenne", color: "blue" },
  Basse: { label: "Basse", color: "default" },
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ dueSoon: [], overdue: [], counts: {} });
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState("list");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterProject, setFilterProject] = useState(null);

  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const [taskForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [checklistForm] = Form.useForm();
  const [commentForm] = Form.useForm();

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority, filterProject]);

  const statusMap = useMemo(() => {
    const map = {};
    statuses.forEach((status) => {
      map[status.name] = {
        label: status.name,
        color: status.color || "default",
      };
    });
    return map;
  }, [statuses]);

  const initializePage = async () => {
    await Promise.all([
      loadTaskStatuses(),
      loadStats(),
      loadAlerts(),
      loadClients(),
      loadDeals(),
      loadProjects(),
      loadUsers(),
      loadTasks(),
    ]);
  };

  const loadTaskStatuses = async () => {
    try {
      const data = await getTaskStatuses();
      setStatuses(data || []);
    } catch (error) {
      message.error(error.message || "Erreur chargement statuts");
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchText) params.search = searchText;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterProject) params.project = filterProject;

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

  const loadAlerts = async () => {
    try {
      const data = await getTaskAlerts({ daysAhead: 2, limit: 10 });
      setAlerts(data || { dueSoon: [], overdue: [], counts: {} });
    } catch (error) {
      console.error("Error loading task alerts:", error);
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

  const loadProjects = async () => {
    try {
      const data = await getAllProjects({ limit: 200 });
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error loading projects:", error);
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

  const openTaskModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      taskForm.setFieldsValue({
        ...task,
        startDate: task.startDate ? dayjs(task.startDate) : null,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        project: task.project?._id,
        client: task.client?._id,
        deal: task.deal?._id,
        assignedTo: task.assignedTo?._id,
      });
    } else {
      taskForm.resetFields();
      taskForm.setFieldsValue({
        priority: "Moyenne",
        status: statuses[0]?.name || "À faire",
        project: undefined,
      });
    }
    setTaskModalVisible(true);
  };

  const handleSubmitTask = async (values) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };

      if (editingTask) {
        await updateTask(editingTask._id, payload);
        message.success("Tâche mise à jour");
      } else {
        await createTask(payload);
        message.success("Tâche créée");
      }

      setTaskModalVisible(false);
      taskForm.resetFields();
      await Promise.all([loadTasks(), loadStats(), loadAlerts()]);
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      message.success("Tâche supprimée");
      await Promise.all([loadTasks(), loadStats(), loadAlerts()]);
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const doneStatus = statuses.find((status) => status.name === "Terminée")?.name || "Terminée";
      const todoStatus = statuses[0]?.name || "À faire";
      const newStatus = task.status === doneStatus ? todoStatus : doneStatus;
      await updateTaskStatus(task._id, newStatus);
      await Promise.all([loadTasks(), loadStats(), loadAlerts()]);
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const openTaskDetails = async (task) => {
    setEditingChecklistItem(null);
    setEditingComment(null);
    checklistForm.resetFields();
    commentForm.resetFields();
    setDetailModalVisible(true);

    try {
      const fullTask = await getTaskById(task._id);
      setSelectedTask(fullTask);
    } catch (error) {
      // Fallback to partial task data if detailed fetch fails
      setSelectedTask(task);
    }
  };

  const refreshSelectedTask = async (taskId) => {
    const found = await getTaskById(taskId);
    if (found) setSelectedTask(found);
    await Promise.all([loadTasks(), loadStats(), loadAlerts()]);
  };

  const handleAddChecklistItem = async () => {
    try {
      const values = await checklistForm.validateFields();
      if (!selectedTask) return;
      await addChecklistItem(selectedTask._id, values.text);
      checklistForm.resetFields();
      await refreshSelectedTask(selectedTask._id);
      message.success("Sous-tâche ajoutée");
    } catch (error) {
      if (!error.errorFields) message.error(error.message || "Erreur ajout sous-tâche");
    }
  };

  const handleUpdateChecklist = async (itemId) => {
    try {
      if (!selectedTask || !editingChecklistItem) return;
      await updateChecklistItem(selectedTask._id, itemId, editingChecklistItem);
      setEditingChecklistItem(null);
      await refreshSelectedTask(selectedTask._id);
      message.success("Sous-tâche mise à jour");
    } catch (error) {
      message.error(error.message || "Erreur mise à jour sous-tâche");
    }
  };

  const handleToggleChecklist = async (itemId) => {
    if (!selectedTask) return;
    await toggleChecklistItem(selectedTask._id, itemId);
    await refreshSelectedTask(selectedTask._id);
  };

  const handleDeleteChecklist = async (itemId) => {
    if (!selectedTask) return;
    await deleteChecklistItem(selectedTask._id, itemId);
    await refreshSelectedTask(selectedTask._id);
  };

  const handleAddComment = async () => {
    try {
      const values = await commentForm.validateFields();
      if (!selectedTask) return;
      await addTaskComment(selectedTask._id, values.content);
      commentForm.resetFields();
      await refreshSelectedTask(selectedTask._id);
      message.success("Commentaire ajouté");
    } catch (error) {
      if (!error.errorFields) message.error(error.message || "Erreur ajout commentaire");
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!selectedTask || !editingComment) return;
    await updateTaskComment(selectedTask._id, commentId, editingComment);
    setEditingComment(null);
    await refreshSelectedTask(selectedTask._id);
    message.success("Commentaire mis à jour");
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTask) return;
    await deleteTaskComment(selectedTask._id, commentId);
    await refreshSelectedTask(selectedTask._id);
    message.success("Commentaire supprimé");
  };

  const handleAttachmentUpload = async ({ file }) => {
    if (!selectedTask) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await addTaskAttachment(selectedTask._id, {
          name: file.name,
          url: reader.result,
          mimeType: file.type,
          size: file.size,
        });
        await refreshSelectedTask(selectedTask._id);
        message.success("Pièce jointe ajoutée");
      } catch (error) {
        message.error(error.message || "Erreur ajout pièce jointe");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!selectedTask) return;
    await deleteTaskAttachment(selectedTask._id, attachmentId);
    await refreshSelectedTask(selectedTask._id);
    message.success("Pièce jointe supprimée");
  };

  const handleCreateStatus = async () => {
    try {
      const values = await statusForm.validateFields();
      await createTaskStatus(values);
      statusForm.resetFields();
      await loadTaskStatuses();
      message.success("Statut créé");
    } catch (error) {
      if (!error.errorFields) message.error(error.message || "Erreur création statut");
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteTaskStatusDefinition(statusId);
      await loadTaskStatuses();
      await Promise.all([loadTasks(), loadStats()]);
      message.success("Statut supprimé");
    } catch (error) {
      message.error(error.message || "Erreur suppression statut");
    }
  };

  const handleDragStartTask = (taskId) => {
    setDragTaskId(taskId);
  };

  const handleDragEndTask = () => {
    setDragTaskId(null);
    setDragOverStatus(null);
  };

  const handleDropOnStatus = async (targetStatus) => {
    try {
      if (!dragTaskId) return;
      const draggedTask = tasks.find((task) => task._id === dragTaskId);
      if (!draggedTask || draggedTask.status === targetStatus) return;

      await updateTaskStatus(dragTaskId, targetStatus);
      message.success(`Tâche déplacée vers ${targetStatus}`);
      await Promise.all([loadTasks(), loadStats(), loadAlerts()]);

      if (selectedTask?._id === dragTaskId) {
        await refreshSelectedTask(dragTaskId);
      }
    } catch (error) {
      message.error(error.message || "Impossible de déplacer la tâche");
    } finally {
      handleDragEndTask();
    }
  };

  const activityTimeline = useMemo(() => {
    if (!selectedTask) return [];
    const events = [];

    events.push({
      id: `created-${selectedTask._id}`,
      type: "created",
      label: "Tâche créée",
      actor: selectedTask.createdBy?.name || "Système",
      date: selectedTask.createdAt,
      detail: selectedTask.title,
    });

    if (selectedTask.completedAt) {
      events.push({
        id: `completed-${selectedTask._id}`,
        type: "completed",
        label: "Tâche marquée terminée",
        actor: selectedTask.assignedTo?.name || "Utilisateur",
        date: selectedTask.completedAt,
        detail: selectedTask.status,
      });
    }

    (selectedTask.comments || []).forEach((comment) => {
      events.push({
        id: `comment-${comment._id}`,
        type: "comment",
        label: "Commentaire ajouté",
        actor: comment.createdBy?.name || "Utilisateur",
        date: comment.createdAt,
        detail: comment.content,
      });
      if (comment.updatedAt) {
        events.push({
          id: `comment-updated-${comment._id}`,
          type: "comment",
          label: "Commentaire modifié",
          actor: comment.createdBy?.name || "Utilisateur",
          date: comment.updatedAt,
          detail: comment.content,
        });
      }
    });

    (selectedTask.attachments || []).forEach((attachment) => {
      events.push({
        id: `attachment-${attachment._id}`,
        type: "attachment",
        label: "Pièce jointe ajoutée",
        actor: attachment.uploadedBy?.name || "Utilisateur",
        date: attachment.uploadedAt,
        detail: attachment.name,
      });
    });

    (selectedTask.checklist || []).forEach((item) => {
      events.push({
        id: `checklist-${item._id}`,
        type: "checklist",
        label: item.completed ? "Sous-tâche complétée" : "Sous-tâche créée",
        actor: selectedTask.assignedTo?.name || "Utilisateur",
        date: item.createdAt,
        detail: item.text,
      });
    });

    if (
      selectedTask.updatedAt &&
      selectedTask.createdAt &&
      dayjs(selectedTask.updatedAt).diff(dayjs(selectedTask.createdAt), "minute") > 0
    ) {
      events.push({
        id: `updated-${selectedTask._id}`,
        type: "updated",
        label: "Tâche mise à jour",
        actor: selectedTask.assignedTo?.name || "Utilisateur",
        date: selectedTask.updatedAt,
        detail: `${selectedTask.status} - ${selectedTask.priority}`,
      });
    }

    return events
      .filter((event) => event.date)
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [selectedTask]);

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
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.description && <div className="task-subtext">{record.description}</div>}
        </div>
      ),
    },
    {
      title: "Priorité",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => <Tag color={PRIORITIES[priority]?.color}>{priority}</Tag>,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusMap[status]?.color || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Projet",
      dataIndex: "project",
      key: "project",
      render: (project) =>
        project ? <Tag color="cyan">{project.name}</Tag> : "-",
    },
    {
      title: "Échéance",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) =>
        dueDate ? (
          <Tooltip title={dayjs(dueDate).format("DD/MM/YYYY HH:mm")}>
            <span>{dayjs(dueDate).format("DD/MM/YYYY")}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Assigné à",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) =>
        assignedTo ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />}>
              {assignedTo.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <span>{assignedTo.name}</span>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openTaskDetails(record)}>
            Détails
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openTaskModal(record)}>
            Modifier
          </Button>
          <Popconfirm
            title="Supprimer cette tâche ?"
            okText="Supprimer"
            cancelText="Annuler"
            onConfirm={() => handleDeleteTask(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderKanbanView = () => (
    <div className="tasks-kanban-grid">
      {statuses.map((status) => {
        const stageTasks = tasks.filter((task) => task.status === status.name);
        return (
          <Card
            key={status._id}
            className={`tasks-kanban-column ${dragOverStatus === status.name ? "kanban-column-drop-active" : ""}`}
            title={<Space><Tag color={status.color}>{status.name}</Tag><Badge count={stageTasks.length} /></Space>}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStatus(status.name);
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(event) => {
              event.preventDefault();
              handleDropOnStatus(status.name);
            }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size="small">
              {stageTasks.length === 0 ? (
                <div className="task-empty">Aucune tâche</div>
              ) : (
                stageTasks.map((task) => (
                  <Card
                    key={task._id}
                    size="small"
                    className={`kanban-task-card ${dragTaskId === task._id ? "kanban-task-dragging" : ""}`}
                    draggable
                    onDragStart={() => handleDragStartTask(task._id)}
                    onDragEnd={handleDragEndTask}
                    onClick={() => openTaskDetails(task)}
                  >
                    <div className="kanban-title">{task.title}</div>
                    <div className="task-subtext">{task.assignedTo?.name || "Non assignée"}</div>
                    {task.project?.name && (
                      <div className="task-project-badge-wrap">
                        <Tag color="cyan" className="task-project-badge">{task.project.name}</Tag>
                      </div>
                    )}
                    <Space style={{ marginTop: 8 }}>
                      <Tag color={PRIORITIES[task.priority]?.color}>{task.priority}</Tag>
                      {task.dueDate && <Tag icon={<CalendarOutlined />}>{dayjs(task.dueDate).format("DD/MM")}</Tag>}
                    </Space>
                  </Card>
                ))
              )}
            </Space>
          </Card>
        );
      })}
    </div>
  );

  const renderCalendarView = () => (
    <Card>
      <Calendar
        dateCellRender={(date) => {
          const sameDayTasks = tasks.filter(
            (task) => task.dueDate && dayjs(task.dueDate).isSame(date, "day"),
          );

          return (
            <ul className="calendar-task-list">
              {sameDayTasks.slice(0, 3).map((task) => (
                <li key={task._id} onClick={() => openTaskDetails(task)}>
                  <Badge color={PRIORITIES[task.priority]?.color || "blue"} text={task.title} />
                </li>
              ))}
              {sameDayTasks.length > 3 && <li>+{sameDayTasks.length - 3} autres</li>}
            </ul>
          );
        }}
      />
    </Card>
  );

  const renderGanttView = () => {
    const ganttTasks = tasks.filter((task) => task.dueDate);

    return (
      <Card>
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          {ganttTasks.map((task) => {
            const start = task.startDate ? dayjs(task.startDate) : dayjs(task.createdAt);
            const end = dayjs(task.dueDate);
            const now = dayjs();
            const total = Math.max(end.diff(start, "day"), 1);
            const done = Math.min(Math.max(now.diff(start, "day"), 0), total);
            const progress = Math.round((done / total) * 100);

            return (
              <div key={task._id} className="gantt-row" onClick={() => openTaskDetails(task)}>
                <div className="gantt-row-head">
                  <strong>{task.title}</strong>
                  <Tag color={statusMap[task.status]?.color || "default"}>{task.status}</Tag>
                </div>
                <div className="task-subtext">
                  {start.format("DD/MM/YYYY")} - {end.format("DD/MM/YYYY")}
                </div>
                <Progress percent={progress} size="small" status={progress >= 100 ? "success" : "active"} />
              </div>
            );
          })}
        </Space>
      </Card>
    );
  };

  const selectedTaskChecklist = selectedTask?.checklist || [];
  const selectedTaskComments = selectedTask?.comments || [];
  const selectedTaskAttachments = selectedTask?.attachments || [];

  return (
    <div className="dashboard-content tasks-page">
      <div className="content-header">
        <div>
          <h2 className="page-title">Tâches</h2>
          <p className="page-subtitle">Pilotage des tâches, statuts personnalisés et collaboration</p>
        </div>
        <Space>
          <Button onClick={() => setStatusModalVisible(true)}>Gérer Statuts</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openTaskModal()}>
            Nouvelle tâche
          </Button>
        </Space>
      </div>

      {(alerts.counts?.dueSoon > 0 || alerts.counts?.overdue > 0) && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          title="Rappels tâches"
          description={`${alerts.counts?.dueSoon || 0} à échéance proche, ${alerts.counts?.overdue || 0} en retard`}
        />
      )}

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="À faire" value={stats.byStatus["À faire"] || 0} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="En cours" value={stats.byStatus["En cours"] || 0} prefix={<ExclamationCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="Terminées" value={stats.byStatus["Terminée"] || 0} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="En retard" value={stats.overdue || 0} prefix={<ExclamationCircleOutlined />} />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Rechercher une tâche..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 280 }}
            />
            <Select
              placeholder="Statut"
              style={{ width: 180 }}
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              options={statuses.map((status) => ({
                value: status.name,
                label: status.name,
              }))}
            />
            <Select
              placeholder="Priorité"
              style={{ width: 180 }}
              allowClear
              value={filterPriority}
              onChange={setFilterPriority}
              options={Object.keys(PRIORITIES).map((priority) => ({
                value: priority,
                label: priority,
              }))}
            />
            <Select
              placeholder="Projet"
              style={{ width: 220 }}
              allowClear
              value={filterProject}
              onChange={setFilterProject}
              options={projects.map((project) => ({
                value: project._id,
                label: project.name,
              }))}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Rechercher
            </Button>
          </Space>
          <Segmented
            options={[
              { label: "Liste", value: "list" },
              { label: "Kanban", value: "kanban" },
              { label: "Calendrier", value: "calendar" },
              { label: "Gantt", value: "gantt" },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </Space>
      </Card>

      {viewMode === "list" && (
        <Card>
          <Table dataSource={tasks} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 20 }} />
        </Card>
      )}

      {viewMode === "kanban" && renderKanbanView()}
      {viewMode === "calendar" && renderCalendarView()}
      {viewMode === "gantt" && renderGanttView()}

      <Modal
        title={editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
        open={taskModalVisible}
        onCancel={() => {
          setTaskModalVisible(false);
          taskForm.resetFields();
        }}
        onOk={() => taskForm.submit()}
        width={680}
        okText={editingTask ? "Mettre à jour" : "Créer"}
      >
        <Form form={taskForm} layout="vertical" onFinish={handleSubmitTask}>
          <Form.Item name="title" label="Titre" rules={[{ required: true, message: "Titre requis" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="project" label="Projet" rules={[{ required: true, message: "Projet requis" }]}> 
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={projects.map((project) => ({
                value: project._id,
                label: `${project.name}${project.client?.entreprise ? ` - ${project.client.entreprise}` : ""}`,
              }))}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const selectedProjectId = taskForm.getFieldValue("project");
              const selectedProject = projects.find((project) => project._id === selectedProjectId);
              return (
                <Form.Item label="Client (derive du projet)">
                  <Input
                    value={selectedProject?.client?.entreprise || ""}
                    disabled
                    placeholder="Selectionnez un projet"
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priorité" rules={[{ required: true }]}> 
                <Select
                  options={Object.keys(PRIORITIES).map((priority) => ({
                    value: priority,
                    label: priority,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Statut" rules={[{ required: true }]}> 
                <Select
                  options={statuses.map((status) => ({
                    value: status.name,
                    label: status.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Date début">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" showTime />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Date échéance">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" showTime />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedTo" label="Assigné à">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={users.map((user) => ({
                value: user._id,
                label: user.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="client" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="deal" label="Deal (optionnel)">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={deals.map((deal) => ({
                value: deal._id,
                label: `${deal.title} - ${deal.company}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gérer les statuts"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          statusForm.resetFields();
        }}
        footer={null}
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Form form={statusForm} layout="inline" onFinish={handleCreateStatus}>
            <Form.Item name="name" rules={[{ required: true, message: "Nom requis" }]}>
              <Input placeholder="Nouveau statut" />
            </Form.Item>
            <Form.Item name="color" initialValue="default">
              <Select
                style={{ width: 140 }}
                options={[
                  { value: "default", label: "Gris" },
                  { value: "processing", label: "Bleu" },
                  { value: "warning", label: "Orange" },
                  { value: "success", label: "Vert" },
                  { value: "error", label: "Rouge" },
                ]}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit">Ajouter</Button>
          </Form>

          <List
            dataSource={statuses}
            renderItem={(status) => (
              <List.Item
                actions={
                  status.isDefault
                    ? []
                    : [
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeleteStatus(status._id)}
                        >
                          Supprimer
                        </Button>,
                      ]
                }
              >
                <Space>
                  <Tag color={status.color}>{status.name}</Tag>
                  {status.isDefault && <span className="task-subtext">Par défaut</span>}
                </Space>
              </List.Item>
            )}
          />
        </Space>
      </Modal>

      <Modal
        title={selectedTask ? `Détails - ${selectedTask.title}` : "Détails tâche"}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedTask && (
          <div className="task-detail-grid">
            <Card title="Checklist">
              <Form form={checklistForm} layout="inline" onFinish={handleAddChecklistItem}>
                <Form.Item name="text" rules={[{ required: true, message: "Texte requis" }]} style={{ flex: 1 }}>
                  <Input placeholder="Ajouter une sous-tâche" />
                </Form.Item>
                <Button type="primary" htmlType="submit">Ajouter</Button>
              </Form>

              <List
                style={{ marginTop: 12 }}
                dataSource={selectedTaskChecklist}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="toggle" type="link" onClick={() => handleToggleChecklist(item._id)}>
                        {item.completed ? "Annuler" : "Terminer"}
                      </Button>,
                      <Button
                        key="save"
                        type="link"
                        onClick={() =>
                          editingChecklistItem === item.text
                            ? handleUpdateChecklist(item._id)
                            : setEditingChecklistItem(item.text)
                        }
                      >
                        {editingChecklistItem === item.text ? "Enregistrer" : "Modifier"}
                      </Button>,
                      <Button key="delete" type="link" danger onClick={() => handleDeleteChecklist(item._id)}>
                        Supprimer
                      </Button>,
                    ]}
                  >
                    <Space>
                      <Checkbox checked={item.completed} onChange={() => handleToggleChecklist(item._id)} />
                      {editingChecklistItem === item.text ? (
                        <Input
                          value={editingChecklistItem}
                          onChange={(e) => setEditingChecklistItem(e.target.value)}
                        />
                      ) : (
                        <span style={{ textDecoration: item.completed ? "line-through" : "none" }}>{item.text}</span>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Commentaires">
              <Form form={commentForm} layout="inline" onFinish={handleAddComment}>
                <Form.Item name="content" rules={[{ required: true, message: "Commentaire requis" }]} style={{ flex: 1 }}>
                  <Input placeholder="Ajouter un commentaire" prefix={<CommentOutlined />} />
                </Form.Item>
                <Button type="primary" htmlType="submit">Publier</Button>
              </Form>

              <List
                style={{ marginTop: 12 }}
                dataSource={selectedTaskComments}
                renderItem={(comment) => (
                  <List.Item
                    actions={[
                      <Button
                        key="edit"
                        type="link"
                        onClick={() =>
                          editingComment === comment.content
                            ? handleUpdateComment(comment._id)
                            : setEditingComment(comment.content)
                        }
                      >
                        {editingComment === comment.content ? "Enregistrer" : "Modifier"}
                      </Button>,
                      <Button key="delete" type="link" danger onClick={() => handleDeleteComment(comment._id)}>
                        Supprimer
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={comment.createdBy?.profilePicture}
                          icon={<UserOutlined />}
                        >
                          {comment.createdBy?.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      }
                      title={comment.createdBy?.name || "Utilisateur"}
                      description={
                        <>
                          {editingComment === comment.content ? (
                            <Input value={editingComment} onChange={(e) => setEditingComment(e.target.value)} />
                          ) : (
                            <span>{comment.content}</span>
                          )}
                          <div className="task-subtext">{dayjs(comment.createdAt).format("DD/MM/YYYY HH:mm")}</div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Pièces jointes">
              <Upload customRequest={handleAttachmentUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Importer une pièce jointe</Button>
              </Upload>

              <List
                style={{ marginTop: 12 }}
                dataSource={selectedTaskAttachments}
                renderItem={(attachment) => (
                  <List.Item
                    actions={[
                      <Button
                        key="open"
                        type="link"
                        icon={<PaperClipOutlined />}
                        onClick={() => window.open(attachment.url, "_blank")}
                      >
                        Ouvrir
                      </Button>,
                      <Button
                        key="download"
                        type="link"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = attachment.url;
                          a.download = attachment.name;
                          a.click();
                        }}
                      >
                        Télécharger
                      </Button>,
                      <Button
                        key="delete"
                        type="link"
                        danger
                        onClick={() => handleDeleteAttachment(attachment._id)}
                      >
                        Supprimer
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={attachment.uploadedBy?.profilePicture}
                          icon={<PaperClipOutlined />}
                        >
                          {attachment.uploadedBy?.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      }
                      title={attachment.name}
                      description={
                        <div>
                          <span className="task-subtext">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </span>
                          <div className="task-subtext">
                            Ajouté par {attachment.uploadedBy?.name || "Utilisateur"}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Timeline activité">
              <div className="task-timeline">
                {activityTimeline.length === 0 ? (
                  <div className="task-empty">Aucun évènement</div>
                ) : (
                  activityTimeline.map((event) => (
                    <div key={event.id} className="task-timeline-item">
                      <div className="task-timeline-dot" />
                      <div className="task-timeline-content">
                        <div className="task-timeline-head">
                          <strong>{event.label}</strong>
                          <span className="task-subtext">{dayjs(event.date).format("DD/MM/YYYY HH:mm")}</span>
                        </div>
                        <div className="task-subtext">{event.actor}</div>
                        <div>{event.detail}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Tasks;
