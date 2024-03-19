'use strict';

export default class InteractionMidi extends HTMLElement {
	
	static name = "Midi Button"
	static icon = "radio_button_checked"
	
	constructor(msg, callback) {
		super();
		
		this.text = msg.text
		console.log(msg)
		this.shadow = this.attachShadow({ mode: 'open' });

		const container = document.createElement('template');
		

		// creating the inner HTML of the editable list element
		container.innerHTML = `
			<style>
				#content{
					
					height: 100%;
					background-size: cover;
				}
			</style>
			<div id="content">
				${this.text}
				<button id="sendBtn">push</button>
			</div>
		`;

		//background-image: url("${this.mediaPath}");
		this.shadow.appendChild(container.content.cloneNode(true));
		
		
		callback({status: "ok"})
		console.log("OK")
		
		this.shadow.getElementById("sendBtn").addEventListener("click", () => {
			let answer = this.shadow.getElementById("answer").value
			//actionCallback({answer: answer})
			this.dispatchEvent(new CustomEvent("interaction:answer", {detail: { midi: "pressed" }}));
		})
	}
	

	// fires after the element has been attached to the DOM
	connectedCallback() {
		
	}
	
	static createFields(form){
		let textContentMidi = document.createElement("textarea")
		textContentMidi.id = "text-content"
		textContentMidi.name = "text"
		let textLabelMidi = document.createElement("label")
		textLabelMidi.setAttribute("for", "text-content")
		textLabelMidi.innerHTML = "Text:"
		form.appendChild(textLabelMidi)
		form.appendChild(textContentMidi)
		form.appendChild(document.createElement("br"))
	}

}

customElements.define('interaction-midi', InteractionMidi);
