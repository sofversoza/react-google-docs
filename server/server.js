const mongoose = require("mongoose")
const Document = require("./Document")

mongoose.connect('mongodb://127.0.0.1/google-docs-clone');

const io = require("socket.io")(3001, {
  // since we have our client & server running on two diff ports (3000 & 3001)
  // cors: cross-origin resource sharing
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST"]
  }
})

const defaultValue = ""

// listening for event listeners from client 
io.on("connection", socket => {
  socket.on("get-document", async documentId => {    //documentId is passed/sent to server
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)  // puts this socket(client) into its own room based on its id
    socket.emit("load-document", document.data)      // return to socket(client) the data

    // were emitting (sending changes) to socket(client)'s own specific room
    socket.on("send-changes", delta => {             // delta is passed in/sent to server
      socket.broadcast.to(documentId).emit("receive-changes", delta)  
    })

    // save our document (entire data) & update data (we'll call this from client side)
    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

// whenever we get a doc (get-document, documentId), we either want to get the doc or create one from scratch
async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)   // find the document by its id
  if (document) return document                // if we have a doc return to the user

  // otherwise, create one: id & data comes from Document model (Document.js)
  return await Document.create({ _id: id, data: defaultValue }) 
}