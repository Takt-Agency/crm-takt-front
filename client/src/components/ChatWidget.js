import React, { useMemo, useState } from "react";
import { Button, Drawer, Input, Spin } from "antd";
import { MessageOutlined, SendOutlined } from "@ant-design/icons";
import { sendChatMessage } from "../utils/api";
import "./ChatWidget.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Bonjour. Je suis votre assistant CRM. Posez vos questions sur la plateforme.",
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedInput = useMemo(() => inputValue.trim(), [inputValue]);

  const handleSend = async () => {
    if (!trimmedInput || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmedInput }];
    setMessages(nextMessages);
    setInputValue("");
    setLoading(true);

    try {
      const data = await sendChatMessage({
        message: trimmedInput,
        history: nextMessages.slice(-8),
      });

      const reply = data?.reply || "Je ne peux pas repondre pour le moment.";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      const errorMessage =
        error?.message || "Erreur lors de la reponse. Veuillez reessayer.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        className="chat-fab"
        icon={<MessageOutlined />}
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le chatbot"
      />

      <Drawer
        title="Assistant CRM"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        size="default"
        className="chat-drawer"
      >
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`chat-message ${message.role}`}
            >
              <div className="chat-bubble">{message.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="chat-bubble">
                <Spin size="small" />
              </div>
            </div>
          )}
        </div>

        <div className="chat-input">
          <Input.TextArea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ecrivez votre question..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!trimmedInput || loading}
          >
            Envoyer
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default ChatWidget;
