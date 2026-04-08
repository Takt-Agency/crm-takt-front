import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Avatar,
  Progress,
  Dropdown,
  Tag,
  Spin,
  Empty,
  Tooltip,
  Timeline,
  Alert,
  Badge,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  UserOutlined,
  EuroCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import "./Pipeline.css";
import {
  getAllDeals,
  getPipelineStats,
  getDealAlerts,
  getDealById,
  createDeal,
  createClient,
  updateDeal,
  updateDealStage,
  deleteDeal,
  convertDealToClient,
  getAllUsers,
  getAllClients,
  getAllProjects,
  createProject,
  addDealNote,
  addDealActivity,
  updateDealNote,
  deleteDealNote,
  updateDealActivity,
  deleteDealActivity,
} from "../utils/api";

dayjs.extend(relativeTime);
dayjs.locale("fr");
const { TextArea } = Input;
const { Option } = Select;

const Pipeline = () => {
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [projectDeal, setProjectDeal] = useState(null);
  const [convertClientModalVisible, setConvertClientModalVisible] = useState(false);
  const [convertClientDeal, setConvertClientDeal] = useState(null);
  const [projects, setProjects] = useState([]);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState({
    dueSoon: [],
    staleDeals: [],
    counts: { dueSoon: 0, staleDeals: 0 },
  });
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineDeal, setTimelineDeal] = useState(null);
  const [timelineTypeFilter, setTimelineTypeFilter] = useState("all");
  const [timelineTextFilter, setTimelineTextFilter] = useState("");
  const [timelineImportantOnly, setTimelineImportantOnly] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventEditForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [activityForm] = Form.useForm();
  const [form] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [convertClientForm] = Form.useForm();

  const stages = ["Prospect", "Qualification", "Proposition", "Négociation"];

  // Load deals on component mount
  useEffect(() => {
    loadDeals();
    loadClients();
    loadProjects();
    loadStats();
    loadUsers();
    loadAlerts();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getAllClients({ limit: 200 });
      setClients(data.clients || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await getAllDeals();
      setDeals(Array.isArray(data) ? data : data.deals || []);
    } catch (error) {
      message.error("Erreur lors du chargement des deals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getAllProjects({ limit: 300 });
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

  const loadStats = async () => {
    try {
      const data = await getPipelineStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await getDealAlerts({
        daysAhead: 3,
        staleDays: 10,
        limit: 8,
      });
      setAlerts(
        data || {
          dueSoon: [],
          staleDeals: [],
          counts: { dueSoon: 0, staleDeals: 0 },
        },
      );
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  // Filter deals by stage
  const getDealsByStage = (stage) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  // Open modal for creating new deal
  const handleCreateDeal = () => {
    setModalMode("create");
    setSelectedDeal(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Open modal for editing deal
  const handleEditDeal = (deal) => {
    setModalMode("edit");
    setSelectedDeal(deal);
    form.setFieldsValue({
      ...deal,
      client: deal.client?._id,
      assignedToUser: deal.assignedToUser?._id,
      expectedCloseDate: deal.expectedCloseDate
        ? dayjs(deal.expectedCloseDate)
        : null,
      nextFollowUpDate: deal.nextFollowUpDate
        ? dayjs(deal.nextFollowUpDate)
        : null,
    });
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const dealData = {
        ...values,
        expectedCloseDate: values.expectedCloseDate
          ? values.expectedCloseDate.toISOString()
          : null,
        nextFollowUpDate: values.nextFollowUpDate
          ? values.nextFollowUpDate.toISOString()
          : null,
      };

      if (modalMode === "create") {
        await createDeal(dealData);
        message.success("Deal créé avec succès");
      } else {
        await updateDeal(selectedDeal._id, dealData);
        message.success("Deal mis à jour avec succès");
      }

      setModalVisible(false);
      form.resetFields();
      loadDeals();
      loadStats();
      loadAlerts();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const openTimeline = async (deal) => {
    try {
      const fullDeal = await getDealById(deal._id);
      setTimelineDeal(fullDeal);
      noteForm.resetFields();
      activityForm.resetFields();
      eventEditForm.resetFields();
      setEditingEvent(null);
      setTimelineVisible(true);
    } catch (error) {
      message.error(error.message || "Impossible de charger l'historique");
    }
  };

  const handleAddNote = async () => {
    try {
      const values = await noteForm.validateFields();
      await addDealNote(timelineDeal._id, values.content);
      const refreshed = await getDealById(timelineDeal._id);
      setTimelineDeal(refreshed);
      setEditingEvent(null);
      noteForm.resetFields();
      message.success("Note ajoutée");
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de l'ajout de note");
      }
    }
  };

  const handleAddActivity = async () => {
    try {
      const values = await activityForm.validateFields();
      await addDealActivity(timelineDeal._id, {
        type: values.type,
        description: values.description,
        date: values.date
          ? values.date.toISOString()
          : new Date().toISOString(),
      });
      const refreshed = await getDealById(timelineDeal._id);
      setTimelineDeal(refreshed);
      setEditingEvent(null);
      activityForm.resetFields();
      message.success("Activité ajoutée");
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de l'ajout d'activité");
      }
    }
  };

  const getEventMeta = (eventType) => {
    const map = {
      Appel: { icon: <PhoneOutlined />, color: "#1677ff" },
      Email: { icon: <MailOutlined />, color: "#13c2c2" },
      Réunion: { icon: <TeamOutlined />, color: "#722ed1" },
      Note: { icon: <FileTextOutlined />, color: "#52c41a" },
      Autre: { icon: <ClockCircleOutlined />, color: "#fa8c16" },
    };
    return map[eventType] || map.Autre;
  };

  const buildTimelineEvents = (deal) => {
    if (!deal) return [];

    const activityEvents = (deal.activities || []).map((activity, index) => ({
      id: `activity-${index}`,
      rawId: activity._id,
      type: activity.type || "Autre",
      label: activity.type || "Activité",
      description: activity.description || "Activité enregistrée",
      date: activity.date ? dayjs(activity.date) : dayjs(),
      createdBy: activity.createdBy?.name || "Utilisateur",
      createdByEmail: activity.createdBy?.email,
      source: "activity",
      important:
        (activity.type || "").toLowerCase() === "réunion" ||
        (activity.type || "").toLowerCase() === "appel",
    }));

    const noteEvents = (deal.notes || []).map((note, index) => ({
      id: `note-${index}`,
      rawId: note._id,
      type: "Note",
      label: "Note",
      description: note.content || "Note ajoutée",
      date: note.createdAt ? dayjs(note.createdAt) : dayjs(),
      createdBy: note.createdBy?.name || "Utilisateur",
      createdByEmail: note.createdBy?.email,
      source: "note",
      important: false,
    }));

    return [...activityEvents, ...noteEvents].sort(
      (a, b) => b.date.valueOf() - a.date.valueOf(),
    );
  };

  const getFilteredTimelineEvents = (deal) => {
    const events = buildTimelineEvents(deal);
    return events.filter((event) => {
      const passType =
        timelineTypeFilter === "all" ||
        event.type.toLowerCase() === timelineTypeFilter.toLowerCase();
      const passText =
        !timelineTextFilter ||
        event.description
          .toLowerCase()
          .includes(timelineTextFilter.trim().toLowerCase()) ||
        event.createdBy
          .toLowerCase()
          .includes(timelineTextFilter.trim().toLowerCase());
      const passImportant = !timelineImportantOnly || event.important;
      return passType && passText && passImportant;
    });
  };

  const startEditEvent = (event) => {
    setEditingEvent(event);
    if (event.source === "note") {
      eventEditForm.setFieldsValue({
        content: event.description,
      });
      return;
    }

    eventEditForm.setFieldsValue({
      type: event.type,
      description: event.description,
      date: event.date,
    });
  };

  const handleSaveEditedEvent = async () => {
    try {
      if (!editingEvent || !timelineDeal) return;

      const values = await eventEditForm.validateFields();

      if (editingEvent.source === "note") {
        await updateDealNote(
          timelineDeal._id,
          editingEvent.rawId,
          values.content,
        );
      } else {
        await updateDealActivity(timelineDeal._id, editingEvent.rawId, {
          type: values.type,
          description: values.description,
          date: values.date ? values.date.toISOString() : undefined,
        });
      }

      const refreshed = await getDealById(timelineDeal._id);
      setTimelineDeal(refreshed);
      setEditingEvent(null);
      eventEditForm.resetFields();
      message.success("Événement mis à jour");
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de la mise à jour");
      }
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      if (!timelineDeal) return;

      if (event.source === "note") {
        await deleteDealNote(timelineDeal._id, event.rawId);
      } else {
        await deleteDealActivity(timelineDeal._id, event.rawId);
      }

      const refreshed = await getDealById(timelineDeal._id);
      setTimelineDeal(refreshed);
      if (editingEvent?.rawId === event.rawId) {
        setEditingEvent(null);
        eventEditForm.resetFields();
      }
      message.success("Événement supprimé");
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleConvertToClient = async (deal) => {
    if (!deal.client?._id) {
      setConvertClientDeal(deal);
      convertClientForm.resetFields();
      setConvertClientModalVisible(true);
      return;
    }

    Modal.confirm({
      title: "Convertir ce prospect en client ?",
      content: "Le deal est déjà lié à un client, il sera marqué comme gagné.",
      okText: "Convertir",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await convertDealToClient(deal._id);
          message.success("Deal converti et marqué comme gagné");
          loadDeals();
          loadStats();
          loadAlerts();
        } catch (error) {
          message.error(error.message || "Erreur lors de la conversion");
        }
      },
    });
  };

  const handleCreateClientAndConvert = async () => {
    try {
      const values = await convertClientForm.validateFields();
      if (!convertClientDeal?._id) return;

      let clientId;
      let newClient;

      try {
        newClient = await createClient({
          entreprise: values.entreprise,
          email: values.email,
          telephone: values.telephone,
          localite: values.localite,
          statut: "Actif",
          ca: values.ca,
          sourceLead: values.sourceLead,
          adresse: values.adresse,
        });
      } catch (createError) {
        const duplicateEmail = /existe déjà|already exists/i.test(
          String(createError?.message || ""),
        );

        if (!duplicateEmail) {
          throw createError;
        }

        const existingClient = clients.find(
          (client) =>
            String(client?.email || "").toLowerCase() ===
            String(values.email || "").toLowerCase(),
        );

        if (!existingClient?._id) {
          throw new Error(
            "Un client avec cet email existe déjà. Sélectionnez-le dans le deal puis relancez la conversion.",
          );
        }

        clientId = existingClient._id;
        message.info("Client existant détecté: liaison automatique au deal.");
      }

      if (!clientId) {
        const createdClient =
          newClient?.data?.client || newClient?.client || newClient?.data || newClient;
        clientId = createdClient?._id || createdClient?.id;
      }

      if (!clientId) {
        throw new Error("Client créé mais identifiant introuvable");
      }

      await updateDeal(convertClientDeal._id, { client: clientId });
      await convertDealToClient(convertClientDeal._id);

      message.success("Nouveau client créé puis deal converti");
      setConvertClientModalVisible(false);
      setConvertClientDeal(null);
      convertClientForm.resetFields();
      loadDeals();
      loadStats();
      loadAlerts();
      loadClients();
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de la conversion");
      }
    }
  };

  const openCreateProjectFromDeal = (deal) => {
    setProjectDeal(deal);
    projectForm.resetFields();
    projectForm.setFieldsValue({
      name: `${deal.title} - Projet`,
      status: "Planifie",
      client: deal.client?._id,
    });
    setProjectModalVisible(true);
  };

  const handleCreateProjectFromDeal = async () => {
    try {
      const values = await projectForm.validateFields();

      if (!projectDeal?._id) {
        message.error("Deal invalide");
        return;
      }

      await createProject({
        name: values.name,
        client: values.client,
        deal: projectDeal._id,
        status: values.status,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        budget: values.budget,
        description: values.description,
      });

      message.success("Projet créé depuis le deal");
      setProjectModalVisible(false);
      setProjectDeal(null);
      projectForm.resetFields();
      loadProjects();
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de la création du projet");
      }
    }
  };

  // Handle deal deletion
  const handleDeleteDeal = async (dealId) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Êtes-vous sûr de vouloir supprimer ce deal ?",
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteDeal(dealId);
          message.success("Deal supprimé avec succès");
          loadDeals();
          loadStats();
          loadAlerts();
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Handle drag and drop (manual)
  const handleStageChange = async (dealId, newStage) => {
    try {
      await updateDealStage(dealId, newStage);
      message.success("Stage mis à jour");
      loadDeals();
      loadStats();
    } catch (error) {
      message.error("Erreur lors de la mise à jour du stage");
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = "move";
    // Add visual feedback
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedDeal) return;

    // Don't do anything if dropped on same stage
    if (draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }

    // Update the deal stage
    await handleStageChange(draggedDeal._id, targetStage);
    setDraggedDeal(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get dropdown menu for deal card
  const getDealMenu = (deal) => ({
    items: [
      {
        key: "edit",
        label: "Modifier",
        icon: <EditOutlined />,
        onClick: () => handleEditDeal(deal),
      },
      {
        key: "timeline",
        label: "Historique",
        onClick: () => openTimeline(deal),
      },
      ...stages
        .filter((stage) => stage !== deal.stage)
        .map((stage) => ({
          key: `move-${stage}`,
          label: `Déplacer vers ${stage}`,
          onClick: () => handleStageChange(deal._id, stage),
        })),
      {
        type: "divider",
      },
      ...(deal.stage !== "Gagné"
        ? [
            {
              key: "convert",
              label: "Convertir en client",
              onClick: () => handleConvertToClient(deal),
            },
          ]
        : []),
      {
        key: "create-project",
        label: "Créer projet",
        icon: <PlusOutlined />,
        onClick: () => openCreateProjectFromDeal(deal),
      },
      {
        key: "delete",
        label: "Supprimer",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteDeal(deal._id),
      },
    ],
  });

  // Render deal card
  const renderDealCard = (deal) => (
    (() => {
      const linkedProject = projects.find((project) => project.deal?._id === deal._id);
      return (
    <Card
      key={deal._id}
      className="deal-card"
      size="small"
      bordered={false}
      hoverable
      draggable
      onDragStart={(e) => handleDragStart(e, deal)}
      onDragEnd={handleDragEnd}
      style={{ cursor: "move" }}
    >
      <div className="deal-card-header">
        <div className="deal-title">
          <strong>{deal.title}</strong>
          <div className="deal-company">{deal.company}</div>
          {linkedProject && (
            <Tag color="cyan" className="deal-project-tag">
              Projet: {linkedProject.name}
            </Tag>
          )}
        </div>
        <Dropdown menu={getDealMenu(deal)} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      <div className="deal-amount">
        <EuroCircleOutlined style={{ color: "#1890ff", marginRight: 4 }} />
        <strong>{formatCurrency(deal.amount)}</strong>
      </div>

      <div className="deal-probability">
        <div className="probability-label">Probabilité</div>
        <Progress
          percent={deal.probability}
          size="small"
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
        />
      </div>

      <div className="deal-footer">
        <div className="deal-assignee">
          <Avatar size="small" icon={<UserOutlined />}>
            {deal.assignedTo?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <span className="assignee-name">{deal.assignedTo?.name}</span>
        </div>
        <Tooltip title={dayjs(deal.updatedAt).format("DD/MM/YYYY HH:mm")}>
          <CalendarOutlined style={{ color: "#999" }} />
          <span className="deal-date">{dayjs(deal.updatedAt).fromNow()}</span>
        </Tooltip>
      </div>
    </Card>
      );
    })()
  );

  // Render pipeline column
  const renderPipelineColumn = (stage) => {
    const stageDeals = getDealsByStage(stage);
    const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
    const isDragOver = dragOverStage === stage && draggedDeal?.stage !== stage;

    return (
      <div
        key={stage}
        className={`pipeline-column ${isDragOver ? "drag-over" : ""}`}
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
      >
        <div className="pipeline-column-header">
          <div className="stage-title">
            <strong>{stage}</strong>
            <Tag color="blue">{stageDeals.length}</Tag>
          </div>
          <div className="stage-total">{formatCurrency(stageTotal)}</div>
        </div>
        <div className="pipeline-column-content">
          {stageDeals.length > 0 ? (
            stageDeals.map((deal) => renderDealCard(deal))
          ) : (
            <Empty
              description="Aucun deal"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-content pipeline-page">
      <div className="content-header">
        <div>
          <h2 className="page-title">Pipeline commercial</h2>
          <p className="page-subtitle">Gérez vos prospects et deals en cours</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateDeal}
        >
          Nouveau deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div className="pipeline-stats">
          <Card className="stat-card">
            <div className="stat-label">Valeur totale du pipeline</div>
            <div className="stat-value">
              {formatCurrency(stats.overall?.totalValue || 0)}
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-label">Nombre de deals</div>
            <div className="stat-value">{stats.overall?.totalDeals || 0}</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-label">Probabilité moyenne</div>
            <div className="stat-value">
              {stats.overall?.avgProbability || 0}%
            </div>
          </Card>
        </div>
      )}

      {(alerts.counts?.dueSoon > 0 || alerts.counts?.staleDeals > 0) && (
        <Card style={{ marginBottom: 16 }}>
          <Alert
            type="warning"
            showIcon
            title="Rappels prospects"
            description={
              <div>
                <Badge count={alerts.counts?.dueSoon || 0} color="#faad14" />{" "}
                relances proches,
                <Badge
                  style={{ marginLeft: 8 }}
                  count={alerts.counts?.staleDeals || 0}
                  color="#ff4d4f"
                />{" "}
                deals inactifs.
              </div>
            }
          />
        </Card>
      )}

      {/* Pipeline Board */}
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <div className="pipeline-board">
          {stages.map((stage) => renderPipelineColumn(stage))}
        </div>
      )}

      {/* Create/Edit Deal Modal */}
      <Modal
        title={modalMode === "create" ? "Nouveau Deal" : "Modifier le Deal"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={modalMode === "create" ? "Créer" : "Enregistrer"}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Titre du deal"
            rules={[{ required: true, message: "Le titre est requis" }]}
          >
            <Input placeholder="Ex: Projet Web E-commerce" />
          </Form.Item>

          <Form.Item
            name="company"
            label="Entreprise"
            rules={[{ required: true, message: "L'entreprise est requise" }]}
          >
            <Input placeholder="Nom de l'entreprise" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Montant (€)"
            rules={[{ required: true, message: "Le montant est requis" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/€\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item name="source" label="Source du lead">
            <Input placeholder="Site web, referral, ads..." />
          </Form.Item>

          <Form.Item name="contactEmail" label="Email du contact">
            <Input placeholder="contact@entreprise.com" />
          </Form.Item>

          <Form.Item name="contactPhone" label="Téléphone du contact">
            <Input placeholder="+216 ..." />
          </Form.Item>

          <Form.Item name="client" label="Client lié (optionnel)">
            <Select allowClear placeholder="Sélectionner un client existant" showSearch optionFilterProp="label">
              {clients.map((client) => (
                <Option key={client._id} value={client._id} label={client.entreprise}>
                  {client.entreprise}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {modalMode === "create" && (
            <Form.Item
              name="stage"
              label="Stage"
              initialValue="Prospect"
              rules={[{ required: true }]}
            >
              <Select>
                {stages.map((stage) => (
                  <Option key={stage} value={stage}>
                    {stage}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="assignedToUser" label="Assigné à (utilisateur)">
            <Select allowClear placeholder="Sélectionner un utilisateur">
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name={["assignedTo", "name"]} label="Assignation manuelle">
            <Input placeholder="Nom affiché sur la carte" />
          </Form.Item>

          <Form.Item name="expectedCloseDate" label="Date de clôture prévue">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="nextFollowUpDate" label="Date de relance">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Description du deal..." />
          </Form.Item>

          <Form.Item name="priority" label="Priorité" initialValue="Moyenne">
            <Select>
              <Option value="Haute">Haute</Option>
              <Option value="Moyenne">Moyenne</Option>
              <Option value="Basse">Basse</Option>
            </Select>
          </Form.Item>

          <div style={{ marginBottom: 8, fontWeight: 600 }}>Scoring BANT</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              name={["bant", "budget"]}
              label="Budget"
              initialValue={0}
            >
              <InputNumber min={0} max={5} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name={["bant", "authority"]}
              label="Authority"
              initialValue={0}
            >
              <InputNumber min={0} max={5} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name={["bant", "need"]} label="Need" initialValue={0}>
              <InputNumber min={0} max={5} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name={["bant", "timeline"]}
              label="Timeline"
              initialValue={0}
            >
              <InputNumber min={0} max={5} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          timelineDeal ? `Historique - ${timelineDeal.title}` : "Historique"
        }
        open={timelineVisible}
        onCancel={() => setTimelineVisible(false)}
        footer={null}
        width={980}
        className="deal-history-modal"
      >
        {timelineDeal
          ? (() => {
              const filteredEvents = getFilteredTimelineEvents(timelineDeal);
              const lastActivity = filteredEvents[0]?.date;
              const followUpDate = timelineDeal.nextFollowUpDate
                ? dayjs(timelineDeal.nextFollowUpDate)
                : null;

              return (
                <div className="deal-history-layout">
                  <div className="deal-history-header">
                    <div className="deal-history-kpis">
                      <div className="history-kpi-item">
                        <span className="history-kpi-label">Stage</span>
                        <Tag color="blue">{timelineDeal.stage}</Tag>
                      </div>
                      <div className="history-kpi-item">
                        <span className="history-kpi-label">Score BANT</span>
                        <Tag color="purple">{timelineDeal.bantScore || 0}%</Tag>
                      </div>
                      <div className="history-kpi-item">
                        <span className="history-kpi-label">
                          Dernière activité
                        </span>
                        <span className="history-kpi-value">
                          {lastActivity
                            ? lastActivity.format("DD/MM/YYYY HH:mm")
                            : "Aucune"}
                        </span>
                      </div>
                      <div className="history-kpi-item">
                        <span className="history-kpi-label">
                          Prochaine relance
                        </span>
                        <span className="history-kpi-value">
                          {followUpDate
                            ? followUpDate.format("DD/MM/YYYY")
                            : "Non planifiée"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="deal-history-content">
                    <div className="deal-history-feed">
                      <div className="deal-history-tools">
                        <Select
                          value={timelineTypeFilter}
                          onChange={setTimelineTypeFilter}
                          style={{ width: 170 }}
                        >
                          <Option value="all">Tous les types</Option>
                          <Option value="Appel">Appels</Option>
                          <Option value="Email">Emails</Option>
                          <Option value="Réunion">Réunions</Option>
                          <Option value="Note">Notes</Option>
                          <Option value="Autre">Autres</Option>
                        </Select>
                        <Input
                          value={timelineTextFilter}
                          onChange={(e) =>
                            setTimelineTextFilter(e.target.value)
                          }
                          placeholder="Rechercher une activité..."
                        />
                        <div className="timeline-important-toggle">
                          <Switch
                            checked={timelineImportantOnly}
                            onChange={setTimelineImportantOnly}
                            size="small"
                          />
                          <span>Important</span>
                        </div>
                      </div>

                      {filteredEvents.length === 0 ? (
                        <Empty
                          description="Aucun événement pour ces filtres"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ) : (
                        <Timeline
                          items={filteredEvents.map((event) => {
                            const meta = getEventMeta(event.type);
                            const isEditing =
                              editingEvent &&
                              editingEvent.rawId === event.rawId &&
                              editingEvent.source === event.source;
                            return {
                              color: meta.color,
                              dot: (
                                <span className="timeline-dot-icon">
                                  {meta.icon}
                                </span>
                              ),
                              children: (
                                <div className="timeline-event-card">
                                  <div className="timeline-event-head">
                                    <div className="timeline-event-head-left">
                                      <Tag color="default">{event.label}</Tag>
                                      <span className="timeline-event-date">
                                        {event.date.format("DD/MM/YYYY HH:mm")}
                                      </span>
                                    </div>
                                    <div className="timeline-event-actions">
                                      <Button
                                        size="small"
                                        type="text"
                                        onClick={() => startEditEvent(event)}
                                      >
                                        Modifier
                                      </Button>
                                      <Button
                                        size="small"
                                        type="text"
                                        danger
                                        onClick={() => handleDeleteEvent(event)}
                                      >
                                        Supprimer
                                      </Button>
                                    </div>
                                  </div>

                                  {isEditing ? (
                                    <Form
                                      form={eventEditForm}
                                      layout="vertical"
                                    >
                                      {event.source === "note" ? (
                                        <Form.Item
                                          name="content"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Contenu requis",
                                            },
                                          ]}
                                        >
                                          <Input.TextArea rows={3} />
                                        </Form.Item>
                                      ) : (
                                        <>
                                          <Form.Item
                                            name="type"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Type requis",
                                              },
                                            ]}
                                          >
                                            <Select>
                                              <Option value="Appel">
                                                Appel
                                              </Option>
                                              <Option value="Email">
                                                Email
                                              </Option>
                                              <Option value="Réunion">
                                                Réunion
                                              </Option>
                                              <Option value="Autre">
                                                Autre
                                              </Option>
                                            </Select>
                                          </Form.Item>
                                          <Form.Item
                                            name="description"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Description requise",
                                              },
                                            ]}
                                          >
                                            <Input />
                                          </Form.Item>
                                          <Form.Item name="date">
                                            <DatePicker
                                              style={{ width: "100%" }}
                                              format="DD/MM/YYYY HH:mm"
                                              showTime={{ format: "HH:mm" }}
                                            />
                                          </Form.Item>
                                        </>
                                      )}
                                      <div className="timeline-edit-actions">
                                        <Button
                                          size="small"
                                          type="primary"
                                          onClick={handleSaveEditedEvent}
                                        >
                                          Enregistrer
                                        </Button>
                                        <Button
                                          size="small"
                                          onClick={() => {
                                            setEditingEvent(null);
                                            eventEditForm.resetFields();
                                          }}
                                        >
                                          Annuler
                                        </Button>
                                      </div>
                                    </Form>
                                  ) : (
                                    <>
                                      <p className="timeline-event-text">
                                        {event.description}
                                      </p>
                                      <div className="timeline-event-author-row">
                                        <Avatar
                                          size="small"
                                          icon={<UserOutlined />}
                                        >
                                          {event.createdBy
                                            ?.charAt(0)
                                            ?.toUpperCase()}
                                        </Avatar>
                                        <span className="timeline-event-author">
                                          {event.createdBy}
                                        </span>
                                        {event.createdByEmail && (
                                          <span className="timeline-event-author-email">
                                            {event.createdByEmail}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ),
                            };
                          })}
                        />
                      )}
                    </div>

                    <div className="deal-history-actions">
                      <Card
                        size="small"
                        title="Ajouter une note"
                        className="history-action-card"
                      >
                        <Form form={noteForm} layout="vertical">
                          <Form.Item
                            name="content"
                            rules={[
                              { required: true, message: "Note requise" },
                            ]}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Résumé professionnel de la note..."
                            />
                          </Form.Item>
                          <Button type="primary" block onClick={handleAddNote}>
                            Enregistrer la note
                          </Button>
                        </Form>
                      </Card>

                      <Card
                        size="small"
                        title="Journaliser une activité"
                        className="history-action-card"
                      >
                        <Form form={activityForm} layout="vertical">
                          <Form.Item
                            name="type"
                            rules={[{ required: true, message: "Type requis" }]}
                          >
                            <Select placeholder="Type d'activité">
                              <Option value="Appel">Appel</Option>
                              <Option value="Email">Email</Option>
                              <Option value="Réunion">Réunion</Option>
                              <Option value="Autre">Autre</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="description"
                            rules={[
                              {
                                required: true,
                                message: "Description requise",
                              },
                            ]}
                          >
                            <Input placeholder="Description synthétique de l'activité" />
                          </Form.Item>
                          <Form.Item name="date">
                            <DatePicker
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY HH:mm"
                              showTime={{ format: "HH:mm" }}
                            />
                          </Form.Item>
                          <Button
                            type="primary"
                            block
                            onClick={handleAddActivity}
                          >
                            Enregistrer l'activité
                          </Button>
                        </Form>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
      </Modal>

      <Modal
        title={
          projectDeal
            ? `Nouveau projet depuis deal - ${projectDeal.title}`
            : "Nouveau projet"
        }
        open={projectModalVisible}
        onCancel={() => {
          setProjectModalVisible(false);
          setProjectDeal(null);
          projectForm.resetFields();
        }}
        onOk={handleCreateProjectFromDeal}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item label="Deal source">
            <Input value={projectDeal?.title || ""} disabled />
          </Form.Item>

          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: "Client requis" }]}
          >
            <Select
              placeholder="Sélectionner un client"
              showSearch
              optionFilterProp="label"
              disabled={!!projectDeal?.client?._id}
            >
              {clients.map((client) => (
                <Option
                  key={client._id}
                  value={client._id}
                  label={client.entreprise}
                >
                  {client.entreprise}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {projectDeal?.client?._id && (
            <Alert
              type="info"
              showIcon
              title="Client verrouillé"
              description="Le client est hérité du deal pour garantir une liaison cohérente."
              style={{ marginBottom: 12 }}
            />
          )}

          <Form.Item
            name="name"
            label="Nom du projet"
            rules={[{ required: true, message: "Nom du projet requis" }]}
          >
            <Input placeholder="Ex: Déploiement solution" />
          </Form.Item>

          <Form.Item label="Code projet">
            <Input value="Généré automatiquement" disabled />
          </Form.Item>

          <Form.Item name="status" label="Statut" initialValue="Planifie">
            <Select>
              <Option value="Planifie">Planifié</Option>
              <Option value="En cours">En cours</Option>
              <Option value="En pause">En pause</Option>
              <Option value="Termine">Terminé</Option>
              <Option value="Annule">Annulé</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="startDate" label="Date début">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="endDate" label="Date fin">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="budget" label="Budget (€)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Objectifs du projet..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          convertClientDeal
            ? `Créer client pour ${convertClientDeal.title}`
            : "Créer client"
        }
        open={convertClientModalVisible}
        onCancel={() => {
          setConvertClientModalVisible(false);
          setConvertClientDeal(null);
          convertClientForm.resetFields();
        }}
        onOk={handleCreateClientAndConvert}
        okText="Créer client et convertir"
        cancelText="Annuler"
      >
        <Alert
          type="info"
          showIcon
          title="Client requis"
          description="Ce deal n'est lié à aucun client. Créez d'abord une fiche client pour continuer."
          style={{ marginBottom: 12 }}
        />
        <Form form={convertClientForm} layout="vertical">
          <Form.Item
            name="entreprise"
            label="Entreprise"
            rules={[{ required: true, message: "Entreprise requise" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone" rules={[{ required: true, message: "Téléphone requis" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="localite" label="Localité" rules={[{ required: true, message: "Localité requise" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ca" label="CA (€)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="sourceLead" label="Source lead">
            <Input />
          </Form.Item>
          <Form.Item name="adresse" label="Adresse">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Pipeline;
