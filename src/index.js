import React, { useEffect, useState, useRef } from "react";
import { isEqual } from "lodash";
import PropTypes from "prop-types";
import merge from "lodash/merge";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { LexRuntimeService } from "@aws-sdk/client-lex-runtime-service";
import ChatListItem from "./components/ChatListItem";
import "./styles/chatbot.css";

function LexChat(props) {
  let lexRunTime = new LexRuntimeService({
    region: props.region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({
        region: props.region,
      }),
      identityPoolId: props.IdentityPoolId,
    }),
  });

  const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  //default states being set
  const [state, setState] = useState({
    data: "",
    sessionAttributes: "",
    visible: "closed",
    messages: [],
  });

  //sets an one time lexUserId that is unique to the user during the time of use on the chat.
  const [lexUserId] = useState(`chatbot${Date.now()}`);
  const prevSessionAttributes = usePrevious(props.sessionAttributes);

  useEffect(() => {
    if (
      prevSessionAttributes &&
      !isEqual(prevSessionAttributes, props.sessionAttributes)
    ) {
      setState({
        ...state,
        sessionAttributes: {
          ...state.sessionAttributes,
          ...props.sessionAttributes,
        },
      });
    }
  }, [prevSessionAttributes, props.sessionAttributes, state]);

  function handleChange(event) {
    event.preventDefault();
    setState({ ...state, data: event.target.value });
  }

  function handleClick(e) {
    e.preventDefault();

    setState((prevState) => ({
      ...prevState,
      visible: state.visible == "open" ? "closed" : "open",
    }));

    if (props.debugMode === true) {
      console.log("state");
    }
  }

  // sends text to the lex runtime
  function handleTextSubmit(e) {
    e.preventDefault();
    let inputText = state.data.trim();
    if (inputText !== "") showRequest(inputText);
  }

  //populates the screen with user inputted message and also calling sendToLex function
  function showRequest(inputText) {
    //Add input text into messages in state
    setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, { from: "user", msg: inputText }],
      data: "",
    }));
    sendToLex(inputText);
  }

  function showResponse(lexResponse) {
    setState((prevState) => ({
      ...prevState,
      messages: [
        ...prevState.messages,
        { from: "bot", msg: lexResponse.message },
      ],
    }));
  }

  function showError(lexError) {
    setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, { from: "error", msg: lexError }],
    }));
  }

  // Responsible for sending mesage to Lex
  function sendToLex(message) {
    let params = {
      botAlias: props.alias,
      botName: props.botName,
      inputText: message,
      userId: lexUserId,
      sessionAttributes: state.sessionAttributes,
    };

    if (props.debugMode == true) {
      console.log(`Lex Params: ${JSON.stringify(params)}`)
    }

    lexRunTime.postText(params, function (err, data) {
      if (err) {
        if (props.debugMode === true) {
          console.log(
            "this is your ERROR from within the lexruntime",
            err,
            err.stack
          );
        }
        showError(`Error: ${err.message} (see console for detail)`);
      } else if (data) {
        if (props.debugMode === true) {
          console.log("data from lexrun", data);
        }
        // save session attributes returned from lex
        setState((prevState) => ({
          ...prevState,
          sessionAttributes: data.sessionAttributes,
        }));
        showResponse(data);
      }

      // FIXME: Add this functionality back
      // inputFieldText.value = "";
      // inputFieldText.locked = false;
    });
    return false;
  }

  const inputStyle = {
    padding: "4px",
    fontSize: 24,
    width: "388px",
    height: "40px",
    borderRadius: "1px",
    border: "10px",
  };

  const defaultHeaderRectStyle = {
    backgroundColor: "#000000",
    width: "408px",
    minHeight: "40px",
    textAlign: "center",
    paddingTop: 12,
    paddingBottom: 12,
    display: "flex",
    alignItems: "center",
    color: "#FFFFFF",
    fontSize: "24px",
    justifyContent: "space-between",
  };

  const headerReactStyle = merge(defaultHeaderRectStyle, props.headerStyle);

  const chatcontainerStyle = {
    backgroundColor: "#FFFFFF",
    width: 408,
  };

  const chatFormStyle = {
    margin: "1px",
    padding: "2px",
  };

  return (
    <div id="chatwrapper">
      <div id="chat-header-rect" style={headerReactStyle} onClick={handleClick}>
        <span
          style={{
            fontSize: headerReactStyle.fontSize,
            color: headerReactStyle.color,
          }}
        >
          {props.headerText}
        </span>
        {state.visible === "open" ? (
          <span className="chevron top"></span>
        ) : (
          <span className="chevron bottom"></span>
        )}
      </div>
      <div
        id="chatcontainer"
        className={state.visible}
        style={chatcontainerStyle}
      >
        <ChatListItem
          message={state.messages}
          greeting={props.greeting}
          style={props}
        />

        <form id="chatform" style={chatFormStyle} onSubmit={handleTextSubmit}>
          <input
            type="text"
            id="inputField"
            size="40"
            value={state.data || ""}
            placeholder={props.placeholder}
            onChange={handleChange}
            style={inputStyle}
            autoFocus={true}
          />
        </form>
      </div>
    </div>
  );
}

LexChat.propTypes = {
  alias: PropTypes.string,
  botName: PropTypes.string,
  IdentityPoolId: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  height: PropTypes.number,
  headerText: PropTypes.string,
  headerColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string,
  headerFontSize: PropTypes.number,
  sessionAttributes: PropTypes.object,
  debugMode: PropTypes.bool,
  region: PropTypes.string,
  greeting: PropTypes.string,
  headerStyle: PropTypes.object,
};

LexChat.defaultProps = {
  alias: "$LATEST",
  headerStyle: {},
  greeting: "",
  sessionAttributes: {},
  debugMode: false,
  region: "us-east-1",
};

export default LexChat;
