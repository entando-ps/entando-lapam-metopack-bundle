import {tkrad} from "./tkrad";

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
