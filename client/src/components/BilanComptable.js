import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  DatePicker,
  Button,
  Space,
  Alert,
  Spin,
  Tag,
  message,
  Empty,
} from "antd";
import {
  ReloadOutlined,
  FilePdfOutlined,
  BankOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getBilanComptable } from "../utils/api";
import "./BilanComptable.css";

const { RangePicker } = DatePicker;

const eur = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

/** Une ligne du bilan : libelle a gauche, montant aligne a droite. */
const ligne = (libelle, montant, options = {}) => ({
  key: libelle,
  libelle,
  montant,
  ...options,
});

function BilanComptable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periode, setPeriode] = useState([
    dayjs().startOf("year"),
    dayjs(),
  ]);

  const charger = useCallback(async (range) => {
    setLoading(true);
    try {
      const [debut, fin] = range || [];
      setData(
        await getBilanComptable({
          dateDebut: debut ? debut.format("YYYY-MM-DD") : undefined,
          dateFin: fin ? fin.format("YYYY-MM-DD") : undefined,
        }),
      );
    } catch (error) {
      message.error(error.message || "Impossible de charger le bilan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger(periode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colonnes = [
    {
      title: "Poste",
      dataIndex: "libelle",
      key: "libelle",
      render: (value, record) => (
        <span className={record.fort ? "bilan-ligne-forte" : ""}>{value}</span>
      ),
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      align: "right",
      width: 160,
      render: (value, record) => (
        <span
          className={
            record.fort
              ? "bilan-montant-fort"
              : value < 0
                ? "bilan-montant-negatif"
                : ""
          }
        >
          {eur(value)}
        </span>
      ),
    },
  ];

  const exporterPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const debut = dayjs(data.periode.debut).format("DD/MM/YYYY");
    const fin = dayjs(data.periode.fin).format("DD/MM/YYYY");

    doc.setFontSize(16);
    doc.text("Bilan comptable simplifié", 14, 18);
    doc.setFontSize(10);
    doc.text(`Période du ${debut} au ${fin}`, 14, 25);
    doc.text(`Édité le ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [["ACTIF", "Montant"]],
      body: [
        ["Trésorerie disponible", eur(data.bilan.actif.tresorerie)],
        ["Créances clients", eur(data.bilan.actif.creancesClients)],
        ["TOTAL ACTIF", eur(data.bilan.actif.total)],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["PASSIF", "Montant"]],
      body: [
        ["Dettes fournisseurs", eur(data.bilan.passif.dettesFournisseurs)],
        ["Dettes sociales", eur(data.bilan.passif.dettesSociales)],
        ["Situation nette", eur(data.bilan.passif.situationNette)],
        ["TOTAL PASSIF", eur(data.bilan.passif.total)],
      ],
    });

    const cr = data.compteDeResultat;
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["COMPTE DE RÉSULTAT", "Montant"]],
      body: [
        [`Produits HT (${cr.nombreFactures} facture(s))`, eur(cr.produits)],
        ["TVA collectée", eur(cr.tvaCollectee)],
        ["Charges décaissées", eur(cr.charges.decaissements)],
        ["Masse salariale", eur(cr.charges.masseSalariale)],
        ["Total des charges", eur(cr.charges.total)],
        ["RÉSULTAT", eur(cr.resultat)],
      ],
    });

    doc.save(`bilan-comptable-${debut}-${fin}.pdf`.replace(/\//g, "-"));
  };

  if (loading && !data) {
    return (
      <div className="bilan-chargement">
        <Spin size="large" tip="Calcul du bilan..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <Empty description="Aucune donnée de bilan" />
      </Card>
    );
  }

  const { bilan, compteDeResultat: cr, fluxTresorerie: flux } = data;

  const lignesActif = [
    ligne("Trésorerie disponible", bilan.actif.tresorerie),
    ligne("Créances clients", bilan.actif.creancesClients),
    ligne("TOTAL ACTIF", bilan.actif.total, { fort: true }),
  ];

  const lignesPassif = [
    ligne("Dettes fournisseurs", bilan.passif.dettesFournisseurs),
    ligne("Dettes sociales", bilan.passif.dettesSociales),
    ligne("Situation nette", bilan.passif.situationNette),
    ligne("TOTAL PASSIF", bilan.passif.total, { fort: true }),
  ];

  const lignesResultat = [
    ligne(`Produits HT (${cr.nombreFactures} facture(s))`, cr.produits),
    ligne("Charges décaissées", -cr.charges.decaissements),
    ligne("Masse salariale", -cr.charges.masseSalariale),
    ligne("RÉSULTAT DE LA PÉRIODE", cr.resultat, { fort: true }),
  ];

  const colonnesComptes = [
    { title: "Compte", dataIndex: "name", key: "name" },
    { title: "Banque", dataIndex: "bankName", key: "bankName" },
    {
      title: "Solde",
      dataIndex: "currentBalance",
      key: "currentBalance",
      align: "right",
      render: (value) => (
        <span className={value < 0 ? "bilan-montant-negatif" : ""}>
          {eur(value)}
        </span>
      ),
    },
  ];

  return (
    <div className="bilan-wrapper">
      <Space className="bilan-barre" wrap>
        <RangePicker
          value={periode}
          format="DD/MM/YYYY"
          allowClear={false}
          onChange={(range) => {
            setPeriode(range);
            charger(range);
          }}
        />
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => charger(periode)}
        >
          Actualiser
        </Button>
        <Button icon={<FilePdfOutlined />} onClick={exporterPDF}>
          Export PDF
        </Button>
        {bilan.equilibre ? (
          <Tag color="green">Actif = Passif</Tag>
        ) : (
          <Tag color="red">Déséquilibre détecté</Tag>
        )}
      </Space>

      <Alert
        className="bilan-avertissement"
        type="info"
        showIcon
        message="Bilan simplifié"
        description="Établi à partir des données du CRM : trésorerie, créances clients, dettes fournisseurs et sociales. Il ne comporte ni immobilisations ni amortissements, et ne remplace pas un bilan établi par un expert-comptable."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="ACTIF" className="bilan-carte">
            <Table
              columns={colonnes}
              dataSource={lignesActif}
              pagination={false}
              size="middle"
              showHeader={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="PASSIF" className="bilan-carte">
            <Table
              columns={colonnes}
              dataSource={lignesPassif}
              pagination={false}
              size="middle"
              showHeader={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="bilan-section">
        <Col xs={24} lg={12}>
          <Card title="Compte de résultat" className="bilan-carte">
            <Table
              columns={colonnes}
              dataSource={lignesResultat}
              pagination={false}
              size="middle"
              showHeader={false}
            />
            <div className="bilan-complement">
              <span>TVA collectée</span>
              <strong>{eur(cr.tvaCollectee)}</strong>
            </div>
            {cr.margeNette !== null && (
              <div className="bilan-complement">
                <span>Marge nette</span>
                <strong
                  className={
                    cr.margeNette >= 0
                      ? "bilan-montant-positif"
                      : "bilan-montant-negatif"
                  }
                >
                  {cr.margeNette.toFixed(1)} %
                </strong>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Flux de trésorerie de la période" className="bilan-carte">
            <div className="bilan-flux">
              <div className="bilan-flux-item">
                <RiseOutlined className="bilan-icone-positive" />
                <div>
                  <div className="bilan-flux-label">Encaissements</div>
                  <div className="bilan-flux-valeur">
                    {eur(flux.encaissements)}
                  </div>
                </div>
              </div>
              <div className="bilan-flux-item">
                <FallOutlined className="bilan-icone-negative" />
                <div>
                  <div className="bilan-flux-label">Decaissements</div>
                  <div className="bilan-flux-valeur">
                    {eur(flux.decaissements)}
                  </div>
                </div>
              </div>
              <div className="bilan-flux-item">
                <BankOutlined className="bilan-icone-neutre" />
                <div>
                  <div className="bilan-flux-label">Flux net</div>
                  <div
                    className={`bilan-flux-valeur ${
                      flux.fluxNet >= 0
                        ? "bilan-montant-positif"
                        : "bilan-montant-negatif"
                    }`}
                  >
                    {eur(flux.fluxNet)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {cr.charges.parCategorie.length > 0 && (
        <Card title="Charges par catégorie" className="bilan-carte bilan-section">
          <Table
            rowKey="categorie"
            columns={[
              { title: "Catégorie", dataIndex: "categorie", key: "categorie" },
              {
                title: "Nombre",
                dataIndex: "nombre",
                key: "nombre",
                width: 100,
                align: "right",
              },
              {
                title: "Montant",
                dataIndex: "montant",
                key: "montant",
                align: "right",
                width: 160,
                render: (value) => eur(value),
              },
            ]}
            dataSource={cr.charges.parCategorie}
            pagination={false}
            size="middle"
          />
        </Card>
      )}

      {bilan.actif.detailComptes?.length > 0 && (
        <Card title="Détail des comptes bancaires" className="bilan-carte bilan-section">
          <Table
            rowKey="_id"
            columns={colonnesComptes}
            dataSource={bilan.actif.detailComptes}
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
}

export default BilanComptable;
