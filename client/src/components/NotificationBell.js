import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Popover, Empty, Spin, Tooltip, message } from "antd";
import {
  BellOutlined,
  CheckSquareOutlined,
  RiseOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EuroOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../utils/api";
import "./NotificationBell.css";

/** Intervalle de rafraichissement du compteur, en millisecondes. */
const PERIODE_SONDAGE = 60 * 1000;

const ICONES = {
  tache: <CheckSquareOutlined />,
  opportunite: <RiseOutlined />,
  facture: <FileTextOutlined />,
  conge: <CalendarOutlined />,
  paie: <EuroOutlined />,
  fournisseur: <ShopOutlined />,
  achat: <ShoppingCartOutlined />,
  systeme: <InfoCircleOutlined />,
};

/**
 * Horodatage relatif. Une notification se lit a l'echelle de la minute ou du
 * jour : une date complete obligerait le lecteur a faire le calcul lui-meme.
 */
const depuis = (date) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours < 7) return `il y a ${jours} j`;
  return new Date(date).toLocaleDateString("fr-FR");
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [chargement, setChargement] = useState(false);
  const monte = useRef(true);

  // Seul le compteur est sonde en continu : la liste complete n'est chargee
  // qu'a l'ouverture du panneau.
  const rafraichirCompteur = useCallback(async () => {
    try {
      const total = await getUnreadNotificationCount();
      if (monte.current) setNonLues(total);
    } catch {
      // Un echec de sondage ne doit pas interrompre la navigation.
    }
  }, []);

  const chargerListe = useCallback(async () => {
    setChargement(true);
    try {
      const data = await getNotifications({ limit: 20 });
      if (!monte.current) return;
      setNotifications(data.notifications || []);
      setNonLues(data.nonLues || 0);
    } catch (error) {
      message.error(error.message || "Chargement des notifications impossible");
    } finally {
      if (monte.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    monte.current = true;
    rafraichirCompteur();
    const minuterie = setInterval(rafraichirCompteur, PERIODE_SONDAGE);
    return () => {
      monte.current = false;
      clearInterval(minuterie);
    };
  }, [rafraichirCompteur]);

  const basculer = (visible) => {
    setOuvert(visible);
    if (visible) chargerListe();
  };

  const ouvrir = async (notification) => {
    if (!notification.lu) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((liste) =>
          liste.map((n) => (n._id === notification._id ? { ...n, lu: true } : n)),
        );
        setNonLues((n) => Math.max(0, n - 1));
      } catch {
        // La navigation reste possible meme si le marquage a echoue.
      }
    }
    if (notification.lien) {
      setOuvert(false);
      navigate(notification.lien);
    }
  };

  const toutMarquer = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((liste) => liste.map((n) => ({ ...n, lu: true })));
      setNonLues(0);
    } catch (error) {
      message.error(error.message || "Opération impossible");
    }
  };

  const supprimer = async (event, notification) => {
    event.stopPropagation();
    try {
      await deleteNotification(notification._id);
      setNotifications((liste) => liste.filter((n) => n._id !== notification._id));
      if (!notification.lu) setNonLues((n) => Math.max(0, n - 1));
    } catch (error) {
      message.error(error.message || "Suppression impossible");
    }
  };

  const contenu = (
    <div className="notif-panneau">
      <div className="notif-entete">
        <span className="notif-titre-panneau">
          Notifications
          {nonLues > 0 && <span className="notif-compteur">{nonLues}</span>}
        </span>
        {nonLues > 0 && (
          <Button type="link" size="small" onClick={toutMarquer}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="notif-liste">
        {chargement ? (
          <div className="notif-vide">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-vide">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Aucune notification"
            />
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notif-item notif-${notification.niveau}${
                notification.lu ? " notif-lue" : ""
              }`}
              onClick={() => ouvrir(notification)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") ouvrir(notification);
              }}
            >
              <span className="notif-icone">
                {ICONES[notification.type] || ICONES.systeme}
              </span>
              <div className="notif-corps">
                <div className="notif-ligne-titre">
                  <span className="notif-titre">{notification.titre}</span>
                  <span className="notif-date">{depuis(notification.createdAt)}</span>
                </div>
                {notification.message && (
                  <p className="notif-message">{notification.message}</p>
                )}
              </div>
              <Tooltip title="Supprimer">
                <button
                  type="button"
                  className="notif-supprimer"
                  onClick={(event) => supprimer(event, notification)}
                  aria-label="Supprimer la notification"
                >
                  <CloseOutlined />
                </button>
              </Tooltip>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notif-pied">
          <CheckOutlined /> {notifications.length} notification(s) récente(s)
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={contenu}
      trigger="click"
      placement="bottomRight"
      open={ouvert}
      onOpenChange={basculer}
      classNames={{ root: "notif-popover" }}
    >
      <Badge count={nonLues} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined />} className="header-icon-btn" />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
