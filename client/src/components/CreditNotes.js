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
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createCreditNote,
  deleteCreditNote,
  getCreditNotes,
  issueCreditNote,
} from "../utils/api";
import "./CreditNotes.css";

const formatMontant = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(valeur || 0));

const COULEURS_STATUT = {
  Brouillon: "default",
  "Émis": "blue",
  "Imputé": "green",
  "Remboursé": "orange",
};

/**
 * Journal des avoirs. Presente en tiroir plutot qu'en page : un avoir se lit
 * toujours au regard de la facture qu'il corrige, il n'a pas de vie propre.
 */
export const CreditNotesDrawer = ({ ouvert, onFermer, peutEmettre }) => {
  const [avoirs, setAvoirs] = useState([]);
  const [totaux, setTotaux] = useState({});
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const donnees = await getCreditNotes();
      setAvoirs(donnees.avoirs || []);
      setTotaux(donnees.totaux || {});
    } catch (error) {
      message.error(error.message || "Chargement des avoirs impossible");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (ouvert) charger();
  }, [ouvert, charger]);

  const emettre = async (avoir) => {
    try {
      const reponse = await issueCreditNote(avoir._id);
      message.success(reponse.message || "Avoir émis");
      charger();
    } catch (error) {
      message.error(error.message || "Émission impossible");
    }
  };

  const supprimer = async (avoir) => {
    try {
      await deleteCreditNote(avoir._id);
      message.success("Avoir supprimé");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const colonnes = [
    {
      title: "Numéro",
      dataIndex: "number",
      key: "number",
      width: 140,
      render: (numero) => <span className="avoir-numero">{numero}</span>,
    },
    {
      title: "Facture corrigée",
      key: "facture",
      width: 150,
      render: (_, avoir) => (
        <div>
          <div>{avoir.avoirDe?.number || "—"}</div>
          <div className="avoir-sous-titre">
            {avoir.client?.entreprise || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Motif",
      dataIndex: "motifAvoir",
      key: "motifAvoir",
      render: (motif) => <span className="avoir-motif">{motif}</span>,
    },
    {
      title: "Montant",
      dataIndex: "total",
      key: "total",
      width: 130,
      align: "right",
      render: (montant) => (
        <span className="avoir-montant">-{formatMontant(montant)}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (statut) => <Tag color={COULEURS_STATUT[statut]}>{statut}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      align: "right",
      render: (_, avoir) =>
        avoir.status === "Brouillon" ? (
          <Space size={4}>
            {peutEmettre && (
              <Tooltip title="Imputer sur la facture — irréversible">
                <Popconfirm
                  title="Émettre cet avoir ?"
                  description="Il s'imputera sur la facture et ne pourra plus être modifié."
                  okText="Émettre"
                  cancelText="Annuler"
                  onConfirm={() => emettre(avoir)}
                >
                  <Button type="text" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
            <Popconfirm
              title="Supprimer ce brouillon ?"
              okText="Supprimer"
              cancelText="Annuler"
              onConfirm={() => supprimer(avoir)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) : (
          <Tooltip title="Pièce comptable définitive">
            <span className="avoir-sous-titre">figé</span>
          </Tooltip>
        ),
    },
  ];

  return (
    <Drawer
      title="Avoirs et annulations"
      open={ouvert}
      onClose={onFermer}
      width={980}
      extra={
        <Button icon={<ReloadOutlined />} onClick={charger}>
          Actualiser
        </Button>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Total crédité"
            value={formatMontant(totaux.montant)}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={8}>
          <Statistic title="Brouillons" value={totaux.brouillons ?? 0} />
        </Col>
        <Col span={8}>
          <Statistic title="Émis" value={totaux.emis ?? 0} />
        </Col>
      </Row>

      {avoirs.length === 0 && !chargement ? (
        <Empty description="Aucun avoir émis à ce jour" />
      ) : (
        <Table
          rowKey="_id"
          columns={colonnes}
          dataSource={avoirs}
          loading={chargement}
          pagination={{ pageSize: 12 }}
          scroll={{ x: 900 }}
          size="small"
        />
      )}
    </Drawer>
  );
};

/**
 * Preparation d'un avoir a partir d'une facture. Les lignes sont pre-remplies
 * depuis la facture : le cas courant est l'annulation totale, la correction
 * partielle consiste alors a retrancher ou ajuster.
 */
export const CreateCreditNoteModal = ({ facture, ouvert, onFermer, onCree }) => {
  const [form] = Form.useForm();
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!ouvert || !facture) return;
    form.setFieldsValue({
      motif: "",
      items: (facture.items || []).map((ligne) => ({
        description: ligne.description,
        quantity: ligne.quantity,
        unitPrice: ligne.unitPrice,
      })),
    });
  }, [ouvert, facture, form]);

  const resteCreditable =
    Number(facture?.total || 0) - Number(facture?.creditedAmount || 0);

  const enregistrer = async () => {
    try {
      const valeurs = await form.validateFields();
      setEnCours(true);
      const reponse = await createCreditNote(facture._id, valeurs);
      message.success(reponse.message || "Avoir créé en brouillon");
      onFermer();
      onCree?.();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Création impossible");
    } finally {
      setEnCours(false);
    }
  };

  // Le total TTC prévisionnel se recalcule à la saisie : le plafond doit être
  // visible avant l'envoi, pas découvert dans un message d'erreur.
  const lignes = Form.useWatch("items", form) || [];
  const totalHT = lignes.reduce(
    (somme, ligne) =>
      somme + Number(ligne?.quantity || 0) * Number(ligne?.unitPrice || 0),
    0,
  );
  const totalTTC = totalHT * (1 + Number(facture?.taxRate || 0) / 100);
  const depasse = totalTTC > resteCreditable + 0.01;

  return (
    <Modal
      title={`Avoir sur la facture ${facture?.number || ""}`}
      open={ouvert}
      onCancel={onFermer}
      onOk={enregistrer}
      okText="Créer le brouillon"
      cancelText="Annuler"
      okButtonProps={{ loading: enCours, disabled: depasse }}
      width={760}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Reste créditable : ${formatMontant(resteCreditable)}`}
        description="L'avoir est créé en brouillon. Il ne s'imputera sur la facture qu'à son émission."
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="motif"
          label="Motif"
          rules={[{ required: true, message: "Le motif est obligatoire" }]}
        >
          <Input placeholder="Prestation non réalisée, geste commercial, erreur de facturation…" />
        </Form.Item>

        <Form.List name="items">
          {(champs, { add, remove }) => (
            <div className="avoir-lignes">
              <div className="avoir-lignes-entete">
                <span>Lignes créditées</span>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => add({ quantity: 1, unitPrice: 0 })}
                >
                  Ajouter
                </Button>
              </div>
              {champs.map((champ) => (
                <Row gutter={8} key={champ.key} align="middle">
                  <Col xs={24} sm={13}>
                    <Form.Item
                      name={[champ.name, "description"]}
                      rules={[{ required: true, message: "Description requise" }]}
                    >
                      <Input placeholder="Description" />
                    </Form.Item>
                  </Col>
                  <Col xs={8} sm={4}>
                    <Form.Item
                      name={[champ.name, "quantity"]}
                      rules={[{ required: true, message: "Qté" }]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="Qté" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item
                      name={[champ.name, "unitPrice"]}
                      rules={[{ required: true, message: "Prix" }]}
                    >
                      <InputNumber
                        min={0}
                        step={10}
                        style={{ width: "100%" }}
                        placeholder="Prix HT"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={4} sm={1}>
                    <Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(champ.name)}
                        disabled={champs.length === 1}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
            </div>
          )}
        </Form.List>

        <div className={`avoir-total${depasse ? " avoir-total-depasse" : ""}`}>
          <span>Montant de l'avoir</span>
          <span>
            {formatMontant(totalHT)} HT · <strong>{formatMontant(totalTTC)} TTC</strong>
          </span>
        </div>
        {depasse && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 10 }}
            message="Le montant dépasse le reste créditable sur cette facture"
          />
        )}
      </Form>
    </Modal>
  );
};
