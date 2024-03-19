'use strict';
import { NoSleep } from './NoSleep.js';
import { PlayerConnector } from './player-socket.js';
import howler from 'https://cdn.jsdelivr.net/npm/howler@2.2.4/+esm'

export class PlayerContent extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.allowSwitch = false
		
		this.queue = new createjs.LoadQueue();

		const container = document.createElement('template');
		this.interactionTypes = {}
		
		// creating the inner HTML of the editable list element
		container.innerHTML = `
			<link href="${window.location.origin}/static/player-style-classes.css" rel="stylesheet" />
			<style>
				#joinbutton{
					font-size: calc(2*var(--button-font-size)) !important;
					height: 25% !important;
				}
				#playerID{
					position: fixed;
					top: 0;
					left: 0;
					width: 20px;
					height: 20px;
					font-size: 1em;
					color: white;
				}
				#content{
					height: 90%;
					width: 95%;
					display: flex;
					flex-direction: column;
					justify-content: space-around;
					align-items: center;
				}
				#content > * {
					width: 100%;
					height: 100%;
				}
			</style>
			<div id="playerID"></div>
			<div id="content">
				<button id="joinbutton">JOIN!</button>
			</div>
		`;


		this.shadow.appendChild(container.content.cloneNode(true));
		this.content = this.shadow.getElementById("content")
		
		document.addEventListener("visibilitychange", () => {
			
			// Modify behavior…
			if(document.hidden && !this.allowSwitch){
				this.content.innerHTML = "you went away...please reload to join again."
				this.playerConnector.pauseUser()
			}
			
		});
		
	}
	

	clearContent(){
		this.content.innerHTML = ""
	}
	
	unlockFeatures(){
		this.allowSwitch = false
		if(!this.debug){
			let elem = document.documentElement
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			} else if (elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			}
		}
            
            
		this.noSleep = new NoSleep();
		this.noSleep.enable();
		
		
		//ToDo keep audio open
		setInterval(this.backgroundSound, 10000) //15000
		//this.backgroundSound()
	}
	
	backgroundSound(){
            let sound = new howler.Howl({
                    src: [window.location.origin +'/static/login.mp3'],
                    autoplay: true,
            });
            console.log("BG Sound")
            //setTimeout(this.backgroundSound, 1000) //15000
	}
	
	uploadFile(fileinfo) {
		console.log("uploading...", fileinfo)
        this.playerConnector.socket.emit("interaction:fileupload", fileinfo, (status) => {
          console.log(status);
        });
	}
	
	setInteraction(msg, callback){
		console.log("interaction: ", msg)
		msg.ownPlayerID = this.playerID
		this.content.classList.remove("fadeIn")
		this.content.classList.add("fadeOut");
		setTimeout(() => {
			
			this.mod = new this.interactionTypes[msg.type](msg, callback)
			this.content.innerHTML = ""
			this.mod.addEventListener("interaction:answer", (event) => {
				this.playerConnector.socket.emit("interaction:answer", event.detail)
			})
			this.mod.addEventListener("interaction:fileupload", (event) => {
				this.uploadFile(event.detail)
			})
			this.mod.addEventListener("interaction:forward", (event) => {
				console.log("forwarding", event.detail)
				this.setInteraction(event.detail, () => {})
			})
			this.mod.addEventListener("allow-switch", (event) => {
				console.log("allow switch")
				this.allowSwitch = true
			})
			this.mod.addEventListener("reenter-fullscreen", (event) => {
				console.log("reenter fullscreen")
				this.unlockFeatures()
			})
			this.content.appendChild(this.mod)
			
			
			
			setTimeout(() => {
				this.content.classList.remove("fadeOut")
				this.content.classList.add("fadeIn")
			},50)
			
		}, 70)
		/*
		
		*/
	}

	// fires after the element has been attached to the DOM
	connectedCallback() {
		const urlParams = new URLSearchParams(window.location.search);
		this.debug = urlParams.get('debug')
		if(this.debug){
			this.debugClearStorage()
		}
		const id = urlParams.get('id')
		const sessionToken = urlParams.get('sessionToken')
		//localStorage.setItem("bodua-session-token", sessionToken)
		
		
		this.playerConnector = new PlayerConnector(this.updateID.bind(this))
		
		this.playerConnector.socket.on("player:interactionTypes", (data) => {
			console.log("interactiontypes", data)
			for(let type of data){
				console.log("importing", "./InteractionTypes/"+type)
				import("./InteractionTypes/"+type).then( cls => {
					this.interactionTypes[cls.default.name.toLowerCase()] = cls.default
				})
			}
		})
		
		this.playerConnector.socket.on("player:interaction", (data, callback) => {
			this.setInteraction(data, callback)
		})
		
		this.playerConnector.socket.on("player:cue-update", (data) => {
			
			this.mod.updateInformation(data)
		})
		
		this.playerConnector.socket.on("player:stopsound", (data) => {
			Howler.stop()
		})
		
		this.playerConnector.socket.on("player:preload", (cues) => {
			
			for(let cue of cues){
				// create cue to let it preload
				let fullCue = new this.interactionTypes[cue.type](cue, () => {})
			}
		})
		
		this.shadow.getElementById("joinbutton").addEventListener("click", () => {
			//navigator.vibrate(150);
			this.unlockFeatures()
			this.clearContent()
			this.playerConnector.registerUser(urlParams.get('id'), urlParams.get('sessionToken'))
			this.content.innerHTML = '<h3 id="welcome">Welcome!</h3><h3>You are all set now :)</h3>'
		})
	}
	
	debugClearStorage(){
		localStorage.removeItem("bodua-session-token")
		localStorage.removeItem("bodua-socket-id")
		localStorage.removeItem("bodua-player-id")
	}
	
	updateID(response){
		this.content.innerHTML = `<h1>${response.message}</h1>`  
		if(response.success){
			
			console.log(this.shadow)
			this.shadow.getElementById("playerID").innerHTML = response.info.id
			this.playerID = response.info.id
		}
	}

}

customElements.define('player-content', PlayerContent);
