import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Tag,
  DatePicker,
  InputNumber,
  Popconfirm,
  Tooltip,
  Tabs,
} from "antd";
import {
  ProjectOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getAllProjects,
  createProject,
  updateProjectById,
  deleteProjectById,
  getAllClients,
} from "../utils/api";
import { useOngletUrl, cleOnglet } from "../hooks/useOngletUrl";
import "./Dashboard.css";

const { Option } = Select;

const STATUSES = ["Planifie", "En cours", "En pause", "Termine", "Annule"];

const STATUS_LABELS = {
  Planifie: "Planifié",
  "En cours": "En cours",
  "En pause": "En pause",
  Termine: "Terminé",
  Annule: "Annulé",
};

const STATUS_COLORS = {
  Planifie: "default",
  "En cours": "blue",
  "En pause": "orange",
  Termine: "green",
  Annule: "red",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

// Un onglet par etat de projet : libelles et valeurs viennent des tables
// deja definies plus haut, aucune liste n'est dupliquee.
const ONGLETS = [
  { key: "tous", label: "Tous" },
  ...STATUSES.map((statut) => ({
    key: cleOnglet(statut),
    label: STATUS_LABELS[statut],
  })),
];
const STATUT_PAR_ONGLET = Object.fromEntries([
  ["tous", ""],
  ...STATUSES.map((statut) => [cleOnglet(statut), statut]),
]);

function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);
  const statusFilter = STATUT_PAR_ONGLET[ongletActif];
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchClients = async () => {
    try {
      const data = await getAllClients({ limit: 500 });
      setClients(data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProjects = async (searchOverride) => {
    setLoading(true);
    try {
      const data = await getAllProjects({
        status: statusFilter || undefined,
        search: (searchOverride ?? search) || undefined,
        limit: 200,
      });
      setProjects(data.projects || []);
    } catch (error) {
      message.error(error.message || "Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchProjects(value);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({ status: "Planifie" });
    setModalVisible(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      client: project.client?._id,
      status: project.status,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: project.endDate ? dayjs(project.endDate) : null,
      budget: project.budget,
      description: project.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        client: values.client,
        status: values.status,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        budget: values.budget,
        description: values.description,
      };

      if (editingProject?._id) {
        await updateProjectById(editingProject._id, payload);
        message.success("Projet mis à jour");
      } else {
        await createProject(payload);
        message.success("Projet créé");
      }

      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
      fetchProjects();
    } catch (error) {
      if (!error.errorFields) {
        message.error(error.message || "Erreur lors de l'enregistrement du projet");
      }
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await deleteProjectById(projectId);
      message.success("Projet supprimé");
      fetchProjects();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const columns = [
    {
      title: "Projet",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <strong>{name}</strong>
          {record.code && <span style={{ color: "var(--text-subtle)", fontSize: 12 }}>{record.code}</span>}
        </Space>
      ),
    },
    {
      title: "Client",
      dataIndex: ["client", "entreprise"],
      key: "client",
      render: (_, record) => record.client?.entreprise || "-",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || "default"}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (budget) => (budget ? formatCurrency(budget) : "-"),
    },
    {
      title: "Échéance",
      dataIndex: "endDate",
      key: "endDate",
      render: (endDate) => (endDate ? dayjs(endDate).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer ce projet ?"
            okText="Supprimer"
            cancelText="Annuler"
            onConfirm={() => handleDelete(record._id)}
          >
            <Tooltip title="Supprimer">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <ProjectOutlined style={{ marginRight: 8 }} />
          Projets
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Nouveau projet
        </Button>
      </div>

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Rechercher un projet..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 280 }}
          onSearch={handleSearch}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProject ? "Modifier le projet" : "Nouveau projet"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        okText={editingProject ? "Enregistrer" : "Créer"}
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nom du projet"
            rules={[{ required: true, message: "Le nom du projet est requis" }]}
          >
            <Input placeholder="Nom du projet" />
          </Form.Item>
          <Form.Item
            name="client"
            label="Client"
            rules={[{ required: true, message: "Le client est requis" }]}
          >
            <Select
              showSearch
              placeholder="Sélectionner un client"
              optionFilterProp="children"
            >
              {clients.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.entreprise}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Statut">
            <Select>
              {STATUSES.map((status) => (
                <Option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Space style={{ width: "100%" }} size="large">
            <Form.Item name="startDate" label="Date de début">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="endDate" label="Échéance">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>
          <Form.Item name="budget" label="Budget (€)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description du projet" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Projects;
