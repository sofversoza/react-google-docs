import { useCallback, useEffect, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

const SAVE_INTERVAL_MS = 2000
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()
  const { id: documentId } = useParams()    // useParams() returns an id obj (renamed it)

  // client side socket.io connecting to server side socket.io once
  useEffect(() => {
    const s = io("http://localhost:3001")   // server's port
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  // set each socket.io users into their own room based on their url id, bc even when 2 users are on diff doc urls, they both still sync up
  useEffect(() => {
    if (socket == null || quill == null) return

    // once: automatically cleans up this event after listening to it once unlike .on
    // after sending the doc to server, we'll receive it back here & load the doc
    socket.once("load-document", document => {
      quill.setContents(document)
      quill.enable()  // bc we disabled the text editor til the doc is loaded (wrapperRef)
    })

    socket.emit(`get-document`, documentId)       // sends the url id to server 
  }, [socket, quill, documentId])

  // saving the entire document (data) to server
  useEffect(() => {
    if (socket == null || quill == null) return

    // quill.getContents gets the doc data we need to save to our db every 2s
    const interval = setInterval(() => {    
      socket.emit("save-document", quill.getContents()) 
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill])

  // for updating our doc after receiving changes from the server
  useEffect(() => {
    if (socket == null || quill == null) return 

    const handler = (delta) => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)   // event we set up on the server side

    return () => {
      socket.off("receive-changes", handler)
    }
  }, [socket, quill])  

  // for sending changes to the server
  useEffect(() => {
    if (socket == null || quill == null) return

    // text-change event & 3 parameters comes from quill
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return      // we only care about the changes the user make

      socket.emit("send-changes", delta)  // delta is when the user types
    }
    quill.on("text-change", handler)

    return () => {
      quill.off("text-change", handler)
    }
  }, [socket, quill])   // dependencies

  // setup quill. create a new instance but only once on page render
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return

    wrapper.innerHTML = ""
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } })
    q.disable()  // disable text editor til our own private doc is loaded (2nd useEffect)
    q.setText("Loading...")
    setQuill(q)
  }, [])

  return <div className="container" ref={wrapperRef}>Text Editor</div>
}
