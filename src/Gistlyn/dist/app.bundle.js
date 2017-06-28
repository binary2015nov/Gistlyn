webpackJsonp([0],{

/***/ 134:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(346);
__webpack_require__(347);
__webpack_require__(348);
__webpack_require__(341);
__webpack_require__(343);
__webpack_require__(344);
__webpack_require__(345);
__webpack_require__(342);
__webpack_require__(71);
var React = __webpack_require__(3);
var ReactDOM = __webpack_require__(74);
var ReactGA = __webpack_require__(29);
var react_redux_1 = __webpack_require__(45);
var servicestack_client_1 = __webpack_require__(14);
var app_1 = __webpack_require__(147);
var state_1 = __webpack_require__(36);
var utils_1 = __webpack_require__(21);
var Gistlyn_dtos_1 = __webpack_require__(30);
var InadequateBrowserDialog_1 = __webpack_require__(142);
ReactGA.initialize("UA-80898009-1");
if (utils_1.UA.nosse) {
    ReactGA.event({ category: 'error', action: 'load', label: "nosse" });
    ReactDOM.render(React.createElement(InadequateBrowserDialog_1.default, null), document.getElementById("app"));
    throw "This browser does not support Server Sent Events";
}
var ScriptStatusError = ["Cancelled", "CompiledWithErrors", "ThrowedException"];
var batchLogs = new utils_1.BatchItems(30, function (logs) { return state_1.store.dispatch({ type: 'CONSOLE_LOG', logs: logs }); });
var channels = ["gist"];
var sse = new servicestack_client_1.ServerEventsClient("/", channels, {
    handlers: {
        onConnect: function (activeSub) {
            state_1.store.dispatch({ type: 'SSE_CONNECT', activeSub: activeSub });
            ReactGA.set({ userId: activeSub.userId });
            fetch("/session-to-token", { method: "POST", credentials: "include" });
        },
        ConsoleMessage: function (m, e) {
            batchLogs.queue({ msg: m.message });
        },
        ScriptExecutionResult: function (m, e) {
            if (m.status === state_1.store.getState().scriptStatus)
                return;
            if (ScriptStatusError.indexOf(m.status) >= 0 && m.errorResponseStatus) {
                batchLogs.queue(utils_1.statusToError(m.errorResponseStatus));
            }
            else {
                batchLogs.queue({ msg: servicestack_client_1.humanize(m.status) });
            }
            state_1.store.dispatch({ type: 'SCRIPT_STATUS', scriptStatus: m.status });
            if (m.status === "CompiledWithErrors" && m.errors) {
                var errorMsgs = m.errors.map(function (e) { return ({ msg: e.info, cls: "error" }); });
                errorMsgs.forEach(function (m) { return batchLogs.queue(m); });
            }
            else if (m.status === "Completed") {
                var request = new Gistlyn_dtos_1.GetScriptVariables();
                var state = state_1.store.getState();
                request.scriptId = state.activeSub.id;
                utils_1.client.get(request)
                    .then(function (r) {
                    state_1.store.dispatch({ type: "VARS_LOAD", variables: r.variables });
                });
                if (state.expression) {
                    utils_1.evalExpression(state.gist, state.activeSub.id, state.expression);
                }
            }
        }
    }
}).start();
ReactDOM.render(React.createElement(react_redux_1.Provider, { store: state_1.store },
    React.createElement(app_1.App, null)), document.getElementById("app"));


/***/ }),

/***/ 135:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var servicestack_client_1 = __webpack_require__(14);
var utils_1 = __webpack_require__(21);
var AddServiceStackReferenceDialog = (function (_super) {
    __extends(AddServiceStackReferenceDialog, _super);
    function AddServiceStackReferenceDialog(props) {
        var _this = _super.call(this, props) || this;
        var qs = servicestack_client_1.queryString(location.href);
        var value = qs["AddServiceStackReference"] || "";
        var requestDto = qs["Request"];
        var autorun = !!qs["autorun"];
        _this.state = { value: value, valid: false, baseUrl: null, fileName: null, content: null, loading: false, requestDto: requestDto, autorun: autorun };
        if (value) {
            delete qs["AddServiceStackReference"];
            delete qs["Request"];
            delete qs["autorun"];
            var description = value + " API";
            history.replaceState({ id: utils_1.GistTemplates.AddServiceStackReferenceGist, description: description }, description, servicestack_client_1.appendQueryString(servicestack_client_1.splitOnFirst(location.href, '?')[0], qs));
            _this.setValue(value);
        }
        return _this;
    }
    AddServiceStackReferenceDialog.prototype.getFirstRequestDto = function (dtos) {
        var lines = dtos.split(/\r?\n/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var line = lines[i];
            var isGetOnlyRoute = line.indexOf("[Route(") >= 0 && line.indexOf('"GET"') >= 0;
            if (isGetOnlyRoute)
                return servicestack_client_1.splitOnLast(lines[i + 1], " ")[1];
            if (lines[i].indexOf(": IReturn<") >= 0) {
                var requestDto = servicestack_client_1.splitOnLast(lines[i - 1], " ")[1];
                var name = requestDto.toLowerCase();
                if (name.startsWith("get") || name.startsWith("find") || name.startsWith("search"))
                    return requestDto;
            }
        }
        //Fallback to Route DTO with no Verb limiters
        for (var i = 0, len = lines.length; i < len; i++) {
            if (lines[i].indexOf("[Route(") >= 0 && lines[i].split('"').length === 3)
                return servicestack_client_1.splitOnLast(lines[i + 1], " ")[1];
        }
        return null;
    };
    AddServiceStackReferenceDialog.prototype.setValue = function (value) {
        var _this = this;
        this.setState({ value: value });
        var validUrl = (servicestack_client_1.splitOnFirst(value, ".")[1] || "").length >= 2;
        if (validUrl) {
            //Enable CORS
            value = value.trim();
            var url = value.indexOf("://") >= 0 ? value : "http://" + value;
            url = url.indexOf("/types/csharp") >= 0 ? url : servicestack_client_1.combinePaths(url, "types/csharp");
            var baseUrl = url.replace("/types/csharp", "");
            url = servicestack_client_1.appendQueryString(url, { ExcludeNamespace: true });
            var proxyUrl = servicestack_client_1.appendQueryString("/proxy", { url: url });
            this.setState({ loading: true });
            fetch(proxyUrl)
                .then(function (r) {
                if (!r.ok)
                    throw r;
                r.text().then(function (content) {
                    var valid = content.trim().startsWith("/* Options:");
                    var requestDto = _this.state.requestDto || _this.getFirstRequestDto(content);
                    _this.setState({ valid: valid, baseUrl: baseUrl, content: content, loading: false, requestDto: requestDto });
                    setTimeout(function () { return _this.txtFileName.select(); }, 0);
                });
            })
                .catch(function (e) {
                _this.setState({ valid: false, loading: false });
            });
        }
        else {
            this.setState({ valid: false });
        }
    };
    AddServiceStackReferenceDialog.prototype.done = function () {
        this.props.onAddReference(this.state.baseUrl, this.txtFileName.value || "dtos.cs", this.state.content, this.state.requestDto || "RequestDto", this.state.autorun);
    };
    AddServiceStackReferenceDialog.prototype.render = function () {
        var _this = this;
        var value = this.state.value;
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Add ServiceStack Reference"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "row", style: { float: "right" } },
                        React.createElement("i", { className: "material-icons info-help", onClick: function (e) { return _this.props.urlChanged(utils_1.GistTemplates.AddServiceStackReferenceCollection); }, title: "What is this?" }, "help_outline")),
                    React.createElement("p", { style: { margin: "0 0 20px 0", color: "#666", maxWidth: 500, lineHeight: "22px" } },
                        "Add the Base URL of a remote ServiceStack instance you want to generate the typed C# DTO's for, e.g:",
                        React.createElement("span", { className: "lnk", style: { paddingLeft: 5 }, onClick: function (e) { return _this.setValue("techstacks.io"); } }, "techstacks.io")),
                    React.createElement("div", { className: "row" },
                        React.createElement("label", { htmlFor: "txtBaseUrl" }, "Base Url"),
                        React.createElement("input", { ref: function (e) { return _this.txtBaseUrl = e; }, type: "text", id: "txtBaseUrl", value: this.state.value, onChange: function (e) { return _this.setValue(e.target.value); }, onKeyDown: function (e) { return e.keyCode == 13 ? _this.setValue(e.target.value) : null; }, autoFocus: true, placeholder: "Url of remote ServiceStack Instance" }),
                        React.createElement("i", { className: "material-icons", style: { visibility: value && !this.state.valid && !this.state.loading ? "visible" : "hidden", position: "absolute", color: "#c66", fontSize: 32, verticalAlign: "middle", margin: "0 0 0 5px" }, title: "Not a valid ServiceStack instance" }, "close"),
                        React.createElement("i", { className: "material-icons", style: { visibility: this.state.valid && !this.state.loading ? "visible" : "hidden", color: "#4CAF50", fontSize: 32, verticalAlign: "middle", margin: "0 0 0 5px" }, title: "Valid ServiceStack instance" }, "check"),
                        React.createElement("img", { src: __webpack_require__(15), style: { display: this.state.loading ? "inline-block" : "none", margin: "0 0 0 -20px" } })),
                    React.createElement("div", { className: "row", style: { visibility: this.state.valid ? "visible" : "hidden" } },
                        React.createElement("label", { htmlFor: "txtFileName" }, "Filename"),
                        React.createElement("input", { ref: function (e) { return _this.txtFileName = e; }, type: "text", id: "txtFileName", onKeyDown: function (e) { return e.keyCode == 13 && _this.state.valid ? _this.done() : null; }, defaultValue: "dtos.cs", style: { width: "175px" }, autoFocus: true, placeholder: "dtos.cs" }))),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("img", { className: "loading", src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } }),
                    React.createElement("span", { className: "btn" + (this.state.valid ? "" : " disabled"), onClick: function (e) { return _this.state.valid ? _this.done() : null; } }, "Add Reference")))));
    };
    return AddServiceStackReferenceDialog;
}(React.Component));
exports.default = AddServiceStackReferenceDialog;


/***/ }),

/***/ 136:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var servicestack_client_1 = __webpack_require__(14);
var Collections = (function (_super) {
    __extends(Collections, _super);
    function Collections() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Collections.prototype.render = function () {
        var _this = this;
        var LiveLists = null;
        if (this.props.showLiveLists) {
            var allGists = Object.keys(this.props.gistStats)
                .map(function (k) { return _this.props.gistStats[k]; })
                .filter(function (x) { return _this.props.excludeGists.indexOf(x.id) === -1; });
            var sortByRecent = function (gists) {
                gists.sort(function (a, b) { return b.date - a.date; });
                return gists;
            };
            var removeDupes = function (xs) {
                var dupes = {};
                return xs.filter(function (x) { return dupes[x.description] ? false : !!(dupes[x.description] = x); });
            };
            var recentGists = removeDupes(sortByRecent(allGists.filter(function (x) { return !x.collection; })));
            var recentCollections = removeDupes(sortByRecent(allGists.filter(function (x) { return x.collection; })));
            var myGists = recentGists.filter(function (x) { return x.owner_login === _this.props.authUsername; });
            if (recentGists.length > 0 || recentCollections.length > 0) {
                LiveLists = (React.createElement("div", { style: { float: "right", margin: "4px 4px 0px 0px", padding: "0 0 5px 10px" } },
                    React.createElement("div", { id: "livelist" },
                        recentCollections.length > 0
                            ? (React.createElement("div", null,
                                React.createElement("h3", null, "Recent Collections"),
                                recentCollections.slice(0, 5).map(function (x) { return React.createElement("a", { href: "?collection=" + x.id, title: x.description }, x.description); })))
                            : null,
                        recentGists.length > 0
                            ? (React.createElement("div", null,
                                React.createElement("h3", null, "Recent Gists"),
                                recentGists.slice(0, 5).map(function (x) { return React.createElement("a", { href: "?gist=" + x.id, title: x.description }, x.description); })))
                            : null,
                        myGists.length > 0
                            ? (React.createElement("div", null,
                                React.createElement("h3", null, "My Gists"),
                                myGists.slice(0, 20).map(function (x) { return React.createElement("a", { href: "?gist=" + x.id, title: x.description }, x.description); })))
                            : null)));
            }
        }
        return (React.createElement("div", { id: "collection", className: "section" + (this.props.isOwner ? " owner" : ""), onClick: function (e) {
                var a = e.target;
                if (a && a.href) {
                    var qs = servicestack_client_1.queryString(a.href);
                    if (qs["gist"] || qs["collection"] || qs["snapshot"]) {
                        e.preventDefault();
                        if (qs["gist"])
                            _this.props.changeGist(qs["gist"], { activeFileName: qs["activeFileName"] });
                        if (qs["collection"])
                            _this.props.changeCollection(qs["collection"], true);
                        if (qs["snapshot"])
                            _this.props.viewSnapshot(qs["snapshot"]);
                    }
                }
            } },
            React.createElement("div", { id: "collection-header" },
                React.createElement("i", { id: "btnHome", className: "material-icons", onClick: function (e) { return _this.props.onHome(); }, title: "Home" }, "home"),
                this.props.collection.description || "Collections"),
            React.createElement("div", { id: "collection-body" },
                LiveLists,
                React.createElement("div", { id: "markdown", dangerouslySetInnerHTML: { __html: this.props.collection.html } }))));
    };
    return Collections;
}(React.Component));
exports.default = Collections;


/***/ }),

/***/ 137:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var Console = (function (_super) {
    __extends(Console, _super);
    function Console() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Console.prototype.componentDidUpdate = function () {
        if (!this.consoleScroll)
            return;
        this.consoleScroll.scrollTop = this.consoleScroll.scrollHeight;
    };
    Console.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { id: "console", className: "section", ref: function (el) { return _this.consoleScroll = el; } },
            React.createElement("b", { className: "noselect", style: { background: "#444", color: "#fff", padding: "1px 0px 1px 8px", position: "absolute", right: "3px", margin: "-22px 0" } },
                "console",
                React.createElement("i", { className: "material-icons noselect", style: { fontSize: 16, padding: "0 4px 0 4px", verticalAlign: "sub", cursor: "pointer" }, onClick: function (e) { return _this.props.showDialog("console-viewer"); } }, "open_in_new")),
            React.createElement("i", { className: "material-icons clear-btn", title: "clear console", onClick: function (e) { return _this.props.onClear(); } }, "clear"),
            React.createElement("div", { className: "scroll" },
                React.createElement("table", { style: { width: "100%" }, className: "console" },
                    React.createElement("tbody", { style: { font: "13px/18px monospace", color: "#444" } }, this.props.logs.map(function (log) { return (React.createElement("tr", null,
                        React.createElement("td", { style: { padding: "2px 8px", tabSize: 4 } },
                            React.createElement("pre", { className: log.cls }, log.msg)))); }))))));
    };
    return Console;
}(React.Component));
exports.default = Console;


/***/ }),

/***/ 138:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var ConsoleViewerDialog = (function (_super) {
    __extends(ConsoleViewerDialog, _super);
    function ConsoleViewerDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConsoleViewerDialog.prototype.render = function () {
        var _this = this;
        setTimeout(function () { return _this.dialog && (_this.dialog.scrollTop = _this.dialog.scrollHeight); }, 0);
        return (React.createElement("div", { id: "dialog", className: "console-viewer dark console", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(_this.dialog = e); }, onClick: function (e) { return e.stopPropagation(); }, style: { maxHeight: "90%", maxWidth: "90%", overflow: "auto", borderRadius: 0 } },
                React.createElement("div", { className: "dialog-header", style: { margin: 0 } },
                    React.createElement("span", { onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    React.createElement("span", { onClick: function (e) { return _this.dialog.scrollTop = _this.dialog.scrollHeight; } }, "scroll down"),
                    React.createElement("span", { onClick: function (e) { return _this.props.onClear(); } }, "clear"),
                    "Console Logs"),
                React.createElement("div", { className: "dialog-body", style: { padding: 10 } },
                    React.createElement("table", { style: { width: "100%" }, className: "console" },
                        React.createElement("tbody", null, this.props.logs.map(function (log) { return (React.createElement("tr", null,
                            React.createElement("td", { style: { padding: "2px 8px", tabSize: 4 } },
                                React.createElement("pre", { className: log.cls }, log.msg)))); })))),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("p", { style: { paddingBottom: 15 } },
                        React.createElement("span", { onClick: function (e) { return _this.props.onHide(); } }, "close"),
                        React.createElement("span", { onClick: function (e) { return _this.dialog.scrollTop = 0; } }, "scroll up"))))));
    };
    return ConsoleViewerDialog;
}(React.Component));
exports.default = ConsoleViewerDialog;


/***/ }),

/***/ 139:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var EditGistDialog = (function (_super) {
    __extends(EditGistDialog, _super);
    function EditGistDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EditGistDialog.prototype.render = function () {
        var _this = this;
        var description = this.props.description;
        if (this.txtDescription) {
            description = this.txtDescription.value;
        }
        else {
            setTimeout(function () { return _this.txtDescription.select(); }, 0);
        }
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Edit Gist"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "row" },
                        React.createElement("label", { htmlFor: "txtDescription" }, "Description"),
                        React.createElement("input", { ref: function (e) { return _this.txtDescription = e; }, type: "text", id: "txtDescription", defaultValue: description, onKeyUp: function (e) { return _this.forceUpdate(); }, onKeyDown: function (e) { return e.keyCode == 13 && description ? _this.props.onSave({ description: description }) : null; }, autoFocus: true }))),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("img", { className: "loading", src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } }),
                    React.createElement("span", { className: "btn" + (description ? "" : " disabled"), onClick: function (e) { return description ? _this.props.onSave({ description: description }) : null; } }, "Save")))));
    };
    return EditGistDialog;
}(React.Component));
exports.default = EditGistDialog;


/***/ }),

/***/ 140:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var servicestack_client_1 = __webpack_require__(14);
var utils_1 = __webpack_require__(21);
var CodeMirror = __webpack_require__(73);
__webpack_require__(170);
__webpack_require__(168);
__webpack_require__(169);
__webpack_require__(172);
__webpack_require__(47);
__webpack_require__(78);
__webpack_require__(173);
__webpack_require__(77);
__webpack_require__(76);
__webpack_require__(174);
__webpack_require__(340);
var extMimeTypes = {
    "cs": "text/x-csharp",
    "xml": "application/xml",
    "config": "application/xml",
    "md": "text/x-markdown",
    "css": "text/css",
    "js": "text/javascript",
    "json": "application/json"
};
var Editor = (function (_super) {
    __extends(Editor, _super);
    function Editor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Editor.prototype.resetSafariHeight = function () {
        if (utils_1.UA.safari) {
            var el = document.getElementsByClassName("CodeMirror-scroll")[0];
            if (el) {
                var editorSection = document.getElementById("editor");
                var reactEditor = document.getElementsByClassName("ReactCodeMirror")[0];
                if (!editorSection || !reactEditor)
                    return;
                el.style.height = (editorSection.clientHeight - (reactEditor.offsetTop - editorSection.offsetTop)) + "px";
            }
        }
    };
    Editor.prototype.componentDidMount = function () {
        this.resetSafariHeight();
    };
    Editor.prototype.getDoc = function () {
        return this.codeMirror && this.codeMirror.getDoc();
    };
    Editor.prototype.getSelection = function () {
        var doc = this.getDoc();
        return doc
            ? doc.getSelection()
            : "";
    };
    Editor.prototype.replaceSelection = function (text, opt) {
        if (opt === void 0) { opt = {}; }
        var doc = this.getDoc();
        if (!doc)
            return;
        var str = text.replace("{selection}", doc.getSelection());
        if (doc.getSelection() === "") {
            var cursor = doc.getCursor();
            doc.replaceRange(str, cursor, cursor);
            if (opt.noselect && (opt.noselect.line != null || opt.noselect.ch != null)) {
                doc.setCursor({ line: cursor.line + (opt.noselect.line || 0), ch: cursor.ch + (opt.noselect.ch || 0) });
            }
        }
        else {
            doc.replaceSelection(str);
        }
        this.codeMirror.focus();
    };
    Editor.prototype.toggleLine = function (text) {
        var doc = this.getDoc();
        if (!doc)
            return;
        var cursor = doc.getCursor();
        var line = doc.getRange({ line: cursor.line, ch: 0 }, { line: cursor.line + 1, ch: 0 });
        if (line.startsWith(text)) {
            doc.replaceRange("", { line: cursor.line, ch: 0 }, { line: cursor.line, ch: text.length });
        }
        else {
            doc.replaceRange(text, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: 0 });
        }
        this.codeMirror.focus();
    };
    Editor.prototype.handleCodeFormat = function () {
        var doc = this.getDoc();
        var selection = this.getSelection();
        if (selection === "") {
            var cursor = doc.getCursor();
            doc.replaceRange("\n```\n\n```\n", cursor, cursor);
            doc.setCursor({ line: cursor.line + 2, ch: cursor.ch });
            this.codeMirror.focus();
        }
        else {
            this.replaceSelection("`{selection}`");
        }
    };
    Editor.prototype.render = function () {
        var _this = this;
        var options = {
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            mode: "text/x-csharp",
            extraKeys: {
                "F11": function (cm) {
                    cm.setOption("fullScreen", !cm.getOption("fullScreen"));
                },
                "Esc": function (cm) {
                    if (cm.getOption("fullScreen"))
                        cm.setOption("fullScreen", false);
                    this.props.onShortcut("Esc");
                },
                "Ctrl-Enter": function (cm) { return _this.props.onShortcut("Ctrl-Enter"); },
                "Ctrl-S": function (cm) { return _this.props.onShortcut("Ctrl-S"); },
                "Alt-S": function (cm) { return _this.props.onShortcut("Alt-S"); },
                "Alt-C": function (cm) { return _this.props.onShortcut("Alt-C"); },
                "Ctrl-B": function (cm) { return _this.replaceSelection("**{selection}**", { noselect: { ch: 2 } }); },
                "Ctrl-I": function (cm) { return _this.replaceSelection("_{selection}_", { noselect: { ch: 1 } }); },
            }
        };
        var source = "";
        var files = this.props.files;
        var Tabs = [];
        var FileList = [];
        setTimeout(function () { return _this.resetSafariHeight(); }, 0);
        if (files) {
            var keys = utils_1.getSortedFileNames(files);
            var sizeToFit_1 = function (e) {
                var txt = e.currentTarget;
                var modifier = utils_1.UA.mac || utils_1.UA.ipad ? 3 : -2; //Spacing is different on OSX, iPad
                txt.size = Math.max(txt.value.length + modifier, 1);
            };
            keys.forEach(function (fileName) {
                var file = files[fileName];
                var active = fileName === _this.props.activeFileName ||
                    (_this.props.activeFileName == null && fileName.toLowerCase() === "main.cs");
                Tabs.push((React.createElement("div", { key: fileName, className: active ? 'active' : null, onClick: function (e) { return !active ? _this.props.selectFileName(fileName) : _this.props.editFileName(fileName); } }, _this.props.editingFileName !== fileName
                    ? React.createElement("b", null,
                        fileName,
                        _this.props.isOwner && active && utils_1.FileNames.canDelete(fileName)
                            ? React.createElement("i", { className: "material-icons delete", onClick: function (e) { return e.stopPropagation() || confirm("Are you sure you want to delete file '" + fileName + "'?") ? _this.props.onDeleteFile(fileName) : null; }, title: "delete file" }, "cancel")
                            : null)
                    : React.createElement("input", { type: "text", className: "txtFileName", onBlur: function (e) { return _this.props.onRenameFile(fileName, e); }, onKeyDown: function (e) { return e.keyCode === 13 ? e.target.blur() : null; }, defaultValue: fileName, onKeyUp: sizeToFit_1, size: Math.max(fileName.length - 3, 1), autoFocus: true }))));
                FileList.push((React.createElement("div", { key: fileName, className: "file", onClick: function (e) { return _this.props.selectFileName(fileName); } }, fileName)));
                if (active) {
                    var ext = servicestack_client_1.splitOnLast(fileName, ".")[1];
                    source = file.content;
                    options["mode"] = extMimeTypes[ext] || "text/x-csharp";
                }
            });
            if (this.props.isOwner) {
                Tabs.push((React.createElement("div", { key: "__add", title: "Add new file", onClick: function (e) { return _this.props.editFileName("+"); }, className: this.props.editingFileName === "+" ? "active" : "", style: { padding: "4px 6px" } }, this.props.editingFileName !== "+"
                    ? React.createElement("i", { className: "material-icons", style: { fontSize: 13 } }, "add")
                    : React.createElement("input", { type: "text", className: "txtFileName", onBlur: function (e) { return _this.props.onCreateFile(e); }, onKeyDown: function (e) { return e.keyCode === 13 ? e.target.blur() : null; }, onKeyUp: sizeToFit_1, size: 3, autoFocus: true }))));
            }
        }
        return (React.createElement("div", { id: "editor", className: this.props.isOwner ? "owner" : "", onDragOver: function (e) {
                console.log('editor onDragOver');
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }, onDrop: function (e) { return console.log('editor onDrop'); }, onDragStart: function (e) { return console.log('editor onDragStart'); }, onDragEnter: function (e) { return console.log('editor onDragEnter'); } },
            React.createElement("div", { id: "tabs", style: { display: this.props.files ? 'flex' : 'none' } },
                FileList.length > 0
                    ? React.createElement("i", { key: "files-menu", id: "files-menu", className: "material-icons", onClick: function (e) { return _this.props.showPopup(e, _this.filesPopup); } }, "arrow_drop_down") : null,
                Tabs),
            React.createElement("div", { id: "popup-files", className: "popup", ref: function (e) { return _this.filesPopup = e; } }, FileList),
            options["mode"] == "text/x-markdown"
                ? (React.createElement("div", { id: "markdown-toolbar" },
                    React.createElement("i", { className: "material-icons", title: "Heading", onClick: function (e) { return _this.toggleLine("## "); } }, "format_size"),
                    React.createElement("i", { className: "material-icons", title: "Bold", onClick: function (e) { return _this.replaceSelection("**{selection}**", { noselect: { ch: 2 } }); } }, "format_bold"),
                    React.createElement("i", { className: "material-icons", title: "Italics", onClick: function (e) { return _this.replaceSelection("_{selection}_", { noselect: { ch: 1 } }); } }, "format_italic"),
                    React.createElement("i", { className: "material-icons", title: "Strikethrough", onClick: function (e) { return _this.replaceSelection("~~{selection}~~", { noselect: { ch: 2 } }); } }, "strikethrough_s"),
                    React.createElement("i", { className: "material-icons", title: "Quote Text", onClick: function (e) { return _this.toggleLine("> "); } }, "format_quote"),
                    React.createElement("i", { className: "material-icons", title: "Unordered List", onClick: function (e) { return _this.toggleLine(" - "); } }, "format_list_bulleted"),
                    React.createElement("i", { className: "material-icons", title: "Ordered List", onClick: function (e) { return _this.toggleLine(" 1. "); } }, "format_list_numbered"),
                    React.createElement("i", { className: "material-icons", title: "Code", onClick: function (e) { return _this.handleCodeFormat(); } }, "code"),
                    React.createElement("i", { className: "material-icons", title: "Insert Link", onClick: function (e) { return _this.props.showDialog("insert-link"); } }, "insert_link"),
                    React.createElement("i", { className: "material-icons", title: "Insert Image", onClick: function (e) { return _this.props.showDialog("img-upload"); } }, "insert_photo")))
                : null,
            React.createElement(CodeMirror, { ref: function (e) { return _this.codeMirror = e && e.getCodeMirror(); }, value: source, options: options, onChange: function (src) { return _this.props.updateSource(_this.props.activeFileName, src); } })));
    };
    return Editor;
}(React.Component));
exports.default = Editor;


/***/ }),

/***/ 141:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var DropZone = __webpack_require__(75);
var ImageUploadDialog = (function (_super) {
    __extends(ImageUploadDialog, _super);
    function ImageUploadDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ImageUploadDialog.prototype.handleImageUrl = function () {
        if (this.txtImageUrl && this.txtImageUrl.value.startsWith("http")) {
            this.props.onChange(this.txtImageUrl.value);
            this.props.onHide();
            return;
        }
    };
    ImageUploadDialog.prototype.handleDrop = function (files) {
        var _this = this;
        this.dialog.classList.add("disabled");
        if (this.txtImageUrl)
            this.txtImageUrl.disabled = true;
        var uploadFiles = files.map(function (f) { return _this.uploadFile(f); });
        Promise.all(uploadFiles)
            .then(function () {
            _this.dialog.classList.remove("disabled");
            _this.props.onHide();
        });
    };
    ImageUploadDialog.prototype.uploadFile = function (file) {
        var _this = this;
        var formData = new FormData();
        formData.append('description', file.name + ' on http://gistlyn.com?gist=' + this.props.id);
        formData.append('type', 'file');
        formData.append('image', file);
        return fetch('https://api.imgur.com/3/upload.json', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: 'Client-ID c891e34185a353f'
            },
            body: formData
        })
            .then(function (r) {
            if (r.status == 200 || r.status == 0) {
                r.json().then(function (o) {
                    _this.props.onChange(o.data.link);
                });
            }
            else {
                alert("Error uploading Image: " + file.name);
            }
        });
    };
    ImageUploadDialog.prototype.render = function () {
        var _this = this;
        var hasSelectedImage = !!(this.fileImage && this.fileImage.value);
        var hasProvidedUrl = this.txtImageUrl && this.txtImageUrl.value.startsWith("http");
        var disabledColor = { color: "#999" };
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(_this.dialog = e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Insert Image"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "row" },
                        React.createElement("label", { htmlFor: "txtImageUrl", style: hasSelectedImage ? disabledColor : null }, "Image URL"),
                        React.createElement("input", { ref: function (e) { return _this.txtImageUrl = e; }, type: "text", id: "txtImageUrl", onKeyUp: function (e) { return _this.forceUpdate(); }, placeholder: "Enter the url you want to use", onKeyDown: function (e) { return e.keyCode == 13 && hasProvidedUrl ? e.preventDefault() || _this.handleImageUrl() : null; }, disabled: hasSelectedImage, autoFocus: true }),
                        React.createElement("span", { className: "btn" + (hasSelectedImage || hasProvidedUrl ? "" : " disabled"), style: { padding: "6px 10px", marginLeft: 5, verticalAlign: "baseline" }, onClick: function (e) { return _this.handleImageUrl(); } }, hasSelectedImage ? "Upload to Imgur" : "Insert Image")),
                    React.createElement("div", { className: "row" },
                        React.createElement(DropZone, { onDrop: function (files) { return _this.handleDrop(files); }, className: "dropzone", activeClassName: "dropzone-active", accept: "image/*" },
                            React.createElement("div", { className: "droparea" },
                                React.createElement("p", null, "Click or drag Images to upload to Imgur"),
                                React.createElement("div", { className: "loading", style: { marginTop: 15 } },
                                    React.createElement("span", { style: { display: "inline-block", color: "#888", marginRight: 10 } }, "Uploading to Imgur..."),
                                    React.createElement("img", { src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } })))))))));
    };
    return ImageUploadDialog;
}(React.Component));
exports.default = ImageUploadDialog;


/***/ }),

/***/ 142:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var InadequateBrowserDialog = (function (_super) {
    __extends(InadequateBrowserDialog, _super);
    function InadequateBrowserDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InadequateBrowserDialog.prototype.render = function () {
        return (React.createElement("div", { id: "nosse", style: {
                background: "url(https://raw.githubusercontent.com/ServiceStack/Assets/master/img/livedemos/gistlyn/no-ie.jpg) no-repeat",
                backgroundSize: "cover",
                height: "100%",
                width: "100%"
            } },
            React.createElement("div", { id: "nosse-dialog", style: { position: "absolute", top: 20, right: 20, color: "#f7f7f7", fontSize: 24, lineHeight: "30px", maxWidth: 800 } },
                React.createElement("p", null,
                    "If you're seeing this message your browser still doesn't have native support for",
                    React.createElement("a", { href: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events" }, "Server Sent Events (SSE)"),
                    "- a simple",
                    React.createElement("a", { href: "https://html.spec.whatwg.org/multipage/comms.html#server-sent-events" }, "Web Standard"),
                    "supported by most modern browsers since 2011. If you would like this site to work in Internet Explorer or MS Edge browsers",
                    React.createElement("a", { href: "https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6263825-server-sent-events-eventsource" }, "vote to have them implement it.")),
                React.createElement("br", null),
                React.createElement("p", null, "In the meantime we recommend using these better browsers below:"),
                React.createElement("ul", { style: { listStyleType: "disc", margin: 30 } },
                    React.createElement("li", null,
                        React.createElement("a", { href: "https://www.google.com/chrome/browser/desktop/" }, "Chrome")),
                    React.createElement("li", null,
                        React.createElement("a", { href: "http://www.apple.com/safari/" }, "Safari")),
                    React.createElement("li", null,
                        React.createElement("a", { href: "https://www.mozilla.org/en-US/firefox/" }, "Firefox")),
                    React.createElement("li", null,
                        React.createElement("a", { href: "http://www.opera.com/" }, "Opera"))))));
    };
    return InadequateBrowserDialog;
}(React.Component));
exports.default = InadequateBrowserDialog;


/***/ }),

/***/ 143:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var utils_1 = __webpack_require__(21);
var state_1 = __webpack_require__(36);
var Gistlyn_dtos_1 = __webpack_require__(30);
var InsertLinkDialog = (function (_super) {
    __extends(InsertLinkDialog, _super);
    function InsertLinkDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { tab: null, gistTab: null, collectionTab: null };
        return _this;
    }
    InsertLinkDialog.prototype.selectTab = function (tab) {
        this.setState({ tab: tab });
    };
    InsertLinkDialog.prototype.selectLink = function (e) {
        if (!this.txtLinkLabel || !this.txtLinkUrl || !this.txtLinkUrl.value)
            return;
        e.preventDefault();
        var url = this.txtLinkUrl.value;
        if (url.indexOf(':') < 0 && ['com', 'net', 'org', 'io'].some(function (tld) { return url.indexOf('.' + tld) >= 0; })) {
            url = "http://" + url;
        }
        var pos = url.indexOf("gistlyn.com"); //strip gistlyn.com so url works in all Gistlyn versions
        if (pos >= 0) {
            url = url.substring(pos + "gistlyn.com".length);
        }
        pos = url.indexOf("localhost:4000");
        if (pos >= 0) {
            url = url.substring(pos + "localhost:4000".length);
        }
        if (url.startsWith("/?")) {
            url = url.substring(1);
        }
        this.props.onChange(url, this.txtLinkLabel.value);
    };
    InsertLinkDialog.prototype.handleCreateNewGist = function (id, authUsername) {
        var _this = this;
        this.dialog.classList.add("disabled");
        var handleGistTemplate = function (gist) {
            var request = new Gistlyn_dtos_1.StoreGist();
            request.public = true;
            request.description = _this.props.linkLabel || gist.meta.description;
            request.files = utils_1.toGithubFiles(gist.files);
            return utils_1.client.post(request)
                .then(function (r) {
                _this.dialog.classList.remove("disabled");
                return r.gist;
            });
        };
        var gist = state_1.getSavedGist(id);
        if (!gist) {
            return fetch(state_1.createGistRequest(authUsername, id))
                .then(function (res) { return res.json(); })
                .then(function (r) { return handleGistTemplate({ files: r.files, meta: state_1.createGistMeta(r) }); });
        }
        else {
            return handleGistTemplate(gist);
        }
    };
    InsertLinkDialog.prototype.handleGist = function (gistRef, createNew) {
        var _this = this;
        if (createNew) {
            this.handleCreateNewGist(gistRef.id, this.props.authUsername)
                .then(function (id) { return _this.props.onChange("?gist=" + id, _this.props.linkLabel || gistRef.description); });
        }
        else {
            this.props.onChange("?gist=" + gistRef.id, this.props.linkLabel || gistRef.description);
        }
    };
    InsertLinkDialog.prototype.handleCollection = function (gistRef, createNew) {
        var _this = this;
        if (createNew) {
            this.handleCreateNewGist(gistRef.id, this.props.authUsername)
                .then(function (id) { return _this.props.onChange("?collection=" + id, _this.props.linkLabel || gistRef.description); });
        }
        else {
            var url = "?collection=" + gistRef.id;
            this.props.onChange(url, this.props.linkLabel || gistRef.description);
        }
    };
    InsertLinkDialog.prototype.render = function () {
        var _this = this;
        var tab = this.state.tab || "URL";
        var gistTab = this.state.gistTab || "existing";
        var tabNames = ["URL", "Gists", "Collections"];
        var hasUrl = this.txtLinkUrl && this.txtLinkUrl.value;
        var TabBody = null;
        if (tab == "Gists") {
            var newGist_1 = { id: utils_1.GistTemplates.NewGist, description: "New Public Gist", owner_login: "gistlyn" };
            TabBody = (React.createElement("div", { className: "tab-body" },
                React.createElement("div", { className: "row radiotabs" },
                    React.createElement("div", { onClick: function (e) { return _this.setState({ gistTab: "existing" }); } },
                        React.createElement("i", { className: "material-icons" }, gistTab == "existing" ? "radio_button_checked" : "radio_button_unchecked"),
                        " Existing Gist"),
                    React.createElement("div", { onClick: function (e) { return _this.setState({ gistTab: "new" }); } },
                        React.createElement("i", { className: "material-icons" }, gistTab == "new" ? "radio_button_checked" : "radio_button_unchecked"),
                        " Create New Gist")),
                gistTab == "new"
                    ? (React.createElement("dl", { className: "insert-link-new" },
                        React.createElement("dt", null, "Select an existing Gist to use as Template"),
                        React.createElement("dd", { onClick: function (e) { return _this.handleGist(newGist_1, true); } }, newGist_1.description)))
                    : null,
                React.createElement(GistLinks, { filter: function (x) { return !x.collection; }, onChange: function (gist) { return _this.handleGist(gist, gistTab == "new"); }, gistStats: this.props.gistStats, authUsername: this.props.authUsername, excludeGists: utils_1.GistTemplates.Gists })));
        }
        else if (tab == "Collections") {
            var newGist_2 = { id: utils_1.GistTemplates.NewCollection, description: "New Collection", owner_login: "gistlyn" };
            TabBody = (React.createElement("div", { className: "tab-body" },
                React.createElement("div", { className: "row radiotabs" },
                    React.createElement("div", { onClick: function (e) { return _this.setState({ gistTab: "existing" }); } },
                        React.createElement("i", { className: "material-icons" }, gistTab == "existing" ? "radio_button_checked" : "radio_button_unchecked"),
                        " Existing Collection"),
                    React.createElement("div", { onClick: function (e) { return _this.setState({ gistTab: "new" }); } },
                        React.createElement("i", { className: "material-icons" }, gistTab == "new" ? "radio_button_checked" : "radio_button_unchecked"),
                        " Create New Collection")),
                gistTab == "new"
                    ? (React.createElement("dl", { className: "insert-link-new" },
                        React.createElement("dt", null, "Select an existing Collection to use as Template"),
                        React.createElement("dd", { onClick: function (e) { return _this.handleCollection(newGist_2, true); } }, newGist_2.description)))
                    : null,
                React.createElement(GistLinks, { filter: function (x) { return x.collection; }, onChange: function (gist) { return _this.handleCollection(gist, gistTab == "new"); }, gistStats: this.props.gistStats, authUsername: this.props.authUsername, excludeGists: utils_1.GistTemplates.Gists })));
        }
        else {
            TabBody = (React.createElement("div", { className: "tab-body" },
                React.createElement("div", { className: "row" },
                    React.createElement("label", { htmlFor: "txtLinkUrl" }, "URL"),
                    React.createElement("input", { ref: function (e) { return _this.txtLinkUrl = e; }, type: "text", id: "txtLinkUrl", onKeyUp: function (e) { return _this.forceUpdate(); }, onKeyDown: function (e) { return e.keyCode == 13 ? _this.selectLink(e) : null; }, placeholder: "Link URL", autoFocus: true })),
                React.createElement("div", { className: "row" },
                    React.createElement("label", { htmlFor: "txtLinkLabel" }, "Label"),
                    React.createElement("input", { ref: function (e) { return _this.txtLinkLabel = e; }, type: "text", id: "txtLinkLabel", defaultValue: this.props.linkLabel || "", onKeyUp: function (e) { return _this.forceUpdate(); }, onKeyDown: function (e) { return e.keyCode == 13 ? _this.selectLink(e) : null; }, placeholder: "Link Label (optional)" }))));
        }
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { id: "insert-link-dialog", className: "dialog", ref: function (e) { return _this.props.dialogRef(_this.dialog = e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Insert Link"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "linktabs" }, tabNames.map(function (x) { return React.createElement("div", { className: x == tab ? "active" : "", onClick: function (e) { return _this.selectTab(x); } }, x); })),
                    TabBody),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("img", { className: "loading", src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } }),
                    tab == "URL"
                        ? (React.createElement("span", { className: "btn" + (hasUrl ? "" : " disabled"), onClick: function (e) { return _this.selectLink(e); } }, "Insert Link"))
                        : null))));
    };
    return InsertLinkDialog;
}(React.Component));
exports.default = InsertLinkDialog;
var GistLinks = (function (_super) {
    __extends(GistLinks, _super);
    function GistLinks(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { filter: "" };
        return _this;
    }
    GistLinks.prototype.render = function () {
        var _this = this;
        var allGists = Object.keys(this.props.gistStats)
            .map(function (k) { return _this.props.gistStats[k]; })
            .filter(function (x) { return _this.props.excludeGists.indexOf(x.id) === -1; });
        var sortByRecent = function (gists) {
            gists.sort(function (a, b) { return b.date - a.date; });
            return gists;
        };
        var removeDupes = function (xs) {
            var dupes = {};
            return xs.filter(function (x) { return dupes[x.description] ? false : !!(dupes[x.description] = x); });
        };
        var filter = this.state.filter;
        var myGists = removeDupes(sortByRecent(allGists.filter(function (x) { return (!filter || x.description.toLowerCase().indexOf(filter.toLowerCase()) >= 0) &&
            x.owner_login === _this.props.authUsername && _this.props.filter(x); })));
        var recentGists = removeDupes(sortByRecent(allGists.filter(function (x) { return (!filter || x.description.toLowerCase().indexOf(filter.toLowerCase()) >= 0) &&
            x.owner_login !== _this.props.authUsername && _this.props.filter(x); })));
        return (React.createElement("div", { id: "gist-links" },
            React.createElement("input", { type: "text", placeholder: "filter", onKeyUp: function (e) { return _this.setState({ filter: e.target.value }); } }),
            React.createElement("div", { className: "gist-links-body" },
                myGists.length > 0
                    ? (React.createElement("div", { className: "my-gists" },
                        React.createElement("dl", null,
                            React.createElement("dt", null, "My Gists"),
                            myGists.map(function (x) { return React.createElement("dd", { onClick: function (e) { return _this.props.onChange(x); } }, x.description); }))))
                    : null,
                recentGists.length > 0
                    ? (React.createElement("div", { className: "recent-gists" },
                        React.createElement("dl", null,
                            React.createElement("dt", null, "Recent Gists"),
                            recentGists.map(function (x) { return React.createElement("dd", { onClick: function (e) { return _this.props.onChange(x); } }, x.description); }))))
                    : null)));
    };
    return GistLinks;
}(React.Component));


/***/ }),

/***/ 144:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var SaveAsDialog = (function (_super) {
    __extends(SaveAsDialog, _super);
    function SaveAsDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SaveAsDialog.prototype.render = function () {
        var _this = this;
        var description = this.props.description;
        if (this.txtDescription) {
            description = this.txtDescription.value;
        }
        else {
            setTimeout(function () { return _this.txtDescription.select(); }, 0);
        }
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    this.props.shouldFork ? "Fork" : "Save",
                    " Gist"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "row" },
                        React.createElement("label", { htmlFor: "txtDescription" }, "Description"),
                        React.createElement("input", { ref: function (e) { return _this.txtDescription = e; }, type: "text", id: "txtDescription", defaultValue: description, onKeyUp: function (e) { return _this.forceUpdate(); }, onKeyDown: function (e) { return e.keyCode == 13 && description ? _this.props.onSave({ description: description }) : null; }, autoFocus: true })),
                    React.createElement("div", { className: "row", style: { color: this.props.isPublic ? "#4CAF50" : "#9C27B0" }, title: "This gist is " + (this.props.isPublic ? "public" : "private") },
                        React.createElement("label", null),
                        React.createElement("i", { className: "material-icons", style: { verticalAlign: "bottom", marginRight: 5, fontSize: 20 } }, "check"),
                        "Is ",
                        this.props.isPublic ? "public" : "private")),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("img", { className: "loading", src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } }),
                    React.createElement("span", { className: "btn" + (description ? "" : " disabled"), onClick: function (e) { return description ? _this.props.onSave({ description: description }) : null; } },
                        "Create ",
                        this.props.shouldFork ? "Fork" : "Gist")))));
    };
    return SaveAsDialog;
}(React.Component));
exports.default = SaveAsDialog;


/***/ }),

/***/ 145:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var ShortcutsDialog = (function (_super) {
    __extends(ShortcutsDialog, _super);
    function ShortcutsDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ShortcutsDialog.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { id: "dialog", className: "shortcuts dark", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.props.dialogRef(e); }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Keyboard shortcuts"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("table", null,
                        React.createElement("tbody", null,
                            React.createElement("tr", null,
                                React.createElement("td", null),
                                React.createElement("td", null,
                                    React.createElement("h4", null, "Editor Shortcuts"))),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Ctrl>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<Enter>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Run")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Ctrl>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<S>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Save")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<F11>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Toggle Full Screen")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Esc>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Exit Full Screen")),
                            React.createElement("tr", null,
                                React.createElement("td", null),
                                React.createElement("td", null,
                                    React.createElement("h4", null, "Application Shortcuts"))),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Alt>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<S>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Take Snapshot")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Alt>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<C>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Console Viewer")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Ctrl>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<Left>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Go to Previous tab")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Ctrl>"),
                                    React.createElement("span", null, " + "),
                                    React.createElement("b", null, "<Right>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Go to Next tab")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("span", null, " ? "),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Open keyboard shortcut dialog")),
                            React.createElement("tr", null,
                                React.createElement("th", null,
                                    React.createElement("b", null, "<Esc>"),
                                    React.createElement("i", null, ":")),
                                React.createElement("td", null, "Close dialog"))))))));
    };
    return ShortcutsDialog;
}(React.Component));
exports.default = ShortcutsDialog;


/***/ }),

/***/ 146:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var servicestack_client_1 = __webpack_require__(14);
var Gistlyn_dtos_1 = __webpack_require__(30);
var utils_1 = __webpack_require__(21);
var TakeSnapshotDialog = (function (_super) {
    __extends(TakeSnapshotDialog, _super);
    function TakeSnapshotDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { snapshotUrl: null, error: null };
        return _this;
    }
    TakeSnapshotDialog.prototype.onSave = function (opt) {
        var _this = this;
        var request = new Gistlyn_dtos_1.StoreGist();
        var json = JSON.stringify(this.props.snapshot);
        request.files = (_a = {},
            _a["snapshot.json"] = { filename: "snapshot.json", content: json },
            _a);
        this.dialog.classList.add("disabled");
        var client = new servicestack_client_1.JsonServiceClient("/");
        client.post(request)
            .then(function (r) {
            _this.dialog.classList.remove("disabled");
            _this.setState({ snapshotUrl: location.origin + ("?snapshot=" + r.gist), error: null });
        }).catch(function (e) {
            _this.dialog.classList.remove("disabled");
            _this.setState({ error: (e.status || {}).message });
        });
        var _a;
    };
    TakeSnapshotDialog.prototype.render = function () {
        var _this = this;
        var description = this.props.description;
        if (this.txtDescription) {
            description = this.txtDescription.value;
        }
        else {
            setTimeout(function () { return _this.txtDescription.select(); }, 0);
        }
        var Body = [];
        if (!this.state.snapshotUrl) {
            Body.push([
                React.createElement("div", { className: "row" },
                    React.createElement("label", { htmlFor: "txtDescription" }, "Description"),
                    React.createElement("input", { ref: function (e) { return _this.txtDescription = e; }, type: "text", id: "txtDescription", defaultValue: description, onKeyUp: function (e) { return _this.forceUpdate(); }, onKeyDown: function (e) { return e.keyCode == 13 && description ? _this.onSave({ description: description }) : null; }, autoFocus: true })),
                React.createElement("div", { className: "row" },
                    React.createElement("label", null),
                    React.createElement("span", { className: "btn" + (description ? "" : " disabled"), style: { fontSize: 14, padding: "4px 6px" }, onClick: function (e) { return description ? _this.onSave({ description: description }) : null; } }, "Save Snapshot"),
                    React.createElement("img", { className: "loading", src: __webpack_require__(15), style: { margin: "5px 0 0 10px" } }))
            ]);
        }
        else {
            setTimeout(function () { return _this.txtDescription.select(); }, 0);
            Body.push([
                React.createElement("div", { className: "row" },
                    React.createElement("label", null, "Snapshot Url"),
                    React.createElement("input", { ref: function (e) { return _this.txtDescription = e; }, type: "text", id: "txtDescription", value: this.state.snapshotUrl, autoFocus: true }))
            ]);
        }
        if (this.state.error) {
            Body.push(React.createElement("span", { style: { color: "#c00" } }, this.state.error));
        }
        return (React.createElement("div", { id: "dialog", onClick: function (e) { return _this.props.onHide(); }, onKeyDown: function (e) { return e.keyCode === 27 ? _this.props.onHide() : null; } },
            React.createElement("div", { className: "dialog", ref: function (e) { return _this.dialog = e; }, onClick: function (e) { return e.stopPropagation(); } },
                React.createElement("div", { className: "dialog-header" },
                    React.createElement("i", { className: "material-icons close", onClick: function (e) { return _this.props.onHide(); } }, "close"),
                    "Capture Snapshot"),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("div", { className: "row", style: { textAlign: "right" } },
                        React.createElement("i", { className: "material-icons info-help", onClick: function (e) { return _this.props.urlChanged(utils_1.GistTemplates.SnapshotsCollection); }, title: "What is this?" }, "help_outline")),
                    Body),
                React.createElement("div", { className: "dialog-footer" },
                    React.createElement("span", { onClick: function (e) { return _this.props.onHide(); }, style: { cursor: "pointer" } }, "close")))));
    };
    return TakeSnapshotDialog;
}(React.Component));
exports.default = TakeSnapshotDialog;


/***/ }),

/***/ 147:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var ReactGA = __webpack_require__(29);
var state_1 = __webpack_require__(36);
var json_viewer_1 = __webpack_require__(148);
var servicestack_client_1 = __webpack_require__(14);
var utils_1 = __webpack_require__(21);
var SaveAsDialog_1 = __webpack_require__(144);
var EditGistDialog_1 = __webpack_require__(139);
var ShortcutsDialog_1 = __webpack_require__(145);
var InsertLinkDialog_1 = __webpack_require__(143);
var ImageUploadDialog_1 = __webpack_require__(141);
var TakeSnapshotDialog_1 = __webpack_require__(146);
var ConsoleViewerDialog_1 = __webpack_require__(138);
var AddServiceStackReferenceDialog_1 = __webpack_require__(135);
var Console_1 = __webpack_require__(137);
var Collections_1 = __webpack_require__(136);
var Editor_1 = __webpack_require__(140);
var Gistlyn_dtos_1 = __webpack_require__(30);
var ScriptStatusRunning = ["Started", "PrepareToRun", "Running"];
var capturedSnapshot = null;
var App = (function (_super) {
    __extends(App, _super);
    function App() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.run = function () {
            var main = _this.getMainFile();
            if (!main)
                return;
            _this.props.clearError();
            var request = new Gistlyn_dtos_1.RunScript();
            request.scriptId = _this.scriptId;
            request.mainSource = main.content;
            request.packagesConfig = _this.getFileContents(utils_1.FileNames.GistPackages);
            request.sources = [];
            for (var k in _this.props.files || []) {
                if (k.endsWith(".cs") && k.toLowerCase() !== utils_1.FileNames.GistMain)
                    request.sources.push(_this.props.files[k].content);
            }
            _this.props.setScriptStatus("Started");
            ReactGA.event({ category: 'gist', action: 'Run Gist', label: _this.props.gist });
            utils_1.client.post(request)
                .then(function (r) {
                var msgs = r.references.map(function (ref) { return "loaded " + ref.name; });
                msgs.push("\n");
                _this.props.logConsoleMsgs(msgs);
            })
                .catch(function (e) {
                _this.props.raiseError(e.responseStatus || e);
                _this.props.setScriptStatus("Failed");
            });
        };
        _this.cancel = function () {
            _this.props.clearError();
            var request = new Gistlyn_dtos_1.CancelScript();
            request.scriptId = _this.scriptId;
            ReactGA.event({ category: 'gist', action: 'Cancel Gist', label: _this.props.gist });
            utils_1.client.post(request)
                .then(function (r) {
                _this.props.setScriptStatus("Cancelled");
                _this.props.logConsole([{ msg: "Cancelled by user", cls: "error" }]);
            })
                .catch(function (r) {
                _this.props.raiseError(r.responseStatus);
                _this.props.setScriptStatus("Failed");
            });
        };
        return _this;
    }
    App.prototype.getFile = function (fileName) {
        if (this.props.files == null)
            return null;
        for (var k in this.props.files) {
            if (k.toLowerCase() === fileName) {
                return this.props.files[k];
            }
        }
        return null;
    };
    App.prototype.getFileContents = function (fileName) {
        var file = this.getFile(fileName);
        return file != null
            ? file.content
            : null;
    };
    App.prototype.getMainFile = function () {
        return this.getFile(utils_1.FileNames.GistMain);
    };
    Object.defineProperty(App.prototype, "scriptId", {
        get: function () {
            return this.props.activeSub && this.props.activeSub.id;
        },
        enumerable: true,
        configurable: true
    });
    App.prototype.save = function () {
        var meta = this.props.meta;
        var authUsername = this.getAuthUsername();
        if (!meta) {
            this.props.logConsoleError({ message: "There is nothing to save." });
        }
        else if (!authUsername) {
            this.signIn();
        }
        else if (meta.owner_login !== authUsername) {
            this.saveGistAs();
        }
        else {
            this.saveGist();
        }
    };
    App.prototype.inspectVariable = function (v) {
        var _this = this;
        var request = new Gistlyn_dtos_1.GetScriptVariables();
        request.scriptId = this.scriptId;
        request.variableName = v.name;
        ReactGA.event({ category: 'preview', action: 'Inspect Variable', label: this.props.gist + ": " + v.name });
        utils_1.client.get(request)
            .then(function (r) {
            if (r.status !== "Completed") {
                var msg = r.status === "Unknown"
                    ? "Script no longer exists on server"
                    : "Script Error: " + servicestack_client_1.humanize(r.status);
                _this.props.logConsole([{ msg: msg, cls: "error" }]);
            }
            else {
                _this.props.inspectVariable(v.name, r.variables);
            }
        });
    };
    App.prototype.getVariableRows = function (v) {
        var _this = this;
        var varProps = this.props.inspectedVariables[v.name];
        var rows = [(React.createElement("tr", null,
                React.createElement("td", { className: "name", style: { whiteSpace: "nowrap" } },
                    v.isBrowseable
                        ? (varProps
                            ? React.createElement("span", { className: "octicon octicon-triangle-down", style: { margin: "0 10px 0 0" }, onClick: function (e) { return _this.props.inspectVariable(v.name, null); } })
                            : React.createElement("span", { className: "octicon octicon-triangle-right", style: { margin: "0 10px 0 0" }, onClick: function (e) { return _this.inspectVariable(v); } }))
                        : React.createElement("span", { className: "octicon octicon-triangle-right", style: { margin: "0 10px 0 0", color: "#f7f7f7" } }),
                    React.createElement("a", { onClick: function (e) { return _this.setAndEvaluateExpression(v.name); } }, v.name)),
                React.createElement("td", { className: "value" },
                    React.createElement("span", { title: v.value }, v.value)),
                React.createElement("td", { className: "type" },
                    React.createElement("span", { title: v.type }, v.type))))];
        if (varProps) {
            varProps.forEach(function (p) {
                rows.push((React.createElement("tr", null,
                    React.createElement("td", { className: "name", style: { padding: "0 0 0 50px" } }, p.canInspect
                        ? React.createElement("a", { onClick: function (e) { return _this.setAndEvaluateExpression(v.name + (p.name[0] != "[" ? "." : "") + p.name); } }, p.name)
                        : React.createElement("span", { style: { color: "#999" } }, p.name)),
                    React.createElement("td", { className: "value" },
                        React.createElement("span", { title: p.value }, p.value)),
                    React.createElement("td", { className: "type" },
                        React.createElement("span", { title: p.type }, p.type)))));
            });
        }
        return rows;
    };
    App.prototype.setAndEvaluateExpression = function (expr) {
        this.props.setExpression(expr);
        this.evaluateExpression(expr);
    };
    App.prototype.evaluateExpression = function (expr) {
        if (!expr) {
            this.props.setExpression(expr);
        }
        else {
            utils_1.evalExpression(this.props.gist, this.scriptId, expr);
        }
    };
    App.prototype.clearGistCache = function () {
        var removeKeys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.startsWith("/v1/gists/")) {
                removeKeys.push(key);
            }
        }
        removeKeys.forEach(function (key) { return localStorage.removeItem(key); });
    };
    App.prototype.revertGist = function (shiftKey, ctrlKey) {
        if (shiftKey === void 0) { shiftKey = false; }
        if (ctrlKey === void 0) { ctrlKey = false; }
        localStorage.removeItem(utils_1.GistCacheKey(this.props.gist));
        ReactGA.event({ category: 'gist', action: 'Revert Gist', label: this.props.gist });
        var gist = this.props.gist;
        var resetAll = shiftKey && ctrlKey;
        if (resetAll) {
            localStorage.clear();
            history.replaceState(null, "Gistlyn", "/");
            gist = utils_1.GistTemplates.NewGist;
            this.props.reset();
        }
        else if (shiftKey) {
            localStorage.removeItem(utils_1.StateKey);
        }
        this.props.changeGist(gist, { reload: true });
    };
    App.prototype.createStoreGist = function (opt) {
        if (opt === void 0) { opt = {}; }
        var meta = this.props.meta;
        var files = this.props.files;
        if (!meta || !files)
            return null;
        var request = new Gistlyn_dtos_1.StoreGist();
        request.gist = this.props.gist;
        request.fork = opt.fork || this.shouldFork();
        request.ownerLogin = opt.ownerLogin || meta.owner_login;
        request.public = opt.public || meta.public;
        request.description = opt.description || meta.description;
        request.files = opt.files || utils_1.toGithubFiles(files);
        return request;
    };
    App.prototype.saveGist = function (opt) {
        var _this = this;
        if (opt === void 0) { opt = {}; }
        if (this.dialog)
            this.dialog.classList.add("disabled");
        var request = this.createStoreGist(opt);
        if (request == null)
            return;
        var done = function () { return _this.dialog && _this.dialog.classList.remove("disabled"); };
        ReactGA.event({ category: 'gist', action: 'Save Gist', label: this.props.gist });
        var complete = function (r) {
            if (_this.props.gist !== r.gist) {
                _this.props.changeGist(r.gist);
            }
            else {
                _this.props.updateDescription(document.title = request.description);
            }
            _this.props.showDialog(null);
            _this.props.setDirty(false);
            _this.props.logConsole([{ msg: "[" + servicestack_client_1.timeFmt12() + "] Gist was saved.", cls: "success" }]);
            done();
        };
        utils_1.client.post(request)
            .then(complete)
            .catch(function (e) {
            _this.props.logConsoleError(e.responseStatus || e);
            if (e.responseStatus && (e.responseStatus.message || "").indexOf("404") >= 0) {
                request.ownerLogin = null;
                _this.props.logConsole([{ msg: "[" + servicestack_client_1.timeFmt12() + "] Gist no longer exists. Attempting to Save as new Gist..." }]);
                utils_1.client.post(request)
                    .then(complete)
                    .catch(function (retryError) {
                    _this.props.logConsoleError(retryError.responseStatus || retryError);
                    done();
                });
            }
            else {
                done();
            }
        });
    };
    App.prototype.handleCreateFile = function (e) {
        var txt = e.currentTarget;
        if (txt == null)
            return;
        txt.disabled = true;
        this.createFile(txt.value)
            .then(function (r) { return txt.disabled = false; });
    };
    App.prototype.createFile = function (fileName, opt) {
        var _this = this;
        if (opt === void 0) { opt = {}; }
        var done = function () { return _this.props.editFileName(null); };
        var request = this.createStoreGist();
        if (!fileName || fileName.trim().length == 0 || request == null) {
            done();
            return Promise.resolve(null);
        }
        if (fileName.indexOf('.') === -1)
            fileName += ".cs";
        request.files[fileName] = new Gistlyn_dtos_1.GithubFile();
        request.files[fileName].content = opt.content || "// " + fileName + "\n// Created by " + this.props.activeSub.displayName + " on " + servicestack_client_1.dateFmt() + "\n\n"; //Gist API requires non Whitespace content
        ReactGA.event({ category: 'file', action: 'Create File', label: fileName });
        return utils_1.client.post(request)
            .then(function (r) {
            _this.props.changeGist(r.gist, { reload: true, activeFileName: fileName });
        })
            .catch(function (e) {
            _this.props.logConsoleError(e.responseStatus || e);
        });
    };
    App.prototype.handleRenameFile = function (oldFileName, e) {
        var txt = e.currentTarget;
        if (txt == null)
            return;
        txt.disabled = true;
        this.renameFile(oldFileName, txt.value)
            .then(function (r) { return txt.disabled = false; });
    };
    App.prototype.renameFile = function (oldFileName, newFileName) {
        var _this = this;
        var done = function () { return _this.props.editFileName(null); };
        var request = this.createStoreGist();
        if (!newFileName || newFileName.trim().length == 0 || request == null || newFileName === oldFileName) {
            done();
            return Promise.resolve(null);
        }
        else if (oldFileName === utils_1.FileNames.GistMain || oldFileName === utils_1.FileNames.GistPackages) {
            done();
            this.props.logConsoleError({ message: "Cannot rename " + oldFileName });
            return Promise.resolve(null);
        }
        if (newFileName.indexOf('.') === -1)
            newFileName += ".cs";
        request.files[oldFileName].filename = newFileName;
        ReactGA.event({ category: 'file', action: 'Rename File', label: newFileName });
        return utils_1.client.post(request)
            .then(function (r) {
            _this.props.changeGist(r.gist, { reload: true, activeFileName: newFileName });
        })
            .catch(function (e) {
            _this.props.logConsoleError(e.responseStatus || e);
        });
    };
    App.prototype.deleteFile = function (fileName) {
        var _this = this;
        if (!fileName)
            return;
        var json = JSON.stringify({ files: (_a = {}, _a[fileName] = null, _a) });
        ReactGA.event({ category: 'file', action: 'Delete File', label: fileName });
        fetch("/github-proxy/gists/" + this.props.gist, { method: "PATCH", credentials: "include", body: json })
            .then(function (res) {
            _this.props.changeGist(_this.props.gist, { reload: true });
        })
            .catch(function (e) {
            _this.props.logConsoleError(e.responseStatus || e);
        });
        var _a;
    };
    App.prototype.deleteGist = function (gist) {
        var _this = this;
        if (!gist)
            return;
        ReactGA.event({ category: 'gist', action: 'Delete Gist', label: gist });
        fetch("/github-proxy/gists/" + this.props.gist, { method: "DELETE", credentials: "include" })
            .then(function (res) {
            _this.props.removeGistStat(gist);
            _this.props.changeGist(utils_1.GistTemplates.NewGist, { reload: true });
        })
            .catch(function (e) {
            _this.props.logConsoleError(e.responseStatus || e);
        });
    };
    App.prototype.saveGistAs = function () {
        ReactGA.event({ category: 'gist', action: 'Save As', label: this.props.gist });
        this.props.showDialog("save-as");
    };
    App.prototype.signIn = function () {
        ReactGA.event({ category: 'user', action: 'Sign In', label: this.props.gist });
        location.href = '/auth/github';
    };
    App.prototype.componentDidUpdate = function () {
        window.onkeydown = this.handleWindowKeyDown.bind(this);
    };
    App.prototype.showPopup = function (e, el) {
        if (el === this.lastPopup)
            return;
        ReactGA.event({ category: 'app', action: 'Show Popup', label: el.id });
        e.stopPropagation();
        this.lastPopup = el;
        el.style.display = "block";
    };
    App.prototype.handleBodyClick = function (e) {
        if (this.lastPopup != null) {
            this.lastPopup.style.display = "none";
            this.lastPopup = null;
        }
    };
    App.prototype.handleWindowKeyDown = function (e) {
        var target = e.target;
        if (target.tagName === "TEXTAREA" || target.tagName === "INPUT")
            return;
        if (e.ctrlKey) {
            if (e.keyCode === 37 || e.keyCode === 39) {
                if (!this.props.files || this.props.files.length === 0)
                    return;
                e.stopPropagation();
                var keys = utils_1.getSortedFileNames(this.props.files);
                var activeIndex = Math.max(0, keys.indexOf(this.props.activeFileName));
                var nextFileIndex = activeIndex + (e.keyCode === 37 ? -1 : 1);
                nextFileIndex = nextFileIndex < 0
                    ? keys.length - 1
                    : nextFileIndex % keys.length;
                this.props.selectFileName(keys[nextFileIndex]);
            }
            else if (e.keyCode == 13) {
                this.onShortcut("Ctrl-Enter");
            }
            else if (e.key && ["s"].indexOf(e.key) >= 0) {
                e.preventDefault();
                this.onShortcut("Ctrl-" + e.key.toUpperCase());
            }
        }
        else if (e.altKey && ["s", "c"].indexOf(e.key) >= 0) {
            e.preventDefault();
            this.onShortcut("Alt-" + e.key.toUpperCase());
        }
        if (e.key === "?") {
            this.props.showDialog("shortcuts");
        }
        else if (e.keyCode == 27) {
            this.onShortcut("Esc");
        }
    };
    App.prototype.onShortcut = function (pattern) {
        switch (pattern) {
            case "Esc":
                this.props.showDialog(null);
                break;
            case "Ctrl-Enter":
                var scriptRunning = ScriptStatusRunning.indexOf(this.props.scriptStatus) >= 0;
                if (!scriptRunning)
                    this.run();
                else
                    this.cancel();
                break;
            case "Ctrl-S":
                this.save();
                break;
            case "Alt-S":
                capturedSnapshot = state_1.store.getState();
                this.props.showDialog("take-snapshot");
                break;
            case "Alt-C":
                capturedSnapshot = state_1.store.getState();
                this.props.showDialog("console-viewer");
                break;
        }
    };
    App.prototype.handleAddReference = function (baseUrl, fileName, content, requestDto, autorun) {
        var _this = this;
        var main = this.getMainFile();
        if (!main)
            return;
        if (main.content.indexOf("{BaseUrl}") >= 0) {
            var updated = main.content.replace("{BaseUrl}", baseUrl)
                .replace("{Domain}", servicestack_client_1.splitOnFirst(baseUrl.split("://")[1], "/")[0])
                .replace("RequestDto", requestDto);
            this.props.updateSource(utils_1.FileNames.GistMain, updated);
        }
        var packagesConfig = this.getFileContents(utils_1.FileNames.GistPackages);
        if (packagesConfig) {
            this.props.updateSource(utils_1.FileNames.GistPackages, utils_1.addClientPackages(packagesConfig));
        }
        this.props.addFile(fileName, content);
        if (autorun) {
            this.props.selectFileName(utils_1.FileNames.GistMain); // Show what's running
            setTimeout(function () { return _this.run(); }, 0);
        }
        this.props.showDialog(null);
    };
    App.prototype.getAuthUsername = function () {
        var activeSub = this.props.activeSub;
        return activeSub && parseInt(activeSub.userId) > 0 ? activeSub.displayName : null;
    };
    App.prototype.shouldFork = function () {
        var authUsername = this.getAuthUsername();
        var meta = this.props.meta;
        return authUsername != null
            && meta != null
            && meta.public
            && authUsername != meta.owner_login
            && utils_1.GistTemplates.Gists.indexOf(this.props.gist) === -1;
    };
    App.prototype.render = function () {
        var _this = this;
        var MorePopup = [];
        var EditorPopup = [];
        var activeSub = this.props.activeSub;
        var authUsername = this.getAuthUsername();
        var meta = this.props.meta;
        var shouldFork = this.shouldFork();
        var files = this.props.files;
        var description = meta != null ? meta.description : null;
        var main = this.getMainFile();
        var collection = this.props.collection;
        var isGistCollection = this.getFile(utils_1.FileNames.CollectionIndex) != null;
        var isScript = main != null;
        var isScriptRunning = ScriptStatusRunning.indexOf(this.props.scriptStatus) >= 0;
        var isGistOwner = authUsername && meta && meta.owner_login === authUsername;
        var isCollectionOwner = authUsername && collection && collection.owner_login === authUsername;
        var Preview = [];
        var showCollection = this.props.showCollection && collection && collection.html != null;
        if (showCollection) {
            Preview.push(React.createElement(Collections_1.default, { collection: collection, isOwner: isCollectionOwner, gistStats: this.props.gistStats, excludeGists: utils_1.GistTemplates.Gists, showLiveLists: collection.id === utils_1.GistTemplates.HomeCollection, authUsername: authUsername, onHome: function (e) { return _this.props.urlChanged(utils_1.GistTemplates.HomeCollection); }, changeGist: function (id, options) { return _this.props.changeGist(id, options); }, changeCollection: function (id, reload) { return _this.props.changeCollection(id, reload); }, viewSnapshot: function (id) { return _this.props.urlChanged(id); } }));
        }
        else if (this.props.showCollection) {
            Preview.push((React.createElement("div", { key: "collection", id: "collection", className: "section" },
                React.createElement("div", { id: "collection-header" }, "Collection"),
                React.createElement("div", { id: "collection-body" },
                    React.createElement("div", { id: "markdown" },
                        React.createElement("div", { style: { color: "#444", fontSize: 20, position: "absolute", top: "50%", margin: "-55px 0 0 0", textAlign: "center", width: "100%" } },
                            React.createElement("img", { src: __webpack_require__(15), style: { margin: "5px 10px 0 0" } }),
                            "loading..."))))));
        }
        else if (this.props.error != null) {
            var code = this.props.error.errorCode ? "(" + this.props.error.errorCode + ") " : "";
            Preview.push((React.createElement("div", { key: "errors", id: "errors", className: "section" },
                React.createElement("div", { style: { margin: "25px 25px 40px 25px", color: "#a94442" } },
                    code,
                    this.props.error.message),
                this.props.error.stackTrace != null
                    ? React.createElement("pre", { style: { color: "red", padding: "5px 30px" } }, this.props.error.stackTrace)
                    : null,
                React.createElement("span", { className: "lnk", style: { paddingLeft: 25 }, onClick: function (e) { return _this.props.urlChanged(utils_1.GistTemplates.HomeCollection); } }, "Home"))));
        }
        else if (isScriptRunning) {
            Preview.push((React.createElement("div", { key: "status", id: "status", className: "section" },
                React.createElement("div", { style: { margin: '40px', color: "#444", width: "215px" }, title: "executing..." },
                    React.createElement("img", { src: __webpack_require__(15), style: { float: "right", margin: "5px 0 0 0" } }),
                    React.createElement("i", { className: "material-icons", style: { position: "absolute" } }, "build"),
                    React.createElement("p", { style: { padding: "0 0 0 30px", fontSize: "22px" } }, "Executing Script"),
                    React.createElement("div", { id: "splash", style: { padding: "20px 0 0 0" } },
                        React.createElement("img", { src: __webpack_require__(165) }))))));
        }
        else if (this.props.variables.length > 0) {
            var vars = this.props.variables;
            var exprResult = this.props.expressionResult;
            var exprVar = exprResult != null && exprResult.variables.length > 0 ? exprResult.variables[0] : null;
            Preview.push((React.createElement("div", { key: "vars", id: "vars", className: "section", style: { display: "flex", flexFlow: "column", overflow: "hidden" } },
                React.createElement("table", { style: { width: "100%", flex: 1 } },
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", { className: "name" }, "name"),
                            React.createElement("th", { className: "value" }, "value"),
                            React.createElement("th", { className: "type" }, "type "))),
                    React.createElement("tbody", null,
                        vars.map(function (v) { return _this.getVariableRows(v); }),
                        React.createElement("tr", null,
                            React.createElement("td", { colSpan: 3 },
                                React.createElement("input", { id: "txtEval", type: "text", placeholder: "Evaluate Expression", value: this.props.expression, onChange: function (e) { return _this.props.setExpression(e.target.value); }, onKeyPress: function (e) { return e.which === 13 ? _this.evaluateExpression(_this.props.expression) : null; }, autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false }),
                                React.createElement("i", { id: "btnEval", className: "material-icons noselect", title: "run", onClick: function (e) { return _this.evaluateExpression(_this.props.expression); } }, "play_arrow"))))),
                React.createElement("div", { id: "evaluate", style: { overflow: "auto" } }, exprVar
                    ? (React.createElement("div", { id: "expression-result" },
                        React.createElement(json_viewer_1.JsonViewer, { json: exprVar.json })))
                    : null))));
        }
        else {
            Preview.push(React.createElement("div", { key: "placeholder", id: "placeholder" }));
        }
        if (this.props.logs.length > 0 && !this.props.showCollection) {
            Preview.push(React.createElement(Console_1.default, { key: "console", logs: this.props.logs, onClear: function () { return _this.props.clearConsole(); }, showDialog: this.props.showDialog }));
        }
        MorePopup.push((React.createElement("div", { key: 1, onClick: function (e) { return _this.props.urlChanged(utils_1.GistTemplates.HomeCollection); } }, "Home")));
        MorePopup.push((React.createElement("div", { key: 2, onClick: function (e) { return _this.props.changeGist(utils_1.GistTemplates.NewGist); } }, "New Gist")));
        MorePopup.push((React.createElement("div", { key: 3, onClick: function (e) { return _this.props.changeGist(utils_1.GistTemplates.NewPrivateGist); } }, "New Private Gist")));
        MorePopup.push((React.createElement("div", { key: 4, onClick: function (e) { return _this.props.changeGist(utils_1.GistTemplates.NewCollection); } }, "New Collection")));
        MorePopup.push((React.createElement("div", { key: 5, onClick: function (e) { return _this.props.showDialog("shortcuts"); } }, "Shortcuts")));
        MorePopup.push((React.createElement("div", { key: 6, onClick: function (e) { return _this.clearGistCache(); } }, "Clear Gist Caches")));
        MorePopup.push((React.createElement("div", { key: 7, onClick: function (e) { return window.open("https://github.com/ServiceStack/Gistlyn/issues"); } }, "Send Feedback")));
        EditorPopup.push((React.createElement("div", { key: 1 },
            React.createElement("a", { href: "https://gist.github.com/" + this.props.gist, target: "_blank" }, "View on Github"))));
        if (authUsername) {
            EditorPopup.push((React.createElement("div", { key: 2, onClick: function (e) { return _this.props.showDialog("edit-gist"); } }, "Edit Gist")));
        }
        EditorPopup.push((React.createElement("div", { key: 3, onClick: function (e) { return _this.props.showDialog("add-ss-ref"); } }, "Add ServiceStack Reference")));
        var toggleEdit = function () {
            var inputWasHidden = _this.txtUrl.style.display !== "inline-block";
            var showInput = !meta || !description || inputWasHidden;
            _this.txtUrl.style.display = showInput ? "inline-block" : "none";
            document.getElementById("desc-overlay").style.display = showInput ? "none" : "inline-block";
            if (inputWasHidden) {
                _this.txtUrl.focus();
                _this.txtUrl.select();
            }
        };
        var showGistInput = !meta || !description || (this.txtUrl && this.txtUrl == document.activeElement);
        var goHome = function () { return _this.props.urlChanged(utils_1.GistTemplates.HomeCollection); };
        return (React.createElement("div", { id: "body", onClick: function (e) { return _this.handleBodyClick(e); }, className: utils_1.UA.getClassList() },
            React.createElement("div", { className: "titlebar" },
                React.createElement("div", { className: "container" },
                    React.createElement("img", { id: "logo", src: __webpack_require__(167), alt: "ServiceStack logo", onClick: goHome, style: { cursor: "pointer" }, title: activeSub ? "Gistlyn v" + activeSub.GistlynVersion : '' }),
                    React.createElement("h3", { title: "Home", onClick: goHome, style: { cursor: "pointer" } }, "Gistlyn"),
                    " ",
                    React.createElement("sup", { style: { padding: "0 0 0 5px", fontSize: "12px", fontStyle: "italic" } }, "BETA"),
                    React.createElement("div", { id: "gist" },
                        meta
                            ? React.createElement("img", { src: meta.owner_avatar_url, title: meta.owner_login, style: { verticalAlign: "bottom", margin: "0 5px 2px 0" } })
                            : React.createElement("span", { className: "octicon octicon-logo-gist", style: { verticalAlign: "bottom", margin: "0 6px 6px 0" } }),
                        React.createElement("input", { ref: function (e) { return _this.txtUrl = e; }, type: "text", id: "txtUrl", placeholder: "gist hash or url", style: { display: showGistInput ? "inline-block" : "none" }, onBlur: toggleEdit, value: this.props.url, onFocus: function (e) { return e.target.select(); }, onChange: function (e) { return _this.props.urlChanged(e.target.value); }, autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false }),
                        React.createElement("div", { id: "desc-overlay", style: { display: showGistInput ? "none" : "inline-block" }, onClick: toggleEdit },
                            React.createElement("div", { className: "inner" },
                                React.createElement("h2", null, description),
                                meta && !meta.public
                                    ? (React.createElement("span", { style: { margin: "3px 0px 3px -40px", fontSize: 12, background: "#ffefc6", color: "#888", padding: "2px 4px", borderRadius: 3 }, title: "This gist is private" }, "secret"))
                                    : null,
                                React.createElement("i", { className: "material-icons" }, "close"))),
                        this.props.error
                            ? React.createElement("i", { className: "material-icons", style: { color: "#FF5252", fontSize: 26, position: "absolute", margin: "2px 0 0 7px", background: "#f1f1f1", borderRadius: 14 } }, "error")
                            : main != null
                                ? React.createElement("i", { className: "material-icons", style: { color: "#0f9", fontSize: "30px", position: "absolute", margin: "-2px 0 0 7px" } }, "check")
                                : null,
                        React.createElement("i", { id: "btnCollections", style: { visibility: meta ? "visible" : "hidden" }, title: "Collections", onClick: function (e) { return _this.props.changeCollection((collection && collection.id) || utils_1.GistTemplates.HomeCollection, !showCollection); }, className: "material-icons" + (showCollection ? " active" : "") }, "apps")),
                    !authUsername
                        ? (React.createElement("div", { key: "sign-in", id: "sign-in", style: { position: "absolute", right: 5, top: 4 } },
                            React.createElement("a", { href: "/auth/github", style: { color: "#fff", textDecoration: "none" } },
                                React.createElement("span", { style: { whiteSpace: "nowrap", fontSize: 14 } }, "Sign-in"),
                                React.createElement("span", { style: { verticalAlign: "sub", margin: "0 0 0 10px" }, className: "mega-octicon octicon-mark-github", title: "Sign in with GitHub" }))))
                        : ([
                            React.createElement("div", { key: "signed-in", id: "signed-in", style: { position: "absolute", right: 5, cursor: "pointer" }, onClick: function (e) { return _this.showPopup(e, _this.userPopup); } },
                                React.createElement("span", { style: { whiteSpace: "nowrap", fontSize: 14 } }, activeSub.displayName),
                                React.createElement("img", { src: activeSub.profileUrl, style: { verticalAlign: "middle", marginLeft: 5, borderRadius: "50%" } })),
                            React.createElement("div", { key: "popup-user", id: "popup-user", className: "popup", ref: function (e) { return _this.userPopup = e; } },
                                React.createElement("div", { onClick: function (e) { return location.href = "/auth/logout"; } }, "Sign out"))
                        ]))),
            React.createElement("div", { id: "content" },
                React.createElement("div", { id: "ide" },
                    React.createElement("div", { id: "editor-menu" },
                        React.createElement("i", { className: "material-icons noselect", onClick: function (e) { return _this.showPopup(e, _this.editorPopup); } }, "more_vert")),
                    React.createElement("div", { id: "popup-editor", className: "popup", ref: function (e) { return _this.editorPopup = e; } }, EditorPopup),
                    React.createElement(Editor_1.default, { ref: function (e) { return _this.editor = e; }, files: files, isOwner: isGistOwner, activeFileName: this.props.activeFileName, editingFileName: this.props.editingFileName, selectFileName: function (fileName) { return _this.props.selectFileName(fileName); }, editFileName: function (fileName) { return _this.props.editFileName(fileName); }, showPopup: function (e, filesPopup) { return _this.showPopup(e, filesPopup); }, showDialog: function (dialog) { return _this.props.showDialog(dialog); }, updateSource: function (fileName, src) { return _this.props.updateSource(fileName, src); }, onRenameFile: function (fileName, e) { return _this.handleRenameFile(fileName, e); }, onCreateFile: function (e) { return _this.handleCreateFile(e); }, onDeleteFile: function (fileName) { return _this.deleteFile(fileName); }, onShortcut: function (keyPattern) { return _this.onShortcut(keyPattern); } }),
                    React.createElement("div", { id: "preview" }, Preview))),
            React.createElement("div", { id: "footer-spacer" }),
            React.createElement("div", { id: "footer" },
                React.createElement("div", { id: "actions", style: { visibility: meta ? "visible" : "hidden" }, className: "noselect" },
                    React.createElement("div", { id: "revert", onClick: function (e) { return _this.revertGist(e.shiftKey, e.ctrlKey); } },
                        React.createElement("i", { className: "material-icons" }, "undo"),
                        React.createElement("p", null, "Revert Changes")),
                    meta && meta.owner_login == authUsername
                        ? (React.createElement("div", { id: "save", onClick: function (e) { return _this.saveGist(); }, className: this.props.dirty ? "" : "disabled" },
                            React.createElement("i", { className: "material-icons" }, "save"),
                            React.createElement("p", null, "Save Gist")))
                        : (React.createElement("div", { id: "saveas", onClick: function (e) { return authUsername ? _this.saveGistAs() : _this.signIn(); }, title: !authUsername ? "Sign-in to save gists" : "Save a copy in your Github gists" },
                            React.createElement("span", { className: "octicon octicon-repo-forked", style: { margin: "3px 3px 0 0" } }),
                            React.createElement("p", null, authUsername ? (shouldFork ? "Fork As" : "Save As") : "Sign-in to save"))),
                    meta && meta.owner_login === authUsername
                        ? (React.createElement("div", { id: "delete-file", onClick: function (e) { return confirm("Are you sure you want to delete gist '" + meta.description + "'?") ? _this.deleteGist(_this.props.gist) : null; } },
                            React.createElement("i", { className: "material-icons" }, "delete_forever"),
                            React.createElement("p", null, "Delete Gist")))
                        : null),
                authUsername ? (React.createElement("i", { id: "btnSnapshot", className: "lnk material-icons", title: "Take Snapshot", onClick: function (e) {
                        return (capturedSnapshot = state_1.store.getState()) && _this.props.showDialog("take-snapshot");
                    } }, "camera_alt")) : null,
                React.createElement("span", { id: "btnConsole", className: "lnk mega-octicon octicon-terminal", title: "Console Viewer", onClick: function (e) { return _this.props.showDialog("console-viewer"); } }),
                React.createElement("div", { id: "more-menu", style: { position: "absolute", right: 5, bottom: 5, color: "#fff", cursor: "pointer" } },
                    React.createElement("i", { className: "material-icons", onClick: function (e) { return _this.showPopup(e, _this.morePopup); } }, "more_vert")),
                React.createElement("div", { id: "popup-more", className: "popup", ref: function (e) { return _this.morePopup = e; }, style: { position: "absolute", bottom: 42, right: 0 } }, MorePopup)),
            React.createElement("div", { id: "run", className: "noselect" },
                main != null
                    ? (!isScriptRunning
                        ? React.createElement("i", { onClick: function (e) { return _this.run(); }, className: "material-icons", title: "run" }, "play_circle_outline")
                        : React.createElement("i", { onClick: function (e) { return _this.cancel(); }, className: "material-icons", title: "cancel script", style: { color: "#FF5252" } }, "cancel"))
                    : null,
                isGistCollection && isGistOwner && (this.props.gist != (collection && collection.id) || !showCollection)
                    ? (React.createElement("i", { onClick: function (e) { return _this.props.changeCollection(_this.props.gist, true); }, className: "material-icons owner", title: "View Collection" }, "chevron_right"))
                    : null,
                showCollection && isCollectionOwner && this.props.gist != collection.id
                    ? (React.createElement("i", { onClick: function (e) { return _this.props.changeGist(collection.id); }, className: "material-icons owner", title: "Edit Collection" }, "chevron_left"))
                    : null),
            meta && this.props.dialog === "save-as"
                ? React.createElement(SaveAsDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, description: description, isPublic: meta.public, shouldFork: shouldFork, onSave: function (opt) { return _this.saveGist(opt); }, onHide: function () { return _this.props.showDialog(null); } })
                : null,
            meta && this.props.dialog === "edit-gist"
                ? React.createElement(EditGistDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, description: description, onSave: function (opt) { return _this.saveGist(opt); }, onHide: function () { return _this.props.showDialog(null); } })
                : null,
            meta && this.props.dialog === "shortcuts"
                ? React.createElement(ShortcutsDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, onHide: function () { return _this.props.showDialog(null); } })
                : null,
            meta && this.props.dialog === "console-viewer"
                ? React.createElement(ConsoleViewerDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, onHide: function () { return _this.props.showDialog(null); }, logs: this.props.logs, onClear: function () { return _this.props.clearConsole() && _this.props.showDialog(null); } })
                : null,
            meta && this.props.dialog === "add-ss-ref"
                ? React.createElement(AddServiceStackReferenceDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, onHide: function () { return _this.props.showDialog(null); }, onAddReference: this.handleAddReference.bind(this), urlChanged: function (url) { return _this.props.urlChanged(url) && _this.props.showDialog(null); } })
                : null,
            capturedSnapshot && this.props.dialog === "take-snapshot"
                ? React.createElement(TakeSnapshotDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, description: "Snapshot " + servicestack_client_1.timeFmt12(), snapshot: Object.assign({}, capturedSnapshot, { activeSub: null }), onHide: function () { return _this.props.showDialog(null) && (capturedSnapshot = null); }, urlChanged: function (url) { return _this.props.urlChanged(url) && _this.props.showDialog(null); } })
                : null,
            meta && this.props.dialog === "img-upload"
                ? React.createElement(ImageUploadDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, onHide: function () { return _this.props.showDialog(null); }, id: this.props.gist, onChange: function (url) { return _this.editor.replaceSelection("![{selection}](" + url + ")\n"); } })
                : null,
            meta && this.props.dialog === "insert-link"
                ? React.createElement(InsertLinkDialog_1.default, { dialogRef: function (e) { return _this.dialog = e; }, onHide: function () { return _this.props.showDialog(null); }, linkLabel: this.editor ? this.editor.getSelection() : "", gistStats: this.props.gistStats, authUsername: authUsername, onChange: function (url, label) { return _this.props.showDialog(null) && _this.editor.replaceSelection("[" + label + "](" + url + ")"); } })
                : null,
            React.createElement("div", { id: "sig" },
                "made with ",
                React.createElement("span", null, String.fromCharCode(10084)),
                " by ",
                React.createElement("a", { target: "_blank", href: "https://servicestack.net", title: activeSub ? "ServiceStack v" + activeSub.ServiceStackVersion : '' }, "ServiceStack"))));
    };
    return App;
}(React.Component));
App = __decorate([
    utils_1.reduxify(function (state) { return ({
        url: state.url,
        gist: state.gist,
        hasLoaded: state.hasLoaded,
        activeSub: state.activeSub,
        meta: state.meta,
        files: state.files,
        activeFileName: state.activeFileName,
        editingFileName: state.editingFileName,
        logs: state.logs,
        variables: state.variables,
        inspectedVariables: state.inspectedVariables,
        expression: state.expression,
        expressionResult: state.expressionResult,
        error: state.error,
        scriptStatus: state.scriptStatus,
        dialog: state.dialog,
        dirty: state.dirty,
        gistStats: state.gistStats,
        collection: state.collection,
        showCollection: state.showCollection
    }); }, function (dispatch) { return ({
        reset: function () { return dispatch({ type: 'RESET' }); },
        urlChanged: function (url) { return dispatch({ type: 'URL_CHANGE', url: url }); },
        changeGist: function (gist, options) {
            if (options === void 0) { options = {}; }
            return dispatch({ type: 'GIST_CHANGE', gist: gist, options: options });
        },
        updateDescription: function (description) { return dispatch({ type: 'META_UPDATE', description: description }); },
        updateSource: function (fileName, content) { return dispatch({ type: 'SOURCE_CHANGE', fileName: fileName, content: content }); },
        addFile: function (fileName, content) { return dispatch({ type: 'FILE_ADD', fileName: fileName, file: { fileName: fileName, content: content } }); },
        selectFileName: function (activeFileName) { return dispatch({ type: 'FILE_SELECT', activeFileName: activeFileName }); },
        editFileName: function (fileName) { return dispatch({ type: 'FILENAME_EDIT', fileName: fileName }); },
        raiseError: function (error) { return dispatch({ type: 'ERROR_RAISE', error: error }); },
        clearError: function () { return dispatch({ type: 'ERROR_CLEAR' }); },
        clearConsole: function () { return dispatch({ type: 'CONSOLE_CLEAR' }); },
        logConsole: function (logs) { return dispatch({ type: 'CONSOLE_LOG', logs: logs }); },
        logConsoleError: function (status) { return dispatch({ type: 'CONSOLE_LOG', logs: [Object.assign({ msg: status.message, cls: "error" }, status)] }); },
        logConsoleMsgs: function (txtMessages) { return dispatch({ type: 'CONSOLE_LOG', logs: txtMessages.map(function (msg) { return ({ msg: msg }); }) }); },
        setScriptStatus: function (scriptStatus) { return dispatch({ type: 'SCRIPT_STATUS', scriptStatus: scriptStatus }); },
        inspectVariable: function (name, variables) { return dispatch({ type: 'VARS_INSPECT', name: name, variables: variables }); },
        setExpression: function (expression) { return dispatch({ type: 'EXPRESSION_SET', expression: expression }); },
        showDialog: function (dialog) { return dispatch({ type: 'DIALOG_SHOW', dialog: dialog }); },
        setDirty: function (dirty) { return dispatch({ type: 'DIRTY_SET', dirty: dirty }); },
        changeCollection: function (id, showCollection) { return dispatch({ type: 'COLLECTION_CHANGE', collection: { id: id }, showCollection: showCollection }); },
        removeGistStat: function (gist) { return dispatch({ type: "GISTSTAT_REMOVE", gist: gist }); }
    }); })
], App);
exports.App = App;
var qs = servicestack_client_1.queryString(location.href);
var activeFileName = qs["activeFileName"];
var stateJson = localStorage.getItem(utils_1.StateKey);
var state = null;
if (stateJson) {
    try {
        state = JSON.parse(stateJson);
        if (activeFileName) {
            state.activeFileName = activeFileName;
        }
        state_1.store.dispatch({ type: "LOAD", state: state });
        if (!qs["gist"] && state.gist != null && !(state.files || state.meta)) {
            state_1.store.dispatch({ type: "GIST_CHANGE", gist: state.gist, options: { activeFileName: activeFileName } });
        }
    }
    catch (e) {
        console.log("ERROR loading state:", e, stateJson);
        localStorage.removeItem(utils_1.StateKey);
    }
}
var qsSnapshot = qs["snapshot"];
if (qsSnapshot) {
    state_1.store.dispatch({ type: "URL_CHANGE", url: qsSnapshot });
}
var qsAddRef = qs["AddServiceStackReference"];
if (qsAddRef) {
    state_1.store.dispatch({ type: "GIST_CHANGE", gist: utils_1.GistTemplates.AddServiceStackReferenceGist });
    state_1.store.dispatch({ type: "DIALOG_SHOW", dialog: "add-ss-ref" });
}
else {
    var qsGist = qs["gist"] || utils_1.GistTemplates.NewGist;
    if (qsGist != (state && state.gist) || (state && !state.meta)) {
        state_1.store.dispatch({ type: "GIST_CHANGE", gist: qsGist, options: { activeFileName: activeFileName } });
    }
}
var qsCollection = qs["collection"];
if (qsCollection) {
    state_1.store.dispatch({
        type: "COLLECTION_CHANGE",
        collection: { id: qsCollection },
        showCollection: (state && state.showCollection) || qsCollection != (state && state.collection && state.collection.id)
    });
}
else if (!state) {
    state_1.store.dispatch({ type: "COLLECTION_CHANGE", collection: { id: utils_1.GistTemplates.HomeCollection }, showCollection: true });
}
var qsExpression = qs["expression"];
if (qsExpression) {
    state_1.store.dispatch({ type: "EXPRESSION_SET", expression: qsExpression });
}
var qsClear = qs["clear"];
if (qsClear === "state") {
    localStorage.removeItem(utils_1.StateKey);
}
else if (qsClear === "all") {
    localStorage.clear();
}
window.onpopstate = function (e) {
    if (!e.state)
        return;
    if (e.state.gist)
        state_1.store.dispatch({ type: "GIST_CHANGE", gist: e.state.gist });
    if (e.state.collection)
        state_1.store.dispatch({ type: "COLLECTION_CHANGE", collection: { id: e.state.collection }, showCollection: true });
};


/***/ }),

/***/ 148:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(3);
var JsonViewer = (function (_super) {
    __extends(JsonViewer, _super);
    function JsonViewer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    JsonViewer.prototype.render = function () {
        var value = this.props.value || (this.props.json && JSON.parse(this.props.json));
        return (React.createElement("div", { className: "jsonviewer" }, val(value)));
    };
    return JsonViewer;
}(React.Component));
exports.JsonViewer = JsonViewer;
var show = function (k) { return typeof k !== "string" || k.substr(0, 2) !== "__"; };
var keyFmt = function (t) { return t; };
var uniqueKeys = function (m) {
    var h = {};
    for (var i = 0, len = m.length; i < len; i++) {
        for (var k in m[i]) {
            if (show(k))
                h[k] = k;
        }
    }
    return h;
};
var valueFmt = function (k, v, vFmt) { return vFmt; };
var num = function (m) { return m; };
var date = function (s) { return new Date(parseFloat(/Date\(([^)]+)\)/.exec(s)[1])); };
var pad = function (d) { return d < 10 ? '0' + d : d; };
var dmft = function (d) { return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()); };
var str = function (m) { return m.substr(0, 6) === '/Date(' ? dmft(date(m)) : m; };
var obj = function (m) {
    return (React.createElement("dl", null, Object.keys(m).filter(show).map(function (k) { return ([React.createElement("dt", { className: "ib" }, keyFmt(k)), React.createElement("dd", null, valueFmt(k, m[k], val(m[k])))]); })));
};
var arr = function (m) {
    if (typeof m[0] == 'string' || typeof m[0] == 'number')
        return React.createElement("span", null, m.join(', '));
    var h = uniqueKeys(m);
    return (React.createElement("table", null,
        React.createElement("caption", null),
        React.createElement("thead", null,
            React.createElement("tr", null, Object.keys(h).map(function (k) { return (React.createElement("th", null,
                React.createElement("b", null),
                keyFmt(k))); }))),
        React.createElement("tbody", null, m.map(function (row) { return (React.createElement("tr", null, Object.keys(h).filter(show).map(function (k) { return React.createElement("td", null, valueFmt(k, row[k], val(row[k]))); }))); }))));
};
var val = function (m, valueFn) {
    if (valueFn === void 0) { valueFn = null; }
    if (valueFn)
        valueFmt = valueFn;
    if (m == null)
        return "";
    if (typeof m == "number")
        return num(m);
    if (typeof m == "string")
        return str(m);
    if (typeof m == "boolean")
        return m ? "true" : "false";
    return m.length ? arr(m) : obj(m);
};


/***/ }),

/***/ 149:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "@font-face {\r\n    font-family: 'Roboto';\r\n    font-style: normal;\r\n    font-weight: 400;\r\n    src: local('Roboto'), local('Roboto-Regular'), url(" + __webpack_require__(164) + ") format('woff2'), \r\n    url(" + __webpack_require__(163) + ") format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */\r\n}\r\n@font-face {\r\n  font-family: 'octicons';\r\n  src: url(" + __webpack_require__(162) + ") format('woff'),\r\n       url(" + __webpack_require__(161) + ") format('truetype');\r\n  font-weight: normal;\r\n  font-style: normal;\r\n}\r\n\r\nbody, html { /*iPad*/\r\n    position: fixed; \r\n    width: 100%;\r\n}\r\n\r\nbody {\r\n    font-family: 'Roboto', sans-serif;\r\n    overflow: hidden;\r\n}\r\n\r\nhtml, body, #app, #body {\r\n    height:100%;\r\n    margin:0;\r\n}\r\n\r\n#body {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: vertical;\r\n    -webkit-box-direction: normal;\r\n        -ms-flex-flow: column;\r\n            flex-flow: column;\r\n}\r\n\r\n.titlebar {\r\n    background: #0371BE;\r\n    color: #fff;\r\n    height: 32px;\r\n    padding: 5px;\r\n}\r\n.titlebar .container {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n}\r\n.titlebar img {\r\n    height: 26px;\r\n}\r\n.titlebar h3 {\r\n    line-height: 32px;\r\n    padding: 0 0 0 5px;\r\n    font-size: 22px;\r\n}\r\n#gist {\r\n    width:100%;\r\n    text-align: center;\r\n    margin: 0 0 0 -145px;\r\n    padding: 0 0 0 0;\r\n}\r\n#txtUrl {\r\n    width: 320px;\r\n    padding: 4px 8px;\r\n    border: none;\r\n    font-size: 14px;\r\n    line-height: 22px;\r\n    color: #f7f7f7;\r\n    background: #0488E4;\r\n    vertical-align: top;\r\n    margin: 0 1px 0 0;\r\n}\r\n#txtUrl::-webkit-input-placeholder {\r\n    color: #cef !important;\r\n}\r\n#txtUrl::-moz-placeholder {  /* Firefox 19+ */\r\n    color: #cef !important;  \r\n}\r\n #txtUrl:-ms-input-placeholder {  \r\n    color: #cef !important;  \r\n}\r\n\r\n#desc-overlay {\r\n    display: inline-block;\r\n    background: #0488E4;\r\n    padding: 2px 2px;\r\n    vertical-align: top;\r\n    border: solid 1px #0488E4;\r\n}\r\n#desc-overlay .inner {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    background: #0898EF;\r\n    border-radius: 10px;\r\n    cursor: text;\r\n    border: solid 1px #39f;\r\n}\r\n#desc-overlay .inner:hover {\r\n    color: #fff;\r\n    background: #099EF4;\r\n}\r\n#desc-overlay h2 {\r\n    padding: 0 4px;\r\n    line-height: 22px;\r\n    font-weight: normal;\r\n    font-size: 14px;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    min-width: 300px;\r\n    max-width: 400px;\r\n}\r\n#desc-overlay i {\r\n    cursor: pointer;\r\n    float: right;\r\n    margin: 5px;\r\n    font-size: 11px;\r\n}\r\n\r\n#content {\r\n    background: #fff;\r\n    height: 100%;\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: vertical;\r\n    -webkit-box-direction: normal;\r\n        -ms-flex-flow: column;\r\n            flex-flow: column;\r\n}\r\n\r\n#footer {\r\n    background: #0371BE;\r\n    min-height: 40px;\r\n    z-index: 10; /*for winforms over codemirror*/\r\n}\r\n\r\n#sig {\r\n    z-index: 10;\r\n    position: absolute;\r\n    left: 50%;\r\n    bottom: 2px;\r\n    font: 12px arial;\r\n    color: #ddd;\r\n    margin: 0 0 0 -65px;\r\n}\r\n#sig a, #sig span {\r\n    font-size: 13px;\r\n    color: #f7f7f7;\r\n    font-weight: bold;\r\n    text-decoration: none;\r\n}\r\n\r\n\r\n#ide {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    background: #008080;\r\n    height: 100%;\r\n}\r\n\r\n#ide #editor-menu {\r\n    position: absolute;\r\n    top: 46px;\r\n    left: 50%;\r\n    margin: 0 0 0 -23px;\r\n    color: #ffffff;\r\n    cursor: pointer;\r\n    z-index: 3;    \r\n}\r\n.safari #editor-menu {\r\n    overflow: hidden;\r\n}\r\n#popup-editor {\r\n    position: absolute;\r\n    top: 74px;\r\n    left: 50%;\r\n    margin-left: -197px;\r\n}\r\n.safari #popup-editor {\r\n    margin-left: -198px;\r\n}\r\n#popup-files {\r\n    top: 74px;\r\n}\r\n#popup-user {\r\n    position: absolute;\r\n    top: 42px;\r\n    right: 0;\r\n}\r\n\r\n.safari #ide #editor-menu {\r\n    top: 44px;\r\n}\r\n.ipad #ide #editor-menu {\r\n    top: 42px;\r\n}\r\n.safari #popup-files, .safari #popup-editor {\r\n    top: 72px;\r\n}\r\n.ipad #popup-files, .ipad #popup-editor {\r\n    top: 70px;\r\n}\r\n.safari #popup-user {\r\n    top: 40px;\r\n}\r\n\r\n#preview {\r\n    -webkit-box-flex: 1;\r\n        -ms-flex: 1;\r\n            flex: 1;\r\n    background: #F7F7F7;\r\n    border-left: 1px solid #ddd;\r\n    overflow: auto;\r\n}\r\n\r\n#actions {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    padding: 10px;\r\n    color: #f7f7f7;\r\n}\r\n#actions div {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    cursor: pointer;\r\n    margin: 0 30px 0 0;\r\n}\r\n#actions div:hover {\r\n    color: #ddd;\r\n}\r\n#actions p {\r\n    padding: 4px 0 0 5px;\r\n}\r\n\r\n#actions .disabled, #actions .disabled p, #actions .disabled span, #actions .disabled:hover span, #actions .disabled i, #actions .disabled:hover i\r\n {\r\n    color: #ccc;\r\n}\r\n\r\n#more {\r\n    position: absolute;\r\n    right: 5px;\r\n    bottom: 5px;\r\n    color: #fff;\r\n    cursor: pointer;\r\n}\r\n#more i:hover {\r\n    color: #ddd;\r\n}\r\n\r\n#footer .lnk {\r\n    position: absolute;\r\n    bottom: 7px;\r\n    font-size: 24px;\r\n    cursor: pointer;\r\n}\r\n#footer .lnk:hover {\r\n    color: #ddd;\r\n}\r\n#btnConsole {\r\n    color: #fff;\r\n    right: 45px;\r\n}\r\n#btnSnapshot {\r\n    color: #fff;\r\n    right: 90px;\r\n}\r\n\r\n#run {\r\n    z-index: 6; /* code-mirror */\r\n    position: absolute;\r\n    left: 50%;\r\n    top: 50%;\r\n    width: 64px;\r\n    margin: -60px 0 0 -25px;\r\n    cursor: pointer;\r\n}\r\n.safari #run {\r\n    overflow: hidden;\r\n}\r\n#run.disabled {\r\n    cursor: auto;\r\n}\r\n#run i {\r\n    font-size: 50px;\r\n    color: #01215A;\r\n}\r\n#run i:hover {\r\n    color: #0371BE;\r\n}\r\n#run.disabled i, #run.disabled i:hover {\r\n    color: #999;\r\n}\r\n\r\n.ipad #run i {\r\n    font-size: 40px;\r\n}\r\n.ipad #run {\r\n    margin: -45px 0 0 -20px;\r\n}\r\n\r\n#run i.owner {\r\n    color: #388E3C;\r\n}\r\n#run i.owner:hover {\r\n    color: #4CAF50;\r\n}\r\n\r\n.alert {\r\n    padding: 15px;\r\n    margin-bottom: 20px;\r\n    border: 1px solid transparent;\r\n    border-radius: 4px;\r\n}\r\n.alert-error {\r\n    color: #a94442;\r\n    background-color: #f2dede;\r\n    border-color: #ebccd1;\r\n}\r\n.alert-info {\r\n    color: #31708f;\r\n    background-color: #d9edf7;\r\n    border-color: #bce8f1;\r\n}\r\n.alert-success {\r\n    color: #3c763d;\r\n    background-color: #dff0d8;\r\n    border-color: #d6e9c6;\r\n}\r\n.console pre.error {\r\n    color: red;\r\n}\r\n.console pre.success {\r\n    color: #3c763d;\r\n}\r\n\r\n#preview {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: vertical;\r\n    -webkit-box-direction: normal;\r\n        -ms-flex-flow: column;\r\n            flex-flow: column;\r\n    overflow: hidden;\r\n}\r\n\r\n#status, #vars, #errors, #placeholder, #collection {\r\n    -webkit-box-flex: 1;\r\n        -ms-flex: 1;\r\n            flex: 1;\r\n    overflow: auto;\r\n}\r\n\r\n.ipad #console {\r\n    display: none;\r\n}\r\n\r\n#console {\r\n    height: 25%;\r\n    font: 14px/20px arial;\r\n    border-top: solid 1px #ddd;\r\n    border-bottom: solid 1px #ddd;\r\n    overflow: auto;\r\n    height: 25%;\r\n}\r\n\r\n#console .clear-btn {\r\n    position: absolute;\r\n    right: 1px;\r\n    margin: 4px;\r\n    font-size: 18px;\r\n    color: #aaa;\r\n    cursor: pointer;\r\n}\r\n#console .clear-btn:hover {\r\n    color: #444;\r\n}\r\n\r\n#vars thead, #vars thead tr, #collection thead, #collection thead tr {\r\n    background: #01215A;\r\n}\r\n#vars th, #collection th {\r\n    text-align: left;\r\n    color: #fff;\r\n    padding: 4px 12px;\r\n    line-height: 24px;\r\n}\r\n#vars td, #collection td {\r\n    padding: 4px 12px;\r\n    font-size: 14px;\r\n}\r\n#vars .octicon {\r\n    cursor: pointer;\r\n}\r\n#vars a {\r\n    cursor: pointer;\r\n}\r\n#vars a:hover {\r\n    text-decoration: underline;\r\n}\r\n#txtEval {\r\n    padding: 4px 8px;\r\n    width: 80%;\r\n    max-width: 500px;\r\n    margin: 10px 0 0 10px;\r\n    font-size: 16px;\r\n    border: solid 1px #A9A9A9;\r\n}\r\n#btnEval {\r\n    margin: 0 0 0 -3px;\r\n    font-size: 30px;\r\n    cursor: pointer;\r\n    vertical-align: bottom;\r\n}\r\n#btnEval:hover {\r\n    color: #0371BE;\r\n}\r\n\r\n/*jsonviewer*/\r\n#expression-result {\r\n    padding: 12px 0 12px 22px;\r\n}\r\n#expression-result table {\r\n    width: auto;\r\n}\r\n\r\n#expression-result, #expression-result TH {\r\n    color: #444;\r\n    font-size: 14px;\r\n} \r\n#expression-result THEAD, #expression-result THEAD TR {\r\n    background: #f1f1f1;    \r\n    border-bottom: solid 1px #ddd;\r\n}\r\n\r\n.jsonviewer .ib { display: inline-block; }\r\n.jsonviewer TABLE { border-collapse:collapse; border: solid 1px #ccc; clear: left; }\r\n.jsonviewer TH { text-align: left; padding: 4px 8px; text-shadow: #fff 1px 1px -1px; background: #f1f1f1; white-space:nowrap; font-weight: bold; }\r\n.jsonviewer TD { padding: 8px 8px 0 8px; vertical-align: top; line-height: 18px; }\r\n.jsonviewer DL { margin: 0; clear: left; }\r\n.jsonviewer DT { font-weight: bold; width: 160px; clear: left; float: left; display:block; white-space:nowrap; line-height: 26px; }\r\n.jsonviewer DD { display: block; float: left; line-height: 26px; max-width: 600px; }\r\n.jsonviewer DL DL DT { font-weight: bold; }\r\n.jsonviewer HR { display:none; }\r\n.jsonviewer TD DL HR { display:block; padding: 0; clear: left; border: none; }\r\n.jsonviewer TD DL { padding: 4px; margin: 0; height:100%; max-width: 700px; }\r\n.jsonviewer DL TD DL DT { padding: 2px; margin: 0 10px 0 0; font-weight: bold; width: 120px; overflow: hidden; clear: left; float: left; display:block; }\r\n.jsonviewer DL TD DL DD { margin: 0; padding: 2px; display: block; float: left; }\r\n.jsonviewer TBODY>TR:last-child>TD { padding: 8px; }\r\n.jsonviewer H3 { margin: 0 0 10px 0; }\r\n", ""]);

// exports


/***/ }),

/***/ 15:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/ajax-loader.gif";

/***/ }),

/***/ 150:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "/* lib/codemirror.css */\r\n\r\n/* BASICS */\r\n\r\n.CodeMirror {\r\n  /* Set height, width, borders, and global font properties here */\r\n  font-family: monospace;\r\n  height: 300px;\r\n  color: black;\r\n}\r\n\r\n/* PADDING */\r\n\r\n.CodeMirror-lines {\r\n  padding: 4px 0; /* Vertical padding around content */\r\n}\r\n.CodeMirror pre {\r\n  padding: 0 4px; /* Horizontal padding of content */\r\n}\r\n\r\n.CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {\r\n  background-color: white; /* The little square between H and V scrollbars */\r\n}\r\n\r\n/* GUTTER */\r\n\r\n.CodeMirror-gutters {\r\n  border-right: 1px solid #ddd;\r\n  background-color: #f7f7f7;\r\n  white-space: nowrap;\r\n}\r\n.CodeMirror-linenumbers {}\r\n.CodeMirror-linenumber {\r\n  padding: 0 3px 0 5px;\r\n  min-width: 20px;\r\n  text-align: right;\r\n  color: #999;\r\n  white-space: nowrap;\r\n}\r\n\r\n.CodeMirror-guttermarker { color: black; }\r\n.CodeMirror-guttermarker-subtle { color: #999; }\r\n\r\n/* CURSOR */\r\n\r\n.CodeMirror-cursor {\r\n  border-left: 1px solid black;\r\n  border-right: none;\r\n  width: 0;\r\n}\r\n/* Shown when moving in bi-directional text */\r\n.CodeMirror div.CodeMirror-secondarycursor {\r\n  border-left: 1px solid silver;\r\n}\r\n.cm-fat-cursor .CodeMirror-cursor {\r\n  width: auto;\r\n  border: 0 !important;\r\n  background: #7e7;\r\n}\r\n.cm-fat-cursor div.CodeMirror-cursors {\r\n  z-index: 1;\r\n}\r\n\r\n.cm-animate-fat-cursor {\r\n  width: auto;\r\n  border: 0;\r\n  -webkit-animation: blink 1.06s steps(1) infinite;\r\n  animation: blink 1.06s steps(1) infinite;\r\n  background-color: #7e7;\r\n}\r\n@-webkit-keyframes blink {\r\n  0% {}\r\n  50% { background-color: transparent; }\r\n  100% {}\r\n}\r\n@keyframes blink {\r\n  0% {}\r\n  50% { background-color: transparent; }\r\n  100% {}\r\n}\r\n\r\n/* Can style cursor different in overwrite (non-insert) mode */\r\n.CodeMirror-overwrite .CodeMirror-cursor {}\r\n\r\n.cm-tab { display: inline-block; text-decoration: inherit; }\r\n\r\n.CodeMirror-rulers {\r\n  position: absolute;\r\n  left: 0; right: 0; top: -50px; bottom: -20px;\r\n  overflow: hidden;\r\n}\r\n.CodeMirror-ruler {\r\n  border-left: 1px solid #ccc;\r\n  top: 0; bottom: 0;\r\n  position: absolute;\r\n}\r\n\r\n/* DEFAULT THEME */\r\n\r\n.cm-s-default .cm-header {color: blue;}\r\n.cm-s-default .cm-quote {color: #090;}\r\n.cm-negative {color: #d44;}\r\n.cm-positive {color: #292;}\r\n.cm-header, .cm-strong {font-weight: bold;}\r\n.cm-em {font-style: italic;}\r\n.cm-link {text-decoration: underline;}\r\n.cm-strikethrough {text-decoration: line-through;}\r\n\r\n.cm-s-default .cm-keyword {color: #708;}\r\n.cm-s-default .cm-atom {color: #219;}\r\n.cm-s-default .cm-number {color: #164;}\r\n.cm-s-default .cm-def {color: #00f;}\r\n.cm-s-default .cm-variable, .cm-s-default .cm-punctuation, .cm-s-default .cm-property, .cm-s-default .cm-operator {}\r\n.cm-s-default .cm-variable-2 {color: #05a;}\r\n.cm-s-default .cm-variable-3 {color: #085;}\r\n.cm-s-default .cm-comment {color: #a50;}\r\n.cm-s-default .cm-string {color: #a11;}\r\n.cm-s-default .cm-string-2 {color: #f50;}\r\n.cm-s-default .cm-meta {color: #555;}\r\n.cm-s-default .cm-qualifier {color: #555;}\r\n.cm-s-default .cm-builtin {color: #30a;}\r\n.cm-s-default .cm-bracket {color: #997;}\r\n.cm-s-default .cm-tag {color: #170;}\r\n.cm-s-default .cm-attribute {color: #00c;}\r\n.cm-s-default .cm-hr {color: #999;}\r\n.cm-s-default .cm-link {color: #00c;}\r\n\r\n.cm-s-default .cm-error {color: #f00;}\r\n.cm-invalidchar {color: #f00;}\r\n\r\n.CodeMirror-composing { border-bottom: 2px solid; }\r\n\r\n/* Default styles for common addons */\r\n\r\ndiv.CodeMirror span.CodeMirror-matchingbracket {color: #0f0;}\r\ndiv.CodeMirror span.CodeMirror-nonmatchingbracket {color: #f22;}\r\n.CodeMirror-matchingtag { background: rgba(255, 150, 0, .3); }\r\n.CodeMirror-activeline-background {background: #e8f2ff;}\r\n\r\n/* STOP */\r\n\r\n/* The rest of this file contains styles related to the mechanics of\r\n   the editor. You probably shouldn't touch them. */\r\n\r\n.CodeMirror {\r\n  position: relative;\r\n  overflow: hidden;\r\n  background: white;\r\n}\r\n\r\n.CodeMirror-scroll {\r\n  overflow: scroll !important; /* Things will break if this is overridden */\r\n  /* 30px is the magic margin used to hide the element's real scrollbars */\r\n  /* See overflow: hidden in .CodeMirror */\r\n  margin-bottom: -30px; margin-right: -30px;\r\n  padding-bottom: 30px;\r\n  height: 100%;\r\n  outline: none; /* Prevent dragging from highlighting the element */\r\n  position: relative;\r\n}\r\n.CodeMirror-sizer {\r\n  position: relative;\r\n  border-right: 30px solid transparent;\r\n}\r\n\r\n/* The fake, visible scrollbars. Used to force redraw during scrolling\r\n   before actual scrolling happens, thus preventing shaking and\r\n   flickering artifacts. */\r\n.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {\r\n  position: absolute;\r\n  z-index: 6;\r\n  display: none;\r\n}\r\n.CodeMirror-vscrollbar {\r\n  right: 0; top: 0;\r\n  overflow-x: hidden;\r\n  overflow-y: scroll;\r\n}\r\n.CodeMirror-hscrollbar {\r\n  bottom: 0; left: 0;\r\n  overflow-y: hidden;\r\n  overflow-x: scroll;\r\n}\r\n.CodeMirror-scrollbar-filler {\r\n  right: 0; bottom: 0;\r\n}\r\n.CodeMirror-gutter-filler {\r\n  left: 0; bottom: 0;\r\n}\r\n\r\n.CodeMirror-gutters {\r\n  position: absolute; left: 0; top: 0;\r\n  min-height: 100%;\r\n  z-index: 3;\r\n}\r\n.CodeMirror-gutter {\r\n  white-space: normal;\r\n  height: 100%;\r\n  display: inline-block;\r\n  vertical-align: top;\r\n  margin-bottom: -30px;\r\n  /* Hack to make IE7 behave */\r\n  *zoom:1;\r\n  *display:inline;\r\n}\r\n.CodeMirror-gutter-wrapper {\r\n  position: absolute;\r\n  z-index: 4;\r\n  background: none !important;\r\n  border: none !important;\r\n}\r\n.CodeMirror-gutter-background {\r\n  position: absolute;\r\n  top: 0; bottom: 0;\r\n  z-index: 4;\r\n}\r\n.CodeMirror-gutter-elt {\r\n  position: absolute;\r\n  cursor: default;\r\n  z-index: 4;\r\n}\r\n.CodeMirror-gutter-wrapper {\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n      user-select: none;\r\n}\r\n\r\n.CodeMirror-lines {\r\n  cursor: text;\r\n  min-height: 1px; /* prevents collapsing before first draw */\r\n}\r\n.CodeMirror pre {\r\n  /* Reset some styles that the rest of the page might have set */ border-radius: 0;\r\n  border-width: 0;\r\n  background: transparent;\r\n  font-family: inherit;\r\n  font-size: inherit;\r\n  margin: 0;\r\n  white-space: pre;\r\n  word-wrap: normal;\r\n  line-height: inherit;\r\n  color: inherit;\r\n  z-index: 2;\r\n  position: relative;\r\n  overflow: visible;\r\n  -webkit-tap-highlight-color: transparent;\r\n  -webkit-font-variant-ligatures: none;\r\n  font-variant-ligatures: none;\r\n}\r\n.CodeMirror-wrap pre {\r\n  word-wrap: break-word;\r\n  white-space: pre-wrap;\r\n  word-break: normal;\r\n}\r\n\r\n.CodeMirror-linebackground {\r\n  position: absolute;\r\n  left: 0; right: 0; top: 0; bottom: 0;\r\n  z-index: 0;\r\n}\r\n\r\n.CodeMirror-linewidget {\r\n  position: relative;\r\n  z-index: 2;\r\n  overflow: auto;\r\n}\r\n\r\n.CodeMirror-widget {}\r\n\r\n.CodeMirror-code {\r\n  outline: none;\r\n}\r\n\r\n/* Force content-box sizing for the elements where we expect it */\r\n.CodeMirror-scroll, .CodeMirror-sizer, .CodeMirror-gutter, .CodeMirror-gutters, .CodeMirror-linenumber {\r\n  box-sizing: content-box;\r\n}\r\n\r\n.CodeMirror-measure {\r\n  position: absolute;\r\n  width: 100%;\r\n  height: 0;\r\n  overflow: hidden;\r\n  visibility: hidden;\r\n}\r\n\r\n.CodeMirror-cursor {\r\n  position: absolute;\r\n  pointer-events: none;\r\n}\r\n.CodeMirror-measure pre { position: static; }\r\n\r\ndiv.CodeMirror-cursors {\r\n  visibility: hidden;\r\n  position: relative;\r\n  z-index: 3;\r\n}\r\ndiv.CodeMirror-dragcursors {\r\n  visibility: visible;\r\n}\r\n\r\n.CodeMirror-focused div.CodeMirror-cursors {\r\n  visibility: visible;\r\n}\r\n\r\n.CodeMirror-selected { background: #d9d9d9; }\r\n.CodeMirror-focused .CodeMirror-selected { background: #d7d4f0; }\r\n.CodeMirror-crosshair { cursor: crosshair; }\r\n.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }\r\n.CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: #d7d4f0; }\r\n.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }\r\n\r\n.cm-searching {\r\n  background: #ffa;\r\n  background: rgba(255, 255, 0, .4);\r\n}\r\n\r\n/* IE7 hack to prevent it from returning funny offsetTops on the spans */\r\n.CodeMirror span { *vertical-align: text-bottom; }\r\n\r\n/* Used to force a border model for a node */\r\n.cm-force-border { padding-right: .1px; }\r\n\r\n@media print {\r\n  /* Hide the cursor when printing */\r\n  .CodeMirror div.CodeMirror-cursors {\r\n    visibility: hidden;\r\n  }\r\n}\r\n\r\n/* See issue #2901 */\r\n.cm-tab-wrap-hack:after { content: ''; }\r\n\r\n/* Help users use markselection to safely style text background */\r\nspan.CodeMirror-selectedtext { background: none; }\r\n\r\n\r\n\r\n/*********************************\r\n  ReactCodeMirror + Custom css \r\n**********************************/\r\n\r\n.ReactCodeMirror {\r\n    -webkit-box-flex: 1;\r\n        -ms-flex: 1;\r\n            flex: 1;\r\n    overflow: auto;\r\n}\r\n.macintel .ReactCodeMirror {\r\n    margin-left: -3px; \r\n}\r\n\r\n.CodeMirror {\r\n    margin: 0;\r\n    padding: 0;\r\n    font-family: monospace;\r\n    font-size: 10pt;\r\n    line-height: 1.4;\r\n    color: black;\r\n    height: 100%;\r\n}\r\n.ipad .CodeMirror {\r\n    font-size: 8pt;\r\n}\r\n\r\n.cm-s-default span.cm-punctuation { color: green; }\r\n.cm-s-default span.cm-operator { color: purple; }\r\n.cm-s-default span.cm-keyword { color: blue; }\r\n.cm-s-default span.cm-atom { color: brown; }\r\n.cm-s-default span.cm-def { color: #0000FF; }\r\n.cm-s-default span.variable { color: black; }\r\n.cm-s-default span.variable-2, .cm-s-default span.variable-3 { color: #004499; }\r\n.cm-s-default span.cm-property { color: black; }\r\n.cm-s-default span.cm-comment { color: green; }\r\n.cm-s-default span.cm-string span.cm-string-2 { color: red; }\r\n.cm-s-default.CodeMirror-focused div.CodeMirror-selected { background: #ADD6FF; }\r\n.cm-s-default .CodeMirror-line::-moz-selection, .cm-s-default .CodeMirror-line > span::-moz-selection, .cm-s-default .CodeMirror-line > span > span::-moz-selection {\r\n     background: rgba(255, 255, 255, 0.10);\r\n}\r\n.cm-s-default .CodeMirror-line::selection, .cm-s-default .CodeMirror-line > span::selection, .cm-s-default .CodeMirror-line > span > span::selection {\r\n     background: rgba(255, 255, 255, 0.10);\r\n}\r\n\r\ndiv.CodeMirror span.CodeMirror-matchingbracket {\r\n    background: #E6F0E6;\r\n    color: black;\r\n}\r\n\r\n.CodeMirror-fullscreen {\r\n  position: fixed;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  height: auto;\r\n  z-index: 9;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 151:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "#btnCollections {\r\n    position: absolute;\r\n    top: 0;\r\n    margin: 0px 0 0 45px;\r\n    padding: 5px 5px 0 5px;\r\n    color: #6ab5e8;\r\n    font-size: 30px;\r\n    height: 37px;\r\n    cursor: pointer;\r\n}\r\n#btnCollections:hover {\r\n    color: #cef;\r\n}\r\n#btnCollections.active {\r\n    color: #f7f7f7;\r\n    background: #01215A;\r\n}\r\n\r\n\r\n#collection {\r\n    background: #fff;\r\n}\r\n\r\n#collection-header {\r\n    background: #01215A;\r\n    text-align: left;\r\n    color: #fff;\r\n    padding: 4px 12px;\r\n    line-height: 24px;\r\n}\r\n.owner #collection-header {\r\n    background: #4CAF50;\r\n}\r\n#btnHome {\r\n    color: #fff;\r\n    font-size: 17px;\r\n    vertical-align: middle;\r\n    margin: -2px 6px 0 -5px;\r\n    cursor: pointer;\r\n}\r\n\r\n#collection-body {\r\n    overflow-y: auto;\r\n    overflow-x: hidden; \r\n    width: 50%;\r\n    position: absolute;\r\n    top: 74px;\r\n    bottom: 41px;\r\n}\r\n\r\n#livelist {\r\n    font-size: 14px;\r\n    line-height: 22px;\r\n    background: #f7f7f7;\r\n    box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.3);\r\n}\r\n#livelist h3 {\r\n    font-size: 14px;\r\n    line-height: 24px;\r\n    background: #0371BE;\r\n    color: #f7f7f7;\r\n    padding: 2px 8px;\r\n}\r\n#livelist a {\r\n    padding: 2px 8px;\r\n    display: block;\r\n    text-decoration: none;\r\n    color: #444;\r\n    width: 200px;\r\n    overflow: hidden;\r\n    white-space: nowrap;\r\n    text-overflow: ellipsis;\r\n}\r\n#livelist a:hover {\r\n    text-decoration: underline;\r\n}\r\n.ipad #livelist {\r\n    display: none;\r\n}\r\n\r\n#markdown {\r\n    line-height: 1.5;\r\n    font-size: 16px;\r\n    color: #444;\r\n    padding: 0 0 0 30px;\r\n    max-width: 750px;\r\n}\r\n.ipad #markdown {\r\n    font-size: 90%;\r\n}\r\n#markdown h1, #markdown h2, #markdown h3, #markdown h4, #markdown h5, #markdown h6 {\r\n    margin-top: 24px;\r\n    margin-bottom: 16px;\r\n    font-weight: 600;\r\n    line-height: 1.25;\r\n}\r\n.ipad #markdown h1, .ipad #markdown h2, .ipad #markdown h3, .ipad #markdown h4, .ipad #markdown h5, .ipad #markdown h6 {\r\n    margin-top: 18px;\r\n    margin-bottom: 12px;\r\n}\r\n.ipad #markdown img {\r\n    max-width: 450px;\r\n}\r\n\r\n#markdown h1, #markdown h2 {\r\n    padding-bottom: 0.3em;\r\n    font-size: 1.5em;\r\n    border-bottom: 1px solid #eee;\r\n}\r\n#markdown h3 { font-size: 1.25em; }\r\n#markdown h4 { font-size: 1em; }\r\n#markdown h5 { font-size: 0.875em; }\r\n#markdown h6 { font-size: 0.85em; color: #777; }\r\n#markdown p {\r\n    margin: 0 0 16px 0; \r\n}\r\n#markdown strong, #markdown b {\r\n    font-weight: bold; \r\n}\r\n#markdown em {\r\n    font-style: italic;\r\n}\r\n#markdown ul, #markdown ol {\r\n    padding-left: 2em;\r\n    margin: 0 0 16px 0; \r\n}\r\n#markdown li>ul, #markdown li>ol {\r\n    margin: 0; \r\n}\r\n#markdown li+li {\r\n    margin-top: 0.25em;\r\n}\r\n#markdown ul ul, #markdown ol ul {\r\n    list-style-type: circle;\r\n}\r\n#markdown ul {\r\n    list-style-type: disc;\r\n}\r\n#markdown ol {\r\n    list-style-type: decimal;\r\n}\r\n#markdown li > a {\r\n    white-space: nowrap;\r\n}\r\n#markdown a {\r\n    color: #428bca;\r\n    text-decoration: none;\r\n}\r\n#markdown a:hover {\r\n    color: #2a6496;\r\n}\r\n#markdown pre {\r\n    padding: 16px;\r\n    overflow: auto;\r\n    font-size: 85%;\r\n    line-height: 1.45;\r\n    background-color: #f7f7f7;\r\n    border-radius: 3px;\r\n    margin-bottom: 16px;\r\n    color: #333;\r\n}\r\n#markdown code {\r\n    font-family: Consolas, \"Liberation Mono\", Menlo, Courier, monospace;\r\n    background-color: #f7f7f7;\r\n    font-size: 13px;\r\n    padding: 0 2px;\r\n}\r\n#markdown pre>code {\r\n    padding: 0;\r\n}\r\n#markdown code::before, #markdown code::after {\r\n    letter-spacing: -0.2em;\r\n    content: \"\\A0\";\r\n}\r\n#markdown pre>code::before, #markdown pre>code::after {\r\n    letter-spacing: 0;\r\n    content: \"\";\r\n}\r\n#markdown blockquote {\r\n    padding: 0 1em;\r\n    color: #777;\r\n    border-left: 0.25em solid #ddd;\r\n}\r\n#markdown hr {\r\n    border: none;\r\n    border-bottom: 1px solid #eee;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 152:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "#dialog {\r\n    position: absolute;\r\n    height: 100%;\r\n    width: 100%;\r\n    background: rgba(0,0,0,.3);\r\n    z-index: 10;\r\n    top: 0;\r\n    text-align: center;\r\n}\r\n.dialog {\r\n    position: relative;\r\n    top: 50%;\r\n    -webkit-transform: translateY(-50%);\r\n    transform: translateY(-50%);\r\n    text-align: left;\r\n    display: inline-block;\r\n    background: #fff;\r\n    box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);\r\n    background-clip: padding-box;\r\n\r\n    /* vertical align */\r\n    -webkit-transform-style: preserve-3d;\r\n    transform-style: preserve-3d;\r\n}\r\n.dialog-header {\r\n    font-size: 18px;\r\n    background: #0371BE;\r\n    color: #fff;\r\n    padding: 12px;\r\n}\r\n.dialog-body {\r\n    padding: 24px;\r\n    min-height: 100px;\r\n    color: #444;\r\n}\r\n.dialog-footer {\r\n    text-align: right;\r\n    padding: 12px;\r\n}\r\n.dialog-header .close {\r\n    float: right;\r\n    font-size: 16px;\r\n    cursor: pointer;\r\n}\r\n.dialog-header .close:hover {\r\n    color: #ddd;\r\n}\r\n.dialog-body .row {\r\n    margin: 0 0 10px 0;\r\n}\r\n.dialog-body label {\r\n    display: inline-block;\r\n    padding: 0 20px 0 0;\r\n    width: 100px;\r\n}\r\n.dialog-body input[type=text] {\r\n    width: 350px;    \r\n    padding: 8px 12px;\r\n    font-size: 16px;\r\n    border: solid 1px #A9A9A9;\r\n}\r\n.dialog .loading {\r\n    visibility: hidden;\r\n}\r\n.dialog.disabled .loading {\r\n    visibility: visible;\r\n}\r\n.dialog .info-help {\r\n    cursor: pointer;\r\n    color: #2a6496;\r\n    margin: -12px -12px 0 0;\r\n}\r\n\r\n.btn, .btn:focus {\r\n    text-transform: uppercase;\r\n    border-radius: 2px;\r\n    background: #0488E4;\r\n    transition: box-shadow .28s cubic-bezier(.4,0,.2,1);\r\n    outline: none !important;\r\n    border: none;\r\n    color: rgba(255,255,255,.84);\r\n    display: inline-block;\r\n    text-align: center;\r\n    vertical-align: middle;\r\n    cursor: pointer;\r\n    border: 1px solid transparent;\r\n    white-space: nowrap;\r\n    padding: 8px 12px;\r\n    font-size: 16px;\r\n    line-height: 1.42857143;\r\n    -webkit-user-select: none;\r\n    -moz-user-select: none;\r\n    -ms-user-select: none;\r\n    user-select: none\r\n}\r\n.btn:hover {\r\n    background: #03a9f4;\r\n    box-shadow: 0 2px 6px rgba(0,0,0,0.26);\r\n    color: #fff;\r\n}\r\n.disabled .btn, .btn.disabled, .btn[disabled], fieldset[disabled] .btn {\r\n    cursor: not-allowed;\r\n    pointer-events: none;\r\n    opacity: .65;\r\n    filter: alpha(opacity=65);\r\n    box-shadow: none;\r\n}\r\n\r\n#dialog.dark {\r\n    background: none;\r\n}\r\n#dialog.dark .dialog {\r\n    background: rgba(0,0,0,.85);\r\n    border-radius: 20px;\r\n}\r\n#dialog.dark .dialog-header {\r\n    background: none;\r\n    margin: 0 0 0 10px;\r\n    font-weight: bold;\r\n}\r\n#dialog.dark .dialog-body {\r\n    color: #fff;\r\n    min-width: 400px;\r\n    line-height: 20px;\r\n}\r\n#dialog.dark .dialog-body>table {\r\n    margin: 0 0 20px 10px;\r\n}\r\n#dialog.dark .dialog-body h4 {\r\n    padding: 15px 0 5px 0;\r\n    color: #dd0;\r\n    font-weight: bold;\r\n}\r\n#dialog.dark .dialog-body th {\r\n    text-align: right;\r\n}\r\n#dialog.dark .dialog-body th b {\r\n    font-family: \"Courier New\";\r\n    font-size: 13px;\r\n    color: #dd0;\r\n    font-weight: bold;\r\n}\r\n#dialog.dark .dialog-body th i {\r\n    font-family: arial;\r\n    font-style: normal;\r\n    font-weight: bold;\r\n    padding: 0 10px 0 3px;\r\n}\r\n\r\n#dialog a, #dialog .lnk, .lnk {\r\n    color: #428bca;\r\n    text-decoration: none;\r\n    cursor: pointer;\r\n}\r\n#dialog a:hover, #dialog .lnk:hover, .lnk:hover {\r\n    color: #2a6496;\r\n}\r\n\r\n#dialog.console-viewer.dark .dialog-body td {\r\n    font: 13px/18px monospace;\r\n    color: #00FF00;\r\n}\r\n#dialog.console-viewer .dialog-header span, #dialog.console-viewer .dialog-footer span {\r\n    float: right;\r\n    color: #dd0;\r\n    font-size: 16px;\r\n    cursor: pointer;\r\n    padding-left: 10px;\r\n    font-weight: normal;\r\n}\r\n\r\n.linktabs {\r\n    text-align: center;\r\n}\r\n.linktabs div {\r\n    display: inline-block;\r\n    cursor: pointer;\r\n    border-bottom: 2px solid #fff;\r\n    margin: 0 10px 20px 0;\r\n    padding: 2px 5px;\r\n}\r\n.linktabs div.active {\r\n    border-bottom: 2px solid #444;\r\n}\r\n.radiotabs div {\r\n    cursor: pointer;\r\n    display: inline-block;\r\n    margin: 0 10px 0 0;\r\n}\r\n.radiotabs i {\r\n    vertical-align: bottom;\r\n    margin-right: 5px;\r\n    font-size: 20px;\r\n}\r\n.gist-links-body {\r\n    max-height: 400px;\r\n    overflow: auto;\r\n}\r\n#insert-link-dialog dt {\r\n    font-weight: bold;\r\n    margin: 10px 0;\r\n}\r\n#insert-link-dialog dd {\r\n    font-size: 14px;\r\n    cursor: pointer;\r\n    color: #428bca;\r\n    line-height: 20px;\r\n    padding: 0 0 0 10px;\r\n}\r\n#insert-link-dialog dd:hover {\r\n    color: #2a6496;\r\n}\r\n.insert-link-new {\r\n    margin: 20px 0px 10px 0px;\r\n}\r\n#nosse-dialog a {\r\n    color: #428bca;\r\n    text-decoration: none;\r\n    padding: 0 6px;\r\n}\r\n#nosse-dialog a:hover {\r\n    color: #2a6496;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 153:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "\r\n#editor {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: vertical;\r\n    -webkit-box-direction: normal;\r\n        -ms-flex-flow: column;\r\n            flex-flow: column;\r\n    -webkit-box-flex: 1;\r\n        -ms-flex: 1;\r\n            flex: 1;\r\n    overflow: auto;\r\n    color: #000;\r\n    background: url(" + __webpack_require__(166) + "); /* needed in CEF */\r\n}\r\n.safari #editor {\r\n    overflow: hidden; /* hide double scrollbars with Safari height fix*/\r\n}\r\n\r\n#tabs {\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: horizontal;\r\n    -webkit-box-direction: normal;\r\n        -ms-flex-flow: row;\r\n            flex-flow: row;\r\n    background: #01215A;\r\n    padding: 8px 0 0 6px;\r\n    min-height: 24px;\r\n}\r\n#tabs #files-menu {\r\n    color: #ddd;\r\n    cursor: pointer;\r\n    width: 24px;\r\n}\r\n#tabs #files-menu:hover {\r\n    color: #ffc;\r\n}\r\n#tabs .delete {\r\n    font-size: 16px;\r\n    vertical-align: bottom;\r\n    padding: 0 0 0 5px;\r\n    cursor: pointer;\r\n}\r\n#tabs .delete:hover {\r\n    color: #f00;\r\n}\r\n.popup {\r\n    display: none;\r\n    position: absolute;\r\n    z-index: 100;\r\n    background: #0371BE;\r\n    color: #f7f7f7;\r\n    margin: 2px 2px;\r\n    font-size: 14px;\r\n    box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);\r\n    background-clip: padding-box;\r\n}\r\n.popup div {\r\n    padding: 8px 10px;\r\n}\r\n.popup div:hover {\r\n    background: #0488E4;\r\n    cursor: pointer;\r\n}\r\n.popup a {\r\n    display: block;\r\n    color: #f7f7f7;\r\n    text-decoration: none;\r\n}\r\n#tabs div {\r\n    padding: 5px 8px;\r\n    margin: 0 4px 0 0;\r\n    background: #0371BE;\r\n    color: #fff;\r\n    font-size: 14px;\r\n    cursor: pointer;\r\n}\r\n#tabs div.active {\r\n    background: #fff;\r\n    color: #444;\r\n    margin-bottom: -1px;\r\n    cursor: auto;\r\n}\r\n#tabs .txtFileName {\r\n    border: none;\r\n    padding: 0 2px;\r\n}\r\n\r\n#markdown-toolbar {\r\n    margin: 0 0 2px 30px;\r\n    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);\r\n    z-index: 1;\r\n}\r\n\r\n#markdown-toolbar i {\r\n    margin: 2px;\r\n    vertical-align: middle;\r\n    color: #666;\r\n    cursor: pointer;\r\n    border: solid 1px #fff;\r\n    font-size: 30px;\r\n}\r\n#markdown-toolbar i:hover {\r\n    border: solid 1px #c6c6c6;\r\n    border-radius: 2px;\r\n    background: #f8f8f8;\r\n}\r\n\r\n.owner #tabs {\r\n    background: #4CAF50;\r\n}\r\n.owner #tabs div {\r\n    background: #388E3C;\r\n}\r\n.owner #tabs div.active {\r\n    background: #fff;\r\n}\r\n\r\n.dropzone {\r\n}\r\n.dropzone .droparea {\r\n    background: #f1f1f1;\r\n    border: 4px dashed #ccc;\r\n    text-align: center;\r\n    height: 250px;\r\n    color: #aaa;\r\n    cursor: pointer;\r\n}\r\n.dropzone-active .droparea {\r\n    background: #ddd;\r\n    border-color: #aaa;\r\n}\r\n.loading .dropzone .droparea {\r\n    color: #ccc;\r\n}\r\n.dropzone .droparea p {\r\n    font-size: 24px;\r\n    margin: 110px 0 0 0;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 154:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "@font-face {\r\n  font-family: 'Material Icons';\r\n  font-style: normal;\r\n  font-weight: 400;\r\n  src: url(" + __webpack_require__(157) + "); /* For IE6-8 */\r\n  src: local('Material Icons'),\r\n       local('MaterialIcons-Regular'),\r\n       url(" + __webpack_require__(160) + ") format('woff2'),\r\n       url(" + __webpack_require__(159) + ") format('woff'),\r\n       url(" + __webpack_require__(158) + ") format('truetype');\r\n}\r\n\r\n.material-icons {\r\n  font-family: 'Material Icons';\r\n  font-weight: normal;\r\n  font-style: normal;\r\n  font-size: 24px;  /* Preferred icon size */\r\n  display: inline-block;\r\n  width: 1em;\r\n  height: 1em;\r\n  line-height: 1;\r\n  text-transform: none;\r\n  letter-spacing: normal;\r\n  word-wrap: normal;\r\n  white-space: nowrap;\r\n  direction: ltr;\r\n\r\n  /* Support for all WebKit browsers. */\r\n  -webkit-font-smoothing: antialiased;\r\n  /* Support for Safari and Chrome. */\r\n  text-rendering: optimizeLegibility;\r\n\r\n  /* Support for Firefox. */\r\n  -moz-osx-font-smoothing: grayscale;\r\n\r\n  /* Support for IE. */\r\n  -webkit-font-feature-settings: 'liga';\r\n          font-feature-settings: 'liga';\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 155:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "/*\r\n.octicon is optimized for 16px.\r\n.mega-octicon is optimized for 32px but can be used larger.\r\n*/\r\n.octicon, .mega-octicon {\r\n  font: normal normal normal 16px/1 octicons;\r\n  display: inline-block;\r\n  text-decoration: none;\r\n  text-rendering: auto;\r\n  -webkit-font-smoothing: antialiased;\r\n  -moz-osx-font-smoothing: grayscale;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n.mega-octicon { font-size: 32px; }\r\n\r\n.octicon-alert:before { content: '\\F02D'} /*  */\r\n.octicon-arrow-down:before { content: '\\F03F'} /*  */\r\n.octicon-arrow-left:before { content: '\\F040'} /*  */\r\n.octicon-arrow-right:before { content: '\\F03E'} /*  */\r\n.octicon-arrow-small-down:before { content: '\\F0A0'} /*  */\r\n.octicon-arrow-small-left:before { content: '\\F0A1'} /*  */\r\n.octicon-arrow-small-right:before { content: '\\F071'} /*  */\r\n.octicon-arrow-small-up:before { content: '\\F09F'} /*  */\r\n.octicon-arrow-up:before { content: '\\F03D'} /*  */\r\n.octicon-microscope:before, .octicon-beaker:before { content: '\\F0DD'} /*  */\r\n.octicon-bell:before { content: '\\F0DE'} /*  */\r\n.octicon-bold:before { content: '\\F0E2'} /*  */\r\n.octicon-book:before { content: '\\F007'} /*  */\r\n.octicon-bookmark:before { content: '\\F07B'} /*  */\r\n.octicon-briefcase:before { content: '\\F0D3'} /*  */\r\n.octicon-broadcast:before { content: '\\F048'} /*  */\r\n.octicon-browser:before { content: '\\F0C5'} /*  */\r\n.octicon-bug:before { content: '\\F091'} /*  */\r\n.octicon-calendar:before { content: '\\F068'} /*  */\r\n.octicon-check:before { content: '\\F03A'} /*  */\r\n.octicon-checklist:before { content: '\\F076'} /*  */\r\n.octicon-chevron-down:before { content: '\\F0A3'} /*  */\r\n.octicon-chevron-left:before { content: '\\F0A4'} /*  */\r\n.octicon-chevron-right:before { content: '\\F078'} /*  */\r\n.octicon-chevron-up:before { content: '\\F0A2'} /*  */\r\n.octicon-circle-slash:before { content: '\\F084'} /*  */\r\n.octicon-circuit-board:before { content: '\\F0D6'} /*  */\r\n.octicon-clippy:before { content: '\\F035'} /*  */\r\n.octicon-clock:before { content: '\\F046'} /*  */\r\n.octicon-cloud-download:before { content: '\\F00B'} /*  */\r\n.octicon-cloud-upload:before { content: '\\F00C'} /*  */\r\n.octicon-code:before { content: '\\F05F'} /*  */\r\n.octicon-comment-add:before, .octicon-comment:before { content: '\\F02B'} /*  */\r\n.octicon-comment-discussion:before { content: '\\F04F'} /*  */\r\n.octicon-credit-card:before { content: '\\F045'} /*  */\r\n.octicon-dash:before { content: '\\F0CA'} /*  */\r\n.octicon-dashboard:before { content: '\\F07D'} /*  */\r\n.octicon-database:before { content: '\\F096'} /*  */\r\n.octicon-clone:before, .octicon-desktop-download:before { content: '\\F0DC'} /*  */\r\n.octicon-device-camera:before { content: '\\F056'} /*  */\r\n.octicon-device-camera-video:before { content: '\\F057'} /*  */\r\n.octicon-device-desktop:before { content: '\\F27C'} /*  */\r\n.octicon-device-mobile:before { content: '\\F038'} /*  */\r\n.octicon-diff:before { content: '\\F04D'} /*  */\r\n.octicon-diff-added:before { content: '\\F06B'} /*  */\r\n.octicon-diff-ignored:before { content: '\\F099'} /*  */\r\n.octicon-diff-modified:before { content: '\\F06D'} /*  */\r\n.octicon-diff-removed:before { content: '\\F06C'} /*  */\r\n.octicon-diff-renamed:before { content: '\\F06E'} /*  */\r\n.octicon-ellipsis:before { content: '\\F09A'} /*  */\r\n.octicon-eye-unwatch:before, .octicon-eye-watch:before, .octicon-eye:before { content: '\\F04E'} /*  */\r\n.octicon-file-binary:before { content: '\\F094'} /*  */\r\n.octicon-file-code:before { content: '\\F010'} /*  */\r\n.octicon-file-directory:before { content: '\\F016'} /*  */\r\n.octicon-file-media:before { content: '\\F012'} /*  */\r\n.octicon-file-pdf:before { content: '\\F014'} /*  */\r\n.octicon-file-submodule:before { content: '\\F017'} /*  */\r\n.octicon-file-symlink-directory:before { content: '\\F0B1'} /*  */\r\n.octicon-file-symlink-file:before { content: '\\F0B0'} /*  */\r\n.octicon-file-text:before { content: '\\F011'} /*  */\r\n.octicon-file-zip:before { content: '\\F013'} /*  */\r\n.octicon-flame:before { content: '\\F0D2'} /*  */\r\n.octicon-fold:before { content: '\\F0CC'} /*  */\r\n.octicon-gear:before { content: '\\F02F'} /*  */\r\n.octicon-gift:before { content: '\\F042'} /*  */\r\n.octicon-gist:before { content: '\\F00E'} /*  */\r\n.octicon-gist-secret:before { content: '\\F08C'} /*  */\r\n.octicon-git-branch-create:before, .octicon-git-branch-delete:before, .octicon-git-branch:before { content: '\\F020'} /*  */\r\n.octicon-git-commit:before { content: '\\F01F'} /*  */\r\n.octicon-git-compare:before { content: '\\F0AC'} /*  */\r\n.octicon-git-merge:before { content: '\\F023'} /*  */\r\n.octicon-git-pull-request-abandoned:before, .octicon-git-pull-request:before { content: '\\F009'} /*  */\r\n.octicon-globe:before { content: '\\F0B6'} /*  */\r\n.octicon-graph:before { content: '\\F043'} /*  */\r\n.octicon-heart:before { content: '\\2665'} /* ♥ */\r\n.octicon-history:before { content: '\\F07E'} /*  */\r\n.octicon-home:before { content: '\\F08D'} /*  */\r\n.octicon-horizontal-rule:before { content: '\\F070'} /*  */\r\n.octicon-hubot:before { content: '\\F09D'} /*  */\r\n.octicon-inbox:before { content: '\\F0CF'} /*  */\r\n.octicon-info:before { content: '\\F059'} /*  */\r\n.octicon-issue-closed:before { content: '\\F028'} /*  */\r\n.octicon-issue-opened:before { content: '\\F026'} /*  */\r\n.octicon-issue-reopened:before { content: '\\F027'} /*  */\r\n.octicon-italic:before { content: '\\F0E4'} /*  */\r\n.octicon-jersey:before { content: '\\F019'} /*  */\r\n.octicon-key:before { content: '\\F049'} /*  */\r\n.octicon-keyboard:before { content: '\\F00D'} /*  */\r\n.octicon-law:before { content: '\\F0D8'} /*  */\r\n.octicon-light-bulb:before { content: '\\F000'} /*  */\r\n.octicon-link:before { content: '\\F05C'} /*  */\r\n.octicon-link-external:before { content: '\\F07F'} /*  */\r\n.octicon-list-ordered:before { content: '\\F062'} /*  */\r\n.octicon-list-unordered:before { content: '\\F061'} /*  */\r\n.octicon-location:before { content: '\\F060'} /*  */\r\n.octicon-gist-private:before, .octicon-mirror-private:before, .octicon-git-fork-private:before, .octicon-lock:before { content: '\\F06A'} /*  */\r\n.octicon-logo-gist:before { content: '\\F0AD'} /*  */\r\n.octicon-logo-github:before { content: '\\F092'} /*  */\r\n.octicon-mail:before { content: '\\F03B'} /*  */\r\n.octicon-mail-read:before { content: '\\F03C'} /*  */\r\n.octicon-mail-reply:before { content: '\\F051'} /*  */\r\n.octicon-mark-github:before { content: '\\F00A'} /*  */\r\n.octicon-markdown:before { content: '\\F0C9'} /*  */\r\n.octicon-megaphone:before { content: '\\F077'} /*  */\r\n.octicon-mention:before { content: '\\F0BE'} /*  */\r\n.octicon-milestone:before { content: '\\F075'} /*  */\r\n.octicon-mirror-public:before, .octicon-mirror:before { content: '\\F024'} /*  */\r\n.octicon-mortar-board:before { content: '\\F0D7'} /*  */\r\n.octicon-mute:before { content: '\\F080'} /*  */\r\n.octicon-no-newline:before { content: '\\F09C'} /*  */\r\n.octicon-octoface:before { content: '\\F008'} /*  */\r\n.octicon-organization:before { content: '\\F037'} /*  */\r\n.octicon-package:before { content: '\\F0C4'} /*  */\r\n.octicon-paintcan:before { content: '\\F0D1'} /*  */\r\n.octicon-pencil:before { content: '\\F058'} /*  */\r\n.octicon-person-add:before, .octicon-person-follow:before, .octicon-person:before { content: '\\F018'} /*  */\r\n.octicon-pin:before { content: '\\F041'} /*  */\r\n.octicon-plug:before { content: '\\F0D4'} /*  */\r\n.octicon-repo-create:before, .octicon-gist-new:before, .octicon-file-directory-create:before, .octicon-file-add:before, .octicon-plus:before { content: '\\F05D'} /*  */\r\n.octicon-primitive-dot:before { content: '\\F052'} /*  */\r\n.octicon-primitive-square:before { content: '\\F053'} /*  */\r\n.octicon-pulse:before { content: '\\F085'} /*  */\r\n.octicon-question:before { content: '\\F02C'} /*  */\r\n.octicon-quote:before { content: '\\F063'} /*  */\r\n.octicon-radio-tower:before { content: '\\F030'} /*  */\r\n.octicon-repo-delete:before, .octicon-repo:before { content: '\\F001'} /*  */\r\n.octicon-repo-clone:before { content: '\\F04C'} /*  */\r\n.octicon-repo-force-push:before { content: '\\F04A'} /*  */\r\n.octicon-gist-fork:before, .octicon-repo-forked:before { content: '\\F002'} /*  */\r\n.octicon-repo-pull:before { content: '\\F006'} /*  */\r\n.octicon-repo-push:before { content: '\\F005'} /*  */\r\n.octicon-rocket:before { content: '\\F033'} /*  */\r\n.octicon-rss:before { content: '\\F034'} /*  */\r\n.octicon-ruby:before { content: '\\F047'} /*  */\r\n.octicon-search-save:before, .octicon-search:before { content: '\\F02E'} /*  */\r\n.octicon-server:before { content: '\\F097'} /*  */\r\n.octicon-settings:before { content: '\\F07C'} /*  */\r\n.octicon-shield:before { content: '\\F0E1'} /*  */\r\n.octicon-log-in:before, .octicon-sign-in:before { content: '\\F036'} /*  */\r\n.octicon-log-out:before, .octicon-sign-out:before { content: '\\F032'} /*  */\r\n.octicon-smiley:before { content: '\\F0E7'} /*  */\r\n.octicon-squirrel:before { content: '\\F0B2'} /*  */\r\n.octicon-star-add:before, .octicon-star-delete:before, .octicon-star:before { content: '\\F02A'} /*  */\r\n.octicon-stop:before { content: '\\F08F'} /*  */\r\n.octicon-repo-sync:before, .octicon-sync:before { content: '\\F087'} /*  */\r\n.octicon-tag-remove:before, .octicon-tag-add:before, .octicon-tag:before { content: '\\F015'} /*  */\r\n.octicon-tasklist:before { content: '\\F0E5'} /*  */\r\n.octicon-telescope:before { content: '\\F088'} /*  */\r\n.octicon-terminal:before { content: '\\F0C8'} /*  */\r\n.octicon-text-size:before { content: '\\F0E3'} /*  */\r\n.octicon-three-bars:before { content: '\\F05E'} /*  */\r\n.octicon-thumbsdown:before { content: '\\F0DB'} /*  */\r\n.octicon-thumbsup:before { content: '\\F0DA'} /*  */\r\n.octicon-tools:before { content: '\\F031'} /*  */\r\n.octicon-trashcan:before { content: '\\F0D0'} /*  */\r\n.octicon-triangle-down:before { content: '\\F05B'} /*  */\r\n.octicon-triangle-left:before { content: '\\F044'} /*  */\r\n.octicon-triangle-right:before { content: '\\F05A'} /*  */\r\n.octicon-triangle-up:before { content: '\\F0AA'} /*  */\r\n.octicon-unfold:before { content: '\\F039'} /*  */\r\n.octicon-unmute:before { content: '\\F0BA'} /*  */\r\n.octicon-verified:before { content: '\\F0E6'} /*  */\r\n.octicon-versions:before { content: '\\F064'} /*  */\r\n.octicon-watch:before { content: '\\F0E0'} /*  */\r\n.octicon-remove-close:before, .octicon-x:before { content: '\\F081'} /*  */\r\n.octicon-zap:before { content: '\\26A1'} /* ⚡ */\r\n\r\n\r\n", ""]);

// exports


/***/ }),

/***/ 156:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(undefined);
// imports


// module
exports.push([module.i, "html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {\r\n    margin: 0;\r\n    padding: 0;\r\n    border: 0;\r\n    font-size: 100%;\r\n    font: inherit;\r\n    vertical-align: baseline;\r\n}\r\narticle, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {\r\n    display: block;\r\n}\r\nbody {\r\n    line-height: 1;\r\n}\r\nol, ul {\r\n    list-style: none;\r\n}\r\ntable {\r\n    border-collapse: collapse;\r\n    border-spacing: 0;\r\n}\r\n\r\n/* Custom */\r\n::-moz-selection {\r\n    background: #0371BE; /* WebKit/Blink Browsers */\r\n    color: #f7f7f7;\r\n}\r\n::selection {\r\n    background: #0371BE; /* WebKit/Blink Browsers */\r\n    color: #f7f7f7;\r\n}\r\n::-moz-selection {\r\n    background: #0371BE; /* Gecko Browsers */\r\n    color: #f7f7f7;\r\n}\r\n::-webkit-scrollbar {\r\n    width: 5px;\r\n    height: 5px;\r\n}\r\n \r\n::-webkit-scrollbar-track {\r\n}\r\n \r\n::-webkit-scrollbar-thumb {\r\n  background-color: #ccc;\r\n}\r\n\r\n.console-viewer ::-webkit-scrollbar-thumb {\r\n  background-color: #555;\r\n}\r\n\r\n.noselect {\r\n  -webkit-touch-callout: none; /* iOS Safari */\r\n  -webkit-user-select: none;   /* Chrome/Safari/Opera */\r\n  -moz-user-select: none;      /* Firefox */\r\n  -ms-user-select: none;       /* IE/Edge */\r\n  user-select: none;           /* non-prefixed version, currently\r\n                                  not supported by any browser */\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 157:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/MaterialIcons-Regular.eot";

/***/ }),

/***/ 158:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/MaterialIcons-Regular.ttf";

/***/ }),

/***/ 159:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/MaterialIcons-Regular.woff";

/***/ }),

/***/ 160:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/MaterialIcons-Regular.woff2";

/***/ }),

/***/ 161:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/octicons.ttf";

/***/ }),

/***/ 162:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/octicons.woff";

/***/ }),

/***/ 163:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/roboto-v15-latin-regular.woff";

/***/ }),

/***/ 164:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/roboto-v15-latin-regular.woff2";

/***/ }),

/***/ 165:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/compiling.png";

/***/ }),

/***/ 166:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/editor-bg.png";

/***/ }),

/***/ 167:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/logo-32-inverted.png";

/***/ }),

/***/ 168:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var modes = ["clike", "css", "javascript"];

  for (var i = 0; i < modes.length; ++i)
    CodeMirror.extendMode(modes[i], {blockCommentContinue: " * "});

  function continueComment(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections(), mode, inserts = [];
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].head, token = cm.getTokenAt(pos);
      if (token.type != "comment") return CodeMirror.Pass;
      var modeHere = CodeMirror.innerMode(cm.getMode(), token.state).mode;
      if (!mode) mode = modeHere;
      else if (mode != modeHere) return CodeMirror.Pass;

      var insert = null;
      if (mode.blockCommentStart && mode.blockCommentContinue) {
        var end = token.string.indexOf(mode.blockCommentEnd);
        var full = cm.getRange(CodeMirror.Pos(pos.line, 0), CodeMirror.Pos(pos.line, token.end)), found;
        if (end != -1 && end == token.string.length - mode.blockCommentEnd.length && pos.ch >= end) {
          // Comment ended, don't continue it
        } else if (token.string.indexOf(mode.blockCommentStart) == 0) {
          insert = full.slice(0, token.start);
          if (!/^\s*$/.test(insert)) {
            insert = "";
            for (var j = 0; j < token.start; ++j) insert += " ";
          }
        } else if ((found = full.indexOf(mode.blockCommentContinue)) != -1 &&
                   found + mode.blockCommentContinue.length > token.start &&
                   /^\s*$/.test(full.slice(0, found))) {
          insert = full.slice(0, found);
        }
        if (insert != null) insert += mode.blockCommentContinue;
      }
      if (insert == null && mode.lineComment && continueLineCommentEnabled(cm)) {
        var line = cm.getLine(pos.line), found = line.indexOf(mode.lineComment);
        if (found > -1) {
          insert = line.slice(0, found);
          if (/\S/.test(insert)) insert = null;
          else insert += mode.lineComment + line.slice(found + mode.lineComment.length).match(/^\s*/)[0];
        }
      }
      if (insert == null) return CodeMirror.Pass;
      inserts[i] = "\n" + insert;
    }

    cm.operation(function() {
      for (var i = ranges.length - 1; i >= 0; i--)
        cm.replaceRange(inserts[i], ranges[i].from(), ranges[i].to(), "+insert");
    });
  }

  function continueLineCommentEnabled(cm) {
    var opt = cm.getOption("continueComments");
    if (opt && typeof opt == "object")
      return opt.continueLineComment !== false;
    return true;
  }

  CodeMirror.defineOption("continueComments", null, function(cm, val, prev) {
    if (prev && prev != CodeMirror.Init)
      cm.removeKeyMap("continueComment");
    if (val) {
      var key = "Enter";
      if (typeof val == "string")
        key = val;
      else if (typeof val == "object" && val.key)
        key = val.key;
      var map = {name: "continueComment"};
      map[key] = continueComment;
      cm.addKeyMap(map);
    }
  });
});


/***/ }),

/***/ 169:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("fullScreen", false, function(cm, val, old) {
    if (old == CodeMirror.Init) old = false;
    if (!old == !val) return;
    if (val) setFullscreen(cm);
    else setNormal(cm);
  });

  function setFullscreen(cm) {
    var wrap = cm.getWrapperElement();
    cm.state.fullScreenRestore = {scrollTop: window.pageYOffset, scrollLeft: window.pageXOffset,
                                  width: wrap.style.width, height: wrap.style.height};
    wrap.style.width = "";
    wrap.style.height = "auto";
    wrap.className += " CodeMirror-fullscreen";
    document.documentElement.style.overflow = "hidden";
    cm.refresh();
  }

  function setNormal(cm) {
    var wrap = cm.getWrapperElement();
    wrap.className = wrap.className.replace(/\s*CodeMirror-fullscreen\b/, "");
    document.documentElement.style.overflow = "";
    var info = cm.state.fullScreenRestore;
    wrap.style.width = info.width; wrap.style.height = info.height;
    window.scrollTo(info.scrollLeft, info.scrollTop);
    cm.refresh();
  }
});


/***/ }),

/***/ 170:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
    (document.documentMode == null || document.documentMode < 8);

  var Pos = CodeMirror.Pos;

  var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};

  function findMatchingBracket(cm, where, strict, config) {
    var line = cm.getLineHandle(where.line), pos = where.ch - 1;
    var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
    if (!match) return null;
    var dir = match.charAt(1) == ">" ? 1 : -1;
    if (strict && (dir > 0) != (pos == where.ch)) return null;
    var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

    var found = scanForBracket(cm, Pos(where.line, pos + (dir > 0 ? 1 : 0)), dir, style || null, config);
    if (found == null) return null;
    return {from: Pos(where.line, pos), to: found && found.pos,
            match: found && found.ch == match.charAt(0), forward: dir > 0};
  }

  // bracketRegex is used to specify which type of bracket to scan
  // should be a regexp, e.g. /[[\]]/
  //
  // Note: If "where" is on an open bracket, then this bracket is ignored.
  //
  // Returns false when no bracket was found, null when it reached
  // maxScanLines and gave up
  function scanForBracket(cm, where, dir, style, config) {
    var maxScanLen = (config && config.maxScanLineLength) || 10000;
    var maxScanLines = (config && config.maxScanLines) || 1000;

    var stack = [];
    var re = config && config.bracketRegex ? config.bracketRegex : /[(){}[\]]/;
    var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1)
                          : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
    for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
      var line = cm.getLine(lineNo);
      if (!line) continue;
      var pos = dir > 0 ? 0 : line.length - 1, end = dir > 0 ? line.length : -1;
      if (line.length > maxScanLen) continue;
      if (lineNo == where.line) pos = where.ch - (dir < 0 ? 1 : 0);
      for (; pos != end; pos += dir) {
        var ch = line.charAt(pos);
        if (re.test(ch) && (style === undefined || cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style)) {
          var match = matching[ch];
          if ((match.charAt(1) == ">") == (dir > 0)) stack.push(ch);
          else if (!stack.length) return {pos: Pos(lineNo, pos), ch: ch};
          else stack.pop();
        }
      }
    }
    return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
  }

  function matchBrackets(cm, autoclear, config) {
    // Disable brace matching in long lines, since it'll cause hugely slow updates
    var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
    var marks = [], ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head, false, config);
      if (match && cm.getLine(match.from.line).length <= maxHighlightLen) {
        var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
        marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {className: style}));
        if (match.to && cm.getLine(match.to.line).length <= maxHighlightLen)
          marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), {className: style}));
      }
    }

    if (marks.length) {
      // Kludge to work around the IE bug from issue #1193, where text
      // input stops going to the textare whever this fires.
      if (ie_lt8 && cm.state.focused) cm.focus();

      var clear = function() {
        cm.operation(function() {
          for (var i = 0; i < marks.length; i++) marks[i].clear();
        });
      };
      if (autoclear) setTimeout(clear, 800);
      else return clear;
    }
  }

  var currentlyHighlighted = null;
  function doMatchBrackets(cm) {
    cm.operation(function() {
      if (currentlyHighlighted) {currentlyHighlighted(); currentlyHighlighted = null;}
      currentlyHighlighted = matchBrackets(cm, false, cm.state.matchBrackets);
    });
  }

  CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.off("cursorActivity", doMatchBrackets);
      if (currentlyHighlighted) {currentlyHighlighted(); currentlyHighlighted = null;}
    }
    if (val) {
      cm.state.matchBrackets = typeof val == "object" ? val : {};
      cm.on("cursorActivity", doMatchBrackets);
    }
  });

  CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
  CodeMirror.defineExtension("findMatchingBracket", function(pos, strict, config){
    return findMatchingBracket(this, pos, strict, config);
  });
  CodeMirror.defineExtension("scanForBracket", function(pos, dir, style, config){
    return scanForBracket(this, pos, dir, style, config);
  });
});


/***/ }),

/***/ 171:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Utility function that allows modes to be combined. The mode given
// as the base argument takes care of most of the normal mode
// functionality, but a second (typically simple) mode is used, which
// can override the style of text. Both modes get to parse all of the
// text, but when both assign a non-null style to a piece of code, the
// overlay wins, unless the combine argument was true and not overridden,
// or state.overlay.combineTokens was true, in which case the styles are
// combined.

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.overlayMode = function(base, overlay, combine) {
  return {
    startState: function() {
      return {
        base: CodeMirror.startState(base),
        overlay: CodeMirror.startState(overlay),
        basePos: 0, baseCur: null,
        overlayPos: 0, overlayCur: null,
        streamSeen: null
      };
    },
    copyState: function(state) {
      return {
        base: CodeMirror.copyState(base, state.base),
        overlay: CodeMirror.copyState(overlay, state.overlay),
        basePos: state.basePos, baseCur: null,
        overlayPos: state.overlayPos, overlayCur: null
      };
    },

    token: function(stream, state) {
      if (stream != state.streamSeen ||
          Math.min(state.basePos, state.overlayPos) < stream.start) {
        state.streamSeen = stream;
        state.basePos = state.overlayPos = stream.start;
      }

      if (stream.start == state.basePos) {
        state.baseCur = base.token(stream, state.base);
        state.basePos = stream.pos;
      }
      if (stream.start == state.overlayPos) {
        stream.pos = stream.start;
        state.overlayCur = overlay.token(stream, state.overlay);
        state.overlayPos = stream.pos;
      }
      stream.pos = Math.min(state.basePos, state.overlayPos);

      // state.overlay.combineTokens always takes precedence over combine,
      // unless set to null
      if (state.overlayCur == null) return state.baseCur;
      else if (state.baseCur != null &&
               state.overlay.combineTokens ||
               combine && state.overlay.combineTokens == null)
        return state.baseCur + " " + state.overlayCur;
      else return state.overlayCur;
    },

    indent: base.indent && function(state, textAfter) {
      return base.indent(state.base, textAfter);
    },
    electricChars: base.electricChars,

    innerMode: function(state) { return {state: state.base, mode: base}; },

    blankLine: function(state) {
      var baseToken, overlayToken;
      if (base.blankLine) baseToken = base.blankLine(state.base);
      if (overlay.blankLine) overlayToken = overlay.blankLine(state.overlay);

      return overlayToken == null ?
        baseToken :
        (combine && baseToken != null ? baseToken + " " + overlayToken : overlayToken);
    }
  };
};

});


/***/ }),

/***/ 172:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

function Context(indented, column, type, info, align, prev) {
  this.indented = indented;
  this.column = column;
  this.type = type;
  this.info = info;
  this.align = align;
  this.prev = prev;
}
function pushContext(state, col, type, info) {
  var indent = state.indented;
  if (state.context && state.context.type == "statement" && type != "statement")
    indent = state.context.indented;
  return state.context = new Context(indent, col, type, info, null, state.context);
}
function popContext(state) {
  var t = state.context.type;
  if (t == ")" || t == "]" || t == "}")
    state.indented = state.context.indented;
  return state.context = state.context.prev;
}

function typeBefore(stream, state, pos) {
  if (state.prevToken == "variable" || state.prevToken == "variable-3") return true;
  if (/\S(?:[^- ]>|[*\]])\s*$|\*$/.test(stream.string.slice(0, pos))) return true;
  if (state.typeAtEndOfLine && stream.column() == stream.indentation()) return true;
}

function isTopScope(context) {
  for (;;) {
    if (!context || context.type == "top") return true;
    if (context.type == "}" && context.prev.info != "namespace") return false;
    context = context.prev;
  }
}

CodeMirror.defineMode("clike", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      keywords = parserConfig.keywords || {},
      types = parserConfig.types || {},
      builtin = parserConfig.builtin || {},
      blockKeywords = parserConfig.blockKeywords || {},
      defKeywords = parserConfig.defKeywords || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings,
      indentStatements = parserConfig.indentStatements !== false,
      indentSwitch = parserConfig.indentSwitch !== false,
      namespaceSeparator = parserConfig.namespaceSeparator,
      isPunctuationChar = parserConfig.isPunctuationChar || /[\[\]{}\(\),;\:\.]/,
      numberStart = parserConfig.numberStart || /[\d\.]/,
      number = parserConfig.number || /^(?:0x[a-f\d]+|0b[01]+|(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(u|ll?|l|f)?/i,
      isOperatorChar = parserConfig.isOperatorChar || /[+\-*&%=<>!?|\/]/,
      isIdentifierChar = parserConfig.isIdentifierChar || /[\w\$_\xa1-\uffff]/;

  var curPunc, isDefKeyword;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (isPunctuationChar.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (numberStart.test(ch)) {
      stream.backUp(1)
      if (stream.match(number)) return "number"
      stream.next()
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      while (!stream.match(/^\/[\/*]/, false) && stream.eat(isOperatorChar)) {}
      return "operator";
    }
    stream.eatWhile(isIdentifierChar);
    if (namespaceSeparator) while (stream.match(namespaceSeparator))
      stream.eatWhile(isIdentifierChar);

    var cur = stream.current();
    if (contains(keywords, cur)) {
      if (contains(blockKeywords, cur)) curPunc = "newstatement";
      if (contains(defKeywords, cur)) isDefKeyword = true;
      return "keyword";
    }
    if (contains(types, cur)) return "variable-3";
    if (contains(builtin, cur)) {
      if (contains(blockKeywords, cur)) curPunc = "newstatement";
      return "builtin";
    }
    if (contains(atoms, cur)) return "atom";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = null;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function maybeEOL(stream, state) {
    if (parserConfig.typeFirstDefinitions && stream.eol() && isTopScope(state.context))
      state.typeAtEndOfLine = typeBefore(stream, state, stream.pos)
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", null, false),
        indented: 0,
        startOfLine: true,
        prevToken: null
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) { maybeEOL(stream, state); return null; }
      curPunc = isDefKeyword = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if (curPunc == ";" || curPunc == ":" || (curPunc == "," && stream.match(/^\s*(?:\/\/.*)?$/, false)))
        while (state.context.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (indentStatements &&
               (((ctx.type == "}" || ctx.type == "top") && curPunc != ";") ||
                (ctx.type == "statement" && curPunc == "newstatement"))) {
        pushContext(state, stream.column(), "statement", stream.current());
      }

      if (style == "variable" &&
          ((state.prevToken == "def" ||
            (parserConfig.typeFirstDefinitions && typeBefore(stream, state, stream.start) &&
             isTopScope(state.context) && stream.match(/^\s*\(/, false)))))
        style = "def";

      if (hooks.token) {
        var result = hooks.token(stream, state, style);
        if (result !== undefined) style = result;
      }

      if (style == "def" && parserConfig.styleDefs === false) style = "variable";

      state.startOfLine = false;
      state.prevToken = isDefKeyword ? "def" : style || curPunc;
      maybeEOL(stream, state);
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null || state.typeAtEndOfLine) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      if (parserConfig.dontIndentStatements)
        while (ctx.type == "statement" && parserConfig.dontIndentStatements.test(ctx.info))
          ctx = ctx.prev
      if (hooks.indent) {
        var hook = hooks.indent(state, ctx, textAfter);
        if (typeof hook == "number") return hook
      }
      var closing = firstChar == ctx.type;
      var switchBlock = ctx.prev && ctx.prev.info == "switch";
      if (parserConfig.allmanIndentation && /[{(]/.test(firstChar)) {
        while (ctx.type != "top" && ctx.type != "}") ctx = ctx.prev
        return ctx.indented
      }
      if (ctx.type == "statement")
        return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      if (ctx.align && (!dontAlignCalls || ctx.type != ")"))
        return ctx.column + (closing ? 0 : 1);
      if (ctx.type == ")" && !closing)
        return ctx.indented + statementIndentUnit;

      return ctx.indented + (closing ? 0 : indentUnit) +
        (!closing && switchBlock && !/^(?:case|default)\b/.test(textAfter) ? indentUnit : 0);
    },

    electricInput: indentSwitch ? /^\s*(?:case .*?:|default:|\{\}?|\})$/ : /^\s*[{}]$/,
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//",
    fold: "brace"
  };
});

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  function contains(words, word) {
    if (typeof words === "function") {
      return words(word);
    } else {
      return words.propertyIsEnumerable(word);
    }
  }
  var cKeywords = "auto if break case register continue return default do sizeof " +
    "static else struct switch extern typedef union for goto while enum const volatile";
  var cTypes = "int long char short double float unsigned signed void size_t ptrdiff_t";

  function cppHook(stream, state) {
    if (!state.startOfLine) return false
    for (var ch, next = null; ch = stream.peek();) {
      if (ch == "\\" && stream.match(/^.$/)) {
        next = cppHook
        break
      } else if (ch == "/" && stream.match(/^\/[\/\*]/, false)) {
        break
      }
      stream.next()
    }
    state.tokenize = next
    return "meta"
  }

  function pointerHook(_stream, state) {
    if (state.prevToken == "variable-3") return "variable-3";
    return false;
  }

  function cpp14Literal(stream) {
    stream.eatWhile(/[\w\.']/);
    return "number";
  }

  function cpp11StringHook(stream, state) {
    stream.backUp(1);
    // Raw strings.
    if (stream.match(/(R|u8R|uR|UR|LR)/)) {
      var match = stream.match(/"([^\s\\()]{0,16})\(/);
      if (!match) {
        return false;
      }
      state.cpp11RawStringDelim = match[1];
      state.tokenize = tokenRawString;
      return tokenRawString(stream, state);
    }
    // Unicode strings/chars.
    if (stream.match(/(u8|u|U|L)/)) {
      if (stream.match(/["']/, /* eat */ false)) {
        return "string";
      }
      return false;
    }
    // Ignore this hook.
    stream.next();
    return false;
  }

  function cppLooksLikeConstructor(word) {
    var lastTwo = /(\w+)::~?(\w+)$/.exec(word);
    return lastTwo && lastTwo[1] == lastTwo[2];
  }

  // C#-style strings where "" escapes a quote.
  function tokenAtString(stream, state) {
    var next;
    while ((next = stream.next()) != null) {
      if (next == '"' && !stream.eat('"')) {
        state.tokenize = null;
        break;
      }
    }
    return "string";
  }

  // C++11 raw string literal is <prefix>"<delim>( anything )<delim>", where
  // <delim> can be a string up to 16 characters long.
  function tokenRawString(stream, state) {
    // Escape characters that have special regex meanings.
    var delim = state.cpp11RawStringDelim.replace(/[^\w\s]/g, '\\$&');
    var match = stream.match(new RegExp(".*?\\)" + delim + '"'));
    if (match)
      state.tokenize = null;
    else
      stream.skipToEnd();
    return "string";
  }

  function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    var words = [];
    function add(obj) {
      if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop))
        words.push(prop);
    }
    add(mode.keywords);
    add(mode.types);
    add(mode.builtin);
    add(mode.atoms);
    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i = 0; i < mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], mode);
  }

  def(["text/x-csrc", "text/x-c", "text/x-chdr"], {
    name: "clike",
    keywords: words(cKeywords),
    types: words(cTypes + " bool _Complex _Bool float_t double_t intptr_t intmax_t " +
                 "int8_t int16_t int32_t int64_t uintptr_t uintmax_t uint8_t uint16_t " +
                 "uint32_t uint64_t"),
    blockKeywords: words("case do else for if switch while struct"),
    defKeywords: words("struct"),
    typeFirstDefinitions: true,
    atoms: words("null true false"),
    hooks: {"#": cppHook, "*": pointerHook},
    modeProps: {fold: ["brace", "include"]}
  });

  def(["text/x-c++src", "text/x-c++hdr"], {
    name: "clike",
    keywords: words(cKeywords + " asm dynamic_cast namespace reinterpret_cast try explicit new " +
                    "static_cast typeid catch operator template typename class friend private " +
                    "this using const_cast inline public throw virtual delete mutable protected " +
                    "alignas alignof constexpr decltype nullptr noexcept thread_local final " +
                    "static_assert override"),
    types: words(cTypes + " bool wchar_t"),
    blockKeywords: words("catch class do else finally for if struct switch try while"),
    defKeywords: words("class namespace struct enum union"),
    typeFirstDefinitions: true,
    atoms: words("true false null"),
    dontIndentStatements: /^template$/,
    isIdentifierChar: /[\w\$_~\xa1-\uffff]/,
    hooks: {
      "#": cppHook,
      "*": pointerHook,
      "u": cpp11StringHook,
      "U": cpp11StringHook,
      "L": cpp11StringHook,
      "R": cpp11StringHook,
      "0": cpp14Literal,
      "1": cpp14Literal,
      "2": cpp14Literal,
      "3": cpp14Literal,
      "4": cpp14Literal,
      "5": cpp14Literal,
      "6": cpp14Literal,
      "7": cpp14Literal,
      "8": cpp14Literal,
      "9": cpp14Literal,
      token: function(stream, state, style) {
        if (style == "variable" && stream.peek() == "(" &&
            (state.prevToken == ";" || state.prevToken == null ||
             state.prevToken == "}") &&
            cppLooksLikeConstructor(stream.current()))
          return "def";
      }
    },
    namespaceSeparator: "::",
    modeProps: {fold: ["brace", "include"]}
  });

  def("text/x-java", {
    name: "clike",
    keywords: words("abstract assert break case catch class const continue default " +
                    "do else enum extends final finally float for goto if implements import " +
                    "instanceof interface native new package private protected public " +
                    "return static strictfp super switch synchronized this throw throws transient " +
                    "try volatile while @interface"),
    types: words("byte short int long float double boolean char void Boolean Byte Character Double Float " +
                 "Integer Long Number Object Short String StringBuffer StringBuilder Void"),
    blockKeywords: words("catch class do else finally for if switch try while"),
    defKeywords: words("class interface package enum @interface"),
    typeFirstDefinitions: true,
    atoms: words("true false null"),
    number: /^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+\.?\d*|\.\d+)(?:e[-+]?[\d_]+)?)(u|ll?|l|f)?/i,
    hooks: {
      "@": function(stream) {
        // Don't match the @interface keyword.
        if (stream.match('interface', false)) return false;

        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    },
    modeProps: {fold: ["brace", "import"]}
  });

  def("text/x-csharp", {
    name: "clike",
    keywords: words("abstract as async await base break case catch checked class const continue" +
                    " default delegate do else enum event explicit extern finally fixed for" +
                    " foreach goto if implicit in interface internal is lock namespace new" +
                    " operator out override params private protected public readonly ref return sealed" +
                    " sizeof stackalloc static struct switch this throw try typeof unchecked" +
                    " unsafe using virtual void volatile while add alias ascending descending dynamic from get" +
                    " global group into join let orderby partial remove select set value var yield"),
    types: words("Action Boolean Byte Char DateTime DateTimeOffset Decimal Double Func" +
                 " Guid Int16 Int32 Int64 Object SByte Single String Task TimeSpan UInt16 UInt32" +
                 " UInt64 bool byte char decimal double short int long object"  +
                 " sbyte float string ushort uint ulong"),
    blockKeywords: words("catch class do else finally for foreach if struct switch try while"),
    defKeywords: words("class interface namespace struct var"),
    typeFirstDefinitions: true,
    atoms: words("true false null"),
    hooks: {
      "@": function(stream, state) {
        if (stream.eat('"')) {
          state.tokenize = tokenAtString;
          return tokenAtString(stream, state);
        }
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });

  function tokenTripleString(stream, state) {
    var escaped = false;
    while (!stream.eol()) {
      if (!escaped && stream.match('"""')) {
        state.tokenize = null;
        break;
      }
      escaped = stream.next() == "\\" && !escaped;
    }
    return "string";
  }

  def("text/x-scala", {
    name: "clike",
    keywords: words(

      /* scala */
      "abstract case catch class def do else extends final finally for forSome if " +
      "implicit import lazy match new null object override package private protected return " +
      "sealed super this throw trait try type val var while with yield _ " +

      /* package scala */
      "assert assume require print println printf readLine readBoolean readByte readShort " +
      "readChar readInt readLong readFloat readDouble"
    ),
    types: words(
      "AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either " +
      "Enumeration Equiv Error Exception Fractional Function IndexedSeq Int Integral Iterable " +
      "Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering " +
      "Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder " +
      "StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector " +

      /* package java.lang */
      "Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable " +
      "Compiler Double Exception Float Integer Long Math Number Object Package Pair Process " +
      "Runtime Runnable SecurityManager Short StackTraceElement StrictMath String " +
      "StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"
    ),
    multiLineStrings: true,
    blockKeywords: words("catch class do else finally for forSome if match switch try while"),
    defKeywords: words("class def object package trait type val var"),
    atoms: words("true false null"),
    indentStatements: false,
    indentSwitch: false,
    isOperatorChar: /[+\-*&%=<>!?|\/#:@]/,
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      },
      '"': function(stream, state) {
        if (!stream.match('""')) return false;
        state.tokenize = tokenTripleString;
        return state.tokenize(stream, state);
      },
      "'": function(stream) {
        stream.eatWhile(/[\w\$_\xa1-\uffff]/);
        return "atom";
      },
      "=": function(stream, state) {
        var cx = state.context
        if (cx.type == "}" && cx.align && stream.eat(">")) {
          state.context = new Context(cx.indented, cx.column, cx.type, cx.info, null, cx.prev)
          return "operator"
        } else {
          return false
        }
      }
    },
    modeProps: {closeBrackets: {triples: '"'}}
  });

  function tokenKotlinString(tripleString){
    return function (stream, state) {
      var escaped = false, next, end = false;
      while (!stream.eol()) {
        if (!tripleString && !escaped && stream.match('"') ) {end = true; break;}
        if (tripleString && stream.match('"""')) {end = true; break;}
        next = stream.next();
        if(!escaped && next == "$" && stream.match('{'))
          stream.skipTo("}");
        escaped = !escaped && next == "\\" && !tripleString;
      }
      if (end || !tripleString)
        state.tokenize = null;
      return "string";
    }
  }

  def("text/x-kotlin", {
    name: "clike",
    keywords: words(
      /*keywords*/
      "package as typealias class interface this super val " +
      "var fun for is in This throw return " +
      "break continue object if else while do try when !in !is as? " +

      /*soft keywords*/
      "file import where by get set abstract enum open inner override private public internal " +
      "protected catch finally out final vararg reified dynamic companion constructor init " +
      "sealed field property receiver param sparam lateinit data inline noinline tailrec " +
      "external annotation crossinline const operator infix suspend"
    ),
    types: words(
      /* package java.lang */
      "Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable " +
      "Compiler Double Exception Float Integer Long Math Number Object Package Pair Process " +
      "Runtime Runnable SecurityManager Short StackTraceElement StrictMath String " +
      "StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"
    ),
    intendSwitch: false,
    indentStatements: false,
    multiLineStrings: true,
    number: /^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+\.?\d*|\.\d+)(?:e[-+]?[\d_]+)?)(u|ll?|l|f)?/i,
    blockKeywords: words("catch class do else finally for if where try while enum"),
    defKeywords: words("class val var object package interface fun"),
    atoms: words("true false null this"),
    hooks: {
      '"': function(stream, state) {
        state.tokenize = tokenKotlinString(stream.match('""'));
        return state.tokenize(stream, state);
      }
    },
    modeProps: {closeBrackets: {triples: '"'}}
  });

  def(["x-shader/x-vertex", "x-shader/x-fragment"], {
    name: "clike",
    keywords: words("sampler1D sampler2D sampler3D samplerCube " +
                    "sampler1DShadow sampler2DShadow " +
                    "const attribute uniform varying " +
                    "break continue discard return " +
                    "for while do if else struct " +
                    "in out inout"),
    types: words("float int bool void " +
                 "vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 " +
                 "mat2 mat3 mat4"),
    blockKeywords: words("for while do if else struct"),
    builtin: words("radians degrees sin cos tan asin acos atan " +
                    "pow exp log exp2 sqrt inversesqrt " +
                    "abs sign floor ceil fract mod min max clamp mix step smoothstep " +
                    "length distance dot cross normalize ftransform faceforward " +
                    "reflect refract matrixCompMult " +
                    "lessThan lessThanEqual greaterThan greaterThanEqual " +
                    "equal notEqual any all not " +
                    "texture1D texture1DProj texture1DLod texture1DProjLod " +
                    "texture2D texture2DProj texture2DLod texture2DProjLod " +
                    "texture3D texture3DProj texture3DLod texture3DProjLod " +
                    "textureCube textureCubeLod " +
                    "shadow1D shadow2D shadow1DProj shadow2DProj " +
                    "shadow1DLod shadow2DLod shadow1DProjLod shadow2DProjLod " +
                    "dFdx dFdy fwidth " +
                    "noise1 noise2 noise3 noise4"),
    atoms: words("true false " +
                "gl_FragColor gl_SecondaryColor gl_Normal gl_Vertex " +
                "gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 " +
                "gl_MultiTexCoord4 gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 " +
                "gl_FogCoord gl_PointCoord " +
                "gl_Position gl_PointSize gl_ClipVertex " +
                "gl_FrontColor gl_BackColor gl_FrontSecondaryColor gl_BackSecondaryColor " +
                "gl_TexCoord gl_FogFragCoord " +
                "gl_FragCoord gl_FrontFacing " +
                "gl_FragData gl_FragDepth " +
                "gl_ModelViewMatrix gl_ProjectionMatrix gl_ModelViewProjectionMatrix " +
                "gl_TextureMatrix gl_NormalMatrix gl_ModelViewMatrixInverse " +
                "gl_ProjectionMatrixInverse gl_ModelViewProjectionMatrixInverse " +
                "gl_TexureMatrixTranspose gl_ModelViewMatrixInverseTranspose " +
                "gl_ProjectionMatrixInverseTranspose " +
                "gl_ModelViewProjectionMatrixInverseTranspose " +
                "gl_TextureMatrixInverseTranspose " +
                "gl_NormalScale gl_DepthRange gl_ClipPlane " +
                "gl_Point gl_FrontMaterial gl_BackMaterial gl_LightSource gl_LightModel " +
                "gl_FrontLightModelProduct gl_BackLightModelProduct " +
                "gl_TextureColor gl_EyePlaneS gl_EyePlaneT gl_EyePlaneR gl_EyePlaneQ " +
                "gl_FogParameters " +
                "gl_MaxLights gl_MaxClipPlanes gl_MaxTextureUnits gl_MaxTextureCoords " +
                "gl_MaxVertexAttribs gl_MaxVertexUniformComponents gl_MaxVaryingFloats " +
                "gl_MaxVertexTextureImageUnits gl_MaxTextureImageUnits " +
                "gl_MaxFragmentUniformComponents gl_MaxCombineTextureImageUnits " +
                "gl_MaxDrawBuffers"),
    indentSwitch: false,
    hooks: {"#": cppHook},
    modeProps: {fold: ["brace", "include"]}
  });

  def("text/x-nesc", {
    name: "clike",
    keywords: words(cKeywords + "as atomic async call command component components configuration event generic " +
                    "implementation includes interface module new norace nx_struct nx_union post provides " +
                    "signal task uses abstract extends"),
    types: words(cTypes),
    blockKeywords: words("case do else for if switch while struct"),
    atoms: words("null true false"),
    hooks: {"#": cppHook},
    modeProps: {fold: ["brace", "include"]}
  });

  def("text/x-objectivec", {
    name: "clike",
    keywords: words(cKeywords + "inline restrict _Bool _Complex _Imaginary BOOL Class bycopy byref id IMP in " +
                    "inout nil oneway out Protocol SEL self super atomic nonatomic retain copy readwrite readonly"),
    types: words(cTypes),
    atoms: words("YES NO NULL NILL ON OFF true false"),
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$]/);
        return "keyword";
      },
      "#": cppHook,
      indent: function(_state, ctx, textAfter) {
        if (ctx.type == "statement" && /^@\w/.test(textAfter)) return ctx.indented
      }
    },
    modeProps: {fold: "brace"}
  });

  def("text/x-squirrel", {
    name: "clike",
    keywords: words("base break clone continue const default delete enum extends function in class" +
                    " foreach local resume return this throw typeof yield constructor instanceof static"),
    types: words(cTypes),
    blockKeywords: words("case catch class else for foreach if switch try while"),
    defKeywords: words("function local class"),
    typeFirstDefinitions: true,
    atoms: words("true false null"),
    hooks: {"#": cppHook},
    modeProps: {fold: ["brace", "include"]}
  });

  // Ceylon Strings need to deal with interpolation
  var stringTokenizer = null;
  function tokenCeylonString(type) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while (!stream.eol()) {
        if (!escaped && stream.match('"') &&
              (type == "single" || stream.match('""'))) {
          end = true;
          break;
        }
        if (!escaped && stream.match('``')) {
          stringTokenizer = tokenCeylonString(type);
          end = true;
          break;
        }
        next = stream.next();
        escaped = type == "single" && !escaped && next == "\\";
      }
      if (end)
          state.tokenize = null;
      return "string";
    }
  }

  def("text/x-ceylon", {
    name: "clike",
    keywords: words("abstracts alias assembly assert assign break case catch class continue dynamic else" +
                    " exists extends finally for function given if import in interface is let module new" +
                    " nonempty object of out outer package return satisfies super switch then this throw" +
                    " try value void while"),
    types: function(word) {
        // In Ceylon all identifiers that start with an uppercase are types
        var first = word.charAt(0);
        return (first === first.toUpperCase() && first !== first.toLowerCase());
    },
    blockKeywords: words("case catch class dynamic else finally for function if interface module new object switch try while"),
    defKeywords: words("class dynamic function interface module object package value"),
    builtin: words("abstract actual aliased annotation by default deprecated doc final formal late license" +
                   " native optional sealed see serializable shared suppressWarnings tagged throws variable"),
    isPunctuationChar: /[\[\]{}\(\),;\:\.`]/,
    isOperatorChar: /[+\-*&%=<>!?|^~:\/]/,
    numberStart: /[\d#$]/,
    number: /^(?:#[\da-fA-F_]+|\$[01_]+|[\d_]+[kMGTPmunpf]?|[\d_]+\.[\d_]+(?:[eE][-+]?\d+|[kMGTPmunpf]|)|)/i,
    multiLineStrings: true,
    typeFirstDefinitions: true,
    atoms: words("true false null larger smaller equal empty finished"),
    indentSwitch: false,
    styleDefs: false,
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      },
      '"': function(stream, state) {
          state.tokenize = tokenCeylonString(stream.match('""') ? "triple" : "single");
          return state.tokenize(stream, state);
        },
      '`': function(stream, state) {
          if (!stringTokenizer || !stream.match('`')) return false;
          state.tokenize = stringTokenizer;
          stringTokenizer = null;
          return state.tokenize(stream, state);
        },
      "'": function(stream) {
        stream.eatWhile(/[\w\$_\xa1-\uffff]/);
        return "atom";
      },
      token: function(_stream, state, style) {
          if ((style == "variable" || style == "variable-3") &&
              state.prevToken == ".") {
            return "variable-2";
          }
        }
    },
    modeProps: {
        fold: ["brace", "import"],
        closeBrackets: {triples: '"'}
    }
  });

});


/***/ }),

/***/ 173:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7), __webpack_require__(78), __webpack_require__(171));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../markdown/markdown", "../../addon/mode/overlay"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

var urlRE = /^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i

CodeMirror.defineMode("gfm", function(config, modeConfig) {
  var codeDepth = 0;
  function blankLine(state) {
    state.code = false;
    return null;
  }
  var gfmOverlay = {
    startState: function() {
      return {
        code: false,
        codeBlock: false,
        ateSpace: false
      };
    },
    copyState: function(s) {
      return {
        code: s.code,
        codeBlock: s.codeBlock,
        ateSpace: s.ateSpace
      };
    },
    token: function(stream, state) {
      state.combineTokens = null;

      // Hack to prevent formatting override inside code blocks (block and inline)
      if (state.codeBlock) {
        if (stream.match(/^```+/)) {
          state.codeBlock = false;
          return null;
        }
        stream.skipToEnd();
        return null;
      }
      if (stream.sol()) {
        state.code = false;
      }
      if (stream.sol() && stream.match(/^```+/)) {
        stream.skipToEnd();
        state.codeBlock = true;
        return null;
      }
      // If this block is changed, it may need to be updated in Markdown mode
      if (stream.peek() === '`') {
        stream.next();
        var before = stream.pos;
        stream.eatWhile('`');
        var difference = 1 + stream.pos - before;
        if (!state.code) {
          codeDepth = difference;
          state.code = true;
        } else {
          if (difference === codeDepth) { // Must be exact
            state.code = false;
          }
        }
        return null;
      } else if (state.code) {
        stream.next();
        return null;
      }
      // Check if space. If so, links can be formatted later on
      if (stream.eatSpace()) {
        state.ateSpace = true;
        return null;
      }
      if (stream.sol() || state.ateSpace) {
        state.ateSpace = false;
        if (modeConfig.gitHubSpice !== false) {
          if(stream.match(/^(?:[a-zA-Z0-9\-_]+\/)?(?:[a-zA-Z0-9\-_]+@)?(?:[a-f0-9]{7,40}\b)/)) {
            // User/Project@SHA
            // User@SHA
            // SHA
            state.combineTokens = true;
            return "link";
          } else if (stream.match(/^(?:[a-zA-Z0-9\-_]+\/)?(?:[a-zA-Z0-9\-_]+)?#[0-9]+\b/)) {
            // User/Project#Num
            // User#Num
            // #Num
            state.combineTokens = true;
            return "link";
          }
        }
      }
      if (stream.match(urlRE) &&
          stream.string.slice(stream.start - 2, stream.start) != "](" &&
          (stream.start == 0 || /\W/.test(stream.string.charAt(stream.start - 1)))) {
        // URLs
        // Taken from http://daringfireball.net/2010/07/improved_regex_for_matching_urls
        // And then (issue #1160) simplified to make it not crash the Chrome Regexp engine
        // And then limited url schemes to the CommonMark list, so foo:bar isn't matched as a URL
        state.combineTokens = true;
        return "link";
      }
      stream.next();
      return null;
    },
    blankLine: blankLine
  };

  var markdownConfig = {
    taskLists: true,
    fencedCodeBlocks: '```',
    strikethrough: true
  };
  for (var attr in modeConfig) {
    markdownConfig[attr] = modeConfig[attr];
  }
  markdownConfig.name = "markdown";
  return CodeMirror.overlayMode(CodeMirror.getMode(config, markdownConfig), gfmOverlay);

}, "markdown");

  CodeMirror.defineMIME("text/x-gfm", "gfm");
});


/***/ }),

/***/ 174:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7), __webpack_require__(47), __webpack_require__(77), __webpack_require__(76));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../javascript/javascript", "../css/css"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var defaultTags = {
    script: [
      ["lang", /(javascript|babel)/i, "javascript"],
      ["type", /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i, "javascript"],
      ["type", /./, "text/plain"],
      [null, null, "javascript"]
    ],
    style:  [
      ["lang", /^css$/i, "css"],
      ["type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css"],
      ["type", /./, "text/plain"],
      [null, null, "css"]
    ]
  };

  function maybeBackup(stream, pat, style) {
    var cur = stream.current(), close = cur.search(pat);
    if (close > -1) {
      stream.backUp(cur.length - close);
    } else if (cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur);
    }
    return style;
  }

  var attrRegexpCache = {};
  function getAttrRegexp(attr) {
    var regexp = attrRegexpCache[attr];
    if (regexp) return regexp;
    return attrRegexpCache[attr] = new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*");
  }

  function getAttrValue(text, attr) {
    var match = text.match(getAttrRegexp(attr))
    return match ? /^\s*(.*?)\s*$/.exec(match[2])[1] : ""
  }

  function getTagRegexp(tagName, anchored) {
    return new RegExp((anchored ? "^" : "") + "<\/\s*" + tagName + "\s*>", "i");
  }

  function addTags(from, to) {
    for (var tag in from) {
      var dest = to[tag] || (to[tag] = []);
      var source = from[tag];
      for (var i = source.length - 1; i >= 0; i--)
        dest.unshift(source[i])
    }
  }

  function findMatchingMode(tagInfo, tagText) {
    for (var i = 0; i < tagInfo.length; i++) {
      var spec = tagInfo[i];
      if (!spec[0] || spec[1].test(getAttrValue(tagText, spec[0]))) return spec[2];
    }
  }

  CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {
      name: "xml",
      htmlMode: true,
      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
    });

    var tags = {};
    var configTags = parserConfig && parserConfig.tags, configScript = parserConfig && parserConfig.scriptTypes;
    addTags(defaultTags, tags);
    if (configTags) addTags(configTags, tags);
    if (configScript) for (var i = configScript.length - 1; i >= 0; i--)
      tags.script.unshift(["type", configScript[i].matches, configScript[i].mode])

    function html(stream, state) {
      var style = htmlMode.token(stream, state.htmlState), tag = /\btag\b/.test(style), tagName
      if (tag && !/[<>\s\/]/.test(stream.current()) &&
          (tagName = state.htmlState.tagName && state.htmlState.tagName.toLowerCase()) &&
          tags.hasOwnProperty(tagName)) {
        state.inTag = tagName + " "
      } else if (state.inTag && tag && />$/.test(stream.current())) {
        var inTag = /^([\S]+) (.*)/.exec(state.inTag)
        state.inTag = null
        var modeSpec = stream.current() == ">" && findMatchingMode(tags[inTag[1]], inTag[2])
        var mode = CodeMirror.getMode(config, modeSpec)
        var endTagA = getTagRegexp(inTag[1], true), endTag = getTagRegexp(inTag[1], false);
        state.token = function (stream, state) {
          if (stream.match(endTagA, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return null;
          }
          return maybeBackup(stream, endTag, state.localMode.token(stream, state.localState));
        };
        state.localMode = mode;
        state.localState = CodeMirror.startState(mode, htmlMode.indent(state.htmlState, ""));
      } else if (state.inTag) {
        state.inTag += stream.current()
        if (stream.eol()) state.inTag += " "
      }
      return style;
    };

    return {
      startState: function () {
        var state = CodeMirror.startState(htmlMode);
        return {token: html, inTag: null, localMode: null, localState: null, htmlState: state};
      },

      copyState: function (state) {
        var local;
        if (state.localState) {
          local = CodeMirror.copyState(state.localMode, state.localState);
        }
        return {token: state.token, inTag: state.inTag,
                localMode: state.localMode, localState: local,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
      },

      token: function (stream, state) {
        return state.token(stream, state);
      },

      indent: function (state, textAfter) {
        if (!state.localMode || /^\s*<\//.test(textAfter))
          return htmlMode.indent(state.htmlState, textAfter);
        else if (state.localMode.indent)
          return state.localMode.indent(state.localState, textAfter);
        else
          return CodeMirror.Pass;
      },

      innerMode: function (state) {
        return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
      }
    };
  }, "xml", "javascript", "css");

  CodeMirror.defineMIME("text/html", "htmlmixed");
});


/***/ }),

/***/ 175:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.modeInfo = [
    {name: "APL", mime: "text/apl", mode: "apl", ext: ["dyalog", "apl"]},
    {name: "PGP", mimes: ["application/pgp", "application/pgp-keys", "application/pgp-signature"], mode: "asciiarmor", ext: ["pgp"]},
    {name: "ASN.1", mime: "text/x-ttcn-asn", mode: "asn.1", ext: ["asn", "asn1"]},
    {name: "Asterisk", mime: "text/x-asterisk", mode: "asterisk", file: /^extensions\.conf$/i},
    {name: "Brainfuck", mime: "text/x-brainfuck", mode: "brainfuck", ext: ["b", "bf"]},
    {name: "C", mime: "text/x-csrc", mode: "clike", ext: ["c", "h"]},
    {name: "C++", mime: "text/x-c++src", mode: "clike", ext: ["cpp", "c++", "cc", "cxx", "hpp", "h++", "hh", "hxx"], alias: ["cpp"]},
    {name: "Cobol", mime: "text/x-cobol", mode: "cobol", ext: ["cob", "cpy"]},
    {name: "C#", mime: "text/x-csharp", mode: "clike", ext: ["cs"], alias: ["csharp"]},
    {name: "Clojure", mime: "text/x-clojure", mode: "clojure", ext: ["clj", "cljc", "cljx"]},
    {name: "ClojureScript", mime: "text/x-clojurescript", mode: "clojure", ext: ["cljs"]},
    {name: "Closure Stylesheets (GSS)", mime: "text/x-gss", mode: "css", ext: ["gss"]},
    {name: "CMake", mime: "text/x-cmake", mode: "cmake", ext: ["cmake", "cmake.in"], file: /^CMakeLists.txt$/},
    {name: "CoffeeScript", mime: "text/x-coffeescript", mode: "coffeescript", ext: ["coffee"], alias: ["coffee", "coffee-script"]},
    {name: "Common Lisp", mime: "text/x-common-lisp", mode: "commonlisp", ext: ["cl", "lisp", "el"], alias: ["lisp"]},
    {name: "Cypher", mime: "application/x-cypher-query", mode: "cypher", ext: ["cyp", "cypher"]},
    {name: "Cython", mime: "text/x-cython", mode: "python", ext: ["pyx", "pxd", "pxi"]},
    {name: "Crystal", mime: "text/x-crystal", mode: "crystal", ext: ["cr"]},
    {name: "CSS", mime: "text/css", mode: "css", ext: ["css"]},
    {name: "CQL", mime: "text/x-cassandra", mode: "sql", ext: ["cql"]},
    {name: "D", mime: "text/x-d", mode: "d", ext: ["d"]},
    {name: "Dart", mimes: ["application/dart", "text/x-dart"], mode: "dart", ext: ["dart"]},
    {name: "diff", mime: "text/x-diff", mode: "diff", ext: ["diff", "patch"]},
    {name: "Django", mime: "text/x-django", mode: "django"},
    {name: "Dockerfile", mime: "text/x-dockerfile", mode: "dockerfile", file: /^Dockerfile$/},
    {name: "DTD", mime: "application/xml-dtd", mode: "dtd", ext: ["dtd"]},
    {name: "Dylan", mime: "text/x-dylan", mode: "dylan", ext: ["dylan", "dyl", "intr"]},
    {name: "EBNF", mime: "text/x-ebnf", mode: "ebnf"},
    {name: "ECL", mime: "text/x-ecl", mode: "ecl", ext: ["ecl"]},
    {name: "edn", mime: "application/edn", mode: "clojure", ext: ["edn"]},
    {name: "Eiffel", mime: "text/x-eiffel", mode: "eiffel", ext: ["e"]},
    {name: "Elm", mime: "text/x-elm", mode: "elm", ext: ["elm"]},
    {name: "Embedded Javascript", mime: "application/x-ejs", mode: "htmlembedded", ext: ["ejs"]},
    {name: "Embedded Ruby", mime: "application/x-erb", mode: "htmlembedded", ext: ["erb"]},
    {name: "Erlang", mime: "text/x-erlang", mode: "erlang", ext: ["erl"]},
    {name: "Factor", mime: "text/x-factor", mode: "factor", ext: ["factor"]},
    {name: "FCL", mime: "text/x-fcl", mode: "fcl"},
    {name: "Forth", mime: "text/x-forth", mode: "forth", ext: ["forth", "fth", "4th"]},
    {name: "Fortran", mime: "text/x-fortran", mode: "fortran", ext: ["f", "for", "f77", "f90"]},
    {name: "F#", mime: "text/x-fsharp", mode: "mllike", ext: ["fs"], alias: ["fsharp"]},
    {name: "Gas", mime: "text/x-gas", mode: "gas", ext: ["s"]},
    {name: "Gherkin", mime: "text/x-feature", mode: "gherkin", ext: ["feature"]},
    {name: "GitHub Flavored Markdown", mime: "text/x-gfm", mode: "gfm", file: /^(readme|contributing|history).md$/i},
    {name: "Go", mime: "text/x-go", mode: "go", ext: ["go"]},
    {name: "Groovy", mime: "text/x-groovy", mode: "groovy", ext: ["groovy", "gradle"], file: /^Jenkinsfile$/},
    {name: "HAML", mime: "text/x-haml", mode: "haml", ext: ["haml"]},
    {name: "Haskell", mime: "text/x-haskell", mode: "haskell", ext: ["hs"]},
    {name: "Haskell (Literate)", mime: "text/x-literate-haskell", mode: "haskell-literate", ext: ["lhs"]},
    {name: "Haxe", mime: "text/x-haxe", mode: "haxe", ext: ["hx"]},
    {name: "HXML", mime: "text/x-hxml", mode: "haxe", ext: ["hxml"]},
    {name: "ASP.NET", mime: "application/x-aspx", mode: "htmlembedded", ext: ["aspx"], alias: ["asp", "aspx"]},
    {name: "HTML", mime: "text/html", mode: "htmlmixed", ext: ["html", "htm"], alias: ["xhtml"]},
    {name: "HTTP", mime: "message/http", mode: "http"},
    {name: "IDL", mime: "text/x-idl", mode: "idl", ext: ["pro"]},
    {name: "Pug", mime: "text/x-pug", mode: "pug", ext: ["jade", "pug"], alias: ["jade"]},
    {name: "Java", mime: "text/x-java", mode: "clike", ext: ["java"]},
    {name: "Java Server Pages", mime: "application/x-jsp", mode: "htmlembedded", ext: ["jsp"], alias: ["jsp"]},
    {name: "JavaScript", mimes: ["text/javascript", "text/ecmascript", "application/javascript", "application/x-javascript", "application/ecmascript"],
     mode: "javascript", ext: ["js"], alias: ["ecmascript", "js", "node"]},
    {name: "JSON", mimes: ["application/json", "application/x-json"], mode: "javascript", ext: ["json", "map"], alias: ["json5"]},
    {name: "JSON-LD", mime: "application/ld+json", mode: "javascript", ext: ["jsonld"], alias: ["jsonld"]},
    {name: "JSX", mime: "text/jsx", mode: "jsx", ext: ["jsx"]},
    {name: "Jinja2", mime: "null", mode: "jinja2"},
    {name: "Julia", mime: "text/x-julia", mode: "julia", ext: ["jl"]},
    {name: "Kotlin", mime: "text/x-kotlin", mode: "clike", ext: ["kt"]},
    {name: "LESS", mime: "text/x-less", mode: "css", ext: ["less"]},
    {name: "LiveScript", mime: "text/x-livescript", mode: "livescript", ext: ["ls"], alias: ["ls"]},
    {name: "Lua", mime: "text/x-lua", mode: "lua", ext: ["lua"]},
    {name: "Markdown", mime: "text/x-markdown", mode: "markdown", ext: ["markdown", "md", "mkd"]},
    {name: "mIRC", mime: "text/mirc", mode: "mirc"},
    {name: "MariaDB SQL", mime: "text/x-mariadb", mode: "sql"},
    {name: "Mathematica", mime: "text/x-mathematica", mode: "mathematica", ext: ["m", "nb"]},
    {name: "Modelica", mime: "text/x-modelica", mode: "modelica", ext: ["mo"]},
    {name: "MUMPS", mime: "text/x-mumps", mode: "mumps", ext: ["mps"]},
    {name: "MS SQL", mime: "text/x-mssql", mode: "sql"},
    {name: "mbox", mime: "application/mbox", mode: "mbox", ext: ["mbox"]},
    {name: "MySQL", mime: "text/x-mysql", mode: "sql"},
    {name: "Nginx", mime: "text/x-nginx-conf", mode: "nginx", file: /nginx.*\.conf$/i},
    {name: "NSIS", mime: "text/x-nsis", mode: "nsis", ext: ["nsh", "nsi"]},
    {name: "NTriples", mime: "text/n-triples", mode: "ntriples", ext: ["nt"]},
    {name: "Objective C", mime: "text/x-objectivec", mode: "clike", ext: ["m", "mm"], alias: ["objective-c", "objc"]},
    {name: "OCaml", mime: "text/x-ocaml", mode: "mllike", ext: ["ml", "mli", "mll", "mly"]},
    {name: "Octave", mime: "text/x-octave", mode: "octave", ext: ["m"]},
    {name: "Oz", mime: "text/x-oz", mode: "oz", ext: ["oz"]},
    {name: "Pascal", mime: "text/x-pascal", mode: "pascal", ext: ["p", "pas"]},
    {name: "PEG.js", mime: "null", mode: "pegjs", ext: ["jsonld"]},
    {name: "Perl", mime: "text/x-perl", mode: "perl", ext: ["pl", "pm"]},
    {name: "PHP", mime: "application/x-httpd-php", mode: "php", ext: ["php", "php3", "php4", "php5", "phtml"]},
    {name: "Pig", mime: "text/x-pig", mode: "pig", ext: ["pig"]},
    {name: "Plain Text", mime: "text/plain", mode: "null", ext: ["txt", "text", "conf", "def", "list", "log"]},
    {name: "PLSQL", mime: "text/x-plsql", mode: "sql", ext: ["pls"]},
    {name: "PowerShell", mime: "application/x-powershell", mode: "powershell", ext: ["ps1", "psd1", "psm1"]},
    {name: "Properties files", mime: "text/x-properties", mode: "properties", ext: ["properties", "ini", "in"], alias: ["ini", "properties"]},
    {name: "ProtoBuf", mime: "text/x-protobuf", mode: "protobuf", ext: ["proto"]},
    {name: "Python", mime: "text/x-python", mode: "python", ext: ["BUILD", "bzl", "py", "pyw"], file: /^(BUCK|BUILD)$/},
    {name: "Puppet", mime: "text/x-puppet", mode: "puppet", ext: ["pp"]},
    {name: "Q", mime: "text/x-q", mode: "q", ext: ["q"]},
    {name: "R", mime: "text/x-rsrc", mode: "r", ext: ["r", "R"], alias: ["rscript"]},
    {name: "reStructuredText", mime: "text/x-rst", mode: "rst", ext: ["rst"], alias: ["rst"]},
    {name: "RPM Changes", mime: "text/x-rpm-changes", mode: "rpm"},
    {name: "RPM Spec", mime: "text/x-rpm-spec", mode: "rpm", ext: ["spec"]},
    {name: "Ruby", mime: "text/x-ruby", mode: "ruby", ext: ["rb"], alias: ["jruby", "macruby", "rake", "rb", "rbx"]},
    {name: "Rust", mime: "text/x-rustsrc", mode: "rust", ext: ["rs"]},
    {name: "SAS", mime: "text/x-sas", mode: "sas", ext: ["sas"]},
    {name: "Sass", mime: "text/x-sass", mode: "sass", ext: ["sass"]},
    {name: "Scala", mime: "text/x-scala", mode: "clike", ext: ["scala"]},
    {name: "Scheme", mime: "text/x-scheme", mode: "scheme", ext: ["scm", "ss"]},
    {name: "SCSS", mime: "text/x-scss", mode: "css", ext: ["scss"]},
    {name: "Shell", mime: "text/x-sh", mode: "shell", ext: ["sh", "ksh", "bash"], alias: ["bash", "sh", "zsh"], file: /^PKGBUILD$/},
    {name: "Sieve", mime: "application/sieve", mode: "sieve", ext: ["siv", "sieve"]},
    {name: "Slim", mimes: ["text/x-slim", "application/x-slim"], mode: "slim", ext: ["slim"]},
    {name: "Smalltalk", mime: "text/x-stsrc", mode: "smalltalk", ext: ["st"]},
    {name: "Smarty", mime: "text/x-smarty", mode: "smarty", ext: ["tpl"]},
    {name: "Solr", mime: "text/x-solr", mode: "solr"},
    {name: "Soy", mime: "text/x-soy", mode: "soy", ext: ["soy"], alias: ["closure template"]},
    {name: "SPARQL", mime: "application/sparql-query", mode: "sparql", ext: ["rq", "sparql"], alias: ["sparul"]},
    {name: "Spreadsheet", mime: "text/x-spreadsheet", mode: "spreadsheet", alias: ["excel", "formula"]},
    {name: "SQL", mime: "text/x-sql", mode: "sql", ext: ["sql"]},
    {name: "SQLite", mime: "text/x-sqlite", mode: "sql"},
    {name: "Squirrel", mime: "text/x-squirrel", mode: "clike", ext: ["nut"]},
    {name: "Stylus", mime: "text/x-styl", mode: "stylus", ext: ["styl"]},
    {name: "Swift", mime: "text/x-swift", mode: "swift", ext: ["swift"]},
    {name: "sTeX", mime: "text/x-stex", mode: "stex"},
    {name: "LaTeX", mime: "text/x-latex", mode: "stex", ext: ["text", "ltx"], alias: ["tex"]},
    {name: "SystemVerilog", mime: "text/x-systemverilog", mode: "verilog", ext: ["v"]},
    {name: "Tcl", mime: "text/x-tcl", mode: "tcl", ext: ["tcl"]},
    {name: "Textile", mime: "text/x-textile", mode: "textile", ext: ["textile"]},
    {name: "TiddlyWiki ", mime: "text/x-tiddlywiki", mode: "tiddlywiki"},
    {name: "Tiki wiki", mime: "text/tiki", mode: "tiki"},
    {name: "TOML", mime: "text/x-toml", mode: "toml", ext: ["toml"]},
    {name: "Tornado", mime: "text/x-tornado", mode: "tornado"},
    {name: "troff", mime: "text/troff", mode: "troff", ext: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]},
    {name: "TTCN", mime: "text/x-ttcn", mode: "ttcn", ext: ["ttcn", "ttcn3", "ttcnpp"]},
    {name: "TTCN_CFG", mime: "text/x-ttcn-cfg", mode: "ttcn-cfg", ext: ["cfg"]},
    {name: "Turtle", mime: "text/turtle", mode: "turtle", ext: ["ttl"]},
    {name: "TypeScript", mime: "application/typescript", mode: "javascript", ext: ["ts"], alias: ["ts"]},
    {name: "TypeScript-JSX", mime: "text/typescript-jsx", mode: "jsx", ext: ["tsx"], alias: ["tsx"]},
    {name: "Twig", mime: "text/x-twig", mode: "twig"},
    {name: "Web IDL", mime: "text/x-webidl", mode: "webidl", ext: ["webidl"]},
    {name: "VB.NET", mime: "text/x-vb", mode: "vb", ext: ["vb"]},
    {name: "VBScript", mime: "text/vbscript", mode: "vbscript", ext: ["vbs"]},
    {name: "Velocity", mime: "text/velocity", mode: "velocity", ext: ["vtl"]},
    {name: "Verilog", mime: "text/x-verilog", mode: "verilog", ext: ["v"]},
    {name: "VHDL", mime: "text/x-vhdl", mode: "vhdl", ext: ["vhd", "vhdl"]},
    {name: "Vue.js Component", mimes: ["script/x-vue", "text/x-vue"], mode: "vue", ext: ["vue"]},
    {name: "XML", mimes: ["application/xml", "text/xml"], mode: "xml", ext: ["xml", "xsl", "xsd", "svg"], alias: ["rss", "wsdl", "xsd"]},
    {name: "XQuery", mime: "application/xquery", mode: "xquery", ext: ["xy", "xquery"]},
    {name: "Yacas", mime: "text/x-yacas", mode: "yacas", ext: ["ys"]},
    {name: "YAML", mimes: ["text/x-yaml", "text/yaml"], mode: "yaml", ext: ["yaml", "yml"], alias: ["yml"]},
    {name: "Z80", mime: "text/x-z80", mode: "z80", ext: ["z80"]},
    {name: "mscgen", mime: "text/x-mscgen", mode: "mscgen", ext: ["mscgen", "mscin", "msc"]},
    {name: "xu", mime: "text/x-xu", mode: "mscgen", ext: ["xu"]},
    {name: "msgenny", mime: "text/x-msgenny", mode: "mscgen", ext: ["msgenny"]}
  ];
  // Ensure all modes have a mime property for backwards compatibility
  for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
    var info = CodeMirror.modeInfo[i];
    if (info.mimes) info.mime = info.mimes[0];
  }

  CodeMirror.findModeByMIME = function(mime) {
    mime = mime.toLowerCase();
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.mime == mime) return info;
      if (info.mimes) for (var j = 0; j < info.mimes.length; j++)
        if (info.mimes[j] == mime) return info;
    }
    if (/\+xml$/.test(mime)) return CodeMirror.findModeByMIME("application/xml")
    if (/\+json$/.test(mime)) return CodeMirror.findModeByMIME("application/json")
  };

  CodeMirror.findModeByExtension = function(ext) {
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.ext) for (var j = 0; j < info.ext.length; j++)
        if (info.ext[j] == ext) return info;
    }
  };

  CodeMirror.findModeByFileName = function(filename) {
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.file && info.file.test(filename)) return info;
    }
    var dot = filename.lastIndexOf(".");
    var ext = dot > -1 && filename.substring(dot + 1, filename.length);
    if (ext) return CodeMirror.findModeByExtension(ext);
  };

  CodeMirror.findModeByName = function(name) {
    name = name.toLowerCase();
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.name.toLowerCase() == name) return info;
      if (info.alias) for (var j = 0; j < info.alias.length; j++)
        if (info.alias[j].toLowerCase() == name) return info;
    }
  };
});


/***/ }),

/***/ 18:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ 20:
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		// Test for IE <= 9 as proposed by Browserhacks
		// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
		// Tests for existence of standard globals is to allow style-loader 
		// to operate correctly into non-standard environments
		// @see https://github.com/webpack-contrib/style-loader/issues/177
		return window && document && document.all && !window.atob;
	}),
	getElement = (function(fn) {
		var memo = {};
		return function(selector) {
			if (typeof memo[selector] === "undefined") {
				memo[selector] = fn.call(this, selector);
			}
			return memo[selector]
		};
	})(function (styleTarget) {
		return document.querySelector(styleTarget)
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [],
	fixUrls = __webpack_require__(334);

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (typeof options.insertInto === "undefined") options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list, options);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list, options) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var styleTarget = getElement(options.insertInto)
	if (!styleTarget) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			styleTarget.insertBefore(styleElement, styleTarget.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			styleTarget.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			styleTarget.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		styleTarget.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	options.attrs.type = "text/css";

	attachTagAttrs(styleElement, options.attrs);
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	attachTagAttrs(linkElement, options.attrs);
	insertStyleElement(options, linkElement);
	return linkElement;
}

function attachTagAttrs(element, attrs) {
	Object.keys(attrs).forEach(function (key) {
		element.setAttribute(key, attrs[key]);
	});
}

function addStyle(obj, options) {
	var styleElement, update, remove, transformResult;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    transformResult = options.transform(obj.css);
	    
	    if (transformResult) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = transformResult;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css. 
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement, options);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/* If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
	and there is no publicPath defined then lets turn convertToAbsoluteUrls
	on by default.  Otherwise default to the convertToAbsoluteUrls option
	directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls){
		css = fixUrls(css);
	}

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ 21:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ReactGA = __webpack_require__(29);
var react_redux_1 = __webpack_require__(45);
var state_1 = __webpack_require__(36);
var servicestack_client_1 = __webpack_require__(14);
var Gistlyn_dtos_1 = __webpack_require__(30);
exports.Config = {
    LatestVersion: "4.0.60",
};
exports.StateKey = "/v1/state";
exports.GistCacheKey = function (gist) { return "/v1/gists/" + gist; };
exports.client = new servicestack_client_1.JsonServiceClient("/");
exports.statusToError = function (status) { return ({ errorCode: status.errorCode, msg: status.message, cls: "error" }); };
exports.GistTemplates = {
    NewGist: "52c37e37b51a0ec92810477be34695ae",
    NewPrivateGist: "492e199fa3ec5394ef0bc1aedd3240c7",
    NewCollection: "854ec4df3502ecdfe9ca24d4745e484f",
    AddServiceStackReferenceGist: "2dbd4ccff70851ce8ae55678f4f15d0a",
    AddServiceStackReferenceCollection: "363605c3c121784ebababac4a03e8910",
    CollectionsCollection: "457a7035675513ba1365195658a5d792",
    SnapshotsCollection: "1576fda8eea87abbe94fa8051b4fed34",
    HomeCollection: "2cc6b5db6afd3ccb0d0149e55fdb3a6a",
    DownloadCollection: "74d7b0467a197f678bb4220b2c301ac3",
    RedisTodo: "54e452bb1e86e132068a595d7e72d1a6",
    OrmLiteTodo: "0cd558e817f28f77b974c44c3e12ff6f",
    PocoDynamoTodo: "d36339c55be6a43942a60c1eaf687bfd",
    Gists: ["52c37e37b51a0ec92810477be34695ae", "492e199fa3ec5394ef0bc1aedd3240c7", "854ec4df3502ecdfe9ca24d4745e484f",
        "2dbd4ccff70851ce8ae55678f4f15d0a", "363605c3c121784ebababac4a03e8910",
        "457a7035675513ba1365195658a5d792", "1576fda8eea87abbe94fa8051b4fed34",
        "2cc6b5db6afd3ccb0d0149e55fdb3a6a", "74d7b0467a197f678bb4220b2c301ac3",
        "54e452bb1e86e132068a595d7e72d1a6", "0cd558e817f28f77b974c44c3e12ff6f", "d36339c55be6a43942a60c1eaf687bfd"]
};
exports.FileNames = {
    GistMain: "main.cs",
    GistPackages: "packages.config",
    CollectionIndex: "index.md",
    Snapshot: "snapshot.json",
    canDelete: function (fileName) { return fileName &&
        fileName !== exports.FileNames.GistMain && fileName !== exports.FileNames.GistPackages &&
        fileName != exports.FileNames.CollectionIndex; }
};
function reduxify(mapStateToProps, mapDispatchToProps, mergeProps, options) {
    return function (target) { return react_redux_1.connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(target); };
}
exports.reduxify = reduxify;
var ua = navigator.userAgent;
var platform = navigator.platform.toLowerCase();
exports.UA = (_a = {
        ipad: ua.match(/iPad/i) != null,
        nosse: !("EventSource" in window)
    },
    _a[platform] = true,
    _a.mac = platform.indexOf("mac") >= 0,
    _a.safari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
    _a.getClassList = function () {
        var _this = this;
        var cls = Object.keys(this).filter(function (k) { return _this[k] === true; });
        return cls.join(" ");
    },
    _a);
function toGithubFiles(files) {
    var fileContents = {};
    Object.keys(files).forEach(function (fileName) {
        var file = new Gistlyn_dtos_1.GithubFile();
        file.filename = fileName;
        file.content = files[fileName].content;
        fileContents[fileName] = file;
    });
    return fileContents;
}
exports.toGithubFiles = toGithubFiles;
function getSortedFileNames(files) {
    var fileNames = Object.keys(files);
    fileNames.sort(function (a, b) {
        if (a.toLowerCase() === "main.cs")
            return -1;
        if (b.toLowerCase() === "main.cs")
            return 1;
        if (!a.endsWith(".cs") && b.endsWith(".cs"))
            return 1;
        if (a === b)
            return 0;
        return a < b ? -1 : 0;
    });
    return fileNames;
}
exports.getSortedFileNames = getSortedFileNames;
;
function addPackages(packagesConfig, pkgs) {
    var xml = "";
    pkgs.forEach(function (pkg) {
        if (!pkg.id || packagesConfig.indexOf("\"" + pkg.id + "\"") >= 0)
            return;
        var attrs = Object.keys(pkg).map(function (k) { return k + "=\"" + pkg[k] + "\""; });
        xml += "  <package " + attrs.join(" ") + " />\n";
    });
    return xml
        ? packagesConfig.replace("</packages>", "") + xml + "</packages>"
        : packagesConfig;
}
exports.addPackages = addPackages;
function addClientPackages(packagesConfig) {
    return addPackages(packagesConfig, [
        { id: "ServiceStack.Client", version: exports.Config.LatestVersion, targetFramework: "net45" },
        { id: "ServiceStack.Text", version: exports.Config.LatestVersion, targetFramework: "net45" },
        { id: "ServiceStack.Interfaces", version: exports.Config.LatestVersion, targetFramework: "net45" },
    ]);
}
exports.addClientPackages = addClientPackages;
var BatchItems = (function () {
    function BatchItems(everyMs, callback) {
        this.everyMs = everyMs;
        this.callback = callback;
        this.results = [];
    }
    BatchItems.prototype.queue = function (result) {
        var _this = this;
        if (this.timeoutId == null) {
            this.results.push(result);
            this.callback(this.results); //return 1st result for instant feedback
            this.results = [];
            this.timeoutId = setTimeout(function () {
                var results = _this.results;
                _this.results = [];
                _this.timeoutId = null;
                if (results.length > 0) {
                    _this.callback(results);
                }
            }, this.everyMs);
        }
        else {
            this.results.push(result); //buffer results if timer is active
        }
    };
    return BatchItems;
}());
exports.BatchItems = BatchItems;
function evalExpression(gist, scriptId, expr) {
    if (!expr)
        return;
    var request = new Gistlyn_dtos_1.EvaluateExpression();
    request.scriptId = scriptId;
    request.expression = expr;
    request.includeJson = true;
    ReactGA.event({ category: 'preview', action: 'Evaluate Expression', label: gist + ": " + expr.substring(0, 50) });
    exports.client.post(request)
        .then(function (r) {
        if (r.result.errors && r.result.errors.length > 0) {
            r.result.errors.forEach(function (x) {
                state_1.store.dispatch({ type: 'CONSOLE_LOG', logs: [{ msg: x.info, cls: "error" }] });
            });
        }
        else {
            state_1.store.dispatch({ type: 'EXPRESSION_LOAD', expressionResult: r.result });
        }
    })
        .catch(function (e) {
        var status = e.responseStatus || e; //both have schema `{ message }`
        state_1.store.dispatch({ type: 'CONSOLE_LOG', logs: [exports.statusToError(status)] });
    });
}
exports.evalExpression = evalExpression;
;
var _a;


/***/ }),

/***/ 30:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* Options:
Date: 2016-07-18 16:32:33
Version: 4.061
Tip: To override a DTO option, remove "//" prefix before updating
BaseUrl: http://localhost:4000

//GlobalNamespace:
ExportAsTypes: True
//MakePropertiesOptional: True
//AddServiceStackTypes: True
//AddResponseStatus: False
//AddImplicitVersion:
//AddDescriptionAsComments: True
//IncludeTypes:
//ExcludeTypes:
//DefaultImports:
*/
Object.defineProperty(exports, "__esModule", { value: true });
var GithubFile = (function () {
    function GithubFile() {
    }
    return GithubFile;
}());
exports.GithubFile = GithubFile;
// @DataContract
var ResponseStatus = (function () {
    function ResponseStatus() {
    }
    return ResponseStatus;
}());
exports.ResponseStatus = ResponseStatus;
var AssemblyReference = (function () {
    function AssemblyReference() {
    }
    return AssemblyReference;
}());
exports.AssemblyReference = AssemblyReference;
var ScriptExecutionResult = (function () {
    function ScriptExecutionResult() {
    }
    return ScriptExecutionResult;
}());
exports.ScriptExecutionResult = ScriptExecutionResult;
var VariableInfo = (function () {
    function VariableInfo() {
    }
    return VariableInfo;
}());
exports.VariableInfo = VariableInfo;
// @DataContract
var ResponseError = (function () {
    function ResponseError() {
    }
    return ResponseError;
}());
exports.ResponseError = ResponseError;
var ErrorInfo = (function () {
    function ErrorInfo() {
    }
    return ErrorInfo;
}());
exports.ErrorInfo = ErrorInfo;
var StoreGistResponse = (function () {
    function StoreGistResponse() {
    }
    return StoreGistResponse;
}());
exports.StoreGistResponse = StoreGistResponse;
var HelloResponse = (function () {
    function HelloResponse() {
    }
    return HelloResponse;
}());
exports.HelloResponse = HelloResponse;
var RunScriptResponse = (function () {
    function RunScriptResponse() {
    }
    return RunScriptResponse;
}());
exports.RunScriptResponse = RunScriptResponse;
var ScriptStateVariables = (function () {
    function ScriptStateVariables() {
    }
    return ScriptStateVariables;
}());
exports.ScriptStateVariables = ScriptStateVariables;
var EvaluateExpressionResponse = (function () {
    function EvaluateExpressionResponse() {
    }
    return EvaluateExpressionResponse;
}());
exports.EvaluateExpressionResponse = EvaluateExpressionResponse;
var CancelScriptResponse = (function () {
    function CancelScriptResponse() {
    }
    return CancelScriptResponse;
}());
exports.CancelScriptResponse = CancelScriptResponse;
// @DataContract
var AuthenticateResponse = (function () {
    function AuthenticateResponse() {
    }
    return AuthenticateResponse;
}());
exports.AuthenticateResponse = AuthenticateResponse;
// @DataContract
var AssignRolesResponse = (function () {
    function AssignRolesResponse() {
    }
    return AssignRolesResponse;
}());
exports.AssignRolesResponse = AssignRolesResponse;
// @DataContract
var UnAssignRolesResponse = (function () {
    function UnAssignRolesResponse() {
    }
    return UnAssignRolesResponse;
}());
exports.UnAssignRolesResponse = UnAssignRolesResponse;
// @Route("/github-proxy/{PathInfo*}")
var GithubProxy = (function () {
    function GithubProxy() {
    }
    GithubProxy.prototype.createResponse = function () { return ""; };
    GithubProxy.prototype.getTypeName = function () { return "GithubProxy"; };
    return GithubProxy;
}());
exports.GithubProxy = GithubProxy;
var StoreGist = (function () {
    function StoreGist() {
    }
    StoreGist.prototype.createResponse = function () { return new StoreGistResponse(); };
    StoreGist.prototype.getTypeName = function () { return "StoreGist"; };
    return StoreGist;
}());
exports.StoreGist = StoreGist;
// @Route("/hello/{Name}")
var Hello = (function () {
    function Hello() {
    }
    Hello.prototype.createResponse = function () { return new HelloResponse(); };
    Hello.prototype.getTypeName = function () { return "Hello"; };
    return Hello;
}());
exports.Hello = Hello;
// @Route("/scripts/{ScriptId}/run")
var RunScript = (function () {
    function RunScript() {
    }
    RunScript.prototype.createResponse = function () { return new RunScriptResponse(); };
    RunScript.prototype.getTypeName = function () { return "RunScript"; };
    return RunScript;
}());
exports.RunScript = RunScript;
// @Route("/scripts/{ScriptId}/vars")
// @Route("/scripts/{ScriptId}/vars/{VariableName}")
var GetScriptVariables = (function () {
    function GetScriptVariables() {
    }
    GetScriptVariables.prototype.createResponse = function () { return new ScriptStateVariables(); };
    GetScriptVariables.prototype.getTypeName = function () { return "GetScriptVariables"; };
    return GetScriptVariables;
}());
exports.GetScriptVariables = GetScriptVariables;
// @Route("/scripts/{ScriptId}/evaluate")
var EvaluateExpression = (function () {
    function EvaluateExpression() {
    }
    EvaluateExpression.prototype.createResponse = function () { return new EvaluateExpressionResponse(); };
    EvaluateExpression.prototype.getTypeName = function () { return "EvaluateExpression"; };
    return EvaluateExpression;
}());
exports.EvaluateExpression = EvaluateExpression;
// @Route("/scripts/{ScriptId}/cancel")
var CancelScript = (function () {
    function CancelScript() {
    }
    CancelScript.prototype.createResponse = function () { return new CancelScriptResponse(); };
    CancelScript.prototype.getTypeName = function () { return "CancelScript"; };
    return CancelScript;
}());
exports.CancelScript = CancelScript;
// @Route("/auth")
// @Route("/auth/{provider}")
// @Route("/authenticate")
// @Route("/authenticate/{provider}")
// @DataContract
var Authenticate = (function () {
    function Authenticate() {
    }
    Authenticate.prototype.createResponse = function () { return new AuthenticateResponse(); };
    Authenticate.prototype.getTypeName = function () { return "Authenticate"; };
    return Authenticate;
}());
exports.Authenticate = Authenticate;
// @Route("/assignroles")
// @DataContract
var AssignRoles = (function () {
    function AssignRoles() {
    }
    AssignRoles.prototype.createResponse = function () { return new AssignRolesResponse(); };
    AssignRoles.prototype.getTypeName = function () { return "AssignRoles"; };
    return AssignRoles;
}());
exports.AssignRoles = AssignRoles;
// @Route("/unassignroles")
// @DataContract
var UnAssignRoles = (function () {
    function UnAssignRoles() {
    }
    UnAssignRoles.prototype.createResponse = function () { return new UnAssignRolesResponse(); };
    UnAssignRoles.prototype.getTypeName = function () { return "UnAssignRoles"; };
    return UnAssignRoles;
}());
exports.UnAssignRoles = UnAssignRoles;


/***/ }),

/***/ 334:
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),

/***/ 340:
/***/ (function(module, exports, __webpack_require__) {

"format cjs";
(function (mod) {
    if (true)
        mod(__webpack_require__(7));
    else if (typeof define === "function" && define.amd)
        define(["codemirror"], mod);
    else
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";


});

/***/ }),

/***/ 341:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(149);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./app.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./app.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 342:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(150);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./codemirror.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./codemirror.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 343:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(151);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./collections.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./collections.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 344:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(152);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./dialogs.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./dialogs.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 345:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(153);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./editor.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./editor.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 346:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(154);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js!../../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./material-icons.css", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js!../../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./material-icons.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 347:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(155);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js!../../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./octicon.css", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js!../../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./octicon.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 348:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(156);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(20)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./reset.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/postcss-loader/lib/index.js??ref--5-2!./reset.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 349:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(134);


/***/ }),

/***/ 36:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = __webpack_require__(46);
var utils_1 = __webpack_require__(21);
var servicestack_client_1 = __webpack_require__(14);
var ReactGA = __webpack_require__(29);
var marked = __webpack_require__(72);
var updateHistory = function (id, description, key) {
    if (!id)
        return;
    document.title = description;
    if (history.pushState && (!history.state || history.state[key] != id)) {
        var qs = servicestack_client_1.queryString(location.href);
        var url = servicestack_client_1.splitOnFirst(location.href, '?')[0];
        qs[key] = id;
        delete qs["s"]; //remove ?s=1 from /auth
        delete qs["clear"];
        delete qs["snapshot"];
        delete qs["expression"];
        delete qs["activeFileName"];
        url = servicestack_client_1.appendQueryString(url, qs);
        history.pushState({ gist: qs["gist"], collection: qs["collection"], description: description }, description, url);
        ReactGA.pageview(url);
    }
};
var collectionsCache = {};
var snapshotCache = {};
exports.createGistRequest = function (authUsername, gist) {
    var disableCache = "?t=" + new Date().getTime();
    var urlPrefix = authUsername //Auth requests gets bigger quota
        ? "/github-proxy/"
        : "https://api.github.com/";
    var req = new Request(urlPrefix + "gists/" + gist + disableCache, {
        credentials: authUsername ? "include" : "omit"
    });
    return req;
};
exports.createGistMeta = function (r) { return ({
    id: r.id,
    description: r.description,
    public: r.public,
    created_at: r.created_at,
    updated_at: r.updated_at,
    owner_login: r.owner && r.owner.login,
    owner_id: r.owner && r.owner.id,
    owner_avatar_url: r.owner && r.owner.avatar_url
}); };
exports.getSavedGist = function (id) {
    var json = localStorage.getItem(utils_1.GistCacheKey(id));
    return json
        ? JSON.parse(json)
        : null;
};
exports.saveGist = function (id, gist) {
    localStorage.setItem(utils_1.GistCacheKey(id), JSON.stringify(gist));
};
var handleGistErrorResponse = function (res, store, id) {
    if (res.status === 403) {
        store.dispatch({ type: 'ERROR_RAISE', error: { message: "Github's public API quota has been exceeded, sign-in to continue for more." } });
        return;
    }
    if (res.status === 404) {
        localStorage.removeItem(utils_1.GistCacheKey(id));
        store.dispatch({ type: "GISTSTAT_REMOVE", gist: id });
    }
    store.dispatch({ type: 'ERROR_RAISE', error: { code: res.status, message: "Gist with hash '" + id + "' was " + res.statusText } });
};
var parseMarkdownMeta = function (markdown) {
    var meta = null;
    if (markdown) {
        markdown = markdown.trim();
        if (markdown.startsWith("---")) {
            var endPos = markdown.indexOf("---", "---".length);
            if (endPos >= 0) {
                var metaStr = markdown.substring(0, endPos);
                markdown = markdown.substring(endPos + "---".length);
                var lines = metaStr.split(/\r?\n/);
                meta = {};
                lines.forEach(function (line) {
                    var parts = servicestack_client_1.splitOnFirst(line, ":");
                    if (parts.length !== 2)
                        return;
                    meta[parts[0].trim()] = parts[1].trim();
                });
            }
        }
    }
    return { meta: meta, markdown: markdown };
};
var createCollection = function (store, meta, indexFile) {
    if (!indexFile) {
        store.dispatch({ type: 'ERROR_RAISE', error: { message: "Collection has no '" + utils_1.FileNames.CollectionIndex + "'" } });
        return;
    }
    var md = parseMarkdownMeta(indexFile.content);
    return {
        id: meta.id,
        owner_login: meta.owner_login,
        description: meta.description,
        html: marked(md.markdown),
        meta: md.meta || {}
    };
};
var stateSideEffects = function (store) { return function (next) { return function (action) {
    var oldGist = store.getState().gist;
    var result = next(action);
    var state = store.getState();
    var authUsername = state.activeSub && parseInt(state.activeSub.userId) > 0
        ? state.activeSub.displayName
        : null;
    if (action.type !== "LOAD") {
        localStorage.setItem(utils_1.StateKey, JSON.stringify(state));
    }
    else if (state.meta) {
        updateHistory(state.meta.id, state.meta.description, "gist");
    }
    if (action.type === "URL_CHANGE" && action.url) {
        var parts = servicestack_client_1.splitOnLast(action.url, '/');
        var id_1 = parts[parts.length - 1];
        //If it's cached we already know what it is: 
        var gist = exports.getSavedGist(id_1);
        if (gist) {
            if (gist.files[utils_1.FileNames.CollectionIndex]) {
                store.dispatch({ type: "COLLECTION_CHANGE", collection: { id: id_1 }, showCollection: true });
            }
            else {
                store.dispatch({ type: "GIST_CHANGE", gist: id_1 });
            }
        }
        else if (collectionsCache[id_1]) {
            store.dispatch({ type: "COLLECTION_CHANGE", collection: { id: id_1 }, showCollection: true });
        }
        else if (snapshotCache[id_1]) {
            store.dispatch({ type: "SNAPSHOT_LOAD", snapshot: snapshotCache[id_1] });
        }
        else {
            fetch(exports.createGistRequest(authUsername, id_1))
                .then(function (res) {
                if (!res.ok) {
                    throw res;
                }
                else {
                    return res.json().then(function (r) {
                        var meta = exports.createGistMeta(r);
                        //Populate cache and dispatch appropriate action:
                        if (r.files[utils_1.FileNames.GistMain]) {
                            exports.saveGist(id_1, { meta: meta, files: r.files });
                            store.dispatch({ type: "GIST_CHANGE", gist: id_1 });
                        }
                        else if (r.files[utils_1.FileNames.CollectionIndex]) {
                            collectionsCache[meta.id] = createCollection(store, meta, r.files[utils_1.FileNames.CollectionIndex]);
                            store.dispatch({ type: "COLLECTION_CHANGE", collection: { id: id_1 }, showCollection: true });
                        }
                        else if (r.files[utils_1.FileNames.Snapshot]) {
                            var file = r.files[utils_1.FileNames.Snapshot];
                            var json = file && file.content;
                            try {
                                if (json) {
                                    var snapshot = snapshotCache[meta.id] = JSON.parse(json);
                                    store.dispatch({ type: "SNAPSHOT_LOAD", snapshot: snapshot });
                                }
                                else
                                    throw "Invalid Snapshot";
                            }
                            catch (e) {
                                console.log("ERROR loading snapshot:", e, json);
                                store.dispatch({ type: 'ERROR_RAISE', error: { message: "Gist with hash '" + id_1 + "' is not a valid snapshot" } });
                            }
                        }
                        else {
                            store.dispatch({ type: 'ERROR_RAISE', error: { message: "Gist with hash '" + id_1 + "' has no " + utils_1.FileNames.GistMain + " or " + utils_1.FileNames.CollectionIndex } });
                        }
                    });
                }
            })
                .catch(function (res) { return handleGistErrorResponse(res, store, id_1); });
        }
    }
    var options = action.options || {};
    if (action.type === 'GIST_CHANGE' && action.gist && (options.reload || oldGist !== action.gist || !state.files || !state.meta)) {
        var gist = !options.reload ? exports.getSavedGist(state.gist) : null;
        if (gist) {
            var meta = gist.meta;
            var files = gist.files;
            updateHistory(meta.id, meta.description, "gist");
            store.dispatch({ type: 'GIST_LOAD', meta: meta, files: files, activeFileName: options.activeFileName || utils_1.getSortedFileNames(files)[0] });
        }
        else {
            fetch(exports.createGistRequest(authUsername, action.gist))
                .then(function (res) {
                if (!res.ok) {
                    throw res;
                }
                else {
                    return res.json().then(function (r) {
                        var meta = exports.createGistMeta(r);
                        updateHistory(meta.id, meta.description, "gist");
                        exports.saveGist(state.gist, { meta: meta, files: r.files });
                        store.dispatch({ type: 'GIST_LOAD', meta: meta, files: r.files, activeFileName: options.activeFileName || utils_1.getSortedFileNames(r.files)[0] });
                    });
                }
            })
                .catch(function (res) { return handleGistErrorResponse(res, store, action.gist); });
        }
    }
    else if (action.type === "SOURCE_CHANGE") {
        if (state.gist !== utils_1.GistTemplates.AddServiceStackReferenceGist) {
            exports.saveGist(state.gist, { files: state.files, meta: state.meta });
        }
        if (state.collection && state.collection.id === state.gist && action.fileName === utils_1.FileNames.CollectionIndex) {
            var collection_1 = Object.assign({}, state.collection, { html: marked(action.content) });
            collectionsCache[state.gist] = collection_1;
            store.dispatch({ type: 'COLLECTION_LOAD', collection: collection_1 });
        }
    }
    else if (action.type === "GIST_LOAD") {
        var meta = state.meta;
        if (meta)
            store.dispatch({ type: "GISTSTAT_INCR", gist: meta.id, description: meta.description, stat: "load", step: 1, owner_login: meta.owner_login });
    }
    else if (action.type === "VARS_LOAD") {
        var meta = state.meta;
        if (meta)
            store.dispatch({ type: "GISTSTAT_INCR", gist: meta.id, description: meta.description, stat: "exec", step: 1, owner_login: meta.owner_login });
    }
    else if (action.type === "GISTSTAT_INCR") {
        //console.log(state.gistStats);
    }
    else if (action.type === "COLLECTION_CHANGE" && action.collection && action.showCollection) {
        var id_2 = action.collection.id;
        var gist = exports.getSavedGist(id_2);
        if (gist) {
            collectionsCache[id_2] = createCollection(store, gist.meta, gist.files[utils_1.FileNames.CollectionIndex]);
        }
        var collection = collectionsCache[id_2];
        if (collection) {
            updateHistory(collection.id, collection.description, "collection");
            store.dispatch({ type: 'COLLECTION_LOAD', collection: collection });
            store.dispatch({ type: "GISTSTAT_INCR", gist: id_2, collection: true, description: collection.description, stat: "load", step: 1, owner_login: collection.owner_login });
            if (collection.meta["gist"] && collection.meta["gist"] !== state.gist) {
                store.dispatch({ type: "GIST_CHANGE", gist: collection.meta["gist"] });
            }
        }
        else {
            fetch(exports.createGistRequest(authUsername, id_2))
                .then(function (res) {
                if (!res.ok) {
                    throw res;
                }
                else {
                    return res.json().then(function (r) {
                        var meta = exports.createGistMeta(r);
                        updateHistory(meta.id, meta.description, "collection");
                        collection = createCollection(store, meta, r.files[utils_1.FileNames.CollectionIndex]);
                        collectionsCache[id_2] = collection;
                        store.dispatch({ type: 'COLLECTION_LOAD', collection: collection });
                        store.dispatch({ type: "GISTSTAT_INCR", gist: id_2, collection: true, description: meta.description, stat: "load", step: 1, owner_login: collection.owner_login });
                        if (collection.meta["gist"] && collection.meta["gist"] !== state.gist) {
                            store.dispatch({ type: "GIST_CHANGE", gist: collection.meta["gist"] });
                        }
                    });
                }
            })
                .catch(function (res) { return handleGistErrorResponse(res, store, action.collection.id); });
        }
    }
    return result;
}; }; };
var defaults = {
    version: 1,
    gist: null,
    activeSub: null,
    meta: null,
    files: null,
    activeFileName: null,
    editingFileName: null,
    hasLoaded: false,
    error: null,
    scriptStatus: null,
    logs: [],
    variables: [],
    inspectedVariables: {},
    expression: null,
    expressionResult: null,
    dialog: null,
    gistStats: {},
    dirty: false,
    collection: null,
    snapshot: null,
    showCollection: false
};
var preserveDefaults = function (state) { return ({
    activeSub: state.activeSub,
    gistStats: state.gistStats,
    collection: state.collection,
    showCollection: state.showCollection
}); };
exports.store = redux_1.createStore(function (state, action) {
    //console.log(action);
    switch (action.type) {
        case 'LOAD':
            return action.state;
        case 'RESET':
            return Object.assign({}, defaults, { activeSub: state.activeSub });
        case 'SSE_CONNECT':
            return Object.assign({}, state, { activeSub: action.activeSub, error: null });
        case 'URL_CHANGE':
            return Object.assign({}, state, { url: action.url, error: null });
        case 'GIST_CHANGE':
            return Object.assign({}, defaults, preserveDefaults(state), { gist: action.gist, url: action.gist });
        case 'GIST_LOAD':
            return Object.assign({}, state, { meta: action.meta, files: action.files, activeFileName: action.activeFileName, variables: [], logs: [], hasLoaded: true });
        case 'FILE_SELECT':
            return Object.assign({}, state, { activeFileName: action.activeFileName });
        case 'FILENAME_EDIT':
            return Object.assign({}, state, { editingFileName: action.fileName });
        case 'ERROR_RAISE':
            return Object.assign({}, state, { error: action.error, showCollection: false });
        case 'CONSOLE_LOG':
            return Object.assign({}, state, { logs: state.logs.concat(action.logs) });
        case 'CONSOLE_CLEAR':
            return Object.assign({}, state, { logs: [{ msg: "" }] });
        case 'SCRIPT_STATUS':
            return Object.assign({}, state, { scriptStatus: action.scriptStatus, showCollection: false });
        case 'META_UPDATE':
            return Object.assign({}, state, { meta: Object.assign({}, state.meta, { description: action.description }), dirty: true });
        case 'SOURCE_CHANGE':
            var file = Object.assign({}, state.files[action.fileName], { content: action.content });
            return Object.assign({}, state, { files: Object.assign({}, state.files, (_a = {}, _a[action.fileName] = file, _a)), dirty: true });
        case 'FILE_ADD':
            return Object.assign({}, state, { files: Object.assign({}, state.files, (_b = {}, _b[action.fileName] = action.file, _b)), dirty: true });
        case 'VARS_LOAD':
            return Object.assign({}, state, { variables: action.variables, inspectedVariables: {} });
        case 'VARS_INSPECT':
            return Object.assign({}, state, { inspectedVariables: Object.assign({}, state.inspectedVariables, (_c = {}, _c[action.name] = action.variables, _c)) });
        case 'EXPRESSION_SET':
            return Object.assign({}, state, { expression: action.expression });
        case 'EXPRESSION_LOAD':
            return Object.assign({}, state, { expressionResult: action.expressionResult });
        case 'DIALOG_SHOW':
            return Object.assign({}, state, { dialog: action.dialog });
        case 'DIRTY_SET':
            return Object.assign({}, state, { dirty: action.dirty });
        case 'COLLECTION_CHANGE':
            return Object.assign({}, state, { collection: action.collection, showCollection: action.showCollection, url: action.collection && action.collection.id });
        case 'COLLECTION_LOAD':
            return Object.assign({}, state, { collection: action.collection, showCollection: true });
        case 'SNAPSHOT_LOAD':
            return Object.assign({}, state, action.snapshot, { activeSub: state.activeSub });
        case 'GISTSTAT_INCR':
            var gistStats = state.gistStats;
            var existingStat = gistStats[action.gist];
            var step = state.step || 1;
            return Object.assign({}, state, {
                gistStats: existingStat
                    ? Object.assign({}, gistStats, (_d = {},
                        _d[action.gist] = Object.assign({}, existingStat, (_e = {}, _e[action.stat] = (existingStat[action.stat] || 0) + step, _e.date = new Date().getTime(), _e)),
                        _d))
                    : Object.assign({}, gistStats, (_f = {}, _f[action.gist] = (_g = { id: action.gist, description: action.description, collection: action.collection }, _g[action.stat] = step, _g.owner_login = action.owner_login, _g.date = new Date().getTime(), _g), _f))
            });
        case 'GISTSTAT_REMOVE':
            var clone = Object.assign({}, state.gistStats);
            delete clone[action.gist];
            return Object.assign({}, state, { gistStats: clone });
        default:
            return state;
    }
    var _a, _b, _c, _d, _e, _f, _g;
}, defaults, redux_1.applyMiddleware(stateSideEffects));


/***/ }),

/***/ 47:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

var htmlConfig = {
  autoSelfClosers: {'area': true, 'base': true, 'br': true, 'col': true, 'command': true,
                    'embed': true, 'frame': true, 'hr': true, 'img': true, 'input': true,
                    'keygen': true, 'link': true, 'meta': true, 'param': true, 'source': true,
                    'track': true, 'wbr': true, 'menuitem': true},
  implicitlyClosed: {'dd': true, 'li': true, 'optgroup': true, 'option': true, 'p': true,
                     'rp': true, 'rt': true, 'tbody': true, 'td': true, 'tfoot': true,
                     'th': true, 'tr': true},
  contextGrabbers: {
    'dd': {'dd': true, 'dt': true},
    'dt': {'dd': true, 'dt': true},
    'li': {'li': true},
    'option': {'option': true, 'optgroup': true},
    'optgroup': {'optgroup': true},
    'p': {'address': true, 'article': true, 'aside': true, 'blockquote': true, 'dir': true,
          'div': true, 'dl': true, 'fieldset': true, 'footer': true, 'form': true,
          'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
          'header': true, 'hgroup': true, 'hr': true, 'menu': true, 'nav': true, 'ol': true,
          'p': true, 'pre': true, 'section': true, 'table': true, 'ul': true},
    'rp': {'rp': true, 'rt': true},
    'rt': {'rp': true, 'rt': true},
    'tbody': {'tbody': true, 'tfoot': true},
    'td': {'td': true, 'th': true},
    'tfoot': {'tbody': true},
    'th': {'td': true, 'th': true},
    'thead': {'tbody': true, 'tfoot': true},
    'tr': {'tr': true}
  },
  doNotIndent: {"pre": true},
  allowUnquoted: true,
  allowMissing: true,
  caseFold: true
}

var xmlConfig = {
  autoSelfClosers: {},
  implicitlyClosed: {},
  contextGrabbers: {},
  doNotIndent: {},
  allowUnquoted: false,
  allowMissing: false,
  caseFold: false
}

CodeMirror.defineMode("xml", function(editorConf, config_) {
  var indentUnit = editorConf.indentUnit
  var config = {}
  var defaults = config_.htmlMode ? htmlConfig : xmlConfig
  for (var prop in defaults) config[prop] = defaults[prop]
  for (var prop in config_) config[prop] = config_[prop]

  // Return variables for tokenizers
  var type, setStyle;

  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    var ch = stream.next();
    if (ch == "<") {
      if (stream.eat("!")) {
        if (stream.eat("[")) {
          if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
          else return null;
        } else if (stream.match("--")) {
          return chain(inBlock("comment", "-->"));
        } else if (stream.match("DOCTYPE", true, true)) {
          stream.eatWhile(/[\w\._\-]/);
          return chain(doctype(1));
        } else {
          return null;
        }
      } else if (stream.eat("?")) {
        stream.eatWhile(/[\w\._\-]/);
        state.tokenize = inBlock("meta", "?>");
        return "meta";
      } else {
        type = stream.eat("/") ? "closeTag" : "openTag";
        state.tokenize = inTag;
        return "tag bracket";
      }
    } else if (ch == "&") {
      var ok;
      if (stream.eat("#")) {
        if (stream.eat("x")) {
          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
        } else {
          ok = stream.eatWhile(/[\d]/) && stream.eat(";");
        }
      } else {
        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
      }
      return ok ? "atom" : "error";
    } else {
      stream.eatWhile(/[^&<]/);
      return null;
    }
  }
  inText.isInText = true;

  function inTag(stream, state) {
    var ch = stream.next();
    if (ch == ">" || (ch == "/" && stream.eat(">"))) {
      state.tokenize = inText;
      type = ch == ">" ? "endTag" : "selfcloseTag";
      return "tag bracket";
    } else if (ch == "=") {
      type = "equals";
      return null;
    } else if (ch == "<") {
      state.tokenize = inText;
      state.state = baseState;
      state.tagName = state.tagStart = null;
      var next = state.tokenize(stream, state);
      return next ? next + " tag error" : "tag error";
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch);
      state.stringStartCol = stream.column();
      return state.tokenize(stream, state);
    } else {
      stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
      return "word";
    }
  }

  function inAttribute(quote) {
    var closure = function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inTag;
          break;
        }
      }
      return "string";
    };
    closure.isInAttribute = true;
    return closure;
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText;
          break;
        }
        stream.next();
      }
      return style;
    };
  }
  function doctype(depth) {
    return function(stream, state) {
      var ch;
      while ((ch = stream.next()) != null) {
        if (ch == "<") {
          state.tokenize = doctype(depth + 1);
          return state.tokenize(stream, state);
        } else if (ch == ">") {
          if (depth == 1) {
            state.tokenize = inText;
            break;
          } else {
            state.tokenize = doctype(depth - 1);
            return state.tokenize(stream, state);
          }
        }
      }
      return "meta";
    };
  }

  function Context(state, tagName, startOfLine) {
    this.prev = state.context;
    this.tagName = tagName;
    this.indent = state.indented;
    this.startOfLine = startOfLine;
    if (config.doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.noIndent))
      this.noIndent = true;
  }
  function popContext(state) {
    if (state.context) state.context = state.context.prev;
  }
  function maybePopContext(state, nextTagName) {
    var parentTagName;
    while (true) {
      if (!state.context) {
        return;
      }
      parentTagName = state.context.tagName;
      if (!config.contextGrabbers.hasOwnProperty(parentTagName) ||
          !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
        return;
      }
      popContext(state);
    }
  }

  function baseState(type, stream, state) {
    if (type == "openTag") {
      state.tagStart = stream.column();
      return tagNameState;
    } else if (type == "closeTag") {
      return closeTagNameState;
    } else {
      return baseState;
    }
  }
  function tagNameState(type, stream, state) {
    if (type == "word") {
      state.tagName = stream.current();
      setStyle = "tag";
      return attrState;
    } else {
      setStyle = "error";
      return tagNameState;
    }
  }
  function closeTagNameState(type, stream, state) {
    if (type == "word") {
      var tagName = stream.current();
      if (state.context && state.context.tagName != tagName &&
          config.implicitlyClosed.hasOwnProperty(state.context.tagName))
        popContext(state);
      if ((state.context && state.context.tagName == tagName) || config.matchClosing === false) {
        setStyle = "tag";
        return closeState;
      } else {
        setStyle = "tag error";
        return closeStateErr;
      }
    } else {
      setStyle = "error";
      return closeStateErr;
    }
  }

  function closeState(type, _stream, state) {
    if (type != "endTag") {
      setStyle = "error";
      return closeState;
    }
    popContext(state);
    return baseState;
  }
  function closeStateErr(type, stream, state) {
    setStyle = "error";
    return closeState(type, stream, state);
  }

  function attrState(type, _stream, state) {
    if (type == "word") {
      setStyle = "attribute";
      return attrEqState;
    } else if (type == "endTag" || type == "selfcloseTag") {
      var tagName = state.tagName, tagStart = state.tagStart;
      state.tagName = state.tagStart = null;
      if (type == "selfcloseTag" ||
          config.autoSelfClosers.hasOwnProperty(tagName)) {
        maybePopContext(state, tagName);
      } else {
        maybePopContext(state, tagName);
        state.context = new Context(state, tagName, tagStart == state.indented);
      }
      return baseState;
    }
    setStyle = "error";
    return attrState;
  }
  function attrEqState(type, stream, state) {
    if (type == "equals") return attrValueState;
    if (!config.allowMissing) setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrValueState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    if (type == "word" && config.allowUnquoted) {setStyle = "string"; return attrState;}
    setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrContinuedState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    return attrState(type, stream, state);
  }

  return {
    startState: function(baseIndent) {
      var state = {tokenize: inText,
                   state: baseState,
                   indented: baseIndent || 0,
                   tagName: null, tagStart: null,
                   context: null}
      if (baseIndent != null) state.baseIndent = baseIndent
      return state
    },

    token: function(stream, state) {
      if (!state.tagName && stream.sol())
        state.indented = stream.indentation();

      if (stream.eatSpace()) return null;
      type = null;
      var style = state.tokenize(stream, state);
      if ((style || type) && style != "comment") {
        setStyle = null;
        state.state = state.state(type || style, stream, state);
        if (setStyle)
          style = setStyle == "error" ? style + " error" : setStyle;
      }
      return style;
    },

    indent: function(state, textAfter, fullLine) {
      var context = state.context;
      // Indent multi-line strings (e.g. css).
      if (state.tokenize.isInAttribute) {
        if (state.tagStart == state.indented)
          return state.stringStartCol + 1;
        else
          return state.indented + indentUnit;
      }
      if (context && context.noIndent) return CodeMirror.Pass;
      if (state.tokenize != inTag && state.tokenize != inText)
        return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
      // Indent the starts of attribute names.
      if (state.tagName) {
        if (config.multilineTagIndentPastTag !== false)
          return state.tagStart + state.tagName.length + 2;
        else
          return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1);
      }
      if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
      var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
      if (tagAfter && tagAfter[1]) { // Closing tag spotted
        while (context) {
          if (context.tagName == tagAfter[2]) {
            context = context.prev;
            break;
          } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
            context = context.prev;
          } else {
            break;
          }
        }
      } else if (tagAfter) { // Opening tag spotted
        while (context) {
          var grabbers = config.contextGrabbers[context.tagName];
          if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
            context = context.prev;
          else
            break;
        }
      }
      while (context && context.prev && !context.startOfLine)
        context = context.prev;
      if (context) return context.indent + indentUnit;
      else return state.baseIndent || 0;
    },

    electricInput: /<\/[\s\w:]+>$/,
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",

    configuration: config.htmlMode ? "html" : "xml",
    helperType: config.htmlMode ? "html" : "xml",

    skipAttribute: function(state) {
      if (state.state == attrValueState)
        state.state = attrState
    }
  };
});

CodeMirror.defineMIME("text/xml", "xml");
CodeMirror.defineMIME("application/xml", "xml");
if (!CodeMirror.mimeModes.hasOwnProperty("text/html"))
  CodeMirror.defineMIME("text/html", {name: "xml", htmlMode: true});

});


/***/ }),

/***/ 76:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("css", function(config, parserConfig) {
  var inline = parserConfig.inline
  if (!parserConfig.propertyKeywords) parserConfig = CodeMirror.resolveMode("text/css");

  var indentUnit = config.indentUnit,
      tokenHooks = parserConfig.tokenHooks,
      documentTypes = parserConfig.documentTypes || {},
      mediaTypes = parserConfig.mediaTypes || {},
      mediaFeatures = parserConfig.mediaFeatures || {},
      mediaValueKeywords = parserConfig.mediaValueKeywords || {},
      propertyKeywords = parserConfig.propertyKeywords || {},
      nonStandardPropertyKeywords = parserConfig.nonStandardPropertyKeywords || {},
      fontProperties = parserConfig.fontProperties || {},
      counterDescriptors = parserConfig.counterDescriptors || {},
      colorKeywords = parserConfig.colorKeywords || {},
      valueKeywords = parserConfig.valueKeywords || {},
      allowNested = parserConfig.allowNested,
      lineComment = parserConfig.lineComment,
      supportsAtComponent = parserConfig.supportsAtComponent === true;

  var type, override;
  function ret(style, tp) { type = tp; return style; }

  // Tokenizers

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (tokenHooks[ch]) {
      var result = tokenHooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == "@") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("def", stream.current());
    } else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) {
      return ret(null, "compare");
    } else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "#") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("atom", "hash");
    } else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    } else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    } else if (ch === "-") {
      if (/[\d.]/.test(stream.peek())) {
        stream.eatWhile(/[\w.%]/);
        return ret("number", "unit");
      } else if (stream.match(/^-[\w\\\-]+/)) {
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false))
          return ret("variable-2", "variable-definition");
        return ret("variable-2", "variable");
      } else if (stream.match(/^\w+-/)) {
        return ret("meta", "meta");
      }
    } else if (/[,+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    } else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
      return ret("qualifier", "qualifier");
    } else if (/[:;{}\[\]\(\)]/.test(ch)) {
      return ret(null, ch);
    } else if ((ch == "u" && stream.match(/rl(-prefix)?\(/)) ||
               (ch == "d" && stream.match("omain(")) ||
               (ch == "r" && stream.match("egexp("))) {
      stream.backUp(1);
      state.tokenize = tokenParenthesized;
      return ret("property", "word");
    } else if (/[\w\\\-]/.test(ch)) {
      stream.eatWhile(/[\w\\\-]/);
      return ret("property", "word");
    } else {
      return ret(null, null);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          if (quote == ")") stream.backUp(1);
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      if (ch == quote || !escaped && quote != ")") state.tokenize = null;
      return ret("string", "string");
    };
  }

  function tokenParenthesized(stream, state) {
    stream.next(); // Must be '('
    if (!stream.match(/\s*[\"\')]/, false))
      state.tokenize = tokenString(")");
    else
      state.tokenize = null;
    return ret(null, "(");
  }

  // Context management

  function Context(type, indent, prev) {
    this.type = type;
    this.indent = indent;
    this.prev = prev;
  }

  function pushContext(state, stream, type, indent) {
    state.context = new Context(type, stream.indentation() + (indent === false ? 0 : indentUnit), state.context);
    return type;
  }

  function popContext(state) {
    if (state.context.prev)
      state.context = state.context.prev;
    return state.context.type;
  }

  function pass(type, stream, state) {
    return states[state.context.type](type, stream, state);
  }
  function popAndPass(type, stream, state, n) {
    for (var i = n || 1; i > 0; i--)
      state.context = state.context.prev;
    return pass(type, stream, state);
  }

  // Parser

  function wordAsValue(stream) {
    var word = stream.current().toLowerCase();
    if (valueKeywords.hasOwnProperty(word))
      override = "atom";
    else if (colorKeywords.hasOwnProperty(word))
      override = "keyword";
    else
      override = "variable";
  }

  var states = {};

  states.top = function(type, stream, state) {
    if (type == "{") {
      return pushContext(state, stream, "block");
    } else if (type == "}" && state.context.prev) {
      return popContext(state);
    } else if (supportsAtComponent && /@component/.test(type)) {
      return pushContext(state, stream, "atComponentBlock");
    } else if (/^@(-moz-)?document$/.test(type)) {
      return pushContext(state, stream, "documentTypes");
    } else if (/^@(media|supports|(-moz-)?document|import)$/.test(type)) {
      return pushContext(state, stream, "atBlock");
    } else if (/^@(font-face|counter-style)/.test(type)) {
      state.stateArg = type;
      return "restricted_atBlock_before";
    } else if (/^@(-(moz|ms|o|webkit)-)?keyframes$/.test(type)) {
      return "keyframes";
    } else if (type && type.charAt(0) == "@") {
      return pushContext(state, stream, "at");
    } else if (type == "hash") {
      override = "builtin";
    } else if (type == "word") {
      override = "tag";
    } else if (type == "variable-definition") {
      return "maybeprop";
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    } else if (type == ":") {
      return "pseudo";
    } else if (allowNested && type == "(") {
      return pushContext(state, stream, "parens");
    }
    return state.context.type;
  };

  states.block = function(type, stream, state) {
    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (propertyKeywords.hasOwnProperty(word)) {
        override = "property";
        return "maybeprop";
      } else if (nonStandardPropertyKeywords.hasOwnProperty(word)) {
        override = "string-2";
        return "maybeprop";
      } else if (allowNested) {
        override = stream.match(/^\s*:(?:\s|$)/, false) ? "property" : "tag";
        return "block";
      } else {
        override += " error";
        return "maybeprop";
      }
    } else if (type == "meta") {
      return "block";
    } else if (!allowNested && (type == "hash" || type == "qualifier")) {
      override = "error";
      return "block";
    } else {
      return states.top(type, stream, state);
    }
  };

  states.maybeprop = function(type, stream, state) {
    if (type == ":") return pushContext(state, stream, "prop");
    return pass(type, stream, state);
  };

  states.prop = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" && allowNested) return pushContext(state, stream, "propBlock");
    if (type == "}" || type == "{") return popAndPass(type, stream, state);
    if (type == "(") return pushContext(state, stream, "parens");

    if (type == "hash" && !/^#([0-9a-fA-f]{3,4}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(stream.current())) {
      override += " error";
    } else if (type == "word") {
      wordAsValue(stream);
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    }
    return "prop";
  };

  states.propBlock = function(type, _stream, state) {
    if (type == "}") return popContext(state);
    if (type == "word") { override = "property"; return "maybeprop"; }
    return state.context.type;
  };

  states.parens = function(type, stream, state) {
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == ")") return popContext(state);
    if (type == "(") return pushContext(state, stream, "parens");
    if (type == "interpolation") return pushContext(state, stream, "interpolation");
    if (type == "word") wordAsValue(stream);
    return "parens";
  };

  states.pseudo = function(type, stream, state) {
    if (type == "meta") return "pseudo";

    if (type == "word") {
      override = "variable-3";
      return state.context.type;
    }
    return pass(type, stream, state);
  };

  states.documentTypes = function(type, stream, state) {
    if (type == "word" && documentTypes.hasOwnProperty(stream.current())) {
      override = "tag";
      return state.context.type;
    } else {
      return states.atBlock(type, stream, state);
    }
  };

  states.atBlock = function(type, stream, state) {
    if (type == "(") return pushContext(state, stream, "atBlock_parens");
    if (type == "}" || type == ";") return popAndPass(type, stream, state);
    if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top");

    if (type == "interpolation") return pushContext(state, stream, "interpolation");

    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (word == "only" || word == "not" || word == "and" || word == "or")
        override = "keyword";
      else if (mediaTypes.hasOwnProperty(word))
        override = "attribute";
      else if (mediaFeatures.hasOwnProperty(word))
        override = "property";
      else if (mediaValueKeywords.hasOwnProperty(word))
        override = "keyword";
      else if (propertyKeywords.hasOwnProperty(word))
        override = "property";
      else if (nonStandardPropertyKeywords.hasOwnProperty(word))
        override = "string-2";
      else if (valueKeywords.hasOwnProperty(word))
        override = "atom";
      else if (colorKeywords.hasOwnProperty(word))
        override = "keyword";
      else
        override = "error";
    }
    return state.context.type;
  };

  states.atComponentBlock = function(type, stream, state) {
    if (type == "}")
      return popAndPass(type, stream, state);
    if (type == "{")
      return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top", false);
    if (type == "word")
      override = "error";
    return state.context.type;
  };

  states.atBlock_parens = function(type, stream, state) {
    if (type == ")") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state, 2);
    return states.atBlock(type, stream, state);
  };

  states.restricted_atBlock_before = function(type, stream, state) {
    if (type == "{")
      return pushContext(state, stream, "restricted_atBlock");
    if (type == "word" && state.stateArg == "@counter-style") {
      override = "variable";
      return "restricted_atBlock_before";
    }
    return pass(type, stream, state);
  };

  states.restricted_atBlock = function(type, stream, state) {
    if (type == "}") {
      state.stateArg = null;
      return popContext(state);
    }
    if (type == "word") {
      if ((state.stateArg == "@font-face" && !fontProperties.hasOwnProperty(stream.current().toLowerCase())) ||
          (state.stateArg == "@counter-style" && !counterDescriptors.hasOwnProperty(stream.current().toLowerCase())))
        override = "error";
      else
        override = "property";
      return "maybeprop";
    }
    return "restricted_atBlock";
  };

  states.keyframes = function(type, stream, state) {
    if (type == "word") { override = "variable"; return "keyframes"; }
    if (type == "{") return pushContext(state, stream, "top");
    return pass(type, stream, state);
  };

  states.at = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == "word") override = "tag";
    else if (type == "hash") override = "builtin";
    return "at";
  };

  states.interpolation = function(type, stream, state) {
    if (type == "}") return popContext(state);
    if (type == "{" || type == ";") return popAndPass(type, stream, state);
    if (type == "word") override = "variable";
    else if (type != "variable" && type != "(" && type != ")") override = "error";
    return "interpolation";
  };

  return {
    startState: function(base) {
      return {tokenize: null,
              state: inline ? "block" : "top",
              stateArg: null,
              context: new Context(inline ? "block" : "top", base || 0, null)};
    },

    token: function(stream, state) {
      if (!state.tokenize && stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style && typeof style == "object") {
        type = style[1];
        style = style[0];
      }
      override = style;
      state.state = states[state.state](type, stream, state);
      return override;
    },

    indent: function(state, textAfter) {
      var cx = state.context, ch = textAfter && textAfter.charAt(0);
      var indent = cx.indent;
      if (cx.type == "prop" && (ch == "}" || ch == ")")) cx = cx.prev;
      if (cx.prev) {
        if (ch == "}" && (cx.type == "block" || cx.type == "top" ||
                          cx.type == "interpolation" || cx.type == "restricted_atBlock")) {
          // Resume indentation from parent context.
          cx = cx.prev;
          indent = cx.indent;
        } else if (ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
            ch == "{" && (cx.type == "at" || cx.type == "atBlock")) {
          // Dedent relative to current context.
          indent = Math.max(0, cx.indent - indentUnit);
          cx = cx.prev;
        }
      }
      return indent;
    },

    electricChars: "}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: lineComment,
    fold: "brace"
  };
});

  function keySet(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) {
      keys[array[i].toLowerCase()] = true;
    }
    return keys;
  }

  var documentTypes_ = [
    "domain", "regexp", "url", "url-prefix"
  ], documentTypes = keySet(documentTypes_);

  var mediaTypes_ = [
    "all", "aural", "braille", "handheld", "print", "projection", "screen",
    "tty", "tv", "embossed"
  ], mediaTypes = keySet(mediaTypes_);

  var mediaFeatures_ = [
    "width", "min-width", "max-width", "height", "min-height", "max-height",
    "device-width", "min-device-width", "max-device-width", "device-height",
    "min-device-height", "max-device-height", "aspect-ratio",
    "min-aspect-ratio", "max-aspect-ratio", "device-aspect-ratio",
    "min-device-aspect-ratio", "max-device-aspect-ratio", "color", "min-color",
    "max-color", "color-index", "min-color-index", "max-color-index",
    "monochrome", "min-monochrome", "max-monochrome", "resolution",
    "min-resolution", "max-resolution", "scan", "grid", "orientation",
    "device-pixel-ratio", "min-device-pixel-ratio", "max-device-pixel-ratio",
    "pointer", "any-pointer", "hover", "any-hover"
  ], mediaFeatures = keySet(mediaFeatures_);

  var mediaValueKeywords_ = [
    "landscape", "portrait", "none", "coarse", "fine", "on-demand", "hover",
    "interlace", "progressive"
  ], mediaValueKeywords = keySet(mediaValueKeywords_);

  var propertyKeywords_ = [
    "align-content", "align-items", "align-self", "alignment-adjust",
    "alignment-baseline", "anchor-point", "animation", "animation-delay",
    "animation-direction", "animation-duration", "animation-fill-mode",
    "animation-iteration-count", "animation-name", "animation-play-state",
    "animation-timing-function", "appearance", "azimuth", "backface-visibility",
    "background", "background-attachment", "background-blend-mode", "background-clip",
    "background-color", "background-image", "background-origin", "background-position",
    "background-repeat", "background-size", "baseline-shift", "binding",
    "bleed", "bookmark-label", "bookmark-level", "bookmark-state",
    "bookmark-target", "border", "border-bottom", "border-bottom-color",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-bottom-style", "border-bottom-width", "border-collapse",
    "border-color", "border-image", "border-image-outset",
    "border-image-repeat", "border-image-slice", "border-image-source",
    "border-image-width", "border-left", "border-left-color",
    "border-left-style", "border-left-width", "border-radius", "border-right",
    "border-right-color", "border-right-style", "border-right-width",
    "border-spacing", "border-style", "border-top", "border-top-color",
    "border-top-left-radius", "border-top-right-radius", "border-top-style",
    "border-top-width", "border-width", "bottom", "box-decoration-break",
    "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
    "caption-side", "clear", "clip", "color", "color-profile", "column-count",
    "column-fill", "column-gap", "column-rule", "column-rule-color",
    "column-rule-style", "column-rule-width", "column-span", "column-width",
    "columns", "content", "counter-increment", "counter-reset", "crop", "cue",
    "cue-after", "cue-before", "cursor", "direction", "display",
    "dominant-baseline", "drop-initial-after-adjust",
    "drop-initial-after-align", "drop-initial-before-adjust",
    "drop-initial-before-align", "drop-initial-size", "drop-initial-value",
    "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis",
    "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
    "float", "float-offset", "flow-from", "flow-into", "font", "font-feature-settings",
    "font-family", "font-kerning", "font-language-override", "font-size", "font-size-adjust",
    "font-stretch", "font-style", "font-synthesis", "font-variant",
    "font-variant-alternates", "font-variant-caps", "font-variant-east-asian",
    "font-variant-ligatures", "font-variant-numeric", "font-variant-position",
    "font-weight", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow",
    "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-gap",
    "grid-column-start", "grid-gap", "grid-row", "grid-row-end", "grid-row-gap",
    "grid-row-start", "grid-template", "grid-template-areas", "grid-template-columns",
    "grid-template-rows", "hanging-punctuation", "height", "hyphens",
    "icon", "image-orientation", "image-rendering", "image-resolution",
    "inline-box-align", "justify-content", "left", "letter-spacing",
    "line-break", "line-height", "line-stacking", "line-stacking-ruby",
    "line-stacking-shift", "line-stacking-strategy", "list-style",
    "list-style-image", "list-style-position", "list-style-type", "margin",
    "margin-bottom", "margin-left", "margin-right", "margin-top",
    "marks", "marquee-direction", "marquee-loop",
    "marquee-play-count", "marquee-speed", "marquee-style", "max-height",
    "max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index",
    "nav-left", "nav-right", "nav-up", "object-fit", "object-position",
    "opacity", "order", "orphans", "outline",
    "outline-color", "outline-offset", "outline-style", "outline-width",
    "overflow", "overflow-style", "overflow-wrap", "overflow-x", "overflow-y",
    "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
    "page", "page-break-after", "page-break-before", "page-break-inside",
    "page-policy", "pause", "pause-after", "pause-before", "perspective",
    "perspective-origin", "pitch", "pitch-range", "play-during", "position",
    "presentation-level", "punctuation-trim", "quotes", "region-break-after",
    "region-break-before", "region-break-inside", "region-fragment",
    "rendering-intent", "resize", "rest", "rest-after", "rest-before", "richness",
    "right", "rotation", "rotation-point", "ruby-align", "ruby-overhang",
    "ruby-position", "ruby-span", "shape-image-threshold", "shape-inside", "shape-margin",
    "shape-outside", "size", "speak", "speak-as", "speak-header",
    "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set",
    "tab-size", "table-layout", "target", "target-name", "target-new",
    "target-position", "text-align", "text-align-last", "text-decoration",
    "text-decoration-color", "text-decoration-line", "text-decoration-skip",
    "text-decoration-style", "text-emphasis", "text-emphasis-color",
    "text-emphasis-position", "text-emphasis-style", "text-height",
    "text-indent", "text-justify", "text-outline", "text-overflow", "text-shadow",
    "text-size-adjust", "text-space-collapse", "text-transform", "text-underline-position",
    "text-wrap", "top", "transform", "transform-origin", "transform-style",
    "transition", "transition-delay", "transition-duration",
    "transition-property", "transition-timing-function", "unicode-bidi",
    "user-select", "vertical-align", "visibility", "voice-balance", "voice-duration",
    "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress",
    "voice-volume", "volume", "white-space", "widows", "width", "will-change", "word-break",
    "word-spacing", "word-wrap", "z-index",
    // SVG-specific
    "clip-path", "clip-rule", "mask", "enable-background", "filter", "flood-color",
    "flood-opacity", "lighting-color", "stop-color", "stop-opacity", "pointer-events",
    "color-interpolation", "color-interpolation-filters",
    "color-rendering", "fill", "fill-opacity", "fill-rule", "image-rendering",
    "marker", "marker-end", "marker-mid", "marker-start", "shape-rendering", "stroke",
    "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
    "stroke-miterlimit", "stroke-opacity", "stroke-width", "text-rendering",
    "baseline-shift", "dominant-baseline", "glyph-orientation-horizontal",
    "glyph-orientation-vertical", "text-anchor", "writing-mode"
  ], propertyKeywords = keySet(propertyKeywords_);

  var nonStandardPropertyKeywords_ = [
    "scrollbar-arrow-color", "scrollbar-base-color", "scrollbar-dark-shadow-color",
    "scrollbar-face-color", "scrollbar-highlight-color", "scrollbar-shadow-color",
    "scrollbar-3d-light-color", "scrollbar-track-color", "shape-inside",
    "searchfield-cancel-button", "searchfield-decoration", "searchfield-results-button",
    "searchfield-results-decoration", "zoom"
  ], nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_);

  var fontProperties_ = [
    "font-family", "src", "unicode-range", "font-variant", "font-feature-settings",
    "font-stretch", "font-weight", "font-style"
  ], fontProperties = keySet(fontProperties_);

  var counterDescriptors_ = [
    "additive-symbols", "fallback", "negative", "pad", "prefix", "range",
    "speak-as", "suffix", "symbols", "system"
  ], counterDescriptors = keySet(counterDescriptors_);

  var colorKeywords_ = [
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
    "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
    "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue",
    "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod",
    "darkgray", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen",
    "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen",
    "darkslateblue", "darkslategray", "darkturquoise", "darkviolet",
    "deeppink", "deepskyblue", "dimgray", "dodgerblue", "firebrick",
    "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
    "gold", "goldenrod", "gray", "grey", "green", "greenyellow", "honeydew",
    "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
    "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral",
    "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink",
    "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
    "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta",
    "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple",
    "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise",
    "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered",
    "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
    "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue",
    "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown",
    "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue",
    "slateblue", "slategray", "snow", "springgreen", "steelblue", "tan",
    "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white",
    "whitesmoke", "yellow", "yellowgreen"
  ], colorKeywords = keySet(colorKeywords_);

  var valueKeywords_ = [
    "above", "absolute", "activeborder", "additive", "activecaption", "afar",
    "after-white-space", "ahead", "alias", "all", "all-scroll", "alphabetic", "alternate",
    "always", "amharic", "amharic-abegede", "antialiased", "appworkspace",
    "arabic-indic", "armenian", "asterisks", "attr", "auto", "auto-flow", "avoid", "avoid-column", "avoid-page",
    "avoid-region", "background", "backwards", "baseline", "below", "bidi-override", "binary",
    "bengali", "blink", "block", "block-axis", "bold", "bolder", "border", "border-box",
    "both", "bottom", "break", "break-all", "break-word", "bullets", "button", "button-bevel",
    "buttonface", "buttonhighlight", "buttonshadow", "buttontext", "calc", "cambodian",
    "capitalize", "caps-lock-indicator", "caption", "captiontext", "caret",
    "cell", "center", "checkbox", "circle", "cjk-decimal", "cjk-earthly-branch",
    "cjk-heavenly-stem", "cjk-ideographic", "clear", "clip", "close-quote",
    "col-resize", "collapse", "color", "color-burn", "color-dodge", "column", "column-reverse",
    "compact", "condensed", "contain", "content", "contents",
    "content-box", "context-menu", "continuous", "copy", "counter", "counters", "cover", "crop",
    "cross", "crosshair", "currentcolor", "cursive", "cyclic", "darken", "dashed", "decimal",
    "decimal-leading-zero", "default", "default-button", "dense", "destination-atop",
    "destination-in", "destination-out", "destination-over", "devanagari", "difference",
    "disc", "discard", "disclosure-closed", "disclosure-open", "document",
    "dot-dash", "dot-dot-dash",
    "dotted", "double", "down", "e-resize", "ease", "ease-in", "ease-in-out", "ease-out",
    "element", "ellipse", "ellipsis", "embed", "end", "ethiopic", "ethiopic-abegede",
    "ethiopic-abegede-am-et", "ethiopic-abegede-gez", "ethiopic-abegede-ti-er",
    "ethiopic-abegede-ti-et", "ethiopic-halehame-aa-er",
    "ethiopic-halehame-aa-et", "ethiopic-halehame-am-et",
    "ethiopic-halehame-gez", "ethiopic-halehame-om-et",
    "ethiopic-halehame-sid-et", "ethiopic-halehame-so-et",
    "ethiopic-halehame-ti-er", "ethiopic-halehame-ti-et", "ethiopic-halehame-tig",
    "ethiopic-numeric", "ew-resize", "exclusion", "expanded", "extends", "extra-condensed",
    "extra-expanded", "fantasy", "fast", "fill", "fixed", "flat", "flex", "flex-end", "flex-start", "footnotes",
    "forwards", "from", "geometricPrecision", "georgian", "graytext", "grid", "groove",
    "gujarati", "gurmukhi", "hand", "hangul", "hangul-consonant", "hard-light", "hebrew",
    "help", "hidden", "hide", "higher", "highlight", "highlighttext",
    "hiragana", "hiragana-iroha", "horizontal", "hsl", "hsla", "hue", "icon", "ignore",
    "inactiveborder", "inactivecaption", "inactivecaptiontext", "infinite",
    "infobackground", "infotext", "inherit", "initial", "inline", "inline-axis",
    "inline-block", "inline-flex", "inline-grid", "inline-table", "inset", "inside", "intrinsic", "invert",
    "italic", "japanese-formal", "japanese-informal", "justify", "kannada",
    "katakana", "katakana-iroha", "keep-all", "khmer",
    "korean-hangul-formal", "korean-hanja-formal", "korean-hanja-informal",
    "landscape", "lao", "large", "larger", "left", "level", "lighter", "lighten",
    "line-through", "linear", "linear-gradient", "lines", "list-item", "listbox", "listitem",
    "local", "logical", "loud", "lower", "lower-alpha", "lower-armenian",
    "lower-greek", "lower-hexadecimal", "lower-latin", "lower-norwegian",
    "lower-roman", "lowercase", "ltr", "luminosity", "malayalam", "match", "matrix", "matrix3d",
    "media-controls-background", "media-current-time-display",
    "media-fullscreen-button", "media-mute-button", "media-play-button",
    "media-return-to-realtime-button", "media-rewind-button",
    "media-seek-back-button", "media-seek-forward-button", "media-slider",
    "media-sliderthumb", "media-time-remaining-display", "media-volume-slider",
    "media-volume-slider-container", "media-volume-sliderthumb", "medium",
    "menu", "menulist", "menulist-button", "menulist-text",
    "menulist-textfield", "menutext", "message-box", "middle", "min-intrinsic",
    "mix", "mongolian", "monospace", "move", "multiple", "multiply", "myanmar", "n-resize",
    "narrower", "ne-resize", "nesw-resize", "no-close-quote", "no-drop",
    "no-open-quote", "no-repeat", "none", "normal", "not-allowed", "nowrap",
    "ns-resize", "numbers", "numeric", "nw-resize", "nwse-resize", "oblique", "octal", "opacity", "open-quote",
    "optimizeLegibility", "optimizeSpeed", "oriya", "oromo", "outset",
    "outside", "outside-shape", "overlay", "overline", "padding", "padding-box",
    "painted", "page", "paused", "persian", "perspective", "plus-darker", "plus-lighter",
    "pointer", "polygon", "portrait", "pre", "pre-line", "pre-wrap", "preserve-3d",
    "progress", "push-button", "radial-gradient", "radio", "read-only",
    "read-write", "read-write-plaintext-only", "rectangle", "region",
    "relative", "repeat", "repeating-linear-gradient",
    "repeating-radial-gradient", "repeat-x", "repeat-y", "reset", "reverse",
    "rgb", "rgba", "ridge", "right", "rotate", "rotate3d", "rotateX", "rotateY",
    "rotateZ", "round", "row", "row-resize", "row-reverse", "rtl", "run-in", "running",
    "s-resize", "sans-serif", "saturation", "scale", "scale3d", "scaleX", "scaleY", "scaleZ", "screen",
    "scroll", "scrollbar", "scroll-position", "se-resize", "searchfield",
    "searchfield-cancel-button", "searchfield-decoration",
    "searchfield-results-button", "searchfield-results-decoration",
    "semi-condensed", "semi-expanded", "separate", "serif", "show", "sidama",
    "simp-chinese-formal", "simp-chinese-informal", "single",
    "skew", "skewX", "skewY", "skip-white-space", "slide", "slider-horizontal",
    "slider-vertical", "sliderthumb-horizontal", "sliderthumb-vertical", "slow",
    "small", "small-caps", "small-caption", "smaller", "soft-light", "solid", "somali",
    "source-atop", "source-in", "source-out", "source-over", "space", "space-around", "space-between", "spell-out", "square",
    "square-button", "start", "static", "status-bar", "stretch", "stroke", "sub",
    "subpixel-antialiased", "super", "sw-resize", "symbolic", "symbols", "system-ui", "table",
    "table-caption", "table-cell", "table-column", "table-column-group",
    "table-footer-group", "table-header-group", "table-row", "table-row-group",
    "tamil",
    "telugu", "text", "text-bottom", "text-top", "textarea", "textfield", "thai",
    "thick", "thin", "threeddarkshadow", "threedface", "threedhighlight",
    "threedlightshadow", "threedshadow", "tibetan", "tigre", "tigrinya-er",
    "tigrinya-er-abegede", "tigrinya-et", "tigrinya-et-abegede", "to", "top",
    "trad-chinese-formal", "trad-chinese-informal", "transform",
    "translate", "translate3d", "translateX", "translateY", "translateZ",
    "transparent", "ultra-condensed", "ultra-expanded", "underline", "unset", "up",
    "upper-alpha", "upper-armenian", "upper-greek", "upper-hexadecimal",
    "upper-latin", "upper-norwegian", "upper-roman", "uppercase", "urdu", "url",
    "var", "vertical", "vertical-text", "visible", "visibleFill", "visiblePainted",
    "visibleStroke", "visual", "w-resize", "wait", "wave", "wider",
    "window", "windowframe", "windowtext", "words", "wrap", "wrap-reverse", "x-large", "x-small", "xor",
    "xx-large", "xx-small"
  ], valueKeywords = keySet(valueKeywords_);

  var allWords = documentTypes_.concat(mediaTypes_).concat(mediaFeatures_).concat(mediaValueKeywords_)
    .concat(propertyKeywords_).concat(nonStandardPropertyKeywords_).concat(colorKeywords_)
    .concat(valueKeywords_);
  CodeMirror.registerHelper("hintWords", "css", allWords);

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ["comment", "comment"];
  }

  CodeMirror.defineMIME("text/css", {
    documentTypes: documentTypes,
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    fontProperties: fontProperties,
    counterDescriptors: counterDescriptors,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    tokenHooks: {
      "/": function(stream, state) {
        if (!stream.eat("*")) return false;
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
    },
    name: "css"
  });

  CodeMirror.defineMIME("text/x-scss", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    lineComment: "//",
    tokenHooks: {
      "/": function(stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      ":": function(stream) {
        if (stream.match(/\s*\{/, false))
          return [null, null]
        return false;
      },
      "$": function(stream) {
        stream.match(/^[\w-]+/);
        if (stream.match(/^\s*:/, false))
          return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "#": function(stream) {
        if (!stream.eat("{")) return false;
        return [null, "interpolation"];
      }
    },
    name: "css",
    helperType: "scss"
  });

  CodeMirror.defineMIME("text/x-less", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    lineComment: "//",
    tokenHooks: {
      "/": function(stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      "@": function(stream) {
        if (stream.eat("{")) return [null, "interpolation"];
        if (stream.match(/^(charset|document|font-face|import|(-(moz|ms|o|webkit)-)?keyframes|media|namespace|page|supports)\b/, false)) return false;
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false))
          return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "&": function() {
        return ["atom", "atom"];
      }
    },
    name: "css",
    helperType: "less"
  });

  CodeMirror.defineMIME("text/x-gss", {
    documentTypes: documentTypes,
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    fontProperties: fontProperties,
    counterDescriptors: counterDescriptors,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    supportsAtComponent: true,
    tokenHooks: {
      "/": function(stream, state) {
        if (!stream.eat("*")) return false;
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
    },
    name: "css",
    helperType: "gss"
  });

});


/***/ }),

/***/ 77:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

function expressionAllowed(stream, state, backUp) {
  return /^(?:operator|sof|keyword c|case|new|export|default|[\[{}\(,;:]|=>)$/.test(state.lastType) ||
    (state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0))))
}

CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonldMode = parserConfig.jsonld;
  var jsonMode = parserConfig.json || jsonldMode;
  var isTS = parserConfig.typescript;
  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    var jsKeywords = {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": C, "break": C, "continue": C, "new": kw("new"), "delete": C, "throw": C, "debugger": C,
      "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C,
      "await": C, "async": kw("async")
    };

    // Extend the 'normal' keywords with the TypeScript language extensions
    if (isTS) {
      var type = {type: "variable", style: "variable-3"};
      var tsKeywords = {
        // object-like things
        "interface": kw("class"),
        "implements": C,
        "namespace": C,
        "module": kw("module"),
        "enum": kw("module"),
        "type": kw("type"),

        // scope modifiers
        "public": kw("modifier"),
        "private": kw("modifier"),
        "protected": kw("modifier"),
        "abstract": kw("modifier"),

        // operators
        "as": operator,

        // types
        "string": type, "number": type, "boolean": type, "any": type
      };

      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr];
      }
    }

    return jsKeywords;
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

  function readRegexp(stream) {
    var escaped = false, next, inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;
        else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/o/i)) {
      stream.eatWhile(/[0-7]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/b/i)) {
      stream.eatWhile(/[01]/i);
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (expressionAllowed(stream, state, 1)) {
        readRegexp(stream);
        stream.match(/^\b(([gimyu])(?![gimyu]*\2))+\b/);
        return ret("regexp", "string-2");
      } else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    } else if (isOperatorChar.test(ch)) {
      if (ch != ">" || !state.lexical || state.lexical.type != ">")
        stream.eatWhile(isOperatorChar);
      return ret("operator", "operator", stream.current());
    } else if (wordRE.test(ch)) {
      stream.eatWhile(wordRE);
      var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
      return (known && state.lastType != ".") ? ret(known.type, known.style, word) :
                     ret("variable", "variable", word);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
        state.tokenize = tokenBase;
        return ret("jsonld-keyword", "meta");
      }
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenQuasi(stream, state) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }

  var brackets = "([{}])";
  // This is a crude lookahead trick to try and notice that we're
  // parsing the argument patterns for a fat-arrow function before we
  // actually hit the arrow token. It only works if the arrow is on
  // the same line as the arguments and there's no strange noise
  // (comments) in between. Fallback is to only notice when we hit the
  // arrow, and not declare the arguments as locals for the arrow
  // body.
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;

    if (isTS) { // Try to skip TypeScript return type declarations after the arguments
      var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow))
      if (m) arrow = m.index
    }

    var depth = 0, sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) { ++pos; break; }
        if (--depth == 0) { if (ch == "(") sawSomething = true; break; }
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (wordRE.test(ch)) {
        sawSomething = true;
      } else if (/["'\/]/.test(ch)) {
        return;
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true, "jsonld-keyword": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next)
        if (v.name == varname) return true;
    }
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    function inList(list) {
      for (var v = list; v; v = v.next)
        if (v.name == varname) return true;
      return false;
    }
    var state = cx.state;
    cx.marked = "def";
    if (state.context) {
      if (inList(state.localVars)) return;
      state.localVars = {name: varname, next: state.localVars};
    } else {
      if (inList(state.globalVars)) return;
      if (parserConfig.globalVars)
        state.globalVars = {name: varname, next: state.globalVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: {name: "arguments"}};
  function pushcontext() {
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
    cx.state.localVars = defaultVars;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
        indent = outer.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function exp(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(exp);
    };
    return exp;
  }

  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value.length), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), parenExpr, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), block, poplex);
    if (type == ";") return cont();
    if (type == "if") {
      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
        cx.state.cc.pop()();
      return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
    }
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), forspec, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), parenExpr, pushlex("}", "switch"), expect("{"),
                                      block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                     statement, poplex, popcontext);
    if (type == "class") return cont(pushlex("form"), className, poplex);
    if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
    if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
    if (type == "module") return cont(pushlex("form"), pattern, pushlex("}"), expect("{"), block, poplex, poplex)
    if (type == "type") return cont(typeexpr, expect("operator"), typeexpr, expect(";"));
    if (type == "async") return cont(statement)
    if (value == "@") return cont(expression, statement)
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    return expressionInner(type, false);
  }
  function expressionNoComma(type) {
    return expressionInner(type, true);
  }
  function parenExpr(type) {
    if (type != "(") return pass()
    return cont(pushlex(")"), expression, expect(")"), poplex)
  }
  function expressionInner(type, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(pattern, ")"), poplex, expect("=>"), body, popcontext);
      else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }

    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef, maybeop);
    if (type == "class") return cont(pushlex("form"), classExpression, poplex);
    if (type == "keyword c" || type == "async") return cont(noComma ? maybeexpressionNoComma : maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    if (type == "quasi") return pass(quasi, maybeop);
    if (type == "new") return cont(maybeTarget(noComma));
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }
  function maybeexpressionNoComma(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expressionNoComma);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value)) return cont(me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") { return pass(quasi, me); }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
  }
  function quasi(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasi);
    return cont(expression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasi);
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expressionNoComma);
  }
  function maybeTarget(noComma) {
    return function(type) {
      if (type == ".") return cont(noComma ? targetNoComma : target);
      else return pass(noComma ? expressionNoComma : expression);
    };
  }
  function target(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
  }
  function targetNoComma(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "async") {
      cx.marked = "property";
      return cont(objprop);
    } else if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
      return cont(afterprop);
    } else if (type == "number" || type == "string") {
      cx.marked = jsonldMode ? "property" : (cx.style + " property");
      return cont(afterprop);
    } else if (type == "jsonld-keyword") {
      return cont(afterprop);
    } else if (type == "modifier") {
      return cont(objprop)
    } else if (type == "[") {
      return cont(expression, expect("]"), afterprop);
    } else if (type == "spread") {
      return cont(expression);
    } else if (type == ":") {
      return pass(afterprop)
    }
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end, sep) {
    function proceed(type, value) {
      if (sep ? sep.indexOf(type) > -1 : type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(function(type, value) {
          if (type == end || value == end) return pass()
          return pass(what)
        }, proceed);
      }
      if (type == end || value == end) return cont();
      return cont(expect(end));
    }
    return function(type, value) {
      if (type == end || value == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++)
      cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type, value) {
    if (isTS) {
      if (type == ":") return cont(typeexpr);
      if (value == "?") return cont(maybetype);
    }
  }
  function typeexpr(type) {
    if (type == "variable") {cx.marked = "variable-3"; return cont(afterType);}
    if (type == "string" || type == "number" || type == "atom") return cont(afterType);
    if (type == "{") return cont(pushlex("}"), commasep(typeprop, "}", ",;"), poplex)
    if (type == "(") return cont(commasep(typearg, ")"), maybeReturnType)
  }
  function maybeReturnType(type) {
    if (type == "=>") return cont(typeexpr)
  }
  function typeprop(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property"
      return cont(typeprop)
    } else if (value == "?") {
      return cont(typeprop)
    } else if (type == ":") {
      return cont(typeexpr)
    }
  }
  function typearg(type) {
    if (type == "variable") return cont(typearg)
    else if (type == ":") return cont(typeexpr)
  }
  function afterType(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType)
    if (value == "|" || type == ".") return cont(typeexpr)
    if (type == "[") return cont(expect("]"), afterType)
  }
  function vardef() {
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (type == "modifier") return cont(pattern)
    if (type == "variable") { register(value); return cont(); }
    if (type == "spread") return cont(pattern);
    if (type == "[") return contCommasep(pattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    if (type == "spread") return cont(pattern);
    if (type == "}") return pass();
    return cont(expect(":"), pattern, maybeAssign);
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
  }
  function forspec(type) {
    if (type == "(") return cont(pushlex(")"), forspec1, expect(")"), poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, expect(";"), forspec2);
    if (type == ";") return cont(forspec2);
    if (type == "variable") return cont(formaybeinof);
    return pass(expression, expect(";"), forspec2);
  }
  function formaybeinof(_type, value) {
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return cont(maybeoperatorComma, forspec2);
  }
  function forspec2(type, value) {
    if (type == ";") return cont(forspec3);
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return pass(expression, expect(";"), forspec3);
  }
  function forspec3(type) {
    if (type != ")") cont(expression);
  }
  function functiondef(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, maybetype, statement, popcontext);
    if (isTS && value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, functiondef)
  }
  function funarg(type) {
    if (type == "spread") return cont(funarg);
    return pass(pattern, maybetype, maybeAssign);
  }
  function classExpression(type, value) {
    // Class expressions may have an optional name.
    if (type == "variable") return className(type, value);
    return classNameAfter(type, value);
  }
  function className(type, value) {
    if (type == "variable") {register(value); return cont(classNameAfter);}
  }
  function classNameAfter(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, classNameAfter)
    if (value == "extends" || value == "implements" || (isTS && type == ","))
      return cont(isTS ? typeexpr : expression, classNameAfter);
    if (type == "{") return cont(pushlex("}"), classBody, poplex);
  }
  function classBody(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      if ((value == "async" || value == "static" || value == "get" || value == "set" ||
           (isTS && (value == "public" || value == "private" || value == "protected" || value == "readonly" || value == "abstract"))) &&
          cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false)) {
        cx.marked = "keyword";
        return cont(classBody);
      }
      cx.marked = "property";
      return cont(isTS ? classfield : functiondef, classBody);
    }
    if (type == "[")
      return cont(expression, expect("]"), isTS ? classfield : functiondef, classBody)
    if (value == "*") {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (type == ";") return cont(classBody);
    if (type == "}") return cont();
    if (value == "@") return cont(expression, classBody)
  }
  function classfield(type, value) {
    if (value == "?") return cont(classfield)
    if (type == ":") return cont(typeexpr, maybeAssign)
    if (value == "=") return cont(expressionNoComma)
    return pass(functiondef)
  }
  function afterExport(type, value) {
    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
    if (type == "{") return cont(commasep(exportField, "}"), maybeFrom, expect(";"));
    return pass(statement);
  }
  function exportField(type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(expect("variable")); }
    if (type == "variable") return pass(expressionNoComma, exportField);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    return pass(importSpec, maybeMoreImports, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    if (value == "*") cx.marked = "keyword";
    return cont(maybeAs);
  }
  function maybeMoreImports(type) {
    if (type == ",") return cont(importSpec, maybeMoreImports)
  }
  function maybeAs(_type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
  }
  function maybeFrom(_type, value) {
    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(commasep(expressionNoComma, "]"));
  }

  function isContinuedStatement(state, textAfter) {
    return state.lastType == "operator" || state.lastType == "," ||
      isOperatorChar.test(textAfter.charAt(0)) ||
      /[,.]/.test(textAfter.charAt(0));
  }

  // Interface

  return {
    startState: function(basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && {vars: parserConfig.localVars},
        indented: basecolumn || 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == tokenComment) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top
      // Kludge to prevent 'maybelse' from blocking lexical scope pops
      if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;
        else if (c != maybeelse) break;
      }
      while ((lexical.type == "stat" || lexical.type == "form") &&
             (firstChar == "}" || ((top = state.cc[state.cc.length - 1]) &&
                                   (top == maybeoperatorComma || top == maybeoperatorNoComma) &&
                                   !/^[,\.=+\-*:?[\(]/.test(textAfter))))
        lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info + 1 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    closeBrackets: "()[]{}''\"\"``",

    helperType: jsonMode ? "json" : "javascript",
    jsonldMode: jsonldMode,
    jsonMode: jsonMode,

    expressionAllowed: expressionAllowed,
    skipExpression: function(state) {
      var top = state.cc[state.cc.length - 1]
      if (top == expression || top == expressionNoComma) state.cc.pop()
    }
  };
});

CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/x-javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/ld+json", {name: "javascript", jsonld: true});
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

});


/***/ }),

/***/ 78:
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(7), __webpack_require__(47), __webpack_require__(175));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../meta"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

  var htmlMode = CodeMirror.getMode(cmCfg, "text/html");
  var htmlModeMissing = htmlMode.name == "null"

  function getMode(name) {
    if (CodeMirror.findModeByName) {
      var found = CodeMirror.findModeByName(name);
      if (found) name = found.mime || found.mimes[0];
    }
    var mode = CodeMirror.getMode(cmCfg, name);
    return mode.name == "null" ? null : mode;
  }

  // Should characters that affect highlighting be highlighted separate?
  // Does not include characters that will be output (such as `1.` and `-` for lists)
  if (modeCfg.highlightFormatting === undefined)
    modeCfg.highlightFormatting = false;

  // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
  // Excess `>` will emit `error` token.
  if (modeCfg.maxBlockquoteDepth === undefined)
    modeCfg.maxBlockquoteDepth = 0;

  // Use `fencedCodeBlocks` to configure fenced code blocks. false to
  // disable, string to specify a precise regexp that the fence should
  // match, and true to allow three or more backticks or tildes (as
  // per CommonMark).

  // Turn on task lists? ("- [ ] " and "- [x] ")
  if (modeCfg.taskLists === undefined) modeCfg.taskLists = false;

  // Turn on strikethrough syntax
  if (modeCfg.strikethrough === undefined)
    modeCfg.strikethrough = false;

  // Allow token types to be overridden by user-provided token types.
  if (modeCfg.tokenTypeOverrides === undefined)
    modeCfg.tokenTypeOverrides = {};

  var tokenTypes = {
    header: "header",
    code: "comment",
    quote: "quote",
    list1: "variable-2",
    list2: "variable-3",
    list3: "keyword",
    hr: "hr",
    image: "image",
    imageAltText: "image-alt-text",
    imageMarker: "image-marker",
    formatting: "formatting",
    linkInline: "link",
    linkEmail: "link",
    linkText: "link",
    linkHref: "string",
    em: "em",
    strong: "strong",
    strikethrough: "strikethrough"
  };

  for (var tokenType in tokenTypes) {
    if (tokenTypes.hasOwnProperty(tokenType) && modeCfg.tokenTypeOverrides[tokenType]) {
      tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
    }
  }

  var hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/
  ,   listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/
  ,   taskListRE = /^\[(x| )\](?=\s)/ // Must follow listRE
  ,   atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/
  ,   setextHeaderRE = /^ *(?:\={1,}|-{1,})\s*$/
  ,   textRE = /^[^#!\[\]*_\\<>` "'(~]+/
  ,   fencedCodeRE = new RegExp("^(" + (modeCfg.fencedCodeBlocks === true ? "~~~+|```+" : modeCfg.fencedCodeBlocks) +
                                ")[ \\t]*([\\w+#\-]*)")
  ,   punctuation = /[!\"#$%&\'()*+,\-\.\/:;<=>?@\[\\\]^_`{|}~—]/

  function switchInline(stream, state, f) {
    state.f = state.inline = f;
    return f(stream, state);
  }

  function switchBlock(stream, state, f) {
    state.f = state.block = f;
    return f(stream, state);
  }

  function lineIsEmpty(line) {
    return !line || !/\S/.test(line.string)
  }

  // Blocks

  function blankLine(state) {
    // Reset linkTitle state
    state.linkTitle = false;
    // Reset EM state
    state.em = false;
    // Reset STRONG state
    state.strong = false;
    // Reset strikethrough state
    state.strikethrough = false;
    // Reset state.quote
    state.quote = 0;
    // Reset state.indentedCode
    state.indentedCode = false;
    if (state.f == htmlBlock) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    // Reset state.trailingSpace
    state.trailingSpace = 0;
    state.trailingSpaceNewLine = false;
    // Mark this line as blank
    state.prevLine = state.thisLine
    state.thisLine = null
    return null;
  }

  function blockNormal(stream, state) {

    var sol = stream.sol();

    var prevLineIsList = state.list !== false,
        prevLineIsIndentedCode = state.indentedCode;

    state.indentedCode = false;

    if (prevLineIsList) {
      if (state.indentationDiff >= 0) { // Continued list
        if (state.indentationDiff < 4) { // Only adjust indentation if *not* a code block
          state.indentation -= state.indentationDiff;
        }
        state.list = null;
      } else if (state.indentation > 0) {
        state.list = null;
      } else { // No longer a list
        state.list = false;
      }
    }

    var match = null;
    if (state.indentationDiff >= 4) {
      stream.skipToEnd();
      if (prevLineIsIndentedCode || lineIsEmpty(state.prevLine)) {
        state.indentation -= 4;
        state.indentedCode = true;
        return tokenTypes.code;
      } else {
        return null;
      }
    } else if (stream.eatSpace()) {
      return null;
    } else if ((match = stream.match(atxHeaderRE)) && match[1].length <= 6) {
      state.header = match[1].length;
      if (modeCfg.highlightFormatting) state.formatting = "header";
      state.f = state.inline;
      return getType(state);
    } else if (!lineIsEmpty(state.prevLine) && !state.quote && !prevLineIsList &&
               !prevLineIsIndentedCode && (match = stream.match(setextHeaderRE))) {
      state.header = match[0].charAt(0) == '=' ? 1 : 2;
      if (modeCfg.highlightFormatting) state.formatting = "header";
      state.f = state.inline;
      return getType(state);
    } else if (stream.eat('>')) {
      state.quote = sol ? 1 : state.quote + 1;
      if (modeCfg.highlightFormatting) state.formatting = "quote";
      stream.eatSpace();
      return getType(state);
    } else if (stream.peek() === '[') {
      return switchInline(stream, state, footnoteLink);
    } else if (stream.match(hrRE, true)) {
      state.hr = true;
      return tokenTypes.hr;
    } else if (match = stream.match(listRE)) {
      var listType = match[1] ? "ol" : "ul";
      state.indentation = stream.column() + stream.current().length;
      state.list = true;

      // While this list item's marker's indentation
      // is less than the deepest list item's content's indentation,
      // pop the deepest list item indentation off the stack.
      while (state.listStack && stream.column() < state.listStack[state.listStack.length - 1]) {
        state.listStack.pop();
      }

      // Add this list item's content's indentation to the stack
      state.listStack.push(state.indentation);

      if (modeCfg.taskLists && stream.match(taskListRE, false)) {
        state.taskList = true;
      }
      state.f = state.inline;
      if (modeCfg.highlightFormatting) state.formatting = ["list", "list-" + listType];
      return getType(state);
    } else if (modeCfg.fencedCodeBlocks && (match = stream.match(fencedCodeRE, true))) {
      state.fencedChars = match[1]
      // try switching mode
      state.localMode = getMode(match[2]);
      if (state.localMode) state.localState = CodeMirror.startState(state.localMode);
      state.f = state.block = local;
      if (modeCfg.highlightFormatting) state.formatting = "code-block";
      state.code = -1
      return getType(state);
    }

    return switchInline(stream, state, state.inline);
  }

  function htmlBlock(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if (!htmlModeMissing) {
      var inner = CodeMirror.innerMode(htmlMode, state.htmlState)
      if ((inner.mode.name == "xml" && inner.state.tagStart === null &&
           (!inner.state.context && inner.state.tokenize.isInText)) ||
          (state.md_inside && stream.current().indexOf(">") > -1)) {
        state.f = inlineNormal;
        state.block = blockNormal;
        state.htmlState = null;
      }
    }
    return style;
  }

  function local(stream, state) {
    if (state.fencedChars && stream.match(state.fencedChars)) {
      if (modeCfg.highlightFormatting) state.formatting = "code-block";
      var returnType = getType(state)
      state.localMode = state.localState = null;
      state.block = blockNormal;
      state.f = inlineNormal;
      state.fencedChars = null;
      state.code = 0
      return returnType;
    } else if (state.fencedChars && stream.skipTo(state.fencedChars)) {
      return "comment"
    } else if (state.localMode) {
      return state.localMode.token(stream, state.localState);
    } else {
      stream.skipToEnd();
      return tokenTypes.code;
    }
  }

  // Inline
  function getType(state) {
    var styles = [];

    if (state.formatting) {
      styles.push(tokenTypes.formatting);

      if (typeof state.formatting === "string") state.formatting = [state.formatting];

      for (var i = 0; i < state.formatting.length; i++) {
        styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

        if (state.formatting[i] === "header") {
          styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
        }

        // Add `formatting-quote` and `formatting-quote-#` for blockquotes
        // Add `error` instead if the maximum blockquote nesting depth is passed
        if (state.formatting[i] === "quote") {
          if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
            styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
          } else {
            styles.push("error");
          }
        }
      }
    }

    if (state.taskOpen) {
      styles.push("meta");
      return styles.length ? styles.join(' ') : null;
    }
    if (state.taskClosed) {
      styles.push("property");
      return styles.length ? styles.join(' ') : null;
    }

    if (state.linkHref) {
      styles.push(tokenTypes.linkHref, "url");
    } else { // Only apply inline styles to non-url text
      if (state.strong) { styles.push(tokenTypes.strong); }
      if (state.em) { styles.push(tokenTypes.em); }
      if (state.strikethrough) { styles.push(tokenTypes.strikethrough); }
      if (state.linkText) { styles.push(tokenTypes.linkText); }
      if (state.code) { styles.push(tokenTypes.code); }
      if (state.image) { styles.push(tokenTypes.image); }
      if (state.imageAltText) { styles.push(tokenTypes.imageAltText, "link"); }
      if (state.imageMarker) { styles.push(tokenTypes.imageMarker); }
    }

    if (state.header) { styles.push(tokenTypes.header, tokenTypes.header + "-" + state.header); }

    if (state.quote) {
      styles.push(tokenTypes.quote);

      // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
      if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
        styles.push(tokenTypes.quote + "-" + state.quote);
      } else {
        styles.push(tokenTypes.quote + "-" + modeCfg.maxBlockquoteDepth);
      }
    }

    if (state.list !== false) {
      var listMod = (state.listStack.length - 1) % 3;
      if (!listMod) {
        styles.push(tokenTypes.list1);
      } else if (listMod === 1) {
        styles.push(tokenTypes.list2);
      } else {
        styles.push(tokenTypes.list3);
      }
    }

    if (state.trailingSpaceNewLine) {
      styles.push("trailing-space-new-line");
    } else if (state.trailingSpace) {
      styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
    }

    return styles.length ? styles.join(' ') : null;
  }

  function handleText(stream, state) {
    if (stream.match(textRE, true)) {
      return getType(state);
    }
    return undefined;
  }

  function inlineNormal(stream, state) {
    var style = state.text(stream, state);
    if (typeof style !== 'undefined')
      return style;

    if (state.list) { // List marker (*, +, -, 1., etc)
      state.list = null;
      return getType(state);
    }

    if (state.taskList) {
      var taskOpen = stream.match(taskListRE, true)[1] !== "x";
      if (taskOpen) state.taskOpen = true;
      else state.taskClosed = true;
      if (modeCfg.highlightFormatting) state.formatting = "task";
      state.taskList = false;
      return getType(state);
    }

    state.taskOpen = false;
    state.taskClosed = false;

    if (state.header && stream.match(/^#+$/, true)) {
      if (modeCfg.highlightFormatting) state.formatting = "header";
      return getType(state);
    }

    var ch = stream.next();

    // Matches link titles present on next line
    if (state.linkTitle) {
      state.linkTitle = false;
      var matchCh = ch;
      if (ch === '(') {
        matchCh = ')';
      }
      matchCh = (matchCh+'').replace(/([.?*+^\[\]\\(){}|-])/g, "\\$1");
      var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
      if (stream.match(new RegExp(regex), true)) {
        return tokenTypes.linkHref;
      }
    }

    // If this block is changed, it may need to be updated in GFM mode
    if (ch === '`') {
      var previousFormatting = state.formatting;
      if (modeCfg.highlightFormatting) state.formatting = "code";
      stream.eatWhile('`');
      var count = stream.current().length
      if (state.code == 0) {
        state.code = count
        return getType(state)
      } else if (count == state.code) { // Must be exact
        var t = getType(state)
        state.code = 0
        return t
      } else {
        state.formatting = previousFormatting
        return getType(state)
      }
    } else if (state.code) {
      return getType(state);
    }

    if (ch === '\\') {
      stream.next();
      if (modeCfg.highlightFormatting) {
        var type = getType(state);
        var formattingEscape = tokenTypes.formatting + "-escape";
        return type ? type + " " + formattingEscape : formattingEscape;
      }
    }

    if (ch === '!' && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
      state.imageMarker = true;
      state.image = true;
      if (modeCfg.highlightFormatting) state.formatting = "image";
      return getType(state);
    }

    if (ch === '[' && state.imageMarker && stream.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/, false)) {
      state.imageMarker = false;
      state.imageAltText = true
      if (modeCfg.highlightFormatting) state.formatting = "image";
      return getType(state);
    }

    if (ch === ']' && state.imageAltText) {
      if (modeCfg.highlightFormatting) state.formatting = "image";
      var type = getType(state);
      state.imageAltText = false;
      state.image = false;
      state.inline = state.f = linkHref;
      return type;
    }

    if (ch === '[' && stream.match(/[^\]]*\](\(.*\)| ?\[.*?\])/, false) && !state.image) {
      state.linkText = true;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      return getType(state);
    }

    if (ch === ']' && state.linkText && stream.match(/\(.*?\)| ?\[.*?\]/, false)) {
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var type = getType(state);
      state.linkText = false;
      state.inline = state.f = linkHref;
      return type;
    }

    if (ch === '<' && stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, false)) {
      state.f = state.inline = linkInline;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var type = getType(state);
      if (type){
        type += " ";
      } else {
        type = "";
      }
      return type + tokenTypes.linkInline;
    }

    if (ch === '<' && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, false)) {
      state.f = state.inline = linkInline;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var type = getType(state);
      if (type){
        type += " ";
      } else {
        type = "";
      }
      return type + tokenTypes.linkEmail;
    }

    if (ch === '<' && stream.match(/^(!--|[a-z]+(?:\s+[a-z_:.\-]+(?:\s*=\s*[^ >]+)?)*\s*>)/i, false)) {
      var end = stream.string.indexOf(">", stream.pos);
      if (end != -1) {
        var atts = stream.string.substring(stream.start, end);
        if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) state.md_inside = true;
      }
      stream.backUp(1);
      state.htmlState = CodeMirror.startState(htmlMode);
      return switchBlock(stream, state, htmlBlock);
    }

    if (ch === '<' && stream.match(/^\/\w*?>/)) {
      state.md_inside = false;
      return "tag";
    } else if (ch === "*" || ch === "_") {
      var len = 1, before = stream.pos == 1 ? " " : stream.string.charAt(stream.pos - 2)
      while (len < 3 && stream.eat(ch)) len++
      var after = stream.peek() || " "
      // See http://spec.commonmark.org/0.27/#emphasis-and-strong-emphasis
      var leftFlanking = !/\s/.test(after) && (!punctuation.test(after) || /\s/.test(before) || punctuation.test(before))
      var rightFlanking = !/\s/.test(before) && (!punctuation.test(before) || /\s/.test(after) || punctuation.test(after))
      var setEm = null, setStrong = null
      if (len % 2) { // Em
        if (!state.em && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
          setEm = true
        else if (state.em == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
          setEm = false
      }
      if (len > 1) { // Strong
        if (!state.strong && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
          setStrong = true
        else if (state.strong == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
          setStrong = false
      }
      if (setStrong != null || setEm != null) {
        if (modeCfg.highlightFormatting) state.formatting = setEm == null ? "strong" : setStrong == null ? "em" : "strong em"
        if (setEm === true) state.em = ch
        if (setStrong === true) state.strong = ch
        var t = getType(state)
        if (setEm === false) state.em = false
        if (setStrong === false) state.strong = false
        return t
      }
    } else if (ch === ' ') {
      if (stream.eat('*') || stream.eat('_')) { // Probably surrounded by spaces
        if (stream.peek() === ' ') { // Surrounded by spaces, ignore
          return getType(state);
        } else { // Not surrounded by spaces, back up pointer
          stream.backUp(1);
        }
      }
    }

    if (modeCfg.strikethrough) {
      if (ch === '~' && stream.eatWhile(ch)) {
        if (state.strikethrough) {// Remove strikethrough
          if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
          var t = getType(state);
          state.strikethrough = false;
          return t;
        } else if (stream.match(/^[^\s]/, false)) {// Add strikethrough
          state.strikethrough = true;
          if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
          return getType(state);
        }
      } else if (ch === ' ') {
        if (stream.match(/^~~/, true)) { // Probably surrounded by space
          if (stream.peek() === ' ') { // Surrounded by spaces, ignore
            return getType(state);
          } else { // Not surrounded by spaces, back up pointer
            stream.backUp(2);
          }
        }
      }
    }

    if (ch === ' ') {
      if (stream.match(/ +$/, false)) {
        state.trailingSpace++;
      } else if (state.trailingSpace) {
        state.trailingSpaceNewLine = true;
      }
    }

    return getType(state);
  }

  function linkInline(stream, state) {
    var ch = stream.next();

    if (ch === ">") {
      state.f = state.inline = inlineNormal;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var type = getType(state);
      if (type){
        type += " ";
      } else {
        type = "";
      }
      return type + tokenTypes.linkInline;
    }

    stream.match(/^[^>]+/, true);

    return tokenTypes.linkInline;
  }

  function linkHref(stream, state) {
    // Check if space, and return NULL if so (to avoid marking the space)
    if(stream.eatSpace()){
      return null;
    }
    var ch = stream.next();
    if (ch === '(' || ch === '[') {
      state.f = state.inline = getLinkHrefInside(ch === "(" ? ")" : "]", 0);
      if (modeCfg.highlightFormatting) state.formatting = "link-string";
      state.linkHref = true;
      return getType(state);
    }
    return 'error';
  }

  var linkRE = {
    ")": /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\))/,
    "]": /^(?:[^\\\[\]]|\\.|\[(?:[^\\\[\\]]|\\.)*\])*?(?=\])/
  }

  function getLinkHrefInside(endChar) {
    return function(stream, state) {
      var ch = stream.next();

      if (ch === endChar) {
        state.f = state.inline = inlineNormal;
        if (modeCfg.highlightFormatting) state.formatting = "link-string";
        var returnState = getType(state);
        state.linkHref = false;
        return returnState;
      }

      stream.match(linkRE[endChar])
      state.linkHref = true;
      return getType(state);
    };
  }

  function footnoteLink(stream, state) {
    if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
      state.f = footnoteLinkInside;
      stream.next(); // Consume [
      if (modeCfg.highlightFormatting) state.formatting = "link";
      state.linkText = true;
      return getType(state);
    }
    return switchInline(stream, state, inlineNormal);
  }

  function footnoteLinkInside(stream, state) {
    if (stream.match(/^\]:/, true)) {
      state.f = state.inline = footnoteUrl;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var returnType = getType(state);
      state.linkText = false;
      return returnType;
    }

    stream.match(/^([^\]\\]|\\.)+/, true);

    return tokenTypes.linkText;
  }

  function footnoteUrl(stream, state) {
    // Check if space, and return NULL if so (to avoid marking the space)
    if(stream.eatSpace()){
      return null;
    }
    // Match URL
    stream.match(/^[^\s]+/, true);
    // Check for link title
    if (stream.peek() === undefined) { // End of line, set flag to check next line
      state.linkTitle = true;
    } else { // More content on line, check if link title
      stream.match(/^(?:\s+(?:"(?:[^"\\]|\\\\|\\.)+"|'(?:[^'\\]|\\\\|\\.)+'|\((?:[^)\\]|\\\\|\\.)+\)))?/, true);
    }
    state.f = state.inline = inlineNormal;
    return tokenTypes.linkHref + " url";
  }

  var mode = {
    startState: function() {
      return {
        f: blockNormal,

        prevLine: null,
        thisLine: null,

        block: blockNormal,
        htmlState: null,
        indentation: 0,

        inline: inlineNormal,
        text: handleText,

        formatting: false,
        linkText: false,
        linkHref: false,
        linkTitle: false,
        code: 0,
        em: false,
        strong: false,
        header: 0,
        hr: false,
        taskList: false,
        list: false,
        listStack: [],
        quote: 0,
        trailingSpace: 0,
        trailingSpaceNewLine: false,
        strikethrough: false,
        fencedChars: null
      };
    },

    copyState: function(s) {
      return {
        f: s.f,

        prevLine: s.prevLine,
        thisLine: s.thisLine,

        block: s.block,
        htmlState: s.htmlState && CodeMirror.copyState(htmlMode, s.htmlState),
        indentation: s.indentation,

        localMode: s.localMode,
        localState: s.localMode ? CodeMirror.copyState(s.localMode, s.localState) : null,

        inline: s.inline,
        text: s.text,
        formatting: false,
        linkTitle: s.linkTitle,
        code: s.code,
        em: s.em,
        strong: s.strong,
        strikethrough: s.strikethrough,
        header: s.header,
        hr: s.hr,
        taskList: s.taskList,
        list: s.list,
        listStack: s.listStack.slice(0),
        quote: s.quote,
        indentedCode: s.indentedCode,
        trailingSpace: s.trailingSpace,
        trailingSpaceNewLine: s.trailingSpaceNewLine,
        md_inside: s.md_inside,
        fencedChars: s.fencedChars
      };
    },

    token: function(stream, state) {

      // Reset state.formatting
      state.formatting = false;

      if (stream != state.thisLine) {
        var forceBlankLine = state.header || state.hr;

        // Reset state.header and state.hr
        state.header = 0;
        state.hr = false;

        if (stream.match(/^\s*$/, true) || forceBlankLine) {
          blankLine(state);
          if (!forceBlankLine) return null
          state.prevLine = null
        }

        state.prevLine = state.thisLine
        state.thisLine = stream

        // Reset state.taskList
        state.taskList = false;

        // Reset state.trailingSpace
        state.trailingSpace = 0;
        state.trailingSpaceNewLine = false;

        state.f = state.block;
        var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, '    ').length;
        state.indentationDiff = Math.min(indentation - state.indentation, 4);
        state.indentation = state.indentation + state.indentationDiff;
        if (indentation > 0) return null;
      }
      return state.f(stream, state);
    },

    innerMode: function(state) {
      if (state.block == htmlBlock) return {state: state.htmlState, mode: htmlMode};
      if (state.localState) return {state: state.localState, mode: state.localMode};
      return {state: state, mode: mode};
    },

    blankLine: blankLine,

    getType: getType,

    closeBrackets: "()[]{}''\"\"``",
    fold: "markdown"
  };
  return mode;
}, "xml");

CodeMirror.defineMIME("text/x-markdown", "markdown");

});


/***/ })

},[349]);