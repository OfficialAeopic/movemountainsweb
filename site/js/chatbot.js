/* =============================================================
   Aeopic Chatbot Engine v1.1.0
   Universal local knowledge-base chatbot widget.
   NO API calls. All matching is 100% local/client-side.
   Reads window.CHATBOT_KB set by a separate chatbot-kb.js file.

   Changelog:
   v1.1.0 - 2026-04-13 - Security: added sanitizeHtml() allowlist filter.
             All bot responses now pass through an HTML sanitizer that
             strips scripts, event handlers, and disallowed tags.
             Only safe formatting tags (a, b, strong, em, p, ul, li, etc.)
             and safe attributes (href, target, rel, class, id) are allowed.
   v1.0.0 - 2026-04-10 - Initial release.
             Local keyword search engine with stop-word filtering,
             substring scoring, and bonus exact/phrase matching.
             Full CSS injection, typing indicator, quick-reply chips,
             mobile-responsive panel, Aeopic footer branding.
   ============================================================= */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     GUARD: abort silently if KB is missing
  ---------------------------------------------------------- */
  if (typeof window.CHATBOT_KB === "undefined" || !window.CHATBOT_KB) {
    return;
  }

  var KB = window.CHATBOT_KB;

  /* ----------------------------------------------------------
     CONFIG DEFAULTS
  ---------------------------------------------------------- */
  var cfg = KB.config || {};
  var businessName = cfg.businessName || "Our Business";
  var botName      = cfg.botName      || "Assistant";
  var greeting     = cfg.greeting     || "Hi! How can I help you today?";
  var fallback     = cfg.fallbackMessage || "I don't have that info handy. Please <a href='/contact/'>contact us</a> for help.";
  var brandPrimary = cfg.brandPrimary || "#C9A84C";
  var brandDark    = cfg.brandDark    || "#0D1B2A";
  var brandLight   = cfg.brandLight   || "#f0f2f5";

  /* ----------------------------------------------------------
     STOP WORDS
  ---------------------------------------------------------- */
  var STOP_WORDS = {
    "the":1,"a":1,"an":1,"is":1,"are":1,"do":1,"does":1,"did":1,
    "can":1,"will":1,"would":1,"should":1,"could":1,"i":1,"me":1,
    "my":1,"you":1,"your":1,"we":1,"our":1,"they":1,"their":1,
    "it":1,"its":1,"this":1,"that":1,"of":1,"in":1,"on":1,"at":1,
    "to":1,"for":1,"with":1,"and":1,"or":1,"but":1,"not":1,
    "from":1,"by":1,"how":1,"what":1,"when":1,"where":1,"who":1,
    "why":1,"which":1,"have":1,"has":1,"had":1,"be":1,"been":1,
    "was":1,"were":1,"am":1,"about":1,"just":1,"also":1,"very":1,
    "really":1,"so":1,"too":1,"any":1,"some":1,"there":1,"here":1
  };

  /* ----------------------------------------------------------
     SEARCH ENGINE
  ---------------------------------------------------------- */
  function normalize(str) {
    /* lowercase, strip all punctuation except hyphens */
    return str.toLowerCase().replace(/[^a-z0-9\- ]/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokenize(str) {
    var raw = str.split(" ");
    var result = [];
    for (var i = 0; i < raw.length; i++) {
      var t = raw[i];
      if (t.length > 0 && !STOP_WORDS[t]) {
        result.push(t);
      }
    }
    return result;
  }

  function search(userInput) {
    var entries = KB.entries || [];
    if (entries.length === 0) { return null; }

    var normInput = normalize(userInput);
    var tokens    = tokenize(normInput);

    /* Special case: single token exact id match */
    if (tokens.length === 1) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].id === tokens[0]) {
          return entries[j];
        }
      }
    }

    var bestEntry = null;
    var bestScore = 0;

    for (var e = 0; e < entries.length; e++) {
      var entry    = entries[e];
      var patterns = entry.patterns || [];
      var score    = 0;

      /* Token-level matching: +1 per user token that matches
         any pattern. Requires exact match OR both strings length >= 4
         for substring matching, to avoid false positives like "eat" in "weather".
         Multi-word patterns are handled via the separate multi-word bonus below. */
      for (var t = 0; t < tokens.length; t++) {
        for (var p = 0; p < patterns.length; p++) {
          var pat = normalize(patterns[p]);
          var tok = tokens[t];
          var matched = false;
          if (tok === pat) {
            matched = true;
          } else if (tok.length >= 4 && pat.length >= 4 && (pat.indexOf(tok) !== -1 || tok.indexOf(pat) !== -1)) {
            matched = true;
          }
          if (matched) {
            score += 1;
            break;
          }
        }
      }

      /* Bonus: exact full-input match against any pattern (+5) */
      for (var p2 = 0; p2 < patterns.length; p2++) {
        if (normalize(patterns[p2]) === normInput) {
          score += 5;
          break;
        }
      }

      /* Bonus: multi-word pattern appears as substring inside full input (+3) */
      for (var p3 = 0; p3 < patterns.length; p3++) {
        var patNorm = normalize(patterns[p3]);
        if (patNorm.indexOf(" ") !== -1 && normInput.indexOf(patNorm) !== -1) {
          score += 3;
          break;
        }
      }

      /* Normalize by token count */
      var tokenCount    = Math.max(1, tokens.length);
      var normalizedScore = score / tokenCount;

      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestEntry = entry;
      }
    }

    if (bestScore >= 0.5 && bestEntry) {
      return bestEntry;
    }
    return null;
  }

  /* ----------------------------------------------------------
     INITIAL CHIPS: first 4 entries that have chips, else defaults
  ---------------------------------------------------------- */
  function getInitialChips() {
    var entries = KB.entries || [];
    var chips   = [];
    for (var i = 0; i < entries.length && chips.length < 4; i++) {
      if (entries[i].chips && entries[i].chips.length > 0) {
        chips.push(entries[i].chips[0]);
      }
    }
    if (chips.length === 0) {
      chips = ["Services", "Hours", "Location", "Contact"];
    }
    return chips;
  }

  /* ----------------------------------------------------------
     CSS INJECTION
     All color variables use cfg values, injected at runtime.
  ---------------------------------------------------------- */
  function injectCSS() {
    var css = [
      /* Keyframes */
      "@keyframes aeopic-pulse {",
      "  0%   { box-shadow: 0 0 0 0 " + brandPrimary + "66; }",
      "  70%  { box-shadow: 0 0 0 10px " + brandPrimary + "00; }",
      "  100% { box-shadow: 0 0 0 0 " + brandPrimary + "00; }",
      "}",
      "@keyframes aeopic-slide-up {",
      "  from { opacity: 0; transform: translateY(16px); }",
      "  to   { opacity: 1; transform: translateY(0); }",
      "}",
      "@keyframes aeopic-slide-down {",
      "  from { opacity: 1; transform: translateY(0); }",
      "  to   { opacity: 0; transform: translateY(16px); }",
      "}",
      "@keyframes aeopic-msg-bot {",
      "  from { opacity: 0; transform: translateX(-10px); }",
      "  to   { opacity: 1; transform: translateX(0); }",
      "}",
      "@keyframes aeopic-msg-user {",
      "  from { opacity: 0; transform: translateX(10px); }",
      "  to   { opacity: 1; transform: translateX(0); }",
      "}",
      "@keyframes aeopic-bounce {",
      "  0%, 80%, 100% { transform: translateY(0); }",
      "  40%           { transform: translateY(-6px); }",
      "}",

      /* Toggle button */
      "#aeopic-chat-toggle {",
      "  position: fixed;",
      "  bottom: 24px;",
      "  right: 24px;",
      "  width: 56px;",
      "  height: 56px;",
      "  border-radius: 50%;",
      "  background: " + brandDark + ";",
      "  border: 2px solid " + brandPrimary + ";",
      "  cursor: pointer;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  z-index: 9998;",
      "  transition: transform 0.2s ease;",
      "  animation: aeopic-pulse 2.2s infinite;",
      "  box-sizing: border-box;",
      "  padding: 0;",
      "}",
      "#aeopic-chat-toggle:hover {",
      "  transform: scale(1.05);",
      "  animation: none;",
      "}",
      "#aeopic-chat-toggle.is-open {",
      "  animation: none;",
      "}",

      /* Panel */
      "#aeopic-chat-panel {",
      "  position: fixed;",
      "  bottom: 92px;",
      "  right: 24px;",
      "  width: 380px;",
      "  max-width: calc(100vw - 32px);",
      "  height: 520px;",
      "  max-height: calc(100vh - 120px);",
      "  border-radius: 16px;",
      "  background: #ffffff;",
      "  box-shadow: 0 8px 32px rgba(0,0,0,0.18);",
      "  z-index: 9999;",
      "  display: none;",
      "  flex-direction: column;",
      "  overflow: hidden;",
      "  box-sizing: border-box;",
      "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
      "}",
      "#aeopic-chat-panel.is-visible {",
      "  display: flex;",
      "  animation: aeopic-slide-up 0.25s ease forwards;",
      "}",
      "#aeopic-chat-panel.is-closing {",
      "  animation: aeopic-slide-down 0.2s ease forwards;",
      "}",

      /* Header */
      "#aeopic-chat-header {",
      "  background: " + brandDark + ";",
      "  padding: 14px 16px;",
      "  border-radius: 16px 16px 0 0;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  flex-shrink: 0;",
      "}",
      ".aeopic-header-left {",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 10px;",
      "}",
      ".aeopic-bot-icon {",
      "  width: 36px;",
      "  height: 36px;",
      "  border-radius: 50%;",
      "  background: " + brandPrimary + ";",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  flex-shrink: 0;",
      "}",
      ".aeopic-header-text .aeopic-bot-name {",
      "  font-weight: 700;",
      "  font-size: 14px;",
      "  color: #ffffff;",
      "  display: block;",
      "  line-height: 1.3;",
      "}",
      ".aeopic-header-text .aeopic-bot-sub {",
      "  font-size: 11px;",
      "  color: rgba(255,255,255,0.7);",
      "  display: block;",
      "  line-height: 1.3;",
      "}",
      "#aeopic-chat-close {",
      "  width: 32px;",
      "  height: 32px;",
      "  background: transparent;",
      "  border: none;",
      "  cursor: pointer;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  border-radius: 6px;",
      "  padding: 0;",
      "  transition: opacity 0.15s;",
      "}",
      "#aeopic-chat-close:hover { opacity: 0.7; }",

      /* Messages area */
      "#aeopic-chat-messages {",
      "  flex: 1;",
      "  overflow-y: auto;",
      "  padding: 16px;",
      "  display: flex;",
      "  flex-direction: column;",
      "  gap: 12px;",
      "  scroll-behavior: smooth;",
      "}",
      "#aeopic-chat-messages::-webkit-scrollbar { width: 4px; }",
      "#aeopic-chat-messages::-webkit-scrollbar-track { background: transparent; }",
      "#aeopic-chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }",

      /* Message bubbles */
      ".aeopic-msg-wrap {",
      "  display: flex;",
      "  flex-direction: column;",
      "  max-width: 85%;",
      "}",
      ".aeopic-msg-wrap.bot  { align-self: flex-start; animation: aeopic-msg-bot 0.25s ease forwards; }",
      ".aeopic-msg-wrap.user { align-self: flex-end;   animation: aeopic-msg-user 0.25s ease forwards; }",
      ".aeopic-bubble {",
      "  padding: 10px 14px;",
      "  font-size: 14px;",
      "  line-height: 1.5;",
      "  word-break: break-word;",
      "}",
      ".aeopic-msg-wrap.bot  .aeopic-bubble {",
      "  background: " + brandLight + ";",
      "  color: #1a1a1a;",
      "  border-radius: 4px 16px 16px 16px;",
      "}",
      ".aeopic-msg-wrap.user .aeopic-bubble {",
      "  background: " + brandPrimary + ";",
      "  color: #ffffff;",
      "  border-radius: 16px 4px 16px 16px;",
      "}",
      ".aeopic-msg-wrap.bot .aeopic-bubble a {",
      "  color: " + brandPrimary + ";",
      "  text-decoration: none;",
      "  border-bottom: 1px solid " + brandPrimary + "66;",
      "}",
      ".aeopic-msg-wrap.bot .aeopic-bubble a:hover {",
      "  border-bottom-color: " + brandPrimary + ";",
      "}",

      /* Quick-reply chips */
      ".aeopic-chips {",
      "  display: flex;",
      "  flex-wrap: wrap;",
      "  gap: 6px;",
      "  margin-top: 8px;",
      "}",
      ".aeopic-chip {",
      "  display: inline-block;",
      "  padding: 6px 14px;",
      "  border-radius: 20px;",
      "  border: 1px solid " + brandPrimary + ";",
      "  color: " + brandPrimary + ";",
      "  background: transparent;",
      "  font-size: 13px;",
      "  cursor: pointer;",
      "  transition: background 0.15s;",
      "  font-family: inherit;",
      "  line-height: 1.4;",
      "}",
      ".aeopic-chip:hover { background: " + brandPrimary + "1a; }",

      /* Typing indicator */
      ".aeopic-typing {",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 5px;",
      "  padding: 12px 14px;",
      "  background: " + brandLight + ";",
      "  border-radius: 4px 16px 16px 16px;",
      "  align-self: flex-start;",
      "  animation: aeopic-msg-bot 0.25s ease forwards;",
      "}",
      ".aeopic-dot {",
      "  width: 6px;",
      "  height: 6px;",
      "  border-radius: 50%;",
      "  background: " + brandPrimary + ";",
      "  animation: aeopic-bounce 1.2s infinite;",
      "}",
      ".aeopic-dot:nth-child(2) { animation-delay: 0.2s; }",
      ".aeopic-dot:nth-child(3) { animation-delay: 0.4s; }",

      /* Input area */
      "#aeopic-chat-inputbar {",
      "  border-top: 1px solid #e8e8e8;",
      "  display: flex;",
      "  align-items: center;",
      "  flex-shrink: 0;",
      "}",
      "#aeopic-chat-input {",
      "  flex: 1;",
      "  border: none;",
      "  padding: 12px 16px;",
      "  font-size: 14px;",
      "  font-family: inherit;",
      "  outline: none;",
      "  background: transparent;",
      "  color: #1a1a1a;",
      "}",
      "#aeopic-chat-input::placeholder { color: #aaa; }",
      "#aeopic-chat-send {",
      "  width: 40px;",
      "  height: 40px;",
      "  border: none;",
      "  background: transparent;",
      "  cursor: pointer;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  padding: 0;",
      "  margin-right: 4px;",
      "  transition: opacity 0.15s;",
      "  flex-shrink: 0;",
      "}",
      "#aeopic-chat-send:disabled { opacity: 0.3; cursor: default; }",
      "#aeopic-chat-send:not(:disabled):hover { opacity: 0.75; }",

      /* Footer */
      "#aeopic-chat-footer {",
      "  padding: 6px;",
      "  text-align: center;",
      "  font-size: 10px;",
      "  color: #999;",
      "  flex-shrink: 0;",
      "  border-top: 1px solid #f0f0f0;",
      "}",
      "#aeopic-chat-footer a {",
      "  color: #999;",
      "  text-decoration: none;",
      "  transition: color 0.15s;",
      "}",
      "#aeopic-chat-footer a:hover { color: " + brandPrimary + "; }",

      /* Mobile breakpoint */
      "@media (max-width: 480px) {",
      "  #aeopic-chat-panel {",
      "    width: 100%;",
      "    max-width: 100%;",
      "    left: 0;",
      "    right: 0;",
      "    bottom: 0;",
      "    height: calc(100vh - 70px);",
      "    max-height: calc(100vh - 70px);",
      "    border-radius: 16px 16px 0 0;",
      "  }",
      "  #aeopic-chat-toggle {",
      "    bottom: 16px;",
      "    right: 16px;",
      "  }",
      "}"
    ].join("\n");

    var style = document.createElement("style");
    style.id  = "aeopic-chatbot-styles";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     SVG ICONS (inline, no external requests)
  ---------------------------------------------------------- */
  var SVG_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#ffffff"/></svg>';

  var SVG_X_TOGGLE = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5L15 15" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';

  var SVG_X_HEADER = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4L12 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';

  var SVG_BOT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#ffffff"/></svg>';

  var SVG_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="' + brandPrimary + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ----------------------------------------------------------
     DOM BUILDING
  ---------------------------------------------------------- */
  var panelEl    = null;
  var toggleEl   = null;
  var messagesEl = null;
  var inputEl    = null;
  var sendEl     = null;
  var isPanelOpen    = false;
  var greetingShown  = false;
  var isWaiting      = false;   /* true while typing indicator visible */

  function buildWidget() {
    /* Toggle button */
    toggleEl = document.createElement("button");
    toggleEl.id          = "aeopic-chat-toggle";
    toggleEl.innerHTML   = SVG_CHAT;
    toggleEl.setAttribute("aria-label", "Open chat");
    toggleEl.setAttribute("aria-expanded", "false");
    document.body.appendChild(toggleEl);

    /* Chat panel */
    panelEl = document.createElement("div");
    panelEl.id = "aeopic-chat-panel";
    panelEl.setAttribute("role", "dialog");
    panelEl.setAttribute("aria-label", botName + " chat");

    /* Header */
    var header = document.createElement("div");
    header.id  = "aeopic-chat-header";
    header.innerHTML = (
      '<div class="aeopic-header-left">' +
        '<div class="aeopic-bot-icon">' + SVG_BOT + '</div>' +
        '<div class="aeopic-header-text">' +
          '<span class="aeopic-bot-name">' + escHtml(botName) + '</span>' +
          '<span class="aeopic-bot-sub">Instant answers</span>' +
        '</div>' +
      '</div>' +
      '<button id="aeopic-chat-close" aria-label="Close chat">' + SVG_X_HEADER + '</button>'
    );
    panelEl.appendChild(header);

    /* Messages area */
    messagesEl = document.createElement("div");
    messagesEl.id = "aeopic-chat-messages";
    panelEl.appendChild(messagesEl);

    /* Input bar */
    var inputBar = document.createElement("div");
    inputBar.id  = "aeopic-chat-inputbar";

    inputEl = document.createElement("input");
    inputEl.id          = "aeopic-chat-input";
    inputEl.type        = "text";
    inputEl.placeholder = "Ask a question...";
    inputEl.setAttribute("autocomplete", "off");
    inputEl.setAttribute("aria-label", "Type your message");

    sendEl = document.createElement("button");
    sendEl.id        = "aeopic-chat-send";
    sendEl.innerHTML = SVG_SEND;
    sendEl.setAttribute("aria-label", "Send message");
    sendEl.disabled  = true;

    inputBar.appendChild(inputEl);
    inputBar.appendChild(sendEl);
    panelEl.appendChild(inputBar);

    /* Footer */
    var footer = document.createElement("div");
    footer.id        = "aeopic-chat-footer";
    footer.innerHTML = 'Powered by <a href="https://aeopic.com" target="_blank" rel="noopener">Aeopic</a>';
    panelEl.appendChild(footer);

    document.body.appendChild(panelEl);
  }

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Allowlist-based HTML sanitizer. Permits only safe formatting tags
     and anchor links. Strips scripts, event handlers, and unknown tags. */
  function sanitizeHtml(html) {
    var temp = document.createElement("div");
    temp.innerHTML = html;

    var ALLOWED_TAGS = {
      "A":1,"B":1,"STRONG":1,"EM":1,"I":1,"BR":1,"P":1,
      "UL":1,"OL":1,"LI":1,"SPAN":1,"DIV":1,"H1":1,"H2":1,
      "H3":1,"H4":1,"H5":1,"H6":1,"TABLE":1,"TR":1,"TD":1,
      "TH":1,"THEAD":1,"TBODY":1,"SMALL":1,"SUB":1,"SUP":1
    };
    var ALLOWED_ATTRS = {
      "href":1,"target":1,"rel":1,"class":1,"id":1
    };

    function cleanNode(node) {
      var i = node.childNodes.length;
      while (i--) {
        var child = node.childNodes[i];
        if (child.nodeType === 1) { /* Element */
          if (!ALLOWED_TAGS[child.tagName]) {
            /* Replace disallowed tag with its text content */
            var text = document.createTextNode(child.textContent || "");
            node.replaceChild(text, child);
          } else {
            /* Strip disallowed attributes */
            var attrs = [];
            for (var a = 0; a < child.attributes.length; a++) {
              attrs.push(child.attributes[a].name);
            }
            for (var a2 = 0; a2 < attrs.length; a2++) {
              var attrName = attrs[a2].toLowerCase();
              if (!ALLOWED_ATTRS[attrName]) {
                child.removeAttribute(attrs[a2]);
              }
              /* Block javascript: and data: URLs in href */
              if (attrName === "href") {
                var hrefVal = (child.getAttribute("href") || "").trim().toLowerCase();
                if (hrefVal.indexOf("javascript:") === 0 || hrefVal.indexOf("data:") === 0) {
                  child.setAttribute("href", "#");
                }
              }
            }
            /* Force rel="noopener" on external links */
            if (child.tagName === "A" && child.getAttribute("target") === "_blank") {
              child.setAttribute("rel", "noopener");
            }
            cleanNode(child);
          }
        }
      }
    }

    cleanNode(temp);
    return temp.innerHTML;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ----------------------------------------------------------
     MESSAGE RENDERING
  ---------------------------------------------------------- */
  function addBotMessage(html, chips) {
    var wrap = document.createElement("div");
    wrap.className = "aeopic-msg-wrap bot";

    var bubble = document.createElement("div");
    bubble.className = "aeopic-bubble";
    bubble.innerHTML = sanitizeHtml(html);
    wrap.appendChild(bubble);

    /* Chips below the bubble, inside the same wrap */
    if (chips && chips.length > 0) {
      var chipsRow = document.createElement("div");
      chipsRow.className = "aeopic-chips";
      for (var i = 0; i < chips.length; i++) {
        (function (chipText) {
          var chip = document.createElement("button");
          chip.className   = "aeopic-chip";
          chip.textContent = chipText;
          chip.addEventListener("click", function () {
            handleUserInput(chipText);
          });
          chipsRow.appendChild(chip);
        })(chips[i]);
      }
      wrap.appendChild(chipsRow);
    }

    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function addUserMessage(text) {
    var wrap = document.createElement("div");
    wrap.className = "aeopic-msg-wrap user";

    var bubble = document.createElement("div");
    bubble.className = "aeopic-bubble";
    bubble.textContent = text;
    wrap.appendChild(bubble);

    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function showTypingIndicator() {
    var typing = document.createElement("div");
    typing.id        = "aeopic-typing";
    typing.className = "aeopic-typing";
    typing.innerHTML = '<div class="aeopic-dot"></div><div class="aeopic-dot"></div><div class="aeopic-dot"></div>';
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    var el = document.getElementById("aeopic-typing");
    if (el) { el.parentNode.removeChild(el); }
  }

  /* ----------------------------------------------------------
     INTERACTION HANDLER
  ---------------------------------------------------------- */
  function handleUserInput(text) {
    text = text.trim();
    if (!text || isWaiting) { return; }

    addUserMessage(text);

    /* Clear input if it came from the text field */
    if (inputEl.value === text) {
      inputEl.value = "";
      sendEl.disabled = true;
    }

    isWaiting = true;
    showTypingIndicator();

    /* 400ms typing delay */
    setTimeout(function () {
      removeTypingIndicator();
      isWaiting = false;

      var entry = search(text);
      if (entry) {
        addBotMessage(entry.response, entry.chips || []);
      } else {
        addBotMessage(fallback, []);
      }
    }, 400);
  }

  /* ----------------------------------------------------------
     PANEL OPEN / CLOSE
  ---------------------------------------------------------- */
  function openPanel() {
    if (isPanelOpen) { return; }
    isPanelOpen = true;

    panelEl.classList.remove("is-closing");
    panelEl.classList.add("is-visible");
    toggleEl.classList.add("is-open");
    toggleEl.innerHTML = SVG_X_TOGGLE;
    toggleEl.setAttribute("aria-expanded", "true");
    toggleEl.setAttribute("aria-label", "Close chat");

    if (!greetingShown) {
      greetingShown = true;
      addBotMessage(greeting, getInitialChips());
    }

    /* Focus input after animation */
    setTimeout(function () {
      inputEl.focus();
    }, 260);
  }

  function closePanel() {
    if (!isPanelOpen) { return; }
    isPanelOpen = false;

    panelEl.classList.add("is-closing");
    toggleEl.classList.remove("is-open");
    toggleEl.innerHTML = SVG_CHAT;
    toggleEl.setAttribute("aria-expanded", "false");
    toggleEl.setAttribute("aria-label", "Open chat");

    /* Remove panel from flex flow after animation completes */
    setTimeout(function () {
      if (!isPanelOpen) {
        panelEl.classList.remove("is-visible");
        panelEl.classList.remove("is-closing");
      }
    }, 210);
  }

  /* ----------------------------------------------------------
     EVENT BINDING
  ---------------------------------------------------------- */
  function bindEvents() {
    /* Toggle button */
    toggleEl.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isPanelOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    /* Header close button */
    document.getElementById("aeopic-chat-close").addEventListener("click", function () {
      closePanel();
    });

    /* Input: enable/disable send button */
    inputEl.addEventListener("input", function () {
      sendEl.disabled = inputEl.value.trim().length === 0;
    });

    /* Enter key to send */
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        if (inputEl.value.trim().length > 0 && !isWaiting) {
          handleUserInput(inputEl.value);
        }
      }
    });

    /* Send button */
    sendEl.addEventListener("click", function () {
      if (inputEl.value.trim().length > 0 && !isWaiting) {
        handleUserInput(inputEl.value);
      }
    });

    /* Escape key closes panel */
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.keyCode === 27) && isPanelOpen) {
        closePanel();
      }
    });

    /* Click outside closes panel (but NOT clicking the toggle) */
    document.addEventListener("click", function (e) {
      if (!isPanelOpen) { return; }
      var clickedToggle = toggleEl.contains(e.target);
      var clickedPanel  = panelEl.contains(e.target);
      if (!clickedToggle && !clickedPanel) {
        closePanel();
      }
    });
  }

  /* ----------------------------------------------------------
     INIT: wait for DOM ready
  ---------------------------------------------------------- */
  function init() {
    injectCSS();
    buildWidget();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

}());
