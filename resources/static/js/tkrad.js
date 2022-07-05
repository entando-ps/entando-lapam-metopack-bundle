// TODO
// possibilita tcl di inviare script di validazione js
// al posto di wsObject on worker ci permette di sviluppare una app autonoma
// una mini tkrad::dbc in js ci consente di fare girare pwa offline
// ContexLoop deve onorare solo insert - evento ContextEnabled e altri
// pilotare la wish per l'esecuzione di moduli
// I simboli <> devono essere processati altrimenti sono tags
// Vedi Errore <NOT_FOUND>
// bottoni shared - disabilitazione da applicativo
// enable e disable context
// analisi grid area e passaggio dato identificativo programma/frame
// object trash da jsrad in destroy tcl
// up down pageup pagedown su liste con setup key da oggetto
// worker per app locali ????
export var tkrad = tkrad ? tkrad : {}

import * as tkradTree from "./treeview.js"
import * as tkradDrop from "./dropdown.js"

tkrad.consoleLog = console.log
tkrad.runDebug = true
tkrad.disableConsole = function () {
	tkrad.consoleLog = function () {}
}
import { jsrad } from "./format.js"

tkrad.calDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

tkrad.calMonths = [
	"Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
	"Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
]

tkrad.iconNames = {
	pdfview: "mdi-file-pdf-box-outline",
	upload: "mdi-file-upload-outline",
	download: "mdi-download",
	search: "mdi-database-search-outline",
	event: "mdi-calendar-month",
	menu: "mdi-menu",
	close: "mdi-window-close",
	goback: "mdi-keyboard-backspace",
	minimize: "mdi-window-minimize",
	save: "mdi-content-save-edit-outline",
	done: "mdi-run",
	delete: "mdi-delete-outline",
	add: "mdi-database-plus-outline",
	print: "mdi-printer",
	hidden: "mdi-eye-off-outline",
	visible: "mdi-eye-outline",
	account: "mdi-account-outline",
	next: "mdi-page-next-outline",
	prev: "mdi-page-previous-outline",
	left: "mdi-chevron-left",
	right: "mdi-chevron-right"
}

tkrad.getIcon = function ( icon ) {
	if ( typeof(tkrad.iconNames[icon]) == "undefined" ) {
		tkrad.consoleLog("UNKNOWN ICON", icon)
		icon =  "mdi-chat-question-outline"
	} else {
		icon = tkrad.iconNames[icon]
	}
	return icon
}

tkrad.portalPath = function () {
	let apath = window.location.pathname.split('/');
	let str = apath.slice(1, apath.length - 1);
	// debug developer mode
	if ( str.length == 0 ) { return "" }
	return str + "/"
}

tkrad.wsObject = class {
	constructor () {
		tkrad.consoleLog("NEW OBJECT WS", this)
	}
	setPost ( post ) {
		this.wsPost = post
	}
	wsConnect () {
		let wsuri
		if ( typeof(this.wsUrl) != "undefined" ) {
			wsuri = this.wsUrl + "/"
		} else {
			wsuri = tkrad.http.wsUrl(tkrad.portalPath())
		}
		wsuri += "wish.tcl"
		if ( typeof(this.wsPost) != "undefined") {
			wsuri += "?" + this.wsPost;
		}
		this.wsObject = new WebSocket(wsuri)
		this.wsObject.onopen = () => {
			this.wsOpen()
		}
		this.wsObject.onerror = ( error ) => {
			this.wsError(error)
		}
		this.wsObject.onmessage = ( data ) => {
			this.wsMessage(data)
		}
		this.wsObject.onclose = ( event ) => {
			this.wsClose(event)
		}
	}
	wsOpen () {
		tkrad.consoleLog("Socket open")
	}
	wsError ( error ) {
		tkrad.consoleLog("ERROR WS", error)
	}
	wsMessage ( event ) {
		this.evalSocket(event.data)
	}
	wsSend ( data ) {
		this.wsObject.send(data)
	}
	wsClose (event) {
		tkrad.consoleLog("CLOSE WEBSOCKET", event)
	}
}

tkrad.fontMeasure = class {
	constructor () {
		this.widthSize = 14
		this.heightSize = 14
	}
	getWidth ( w ) {
		return w * this.widthSize
	}
	getHeight ( h ) {
		return h * this.heightSize
	}
	getButtonWidth ( len ) {
		len = len * this.widthSize
		if ( len < 120 ) { len = 120 }
		return len
	}
	getChar ( visible ) {
		if ( visible < 3 ) {
			visible += 2
		} else if ( visible < 10 ) {
			visible += 3
		} else {
			visible = visible + Math.round((visible / 12) + 1)
		}
		return visible
	}
}

tkrad.doPdfViewer = function (wish) {
	if ( typeof(wish.pdfObject) != "undefined" ) { return wish.pdfObject }
	wish.pdfObject = document.createElement("tkrad-pdf")
	wish.pdfObject.classList.add("tkrad-pdf-viewer")
	let frame = wish.querySelector(".tkrad-appframe")
	frame.appendChild(wish.pdfObject)
}

tkrad.dropPdfViewer = function (wish) {
	if ( typeof(wish.pdfObject) == "undefined" ) { return }
	wish.pdfObject.remove()
}

tkrad.pixelSize = new tkrad.fontMeasure()

tkrad.triggerObject = class {
	constructor ( id ) {
		this.id = id
		this.widgetList = []
	}
	addWidget ( wid ) {
		this.widgetList.push(wid)
		wid.triggerObject = this
	}
	buildImage () {
		let data = []
		for ( let key in this.widgetList ) {
				data.push(this.widgetList[key].getValue())
		}
		let back = data.join("@#@")
		return back
	}
	afterImage () {
		this.afterData = this.buildImage()
		// tkrad.consoleLog("TRIGGER AFTER", this.afterData)
	}
	imageChanged () {
		if ( this.afterData == this.beforeData ) { return false }
		// tkrad.consoleLog("TRIGGER CHANGE", this.beforeData, this.afterData)
		this.beforeData = this.afterData
		return true
	}
	beforeImage () {
		this.beforeData = this.buildImage()
		// tkrad.consoleLog("TRIGGER BEFORE", this.beforeData)
	}
}

tkrad.contextObject = class {
	constructor ( id ) {
		this.id = id
		this.widgetList = []
		this.readOnly = false
	}
	addWidget ( wid ) {
		this.widgetList.push(wid)
		wid.contextObject = this
	}
	setReadOnly () {
		this.readOnly = true
	}
	isReadOnly () {
		return this.readOnly
	}
	setFocus () {
		let wid = this.widgetList[0]
		for ( let idx = 0 ; idx < this.widgetList.length ; idx++ ) {
			if ( this.widgetList[idx].tclProperty.readonly ) { continue }
			wid = this.widgetList[idx]
			break
		}
		wid.setWidgetFocus()
	}
	hasFocus() {
		return this.widgetList.includes(this.appObject.widgetFocus)
	}
	isMapped() {
		for ( let wid = this.widgetList[0] ; wid != null ; wid = wid.parentNode ) {
			if ( typeof(wid.style) == "undefined") { continue }
			if ( typeof(wid.style["display"]) == "undefined") { continue }
			if ( wid.style["display"] == "none") { return false }
		}
		return true
	}
	prevWidget ( wid ) {
		if ( wid.tagName == "TKRAD-SPREADSHEET" ) { return }
		let last = this.widgetList.length - 1
		let idx = this.widgetList.indexOf(wid)
		let newid = wid
		for ( let wx = idx - 1 ; true ; wx-- ) {
			if ( wx < 0 ) { wx = last + 1 ; continue }
			newid = this.widgetList[wx]
			if ( !newid.isVisible() ) { continue }
			if ( newid.tclProperty.readonly ) { continue }
			break
		}
		newid.setWidgetFocus()
	}
	nextWidget ( wid ) {
		if ( wid.tagName == "TKRAD-SPREADSHEET" ) { return }
		let last = this.widgetList.length - 1
		let idx = this.widgetList.indexOf(wid)
		let newid = wid
		let loop = false
		let noloop = ["TKRAD-DRIVEBUTTON", "TKRAD-TABLEFRAME"]
		for ( let wx = idx + 1 ; true ; wx++ ) {
			if ( wx > last ) { wx = -1 ; continue }
			newid = this.widgetList[wx]
			// some virtual tags do not generate events
			if ( newid.tclProperty.readonly ) { continue }
			if ( !noloop.includes(newid.tagName) && wx < idx ) { loop = true }
			break
		}
		newid.setWidgetFocus()
		if ( loop ) {
			wid.sendEvent("context", {action: "loop", context: this.id})
		}
	}
}

tkrad.http = {
	webRoot: "/"
}

tkrad.http.wsUrl = function ( path ) {
	let url = new URL(document.URL)
	if (url.protocol === "https:") {
		url.protocol = "wss"
	} else {
		url.protocol = "ws"
	}
	let wsuri = url.origin + this.webRoot + path
	return wsuri
}

tkrad.http.getPath = function ( path ) {
	let docurl = new URL(document.URL)
	let url = docurl.origin + this.webRoot + path
	return url
}

tkrad.http.getUrl = function ( path, data, callback ) {
	let docurl = new URL(document.URL)
	let url = docurl.origin + this.webRoot + path
	let request = {}
	if ( typeof(data.post) != "undefined" ) {
		request["method"] = "POST"
		if ( data.post instanceof ArrayBuffer ) {
			request["body"] = data.post
		} else {
			request["body"] = JSON.stringify(data.post)
		}
	} else {
		request["method"] = data.method
	}
	if ( typeof(data.headers) != "undefined" ) {
		request["headers"] = data.headers
	}
	fetch(url, request)
	.then( (response) => {
		if (!response.ok) {
			tkrad.consoleLog("Errore Server " + response.status)
		}
		return ( response.text() )
	})
	.then( (blob) => {
		callback(blob)
	})
}

