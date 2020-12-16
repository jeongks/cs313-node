//enabling express
const { Pool } = require('pg');
const express = require('express');
//enabling static path
const path = require('path');
const { start } = require('repl');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { allowedNodeEnvironmentFlags } = require('process');
const PORT= process.env.PORT || 5000;
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

let chest_ids = [];
let leg_ids = [];
let core_ids = [];

express()
    .use(express.urlencoded({extended:true}))
    .use(express.static(path.join(__dirname,'public')))
    .set('views',path.join(__dirname,'views'))
    .set('view engine', 'ejs')
    .post('/', (req,res) => res.render(index))
    .post('/calc', formInput)    
    .listen(PORT, () => console.log(`Listening on ${PORT}`))

function formInput(request, response){
    let gender = request.body.gender;
    let unit = request.body.measureUnit;
    let height = request.body.height;
    let waist = request.body.waist;
    let level = request.body.level;

    createRoutine(response, gender,height, waist, level);
}
function calculateRFM(gender,height,waist){
    let rfm = 64 - 20 * (height/waist) + 12*gender;
    return rfm;
}

function createRoutine(response, gender, height, waist, level){
    let sex= "";
    let alert = "";
    let isCompleted = false;
    switch (gender){
        case "0":
            sex = "male";
            break;
        case "1":
            sex ="female";
            break;
    }
    let rfm = calculateRFM(gender,height, waist);
    if(sex =="male"){
        if (rfm >= 2  && rfm <= 5){
            alert ="Essential Fat";
        } else if(rfm > 5 && rfm <=13){
            alert = "Athletes";
        } else if (rfm > 13 && rfm <=17){
            alert = "Fitness";
        } else if (rfm > 17 && rfm < 25){
            alert ="Average";
        } else if (rfm >= 25){
            alert ="Obese";
        } else if (rfm < 2 && rfm >=0){
            alert = "critically low body fat";
        } else {
            alert = "invalid result. Check height and waist information that are provided";
        }
    } else {
        if (rfm >=10 && rfm <14){
            alert ="Essential Fat";
        } else if(rfm >= 14 && rfm <21){
            alert = "Athletes";
        } else if (rfm >= 21 && rfm <25){
            alert = "Fitness";
        } else if (rfm >= 25 && rfm < 32){
            alert ="Average";
        } else if (rfm >= 32){
            alert ="Obese";
        } else if (rfm < 10 && rfm >=0){
            alert = "critically low body fat";
        } else {
            alert = "invalid result. Check height and waist information that are provided";
        }
    }
    isCompleted  = getExercise(level, rfm, sex, alert ,response);
    if (isCompleted){
        //sendResult(response, sex, alert, rfm);
    } 
}    
function addChest(sql){
    pool.query(sql, function (err, result){
        if (err){
            console.log("Error in query(chest): ");
            console.log(err);
        }
        JSON.stringify(result);
        for (var i=0; i< result.rowCount; i++){
            chest_ids.push(result.rows[i].id);
        }              
    });
}
function addLeg(sql){
    pool.query(sql, function (err,result){
        if(err){
            console.log("Error in query(leg): ");
            console.log(err);
        }
        JSON.stringify(result);
        for (var i =0; i< result.rowCount; i++){
            leg_ids.push(result.rows[i].id);
        }
    });
}
function addCore(sql){
    pool.query(sql, function (err,result){
        if(err){
            console.log("Error in query(core): ");
            console.log(err);
        }
        JSON.stringify(result);
        for (var i =0; i< result.rowCount; i++){
            core_ids.push(result.rows[i].id);
        }
    });
}


