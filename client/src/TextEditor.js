import { useCallback, useEffect, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"

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
  // so we can access our socket & quill anywhere
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  // client side socket.io connecting to server side socket.io
  useEffect(() => {
    const s = io("http://localhost:3001")   // server's port
    setSocket(s)

    // cleanup (disconnect)
    return () => {
      s.disconnect()
    }
  }, [])


  // for detecting any quill changes (updating our doc upon receiving changes)
  useEffect(() => {
    if (socket == null || quill == null) return 

    // setting up an event listener to update our doc to the changes passed by the client
    const handler = (delta) => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)

    return () => {
      socket.off("receive-changes", handler)
    }
  }, [socket, quill])  


  // for detecting any quill changes (sending changes)
  useEffect(() => {
    // when we first run this useEffect socket & quill will be undefined (dependencies)
    if (socket == null || quill == null) return

    // text-change event & 3 parameters comes from quill
    const handler = (delta, oldDelta, source) => {
      // source determines who made the changes (we only care about the user changes)
      if (source !== "user") return

      // the delta is the only thing actually changing not the whole document
      socket.emit("send-changes", delta)
    }

    quill.on("text-change", handler)

    // cleanup
    return () => {
      quill.off("text-change", handler)
    }
  }, [socket, quill])             // dependencies


  // create a new instance of quill but only once on page render
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return

    wrapper.innerHTML = ""
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } })
    setQuill(q)
  }, [])

  return <div className="container" ref={wrapperRef}>Text Editor</div>
}