//
// micro service manager
//
//
customElements.define("tkrad-digital", class extends HTMLElement {
	constructor () {
		super()
	}
	consoleMode ( mode ) {
		if ( !mode ) { tkrad.disableConsole() }
	}
	setScript ( name ) {
		this.scriptName = name
	}
	setModule ( runner, wsevent ) {
		let script = "program " + runner.modulo + " args { "
		if ( runner.utente != "" ) {
			script += " -utente " + runner.utente
		}
		if ( runner.prog != "" ) {
			script += " -prog " + runner.prog
		}
		for ( let key in runner.parametri ) {
			script += " -" + key + " " + runner.parametri[key]
		}
		script += " }"
		this.setScript(btoa(script))
		this.consoleMode(false)
		this.setWebsocket(runner.host, runner.port)
		this.wsEvent = wsevent
	}
	setWebsocket ( host, port ) {
		this.wsUrl = "ws://" + host + ":" + port
	}
	connectedCallback () {
		setTimeout ( () => {
			let wish = document.createElement("tkrad-wish")
			if ( typeof(this.wsUrl) != "undefined" ) {
				wish.wsUrl = this.wsUrl
			}
			if ( typeof(this.wsEvent) != "undefined" ) {
				wish.wsEvent = this.wsEvent
			}
			// force appTitle to bypass task manager
			if ( typeof(this.wsTitle) != "undefined" ) {
				wish.appTitle = this.wsTitle
			} else {
				wish.appTitle = "Tkrad wish"
			}
			if ( typeof(this.scriptName) == "undefined" ) { return }
			wish.wmObject = this
			this.appendChild(wish)
			wish.setScript(this.scriptName)
			wish.runScript()
		}, 0)
	}
	registerWish (obj) {}
	unregisterWish (ele) {}
	parkWindow (obj) {}
	runProgram (code) {}
})
//
// window manager
//
//
customElements.define("tkrad-wm", class extends HTMLElement {
	constructor () {
		super()
	}
	buildWm() {
		this.classList.add("tkrad-wm")
		this.headerObject = document.createElement("tkrad-wm-header")
		this.headerObject.classList.add("tkrad-vm-header")
		this.headerObject.setTitle(this.wmTitle)
		this.headerObject.wmObject = this
		this.headerObject.buildObject()
		this.pageObject = document.createElement("tkrad-wm-page")
		this.headerObject.classList.add("tkrad-vm-page")
		this.appendChild(this.headerObject)
		this.appendChild(this.pageObject)
		this.applicationMenu = this.headerObject.menuButton("Application")
		this.wishObjects = []
		this.processId = 0
	}
	connectedCallback() {
		tkrad.consoleLog("WM RUNNING", this)
		this.buildWm()
		if (typeof(this.scriptName) == "undefined") { return }
		setTimeout( () => {
			this.runProgram(this.scriptName)
		}, 0)
	}
	consoleMode ( mode ) {
		if ( !mode ) { tkrad.disableConsole() }
	}
	setScript(code) {
		this.scriptName = code
	}
	setTitle(title) {
		this.wmTitle = title
	}
	runProgram(code) {
		if ( this.wishObjects.length == 2 ) {
			alert("Please no more than 2 running apps")
			return
		}
		tkrad.consoleLog("RUN PROGRAM", code)
		this.parkAll()
		let wish = document.createElement("tkrad-wish")
		wish.wmObject = this
		this.pageObject.appendChild(wish)
		wish.setScript(code)
		wish.runScript()
	}
	parkAll() {
		for ( let key in this.wishObjects ) {
			let wish = this.wishObjects[key]
			if ( wish.style["display"] == "none" ) { continue }
			this.parkWindow(wish)
		}
	}
	parkWindow(win) {
		win.taskButton.taskDisabled()
		win.style["display"] = "none"
		if ( typeof(win.pdfObject) != "undefined" ) {
			win.pdfObject.style["display"] = "none"
		}
	}
	showWindow(win) {
		this.parkAll()
		win.taskButton.taskEnabled()
		win.style["display"] = "grid"
		if ( typeof(win.pdfObject) != "undefined" ) {
			win.pdfObject.style["display"] = "flex"
		}
	}
	registerWish(win) {
		this.processId++
		win.pidNumber = this.processId
		win.iconTitle = "Loading"
		this.wishObjects.push(win)
		this.headerObject.addTask(win, win.iconTitle, () => {
			this.showWindow(win)
		})
		win.taskButton.taskEnabled()
	}
	unregisterWish(ele) {
		let idx = this.wishObjects.indexOf(ele)
		ele.taskButton.taskClose()
		this.wishObjects.splice(idx, 1)
	}
});
customElements.define("tkrad-wm-header", class extends HTMLElement {
	constructor() { super() }
	setTitle ( title ) {
		this.wmTitle = title
	}
	buildObject () {}
	menuButton(label) {
		let button = document.createElement("tkrad-button")
		button.profileButton({ icon: "menu", text: label, template: "appmenu" })
		button.runCommand = () => {
			this.loadMenu(button)
		}
		this.appendChild(button)
		return(button)
	}
	loadMenu ( object ) {
		if ( typeof(object.menuBuilder) != "undefined" ) {
			object.menuBuilder.toggleWidget()
			return
		}
		tkrad.http.getUrl(tkrad.portalPath() + "appmenu.tcl", {}, ( buffer ) => {
			let input = JSON.parse(buffer)
			object.buildMenu(input, (program) => {
				this.wmObject.runProgram(program)
			})
		})
	}
	addTask(win, title, command) {
		let button = document.createElement("tkrad-button")
		button.taskEnabled = function() {
			this.changeIcon("done")
		}
		button.taskDisabled = function() {
			this.changeIcon("minimize")
		}
		button.taskClose = function() {
			this.parentNode.removeChild(this)
		}
		win.taskButton = button
		button.profileButton({ text: title, icon: "done" })
		button.runCommand = command
		this.appendChild(button)
	}
})
//
// tkrad program
//
customElements.define("tkrad-wish", class extends HTMLElement {
	constructor () {
		super()
	}
	connectedCallback() {
		this.classList.add("tkrad-wish")
		this.downloadDriver = document.createElement("a")
		this.downloadDriver.target = "_blank"
		this.downloadDriver.style["display"] = "none"
		this.appendChild(this.downloadDriver)
		this.uploadDriver = document.createElement("input")
		this.uploadDriver.type = "file"
		this.uploadDriver.style["display"] = "none"
		this.appendChild(this.uploadDriver)
		this.wmObject.registerWish(this)
	}
	disconnectedCallback() {
		tkrad.dropPdfViewer(this)
		this.wmObject.unregisterWish(this)
	}
	setTitle ( title ) {
		// only the first application set a title
		if ( typeof(this.appTitle) != "undefined" ) { return }
		this.appTitle = title
		this.taskButton.changeLabel(this.appTitle)
	}
	setScript( code ) {
		this.scriptCode = code
	}
	killMe () {
		let app = this.querySelector("tkrad-application")
		app.killMe()
	}

	wsEvent (type, event) {
		console.log("WS EVENT", type, event)
		if ( type == "CLOSE" ) {
			this.parentNode.removeChild(this)
		}
	}

	runScript() {
		this.wsObject = new tkrad.wsObject()
		if ( typeof(this.scriptCode) != "undefined") {
			this.wsObject.setPost(this.scriptCode)
		}
		if ( typeof(this.wsUrl) != "undefined" ) {
			this.wsObject.wsUrl = this.wsUrl
		}
		try {
			this.wsObject.wsConnect()
		} catch ( err ) {
			this.wsEvent("START", err)
		}
		this.wsObject.evalSocket = ( (data) => {
			let input = JSON.parse(atob(data))
			console.log("INPUT", input)
			if ( input.channel == "TCLOUT" ) {
				tkrad.consoleLog("TCL " + "%c" + input.message , 'color: green')
			} else if ( input.channel == "TCLERR" ) {
				tkrad.consoleLog("TCL " + "%c" + input.message , 'color: red')
			} else if ( input.channel == "TK" ) {
				this.runTkCommand(input)
			}
		})
		this.wsObject.wsOpen = ( () => {
			this.wsEvent("OPEN")
		})
		this.wsObject.wsClose = ( (event) => {
			this.wsEvent("CLOSE", event)
		})
		this.wsObject.wsError = ( (event) => {
			this.wsEvent("ERROR", event)
		})
		tkrad.consoleLog("WISH RUNNING", this, this.parentNode)
	}
	runTkCommand(input) {
		if ( tkrad.runDebug ) { tkrad.consoleLog("TK", input) }
		if ( input.command == "application" ) {
			this.runApplication(input)
		} else if ( input.command == "toolbar" ) {
			this.runToolbar(input)
		} else if ( input.command == "element" ) {
			this.buildElement(input)
		} else if ( input.command == "column" ) {
			this.buildColumn(input)
		} else if ( input.command == "widget" ) {
			this.runWidget(input)
		} else if ( input.command == "context" ) {
			this.runContext(input)
		} else if ( input.command == "object" ) {
			this.runObject(input)
		} else {
			tkrad.consoleLog("TODO", input)
		}
	}
	pdfViewer() {
		tkrad.doPdfViewer(this)
	}
	runObject(input) {
		let app = this.getObjectElement(input.appid)
		if ( input.object == "pdfviewer" && typeof(app.wishObject.pdfObject) != "undefined" ) {
			if ( input.run == "reset" ) {
				app.wishObject.pdfObject.resetValue()
			} else if ( input.run == "view" ) {
				app.wishObject.pdfObject.viewDocument(input)
			}
		}
	}
	runContext(input) {
		let app = this.getObjectElement(input.appid)
		let ctxobj = app.contextId[input.id]
		if ( input.action == "focus" ) {
			ctxobj.setFocus()
		} else if ( input.action == "button" ) {
			app.buttonManager(ctxobj, input)
		} else if ( input.action == "readonly" ) {
			ctxobj.setReadOnly()
		} else {
			tkrad.consoleLog("BAD CONTEXT COMMAND", input)
		}
	}
	runToolbar(input) {
		let tool = this.getObjectElement(input.id)
		if ( input.action == "button" ) {
			tool.addButton(input)
		} else if ( input.action == "menubutton") {
			tool.runMenu(input)
		}
	}
	runApplication(input) {
		if ( input.action == "run" ) {
			let app = this.getObjectElement(input.id)
			app.runApplication()
			app.setFocus()
		} else if ( input.action == "object" && input.type == "context" ) {
			let app = this.getObjectElement(input.appid)
			app.addContext(input)
		} else if ( input.action == "object" && input.type == "trigger" ) {
			let app = this.getObjectElement(input.appid)
			app.addTrigger(input)
		} else if ( input.action == "focus" ) {
			let wid = this.getObjectElement(input.wid)
			wid.setWidgetFocus()
		} else if ( input.action == "exit" ) {
			let app = this.getObjectElement(input.id)
			this.removeChild(app)
		} else if ( input.action == "semaphore" ) {
			this.runBoxes(input)
		} else if ( input.action == "program") {
			let app = this.getObjectElement(input.id)
			app.wmObject.runProgram(input.code)
			if ( typeof(input.exec) != "undefined" ) {
				setTimeout(() => {
					app.exitApplication()
				}, 0)
			}
		} else if ( input.action == "cursor") {
			let app = this.getObjectElement(input.id)
			app.runProgress(input.mode)
		} else if ( input.action == "pdfviewer") {
			let app = this.getObjectElement(input.appid)
			let frame = app.querySelector(".tkrad-appframe")
			app.wishObject.pdfViewer(input)
		} else if ( input.action == "logout") {
			this.wmObject.runLogout()
		} else {
			tkrad.consoleLog("APPLICATION TODO", input)
		}
	}
	buildColumn ( input ) {
		let id = this.getObjectElement(input.id)
		id.buildColumn(input)
		return
	}
	buildElement ( input ) {
		if ( typeof(input.list) != "undefined") {
			let list = this.getObjectElement(input.list)
			list.buildColumn(input)
			return
		}
		if ( input.element == "tkrad-gadget" ) {
			let wid = this.getObjectElement(input.pid)
			wid.setIcon(input.id, input.icon)
			return
		}
		if ( typeof(customElements.get(input.element)) == "undefined" ) {
			tkrad.consoleLog("ELEMENT UNKNOWN", input)
			return
		}
		if ( input.element == "tkrad-toolbar" && input.type == "system" ) {
			input.element = "tkrad-systool"
		}
		let ele = document.createElement(input.element)
		ele.tclBuilder(this, input)
		ele.buildObject()
		if ( typeof(input.class) != "undefined" ) {
			for ( let key in input.class ) {
				ele.classList.add(input.class[key])
				if ( (input.class[key] == "tkrad-record" || input.class[key] == "tkrad-option") && ele.getToolbar() == undefined ) {
					ele.addToolbar()
				}
			}
		}
		if ( input.element == "tkrad-application" ) {
			this.appendChild(ele)
			return
		}
		let parent = this.getObjectElement(input.pid)
		if ( input.element == "tkrad-tableframe" && (parent.classList.contains('tkrad-query') || parent.classList.contains('tkrad-detail')) && parent.getToolbar() == undefined ) {
			parent.setContext(input.ctxlistid)
			parent.addToolbar()
		}
		if (ele.classList.contains('tkradDigitalScut')) {
			let ele = document.getElementsByClassName("tkrad-apptool")
			parent = ele[0].parentNode
		}
		if ( typeof(parent._appendChild) != "undefined" ) {
			parent._appendChild(ele)
		} else {
			parent.appendChild(ele)
		}
		return ele
	}
	runWidget ( input ) {
		let obj = this.getObjectElement(input.id)
		if ( obj == null ) {
			console.error("TKRAD_ERROR", input)
			return
		}
		if ( input.action == "set" ) {
			obj.setValueFromTcl(input.value)
		} else if ( input.action == "add" ) {
			obj.addValue(input.what, input.mode, input.value)
		} else if ( input.action == "reset" ) {
			obj.resetWidget(input)
		} else if ( input.action == "selectrow" ) {
			obj.rowCurrent(input.key)
		} else if ( input.action == "setrow" ) {
			obj.setRow(input.key, input.line)
		} else if ( input.action == "flush" ) {
			obj.flushList()
		} else if ( input.action == "addrow" ) {
			obj.addRow(input.key, input.line)
		} else if ( input.action == "droprow" ) {
			obj.dropRow(input.key)
		} else if ( input.action == "eof" ) {
			obj.endOfFile()
		} else if ( input.action == "resetlist" ) {
			obj.runAction(input)
		} else if ( input.action == "addlist" ) {
			obj.runAction(input)
		} else if ( input.action == "tree" ) {
			obj.runAction(input)
		} else if ( input.action == "destroypage" ) {
			obj.dropPage(input)
		} else if ( input.action == "focus" ) {
			obj.setWidgetFocus()
		} else if ( input.action == "download" ) {
			obj.runDownload(input)
		} else if ( input.action == "upload" ) {
			obj.setValueFromUpload(input.value)
			obj.valueBack()
		} else if ( input.action == "disablepage" ) {
			obj.pageManager(input)
		} else if ( input.action == "enablepage" ) {
			obj.pageManager(input)
		} else if ( input.action == "showpage" ) {
			obj.pageManager(input)
		} else if ( input.action == "droppage" ) {
			obj.pageManager(input)
		} else if ( input.action == "invalid" ) {
			obj.setValidate(false)
		} else if ( input.action == "readonly" ) {
			obj.setReadOnly(input.status)
		} else if ( input.action == "hide" ) {
			obj.setHidden(input.status)
		} else if ( input.action == "enablecontextmenu" ) {
			obj.enableContextMenu()
		} else if ( input.action == "loadcontextmenu" ) {
			obj.showContextMenu(input)
		} else if ( input.action == "spreadsheet" ) {
			obj.runSpreadsheet(input)
		} else {
			tkrad.consoleLog("UNKNOWN COMMAND", input)
		}
	}
	runBoxes(input) {
		let app = this.getObjectElement(input.id)
		let box = document.createElement("tkrad-message")
		box.runBox(app, input)
	}
	setObjectElement ( obj ) {
		obj.id = this.object2Id(obj.tclData.id)
	}
	getObjectElement ( tclid ) {
		let ele = this.querySelector("#" + this.object2Id(tclid))
		return ele
	}
	sendData ( data ) {
		this.wsObject.wsSend(JSON.stringify(data))
	}
	object2Id ( objid ) {
		return objid.replace(/::/g, "_")
	}
	parkWish () {
		this.wmObject.parkWindow(this)
	}
});

