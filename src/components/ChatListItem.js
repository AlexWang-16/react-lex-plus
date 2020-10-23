import React from "react";
import "./ChatListItem.css";

function ChatListItem(props) {
  const conversationStyle = {
    width: "400px",
    height: props.style.height,
    border: "px solid #ccc",
    backgroundColor: props.style.backgroundColor,
    padding: "4px",
    overflow: "scroll",
    borderBottom: "thin ridge #bfbfbf",
  };
  function renderItem(item, index) {
    let style = "";

    switch (item["from"]) {
      case "bot":
        style = "bot-messageBubble";
        return (
          <div key={index}>
            <p className={style} key={index}>
              {item["msg"]}
            </p>
          </div>
        );
      case "user":
        style = "user-messageBubble";
        return (
          <div key={index}>
            <p className={style} key={index}>
              {item["msg"]}
            </p>
          </div>
        );
      case "error":
        style = "error-messageBubble";
        return (
          <div key={index}>
            <p className={style} key={index}>
              {item["msg"]}
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div style={conversationStyle}>
      <p className="bot-messageBubble">{props.greeting}</p>
      {props.message.map((items, index) => renderItem(items, index))}
    </div>
  );
}

export default ChatListItem;
