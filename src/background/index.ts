import { ExtensionMessage, PopupState } from "../shared/types";

let currentState: PopupState = { status: "idle" };

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "GET_CURRENT_STATE") {
      sendResponse({ type: "CURRENT_STATE", state: currentState });
    }
    return true;
  },
);
