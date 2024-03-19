import config from './arci-config.json' assert { type: 'json' }
console.log(config)

import express from 'express';
const app = express()
const port = config['port']

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import fs from 'node:fs'

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import lodash from 'lodash'

import { Server } from 'socket.io';
const server = createServer(app);
const io = new Server(server,{
  maxHttpBufferSize: 1e8
});

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use('/static',express.static(join(__dirname, 'public')))
app.use('/media', express.static(config['absolute-static-file-path']))


if (!fs.existsSync(config['absolute-static-file-path']+"/playeruploads/")) {
    fs.mkdirSync(config['absolute-static-file-path']+"/playeruploads/")
}

// db.json file path

const file = join(__dirname, 'db.json')

// Extend Low class with a new `chain` field
class LowWithLodash extends Low {
  chain = lodash.chain(this).get('data')
}
// Configure lowdb to write data to JSON file
const adapter = new JSONFile(file)
const defaultData = { cues: [], squences: [] }
const db = new LowWithLodash(adapter, defaultData)
let player = []
let sessionToken = ""

// Read data from JSON file, this will set db.data content
// If JSON file doesn't exist, defaultData is used instead
await db.read()

// Create and query items using plain JavaScript
//db.data.cues.push('hello world')
//const firstPost = db.data.posts[0]

// If you don't want to type db.data everytime, you can use destructuring assignment
//const { cues } = db.data
//cues.push('hello world')

// Finally write db.data content to file
await db.write()


let interactionTypes = fs.readdirSync('./public/InteractionTypes');


io.of("/control").on('connection', (socket) => {
    console.log("control has connected")
    sendCueInfo()
    sendSequenceInfo()
    sendPlayerInfo()
    sendSessionInfo()
    
    socket.on("save cue sequence", (msg) => {
        console.log("save cue list", msg)
        db.data.sequences = msg 
        db.write()
    })
    
    socket.on("interaction:show-answer", (msg) => {
        console.log("interaction show answer")
        cueActivate(msg.id, msg)
    })
    
    socket.on("interaction:show-update", (msg) => {
        console.log("interaction show update", msg)
        io.emit("player:cue-update", msg)
        //cueActivate(msg.id, msg)
    })
    
    socket.on("session:stopsound", () => {
        io.emit("player:stopsound")
    })
    
    socket.on("session:start", (msg) => {
        sessionToken = Math.random().toString(36).substr(2)
        sendSessionInfo()
    })
    
    socket.on("session:end", (msg) => {
        sessionToken = ""
        sendSessionInfo()
        //ToDo cick users from session
    })
    
    socket.on("cue:preload", (msg) => {
        triggerPreload(msg)
    })
    
    socket.on("cue activate", (msg) => {
        cueActivate(msg)
    })
    
    socket.on("scene:delete", (name) => {
        db.data.sequences = db.data.sequences.filter( s => s.name != name)
        db.write()
        sendSequenceInfo()
    })
    
    socket.on("cue:delete", (id) => {
        console.log(id)
        db.data.cues = db.data.cues.filter( cue => cue.id != id)
        for(let seq of db.data.sequences){
          seq.sequence = seq.sequence.filter( nr => nr != id)
        }
        db.write()
        console.log("cue deleted", id)
        sendCueInfo()
        sendSequenceInfo()
    })
    
    socket.on("cue:deleteListIdx", (name, idx) => {
        console.log("delete cue from sequence", name, idx)
        let seq = db.data.sequences.filter( s => s.name == name)[0]
        console.log("found", seq, seq.sequence)
        seq.sequence.splice(idx, 1)
        db.write()
        
        sendSequenceInfo()
    })
    
    socket.on('cue created', (msg) => {
        
        console.log('cue created: ', msg);
        if(msg.id){
            console.log("updateing cue", msg.id)
            let cueIdx = db.data.cues.findIndex( (cue) => cue.id == Number(msg.id) ) 
            db.data.cues[cueIdx] = msg
            
        }else{
            msg.id = Math.floor(Math.random() * 10000)
            db.data.cues.push(msg)
            
        }
        
        db.write()
        sendCueInfo()
    });
    
    socket.on("cue:info", (data, callback) => {
      console.log(data.id); // <Buffer 25 50 44 ...>
      callback(db.chain.get("cues").find({id: Number(data.id) }).value());
    });
    
    
    socket.on("upload file", (data, callback) => {
      console.log(data.name); // <Buffer 25 50 44 ...>

      // save the content to the disk, for example
      fs.writeFile(config['absolute-static-file-path']+"/"+data.name, data.file, (err) => {
        callback({ message: err ? "failure" : "success" });
      });
    });
  
})

