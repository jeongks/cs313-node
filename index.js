//enabling express
const { Pool } = require('pg');
const express = require('express');
//enabling static path
const path = require('path');
const PORT= process.env.PORT || 5000;
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

express()
    .use(express.static(path.join(__dirname,'public')))
    .set('views',path.join(__dirname,'views'))
    .set('view engine', 'ejs')
    .post('/', (req,res) => res.render(index))
    .post('/calc', formInput)    
    .listen(PORT, () => console.log(`Listening on ${PORT}`))

function formInput(request, response){
    console.log(request.json);
    console.log(request.query);
    console.log(request.body);
    // let gender = request.body.gender;
    // console.log("gender: " + gender)
    // let unit = request.body.measureUnit;
    // let height = request.body.height;
    // console.log("height: "+height);
    // let waist = request.body.waist;
    // console.log("waist: "+waist);
    // let hours = request.body.hours;
    // console.log("hours: "+hours);
    // let preferredPart = request.body.preferredPart;
    // let level = request.body.level;
    // createRoutine(response, gender,height, waist, hours, preferredPart,level);
}
function calculateRFM(gender,height,waist){
    let rfm = 64 - 20 * (height/waist) + 12*gender;
    return rfm;
}

function createRoutine(response, gender, height, waist, hours, preferredPart, level){
    let sex= "";
    let alert = "";
    switch (gender){
        case "0":
            sex = "male";
            break;
        case "1":
            sex ="female";
            break;
    }
    let rfm = calculateRFM(gender,height, waist);
    if (rfm >= 50 || rfm <=0){
        alert ="Please make sure you input height and waist circumference with same unit";
    }
    let startLevel = "1";
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

    var sql = "select c.name, l.level, repetition, setcount, weight, repetitionweighted, setcountweighted from chesttbl c "+
    " join routinetbl r on c.id = r.chest_id join leveltbl l on r.level = l.level where l.level = " + startLevel;
    pool.query(sql, function(err, result){
        if (err){
            console.log("Error in query: ");
            console.log(err);
        }
        console.log("Back from DB with result: ");
        let routines = response.rows;
        console.log(result.rows);
        const results = {rfm: rfm, alert: alert, routine: result.rows};
        response.render('routines',results);
    });
    // pool.query(sql)
    //     .then(res => console.log(res.rows[0].name))
    //     .catch(err => console.log('Error executing query',err.stack))

}

