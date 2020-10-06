import React, { useEffect, useState, useRef } from "react";
import { isEqual } from "lodash";
import PropTypes from "prop-types";
import merge from "lodash/merge";
import AWS from "aws-sdk";
import "./styles/chatbot.css";

//stateful component
function LexChat(props) {
  AWS.config.region = props.region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: props.IdentityPoolId,
  });
  let lexruntime = new AWS.LexRuntime();
  let conversationDivRef = useRef(null);
  // let greetingMsgRef = useRef(null);

  //default states being set
  const [state, setState] = useState({
    data: "",
    lexUserId: "chatbot" + Date.now(),
    sessionAttributes: props.sessionAttributes,
    visible: "closed",
  });

  //Sets configurations from AWS and sets identity poolId

  //useEffect runs when the dom renders this component
  useEffect(() => {
    if (!isEqual(props.sessionAttributes, state.sessionAttributes)) {
      setState({
        ...state,
        sessionAttributes: {
          ...state.sessionAttributes,
          ...props.sessionAttributes,
        },
      });
    }
  }, [props.sessionAttributes, state]);

  // handling the changed value in input
  function handleChange(event) {
    event.preventDefault();
    setState({ ...state, data: event.target.value });
  }

  //handling the slide open or close of the chat
  function handleClick(e) {
    e.preventDefault();
    setState((prevState) => ({
      ...prevState,
      visible: state.visible == "open" ? "closed" : "open",
    }));
    if (props.debugMode === true) {
      console.log(state);
    }
  }

  // runs when input is true and its submitted
  function pushChat(e) {
    e.preventDefault();

    //We can feed in state.data instead of inputField and manually grabbing from DOM
    function showRequest(text) {
      let conversationDiv = document.getElementById("conversation");
      let requestParagraph = document.createElement("P");
      requestParagraph.className = "userRequest";
      requestParagraph.appendChild(document.createTextNode(text));
      let spacer = document.createElement("div");
      spacer.className = "conversationSpacer";
      spacer.appendChild(requestParagraph);
      conversationDiv.appendChild(spacer);
      conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }

    function showResponse(lexResponse) {
      let conversationDiv = document.getElementById("conversation");
      let responseParagraph = document.createElement("P");
      responseParagraph.className = "lexResponse";
      if (lexResponse.message) {
        responseParagraph.appendChild(
          document.createTextNode(lexResponse.message)
        );
      }
      if (lexResponse.dialogState === "ReadyForFulfillment") {
        responseParagraph.appendChild(
          document.createTextNode("Ready for fulfillment")
        );
      }
      let spacer = document.createElement("div");
      spacer.className = "conversationSpacer";
      spacer.appendChild(responseParagraph);
      conversationDiv.appendChild(spacer);
      conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }

    function showError(text) {
      let conversationDiv = document.getElementById("conversation");
      let errorParagraph = document.createElement("P");
      errorParagraph.className = "lexError";
      errorParagraph.appendChild(document.createTextNode(text));
      let spacer = document.createElement("div");
      spacer.className = "conversationSpacer";
      spacer.appendChild(errorParagraph);
      conversationDiv.appendChild(spacer);
      conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }

    //params needed for lex runtime to send to backend.
    let params = {
      botAlias: "$LATEST",
      botName: props.botName,
      inputText: state.data,
      userId: state.lexUserId,
      sessionAttributes: state.sessionAttributes,
    };

    /***** Can we use state.data to check value changes to signal the ... sending message ***/
    let inputFieldText = document.getElementById("inputField");

    if (
      inputFieldText &&
      inputFieldText.value &&
      inputFieldText.value.trim().length > 0
    ) {
      //disable input to show we're sending it
      var inputField = inputFieldText.value.trim();
      inputFieldText.value = "...";
      inputFieldText.locked = true;
    }

    /***** Can we use state.data to check value changes to signal the ... sending message ***/

    //We can feed in state.data instead of inputField and manually grabbing from DOM
    showRequest(inputField);

    lexruntime.postText(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
        showError("Error:" + err.message + "(see console for detail)");
      } else if (data) {
        // capture the sessionAttributes for the next cycle

        setState({ sessionAttributes: data.sessionAttributes });
        // show response and/or error/dialog status
        showResponse(data);
      }
      // re-enable input

      inputFieldText.value = "";
      inputFieldText.locked = false;
    });

    // we always cancel form submission
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

  const conversationStyle = {
    width: "400px",
    height: props.height,
    border: "px solid #ccc",
    backgroundColor: props.backgroundColor,
    padding: "4px",
    overflow: "scroll",
    borderBottom: "thin ridge #bfbfbf",
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
      <div
        id="chat-header-rect"
        style={headerReactStyle}
        onClick={handleClick} // change handleClick to handleClick()
      >
        <span />
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
        <div
          id="conversation"
          ref={conversationDivRef}
          style={conversationStyle}
        >
          <p className="lexResponse">{props.greeting}</p>
        </div>
        <form id="chatform" style={chatFormStyle} onSubmit={pushChat}>
          <input
            type="text"
            id="inputField"
            size="40"
            value={state.data}
            placeholder={props.placeholder}
            onChange={handleChange} // changed the handleChange to handleChange()
            style={inputStyle}
            autoFocus={true} //added this autofocus equals true to remove focus
          />
        </form>
      </div>
    </div>
  );
}

LexChat.propTypes = {
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
  headerStyle: {},
  greeting: "",
  sessionAttributes: {},
  debugMode: false,
  region: "us-east-1",
};

export default LexChat;
