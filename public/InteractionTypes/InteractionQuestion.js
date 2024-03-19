'use strict';
import CustomInput from '../CustomInput.js';

export default class InteractionQuestion extends HTMLElement {
	
	static name = "Question"
	static icon = "edit_note"
	
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
				textarea{
					width: 100%;
					height: 40%;
					font-size: 2em;
				}
			</style>
			<div id="content">
				<h1>${this.text}</h1>
				<textarea id="answer"></textarea>
				<button id="sendBtn">send</button>
			</div>
		`;

		//background-image: url("${this.mediaPath}");
		this.shadow.appendChild(container.content.cloneNode(true));
		
		
		callback({status: "ok"})
		console.log("OK")
		
		this.shadow.getElementById("sendBtn").addEventListener("click", () => {
			let answer = this.shadow.getElementById("answer").value
			//actionCallback({answer: answer})
			this.dispatchEvent(new CustomEvent("interaction:answer", {detail: { answer: answer, info: msg }}));
		})
	}
	


	// fires after the element has been attached to the DOM
	connectedCallback() {
		
	}
	
	static handleAnswer(header, container, msg){
		console.log("id compare", header.getAttribute("cueID"), msg.info.id)
		if(Number(header.getAttribute("cueID")) != Number(msg.info.id)){
			header.innerHTML = ""
			container.innerHTML = ""
		}
		if(header.innerHTML == ""){
			header.innerHTML = `${msg.info.text}`
			header.setAttribute("cueID", msg.info.id)
		}
		let div = document.createElement("div")
		div.innerHTML = `${msg.playerID}: ${msg.answer}`
		container.appendChild(div)
	}
	
	static createFields(form){
		CustomInput.textarea(form, "text", "Question:")
		CustomInput.br(form)
	}

}

customElements.define('interaction-question', InteractionQuestion);
