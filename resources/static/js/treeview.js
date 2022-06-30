export var tkrad = tkrad ? tkrad : {}

tkrad.tkradTableWidget = class {

	constructor ( htmlobject ) {
		this.tableColumns = 0
		this.htmlObject = htmlobject
		this.tableObject = document.createElement("table")
		this.tableObject.classList.add("table")
		this.tableObject.classList.add("table-striped")
		this.headerObject = this.tableObject.createTHead()
		this.headerObject.classList.add("tkrad-table-header")
		this.headerRow = this.headerObject.insertRow(0)
		this.headerRow.classList.add("tkrad-table-header-row")
		this.bodyObject = this.tableObject.createTBody()
		this.bodyObject.classList.add("tkrad-table-body")
		this.bodyObject.tkradNewRow = function(idx) {
			let empty = this.querySelector(".tkrad-table-empty-row")
			let row
			if ( typeof(idx) == "undefined" ) {
				row = this.insertRow(empty.rowIndex - 1)
			} else {
				row = this.insertRow(idx)
			}
			return row
		}
		// this.buildFooter()
	}
	
	buildWidget () {
		this.tableLines = this.htmlObject.tableWidget.lines
		this.addDriver()
		this.addTool()
		this.scrollSetup()
		for ( let idx = 0 ; idx < this.tableLines ; idx++ ) {
			let row = this.bodyObject.insertRow()
			this.initializeRow(row, "empty")
			this.emptyCell(row)
			this.emptyCell(row)
		}
	}

	buildFooter () {
		this.footerSumColumns = []
		this.footerObject = this.tableObject.createTFoot()
		this.footerObject.classList.add("tkrad-table-footer")
		this.footerRow = this.footerObject.insertRow(0)
		this.footerObject.classList.add("tkrad-table-footer-row")

		for ( let idx = 0 ; idx < this.tableColumns ; idx++ ) {
			let cell = this.footerRow.insertCell()
			cell.classList.add("tkrad-table-footer-cell")
		}
	}

	sumColumnBinding (object) {
		let parentObject = this
		let name = object.name
		let totFunction = () => {
			let totale = 0
			parentObject.bodyObject.querySelectorAll('.tkrad-table-cell-ods[name="' + name +'"]').forEach( cell => {
				totale += Number(cell.tkradGetValue())
			})

			let output = parentObject.footerObject.querySelector('.tkrad-table-footer-cell[name="' + name +'"]')
			output.tkradSetValue(totale)
		}
		object.addEventListener("sum_column_event", totFunction)
		object.addEventListener("change", totFunction)
	}

	sumColumn (name) {
		let hdrlist = this.headerObject.querySelectorAll("td")
		let hcell
		let idx = 0
		for ( idx ; idx < hdrlist.length ; idx++ ) {
			let temp = hdrlist[idx]
			if ( temp.tkrad["name"] == name ) {
				hcell = temp.tkrad
				break
			}
		}
		let cell = this.footerRow.querySelectorAll("td")[idx]
		let element = hcell.property.element
		let ele = element.builder()
		ele.setAttribute("readonly", true)
		ele.tkrad = element
		cell.tkradSetValue = (value) => { ele.tkradSetValue(value) }
		cell.appendChild(ele)
		cell.name = hcell.name
		cell.setAttribute("name", hcell.name)

		this.footerSumColumns.push(name)
	}

	getWidget () {
		return this.tableObject
	}

	appendChild () {
		this.htmlObject.appendChild(this.tableObject)
		this.computeHeight()
	}

	computeHeight () {
		let h
		h = this.tableObject.clientHeight
		if ( h == 0 ) {
			let clone = this.tableObject.cloneNode(true)
			clone.style["position"] = "absolute"
			clone.style["top"] = "-10000px"
			clone.style["left"] = "-10000px"
			clone.style["display"] = "block"
			this.htmlObject.appObject.appendChild(clone)
			h = clone.clientHeight
			clone.remove()
		}
		if ( h == 0 ) { return }
		this.htmlObject.style["height"] = h + "px"
	}

	objectReset () {
		this.nodeId = 0
		let clear = this.bodyObject.querySelectorAll("tr")
		for ( let idx = 0 ; idx < clear.length ; idx++ ) {
			if ( clear[idx].tkrad.type == "empty" ) {
				clear[idx].style["display"] = clear[idx].tkrad["display"]
			} else {
				clear[idx].remove()
			}
		}
	}

	getRootNodes() {
		let rows = []
		this.walkRows("tr", (row) => {
			if ( typeof(row.tkrad.ROW_ID) == "undefined" ) { return }
			if ( typeof(row.tkrad.parent) != "undefined" ) { return }
			rows.push(row)
		})
		return rows
	}

	refreshPage() {
		// count visible not empty row
		// make empty visible to delta page
		let rows = this.bodyObject.querySelectorAll("tr")
		let validrows = rows.length - this.tableLines
		let invisible = 0
		// empty rows always last
		for ( let idx = 0 ; idx < validrows ; idx++ ) {
			if ( rows[idx].style["display"] == "none" ) {
				invisible++
			}
		}
		let visible = validrows - invisible
		let todo = visible >= this.tableLines ? 0 : this.tableLines - visible
		// hide or view empty row to fill
		for ( let idx = validrows ; idx < rows.length ; idx++ ) {
			if ( todo > 0 ) {
				rows[idx].style["display"] = rows[idx].tkrad["display"]
			} else {
				rows[idx].style["display"] = "none"
			}
			todo--
		}
	}

	addNav ( icon, command ) {
		let tool = document.createElement("button")
		tool.classList.add("mdi", icon)
		tool.onclick = command
		this.navObject.appendChild(tool)
	}

	initializeRow ( row, type ) {
		row.classList.add("tkrad-table-row", "tkrad-table-" + type + "-row")
		row.tkrad = {}
		row.tkrad.empty = type == "empty" ? true : false
		row.tkrad.type = type
		row.tkrad["display"] = row.style["display"]
		if ( type == "empty" ) {
			this.showNode(row)
		} else {
			this.hideNode(row)
		}
	}

	scrollSetup () {
		this.htmlObject.onscroll = () => {
			this.scrollAction()
		}
	}
	scrollAction () {
		let object = this.htmlObject
		let actual = object.offsetHeight + object.scrollTop
		actual = Math.round(actual + 1)
		// console.log("ACTUAL", actual, "SCROLL", object.scrollHeight)
		if (actual < object.scrollHeight) {
			return
		}
		if (typeof(this.scrollCommand) != "undefined") {
			this.scrollCommand()
		}
	}

	resizeTable (cell) {
		let div = document.createElement('div')
		div.classList.add("tkrad-table-column-resizer")
		cell.appendChild(div)
		cell.style.position = "relative"
		this.resizeListeners(div)
	}

	resizeListeners (div) {
		div.addEventListener('mousedown', (e) => {
			let col = e.target.parentElement
			this.resizeObj = {}
			this.resizeObj.start = e.pageX
			this.resizeObj.cell = col
			this.resizeObj.width = col.offsetWidth
		})
		this.htmlObject.addEventListener('mousemove', (e) => {
			if ( typeof(this.resizeObj) == "undefined" ) {
				return
			}
			let diff = e.pageX - this.resizeObj.start
			let width = this.resizeObj.width + diff
			this.resizeObj.cell.style["width"] = width + 'px'
		})
		this.htmlObject.addEventListener('mouseup', (e) => {
			this.resizeObj = undefined
		})
		this.htmlObject.addEventListener('mouseleave', (e) => {
			this.resizeObj = undefined
		})
	}

	addDriver () {
		let div = document.createElement("div")
		div.classList.add("tkrad-table-driver")
		let cell = this.headerRow.insertCell()
		cell.tkrad = {}
		this.headerDriver = div
		cell.appendChild(div)
		this.tableColumns++
	}

	addTool () {
		let div = document.createElement("div")
		let cell = this.headerRow.insertCell()
		div.classList.add("tkrad-table-header-tools")
		cell.tkrad = {}
		this.tableColumns++
		this.navObject = div
		cell.appendChild(div)
	}

	addLineTools ( row, classname ) {
		let div = document.createElement("div")
		div.classList.add(classname)
		let cell = row.insertCell()
		cell.tkrad = {}
		cell.appendChild(div)
	}

	addNodeTool ( row, icon, command ) {
		let div = row.querySelector(".tkrad-table-node-tools")
		if ( div == null ) { return }
		let tool = document.createElement("i")
		tool.classList.add("mdi", icon)
		tool.onclick = () => { command(row) }
		div.appendChild(tool)
	}

	addItemTool ( row, icon, command ) {
		let div = row.querySelector(".tkrad-table-line-tools")
		if ( div == null ) { return }
		let tool = document.createElement("i")
		tool.classList.add("mdi", icon)
		tool.onclick = () => { command(row) }
		div.appendChild(tool)
	}

	emptyCell ( row ) {
		let cell = row.insertCell()
		cell.innerHTML = "&nbsp"
	}

	fixDataRows () {
		let rows = this.bodyObject.querySelectorAll("tr")
		for ( let idx = 0 ; idx < rows.length ; idx++ ) {
			this.emptyCell(rows[idx])
		}
	}

	addHeader ( body ) {
		let idx = this.tableColumns - 1
		let cell = this.headerRow.insertCell(idx)
		if ( typeof(body.element) == "undefined" ) {
			body.element = {}
		}
		cell.classList.add("tkrad-table-header-cell")
		// TODO: addHeaderCellTool
		// cell.innerHTML = `<i class="mdi mdi-plus">` + body.title
		cell.innerHTML = body.title
		cell.tkrad = {}
		cell.tkrad["name"] = body.name
		cell.tkrad["property"] = body
		if ( typeof(body.justify) != "undefined" ) {
			cell.classList.add("tkrad-table-cell-right")
		}
		if ( typeof(body.size) != "undefined" ) {
			cell.style["width"] = body.size + "ch"
		}
		this.fixDataRows()
		this.tableColumns++
		this.resizeTable(cell)
	}

	buildNode ( row, type, parent ) {
		let cell = row.insertCell()
		let shield = document.createElement("div")
		this.initializeRow(row, type)
		row.tkrad["button"] = document.createElement("i")
		shield.classList.add("tkrad-table-node-cell")
		shield.appendChild(row.tkrad["button"])
		cell.appendChild(shield)
		this.collapseNode(row)
		row.tkrad["id"] = ++this.nodeId
		if ( typeof(parent) == "undefined" ) {
			row.tkrad["level"] = 0
			this.showNode(row)
		} else {
			row.tkrad["level"] = parent.tkrad["level"] + 1
			parent.tkrad["child"].push(row)
			row.tkrad["parent"] = parent
			cell.style["text-indent"] = '0.' + ( row.tkrad["level"] * 2 ) + 'em'
			if ( parent.style["display"] == parent.tkrad["display"] && parent.tkrad["expanded"] ) {
				this.showNode(row)
			} else {
				this.hideNode(row)
			}
		}
	}

	toggleNode ( row ) {
		if ( row.tkrad["expanded"] ) {
			this.collapseNode(row)
			this.treeSetup(row, false)
		} else {
			this.expandNode(row)
			this.treeSetup(row, true)
		}
		this.refreshPage()
	}

	collapseNode ( row ) {
		if ( typeof(row.tkrad["close"]) != "undefined" ) {
			row.tkrad["close"]()
		}
		if ( row.tkrad["type"] == "data" ) { return }
		row.tkrad["button"].className = "mdi mdi-folder-plus"
		row.tkrad["expanded"] = false
	}

	expandNode ( row ) {
		if ( typeof(row.tkrad["open"]) != "undefined" ) {
			row.tkrad["open"]()
		}
		if ( row.tkrad["type"] == "data" ) { return }
		row.tkrad["button"].className = "mdi mdi-folder-open"
		row.tkrad["expanded"] = true
	}

	updateNode ( row, data ) {
		let hdrlist = this.headerObject.querySelectorAll("td")
		row.tkrad["values"] = data
		let cells = row.querySelectorAll("td")
		for ( let idx = 1 ; idx < hdrlist.length - 1 ; idx++ ) {
			let cell = cells[idx]
			let hcell = hdrlist[idx]
			let name = hcell.tkrad.name
			cell.tkradSetValue(data[name])
		}
	}

	addNode ( data, parent, index ) {
		let hdrlist = this.headerObject.querySelectorAll("td")
		let row = this.appendRow(parent,index)
		this.buildNode(row, "node", parent)
		row.classList.add("tkrad-table-node-row", "tkrad-table-row")
		row.tkrad["values"] = data
		row.tkrad["child"] = []
		let cells = []
		for ( let idx = 1 ; idx < hdrlist.length - 1 ; idx++ ) {
			let cell = row.insertCell()
			cells.push(cell)
			cell.classList.add("tkrad-table-node-cell")
			let hcell = hdrlist[idx]
			let name = hcell.tkrad["name"]
			if ( hdrlist[idx].classList.contains("tkrad-table-cell-right") ) {
				 cell.classList.add("tkrad-table-cell-right")
			}
			if ( typeof(data[name]) == "undefined" ) { continue }
			let element = hdrlist[idx].tkrad.property.element
			if ( typeof(element.builder) == "undefined" ) {
				cell.tkradSetValue = function (value) {
					this.innerHTML = value
				}
			} else {
				let ele = element.builder()
				ele.tkrad = element
				cell.tkradSetValue = (value) => {
					ele.tkradSetValue(value)
				}
				cell.appendChild(ele)
			}
			cell.tkradSetValue(data[name])
		}
		row.querySelector("td").onclick = () => {
			this.toggleNode(row)
			this.setSelected("node",row)
		}
		for ( let idx = 0 ; idx < cells.length ; idx++ ) {
			cells[idx].onclick = () => {
				this.setSelected("node",row)
			}
		}
		this.addLineTools(row, "tkrad-table-node-tools")
		return row
	}

	appendRow ( parent,idx ) {
		let row
		if ( typeof(parent) == "undefined" ) {
			row = this.bodyObject.tkradNewRow()
		} else {
			if ( typeof(idx) == "undefined" ) {
				idx = parent.tkrad["child"].length
				if ( idx == 0 ) {
					idx = parent.rowIndex
				} else {
					idx = parent.tkrad["child"][idx-1].rowIndex
				}
			}
			row = this.bodyObject.tkradNewRow(idx)
		}
		this.refreshPage()
		return row
	}

	showNode ( row ) {
		row.style["display"] = row.tkrad["display"]
	}

	hideNode ( row ) {
		row.style["display"] = "none"
	}

	treeSetup ( node, mode ) {
		if ( node.tkrad["type"] == "data" ) { return }
		for ( let idx = 0 ; idx < node.tkrad["child"].length ; idx++ ) {
			let chd = node.tkrad["child"][idx]
			if ( mode ) {
				this.showNode(chd)
				if (chd.tkrad["expanded"]) {
					this.treeSetup(chd, mode)
				}
			} else {
				this.hideNode(chd)
				this.treeSetup(chd, mode)
			}
		}
	}

	getSelected () {
		let css = ".tkrad-table-data-row[tkrad-selected]"
		let sel = this.bodyObject.querySelectorAll(css)
		if ( sel.length == 0 ) {
			css = ".tkrad-table-node-row[tkrad-selected]"
			sel = this.bodyObject.querySelectorAll(css)
		}
		return sel
	}

	selectedByKey ( keyname, key ) {
		let row = this.getRowByKey(keyname, key)
		if ( row.length != 1 ) { return }
		console.log("TODO", keyname, key)
	}

	dropRowByKey ( keyname, key ) {
		let row = this.getRowByKey(keyname, key)
		if ( row.length != 1 ) { return }
		this.dropRow(row[0])
	}

	getRowByKey ( keyname, key ) {
		return this.getByKey(keyname, key, ".tkrad-table-data-row")
	}

	getNodeByKey ( keyname, key ) {
		return this.getByKey(keyname, key, ".tkrad-table-node-row")
	}

	getByKey( keyname, key, classname ) {
		let rows = this.bodyObject.querySelectorAll(classname)
		let back = []
		if ( rows == null ) { return back }
		for ( let idx = 0 ; idx < rows.length ; idx++ ) {
			let row = rows[idx]
			if ( typeof(row.tkrad[keyname]) == "undefined" ) {
				continue
			}
			if ( row.tkrad[keyname] != key  ) { continue }
			back.push(row)
		}
		return back
	}

	updateItem ( row, data ) {
		let hdrlist = this.headerObject.querySelectorAll("td")
		row.tkrad["values"] = data
		let cells = row.querySelectorAll("td")
		for ( let idx = 1 ; idx < hdrlist.length - 1 ; idx++ ) {
			let cell = cells[idx]
			let hcell = hdrlist[idx]
			let name = hcell.tkrad.name
			cell.tkradSetValue(data[name])
		}
	}

	addItem ( data, parent, index ) {
		let hdrlist = this.headerObject.querySelectorAll("td")
		let row = this.appendRow(parent,index)
		this.buildNode(row, "data", parent)
		row.classList.add("tkrad-table-data-row", "tkrad-table-row")
		row.tkrad["values"] = data
		for ( let idx = 1 ; idx < hdrlist.length - 1 ; idx++ ) {
			let cell = row.insertCell()
			cell.classList.add("tkrad-table-data-cell")
			let hcell = hdrlist[idx]
			let name = hcell.tkrad["name"]
			if ( hdrlist[idx].classList.contains("tkrad-table-cell-right") ) {
				cell.classList.add("tkrad-table-cell-right")
			}
			if ( typeof(data[name]) == "undefined" ) { continue }
			let element = hdrlist[idx].tkrad.property.element
			if ( typeof(element.builder) == "undefined" ) {
				cell.tkradSetValue = function (value) {
					this.innerHTML = value
				}
			} else {
				let ele = element.builder()
				ele.tkrad = element
				cell.tkradSetValue = (value) => { ele.tkradSetValue(value) }
				if ( typeof(element.functions) != "undefined" ) {
					element.functions.forEach( f => { f(ele) })
				}
				cell.appendChild(ele)
			}
			cell.tkradSetValue(data[name])
		}
		row.childNodes.forEach( cell => {
			cell.childNodes.forEach( ele => {
				if ( typeof(ele.tkrad) == "undefined" ) { return }
				// funzioni da eseguire dopo che l'elemento è stato creato
				let funcList = ele.tkrad.runAfterCreate
				if ( typeof(funcList) != "undefined" ) {
					funcList.forEach( f => { f(ele) })
				}
				// binding sulla cella per fare il totale nel footer
				if ( typeof(this.footerSumColumns) != "undefined" && this.footerSumColumns.includes(ele.name) ) {
					ele.runCustomEvents = () => {
						let ev = new CustomEvent("sum_column_event")
						ele.dispatchEvent(ev)
					}
					ele.tkradSetValue = (function() {
						// uso questo trucco, per aggiungere al function
						// un'altra function da eseguire dopo
						let cached_function = ele.tkradSetValue
						return function(value) {
							cached_function.apply(this, arguments)
							ele.runCustomEvents()
						}
					}())
					this.sumColumnBinding(ele)
				}
			})
		})
		row.tkrad["button"].classList.add("mdi", "mdi-menu-right")
		this.addLineTools(row, "tkrad-table-line-tools")
		let cells = []
		// node nav
		cells.push(row.querySelector("td"))
		// data cells
		cells.push(...row.querySelectorAll(".tkrad-table-data-cell"))
		for ( let idx = 0 ; idx < cells.length ; idx++ ) {
			cells[idx].onclick = () => {
				this.setSelected("data",row)
			}
		}
		return row
	}

	setSelected ( type, row ) {
		this.walkRows(".tkrad-table-node-row[tkrad-selected]", (row) => {
			row.removeAttribute("tkrad-selected")
		})
		this.walkRows(".tkrad-table-data-row[tkrad-selected]", (row) => {
			row.removeAttribute("tkrad-selected")
		})
		row.setAttribute("tkrad-selected", true)
		if ( type == "node" ) {
			this.selectNode(row)
		} else {
			this.selectItem(row)
		}
	}

	selectItem (row) {}

	selectNode (row) {}

	walkRows(selector, command) {
		let rows = this.bodyObject.querySelectorAll(selector)
		for ( let idx = 0 ; idx < rows.length ; idx++ ) {
			command(rows[idx])
		}
	}

	dropRow(row) {
		row.remove()
		this.refreshPage()
	}
}