tkrad.tkradWindow = class extends HTMLElement {
	passiveWidget = [
		"tkrad-application",
		"tkrad-frame",
		"tkrad-labelframe",
		"tkrad-button",
		"tkrad-toolbar",
		"tkrad-image",
		"tkrad-zombie",
		"tkrad-label"
	]
	setValueFromTcl( value ) {}
	getValue() { return "" }
	resetValue() {}
	setValidate ( bool ) {}
	setHidden ( status ) {
		if ( status == "true" ) {
			this.style["display"] = "none"
			this.tclProperty.hidden = this.tclProperty.readonly
			this.tclProperty.readonly = true
		} else {
			this.style["display"] = ""
			this.tclProperty.readonly = this.tclProperty.hidden
		}
	}
	setReadOnly ( status ) {
		if ( status == "true" ) {
			this.focusElement.setAttribute("readonly", "")
			this.tclProperty.readonly = true
		} else {
			this.focusElement.removeAttribute("readonly")
			this.tclProperty.readonly = false
		}
	}
	valueBack() {
		let back = {}
		back.action = "focusout"
		back.value = this.getValue()
		this.sendEvent("widget", back)
	}
	runFocusOut () {}
	buildObject () {}
	// design a label around the object
	buildLabel ( parent, object ) {
		if ( typeof(this.tclData.label) == "undefined") {
			parent.appendChild(object)
			return
		}
		let label = document.createElement("tkrad-labelbox")
		label.setLabelText(this.tclData.label)
		label.appendChild(object)
		parent.appendChild(label)
	}
	tclBuilder ( wish, input ) {
		let parent = wish.getObjectElement(input.pid)
		this.wishObject = wish
		this.wmObject = wish.wmObject
		// normalize some values
		if ( typeof(input.size) != "undefined" ) {
			input.size = parseInt(input.size)
		}
		if ( typeof(input.visible) != "undefined" ) {
			input.visible = parseInt(input.visible)
		}
		if ( typeof(input.lines) != "undefined" ) {
			input.lines = parseInt(input.lines)
		}
		this.tclData = input
		this.tclProperty = {
			readonly: false,
			hidden: false
		}
		this.widKeys = []
		this.containerObject = input
		if ( input.element != "tkrad-application" ) {
			this.appObject = wish.getObjectElement(input.appid)
		}
		if ( !this.passiveWidget.includes(input.element) ) {
			this.appObject.registerWidget(this)
		}
		if ( input.element == "tkrad-toolbar" ) {
			this.appObject.registerToolbar(this)
		}
		wish.setObjectElement(this)
		if (parent != undefined && (parent.classList.contains('tkrad-record') || parent.classList.contains('tkrad-query') || parent.classList.contains('tkrad-option') || parent.classList.contains('tkrad-detail'))) {
			input.row = parseInt(input.row,10) + 1
		}
		if ( typeof(input.row) != "undefined" ) {
			this.style["grid-row"] = input.row
		}
		if ( typeof(input.col) != "undefined" ) {
			this.style["grid-column"] = input.col
		}
		if ( typeof(input.readonly) != "undefined" ) {
			this.tclProperty.readonly = true
		}
	}
	sendEvent(event, values) {
		let data = {}
		data.command = "event"
		data.name = event
		data.id = this.tclData.id
		for ( let key in values ) {
			data[key] = values[key]
		}
		this.wishObject.sendData(data)
	}
	setWidgetFocus () {
		// tkrad.consoleLog("FOCUS WIDGET", this.focusElement, this.tclData)
		this.focusElement.focus()
	}
	isVisible () {
		if ( this.clientHeight > 0 ) { return true }
		if ( this.clientWidth > 0 ) { return true }
		return false
	}
	makeID (tag) {
		let id = this.appObject.wishObject.pidNumber
		id += this.appObject.id + this.id + "_" + tag
		return id
	}
}
//
// tkrad toplevel
//
customElements.define("tkrad-application", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	buildObject () {
		tkrad.consoleLog("BUILD APPLICATION", this)
		this.toolbarList = []
		this.contextList = []
		this.contextId = {}
		this.triggerList = []
		this.triggerId = {}
		this.wishObject.setTitle(this.tclData.title)
		this.checkDialog()
		this.setAttribute("run", "false")
	}
	runApplication() {
		this.setAttribute("run", "true")
	}
	killMe() {
		this.exitApplication()
	}
	runProgress(mode, value) {
		if ( mode == "start" ) {
			let obj = document.createElement("tkrad-progress")
			obj.buildObject()
			this.progressObject = obj
			this.appendChild(obj)
		} else if ( mode == "stop" ) {
			this.removeChild(this.progressObject)
		} else if ( mode == "showperc" ) {
			tkrad.consoleLog("TODO PERC", value)
		} else {
			tkrad.consoleLog("BAD PROGRESS", mode, value)
		}
	}
	runDownload(input) {
		let download = this.wishObject.downloadDriver
		if ( this.downloadMode == "download") {
			download.setAttribute("download","")
		}
		let byteCharacters = atob(input.content)
		let byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
  			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		let byteArray = new Uint8Array(byteNumbers);
		let blob = new Blob([byteArray], {type: input.mime});
		let url = URL.createObjectURL(blob)
		download.setAttribute("href", url)
		download.click()
		download.removeAttribute("href")
		if ( this.downloadMode == "download") {
			download.removeAttribute("download")
		}
	}
	checkDialog() {
		if ( typeof(this.tclData.domclass) == "undefined" ) { return }
		if ( !this.tclData.domclass.includes("tkrad-dialog")) { return }
	}
	exitApplication() {
		this.sendEvent("application", { action: "close" })
	}
	parkApplication() {
		this.wishObject.parkWish()
	}
	connectedCallback() {
		if ( this.tclData.pid != this.tclData.id ) {
			this.parentApplication = this.wishObject.getObjectElement(this.tclData.pid)
			this.parentApplication.style["display"] = "none"
			this.isChild = true
		} else {
			this.isChild = false
		}
	}
	disconnectedCallback() {
		if ( typeof(this.modalBox) != "undefined" ) {
			this.modalBox.driver.hide()
			this.modalBox.driver.close()
		}
		if ( !this.isChild ) { return }
		this.parentApplication.style["display"] = "grid"
		let master = this.wishObject.getObjectElement(this.tclData.pid)
		// mandatory where killing apps
		if ( master != null ) {
			master.widgetFocus.setWidgetFocus()
		}
	}
	registerToolbar ( elem ) {
		this.toolbarList.push(elem)
	}
	registerWidget ( elem ) {
		if ( elem.tclData.ctxid == null ) { return }
		this.elem2Context(elem)
		this.elem2Trigger(elem)
	}
	elem2Context ( elem ) {
		let ctxid = elem.tclData.ctxid
		let idx = this.contextList.indexOf(ctxid)
		let ctxobj = this.contextId[this.contextList[idx]]
		ctxobj.addWidget(elem)
	}
	elem2Trigger ( elem ) {
		if ( typeof(elem.tclData.trgid) == "undefined" ) { return }
		let trgid = elem.tclData.trgid
		let idx = this.triggerList.indexOf(trgid)
		let trgobj = this.triggerId[this.triggerList[idx]]
		trgobj.addWidget(elem)
	}
	dropTrigger ( obj ) {
		// tkrad.consoleLog("DROP TRIGGER", this.triggerList)
		let id = obj.id
		delete this.triggerId[id]
		let idx = this.triggerList.indexOf(id)
		this.triggerList.splice(idx, 1)
		// tkrad.consoleLog("DROP TRIGGER", this.triggerList)
	}
	addTrigger ( input ) {
		let trgobj = new tkrad.triggerObject(input.id)
		let trgid = input.id
		this.triggerList.push(trgid)
		this.triggerId[trgid] = trgobj
	}
	dropContext ( obj ) {
		// tkrad.consoleLog("DROP CONTEXT", this.contextList)
		let id = obj.id
		delete this.contextId[id]
		let idx = this.contextList.indexOf(id)
		this.contextList.splice(idx, 1)
		// tkrad.consoleLog("DROP CONTEXT", this.contextList)
	}
	addContext ( input ) {
		let ctxobj = new tkrad.contextObject(input.id)
		ctxobj.appObject = this
		let ctxid = input.id
		this.contextList.push(ctxid)
		this.contextId[ctxid] = ctxobj
	}
	setFocus () {
		setTimeout( () => {
			for ( let key in this.contextList ) {
				let ctxid = this.contextList[key]
				let obj = this.contextId[ctxid]
				if ( obj.isReadOnly() ) {
					continue
				}
				obj.setFocus()
				break
			}
		}, 0)
	}
	onkeydownHandler (widget, e) {
		// tkrad.consoleLog(e.keyCode)
		let move = [ 13, 9 ]
		if ( move.includes(e.keyCode) ) {
			e.preventDefault();
		} else if ( e.keyCode >= 112 && e.keyCode <= 121 ) {
			e.preventDefault();
		} else if ( widget.tkradComponent.widKeys.includes(e.keyCode) ) {
			e.preventDefault()
		}
	}
	onkeyupHandler (widget, e) {
		let move = [ 13, 9]
		let tkrad = widget.tkradComponent
		if ( move.includes(e.keyCode) ) {
			if ( e.shiftKey && e.ctrlKey ) {
				tkrad.appObject.prevContext(tkrad)
			} else if ( e.ctrlKey ) {
				tkrad.appObject.nextContext(tkrad)
			} else if ( e.shiftKey ) {
				tkrad.contextObject.prevWidget(tkrad)
			} else {
				tkrad.contextObject.nextWidget(tkrad)
			}
		} else if ( tkrad.widKeys.includes(e.keyCode) ) {
			tkrad.keyRun(e)
		} else if ( e.keyCode >= 112 && e.keyCode <= 121 ) {
			this.keyRun(tkrad, e)
		}
	}
	getTrigger ( elem ) {
		if ( typeof(elem.triggerObject) == "undefined" ) { return "" }
		return elem.triggerObject.id
	}
	runTriggerEvent ( elem ) {
		let trgout
		let trgcur = this.getTrigger(elem)
		if ( typeof(this.widgetFocus) == "undefined" ) {
			trgout = ""
		} else {
			trgout = this.getTrigger(this.widgetFocus)
		}
		if ( trgout != trgcur && trgout != "" ) {
			// tkrad.consoleLog("TRIGGER EXIT", trgout)
		}
		if ( trgcur != "" ) {
			// tkrad.consoleLog("TRIGGER ENTER", trgcur)
		}
	}
	runContextEvent( elem ) {
		if ( typeof(this.contextFocus) == "undefined" ) {
			// tkrad.consoleLog("CONTEXT ENTER", elem.contextObject)
		} else if ( elem.contextObject != this.contextFocus ) {
			// tkrad.consoleLog("CONTEXT LEAVE", this.contextFocus)
			elem.sendEvent("context", {action: "leave", id: this.contextFocus.id})
			// tkrad.consoleLog("CONTEXT ENTER", elem.contextObject)
		} else {
			return
		}
	}
	restoreFocus() {
		this.widgetFocus.setWidgetFocus()
	}
	focusinHandler ( source ) {
		let elem = source.tkradComponent
		elem.setValidate(true)
		this.runTriggerEvent(elem)
		this.runContextEvent(elem)
		this.widgetFocus = elem
		this.contextFocus = elem.contextObject
		if ( typeof(elem.triggerObject) != "undefined") {
			elem.triggerObject.beforeImage()
		}
		if ( typeof(elem.focusElement.select) != "undefined" ) {
			elem.focusElement.select()
		}
	}
	focusoutHandler ( source ) {
		if ( typeof(source) == "undefined" ) { return }
		let elem = source.tkradComponent
		// tkrad.consoleLog("FOCUS OUT HANDLER", elem)
		elem.runFocusOut()
		this.fireTrigger(elem)
	}
	fireTrigger ( elem ) {
		if ( typeof(elem.triggerObject) == "undefined") { return }
		elem.triggerObject.afterImage()
		if ( elem.triggerObject.imageChanged() ) {
			let eve = {}
			eve.trigger = elem.triggerObject.id
			eve.action = "changed"
			this.sendEvent("trigger", eve)
		}
	}
	widgetAction () {
		this.focusoutHandler(this.toolbarFocusWidget)
	}
	nextContext ( elem ) {
		let idx = this.contextList.indexOf(elem.tclData.ctxid)
		let next = idx == ( this.contextList.length - 1 ) ? 0 : idx + 1
		while ( next != idx ) {
			let ctx = this.contextList[next]
			let ctxobj = this.contextId[ctx]
			if ( ctxobj.isReadOnly() ) {
				next = next == ( this.contextList.length - 1 ) ? 0 : next + 1
				continue
			}
			if ( ctxobj.isMapped() ) { break }
			next = next == ( this.contextList.length - 1 ) ? 0 : next + 1
		}
		let ctx = this.contextList[next]
		this.contextId[ctx].setFocus()
	}
	prevContext ( elem ) {
		let idx = this.contextList.indexOf(elem.tclData.ctxid)
		let next = idx == 0 ? this.contextList.length - 1 : idx - 1
		while ( next != idx ) {
			let ctx = this.contextList[next]
			let ctxobj = this.contextId[ctx]
			if ( ctxobj.isReadOnly() ) {
				next = next == 0 ? ( this.contextList.length - 1 ) : next - 1
				continue
			}
			if ( ctxobj.isMapped() ) { break }
			next = next == 0 ? ( this.contextList.length - 1 ) : next - 1
		}
		let ctx = this.contextList[next]
		this.contextId[ctx].setFocus()
	}
	setFocusObject ( elem, object ) {
		elem.focusElement = object
		object.tkradComponent = elem
		let textobj = ["TKRAD-TEXT", "TKRAD-LOGGER"]
		// let text keyboard interface free
		if ( !textobj.includes(elem.tagName) ) {
			object.onkeydown = ( (e) => {
				this.onkeydownHandler(object, e)
			})
			object.onkeyup = ( (e) => {
				this.onkeyupHandler(object, e)
			})
		}
		object.addEventListener("focusin", () => {
			this.focusinHandler(object)
		})
		object.addEventListener("focusout", () => {
			this.focusoutHandler(object)
		})
	}
	buttonManager ( ctxobj, input ) {
		let tool
		for ( let key in this.toolbarList ) {
			tool = this.toolbarList[key]
			if ( tool.tclData.id == input.toolbar ) { break }
		}
		tool.buttonManager(input, ctxobj, input.run)
	}
	keyRun (elem, e) {
		for ( let key in this.toolbarList ) {
			let tool = this.toolbarList[key]
			tool.evalKey(elem.contextObject, e)
		}
	}
	buildFormat ( fmt ) {
		let form = {}
		if (/^C/.test(fmt) == true) {
			form.driver = jsrad.format.macro[fmt]
			form.type = "string"
			form.len = form.driver.size
		} else if ( ["DD/DD/DDDD","DATE"].includes(fmt) ) {
			form.driver = jsrad.format.macro["date"]
			form.type = "date"
			form.len = "10"
		} else if ( fmt == "money" ) {
			form.driver = jsrad.format.macro[fmt]
			form.type = "number"
			form.len = form.driver.size
		} else {
			let drive = jsrad.format.createFormat(fmt)
			form.driver = jsrad.format.normalizeFormat(drive)
			form.type = "number"
			form.len = fmt.length.toString()
		}
		form.align = "right"
		form.db2screen = function(value) {
			return jsrad.format.db2screen(value, this.driver)
		}
		return form
	}
});
//
// tkrad frame
//
customElements.define("tkrad-frame", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	connectedCallback() {
		this.classList.add("tkrad-frame")
	}
	setContext(ctxid) {
		this.tclData.ctxframeid = ctxid
	}
	addToolbar() {
		let ele = document.createElement("tkrad-frame")
		ele.classList.add("tkrad-toolframe")
		ele.style["grid-area"] = "1 / 1 / auto / end"
		ele.style["z-index"] = "0"
		this.appendChild(ele)
		this.sys = document.createElement("tkrad-systool")
		this.sys.custom = 1
		ele.appendChild(this.sys)
		this.sys.style["display"] = "none"
		this.sys.appObject = this.appObject
		this.tool = document.createElement("tkrad-toolbar")
		ele.style["display"] = "none"
		for ( let id in this.appObject.toolbarList ) {
			let tool = this.appObject.toolbarList[id]
			for ( let key in tool.buttonList ) {
				let btobj = tool.buttonId[tool.buttonList[key]]
				if ( typeof(btobj.contextList[this.tclData.ctxframeid]) != "undefined" ) {
					ele.style["display"] = "flex"
					this.tool.appendChild(btobj)
				}
			}	
		}
		ele.appendChild(this.tool)
	}
	getToolbar() {
		return this.tool
	}
	getSystool() {
		return this.sys
	}
	addIcon ( name ) {
		let obj = document.createElement("tkrad-button")
		obj.style["grid-column-end"] = -1
		obj.profileButton({ icon: name})
		this.appendChild(obj)
		return obj
	}
	setIcon ( id, name ) {
		let obj = this.addIcon(name)
		this.widKeys.push(115) // TODO F4 FISSO ?
		obj.runCommand = () => {
			this.appObject.sendEvent("gadget", { action: "run", id: id })
		}
		this.keyRun =  (e) => { obj.runCommand() }
	}
	disconnectedCallback() {
	}
});

customElements.define("tkrad-labelframe", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	connectedCallback() {
		this.tclData.label = this.tclData.title
		this.fieldFrame = document.createElement("tkrad-frame")
		this.buildLabel(this, this.fieldFrame)
	}
	setContext(ctxid) {
		this.tclData.ctxframeid = ctxid
	}
	addToolbar() {
		let ele = document.createElement("tkrad-frame")
		ele.classList.add("tkrad-toolframe")
		ele.style["grid-area"] = "1 / 1 / auto / end"
		this.appendChild(ele)
		this.sys = document.createElement("tkrad-systool")
		this.sys.custom = 1
		ele.appendChild(this.sys)
		this.sys.style["display"] = "none"
		ele.style["z-index"] = "0"
		this.sys.appObject = this.appObject
		this.tool = document.createElement("tkrad-toolbar")
		ele.style["display"] = "none"
		for ( let id in this.appObject.toolbarList ) {
			let tool = this.appObject.toolbarList[id]
			for ( let key in tool.buttonList ) {
				let btobj = tool.buttonId[tool.buttonList[key]]
				if ( typeof(btobj.contextList[this.tclData.ctxframeid]) != "undefined" ) {
					ele.style["display"] = "flex"
					this.tool.appendChild(btobj)
				}
			}	
		}
		ele.appendChild(this.tool)
	}
	getToolbar() {
		return this.tool
	}
	getSystool() {
		return this.sys
	}
	disconnectedCallback() {
	}
	_appendChild ( ele ) {
		this.fieldFrame.appendChild(ele)
	}
});

