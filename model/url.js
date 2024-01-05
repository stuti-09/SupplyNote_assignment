const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    owned : {
        type : String,
        
    },
    urlCode : {
        type : String,
    },
    longUrl : {
        type : String, 
        required : true,
    },
    shortUrl: {
        type : String,
        
    },
    clickCount : {
        type : Number,
        default : 0,
    },
    date: { 
        type: String, 
        default: Date.now()
    }
});

module.exports = mongoose.model('url', urlSchema);