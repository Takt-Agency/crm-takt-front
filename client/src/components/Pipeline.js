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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  UserOutlined,
  EuroCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import "./Pipeline.css";
import {
  getAllDeals,
  getPipelineStats,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
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
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [form] = Form.useForm();

  const stages = ["Prospect", "Qualification", "Proposition", "Négociation"];

  // Load deals on component mount
  useEffect(() => {
    loadDeals();
    loadStats();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await getAllDeals();
      setDeals(data || []);
    } catch (error) {
      message.error("Erreur lors du chargement des deals");
      console.error(error);
    } finally {
      setLoading(false);
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
      expectedCloseDate: deal.expectedCloseDate
        ? dayjs(deal.expectedCloseDate)
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
    } catch (error) {
      message.error(error.message || "Erreur lors de l'enregistrement");
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

          <Form.Item
            name={["assignedTo", "name"]}
            label="Assigné à"
            rules={[{ required: true, message: "Assignation requise" }]}
          >
            <Input placeholder="Nom de la personne" />
          </Form.Item>

          <Form.Item name="expectedCloseDate" label="Date de clôture prévue">
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
        </Form>
      </Modal>
    </div>
  );
};

export default Pipeline;
