'use strict';
import { socket } from './socket.js';

export class SceneTab extends HTMLElement {
	constructor(name) {
		console.log("name", name)
		super();
		this.name = name
		this.shadow = this.attachShadow({ mode: 'open' });

		const listcontainer = document.createElement('template');

		// creating the inner HTML of the editable list element
		listcontainer.innerHTML = `
			<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
			<style>
				
				div{
					background-color: gray;
					width: 100%;
				}
				
				.active{
					background-color: red;
				}
				
				button{
					
				}
				
			</style>
			
			<div id="${name}" >${name} <button id="delete">X</button></div>
				
			
		`;

		this.setAttribute("name", this.name) 
		this.shadow.appendChild(listcontainer.content.cloneNode(true));

		this.shadow.getElementById("delete").addEventListener("click", (e) => {
			e.stopPropagation()
			this.deleteScene()
		})

	}
	
	deleteScene(){
		socket.emit("scene:delete", this.name)
	}
	
	activate(){
		this.shadow.querySelector("div").classList.add("active")
		this.dispatchEvent(new CustomEvent("scene active", { name: this.name }));
	}

	disable(){
		this.shadow.querySelector("div").classList.remove("active")
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		this.activate()
		this.addEventListener("click", (event) => {
			console.log("click", this.name)
			this.activate()
		})
	}

}

customElements.define('scene-tab', SceneTab);

