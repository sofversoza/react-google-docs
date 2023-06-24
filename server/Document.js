// contains all the data for our document inside our database 

const { Schema, model } = require("mongoose");

// whats in our object
const Document = new Schema({
  _id: String,
  data: Object       // data is whatever quill sends us
})

// export as a model which is Document (this file) same as Schema (obj)
module.exports = model("Document", Document)