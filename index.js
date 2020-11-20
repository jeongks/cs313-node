const express = require('express');
const path = require('path');
const PORT= process.env.PORT || 5000;

express()
    .use(express.static(path.join(__dirname,'public')))
    .set('views',path.join(__dirname,'views'))
    .set('view engine', 'ejs')
    .get('/', (req,res) => res.render(index))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

function formInput(request, response){
    let gender= request.query.gender;
    let unit = request.query.measureUnit;
    let height = request.query.height;
    let waist = request.query.waist;
    let hours = request.query.hours
    let part = request.query.preferredPart;
    let level = request.query.level;
}

function calculateUnit(response, unit, height, waist){
    switch (unit){
        

    }
    
}