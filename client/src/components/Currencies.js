import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createCurrency,
  deleteCurrency,
  formatDevise,
  getCurrencies,
  getCurrencyExposure,
  seedCurrencies,
  updateCurrency,
} from "../utils/api";
import "./Currencies.css";

/**
 * Referentiel des devises. Presente en tiroir depuis la facturation : c'est
 * au moment d'emettre un document que le taux compte.
 */
const CurrenciesDrawer = ({ ouvert, onFermer, peutTenirLesTaux }) => {
  const [devises, setDevises] = useState([]);
  const [deviseBase, setDeviseBase] = useState("EUR");
  const [exposition, setExposition] = useState(null);
  const [chargement, setChargement] = useState(false);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [form] = Form.useForm();

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const donnees = await getCurrencies();
      setDevises(donnees.devises || []);
      setDeviseBase(donnees.deviseBase || "EUR");
      // L'exposition releve des finances : son refus ne doit pas empecher la
      // consultation du referentiel.
      getCurrencyExposure().then(setExposition).catch(() => setExposition(null));
    } catch (error) {
      message.error(error.message || "Chargement des devises impossible");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (ouvert) charger();
  }, [ouvert, charger]);

  const amorcer = async () => {
    try {
      const reponse = await seedCurrencies();
      message.success(reponse.message || "Devises installées");
      charger();
    } catch (error) {
      message.error(error.message || "Installation impossible");
    }
  };

  const ouvrirCreation = () => {
    setEnEdition(null);
    form.resetFields();
    form.setFieldsValue({ decimales: 2, actif: true });
    setModaleOuverte(true);
  };

  const ouvrirEdition = (devise) => {
    setEnEdition(devise);
    form.setFieldsValue({
      code: devise.code,
      nom: devise.nom,
      symbole: devise.symbole,
      taux: devise.taux,
      decimales: devise.decimales,
    });
    setModaleOuverte(true);
  };

  const enregistrer = async () => {
    try {
      const valeurs = await form.validateFields();
      if (enEdition) {
        const reponse = await updateCurrency(enEdition._id, valeurs);
        message.success(reponse.message || "Devise mise à jour");
      } else {
        await createCurrency(valeurs);
        message.success("Devise ajoutée");
      }
      setModaleOuverte(false);
      charger();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Enregistrement impossible");
    }
  };

  const supprimer = async (devise) => {
    try {
      const reponse = await deleteCurrency(devise._id);
      message.success(reponse.message || "Devise retirée");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const colonnes = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 110,
      render: (code, devise) => (
        <Space size={6}>
          <span className="devise-code">{code}</span>
          {devise.estBase && <Tag color="blue">référence</Tag>}
        </Space>
      ),
    },
    {
      title: "Devise",
      dataIndex: "nom",
      key: "nom",
      render: (nom, devise) => (
        <div>
          <div className="devise-nom">{nom}</div>
          <div className="devise-meta">
            {devise.symbole || "—"} · {devise.decimales} décimale(s)
          </div>
        </div>
      ),
    },
    {
      title: `Taux (1 unité = ? ${deviseBase})`,
      dataIndex: "taux",
      key: "taux",
      width: 210,
      align: "right",
      render: (taux, devise) => (
        <div>
          <div className="devise-taux">{Number(taux).toFixed(6)}</div>
          {devise.tauxMisAJourLe && !devise.estBase && (
            <div className="devise-meta">
              maj {dayjs(devise.tauxMisAJourLe).format("DD/MM/YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "État",
      dataIndex: "actif",
      key: "actif",
      width: 90,
      render: (actif) => (
        <Tag color={actif ? "green" : "default"}>{actif ? "Active" : "Retirée"}</Tag>
      ),
    },
    ...(peutTenirLesTaux
      ? [
          {
            title: "",
            key: "actions",
            width: 90,
            align: "right",
            render: (_, devise) => (
              <Space size={4}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => ouvrirEdition(devise)}
                />
                {!devise.estBase && (
                  <Popconfirm
                    title="Retirer cette devise ?"
                    description="Si des documents y font référence, elle sera désactivée."
                    okText="Retirer"
                    cancelText="Annuler"
                    onConfirm={() => supprimer(devise)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <Drawer
      title="Devises et taux de change"
      open={ouvert}
      onClose={onFermer}
      width={860}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={charger}>
            Actualiser
          </Button>
          {peutTenirLesTaux && (
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirCreation}>
              Ajouter
            </Button>
          )}
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Comptabilité tenue en ${deviseBase}`}
        description={`Le taux exprime la valeur d'une unité de la devise en ${deviseBase}. Il est figé sur chaque document à son émission : le modifier n'affecte que les documents à venir.`}
      />

      {devises.length === 0 && !chargement ? (
        <Empty description="Aucune devise au référentiel">
          {peutTenirLesTaux && (
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={amorcer}>
              Installer les devises courantes
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {exposition?.repartition?.length > 0 && (
            <div className="devise-exposition">
              <div className="devise-exposition-titre">
                Exposition du portefeuille facturé
              </div>
              <Row gutter={16}>
                {exposition.repartition.map((part) => (
                  <Col key={part.devise} xs={12} sm={8} md={6}>
                    <Statistic
                      title={`${part.devise} · ${part.part} %`}
                      value={formatDevise(part.montantBase, exposition.deviseBase)}
                      valueStyle={{ fontSize: 16 }}
                    />
                    <div className="devise-meta">
                      {part.nombre} facture(s) ·{" "}
                      {part.devise === exposition.deviseBase
                        ? "montant direct"
                        : `${Number(part.montantOrigine).toFixed(2)} ${part.devise}`}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          <Table
            rowKey="_id"
            columns={colonnes}
            dataSource={devises}
            loading={chargement}
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
          />
        </>
      )}

      <Modal
        title={enEdition ? `Modifier ${enEdition.code}` : "Nouvelle devise"}
        open={modaleOuverte}
        onCancel={() => setModaleOuverte(false)}
        onOk={enregistrer}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={12} sm={8}>
              <Form.Item
                name="code"
                label="Code ISO"
                rules={[
                  { required: true, message: "Le code est obligatoire" },
                  { pattern: /^[A-Za-z]{3}$/, message: "Trois lettres (ISO 4217)" },
                ]}
                extra={enEdition ? "Non modifiable" : undefined}
              >
                <Input placeholder="TND" disabled={Boolean(enEdition)} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={16}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={[{ required: true, message: "Le nom est obligatoire" }]}
              >
                <Input placeholder="Dinar tunisien" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={8}>
              <Form.Item name="symbole" label="Symbole">
                <Input placeholder="DT" />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item
                name="taux"
                label={`1 unité = ? ${deviseBase}`}
                rules={[{ required: true, message: "Le taux est obligatoire" }]}
                extra={
                  enEdition?.estBase
                    ? "Devise de référence : figé à 1"
                    : undefined
                }
              >
                <InputNumber
                  min={0.000001}
                  step={0.01}
                  style={{ width: "100%" }}
                  disabled={enEdition?.estBase}
                />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item name="decimales" label="Décimales">
                <InputNumber min={0} max={4} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {enEdition && !enEdition.estBase && (
            <Alert
              type="warning"
              showIcon
              message="Le nouveau taux ne s'applique qu'aux documents à venir"
              description="Les factures déjà émises conservent le taux figé à leur émission : leur contrevaleur comptable ne bouge pas."
            />
          )}
        </Form>
      </Modal>
    </Drawer>
  );
};

export default CurrenciesDrawer;