function getExercise(level, rfm, sex, alert ,response){
    let startLevel = 1;
    let exerciseLevel= 1;
    let isCompleted = false;
    let chest = [];
    let leg = [];
    let core = [];
    if( level == "basic"){
        startlevel = 1;
        exerciseLevel =1;
        minutePerBreak = 2;
        let sql = "select id, name from chesttbl where level = "+exerciseLevel;
        addChest(sql);
        sql = "select id, name from legtbl where level = "+exerciseLevel;
        addLeg(sql);
        sql = "select id, name from coretbl where level = "+exerciseLevel;
        addCore(sql);
        //isCompleted = insertExercise(startLevel);
/*************************************************************************************** */
        sql = "select id, name from chesttbl where level = "+exerciseLevel;
        pool.query(sql,function (err, result){
            if (err){
                console.log("Error in query(chest): ");
                console.log(err);
            }
            JSON.stringify(result);
            for (var i=0; i< result.rowCount; i++){
                chest_ids.push(result.rows[i].id);
            }              
            let sqlLeg = "select id, name from legtbl where level =" +exerciseLevel;
            pool.query(sqlLeg,function (err,result){
                if(err){
                    console.log("Error in query(leg): ");
                    console.log(err);
                }
                JSON.stringify(result);
                for (var i =0; i< result.rowCount; i++){
                    leg_ids.push(result.rows[i].id);
                }
                let sqlCore = "select id, name from coretbl where level = "+exerciseLevel;
                pool.query(sqlCore, function (err,result){
                    if(err){
                        console.log("Error in query(core): ");
                        console.log(err);
                    }
                    JSON.stringify(result);
                    for (var i =0; i< result.rowCount; i++){
                        core_ids.push(result.rows[i].id);
                    }
                    let cleartablesql = "drop table if exists routinetbl";
                    pool.query(cleartablesql, function (err, result){
                        if(err){
                            console.log("Error in query(drop routinetbl): ");
                            console.log(err);
                        }
                        let createTableSql = "create table if not exists routinetbl (int serial primary key, chest_id int, leg_id int, core_id int, level int, day int, foreign key (chest_id) references chesttbl(id), foreign key (leg_id) references legtbl(id), foreign key (core_id) references coretbl(id), foreign key (level) references leveltbl(level))";
                        pool.query(createTableSql, function (err, result){
                            if (err){
                                console.log("Error in query(create routinetbl): ");
                                console.log(err);
                            }
                            let day = 1;
                            while(true){
                                if (day % 7 == 1){
                                    for (var i = 0 ; i< chest_ids.length ; i++){
                                        sql = "insert into routinetbl (chest_id, level, day) values("+chest_ids[i]+", "+startLevel+", "+day+")";
                                        pool.query(sql, function (err, result){
                                            if(err){
                                                console.log("Error in query(insert chest): ");
                                                console.log(err);
                                            }
                                        });
                                    }
                                } else if ( day % 7 ==2){
                                    for (let i = 0; i<leg_ids.length;i++){
                                        sql = "insert into routinetbl (leg_id, level, day) values("+leg_ids[i]+","+startLevel+","+day+")";
                                        pool.query(sql, function (err,result){
                                            if(err){
                                                console.log("Error in query(insert leg): ");
                                                console.log(err);
                                            }
                                        });
                                    }
                                } else if ( day % 7 == 3){
                                    for (let i =0; i<core_ids.length;i++){
                                        sql = "insert into routinetbl (core_id, level, day) values("+core_ids[i]+","+startLevel+","+day+")";
                                        pool.query(sql, function(err,result){
                                            if(err){
                                                console.log("Error in query(insert core): ");
                                                console.log(err);
                                            }
                                        });
                                    }
                                } else if ( day % 7 == 4){
                                    for (let i = 0; i<leg_ids.length;i++){
                                        sql = "insert into routinetbl (leg_id, level, day) values("+leg_ids[i]+","+startLevel+","+day+")";
                                        pool.query(sql, function (err,result){
                                            if(err){
                                                console.log("Error in query(insert leg): ");
                                                console.log(err);
                                            }
                                        });
                                    }
                                } else if ( day % 7 == 5){
                                    for (let i = 0 ; i<chest_ids.length ; i++){
                                        sql = "insert into routinetbl (chest_id, level, day) values("+chest_ids[i]+", "+startLevel+", "+day+")";
                                        pool.query(sql, function (err, result){
                                            if(err){
                                                console.log("Error in query(insert chest): ");
                                                console.log(err);
                                            }
                                        });
                                    }
                                } 
                                day = day +1;
                                if (startLevel < 4){
                                    if ((day-14) % 14 == 0){
                                        startLevel = startLevel +1;
                                    }
                                    if (day / 7 >= 6){
                                        break;
                                    }
                                } else if (startLevel < 6){
                                    if ((day-21) % 21 == 0){
                                        startLevel = startLevel +1;
                                    }
                                    if (day / 7 >= 9){
                                        break;
                                    }
                                } else if (startLevel == 6){
                                    if ((day-21) % 21 == 0){
                                        startLevel = startLevel +1;
                                    }
                                    if (day / 7 >= 12){
                                        break;
                                    }
                                }
                            }
                            var sqllast = "select chest.name, leg.name, core.name ,level.repetition, level.setcount, day from routinetbl r "
                                    + "left join chesttbl chest on r.chest_id = chest.id left join legtbl leg on r.leg_id = leg.id "
                                    + "left join coretbl core on r.core_id = core.id join leveltbl level on r.level = level.level";
                            pool.query(sqllast, function(err, result){
                                if (err){
                                    console.log("Error in query: ");
                                    console.log(err);
                                }
                                JSON.stringify(result);
                                console.log("Back from DB with result: " + result.rowCount);
                                const results = {rfm: rfm, gender: sex, alert: alert, result: result};
                                response.render('routines',results);
                            });
                        });
                    });
                });
            });
        });
    }}
