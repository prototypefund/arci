'use strict';
import { Cue } from './Cue.js';
import { FloatingActionButton } from './FloatingActionButton.js';
import { socket } from './socket.js';

class CueList extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
		this.activeCue = undefined
		
		socket.on("load sequence", (data) => { 
			this.clearCueLists()
			document.querySelector("scene-tabs").clearScenes()
			console.log("seq", data) 
			for(let scene of data){
				//this.addSequence(scene.name)
				document.querySelector("scene-tabs").addScene(scene.name)
				for( let cue of scene.completeCues){
					this.addCue(cue, false)
				}
				//this.changeSequence(scene.name)
			}
		});


		const listcontainer = document.createElement('template');

		// creating the inner HTML of the editable list element
		listcontainer.innerHTML = `
			<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
			<style>
				.list-content{
					
					height: 95%;
					
					overflow: scroll;
				}
				
				cue-item{
					width: 100%;
					height: 5vh;
				}
				
				nav{
					height: 5%;
				}
				
			</style>
			
			<div id="nav">
				<button id="prev">back</button>
				<button id="next">next</button>
			</div>
		
		`;

		// binding methods
		//this.addListItem = this.addListItem.bind(this);
		//this.handleRemoveItemListeners = this.handleRemoveItemListeners.bind(this);
		//this.removeListItem = this.removeListItem.bind(this);

		// appending the container to the shadow DOM
		this.shadow.appendChild(listcontainer.content.cloneNode(true));
		//this.content = this.shadow.getElementById("list-content")
		
		
		
		
		this.addEventListener("drop", (event) => {
			event.preventDefault();
			let data = JSON.parse(event.dataTransfer.getData("data"))
			this.addCue( data )
			console.log("drop", event, data)
			this.actionbutton.setVisible(false)
		})
		
		this.addEventListener('dragstart', (event) => {
			console.log("drag start list")
			this.actionbutton.setVisible(true)
		})
		
		
		
		this.addEventListener("dragover", (event) => {
		// prevent default to allow drop
			event.preventDefault();
		});
	}
	
	clearCueLists(){
		for(let sq of this.shadow.querySelectorAll(".list-content")){
			sq.remove()
		}
	}
	
	addSequence(name){
		let list = document.createElement("div")
		list.classList.add("list-content")
		list.id = name
		this.shadow.appendChild(list)
		this.content = list
	}
	
	changeSequence(name){
		console.log("cue list changes to", name)
		let seq = this.shadow.getElementById(name)
		if(!seq){
			this.addSequence(name)
		}
		seq = this.shadow.getElementById(name)
		for(let sq of this.shadow.querySelectorAll(".list-content")){
			sq.style.display = "none"
			sq.disabled = true
		}
		seq.style.display = "block"
		seq.disabled = false
		this.content = seq
	}
	
	deleteCue(id){
		let cue = this.shadow.getElementById(id)
		cue.remove()
		this.saveCueSequence()
	}
	
	addCue(data, saveSequence=true){
		let c1 = new Cue(data)
		this.content.appendChild(c1)
		c1.addEventListener("click cue", (event) => {
			console.log("cue event received", event.target)
			this.handleCueClick(event.target.getAttribute("instance"))
		})
		if(saveSequence){
			this.saveCueSequence()
		}
	}
	
	handleCueClick(instanceID){
		let cues = this.shadow.querySelectorAll("cue-item")
		for(let [idx,c] of cues.entries()){
			if(c.getAttribute("instance") == instanceID){
				c.activate()
				this.activeCue = c
				
				let preloadIDs = []
				for(let i = 1; i<=3; i++){
					if(cues[idx+i]){
						preloadIDs.push(Number(cues[idx+i].id))
					}
				}
				console.log("preload:", preloadIDs)
				socket.emit("cue:preload", preloadIDs)
				
			}else{
				c.deactivate()
			}
		}
		this.saveCueSequence()
	}
	
	saveCueSequence(){
		let complete = []
		let seqs = this.shadow.querySelectorAll(".list-content")
		for(let s of seqs){
			let cues = s.querySelectorAll("cue-item")
			let list = []
			for(let c of cues){
				list.push(c.getAttribute("id"))
			}
			complete.push({name: s.id, sequence: list})
		}
		
		socket.emit("save cue sequence", complete)
	}


	// fires after the element has been attached to the DOM
	connectedCallback() {
		document.addEventListener("scene active", (event) => {
			console.log("scene active in cuelist")
		})
		
		this.shadow.getElementById("prev").addEventListener("click", (event => {
			let instance = this.activeCue.previousSibling.getAttribute("instance")
			if(instance){
				this.handleCueClick(instance)
			}
		}))
		
		this.shadow.getElementById("next").addEventListener("click", (event => {
			console.log("NEXT")
			if(this.activeCue){
				let instance = this.activeCue.nextSibling?.getAttribute("instance")
				if(instance){
					this.handleCueClick(instance)
				}
			}else{
				let instance =this.shadow.querySelector("cue-item").getAttribute("instance")
				if(instance){
					this.handleCueClick(instance)
				}
			}
			
		}))
		
	}

}

customElements.define('cue-list', CueList);

