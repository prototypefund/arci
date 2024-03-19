'use strict';
import CustomInput from '../CustomInput.js';

export default class InteractionText extends HTMLElement {
	
	static name = "Text"
	static icon = "article"
	
	constructor(msg, callback) {
		super();
		
		this.text = msg.text
		this.shadow = this.attachShadow({ mode: 'open' });

		const container = document.createElement('template');
		

		// creating the inner HTML of the editable list element
		container.innerHTML = `
			<link href="${window.location.origin}/static/player-style-classes.css" rel="stylesheet" />
			<style>
				#content{
					
					height: 100%;
					background-size: cover;
				}
			</style>
			<div id="content">
				<h1>${this.text}</h1>
			</div>
		`;

		//background-image: url("${this.mediaPath}");
		this.shadow.appendChild(container.content.cloneNode(true));
		
		
		callback({status: "ok"})
		console.log("OK")
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		
	}
	
	static createFields(form){
		CustomInput.textarea(form, "text", "Text:")
		CustomInput.br(form)
	}

}

customElements.define('interaction-text', InteractionText);