/**************************************************************************************** */
/*    } else if (level == "hard"){
        startlevel = 4;
        exerciseLevel =2;
        minutePerBreak = 1;
        let sql = "select id, name from chesttbl where level = "+exerciseLevel;
        chest = addChest(sql);
        sql = "select id, name from legtbl where level = "+exerciseLevel;
        leg = addLeg(sql);
        sql = "select id, name from coretbl where level = "+exerciseLevel;
        core = addCore(sql);
        isCompleted = insertExercise(startLevel);
        
    } else if ( level == "intense"){
        startlevel = 6;
        exerciseLevel = 3;
        minutePerBreak = 0.75;
        let sql = "select id, name from chesttbl where level = "+exerciseLevel;
        addChest(sql);
        sql = "select id, name from legtbl where level = "+exerciseLevel;
        addLeg(sql);
        sql = "select id, name from coretbl where level = "+exerciseLevel;
        addCore(sql);
        isCompleted = insertExercise(startLevel);
    }    
    if (isCompleted){
        return true;
    } else {
        return false;
    }
}*/
/*
function insertExercise(start){
    let startLevel = start;
    let day = 1; 
    while(true){
        if (day % 7 == 1){
            for (var i = 0 ; i< chest_ids.length ; i++){
                sql = "insert into routinetbl (chest_id, level, day) values("+chest_ids[i]+", "+startLevel+", "+day+")";
                console.log("sql: "+sql);
                pool.query(sql, function (err, result){
                    if(err){
                        console.log("Error in query(insert chest): ");
                        console.log(err);
                    }
                    console.log("chest is inserted");
                });
            }
        } else if ( day % 7 ==2){
            for (let i = 0; i<leg_ids.length;i++){
                sql = "insert into routinetbl (leg_id, level, day) values("+leg_ids[i]+","+startLevel+","+day+")";
                pool.query(sql, function (err,result){
                    if(err){
                        console.log("Error in query(insert leg): ");
                        console.log(err);
                    }
                    console.log("leg is inserted");
                });
            }
        } else if ( day % 7 == 3){
            for (let i =0; i<core_ids.length;i++){
                sql = "insert into routinetbl (core_id, level, day) values("+core_ids[i]+","+startLevel+","+day+")";
                pool.query(sql, function(err,result){
                    if(err){
                        console.log("Error in query(insert core): ");
                        console.log(err);
                    }
                    console.log("core is inserted");
                });
            }
        } else if ( day % 7 == 4){
            for (let i = 0; i<leg_ids.length;i++){
                sql = "insert into routinetbl (leg_id, level, day) values("+leg_ids[i]+","+startLevel+","+day+")";
                pool.query(sql, function (err,result){
                    if(err){
                        console.log("Error in query(insert leg): ");
                        console.log(err);
                    }
                    console.log("leg is inserted");
                });
            }
        } else if ( day % 7 == 5){
            for (let i = 0 ; i<chest_ids.length ; i++){
                sql = "insert into routinetbl (chest_id, level, day) values("+chest_ids[i]+", "+startLevel+", "+day+")";
                pool.query(sql, function (err, result){
                    if(err){
                        console.log("Error in query(insert chest): ");
                        console.log(err);
                    }
                    console.log("chest is inserted");
                });
            }
        } 
        day = day +1;
        if (startLevel < 4){
            if ((day-14) % 14 == 0){
                startLevel = startLevel +1;
            }
            if (day / 7 >= 6){
                break;
            }
        } else if (startLevel < 6){
            if ((day-21) % 21 == 0){
                startLevel = startLevel +1;
            }
            if (day / 7 >= 9){
                break;
            }
        } else if (startLevel == 6){
            if ((day-21) % 21 == 0){
                startLevel = startLevel +1;
            }
            if (day / 7 >= 12){
                break;
            }
        }
    }
    return true;
}*/
/*
function sendResult(response, sex, alert, rfm){
    var sql = "select chest.name, leg.name, core.name ,level.repetition, level.setcount, day from routinetbl r "
            + "join chesttbl chest on r.chest_id = chest.id join legtbl leg on r.leg_id = leg.id "
            + "join coretbl core on r.core_id = core.id join leveltbl level on r.level = level.level";
    pool.query(sql, function(err, result){
        if (err){
            console.log("Error in query: ");
            console.log(err);
        }
        JSON.stringify(result);
        console.log("Back from DB with result: ");
        console.log("result rowcount:(end) "+result.rowCount);
        const results = {rfm: rfm, gender: sex, alert: alert, result: result};
        response.render('routines',results);
    });

    // pool.query(sql)
    //     .then(res => console.log(res.rows[0].name))
    //     .catch(err => console.log('Error executing query',err.stack))

}*/
    