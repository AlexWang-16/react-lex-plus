import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import "aws-sdk";
import "./styles/chatbot.css";

class LexChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: "",
      lexUserId: "chatbot-demo" + Date.now(),
      sessionAttributes: {},
      visible: "closed",
    };
    this.conversationDivRef = React.createRef();
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    document.getElementById("inputField").focus();

    const greetingNode = document.createElement("P");
    greetingNode.className = "lexResponse";
    greetingNode.appendChild(document.createTextNode(this.props.greeting));
    greetingNode.appendChild(document.createElement("br"));

    if (this.props.greeting) {
      this.conversationDivRef.current.appendChild(greetingNode);
    }

    AWS.config.region = this.props.region || "us-east-1";
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.props.IdentityPoolId,
    });
    var lexruntime = new AWS.LexRuntime();
    this.lexruntime = lexruntime;
  }

  handleClick() {
    this.setState({
      visible: this.state.visible == "open" ? "closed" : "open",
    });
    console.log(this.state);
  }

  pushChat(event) {
    event.preventDefault();

    var inputFieldText = document.getElementById("inputField");

    if (
      inputFieldText &&
      inputFieldText.value &&
      inputFieldText.value.trim().length > 0
    ) {
      // disable input to show we're sending it
      var inputField = inputFieldText.value.trim();
      inputFieldText.value = "...";
      inputFieldText.locked = true;

      // send it to the Lex runtime
      var params = {
        botAlias: "$LATEST",
        botName: this.props.botName,
        inputText: inputField,
        userId: this.state.lexUserId,
        sessionAttributes: this.state.sessionAttributes,
      };
      this.showRequest(inputField);
      var a = function (err, data) {
        if (err) {
          console.log(err, err.stack);
          this.showError(
            "Error:  " + err.message + " (see console for details)"
          );
        }
        if (data) {
          // capture the sessionAttributes for the next cycle
          this.setState({ sessionAttributes: data.sessionAttributes });
          //sessionAttributes = data.sessionAttributes;
          // show response and/or error/dialog status
          this.showResponse(data);
        }
        // re-enable input
        inputFieldText.value = "";
        inputFieldText.locked = false;
      };

      this.lexruntime.postText(params, a.bind(this));
    }
    // we always cancel form submission
    return false;
  }

  showRequest(daText) {
    var conversationDiv = document.getElementById("conversation");
    var requestPara = document.createElement("P");
    requestPara.className = "userRequest";
    requestPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(requestPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showError(daText) {
    var conversationDiv = document.getElementById("conversation");
    var errorPara = document.createElement("P");
    errorPara.className = "lexError";
    errorPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(errorPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showResponse(lexResponse) {
    var conversationDiv = document.getElementById("conversation");
    var responsePara = document.createElement("P");
    responsePara.className = "lexResponse";
    if (lexResponse.message) {
      responsePara.appendChild(document.createTextNode(lexResponse.message));
      responsePara.appendChild(document.createElement("br"));
    }
    if (lexResponse.dialogState === "ReadyForFulfillment") {
      responsePara.appendChild(
        document.createTextNode("Ready for fulfillment")
      );
      // TODO:  show slot values
    } else {
      responsePara.appendChild(document.createTextNode(""));
    }
    conversationDiv.appendChild(responsePara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({ data: event.target.value });
  }

  render() {
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
      height: this.props.height,
      border: "px solid #ccc",
      backgroundColor: this.props.backgroundColor,
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

    const headerReactStyle = _.merge(
      defaultHeaderRectStyle,
      this.props.headerStyle
    );

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
          onClick={this.handleClick}
        >
          <span />
          <span
            style={{
              fontSize: headerReactStyle.fontSize,
              color: headerReactStyle.color,
            }}
          >
            {this.props.headerText}
          </span>

          {this.state.visible === "open" ? (
            <span className="chevron top"></span>
          ) : (
            <span className="chevron bottom"></span>
          )}
        </div>
        <div
          id="chatcontainer"
          className={this.state.visible}
          style={chatcontainerStyle}
        >
          <div
            id="conversation"
            ref={this.conversationDivRef}
            style={conversationStyle}
          />
          <form
            id="chatform"
            style={chatFormStyle}
            onSubmit={this.pushChat.bind(this)}
          >
            <input
              type="text"
              id="inputField"
              size="40"
              value={this.state.data}
              placeholder={this.props.placeholder}
              onChange={this.handleChange.bind(this)}
              style={inputStyle}
            />
          </form>
        </div>
      </div>
    );
  }
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
};

LexChat.defaultProps = {
  headerStyle: {},
  greeting: "",
};

export default LexChat;