io.on('connection', (socket) => {
    
    socket.join("player");
    
    if (socket.recovered) {
      console.log('a user recovered', socket.id);
    } else {
      console.log('a user connected', socket.id);
    }
    
    socket.emit("player:interactionTypes", interactionTypes)
    
    socket.on("interaction:answer", (msg) => {
      
      let foundPlayer = player.find( x => x?.socketID == socket.id)
      console.log("player answered", msg, foundPlayer)
      msg.playerID = foundPlayer.id
      io.of("/control").emit("interaction:answer", msg)
    })
    
    socket.on("interaction:fileupload", (data, callback) => {
      console.log(data.name); // <Buffer 25 50 44 ...>

      // save the content to the disk, for example
      fs.writeFile(config['absolute-static-file-path']+"/playeruploads/"+data.name, data.file, (err) => {
        callback({ message: err ? "failure" : "success" });
        if(!err){
          let foundPlayer = player.find( x => x?.socketID == socket.id)
          delete data.file
          data.name = "playeruploads/" + data.name
          console.log("player answered", data, foundPlayer)
          data.playerID = foundPlayer.id
          io.of("/control").emit("interaction:answer", data)
        }
      });
    });
    
    socket.on("player:register", (preferredID, sToken, callback) => {
      if(sToken == sessionToken && sToken.length > 0){
        let foundPlayer = addPlayer(preferredID, socket.id)
        callback({ message: "welcome player", info: foundPlayer, success: true });
        sendPlayerInfo()
      }else{
        if(sessionToken.length == 0){
          callback({ message: "NO SESSION ACTIVE", success: false});
        }else{
          callback({ message: "WRONG SESSION TOKEN", success: false});
          console.log("wrong token", sToken, sessionToken)
        }
      }
    });
    
    socket.on("disconnect", (reason) => {
        removePlayer(socket.id)
        console.log("reason", reason)
    });
    
    socket.on("player:left", () => {
        removePlayer(socket.id)
    })
    
});

function triggerPreload(msg){
    console.log("preload from", msg)
    let cueInfo = db.data.cues.filter( x => msg.includes(x.id))
    io.emit("player:preload", cueInfo)
}

function removePlayer(socketID){
    let foundPlayer = player.find( x => x?.socketID == socketID)
    if(foundPlayer){
        let id = foundPlayer.id
        player[id] = undefined
        console.log("removed player", id, socketID)
    }else{
        console.log("tried to remove non-registered player", socketID)
    }
    sendPlayerInfo()
}

function getNextFreeID(){
    let id = 1
    while(player[id]){
      id += 1
    }
    console.log("found next free ID at ", id)
    return id
}

function addPlayer(id, socketID){
    if(!id){
      id = getNextFreeID()
    }
    player[id] = {
        socketID: socketID,
        id: id
    }
    console.log("player", socketID, "joined at", id)
    console.log(player)
    return player[id]
}

function sendSessionInfo(){
   io.of("/control").emit("session:info", sessionToken!="");
}

function sendPlayerInfo(){
   io.of("/control").emit("player:info", player);
}

function clearRecipientStatus(){
  player.forEach(p => {if(p){p.recipient = false}})
}



async function cueActivate(id, additionalInfo=null){
    clearRecipientStatus()
    let dbcue = db.chain.get("cues").find({id: Number(id) }).value()
    let cue = { ...dbcue } //prevent changing info in DB
    console.log("cue activated: ", id, cue, "to", cue['player-ids'])
    if(additionalInfo){
      cue["additionalInfo"] = additionalInfo
    }
    switch(cue['player-ids']){
        case "all":
          for(let p of player){
            if(p){
              console.log("sending to", p.id)
              p.loading = true
              p.recipient = true
              const sockets = await io.in(p.socketID).fetchSockets();
              if(!sockets[0]){
                console.log("SOCKET with ID was NOT FOUND")
              }
              sockets[0].emit("player:interaction", cue, (response) => {
                console.log("ack", response)
                player.find(x => x?.socketID == sockets[0].id).loading = false
                sendPlayerInfo()
              })
            }
          }
          break
        case "random":
          console.log("random player id case")
          break
        default:
          console.log("default player id case")
    }
    sendPlayerInfo()
}

function sendCueInfo(){
  console.log("found cue types", interactionTypes)
  io.of("/control").emit("cue:load", { cues:db.data.cues, types:interactionTypes })
}

function sendSequenceInfo(){
  let seq = db.data.sequences 
  let data = []
  for(let s of seq){
      let scene = { ...s }
      scene["completeCues"] = scene.sequence.map( c => db.chain.get("cues").find({id: Number(c) }).value() )
      data.push(scene)
  }
  console.log("seq from DB:", data)
  io.of("/control").emit("load sequence", data)
}

app.get('/seat/', (req, res) => {
  res.redirect(`/?sessionToken=${sessionToken}`)
})

app.get('/seat/:userId', (req, res) => {
  res.redirect(`/?id=${req.params.userId}&sessionToken=${sessionToken}`)
})

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'player.html'))
})

app.get('/control', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'control.html'))
});

app.get('/answers', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'answers.html'))
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