customElements.define("tkrad-semaforo", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.myIcon = document.createElement("span")
		this.myIcon.classList.add("mdi")
		this.myIcon.classList.add("mdi-checkbox-blank-circle")
		this.myIcon["style"].color = "grey"
	}
	buildObject () {
		this.appendChild(this.myIcon)
	}
	setValueFromTcl (value) {
		let vals = this.tclData.values
		let color = "grey"
		if ( typeof(vals[value]) != "undefined" ) {
			color = vals[value]
		}
		this.myIcon["style"].color = color
	}
})
//
// tkrad toolbar
//
customElements.define("tkrad-toolbar", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.buttonList = []
		this.buttonId = {}
		this.buttonTclId = {}
	}
	connectedCallback() {
	}
	disconnectedCallback() {
	}
	addButton(input) {
		let button
		let parent = this.appObject.wishObject.getObjectElement(input.id)
		if ( this.buttonList.includes(input.template) && typeof(input.ctxid) == "undefined" ) {
			let idx = this.buttonList.indexOf(input.template)
			let template = this.buttonList[idx]
			button = this.buttonId[template]
		} else {
			if ( typeof(input.ctxid) == "undefined" || typeof(input.menu) == "undefined" || !parent.classList.contains('tkrad-apptool') ) {
				button = document.createElement("tkrad-button")
				if ( typeof(input.key) != "undefined" ) {
					button.keyName = input.key
				}
				button.runCommand = () => { this.runButton(button) }
				if ( parent.classList.contains('tkrad-apptool') ) {
					this.buttonList.push(input.template)
				} 
				if ( input.menu == "true" ) {
					input.icon = 'menu'
				}
				button.profileButton(input)
				this.buttonId[input.template] = button
				button.contextList = {}
				button.contextDisabled = {}
				button.appObject = this.appObject
			}
			if ( typeof(input.ctxid) == "undefined" ) {
				this.appendChild(button)
			} else if ( !parent.classList.contains('tkrad-apptool') ) {
				if ( !this.buttonList.includes(input.template) ) {
					this.buttonList.push(input.template)
					parent.appendChild(button)
				}
			} else {
				let ctx = ""
				let ele = document.getElementsByClassName("tkrad-record")
				for (let i = 0; i < ele.length; i++) {
					if ( ele[i].tclData.ctxframeid == input.ctxid ) {
						ctx = ele[i]
					}
				}
				if ( ctx == "" ) {
					let ele = document.getElementsByClassName("tkrad-option")
					for (let i = 0; i < ele.length; i++) {
						if ( ele[i].tclData.ctxframeid == input.ctxid ) {
							ctx = ele[i]
						}
					}
				}
				if ( ctx == "" ) {
					let ele = document.getElementsByClassName("tkrad-query")
					for (let i = 0; i < ele.length; i++) {
						if ( ele[i].tclData.ctxframeid == input.ctxid ) {
							ctx = ele[i]
						}
					}
				}
				if ( ctx == "" ) {
					let ele = document.getElementsByClassName("tkrad-detail")
					for (let i = 0; i < ele.length; i++) {
						if ( ele[i].tclData.ctxframeid == input.ctxid ) {
							ctx = ele[i]
						}
					}
				}
				if ( ctx != "" ) {
					if ( ctx.tclData.ctxframeid == input.ctxid ) {
						if (input.menu == "true") {
							let sys = ctx.getSystool()
							button = sys.doMenu(input, () => { this.runButton(button) } )
							button.contextList = {}
							button.contextDisabled = {}
							button.appObject = this.appObject
							this.buttonList.push(input.template)
							this.buttonId[input.template] = button
							sys.style["display"] = "block"
							let parent = sys.parentNode
							parent.style["display"] = "flex"
						} else {
							let tool = ctx.getToolbar()
							tool.appendChild(button)
							let parent = tool.parentNode
							parent.style["display"] = "flex"
						}
					}
				}
			}
		}
		if ( typeof(input.ctxid) != "undefined" ) {
			button.contextList[input.ctxid] = input
			button.ctxid = input.ctxid
			button.contextDisabled[input.ctxid] = false
		} else {
			button.globalId = input.bid
		}
		this.buttonTclId[input.bid] = button
	}
	runMenu(input) {
		let button = this.buttonTclId[input.bid]
		button.buildMenu(input.run, (cod) => {
			let eve = {}
			eve.button = input.bid
			eve.widget = input.id
			eve.action = cod
			this.sendEvent("menubutton", eve)
		})
	}
	runButton (button) {
		if ( button.isDisabled() ) { return }
		let ctxobj = this.appObject.contextFocus
		let widobj = this.appObject.widgetFocus
		widobj.runFocusOut()
		widobj.appObject.fireTrigger(widobj)
		let eve = {}
		if ( typeof(button.globalId) == "undefined" ) {
			let input = button.contextList[button.ctxid]
			eve.button = input.bid
			eve.context = button.ctxid
		} else {
			eve.button = button.globalId
			eve.context = ctxobj.id
		}
		eve.widget = widobj.tclData.id
		if ( typeof(widobj.loadInvokeData) != "undefined" ) {
			widobj.loadInvokeData(eve)
		}
		// se abbiamo un menu ed è aperto lo chiudo e ritorno
		if ( typeof(button.resetMenu) != "undefined" && button.resetMenu() ) {
			return
		}
		this.sendEvent("invoke", eve)
	}
	buttonManager(input, ctxobj, action) {
		let btobj = this.buttonTclId[input.bid]
		if ( action == "disable" ) {
			btobj.contextDisabled[ctxobj.id] = true
			btobj.disableButton()
		} else if ( action == "enable" ) {
			btobj.contextDisabled[ctxobj.id] = false
			btobj.enableButton()
		}
	}
	evalKey ( ctxobj, e ) {
		let keyname = "F" + ( e.keyCode - 111 ).toString()
		if ( e.shiftKey ) { keyname = "Shift-" + keyname }
		if ( e.ctrlKey ) { keyname = "Ctrl-" + keyname }
		for ( let key in this.buttonList ) {
			let btobj = this.buttonId[this.buttonList[key]]
			if ( btobj.isDisabled() ) { continue }
			if ( typeof(btobj.keyName) == "undefined" ) { continue }
			if ( btobj.keyName != keyname ) { continue }
			setTimeout( () => { this.runButton(btobj) }, 0)
			return
		}
	}
});
//
// tkrad sysToolbar
//
customElements.define("tkrad-systool", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	connectedCallback() {
		if ( typeof(this.custom) != "undefined" ) { return }
		if ( typeof(this.appObject.modalBox) != "undefined" ) { return }
		if ( this.appObject.isChild ) {
			this.classList.add("tkrad-systool-child")
			this.doButton("<", () => {
				this.appObject.exitApplication()
			})
		} else {
			this.classList.add("tkrad-systool-main")
			this.doButton("X", () => {
				this.appObject.exitApplication()
			})
			this.doButton("-", () => {
				this.appObject.parkApplication()
			})
		}
	}
	disconnectedCallback() {}
	doButton(txt, cmd) {
		let button = document.createElement("tkrad-button")
		if ( txt == "-" ) {
			button.profileButton({ icon: "minimize" })
		} else if ( txt == "<" ) {
			button.profileButton({ icon: "goback", text: "Indietro" })
		} else if ( txt == "X" ) {
			button.profileButton({ icon: "close" })
		} else {
			button.profileButton({ icon: "" })
		}
		button.runCommand = cmd
		this.appendChild(button)
	}
	doMenu(input, cmd) {
		let button = document.createElement("tkrad-button")
		button.profileButton({ icon: "menu", text: input.text })
		button.runCommand = cmd
		this.appendChild(button)
		return button	
	}
});
//
// image widget
//
customElements.define("tkrad-image", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.myObject = document.createElement("embed")
	}
	buildObject() {
		// this.myObject.setAttribute("width", tkrad.pixelSize.getWidth(this.tclData.width))
		// this.myObject.setAttribute("height", tkrad.pixelSize.getHeight(this.tclData.height))
	}
	connectedCallback() {
		this.appendChild(this.myObject)
	}
	resetValue () {
		this.myObject.removeAttribute("src")
	}
	setValueFromTcl ( value ) {
		let inline = "data:image/jpg;base64," + btoa(value)
		this.myObject.setAttribute("src", inline)
		this.myObject.style["display"] = "block"
	}
})
//
// zombie widget - not implemented
//
customElements.define("tkrad-zombie", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.myObject = document.createElement("button")
		this.myObject.innerHTML = "Z"
		this.focusElement = this.myObject
	}
	connectedCallback() {
		this.style["display"] = "none"
		this.appObject.setFocusObject(this, this.myObject)
		this.appendChild(this.myObject)
		tkrad.consoleLog("ZOMBIE", this)
	}
})
//
// checkbox widget - not implemented
//
customElements.define("tkrad-checkbox", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	buildObject () {
		this.onValue = this.tclData.on
		this.offValue = this.tclData.off
		this.checkBox = document.createElement("input")
		this.checkBox.type = "checkbox"
		this.checkBox.classList.add("form-check-input")
		this.appObject.setFocusObject(this, this.checkBox)
		this.buildLabel(this, this.checkBox)
	}
	connectedCallback() {}
	runFocusOut() { this.valueBack() }
	resetValue () {
		this.checkBox.checked = false
	}
	getValue () {
		if ( !this.checkBox.checked ) { return this.offValue }
		return this.onValue
	}
	setValueFromTcl ( value ) {
		if ( value == null ) { value = this.offValue }
		if ( value == this.onValue ) {
			this.checkBox.checked = true
		} else {
			this.checkBox.checked = false
		}
	}
})
//
// radioentry/combo
//
customElements.define("tkrad-radioentry", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	buildObject () {
		this.entryField = document.createElement("select")
		this.entryField.classList.add("form-select")
		this.entryField.classList.add("w-auto")
		for ( let key in this.tclData.values ) {
			let ele = document.createElement("option")
			ele.value = key
			ele.innerHTML = this.tclData.values[key]
			this.entryField.appendChild(ele)
		}
		this.entryField.id = this.tclData.id + "_radio"
		this.appObject.setFocusObject(this, this.entryField)
		this.buildLabel(this, this.entryField)
		if ( typeof(this.tclData.selectcommand) != "undefined" ) {
			this.entryField.onchange = () => {
				let back = {}
				back.action = "selectcommand"
				back.value = this.getValue()
				this.sendEvent("widget", back)
			}
		}
	}
	connectedCallback() {}
	runFocusOut() {
		this.valueBack()
	}
	resetValue () {
		this.value("")
		this.setValidate(true)
	}
	getValue () {
		return this.entryField.value
	}
	setValueFromTcl ( key ) {
		if ( key == null ) {
			this.entryField.value = ""
		} else if ( typeof(this.tclData.values[key]) != "undefined" ) {
			this.entryField.value = key
		} else {
			this.entryField.value = ""
		}
		this.setValidate(true)
	}
	setValidate( val ) {
		this.entryField.validation = val
	}
	runAction( input ) {
		if ( input.action == 'resetlist' ) {
			this.tclData.values = ""
			let options = this.entryField.options
			for (var i=0; i<options.length; i++) {
				this.entryField.removeChild(options[i]);
				i--;
			}
		} else if ( input.action == 'addlist' ) {
			this.tclData.values = input.values
			for ( let key in input.values ) {
				let ele = document.createElement("option")
				ele.value = key
				ele.innerHTML = input.values[key]
				this.entryField.appendChild(ele)
			}
		}
	}
})
//
// tkrad text
//
customElements.define("tkrad-text", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	buildObject() {
		this.entryField = document.createElement("textarea")
		this.entryField.classList.add("form-control")
		this.appendChild(this.entryField)
		this.appObject.setFocusObject(this, this.entryField)
		if ( typeof(this.tclData.height) != "undefined" ) {
			this.entryField.style["height"] = this.tclData.height + "em"
		}
		if ( typeof(this.tclData.width) != "undefined" ) {
			this.entryField.style["width"] = this.tclData.width + "ch"
		}
	}
	connectedCallback() {
		if ( this.tclData.mode == "logger" ) {
			this.setReadOnly("true")
		}
	}
	resetValue () {
		this.entryField.value = ""
	}
	getValue () {
		let value = this.entryField.value
		return value
	}
	setValueFromTcl ( value ) {
		if ( value == null ) { value = "" }
		this.entryField.value = value
	}
	addValue ( what, mode, value ) {
		if ( what == "line" ) {
			this.entryField.value += "\n" + value
			this.entryField.scrollTop = this.entryField.scrollHeight
		}
	}
	runFocusOut () {
		let back = {}
		let value = this.entryField.value
		this.valueBack()
	}
})
customElements.define("tkrad-gadget-date", class extends HTMLElement {
	constructor () {
		super()
		this.button = document.createElement("button")
		this.button.classList.add("tkrad-button-gadget")	
		this.button.classList.add("mdi", tkrad.getIcon("event"))
	}
	addTo(obj) {
		let span = obj.querySelector(".tkrad-entry-icon")
		if ( span == null ) {
			span = document.createElement("span")
			span.classList.add("tkrad-entry-icon")
			let parent = obj.entryField.parentNode
			obj.entryField.remove()
			span.appendChild(obj.entryField)
			parent.appendChild(span)
		}
		span.appendChild(this.button)	
		this.button.onclick = (() => {
			let elem = document.createElement("tkrad-datepicker")
			elem.date = obj.getValue() 
			elem.runCommand = this.runCommand 
			let jsdata = new Date()
			if ( elem.date != "" ) {
				let yy = Math.trunc( elem.date / 10000 )
				let mm = Math.trunc( ( elem.date - ( yy * 10000 ) ) / 100 )
				let dd = elem.date % 100
				mm--
				jsdata = new Date(yy,mm,dd)
			}
			elem.runWidget(obj, jsdata)
			obj.setWidgetFocus()
		})
	}
	setReturn(run) {
		this.runCommand = run
	}
	returnMtpDate(run) {
		this.runCommand = function(date) {
			let value = null
			if ( date != null ) {
				let yy = date.getFullYear()
				let mm = date.getMonth() + 1
				let dd = date.getDate()
				value = yy * 10000 + mm * 100 + dd
				value = value.toString()
			}
			run(value, date)
		}
	}
})
//
// tkrad entry
//
customElements.define("tkrad-entry", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	buildObject() {
		this.entryField = document.createElement("input")
		this.classList.add("tkrad-input")
		this.entryField.classList.add("form-control")
		this.entryField.classList.add("d-inline-block")
		this.appendChild(this.entryField)
		if ( typeof(this.tclData.type) != "undefined" && this.tclData.type != "password" ) {
			this.entryField.type = this.tclData.type
		} else {
			this.entryField.type = "text"
		}
		this.buildLabel(this, this.entryField)

		this.appObject.setFocusObject(this, this.entryField)
		if ( typeof(this.tclData.type) != "undefined" && this.tclData.type == "password" ) {
				let obj = this.addIcon("")
				obj.showData = true
				obj.runCommand = () => {
					this.switchPasswordMode(obj)
				}
				obj.onclick = obj.runCommand
				this.switchPasswordMode(obj)
		}
		this.hasFormat = false
		if ( typeof(this.tclData.format) != "undefined" ) {
			let form = this.appObject.buildFormat(this.tclData.format)
			if ( form.type == "date" ) {
				this.dressDate()
			}
			this.hasFormat = true
			this.macroFormat = form.driver
			if ( form.align = "right" ) {
				this.entryField.style["textAlign"] = "right"
			}
			this.tclData.size = form.len
		}
	}
	dressDate() {
		let obj = document.createElement("tkrad-gadget-date")
		obj.addTo(this)
		obj.returnMtpDate((date) => {
			if ( date != null ) { this.setValueFromTcl(date) }
			this.setWidgetFocus()
		})	
	}
	switchPasswordMode ( obj ) {
		if ( obj.showData ) {
			obj.showData = false
			this.entryField.type = "password"
			// TODO obj.changeIcon("visible")
		} else {
			obj.showData = true
			this.entryField.type = "text"
			// TODO obj.changeIcon("hidden")
		}
	}
	addIcon ( name ) {
		let span = this.querySelector(".tkrad-entry-icon")
		// first icon
		if ( span == null ) {
			span = document.createElement("span")
			span.classList.add("tkrad-entry-icon")
			let parent = this.entryField.parentNode
			this.entryField.remove()
			span.appendChild(this.entryField)
			parent.appendChild(span)
		}
		let obj = document.createElement("button")
		obj.classList.add("mdi", tkrad.getIcon(name))
		obj.classList.add("tkrad-button-gadget")
		span.appendChild(obj)
		return obj
	}
	setIcon ( id, name ) {
		let obj = this.addIcon(name)
		this.widKeys.push(115) // TODO F4 FISSO ?
		obj.runCommand = () => {
			this.setWidgetFocus()
			this.appObject.sendEvent("gadget", { action: "run", id: id })
		}
		obj.onclick = obj.runCommand
		this.keyRun =  (e) => { obj.runCommand() }
	}
	connectedCallback() {
		if ( this.tclProperty.readonly ) {
			this.setReadOnly("true")
		}
		let visible = this.tclData.size
		if ( typeof(this.tclData.visible) != "undefined" ) {
			visible = this.tclData.visible
		}
		if ( this.tclData.size == 0 ) {
			this.tclData.size = 4
		}
		this.entryField.size = this.tclData.size
		visible = tkrad.pixelSize.getChar(parseInt(visible))
		this.entryField["style"].width = visible + "ch"
		this.entryField.setAttribute("maxlength", parseInt(this.entryField.size))
	}
	disconnectedCallback() {}
	resetValue () {
		this.setValidate(true)
		this.entryField.value = ""
	}
	getValue () {
		let value = this.entryField.value
		if ( this.hasFormat ) {
			value = jsrad.format.screen2db(value, this.macroFormat)
		}
		return value
	}
	setValueFromTcl ( value ) {
		this.setValidate(true)
		if ( value == null ) { value = "" }
		if ( this.hasFormat ) {
			value = jsrad.format.db2screen(value, this.macroFormat)
		}
		this.entryField.value = value
		if ( typeof(this.triggerObject) != "undefined" ) {
			this.triggerObject.beforeImage()
		}
	}
	setValidate ( val ) {
		this.entryField.setAttribute("validation", val.toString())
	}
	runFocusOut () {
		let back = {}
		let value = this.entryField.value
		if ( this.hasFormat ) {
			let vl1 = jsrad.format.screen2db(value, this.macroFormat)
			let vl2 = jsrad.format.db2screen(vl1, this.macroFormat)
			this.entryField.value = vl2
		}
		this.valueBack()
	}
});
//
// tkrad large object
//
customElements.define("tkrad-lo", class extends tkrad.tkradWindow {
	// TODO multiple ? accept ? href ?
	// download lancia richiesta ws - tcl prepara il file e ritorna il suo id
	// con l'id attiviamo con click() download.tcl che rimuove pure
	// upload on change
	// flags abilitano le singole funzioni - null disable download
	constructor () {
		super()
	}
	doIcon ( icon, command ) {
		let ele = document.createElement("tkrad-button")
		ele.profileButton({ icon: icon})
		this.appendChild(ele)
		ele.runCommand = command
		return ele
	}
	buildObject () {
		this.fileInput = this.appObject.wishObject.uploadDriver
		this.setAttribute("tabindex", "0")
		// WEBIX this.style["display"] = "flex"
		this.innerHTML = `
			<div class="tkrad-file-progress" style="display: none">
				<label></label>
			</div>
		`
		this.doIcon ( "pdfview", () => {
			if ( this.widgetValue == "" ) { return }
			this.appObject.downloadMode = "view"
			let eve = { action: "download", id: this.tclData.id, objid: this.widgetValue }
			this.appObject.sendEvent("binary", eve)
		})
		this.doIcon ( "upload", () => {
			this.fileInput.click()
		})
		this.fileInput.onchange = () => {
			let files = this.fileInput.files
			for ( let idx = 0 ; idx < files.length ; idx++ ) {
				tkrad.consoleLog("FILE", files[idx])
			}
			let file = this.fileInput.files[0]
			this.uploadFile(file)
		}
		this.doIcon ( "download", () => {
			this.appObject.downloadMode = "download"
			let eve = { action: "download", id: this.tclData.id, objid: this.widgetValue }
			this.appObject.sendEvent("binary", eve )
		})
		this.onclick = () => {}
		this.appObject.setFocusObject(this, this)
	}
	uploadFile ( file ) {
		/*
		this.appObject.runProgress("start")
		let xhr = new XMLHttpRequest()
		xhr.upload.addEventListener("progress", (e) => {
			if (e.lengthComputable) {
				const percentage = Math.round((e.loaded * 100) / e.total)
				this.appObject.runProgress("showperc", percentage)
			}
		}, false)
		xhr.onreadystatechange = () => {
			// Typical action to be performed when the document is ready:
			if (xhr.readyState == 4 && xhr.status == 200) {
				this.setValueFromTcl(xhr.responseText)
				this.valueBack()
			} else if ( xhr.readyState == 4 ) {
				alert("Bad upload status " + xhr.status)
			}
		}
		xhr.upload.addEventListener("load", (e) => {
			this.appObject.runProgress("showperc", 100)
			this.appObject.runProgress("stop")
		}, false)
		xhr.open("POST", "upload.tcl")
		xhr.setRequestHeader("Content-Type", file.type)
		*/
		let reader = new FileReader()
		reader.onload = (evt) => {
			let data = reader.result.split('base64,')[1]
			let eve = { action: "upload", id: this.tclData.id, content: data, type: file.type }
			this.appObject.sendEvent("binary", eve)
		};
		reader.readAsDataURL(file)
	}
	resetValue() {
		this.widgetValue = ""
		this.fileInput.value = ""
	}
	setValueFromUpload(value) {
		this.widgetValue = value
	}
	setValueFromTcl( value ) {
		this.widgetValue = value
		this.fileInput.value = ""
	}
	getValue() {
		return this.widgetValue
	}
	runDownload(input) {
		this.appObject.runDownload(input)
	}
})
//
// tkrad labelbox
//
customElements.define("tkrad-labelbox", class extends tkrad.tkradWindow {
	setLabelText ( value ) {
		this.innerHTML = value + "<br>"
	}
})
//
// tkrad label
//
customElements.define("tkrad-label", class extends tkrad.tkradWindow {
	constructor () {
		super()
	}
	connectedCallback() {
		this.innerHTML = this.tclData.text
	}
	setValueFromTcl ( value ) {
		this.innerHTML = value
	}
})
//
// tkrad button
//
customElements.define("tkrad-button", class extends HTMLElement {
	constructor () {
		super()
		this.buttonEnabled = true
	}
	profileButton ( input ) {
		let button = document.createElement("button")
		this.htmlObject = button
		if ( typeof(input.text) != "undefined" ) {
			button.innerHTML = input.text
		}
		if ( typeof(input.icon) != "undefined" ) {
			// button.innerHTML += "(" + input.icon + ")"
			// button.type = "icon"
			button.classList.add("mdi", tkrad.getIcon(input.icon))
		}
		// button.align = "center"
		button.onclick = () => {
			if ( typeof(this.appObject) != "undefined" ) {
				this.appObject.restoreFocus()
			}
			this.runCommand()
		}
		this.appendChild(button)
		if ( typeof(input.template) != "undefined" && input.template == "appmenu" ) {
			tkrad.consoleLog("RUN APPLICATION MENU", input)
		} else if ( typeof(input.menu) != "undefined" ) {
			tkrad.consoleLog("RUN CONTEXT MENU", input)
		}
		this.buttonObject = button
	}
	changeLabel ( label ) {
		this.buttonObject.innerHTML = label
	}
	buttonSize ( label ) {
		let len = label.length
		let size = tkrad.pixelSize.getButtonWidth(len)
		return size
	}
	changeIcon ( icon ) {
		this.buttonObject.classList = []
		this.buttonObject.classList.add("mdi", tkrad.getIcon(icon))
	}
	enableButton () {
		this.htmlObject.removeAttribute("disabled")
		this.buttonEnabled = true
	}
	disableButton() {
		this.htmlObject.setAttribute("disabled", null)
		this.buttonEnabled = false
	}
	isDisabled () {
		return this.buttonEnabled ? false : true
	}
	runCommand () {
		tkrad.consoleLog("BUTTON DUMMY", this)
	}
	resetMenu () {
		this.disableButton()
		this.menuBuilder.resetValue()
		this.menuBuilder.runCommand = ( program ) => {}
	}
	walkMenu (input, root) {
		for ( let idx = 0 ; idx < input.length ; idx++ ) {
			let menu = input[idx]
			if ( menu.type == "cascade" ) {
				let sub = this.menuBuilder.addCascade(root, menu.label)
				this.walkMenu(menu.cascade, sub)
				continue
			}
			let run = this.menuBuilder.addOption(root, menu.label)
			run.tkradCommand = menu
		}
	}
	resetMenu () {
		if ( typeof(this.menuBuilder) == "undefined" ) { return false }
		this.menuBuilder.getWidget().remove()
		this.menuBuilder.unbindMenu()
		this.menuBuilder = undefined
		return true
	}
	buildMenu ( input, command ) {
		this.menuBuilder = new tkradDrop.tkrad.tkradMenu(this)
		this.walkMenu(input, this.menuBuilder.getWidget())
		this.menuBuilder.appendChild()
		this.menuBuilder.toggleWidget()
		this.menuBuilder.runCommand = (ele) => {
			if ( typeof(ele.tkradCommand.code) != "undefined" ) {
				command(ele.tkradCommand.code)
			} else {
				command(ele.tkradCommand.command)
			}
		}
		// creo callback per chiusura (sia comando che evento)
		this.menuBuilder.eventMenuClosed = () => {
			this.resetMenu()
		}
	}
})
//
// tkrad notebook
//
customElements.define("tkrad-notebook", class extends tkrad.tkradWindow {
	constructor() {
		super()
		this.buttonId = 0
		this.pageButtons = {}
		this.maxWidth = 0
	}
	connectedCallback () {
		this.classList.add("tkrad-notebook")
		this.driveFrame = document.createElement("tkrad-notebook-tool")
		this.driveButton = document.createElement("ul")
		this.driveButton.classList.add("tkrad-notebook-tool")
		this.driveFrame.appendChild(this.driveButton)
		this.pageFrame = document.createElement("div")
		this.pageFrame.classList.add("tkrad-notebook-container")
		this.appendChild(this.driveFrame)
		this.appendChild(this.pageFrame)
	}
	_appendChild ( ele ) {
		if ( Object.keys(this.pageButtons).length ) {
			ele.style["display"] = "none"
		}
		this.buttonId++
		this.pageButtons[this.buttonId] = ele
		let button = document.createElement("button")
		button.classList.add("tkrad-notebook-button")
		let idbutton = this.buttonId
		button.onclick = () => {
			this.showPage(idbutton)
		}
		button.innerHTML = ele.tclData.text
		this.driveButton.appendChild(button)
		this.pageFrame.appendChild(ele)
		ele.tkrad = {}
		ele.tkrad.button = button
		ele.classList.add("tkrad-notebook-page")
		if ( this.buttonId == 1 ) {
			this.currPage = 0
			this.showPage(1)
		}
		let curWidth = button.offsetWidth
		if (this.maxWidth < curWidth ) {
			this.maxWidth = curWidth;
		}
		let btn = this.walkChilds(this.driveButton)
		for ( let key in btn ) {
			let obj = btn[key]
			// LETALE!! portando a 0 fa casino
			// obj.style.width = this.maxWidth + "px"
		}
	}
	walkChilds ( ele ) {
		let list = []
		for (let i = 0; i < ele.children.length; i++) {
			list.push(ele.children[i])
			list = list.concat(this.walkChilds(ele.children[i]))
		}
		return list
	}
	pageManager(input) {
		let page = this.pageButtons[input.page]
		if ( input.action == "disablepage" ) {
			page.tkrad.button.disabled = true
		} else if ( input.action == "enablepage" ) {
			page.tkrad.button.disabled = undefined
		} else if ( input.action == "showpage" ) {
			this.showPage(input.page)
		} else if ( input.action == "droppage" ) {
			this.dropPage(input)
		}
	}
	dropPage ( input ) {
		let page = this.pageButtons[input.page]
		let clean = []
		let childs = this.walkChilds(page)
		for ( let key in childs ) {
			let obj = childs[key]
			if ( typeof(obj.contextObject) != "undefined" ) {
				if ( clean.includes(obj.contextObject) ) { continue }
				this.appObject.dropContext(obj.contextObject)
				clean.push(obj.contextObject)
			}
			if ( typeof(obj.triggerObject) != "undefined" ) {
				if ( clean.includes(obj.triggerObject) ) { continue }
				this.appObject.dropTrigger(obj.triggerObject)
				clean.push(obj.triggerObject)
			}
		}
		page.innerHTML = null
	}
	showPage(id) {
		if ( id == this.currPage ) { return }
		if ( this.currPage != 0 ) {
			let curpage = this.pageButtons[this.currPage]
			curpage.style["display"] = "none"
			curpage.tkrad.button.removeAttribute("tkrad-active")
		}
		let runpage = this.pageButtons[id]
		runpage.tkrad.button.setAttribute("tkrad-active", true)
		this.currPage = id
		runpage.style["display"] = "grid"
		this.appObject.sendEvent("notebook", { action: "pageopen", id: this.tclData.id, page: id })
		setTimeout ( () => {
			let obj = runpage.querySelector("tkrad-entry")
			if ( obj == null ) {
				tkrad.consoleLog("NOTEBOOK MISSING INPUT", this)
				return
			}
			if ( typeof(obj.contextObject) == "undefined" ) {
				tkrad.consoleLog("NOTEBOOK CONTEXT INPUT MISSING", obj)
				return
			}
			obj.contextObject.setFocus()
		}, 50)
	}
})
customElements.define("tkrad-datepicker", class extends HTMLElement {
	constructor () {
		super()
	}
	runWidget( caller, date ) {
		this.classList.add("tkrad-modal-box")
		this.buttonBox = document.createElement("div")
		let back = document.createElement("tkrad-button")
		this.buttonBox.appendChild(back)
		back.profileButton({ icon: "goback", text: "Ritorna" })
		back.onclick = () => { this.closeWidget(null) }
		this.widgetBox = document.createElement("div")
		this.widgetBox.appendChild(this.buttonBox)
		this.dateTable = document.createElement("table")
		this.dateTable.style["border"] = "1px solid black"
		this.dateHeader = this.dateTable.createTHead()
		this.buildHeader()
		this.dateBody = this.dateTable.createTBody()
		this.widgetBox.classList.add("tkrad-modal")
		this.widgetBox.appendChild(this.dateTable)
		this.appendChild(this.widgetBox)
		this.buildCalendar(date.getFullYear(), date.getMonth() + 1)
		document.body.appendChild(this)
	}
	connectedCallback () {}
	closeWidget (date) {
		this.remove()
		this.runCommand(date)
	}
	buildCalendar(year, month) {
		this.year = year
		this.month = month
		this.dateBody.innerHTML = ""
		if (month == 0) {
			month = 12
			year = year - 1
		}
		let date = new Date(year, month - 1, 1, 12, 0, 0)
		this.dateDesc.innerHTML = tkrad.calMonths[date.getMonth()] + " " + year
		let day = date.getDay()
		day = day == 0 ? 6 : day - 1
		date.setDate(date.getDate()-day-7)
		let limite = new Date(date)
		limite.setDate(limite.getDate()+48)
		let calrow
		for ( let loop = date ; loop <= limite ; loop.setDate(loop.getDate()+1) ) {
			let wday = loop.getDay()
			if ( wday == 1 ) { calrow = this.dateBody.insertRow() }
			let cell = calrow.insertCell()
			cell.innerHTML = loop.getDate()
			cell.style["text-align"] = "center"
			let check = loop.getMonth() + 1
			let yy = loop.getFullYear()
			let mm = loop.getMonth() + 1
			let dd = loop.getDate()
			let value = yy * 10000 + mm * 100 + dd
			if ( value == this.date ) {
				cell.style.color = 'red'
			}
			if ( loop.getMonth() + 1 != month ) {
				cell.style["opacity"] = "0.5"
				continue
			}
			cell.style["font-weight"] = "bold"
			cell.classList.add("tkrad-datepicker-day")
			cell.thedate = new Date(loop)
			cell.onclick = (() => {
				this.closeWidget(cell.thedate)
			})
		}
	}
	buildHeader () {
		let row = this.dateHeader.insertRow()
		row.style["text-align"] = "center"
		let prevcell = row.insertCell()
		let cell = row.insertCell()
		let nextcell = row.insertCell()
		let prev = document.createElement("tkrad-button")
		prev.runCommand = () => {
			let date = new Date(this.year, this.month, 1, 12, 0, 0)	
			date.setMonth(date.getMonth() - 1)
			this.buildCalendar(date.getFullYear(), date.getMonth())	
		}
		let next = document.createElement("tkrad-button")
		next.runCommand = () => {
			let date = new Date(this.year, this.month, 1, 12, 0, 0)	
			date.setMonth(date.getMonth() + 1)
			this.buildCalendar(date.getFullYear(), date.getMonth())	
		}
		prevcell.appendChild(prev)
		nextcell.appendChild(next)
		prev.profileButton({ icon: "left"})	
		next.profileButton({ icon: "right"})	
		cell.setAttribute("colspan", "6")
		cell.innerHTML = "Header mese anno e avanzamento"
		this.dateDesc = cell
		row = this.dateHeader.insertRow()
		for ( let idx = 0 ; idx < tkrad.calDays.length ; idx++ ) {
			let cell = row.insertCell()
			cell.innerHTML = tkrad.calDays[idx]
		}
	}
})
//
// tkrad message
//
customElements.define("tkrad-message", class extends HTMLElement {
	constructor() {
		super()
	}
	runBox(app, input) {
		this.classList.add("tkrad-modal-box")
		this.msgType = input.type
		this.msgTitle = input.title
		this.msgText = input.message
		this.semId = input.semid
		this.appObject = app
		this.appFocus = app.widgetFocus
		document.body.appendChild(this)
		this.querySelector(".tkrad-modal-button").focus()
	}
	connectedCallback() {
		this.messageBox()
	}
	disconnectedCallback() {}
	addButton ( action, text ) {
		let tool = this.querySelector(".tkrad-modal-tools")
		let button = document.createElement("button")
		button.classList.add("tkrad-modal-button")
		button.tkrad = {}
		button.tkrad.action = action;
		button.innerHTML = text
		button.onclick = () => {
			this.runButton(button)
		}
		tool.appendChild(button)
	}
	messageBox() {
		this.innerHTML = `
			<div class="tkrad-modal">
				<div class="tkrad-modal-title">
					<p></p>
				</div>
				<div class="tkrad-modal-content">
					<p></p>
				</div>
				<div class="tkrad-modal-tools">
				</div>
			</div>
		`
		this.querySelector(".tkrad-modal-title > p").innerHTML = this.msgTitle
		let msg = this.msgText.replace(/(\r\n|\n|\r)/gm, "<br>")
		this.querySelector(".tkrad-modal-content > p").innerHTML = msg
		if ( this.msgType == "message" ) {
			this.addButton("OK", "Ok")
		} else if ( this.msgType == "yesno" ) {
			this.addButton("YES", "Confirm")
			this.addButton("NO", "Cancel")
		} else if ( this.msgType == "noyes" ) {
			this.addButton("NO", "Cancel")
			this.addButton("YES", "Confirm")
		} else if ( this.msgType == "error" ) {
			this.addButton("OK", "Got it")
		}
	}
	runButton(button) {
		// bug for keyboard action ?
		let reply = button.tkrad.action
		this.appObject.sendEvent("semaphore", { action: "reply", reply: reply, semid: this.semId })
		setTimeout( () => {
			this.appObject.widgetFocus = this.appFocus
			this.appObject.restoreFocus()
			this.remove()
		}, 0)
	}
})