customElements.define("tkrad-table-filesys", class extends HTMLElement {
	constructor () {
		super()
		this.tableWidget = {}
		this.tableWidget.lines = 12
		this.widgetObject = new tkrad.tkradTableWidget(this)
		this.classList.add("tkrad-table")
		this.render()
	}
	connectedCallback () {
		this.widgetObject.appendChild()
	}
	render() {
		this.widgetObject.buildWidget()
		this.widgetObject.addHeader({ title: "Nome", name: "filename" })
		this.widgetObject.addHeader({ title: "Data Modifica", name: "mtime" })
		this.widgetObject.addHeader({ title: "Dimensione", name: "size", justify: "right" })
		if ( !this.hasAttribute("reload") ) { return }
		this.widgetObject.addNav("mdi-reload", () => {
			this.widgetObject.objectReset()
			this.scanPath("Root", (blob) => {
				for ( let key in blob.data ) {
					this.addCgiNode(blob.data[key])
				}
			})
			this.widgetObject.refreshPage()
                })
	}
	userConnect(app)  {
		if (app.sessionid == null) {
			app.sessionid = app.getAttribute('sessionid')
		}
		let url = 'cgi/filesys.tcl'
		let myHeaders = new Headers({
			'X-CONNECT': true,
			'X-GETUSER': app.sessionid 
		})
		var myInit = { 
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow',
			mode: 'cors',
			cache: 'default',
			credentials: 'same-origin' 
		};
		let request = new Request(url, myInit)
		fetch(url,myInit)
		.then(response => {
			if (response.ok) {
				app.widgetObject.objectReset()
				response.json().then(function(contents) {
					for ( let key in contents.data ) {
						app.addCgiNode(contents.data[key])
					}
				})
				app.widgetObject.refreshPage()
			}
			if (response.status >= 100 && response.status < 200) {
				console.log("Informazioni per il client");
			}
			if (response.status >= 300 && response.status < 399) {
				console.log("Redirezione");
			}
			if (response.status >= 400 && response.status < 499) {
				console.log("Richiesta errata");
			}
			if (response.status >= 500 && response.status < 599) {
				console.log("Errore sul server");
			}	
		})
	}
	userDisconnect(app) {
		app.sessionid = null
		app.widgetObject.objectReset()
		app.widgetObject.refreshPage()
	}
	scanPath(root, driver, app) {
		if (app.sessionid == null) {
			app.sessionid = app.getAttribute('sessionid')
		}
		let url = 'cgi/filesys.tcl'
		let myHeaders = new Headers({
			'X-DIR': root,
			'X-GETUSER': app.sessionid 
		})
		var myInit = { 
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow',
			mode: 'cors',
			cache: 'default',
			credentials: 'same-origin' 
		};
		let request = new Request(url, myInit)
		fetch(url,myInit)
		.then ( (response) => {
			return response.json()
		})
		.then ( (json) => {
			driver(json)
		})
		.catch ( (error) => {
			console.log("ERROR FETCH", error)
		})
	}
	runUpload ( input, path, node) {
		let reader = new FileReader()
		var app = input.parentNode
		app.setAttribute('upload', true)
		var dest = path + "/" + input.files[0].name
		reader.onload = function(event) {
			let data = event.target.result
			let url = 'cgi/filesys.tcl'
			let myHeaders = new Headers({
				'X-GETUSER': app.sessionid,
				'X-UPLOAD': dest
			})
			var myInit = { 
				method: 'POST',
				headers: myHeaders,
				body: data,
				redirect: 'follow',
				mode: 'cors',
				cache: 'default',
				credentials: 'same-origin' 
			};
			let request = new Request(url, myInit)	
			fetch(url,myInit)
			.then(response => {
				if (response.ok) {
					response.json().then(function(contents) {
						if ( node.tkrad["expanded"] ) {
							for ( let idx = 0 ; idx < node.tkrad["child"].length ; idx++ ) {
								if (node.tkrad["child"][idx].getAttribute('type') == 'file' ) {
									if (node.tkrad["child"][idx].getAttribute('filename') == contents.value) {
										node.tkrad["child"][idx].remove()
									}
								}
							}
							let row = app.addCgiNode(contents, node)
							row.style["display"] = row.tkrad["display"]
							app.widgetObject.refreshPage()
						}
						app.removeAttribute('upload')
					})
				}
				if (response.status >= 100 && response.status < 200) {
					console.log("Informazioni per il client");
				}
				if (response.status >= 300 && response.status < 399) {
					console.log("Redirezione");
				}
				if (response.status >= 400 && response.status < 499) {
					console.log("Richiesta errata");
				}
				if (response.status >= 500 && response.status < 599) {
					console.log("Errore sul server");
				}
			})
			app.removeChild(input)
		}
		reader.readAsArrayBuffer(input.files[0])
	}
	runDownload(app,path,name) {
		let url = 'cgi/filesys.tcl'
		app.setAttribute('download', true)
		let myHeaders = new Headers({
			'X-GETUSER': app.sessionid,
			'X-DOWNLOAD': path
		})
		var myInit = { 
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow',
			mode: 'cors',
			cache: 'default',
			credentials: 'same-origin' 
		};
		let request = new Request(url, myInit)
		fetch(url,myInit)
		.then(response => {
			if (response.ok) {
				response.blob().then(function(contents) {
					let url = URL.createObjectURL(contents)
    					let a = document.createElement('a')
					app.appendChild(a)
    					a.href = url
    					a.download = name
    					a.click()
    					URL.revokeObjectURL(url)
					app.removeAttribute("download")
					app.removeChild(a)
				})
			}
			if (response.status >= 100 && response.status < 200) {
				console.log("Informazioni per il client");
			}
			if (response.status >= 300 && response.status < 399) {
				console.log("Redirezione");
			}
			if (response.status >= 400 && response.status < 499) {
				console.log("Richiesta errata");
			}
			if (response.status >= 500 && response.status < 599) {
				console.log("Errore sul server");
			}
		})
	}
	runDelete(app,path,node) {
		let url = 'cgi/filesys.tcl'
		let myHeaders = new Headers({
			'X-GETUSER': app.sessionid,
			'X-DELETE': path
		})
		var myInit = { 
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow',
			mode: 'cors',
			cache: 'default',
			credentials: 'same-origin' 
		};
		let request = new Request(url, myInit)
		fetch(url,myInit)
		.then(response => {
			if (response.ok) {
				node.remove()
			}
			if (response.status >= 100 && response.status < 200) {
				console.log("Informazioni per il client");
			}
			if (response.status >= 300 && response.status < 399) {
				console.log("Redirezione");
			}
			if (response.status >= 400 && response.status < 499) {
				console.log("Richiesta errata");
			}
			if (response.status >= 500 && response.status < 599) {
				console.log("Errore sul server");
			}
		})
	}
	addCgiNode ( back, parent ) {
		let node
		let obj = {}
		obj["filename"] = back.value
		if ( back.type == "file" ) {
			obj["mtime"] = back.mtime
			obj["size"] = back.size
			node = this.widgetObject.addItem(obj, parent)
			this.widgetObject.addItemTool(node, "mdi-file-download", () => {
				this.runDownload(this,back.path,back.value)
			})
			if ( back.writable ) {
				this.widgetObject.addItemTool(node, "mdi-delete", () => {
					let text = "Sicuro di voler cancellare il file"
					if (confirm(text) == true) {
						this.runDelete(this,back.path,node)
					}
				})
			}
			node.setAttribute('type','file')
			node.setAttribute('filename',back.value)
			return node
		}
		node = this.widgetObject.addNode(obj, parent)
		node.tkrad["open"] = () => {
			this.openNode(node, back.path)
		}
		node.tkrad["close"] = () => {
			this.closeNode(node)
		}
		this.widgetObject.addNodeTool(node, "mdi-folder-download", () => {
			this.runDownload(this,back.path,back.value)
		})
		this.widgetObject.addNodeTool(node, "mdi-folder-plus", (node) => {
			let a = document.createElement('input')
			a.style.display = 'none'
			this.appendChild(a)
			a.setAttribute('type', 'file')
			a.addEventListener('change', ()=> { this.runUpload(a,back.path,node) }) 
			a.click()
		})
		node.setAttribute('type','dir')
		return node
	}
	openNode(node, path) {
		this.scanPath(path, (blob) => {
			for ( let key in blob.data ) {
				let chd = this.addCgiNode(blob.data[key], node)
				this.widgetObject.showNode(chd)
			}
		},this)
	}
	closeNode(row) {
		if ( typeof(row.tkrad["child"]) != "undefined" ) {
			for ( let idx = 0 ; idx < row.tkrad["child"].length ; idx++ ) {
				if ( row.tkrad["child"][idx].getAttribute('type') == 'dir') {
					this.closeNode(row.tkrad["child"][idx])
				}
				row.tkrad["child"][idx].remove()
			}
			row.tkrad["child"] = []
		}
	}
})
