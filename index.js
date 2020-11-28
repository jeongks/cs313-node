//enabling express
const { Pool } = require('pg');
const express = require('express');
//enabling static path
const path = require('path');
const { response } = require('express');
const PORT= process.env.PORT || 5000;
require('dotenv').config();
const qs = require('querystring');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});



express()
    .use(express.static(path.join(__dirname,'public')))
    .set('views',path.join(__dirname,'views'))
    .set('view engine', 'ejs')
    .post('/', (req,res) => res.render(index))
    // .post('/calc',formInput)
    .post('/calc',function (request, response){
        if(request.method = 'POST'){
            var body = '';

            request.on('data', function(data){
                if (body.length > 1e6) request.connection.destroy();
            });

            request.on('end', function(){
                var post = qs.parse(body);
                console.log("gender: "+post.gender);
                console.log("unit: "+post.unit);
                console.log("height: "+post.height);
                console.log("waist: "+post.waist);
                console.log("hours: "+post.hours);
                console.log("preferred: "+post.preferredPart);
                console.log("level: "+ post.level);
            });
        }
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`))

function formInput(request, response){
    let gender = request.query.gender;
    let unit = request.query.measureUnit;
    let height = request.query.height;
    let waist = request.query.waist;
    let hours = request.query.hours;
    let preferredPart = request.query.preferredPart;
    let level = request.query.level;
    createRoutine(response, gender,height, waist, hours, preferredPart,level);
}

function calculateRFM(gender,height,waist){
    console.log("Enter calculateRFM()");
    let rfm = 64 - 20 * (height/waist) + 12*gender;
    
    return rfm;
}

function createRoutine(response, gender, height, waist, hours, preferredPart, level){
    console.log("Enter createRoutine()");
    console.log("gender: "+gender);
    console.log("height: "+height);
    console.log("waist: "+waist);
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
    let startLevel = 1;

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
    " join routinetbl r on c.id = r.chest_id join leveltbl l on r.level = l.level where level = " + startLevel;
    pool.query(sql, function(err, result){
        if (err){
            console.log("Error in query: ");
            console.log(err);
        }
        console.log("Back from DB with result: ");
        console.log(response.rows);
        let routines = response.rows;

        const results = {resultrfn: resultrfm, alert: alert, routine: routines};
        response.render('routines',results);
    });
    // pool.query(sql)
    //     .then(res => console.log(res.rows[0].name))
    //     .catch(err => console.log('Error executing query',err.stack))

}

