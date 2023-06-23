const io = require("socket.io")(3001, {
  // since we have our client & server running on two diff ports (3000 & 3001)
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST"]
  }
})

io.on("connection", socket => {
  // listening for our event listener from client side (delta is passed in)
  socket.on("send-changes", delta => {
    socket.broadcast.emit("receive-changes", delta)  // receive changes is a function
  })
})