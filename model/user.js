const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const googleSchema = new Schema({
        id: {
          type: String,
        },
        name: {
          type: String,
        },
        email: {
          type: String,
      },
      refreshToken:{
        type:String
      }
});
module.exports = mongoose.model("googleAuth", googleSchema);