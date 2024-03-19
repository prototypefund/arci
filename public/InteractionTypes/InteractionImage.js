'use strict';
import CustomInput from '../CustomInput.js';

export default class InteractionImage extends HTMLElement {
	
	static name = "Image"
	static icon = "imagesmode"
	
	constructor(msg, callback) {
		super();
		
		this.mediaPath = "./media/" + msg.filename
		this.shadow = this.attachShadow({ mode: 'open' });
		

		const container = document.createElement('template');
		

		// creating the inner HTML of the editable list element
		container.innerHTML = `
			<style>
				#content{
					position: fixed;
					top: 0;
					left: 0;
					height: 100vh;
					width: 100vw;
					background-size: cover;
					background-position: center;
					z-index: 10;
				}
			</style>
			<div id="content">
			</div>
		`;

		//background-image: url("${this.mediaPath}");
		this.shadow.appendChild(container.content.cloneNode(true));
		
		var image = new Image();
		
		image.addEventListener('load', () => {
			this.shadow.getElementById("content").style.backgroundImage = 'url(' + this.mediaPath + ')';
			callback({status: "ok"})
			console.log("OK")
		});
		image.src = this.mediaPath;
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		
	}
	
	static createFields(form){
		CustomInput.filepicker(form, "filename", "Choose an Image:")
		CustomInput.br(form)
	}

}

customElements.define('interaction-image', InteractionImage);
