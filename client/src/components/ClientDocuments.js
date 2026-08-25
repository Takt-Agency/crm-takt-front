import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  InboxOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteClientDocument,
  downloadClientDataExport,
  downloadClientDocument,
  eraseClientData,
  getClientDocuments,
  getErasurePreview,
  uploadClientDocuments,
} from "../utils/api";
import "./ClientDocuments.css";

const { Option } = Select;
const { Paragraph, Text } = Typography;

const CATEGORIES = [
  "Contrat",
  "Cahier des charges",
  "Brief",
  "Devis signé",
  "Administratif",
  "Autre",
];

const COULEURS_CATEGORIE = {
  Contrat: "green",
  "Cahier des charges": "blue",
  Brief: "purple",
  "Devis signé": "cyan",
  Administratif: "orange",
  Autre: "default",
};

const formatTaille = (octets) => {
  const valeur = Number(octets || 0);
  if (valeur < 1024) return `${valeur} o`;
  if (valeur < 1024 * 1024) return `${(valeur / 1024).toFixed(0)} Ko`;
  return `${(valeur / (1024 * 1024)).toFixed(1)} Mo`;
};

/** Pièces rattachées au dossier client : contrats, briefs, cahiers des charges. */
export const ClientDocumentsDrawer = ({ client, ouvert, onFermer }) => {
  const [documents, setDocuments] = useState([]);
  const [resume, setResume] = useState({ total: 0, tailleTotale: 0 });
  const [chargement, setChargement] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [categorie, setCategorie] = useState("Autre");

  const charger = useCallback(async () => {
    if (!client?._id) return;
    setChargement(true);
    try {
      const donnees = await getClientDocuments(client._id);
      setDocuments(donnees.documents || []);
      setResume({
        total: donnees.total || 0,
        tailleTotale: donnees.tailleTotale || 0,
      });
    } catch (error) {
      message.error(error.message || "Chargement des documents impossible");
    } finally {
      setChargement(false);
    }
  }, [client]);

  useEffect(() => {
    if (ouvert) charger();
  }, [ouvert, charger]);

  // Le televersement est pilote a la main : antd enverrait sinon un fichier
  // par requete, sans la categorie choisie.
  const televerser = async (fichier) => {
    setEnvoiEnCours(true);
    try {
      const donnees = new FormData();
      donnees.append("files", fichier);
      donnees.append("categorie", categorie);
      await uploadClientDocuments(client._id, donnees);
      message.success(`${fichier.name} déposé`);
      charger();
    } catch (error) {
      message.error(error.message || "Dépôt impossible");
    } finally {
      setEnvoiEnCours(false);
    }
    return false;
  };

  const telecharger = async (document) => {
    try {
      await downloadClientDocument(client._id, document._id, document.nom);
    } catch (error) {
      message.error(error.message || "Téléchargement impossible");
    }
  };

  const supprimer = async (document) => {
    try {
      await deleteClientDocument(client._id, document._id);
      message.success("Document supprimé");
      charger();
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  return (
    <Drawer
      title={`Documents — ${client?.entreprise || ""}`}
      open={ouvert}
      onClose={onFermer}
      width={620}
      extra={
        <Button icon={<ReloadOutlined />} onClick={charger}>
          Actualiser
        </Button>
      }
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space>
          <Text type="secondary">Catégorie du dépôt</Text>
          <Select value={categorie} onChange={setCategorie} style={{ width: 200 }}>
            {CATEGORIES.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Space>

        <Upload.Dragger
          multiple
          beforeUpload={televerser}
          showUploadList={false}
          disabled={envoiEnCours}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Déposer un fichier ou cliquer pour parcourir
          </p>
          <p className="ant-upload-hint">
            PDF, images, Word, Excel, texte ou archive — 15 Mo maximum
          </p>
        </Upload.Dragger>

        {envoiEnCours && <Spin />}

        <div className="documents-resume">
          {resume.total} document(s) · {formatTaille(resume.tailleTotale)}
        </div>

        {documents.length === 0 && !chargement ? (
          <Empty description="Aucun document rattaché à ce client" />
        ) : (
          <List
            loading={chargement}
            dataSource={documents}
            renderItem={(document) => (
              <List.Item
                actions={[
                  <Button
                    key="dl"
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() => telecharger(document)}
                  />,
                  <Popconfirm
                    key="rm"
                    title="Supprimer ce document ?"
                    okText="Supprimer"
                    cancelText="Annuler"
                    onConfirm={() => supprimer(document)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileOutlined className="documents-icone" />}
                  title={
                    <Space size={8} wrap>
                      <span className="documents-nom">{document.nom}</span>
                      <Tag color={COULEURS_CATEGORIE[document.categorie]}>
                        {document.categorie}
                      </Tag>
                    </Space>
                  }
                  description={
                    <span className="documents-meta">
                      {formatTaille(document.taille)} ·{" "}
                      {dayjs(document.televerseLe).format("DD/MM/YYYY à HH:mm")}
                      {document.televersePar?.name
                        ? ` · ${document.televersePar.name}`
                        : ""}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Drawer>
  );
};

/**
 * Droits d'acces et d'effacement.
 *
 * L'effacement etant irreversible, il n'est propose qu'apres un etat des
 * lieux : ce qui disparait, ce qui subsiste, et ce qui s'y oppose.
 */
export const ClientRgpdModal = ({ client, ouvert, onFermer, onEfface }) => {
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!ouvert || !client?._id) return;
    setConfirmation("");
    setChargement(true);
    getErasurePreview(client._id)
      .then(setApercu)
      .catch((error) => message.error(error.message || "Analyse impossible"))
      .finally(() => setChargement(false));
  }, [ouvert, client]);

  const exporter = async () => {
    try {
      await downloadClientDataExport(client._id, client.entreprise);
      message.success("Export généré");
    } catch (error) {
      message.error(error.message || "Export impossible");
    }
  };

  const effacer = async () => {
    setEnCours(true);
    try {
      const reponse = await eraseClientData(client._id);
      message.success(reponse.message || "Données personnelles effacées");
      onFermer();
      onEfface?.();
    } catch (error) {
      message.error(error.message || "Effacement impossible");
    } finally {
      setEnCours(false);
    }
  };

  // La saisie de la raison sociale evite l'effacement declenche par megarde.
  const confirmationValide =
    confirmation.trim().toLowerCase() ===
    String(client?.entreprise || "").trim().toLowerCase();

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined />
          {`Données personnelles — ${client?.entreprise || ""}`}
        </Space>
      }
      open={ouvert}
      onCancel={onFermer}
      footer={null}
      width={680}
    >
      {chargement ? (
        <div className="rgpd-attente">
          <Spin />
        </div>
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              Droit d&apos;accès et de portabilité (RGPD, articles 15 et 20) :
              l&apos;export rassemble toutes les données détenues sur ce client,
              tous modules confondus.
            </Paragraph>
            <Button icon={<DownloadOutlined />} onClick={exporter}>
              Exporter les données (JSON)
            </Button>
          </div>

          {apercu?.dejaAnonymise ? (
            <Alert
              type="success"
              showIcon
              message="Dossier déjà effacé"
              description="Les données personnelles de ce client ont été supprimées. Seules les pièces comptables subsistent."
            />
          ) : (
            <>
              <Descriptions
                size="small"
                bordered
                column={1}
                title="Effacement — état des lieux"
              >
                <Descriptions.Item label="Sera effacé">
                  {apercu?.seraEfface?.identite}
                  <br />
                  {apercu?.seraEfface?.contacts ?? 0} contact(s),{" "}
                  {apercu?.seraEfface?.interactions ?? 0} interaction(s),{" "}
                  {apercu?.seraEfface?.documents ?? 0} document(s)
                </Descriptions.Item>
                <Descriptions.Item label="Sera conservé">
                  {apercu?.seraConserve?.documentsComptables ?? 0} pièce(s)
                  comptable(s)
                  <br />
                  <Text type="secondary">{apercu?.seraConserve?.motif}</Text>
                </Descriptions.Item>
              </Descriptions>

              {apercu?.obstacles?.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  message="Effacement impossible en l'état"
                  description={
                    <ul className="rgpd-obstacles">
                      {apercu.obstacles.map((obstacle) => (
                        <li key={obstacle}>{obstacle}</li>
                      ))}
                    </ul>
                  }
                />
              ) : (
                <>
                  <Alert
                    type="error"
                    showIcon
                    message="Action irréversible"
                    description="Les données personnelles seront écrasées, non masquées. Elles ne pourront pas être restaurées."
                  />
                  <Form layout="vertical">
                    <Form.Item
                      label={`Saisir « ${client?.entreprise} » pour confirmer`}
                    >
                      <Input
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder={client?.entreprise}
                      />
                    </Form.Item>
                  </Form>
                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    disabled={!confirmationValide}
                    loading={enCours}
                    onClick={effacer}
                  >
                    Effacer les données personnelles
                  </Button>
                </>
              )}
            </>
          )}
        </Space>
      )}
    </Modal>
  );
};