customElements.define("tkrad-progress", class extends HTMLElement {
	constructor() {
		super()
	}
	buildObject() {
		let overlay = document.createElement("div")
		let loader = document.createElement("div")
		overlay.classList.add("tkrad-overlay")
		loader.classList.add("tkrad-loader")
		overlay.appendChild(loader)
		this.appendChild(overlay)
	}
})
//
// tkrad-pdf viewer
//
customElements.define("tkrad-pdf", class extends HTMLElement {
	constructor () {
		super()
	}
	connectedCallback() {
		this.objectDriver = document.createElement("object")
		this.objectDriver.type = "application/pdf"
		this.appendChild(this.objectDriver)
		this.objectDriver.style["width"] = "100%"
		this.objectDriver.style["height"] = "100%"
	}
	resetValue () {
		this.objectDriver.removeAttribute("data")
	}
	viewDocument (input) {
		this.resetValue()
		if ( input.mime == "application/pdf") {
			let byteCharacters = atob(input.content)
			let byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
  				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			let byteArray = new Uint8Array(byteNumbers);
			let blob = new Blob([byteArray], {type: input.mime});
			let url = URL.createObjectURL(blob)
			this.objectDriver.setAttribute("data", url)
		}
	}
})
//
// TABLE DATA LIST
//
customElements.define("tkrad-tableframe", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.widColumns = []
		this.progressRun = false
	}
	buildObject() {
		this.dataTable = new tkradTree.tkrad.tkradTableWidget(this)
		this.tableWidget = {}
		this.tableWidget.lines = this.tclData.lines
		this.dataTable.buildWidget()
		this.dataTable.selectItem = () => {
			this.selectRow()
			this.setWidgetFocus()
		}
		this.dataTable.scrollCommand = () => { this.loadCursor() }
		this.resetWidget()
	}
	connectedCallback() {
		this.classList.add("tkrad-table")
		this.dataTable.appendChild()
		this.dataTable.headerDriver.setAttribute("tabindex", "1")
		this.appObject.setFocusObject(this, this.dataTable.headerDriver)
	}
	tkradLO (value) {
		this.appObject.downloadMode = "view"
		let eve = { action: "download", id: this.tclData.id, objid: value }
		this.appObject.sendEvent("binary", eve)
	}
	loadInvokeData(eve) {
		let line = this.dataTable.getSelected()
		eve.line = {}
		if ( line.length > 0 ) {
			line = line[0]
			eve.line.id = line.tkrad.ROW_ID
		} else {
			eve.line.id = 0
		}
	}
	setWidgetFocus () {
		this.dataTable.headerDriver.focus()
	}
	rowCurrent ( id ) {
		this.dataTable.selectedByKey("ROW_ID", id)
		this.selectRow()
	}
	selectRow() {
		let eve = {}
		eve.action = "selected"
		let line = this.dataTable.getSelected()
		if ( line == null ) { return }
		line = line[0]
		eve.key = line.tkrad.ROW_ID
		eve.values = []
		for ( let idx = 0 ; idx < this.widColumns.length ; idx++ ) {
			let col = this.widColumns[idx]
			eve.values.push(line.tkrad.values[col.name])
		}
		this.sendEvent("line", eve)
	}
	sortEvent ( obj ) {
		let eve = {}
		eve.action = "sort"
		eve.values = obj
		this.sendEvent("line", eve)
	}
	resetWidget () {
		this.dataTable.objectReset()
		this.dataEOF = false
		this.dataTable.computeHeight()
	}
	flushList() {
		this.progressRun = true
		let eve = {}
		eve.action = "flushlist"
		this.sendEvent("line", eve)
	}
	addRow(rowkey, rowdata) {
		this.setRow(rowkey, rowdata)
		this.datatable.showRowByKey(rowkey)
	}
	dropRow(rowkey) {
		this.dataTable.dropRowByKey("ROW_ID", rowkey)
	}
	setRow(rowkey, rowdata) {
		let previtem = this.dataTable.getRowByKey("ROW_ID", rowkey)
		let item
		if ( previtem.length != 1 ) {
			item = {}
		} else {
			item = previtem[0].tkrad.values
		}
		for ( let idx = 0 ; idx < this.widColumns.length ; idx++ ) {
			let col = this.widColumns[idx]
			item[col.name] = rowdata[idx]
		}
		if ( previtem.length != 1 ) {
			let row = this.dataTable.addItem(item)
			row.tkrad["ROW_ID"] = rowkey
		} else {
			this.dataTable.updateItem(previtem[0], item)
		}
	}
	buildColumnWidget ( item, input ) {
		let element
		if ( input.element == "tkrad-checkbox" ) {
			element = function () {
				let ele = document.createElement("input")
				ele.readonly = true
				ele.type = "checkbox"
				ele.classList.add("form-check-input")
				ele.tkradSetValue = function(value) {
					ele.checked = value == this.tkrad.input.on ? true : false
				}
				return ele
			}
		} else if ( input.element == "tkrad-entry" ) {
			element = function () {
				let ele = document.createElement("label")
				ele.tkradSetValue = function(value) {
					if ( typeof(this.tkrad.formatter) != "undefined" ) {
						ele.innerHTML = this.tkrad.formatter.db2screen(value)
					} else {
						ele.innerHTML = value
					}
				}
				return ele
			}
		} else if ( input.element == "tkrad-semaforo" ) {
			element = function () {
				let ele = document.createElement("span")
				ele.classList.add("mdi", "mdi-checkbox-blank-circle")
				ele.style.color = "grey"
				ele.tkradSetValue = function(value) {
					this.style.color = this.tkrad.input.values[value]
				}
				return ele
			}
		} else if ( input.element == "tkrad-lo" ) {
			element = function () {
				let ele = document.createElement("span")
				ele.classList.add("mdi", "mdi-cloud-download-outline")
				ele.tkradSetValue = function(value) {
					this.tkradDocument = value
				}
				ele.onclick = function () {
					let app = this.tkrad.object.appObject
					app.downloadMode = "view"
					let eve = {}
					eve.action = "download"
					eve.id = this.tkrad.object.tclData.id
					eve.objid = this.tkradDocument
					app.sendEvent("binary", eve)
				}
				return ele
			}
		} else {
			tkrad.consoleLog("TODO", item, input)
			return
		}
		item.element.builder = element
	}
	buildColumn ( input ) {
		let item = {}
		item.title = input.label
		item.name = input.name
		item.element = {}
		item.element.object = this
		item.element.input = input
		if ( typeof(input.element) != "undefined" ) {
			this.buildColumnWidget(item, input)
		}
		if ( typeof(input.format) != "undefined" ) {
			item.justify = "right"
			item.element.formatter = this.appObject.buildFormat(input.format)
			item.size = item.element.formatter.len
		}
		if ( typeof(input.size) != "undefined" ) {
			item.size = input.size
		}
		this.dataTable.addHeader(item)
		this.widColumns.push(input)
	}
	endOfFile() {
		this.dataEOF = true
	}
	loadCursor() {
		if ( this.dataEOF ) { return }
		let eve = {}
		eve.action = "nextframe"
		this.sendEvent("line", eve)
	}
})

