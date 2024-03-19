'use strict';
import { socket } from './socket.js';

class DebugBox extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.session = false
		
		socket.on("session:info", (data) => { 
			console.log(data) 
			this.session = data
			this.updateSessionGUI()
		});

		

		const boxcontainer = document.createElement('template');

		// creating the inner HTML of the editable list element
		boxcontainer.innerHTML = `
			<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

			<style>
			
				.sessionrunning{
					border: 3px solid red;
				}
			</style>
			<div id="box-content">
				<button id="start">Start Session</button>
				<button id="stopsound">STOP Sounds</button>
			</div>
		
		`;

		// binding methods
		//this.addListItem = this.addListItem.bind(this);
		//this.handleRemoveItemListeners = this.handleRemoveItemListeners.bind(this);
		//this.removeListItem = this.removeListItem.bind(this);

		// appending the container to the shadow DOM
		this.shadow.appendChild(boxcontainer.content.cloneNode(true));
		
		
	}
	

	updateSessionGUI(){
		if(this.session){
			this.shadow.getElementById("start").innerHTML = "STOP Session"
			this.shadow.getElementById("box-content").classList.add("sessionrunning")
		}else{
			this.shadow.getElementById("start").innerHTML = "START Session"
			this.shadow.getElementById("box-content").classList.remove("sessionrunning")
		}
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		this.shadow.getElementById("start").addEventListener("click", () => {
			if(this.session){
				socket.emit("session:end")
			}else{
				socket.emit("session:start")
			}
		})
		
		this.shadow.getElementById("stopsound").addEventListener("click", () => {
			socket.emit("session:stopsound")
			
		})
		
	}

}

customElements.define('debug-box', DebugBox);

