//enabling express
const { WSAEACCES } = require('constants');
const { Pool } = require('pg');
const express = require('express');
//enabling static path
const path = require('path');
const { response } = require('express');
const PORT= process.env.PORT || 5000;
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

express()
    .use(express.static(path.join(__dirname,'public')))
    .set('views',path.join(__dirname,'views'))
    .set('view engine', 'ejs')
    .post('/', (req,res) => res.render(index))
    .post('/calc',formInput)
    .listen(PORT, () => console.log(`Listening on ${PORT}`))

function formInput(request, response){
    let gender = Number(request.query.gender);
    let unit = request.query.measureUnit;
    let height = Number(request.query.height);
    let waist = Number(request.query.waist);
    let hours = Number(request.query.hours);
    let preferredPart = request.query.preferredPart;
    let level = request.query.level;

    
    createRoutine(response, gender,height, waist, hours, preferredPart,level);
}

function calculateRFM(gender,height,waist){
    console.log("enter this method");
    let rfm = 64 - 20 * (height/waist) + 12*gender;
    
    return rfm;
}

function createRoutine(response, gender, height, waist, hours, preferredPart, level){
    let sex= "";
    let alert = "";
    switch (gender){
        case 0:
            sex = "male";
            break;
        case 1:
            sec ="female";
            break;
    }
    let rfm = calculateRFM(gender,height, waist);
    if (rfm >= 50 || rfm <=0){
        alert ="Please make sure you input height and waist circumference with same unit";
    }
    let resultrfm = rfm+"%";
    console.log(resultrfm);
    let startLevel = 0;

    switch (level){
        case 'warmup':
            startLevel = "1";
            break;
        case 'basic':
            startlevel = "2";
            break;
        case 'hard':
            startlevel = "4";
            break;
        case 'intense':
            startlevel = "6";
            break;
    }

    var sql = "select c.name, l.level, repetition, setcount, weight, repetitionweighted, setcountweighted from chesttbl c join routinetbl r on c.id = r.chest_id join leveltbl l on r.level = l.level where level =" + startLevel;
    pool.query(sql, function(err, result){
    if (err){
        console.log("Error in query: ");
        console.log(err);
    }
    console.log("Back from DB with result: ");
    console.log(result.rows);
    let routine = result.rows;

    const results = {resultrfn: resultrfm, alert: alert, routine: routine};
    response.render('routines',results);
});

}