//
// TREE
//
customElements.define("tkrad-tree", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.widColumns = []
		this.contextMenu = 0
	}
	buildObject() {
		this.dataTable = new tkradTree.tkrad.tkradTableWidget(this)
		this.tableWidget = {}
		this.tableWidget.lines = this.tclData.lines
		this.dataTable.buildWidget()
		this.dataTable.selectNode = ( row ) => {
			this.selectNode( row )
			this.setWidgetFocus()
		}
		this.dataTable.selectItem =  ( row ) => {
			this.selectNode( row )
			this.setWidgetFocus()
		}
		this.resetWidget()
	}
	connectedCallback() {
		this.classList.add("tkrad-table")
		this.dataTable.appendChild()
		this.dataTable.headerDriver.setAttribute("tabindex", "1")
		this.appObject.setFocusObject(this, this.dataTable.headerDriver)
	}
	resetWidget () {
		this.dataTable.objectReset()
		this.dataTable.computeHeight()
	}
	buildColumn ( input ) {
		let item = {}
		item.title = input.label
		item.name = input.name
		item.element = {}
		item.element.object = this
		item.element.input = input
		if ( typeof(input.element) != "undefined" ) {
			this.buildColumnWidget(item, input)
		}
		if ( typeof(input.format) != "undefined" ) {
			item.justify = "right"
			item.element.formatter = this.appObject.buildFormat(input.format)
			item.size = item.element.formatter.len
		}
		if ( typeof(input.size) != "undefined" ) {
			item.size = input.size
		}
		this.dataTable.addHeader(item)
		this.widColumns.push(input)
	}
	buildColumnWidget ( item, input ) {
		let element
		if ( input.element == "tkrad-checkbox" ) {
			element = function () {
				let ele = document.createElement("input")
				ele.readonly = true
				ele.type = "checkbox"
				ele.tkradSetValue = function(value) {
					ele.checked = value == this.tkrad.input.on ? true : false
				}
				return ele
			}
		} else if ( input.element == "tkrad-entry" ) {
			element = function () {
				let ele = document.createElement("label")
				ele.tkradSetValue = function(value) {
					if ( typeof(this.tkrad.formatter) != "undefined" ) {
						ele.innerHTML = this.tkrad.formatter.db2screen(value)
					} else {
						ele.innerHTML = value
					}
				}
				return ele
			}
		} else if ( input.element == "tkrad-semaforo" ) {
			element = function () {
				let ele = document.createElement("span")
				ele.classList.add("mdi", "mdi-checkbox-blank-circle")
				ele.style.color = "grey"
				ele.tkradSetValue = function(value) {
					this.style.color = this.tkrad.input.values[value]
				}
				return ele
			}
		} else if ( input.element == "tkrad-lo" ) {
			element = function () {
				let ele = document.createElement("span")
				ele.classList.add("mdi", "mdi-cloud-download")
				ele.tkradSetValue = function(value) {
					this.tkradDocument = value
				}
				ele.onclick = function () {
					let app = this.tkrad.object.appObject
					app.downloadMode = "view"
					let eve = {}
					eve.action = "download"
					eve.id = this.tkrad.object.tclData.id
					eve.objid = this.tkradDocument
					app.sendEvent("binary", eve)
				}
				return ele
			}
		} else {
			tkrad.consoleLog("TODO", item, input)
			return
		}
		item.element.builder = element
	}
	getMousePosition (e){
		e =   e || window.event
		var position = {
			'x' : e.clientX,
			'y' : e.clientY
		}
		return position
	}
	enableContextMenu() {
		this.contextMenu = 1
	}
	loadContextMenu() {
		if ( typeof(this.menuBuilder) != "undefined" ) { return }
		let line = this.dataTable.getSelected()
		if ( line.length != 1 ) { return }
		let pos = this.getMousePosition()
		this.menuBuilder = new tkradDrop.tkrad.tkradMenu(line[0])
		this.menuBuilder.menuObject.style.left = pos.x + "px"
		this.menuBuilder.menuObject.style.top = pos.y + "px"
		let eve = {}
		eve.action = "get"
		this.sendEvent("contextmenu", eve)
	}
	walkMenu (input, root) {
		for ( let idx = 0 ; idx < input.length ; idx++ ) {
			let menu = input[idx]
			if ( menu.type == "cascade" ) {
				let sub = this.menuBuilder.addCascade(root, menu.label)
				this.walkMenu(menu.cascade, sub)
				continue
			}
			let run = this.menuBuilder.addOption(root, menu.label)
			run.tkradCommand = menu
		}
	}
	resetMenu () {
		if ( typeof(this.menuBuilder) == "undefined" ) { return false }
		this.menuBuilder.getWidget().remove()
		this.menuBuilder.unbindMenu()
		this.menuBuilder = undefined
		return true
	}
	showContextMenu(input) {
		this.walkMenu(input.run, this.menuBuilder.getWidget())
		this.menuBuilder.appendChild()
		this.menuBuilder.toggleWidget()
		this.menuBuilder.runCommand = (ele) => {
			let eve = {}
			eve.action = "invoke"
			eve.invoke = ele.tkradCommand.command
			this.sendEvent("contextmenu", eve)
		}
		// creo callback per chiusura (sia comando che evento)
		this.menuBuilder.eventMenuClosed = () => {
			this.resetMenu()
		}
	}
	selectNode( row ) {
		let eve = {}
		eve.action = "selected"
		let line = this.dataTable.getSelected()
		if ( line == null ) { return }
		line = line[0]
		eve.key = line.tkrad.ROW_ID
		if ( line.tkrad.type == "node" ) {
			eve.treenode = true
		} else {
			eve.treenode = false
		}
		eve.values = []
		for ( let idx = 0 ; idx < this.widColumns.length ; idx++ ) {
			let col = this.widColumns[idx]
			if ( line.tkrad.values[col.name] == "" ) { continue }
			eve.values.push(col.name)
			eve.values.push(line.tkrad.values[col.name])
		}
		this.sendEvent("tree", eve)
	}
	runAction(input) {
		if ( input.run == "setnode" ) {
			this.setNode(input.key, input.param, input.line)
		} else if ( input.run == "addnode" ) {
			this.addNode(input.key, input.param, input.line)
		} else if ( input.run == "dropnode" ) {
			this.dropNode(input.key)
		} else if ( input.run == "getnode" ) {
			this.getNode(input.key)
		} else if ( input.run == "getnodeindex" ) {
			this.getNodeIndex(input.key)
		} else if ( input.run == "getnodeparent" ) {
			this.getNodeParent(input.key)
		}
	}
	getNodeIndex(rowkey) {
		let item = this.dataTable.getRowByKey("ROW_ID", rowkey)
		if ( item.length == 0 ) {
			item = this.dataTable.getNodeByKey("ROW_ID", rowkey)
		}
		item = item[0]
		let eve = {}
		eve.action = "nodeindex"
		eve.index = item.rowIndex
		this.sendEvent("tree", eve)
	}
	getNodeParent(rowkey) {
		let item = this.dataTable.getRowByKey("ROW_ID", rowkey)
		if ( item.length == 0 ) {
			item = this.dataTable.getNodeByKey("ROW_ID", rowkey)
		}
		item = item[0]
		let eve = {}
		eve.action = "nodeparent"
		eve.key = item.tkrad.parent.tkrad.ROW_ID
		this.sendEvent("tree", eve)
	}
	addNode(rowkey, rowparam, rowdata) {
		this.setNode(rowkey, rowparam, rowdata)
	}
	setNode(rowkey, rowparam, rowdata) {
		let previtem = this.dataTable.getRowByKey("ROW_ID", rowkey)
		if ( previtem.length == 0 ) {
			previtem = this.dataTable.getNodeByKey("ROW_ID", rowkey)
		}
		let item
		if ( previtem.length != 1 ) {
			item = {}
		} else {
			item = previtem[0].tkrad.values
		}
		for ( let idx = 0 ; idx < this.widColumns.length ; idx++ ) {
			let col = this.widColumns[idx]
			item[col.name] = rowdata[idx]
		}
		let param = {}
		if ( typeof(rowparam) != "undefined" ) {
			param = JSON.parse(rowparam)
		}
		if ( previtem.length == 1 ) {
			if ( previtem[0].tkrad.type == "node" ) {
				this.dataTable.updateNode(previtem[0], item)
			} else {
				this.dataTable.updateItem(previtem[0], item)
			}
		} else {
			let index = undefined
			if ( typeof(param.index) != "undefined" ) {
				index = param.index
			}
			let parent = undefined
			if ( typeof(param.parent) != "undefined" ) {
				parent = this.dataTable.getNodeByKey("ROW_ID", param.parent)
				parent = parent[0]
			}
			let row
			if ( typeof(param.node) != "undefined" ) {
				row = this.dataTable.addNode(item,parent,index)
			} else {
				row = this.dataTable.addItem(item,parent,index)
			}
			row.tkrad.ROW_ID = rowkey
			if ( this.contextMenu ) {
				if ( typeof(param.node) != "undefined" ) {
					this.dataTable.addNodeTool(row, "mdi-menu", (node) => {
						this.dataTable.setSelected("node",node)
						this.loadContextMenu()
                        		})
				} else {
					this.dataTable.addItemTool(row, "mdi-menu", (node) => {
						this.dataTable.setSelected("data",node)
						this.loadContextMenu()
                        		})
				}
			}
			if ( typeof(param.node) != "undefined" ) {
				if ( typeof(param.command) != "undefined" ) {
					row.tkrad["REMOTEOPEN"] = param.command
				}
				row.tkrad["open"] = () => {
					this.openNode(row)
				}
				row.tkrad["close"] = () => {
					this.closeNode(row)
				}
				if ( typeof(param.open) != "undefined" ) {
					this.dataTable.expandNode(row)
				} else {
					this.dataTable.collapseNode(row)
				}
			}
		}
	}
	openNode (row) {
		if ( typeof(row.tkrad["REMOTEOPEN"]) == "undefined" ) { return }
		this.dropChild(row);
		let eve = {}
		eve.action = "open"
		eve.key = row.tkrad.ROW_ID
		this.sendEvent("tree", eve)
	}
	closeNode (row) {
		if ( typeof(row.tkrad["REMOTEOPEN"]) == "undefined" ) { return }
		this.dropChild(row);
	}
	deleteNode(row) {
		let eve = {}
		eve.action = "deleted"
		eve.key = row.tkrad.ROW_ID
		this.dataTable.dropRow(row)
		this.sendEvent("tree", eve)
	}
	dropNode(rowkey) {
		if (rowkey == '') {
			let all = this.dataTable.getRootNodes()
			for ( let idx = 0 ; idx < all.length ; idx++ ) {
				this.walkDrop(all[idx])
			}
		} else {
			let row = this.dataTable.getRowByKey("ROW_ID", rowkey)
			if ( row.length == 0 ) {
				row = this.dataTable.getNodeByKey("ROW_ID", rowkey)
			}
			row = row[0]
			this.walkDrop(row)
		}
	}
	walkDrop(row) {
		if ( row.tkrad.type == "node" ) {
			this.dropChild(row)
		}
		this.deleteNode(row)
	}
	dropChild(row) {
		if ( typeof(row.tkrad["child"]) == "undefined" ) { return }

		for ( let idx = 0 ; idx < row.tkrad["child"].length ; idx++ ) {
			this.dropChild(row.tkrad["child"][idx])
			this.deleteNode(row.tkrad["child"][idx])
		}
		row.tkrad["child"] = []
	}
	setWidgetFocus () {
		this.dataTable.headerDriver.focus()
	}
})
//
// ODS
//
customElements.define("tkrad-spreadsheet", class extends tkrad.tkradWindow {
	constructor () {
		super()
		this.nameCols = []
		this.colsType = []
		this.colsReadonly = []
		this.colsMath = []
		this.sumCols = []
		this.lastColumn = ""
		this.rowLegend = false
		this.isStatic = false
		this.colsValidate = []
		this.validationLegend = {}
		this.rowData = []
	}
	uidGenerate() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	}
	buildObject () {
		this.dataTable = new tkradTree.tkrad.tkradTableWidget(this)
		this.tableWidget = {}
		/*
		this.dataTable.buildWidget = () => {
			let driver = this.dataTable
			driver.addDriver()
			driver.addTool()
			for ( let idx = 0 ; idx < driver.tableLines ; idx++ ) {
				let row = driver.bodyObject.insertRow()
				driver.initializeRow(row, "empty")
			}
		}
		*/
	}
	connectedCallback() {
		this.classList.add("tkrad-spreadsheet", "tkrad-table")
		if ( typeof(this.tclData.static) != "undefined" ) { this.isStatic = true }
		//this.tableWidget = {}
		// TODO
		// this.tclData.lines = 1
		this.tableWidget.lines = this.tclData.lines
		// this.dataTable.tableLines = this.tclData.lines
		this.dataTable.buildWidget()
		// this.dataTable.computeHeight()
		this.buildColumns()

		this.dataTable.appendChild()
		this.dataTable.headerDriver.setAttribute("tabindex", "1")

		this.populateTable()
		this.appObject.setFocusObject(this, this.dataTable.headerDriver)

		this.dataTable.tableObject.onkeydown = (keyEvent) => {
			let code = keyEvent.keyCode
			// tkrad.consoleLog("KEY PRESS", code, keyEvent, this)

			if ( code == "120" ) {
				// F9 delete row
				this.mtdRemove("currentRow")
			} else if ( code == "9" ) {
				// Tab
				let mode = "next"
				if ( keyEvent.shiftKey ) { mode = "previous" }
				this.focusNextCell(mode)
				return false
			} else if ( code == "13" ) {
				// Enter
				let mode = "nextE"
				if ( keyEvent.shiftKey ) { mode = "previous" }
				this.focusNextCell(mode)
			} else if ( code == "33" ) {
				// PageUp
				this.focusNextCell("pgUp")
				return false
			} else if ( code == "34" ) {
				// PageDown
				this.focusNextCell("pgDown")
				return false
			} else if ( code == "37" ) {
				// ArrowLeft
				this.focusNextCell("previous")
			} else if ( code == "38" ) {
				// ArrowUp
				this.focusNextCell("up")
			} else if ( code == "39" ) {
				// ArrowRight
				this.focusNextCell("next")
			} else if ( code == "40" ) {
				// ArrowDown
				this.focusNextCell("down")
			}
		}
	}
	getRowElement (filter) {
		let back
		let rowID
		if ( isNaN(filter) ) {
			rowID = filter
		} else {
			rowID = this.rowData[filter]
		}
		let selRows = this.dataTable.getRowByKey("ROW_ID", rowID)
		if ( selRows.length == 1 ) { back = selRows[0] }
		return back

	}
	getCurrentCell () {
		let back = {
			row: {},
			column: {}
		}

		let now = this.dataTable.getSelected()[0]
		if ( typeof(now) == "undefined" ) { return back }

		let idRow = now.tkrad["ROW_ID"]
		back.row = this.rowData.indexOf(idRow)
		if ( typeof(back.row) == "undefined" ) { return back }

		let cell = now.querySelector('.tkrad-table-cell-ods[tkrad-selected]')
		if ( cell == null ) { return back }
		back.column = this.nameCols.indexOf(cell.name)

		return back
	}
	removeAttributeElements ( elem, attr ) {
		this.dataTable.walkRows(elem + '[' + attr + ']', (ele) => {
			ele.removeAttribute(attr)
		})
	}
	getCellByXY ( row, col ) {
		let selRow = this.getRowElement(row)
		let cell = selRow.querySelectorAll(".tkrad-table-cell-ods")[col]
		return cell
	}
	focusCell ( row, col ) {
		let selRow = this.getRowElement(row)
		let cell = this.getCellByXY(row, col)
		this.dataTable.setSelected("data",selRow)
		cell.focus()
	}
	focusNextCell ( mode, cell ) {
		let run = this.getNextCell(mode, cell)
		if ( typeof(run) != "undefined" ) {
			this.focusCell(run.row, run.column)
			this.setRunningColumn(run)
		}
	}
	getNextCell ( mode, cell ) {
		if ( typeof(cell) == "undefined" ) {
			cell = this.getCurrentCell()
		}
		let row = cell.row
		let col = cell.column
		let maxRows = this.rowData.length
		let maxCols = this.nameCols.length

		if ( row == "undefined" ) { row = 0 }
		if ( col == "undefined" ) { col = 0 }

		if ( mode == "up" ) { row-- }
		if ( mode == "down" ) { row++ }
		if ( mode == "previous" ) { col-- }
		if ( ["next","nextE"].includes(mode) ) { col++ }
		if ( mode == "pgUp" ) {
			row -= this.tclData.lines
			if ( row < 0 ) { row = 0 }
		}
		if ( mode == "pgDown" ) {
			row += this.tclData.lines
			if ( row >= maxRows ) { row = maxRows - 1 }
		}

		if ( col < 0 ) {
			col = maxCols - 1
			row--
		} else if ( col == maxCols ) {
			col = 0
			row++
		}

		if ( row < 0 ) { return }
		if ( row == maxRows ) {
			if ( mode != "nextE" ) { return }
			let item = {}
			this.mtdAdd(item)
		}

		let back = {}
		if ( typeof(this.colsReadonly[col]) != "undefined" ) {
			back = this.getNextCell(mode, { row: row, column: col })
		} else {
			back.row = row
			back.column = col
		}
		return back
	}
	buildColumns() {
		if ( typeof(this.tclData.rowlegend) != "undefined" ) {
			let rowLegend = {}
			rowLegend.name = "RowLegend"
			rowLegend.title = ""
			rowLegend.size = 3
			// rowLegend.justify = "center"
			this.dataTable.addHeader(rowLegend)
			this.rowLegend = true
		}
		for ( let idx = 0 ; idx < this.tclData.columns.length ; idx++ ) {
			let input = this.tclData.columns[idx]
			let item = {}
			item.title = input.header
			item.name = input.id
			item.element = {}
			if ( typeof(input.type) != "undefined" ) {
				this.buildColumnWidget(item, input)
				this.dataTable.addHeader(item)
				this.nameCols.push(item.name)
				this.colsReadonly.push(input.readonly)
				this.colsMath.push(input.math)
				if ( typeof(input.summColumn) != "undefined" ) {
					this.sumCols.push(item.name)
				}
			}
		}
		if ( this.sumCols.length > 0 ) {
			this.buildFooter()
			for ( let idx = 0; idx < this.sumCols.length; idx++ ) {
				this.dataTable.sumColumn(this.sumCols[idx])
			}
		}
	}

	buildFooter () {
		let table = this.dataTable
		table.buildFooter()
	}

	buildColumnWidget ( item, input ) {
		let element
		let type = input.type
		if ( type == "money" ) {
			type = "entry"
			item.element.formatter = this.appObject.buildFormat("money")
			item.size = item.element.formatter.len
		} else if ( type == "date" ) {
			type = "entry"
			item.element.formatter = this.appObject.buildFormat("DATE")
			item.size = Number(item.element.formatter.len) + 7 // aggiungo per farci stare anche l'iconcina
		}
		if ( type == "checkbox" ) {
			element = function () {
				let ele = document.createElement("input")
				if ( typeof(input.readonly) != "undefined" ) {
					ele.setAttribute("readonly", true)
				}
				ele.type = "checkbox"
				ele.tkradSetValue = function(value) {
					ele.checked = value == input.onvalue ? true : false
				}
				ele.tkradGetValue = function() {
					if ( ele.checked ) {
						return input.onvalue
					} else {
						return input.offvalue
					}
				}
				return ele
			}
		} else if ( type == "entry" ) {
			element = function () {
				let ele = document.createElement("input")
				ele.classList.add("form-control")
				ele.classList.add("d-inline-block")
				if ( typeof(input.readonly) != "undefined" ) {
					ele.setAttribute("readonly", true)
				}
				if ( typeof(input.math) != "undefined" ) {
					ele.setAttribute("math", input.math)
				}
				if ( input.type == "money" ) { ele.style["textAlign"] = "right" }
				ele.style["width"] = "10ch"
				ele.tkradSetValue = function(value) {
					let val = value
					if ( typeof(this.tkrad.formatter) != "undefined" ) {
						// value = 0 diventa stringa nulla, magari da mettere come default nel format.js
						if ( value == 0 && this.tkrad.formatter.type == "number" ) {
							val = ""
						} else {
							val = this.tkrad.formatter.db2screen(value)
						}
					}
					this.value = val
				}
				ele.addEventListener("focusout", function() { this.tkradSetValue(this.tkradGetValue()) })
				ele.tkradGetValue = function() {
					let val = this.value
					if ( typeof(this.tkrad.formatter) != "undefined" ) {
						if ( !val && this.tkrad.formatter.type == "number" ) {
							val = 0
						} else {
							val = jsrad.format.screen2db(val, this.tkrad.formatter.driver)
						}
					}
					return val
				}
				return ele
			}
		} else {
			tkrad.consoleLog("TODO", item, input)
			return
		}
		item.element.builder = element
		item.element.functions = this.getCommonFunctions(item)
		item.element.runAfterCreate = this.runAfterCreate(input)
	}
	getCommonFunctions(item) {
		let back = []
		let odsObject = this
		back.push( function(ele) {
			ele.classList.add("tkrad-table-cell-ods")
			ele.setAttribute("name", item.name)
		})

		back.push( function(ele) { ele.addEventListener("focusin", function() {
			odsObject.removeAttributeElements(".tkrad-table-cell-ods", "tkrad-selected")
			ele.setAttribute("tkrad-selected", true)
			odsObject.setRunningColumn(odsObject.coordinatesByElement(ele))
		}) })
		back.push( function(ele) { ele.addEventListener("focusout", function() {
			// odsObject.removeAttributeElements(".tkrad-table-cell-ods", "tkrad-selected")
		}) })
		back.push( function(ele) { ele.tkradGetName = function() { return item.name } })
		return back
	}
	coordinatesByElement(element) {
		let colName = element.name
		let parentEle = this.getFirstParent(element, "tkrad-table-data-row")
		let idRow = parentEle.tkrad.ROW_ID

		let back = {}
		back.row = this.rowData.indexOf(idRow)
		back.column = this.nameCols.indexOf(colName)
		return back
	}
	runAfterCreate(input) {
		let back = []
		let odsObject = this
		if ( typeof(input.math) != "undefined" ) {
			back.push( function(ele) {
				odsObject.mathBinding(ele, input.math)
			})
		}
		if ( input.type == "date" ) {
			back.push( function(ele) {
				let temp = ele
				temp.entryField = ele
				ele.getValue = ele.tkradGetValue
				temp.setWidgetFocus = function() {}

				let obj = document.createElement("tkrad-gadget-date")
				obj.addTo(temp)
				obj.returnMtpDate((date) => {
					// Metto current la cella prima di uscire
					let curr = odsObject.getCurrentCell()
					curr.column = odsObject.nameCols.indexOf(ele.getAttribute("name"))
					odsObject.focusCell(curr.row, curr.column)
					// Scrivo valore
					if ( date != null ) { ele.tkradSetValue(date) }
				})
			})
		}
		return back
	}
	getMathVars (formula) {
		let back = {}
		let vars = formula.match(/\$\S*/g)
		vars.forEach( name => {
			let column = name.replace(/^\$/,"")
			back[name] = column
		})
		return back
	}
	mathBinding(object, formula) {
		let odsObject = this
		let objParent = this.getFirstParent(object, "tkrad-table-data-row")
		let vars = this.getMathVars(formula)
		Object.keys(vars).forEach( name => {
			let column = vars[name]
			let cell = this.cellObjectByName(objParent, column)
			cell.addEventListener("change", function() {
				let value = odsObject.runFormula(objParent, formula)
				object.tkradSetValue(value)
			})
		})
	}
	getFirstParent(object, name) {
		let back = object
		let classList = object.classList
		if ( classList.length <= 0 || !classList.contains(name) ) {
			let par = object.parentNode
			back = this.getFirstParent(par, name)
		}
		return back
	}
	cellObjectByName(parent, name) {
		let cell = parent.querySelector('.tkrad-table-cell-ods[name="' + name +'"]')
		return cell
	}
	runFormula(objParent, formula) {
		let result = formula
		let vars = this.getMathVars(formula)
		Object.keys(vars).forEach( name => {
			let column = vars[name]
			let cell = this.cellObjectByName(objParent, column)
			let value = cell.tkradGetValue()
			result = result.replace(name,value)
		})
		let temp = eval(result)
		return temp
	}
	runFormulas(idrow) {
		let objParent = this.getRowElement(idrow)
		for ( let i = 0 ; i < this.colsMath.length ; i++ ) {
			let formula = this.colsMath[i]
			if ( typeof(formula) == "undefined" ) { continue }
			let name = this.nameCols[i]
			let object = this.cellObjectByName(objParent, name)
			let result = this.runFormula(objParent, formula)
			object.tkradSetValue(result)
		}
	}
	populateTable() {
		let lines = this.tclData.lines
		// TODO
		// lines = 100
		for ( let idrow = 1 ; idrow <= lines ; idrow++ ) {
			let item = {}
			this.mtdAdd(item)
		}
	}
	addEmptyLines(index) {
		let lines = this.rowData.length
		while ( index > lines ) {
			lines++
			let temp = {}
			this.mtdAdd(temp)
		}
	}
	refreshRowNumbers(index) {
		if ( !this.rowLegend ) { return }
		let driver = this.dataTable
		while ( index < this.rowData.length ) {
			let idrow = this.rowData[index]
			let data = this.valuesByIndex(index)
			data.RowLegend = index + 1
			this.mtdAdd(data, index)
			index++
		}
	}
	mtdRemove(row) {
		if ( this.isStatic ) { return }
		let driver = this.dataTable
		if ( row == "currentRow" ) { row = driver.getSelected()[0] }

		let idRow = row.tkrad["ROW_ID"]
		let index = this.rowData.indexOf(idRow)
		let curr = this.getCurrentCell()

		// rimuovo id dalla lista globale
		this.rowData.splice(index, 1)
		// elimino riga
		driver.dropRow(row)
		// aggiorna numero riga
		this.refreshRowNumbers(index)
		// rimetto il numero prestabilito di righe
		this.addEmptyLines(this.tclData.lines)
		// force focus sulla nuova riga
		if ( curr.row == this.rowData.length ) { curr.row-- }
		this.focusCell(curr.row, curr.column)

		/*
		// metto come current la nuova cella per fare poi la validazione
		this.columnRunning.row = temp.row
		this.columnRunning.column = temp.column

		*/
	}
	mtdAdd(item, index) {
		let driver = this.dataTable
		let rowId = this.getRowElement(item.id)
		if ( typeof(index) != "undefined" ) {
			// inserisco righe vuote se c'e' un buco tra l'ultimo e il nuovo
			this.addEmptyLines(index)
		}

		if ( typeof(item.id) == "undefined" ) {
			item.id = this.uidGenerate()
			this.rowData.push(item.id)
		}
		this.nameCols.forEach( name => {
			if ( typeof(item[name]) == "undefined" ) {
				item[name] = ""
			}
		})

		item.RowLegend = this.rowData.indexOf(item.id) + 1

		/* TODO
		let start = 0
		let idx = this.colsType.indexOf("date", start)
		while ( idx >= 0 ) {
			let name = this.nameCols[idx]
			if ( typeof(item[name]) != "undefined" ) {
				let data = item[name].substr(0,4)
				data += "-" + item[name].substr(4,2)
				data += "-" + item[name].substr(6,2)
				let xml_format = webix.Date.strToDate("%Y-%m-%d")
				item[name] = xml_format(data)
			}
			start = idx + 1
			idx = this.colsType.indexOf("date", start)
		}
		*/
		/* se fatto qui da errore
			let row = driver.bodyObject.insertRow()
			driver.initializeRow(row, "empty")
		*/
		if ( typeof(rowId) == "undefined" ) {
			let row = driver.addItem(item)
			row.tkrad["ROW_ID"] = item.id
		} else {
			driver.updateItem(rowId, item)
		}

		if ( typeof(index) == "undefined" ) { this.validationLegend[item.id] = {} }
	}
	resetWidget() {
		this.dataTable.objectReset()
	}
	runSpreadsheet(input) {
		// TODO
		// tkrad.consoleLog("RUN SPREADSHEET", input)
		let mode = input.mode
		if ( typeof(mode) == "undefined" ) {
			tkrad.consoleLog("MODE NON INDICATO", input)
		} else if ( mode == "getFieldValue" ) {
			this.getFieldValue()
		} else if ( mode == "setLineValue" ) {
			this.setLineValue(input.idrow, input.data)
		} else if ( mode == "setLineData" ) {
			this.setLineData(input.idrow, input.data)
		} else if ( mode == "getRowBack" ) {
			this.getRowBack(input.idrow)
		} else if ( mode == "getRowDataBack" ) {
			this.getRowDataBack(input.idrow)
		} else if ( mode == "cellValidate" ) {
			this.cellValidate(input.column)
		} else if ( mode == "setValidate" ) {
			this.odsSetValidate(input)
		} else if ( mode == "validateWidget" ) {
			this.validateWidget()
		} else {
			tkrad.consoleLog("UNKNOWN COMMAND ODS", input)
		}
	}
	cellValidate(column) {
		this.colsValidate.push(column)
	}
	getFieldValue() {
		let driver = this.dataTable
		let back = {}
		back.value = []

		for ( let idx = 0 ; idx < this.rowData.length ; idx++ ) {
			let rowVal = this.valuesByIndex(idx)
			let data = rowVal.HiddenData
			let value = rowVal
			delete value.id
			delete value.HiddenData
			let line = Object.assign({},value, data)
			back.value.push(line)
		}
		this.sendEvent("backData", back)
	}
	valuesByIndex (index) {
		let back = {}
		let idrow = this.rowData[index]
		let row = this.getRowElement(idrow)
		if ( typeof(row) == "undefined" ) { return back }

		let tkval = row.tkrad.values
		if ( typeof(tkval.HiddenData) != "undefined" ) { back.HiddenData = tkval.HiddenData }

		let temp = {}
		row.querySelectorAll(".tkrad-table-cell-ods").forEach( cell => {
			let name = cell.tkradGetName()
			let value = cell.tkradGetValue()
			temp[name] = value
		})
		this.nameCols.forEach( name => {
			let val
			if ( typeof(temp[name]) == "undefined" ) { val = "" } else { val = temp[name] }
			back[name] = val
		})
		back.id = idrow
		return back
	}
	getRowValues(index) {
		let back = this.valuesByIndex(index)
		delete back.HiddenData
		return back
	}
	getRowData(index) {
		let back = {}
		let data = this.valuesByIndex(index)
		if ( typeof(data) != "undefined" ) {
			back = data.HiddenData
		}
		return back
	}
	setLineValue(index, data) {
		let driver = this.dataTable
		data.id = this.rowData[index]
		data.HiddenData = this.getRowData(index)
		this.mtdAdd(data, index)
		this.runFormulas(data.id)

		// Valido riga
		this.changeRowEvent(index)
	}
	setLineData(index, data) {
		let driver = this.dataTable
		let item = this.getRowValues(index)
		item.HiddenData = data
		this.mtdAdd(item, index)
	}
	getRowBack(index) {
		let back = {}
		back.value = []
		let values = this.getRowValues(index)
		delete values.id
		back.value.push(values)
		this.sendEvent("backData", back)
	}
	getRowDataBack(index) {
		let back = {}
		back.value = []
		let data = this.getRowData(index)
		if ( typeof(data) != "undefined" ) {
			back.value.push(data)
		}
		this.sendEvent("backData", back)
	}
	odsSetValidate(input) {
		let driver = this.dataTable
		let row = input.row
		let result = input.validation
		let rowLegend = this.validationLegend[this.rowData[row]]
		for ( let col = 0; col < this.nameCols.length; col++ ) {
			let colName = this.nameCols[col]
			let stato
			if ( typeof(result[colName]) == "undefined" ) {
				stato = ""
			} else {
				stato = result[colName]
			}

			if ( stato != "" ) {
				rowLegend[colName] = stato
				this.addRowCss(row, "tkrad-invalid")
				this.addCellCss(row, col, "tkrad-invalid-cell")
			} else {
				rowLegend[colName] = null
				this.removeCellCss(row, col, "tkrad-invalid-cell")
			}
		}
		// Se tutte le celle della riga sono validate, allora tutta la riga è valida
		let rowState = true
		let keys = Object.keys(rowLegend)
		for ( let idx = 0; idx < keys.length; idx++ ) {
			let key = keys[idx]
			if ( rowLegend[key] != null ) {
				rowState = false
				break
			}
		}
		if ( rowState ) { this.removeRowCss(row, "tkrad-invalid") }
	}
	validateWidget() {
		let keys = Object.keys(this.validationLegend)
		let currCell = this.getCurrentCell()
		keys.forEach( idRow => {
			let row = this.rowData.indexOf(idRow)
			let val = this.validationLegend[idRow]
			if ( Object.keys(val).length == 0 || row == currCell.row ) {
				// valido le righe non ancora validate
				// e anche quella su cui c'è il focus
				this.changeRowEvent(row)
			}
		})

		let odsObject = this
		let validatedRows = 0
		let backErrors = []
		let getRowErrors = function (idRow) {
			let val = odsObject.validationLegend[idRow]
			let llval = Object.keys(val).length
			if ( llval == 0 ) {
				// aspetto finchè non ricevo risposta dal tcl
				setTimeout( () => { getRowErrors(idRow) }, 10)
				return
			}
			Object.keys(val).forEach(name => {
				if ( val[name] == null ) { return }
				backErrors.push(val[name])
			})
			validatedRows++
			if ( keys.length == validatedRows ) {
				// quando ho validato tutte le righe,
				// mando al tcl la lista degli errori
				odsObject.sendEvent("backData", { value: backErrors })
			}
			return
		}

		let getErrors = function () {
			keys.forEach( idRow => {
				getRowErrors(idRow)
			})
		}

		// lascio passare un po' di tempo per avere la risposta dal tcl
		setTimeout( () => { getErrors() }, 10)
	}
	addRowCss(row, css) {
		let ele = this.getRowElement(row)
		ele.setAttribute(css, true)
	}
	removeRowCss(row, css) {
		let ele = this.getRowElement(row)
		ele.removeAttribute(css)
	}
	addCellCss(row, col, css) {
		let cell = this.getCellByXY(row, col)
		cell.setAttribute(css, true)
	}
	removeCellCss(row, col, css) {
		let cell = this.getCellByXY(row, col)
		cell.removeAttribute(css)
	}
	setWidgetFocus () {
		let cell
		let selRow = this.dataTable.getSelected()
		if ( selRow.length == 1 ) {
			cell = selRow[0].querySelectorAll(".tkrad-table-cell-ods[tkrad-selected]")[0]
		}
		if ( typeof(cell) == "undefined" ) {
			this.dataTable.headerDriver.focus()
			this.focusCell(0,0)
		} else {
			cell.focus()
		}
	}
	setRunningColumn(input) {
		let old = this.columnRunning
		if ( typeof(old) == "undefined" ) {
			this.columnRunning = {}
		} else if ( old.row != input.row ) {
			this.changeRowEvent(old.row)
		}
		this.columnRunning.row = input.row
		this.columnRunning.column = input.column
		this.setTriggerRow(input.row)
	}
	changeRowEvent(row) {
		let idRow = this.rowData[row]
		this.validationLegend[idRow] = {}
		let back = {}
		back.row = row
		back.values = this.getRowValues(row)
		this.sendEvent("changeRow", back)
	}
	setTriggerRow(index) {
		if ( this.triggerRow == index ) { return }
		this.sendEvent("setTriggerRow", { row: index } )
		this.triggerRow = index
	}
})
