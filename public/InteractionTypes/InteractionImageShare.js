'use strict';
import CustomInput from '../CustomInput.js';

export default class InteractionImageShare extends HTMLElement {
	
	static name = "Image Share"
	static icon = "send_to_mobile"
	
	constructor(msg, callback) {
		super();
		
		this.shadow = this.attachShadow({ mode: 'open' });
		this.info = msg

		const container = document.createElement('template');

		// creating the inner HTML of the editable list element
		container.innerHTML = `
			<link href="${window.location.origin}/static/player-style-classes.css" rel="stylesheet" />
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
				img{
					max-width: 90%;
					max-height: 50%;
				}
			</style>
			<div id="content">
				<h1>${msg.text}</h1>
				<input type="file" id="file"></input>
				<button id="sendBtn">send</button>
			</div>
		`;

		//background-image: url("${this.mediaPath}");
		this.shadow.appendChild(container.content.cloneNode(true));
		callback({status: "ok"})
		
		this.shadow.getElementById("file").addEventListener("click", () => {
			console.log("dispatch allow switch")
			this.dispatchEvent(new CustomEvent("allow-switch"))
		})
		
		this.shadow.getElementById("file").addEventListener("change", (e) => {
			if(e.target.files[0]){
				let image = new Image()
				image.id = "userimg"
				image.name = e.target.files[0].name
				e.target.replaceWith(image)
				image.src = URL.createObjectURL( e.target.files[0] )
			}
			
		})
		
		this.shadow.getElementById("sendBtn").addEventListener("click", () => {
			
			let maxSize = 800
			let img = this.shadow.getElementById("userimg")
			let filename = encodeURIComponent(img.name)
			let maxscale = Math.max(img.naturalWidth, img.naturalHeight) > maxSize ? maxSize / Math.max(img.naturalWidth, img.naturalHeight) : 1
			let canvas = document.createElement("canvas")
			canvas.width = img.naturalWidth * maxscale
			canvas.height = img.naturalHeight * maxscale
			console.log("scaling to", canvas.width, canvas.height, maxscale)
			let ctx = canvas.getContext("2d")
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
			
			var dataurl = canvas.toDataURL("image/jpeg", 0.2);
			img.src = dataurl;
			
			canvas.toBlob((blob) => {
				let file = new File([blob], filename, { type: "image/jpeg" })
				//actionCallback({answer: answer})
				this.dispatchEvent(new CustomEvent("interaction:fileupload", {detail: { file: file, name: filename, info: msg }}));
				this.shadow.getElementById("content").innerHTML = ""
				console.log("dispatch reenter fullscreen")
				this.dispatchEvent(new CustomEvent("reenter-fullscreen"))
			}, 'image/jpeg');
			
			/*
			let file = dataurl //this.shadow.getElementById("file").files[0]
			let filename = file.name
			//actionCallback({answer: answer})
			this.dispatchEvent(new CustomEvent("interaction:fileupload", {detail: { file: file, name: filename, info: msg }}));
			this.shadow.getElementById("content").innerHTML = ""
			console.log("dispatch reenter fullscreen")
			this.dispatchEvent(new CustomEvent("reenter-fullscreen"))
			*/
		})
		
	}
	
	static shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
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
			let imgCollection = document.createElement("div")
			imgCollection.style.display = "flex"
			imgCollection.id = "collection"
			container.appendChild(imgCollection)
			
			let btn = document.createElement("button")
			btn.innerHTML = "Share Images"
			btn.addEventListener("click", () => {
				let paths = []
				for(let img of imgCollection.childNodes){
					paths.push(img.name)
				}
				console.log(paths)
				InteractionImageShare.shuffleArray(paths)
				container.dispatchEvent(new CustomEvent("interaction:show-answer", {detail: {paths: paths, id: msg.info.id} }));
			})
			container.appendChild(btn)
		}
		let div = document.createElement("div")
		div.style.backgroundImage = `url('/media/${msg.name}')`
		div.style.backgroundSize = "contain"
		div.style.backgroundPosition = "center"
		div.style.backgroundRepeat = "no-repeat"
		div.id = msg.playerID
		div.name = msg.name
		div.style.width = "4em" 
		div.style.height = "4em" 
		container.querySelector("#collection").appendChild(div)
	}
	
	handleAdditionalInfo(){
		console.log("additional Info")
		console.log(this.info)
		let newMsg = {
			type: "image",
			filename: this.info.additionalInfo.paths[ Number(this.info.ownPlayerID)-1 ]
		}
		this.dispatchEvent(new CustomEvent("interaction:forward", {detail: newMsg}))
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		if(this.info.additionalInfo){
			this.handleAdditionalInfo()
		}
	}
	
	static createFields(form){
		CustomInput.textInput(form, "text", "Title:")
	}

}

customElements.define('interaction-image-share', InteractionImageShare);
