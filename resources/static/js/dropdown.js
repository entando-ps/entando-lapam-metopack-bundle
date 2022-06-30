export var tkrad = tkrad ? tkrad : {}

tkrad.tkradMenu = class {

	constructor ( parent ) {
		this.htmlObject = parent
		this.menuObject = document.createElement("div")
		this.menuObject.classList.add("tkrad-menu-content")
		this.menuObject.classList.add("tkrad-elevator")
		this.menuObject.tkrad = {}
		this.menuObject.tkrad.childs = []
	}

	appendChild() {
		this.initMenu(this.menuObject)
		this.htmlObject.appendChild(this.menuObject)
		this.menuObject.tkrad.clickbind = this.clickFunction.bind(this)
		document.addEventListener('click', this.menuObject.tkrad.clickbind)
	}
	clickFunction() {
		event.preventDefault();
		let isme = this.htmlObject.contains(event.target)
		if ( isme ) {
			return
		}
		this.hideMenu()
	}

	getWidget () {
		return this.menuObject
	}

	resetWidget () {
		for ( let idx = 0 ; idx < this.menuObject.tkrad.childs.length ; idx++ ) {
			this.menuObject.tkrad.childs[idx].remove()
		}
		this.menuObject.tkrad.childs = []
	}

	toggleWidget() {
		this.menuObject.classList.toggle("tkrad-menu-hidden")
		this.toggleMenu(this.menuObject)
	}

	isHidden () {
		return this.menuObject.classList.contains("tkrad-menu-hidden")
	}

	toggleMenu(ele) {
		// console.log("TOGGLE", ele)
		let nodes = ele.tkrad.childs
		for ( let idx = 0 ; idx < nodes.length ; idx++ ) {
			let node = nodes[idx]
			node.classList.toggle("tkrad-menu-hidden")
		}
	}

	initMenu ( root ) {
		// console.log("HIDE", root)
		root.classList.add("tkrad-menu-hidden")
		if ( typeof(root.tkrad) == "undefined" ) { return }
		if ( typeof(root.tkrad.childs) == "undefined" ) { return }
		let nodes = root.tkrad.childs
		for ( let idx = 0 ; idx < nodes.length ; idx++ ) {
			let node = nodes[idx]
			this.initMenu(node)
		}
	}

	addCascade ( elem, title ) {
		let ele = document.createElement("a")
		let lab = document.createElement("div")
		ele.appendChild(lab)
		lab.innerHTML = title
		elem.appendChild(ele)
		ele.classList.add("tkrad-menu-cascade")
		let icon = document.createElement("span")
		icon.classList.add("mdi", "mdi-menu-down")
		lab.appendChild(icon)
		lab.onclick = () => { this.toggleMenu(ele) }
		ele.tkrad = {}
		ele.tkrad.childs = []
		elem.tkrad.childs.push(ele)
		return ele
	}

	addOption( elem, title ) {
		let ele = document.createElement("li")
		ele.innerHTML = title
		elem.appendChild(ele)
		ele.classList.add("tkrad-menu-item")
		ele.onclick = () => {
			this.hideMenu()
			this.runCommand(ele)
		}
		elem.tkrad.childs.push(ele)
		return ele
	}

	hideMenu () {
		this.menuObject.classList.toggle("tkrad-menu-hidden")
		this.toggleMenu(this.menuObject)
		// callback per chiusura menu
		if ( typeof(this.eventMenuClosed) != "undefined" ) {
			this.eventMenuClosed()
		}
	}

	showMenu () {
		let rect = this.htmlObject.getBoundingClientRect();
		this.htmlObject.style.top = rect.bottom;
		this.menuObject.classList.toggle("tkrad-menu-hidden")
		this.toggleMenu(this.menuObject)
	}

	unbindMenu () {
		//console.log("UNBIND",this.clickFunction.bind)
		document.removeEventListener('click', this.menuObject.tkrad.clickbind)
	}
}
