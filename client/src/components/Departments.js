import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getMe,
  getDepartments,
  getOrganisation,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignEmployeeToDepartment,
  getAllUsers,
} from "../utils/api";
import { canAccessModule } from "../utils/accessControl";
import { useOngletUrl } from "../hooks/useOngletUrl";
import "./Dashboard.css";
import "./Departments.css";

const { Option } = Select;

const ONGLETS = [
  { key: "departements", label: "Départements" },
  { key: "organisation", label: "Organisation" },
];

const montant = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(valeur || 0));

/**
 * Directions fonctionnelles. Le département déclare laquelle le pilote ; le
 * circuit d'approbation cherche alors le titulaire actif de ce rôle.
 */
const DIRECTIONS = [
  { valeur: "directeur_administratif_financier", label: "Directeur administratif et financier (DAF)" },
  { valeur: "directeur_ressources_humaines", label: "Directeur des ressources humaines (DRH)" },
  { valeur: "directeur_commercial", label: "Directeur commercial" },
  { valeur: "directeur_systemes_information", label: "Directeur des systèmes d'information (DSI)" },
  { valeur: "directeur_production", label: "Directeur de production" },
  { valeur: "directeur_marketing", label: "Directeur marketing" },
];

const LIBELLE_DIRECTION = Object.fromEntries(
  DIRECTIONS.map((d) => [d.valeur, d.label]),
);

/** Seuls ces profils ont vocation à diriger un service. */
const ROLES_DIRIGEANTS = [
  "super_admin",
  "administrateur",
  "directeur_general",
  ...DIRECTIONS.map((d) => d.valeur),
  "manager",
  "rh",
];

