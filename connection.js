const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:KpxjOBUObeB88qsa@dev.z7g6ggj.mongodb.net/DB_FashionLike');

const objectbd = mongoose.connection;

objectbd.on('connected',()=>{console.log('Done!')});
objectbd.on('error',()=>{console.log('Wrong!')});

module.exports =mongoose


//coments