const Departments = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [ongletActif, choisirOnglet] = useOngletUrl(ONGLETS);

  const [departements, setDepartements] = useState([]);
  const [organisation, setOrganisation] = useState([]);
  const [orphelins, setOrphelins] = useState([]);
  const [dirigeants, setDirigeants] = useState([]);
  const [chargement, setChargement] = useState(false);

  const [modale, setModale] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [rattachement, setRattachement] = useState(null);
  const [form] = Form.useForm();
  const [formRattachement] = Form.useForm();

  const peutGerer =
    utilisateur && canAccessModule(utilisateur, "departments.manage");

  useEffect(() => {
    getMe().then(setUtilisateur).catch(() => {});
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [liste, orga] = await Promise.all([
        getDepartments(),
        getOrganisation(),
      ]);
      setDepartements(liste);
      setOrganisation(orga.organisation || []);
      setOrphelins(orga.orphelins || []);
    } catch (error) {
      message.error(error.message || "Chargement des départements impossible");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!peutGerer) return;
    getAllUsers({ limit: 200 })
      .then((data) => {
        const comptes = data?.users || (Array.isArray(data) ? data : []);
        setDirigeants(comptes.filter((u) => ROLES_DIRIGEANTS.includes(u.role)));
      })
      .catch(() => {});
  }, [peutGerer]);

  const ouvrir = (departement = null) => {
    setEnEdition(departement);
    if (departement) {
      form.setFieldsValue({
        code: departement.code,
        nom: departement.nom,
        description: departement.description,
        roleDirecteur: departement.roleDirecteur || null,
        responsable: departement.responsable?._id || null,
        plafondApprobation: departement.plafondApprobation,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ plafondApprobation: 5000 });
    }
    setModale(true);
  };

  const enregistrer = async () => {
    try {
      const valeurs = await form.validateFields();
      if (enEdition) {
        const reponse = await updateDepartment(enEdition._id, valeurs);
        message.success(reponse.message || "Département mis à jour");
      } else {
        await createDepartment(valeurs);
        message.success("Département créé");
      }
      setModale(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Enregistrement impossible");
    }
  };

  const supprimer = async (departement) => {
    try {
      const reponse = await deleteDepartment(departement._id);
      message.success(reponse.message || "Département supprimé");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const rattacher = async () => {
    try {
      const valeurs = await formRattachement.validateFields();
      await assignEmployeeToDepartment({
        employeeId: rattachement._id,
        departement: valeurs.departement,
      });
      message.success("Employé rattaché");
      setRattachement(null);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Rattachement impossible");
    }
  };

  const colonnes = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 100,
      render: (code) => <Tag className="dept-code">{code}</Tag>,
    },
    {
      title: "Département",
      dataIndex: "nom",
      key: "nom",
      render: (nom, d) => (
        <div>
          <div className="dept-titre">{nom}</div>
          {d.description && <div className="dept-sous-titre">{d.description}</div>}
        </div>
      ),
    },
    {
      title: "Direction",
      key: "direction",
      width: 260,
      render: (_, d) => (
        <div>
          {d.roleDirecteur ? (
            <Tag color="volcano">{LIBELLE_DIRECTION[d.roleDirecteur] || d.roleDirecteur}</Tag>
          ) : (
            <Tag>Rattaché à la direction générale</Tag>
          )}
          {/* Le titulaire effectif : nommément désigné, ou déduit du rôle. */}
          {d.titulaire ? (
            <div className="dept-sous-titre">
              {d.titulaire.name}
              {d.titulaire.parRole ? " (par le rôle)" : " (désigné)"}
            </div>
          ) : (
            <Tooltip title="Aucun titulaire : les demandes de ce service remontent directement à la direction générale">
              <div className="dept-sous-titre dept-alerte">Poste vacant</div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Effectif",
      dataIndex: "effectif",
      key: "effectif",
      width: 100,
      align: "center",
      sorter: (a, b) => (a.effectif || 0) - (b.effectif || 0),
      render: (n) => <Tag>{n || 0}</Tag>,
    },
    {
      title: "Plafond d'approbation",
      dataIndex: "plafondApprobation",
      key: "plafondApprobation",
      width: 180,
      align: "right",
      render: (p) => (
        <Tooltip title="Au-delà de ce montant, la demande remonte à la direction générale">
          <span>{montant(p)}</span>
        </Tooltip>
      ),
    },
    {
      title: "État",
      dataIndex: "actif",
      key: "actif",
      width: 100,
      render: (actif) => (
        <Tag color={actif ? "green" : "default"}>{actif ? "Actif" : "Fermé"}</Tag>
      ),
    },
    ...(peutGerer
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 110,
            align: "right",
            render: (_, d) => (
              <Space size={4}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => ouvrir(d)}
                />
                <Popconfirm
                  title="Supprimer ce département ?"
                  description="S'il compte des employés, il sera désactivé plutôt que supprimé."
                  okText="Supprimer"
                  cancelText="Annuler"
                  onConfirm={() => supprimer(d)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const vueOrganisation = (
    <div className="dept-organisation">
      {orphelins.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${orphelins.length} employé(s) rattaché(s) à un service inexistant`}
          description={
            <div>
              {orphelins.map((e) => (
                <div key={e._id} className="dept-orphelin">
                  <span>
                    {e.firstName} {e.lastName} — {e.department || "aucun"}
                  </span>
                  {peutGerer && (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        formRattachement.resetFields();
                        setRattachement(e);
                      }}
                    >
                      Rattacher
                    </Button>
                  )}
                </div>
              ))}
            </div>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {organisation.map((d) => (
          <Col xs={24} md={12} xl={8} key={d._id}>
            <Card
              className="dept-carte"
              title={
                <Space>
                  <Tag className="dept-code">{d.code}</Tag>
                  <span>{d.nom}</span>
                </Space>
              }
              extra={<Tag>{d.membres.length}</Tag>}
            >
              <div className="dept-responsable">
                <UserOutlined />{" "}
                {d.responsable ? (
                  <strong>{d.responsable.name}</strong>
                ) : d.roleDirecteur ? (
                  <span className="dept-sous-titre">
                    {LIBELLE_DIRECTION[d.roleDirecteur] || d.roleDirecteur}
                  </span>
                ) : (
                  <span className="dept-sous-titre">Direction générale</span>
                )}
              </div>
              <div className="dept-plafond">
                Approuve seul jusqu'à <strong>{montant(d.plafondApprobation)}</strong>
              </div>
              <div className="dept-membres">
                {d.membres.length === 0 ? (
                  <span className="dept-sous-titre">Aucun agent rattaché</span>
                ) : (
                  d.membres.map((m) => (
                    <div key={m._id} className="dept-membre">
                      <TeamOutlined />
                      <span>
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="dept-sous-titre">{m.position}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div className="dashboard-content departements-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          Départements
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={charger}>
            Actualiser
          </Button>
          {peutGerer && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => ouvrir()}>
              Nouveau département
            </Button>
          )}
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Le responsable d'un département approuve les demandes d'achat de son service"
        description="Au-delà de son plafond, la demande remonte à la direction générale. Un service sans responsable fait remonter toutes ses demandes."
      />

      <Tabs
        activeKey={ongletActif}
        onChange={choisirOnglet}
        items={ONGLETS}
        className="module-tabs"
      />

      {ongletActif === "departements" ? (
        <Table
          rowKey="_id"
          columns={colonnes}
          dataSource={departements}
          loading={chargement}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1000 }}
        />
      ) : (
        vueOrganisation
      )}

      <Modal
        title={enEdition ? "Modifier le département" : "Nouveau département"}
        open={modale}
        onCancel={() => setModale(false)}
        onOk={enregistrer}
        okText="Enregistrer"
        cancelText="Annuler"
        width={620}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="code"
                label="Code"
                rules={[
                  { required: true, message: "Le code est obligatoire" },
                  {
                    pattern: /^[A-Za-z0-9-]{2,10}$/,
                    message: "2 à 10 caractères",
                  },
                ]}
              >
                <Input placeholder="IT" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={[{ required: true, message: "Le nom est obligatoire" }]}
                extra={
                  enEdition
                    ? "Renommer reporte le nouveau nom sur les fiches, tâches et demandes rattachées."
                    : undefined
                }
              >
                <Input placeholder="Systèmes d'information" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="roleDirecteur"
            label="Direction qui pilote le service"
            extra="Le circuit cherchera le titulaire actif de ce rôle. Laisser vide rattache le service à la direction générale."
          >
            <Select allowClear placeholder="Choisir la direction">
              {DIRECTIONS.map((d) => (
                <Option key={d.valeur} value={d.valeur}>
                  {d.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="responsable"
            label="Responsable nommément désigné (facultatif)"
            extra="Prime sur la direction ci-dessus. Utile pour un intérim."
          >
            <Select allowClear placeholder="Désigner un responsable" showSearch
              optionFilterProp="children">
              {dirigeants.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.name} — {u.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="plafondApprobation"
            label="Plafond d'approbation (€)"
            extra="Montant que le responsable peut approuver seul. Au-delà, la direction générale tranche."
          >
            <InputNumber min={0} step={500} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Rattacher ${rattachement?.firstName || ""} ${rattachement?.lastName || ""}`}
        open={!!rattachement}
        onCancel={() => setRattachement(null)}
        onOk={rattacher}
        okText="Rattacher"
        cancelText="Annuler"
      >
        <Form form={formRattachement} layout="vertical">
          <Form.Item
            name="departement"
            label="Département"
            rules={[{ required: true, message: "Choisissez un département" }]}
          >
            <Select placeholder="Choisir le département">
              {departements
                .filter((d) => d.actif)
                .map((d) => (
                  <Option key={d._id} value={d.nom}>
                    {d.code} — {d.nom}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Departments;
