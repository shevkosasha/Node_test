const fs = require('fs'); 
const csv = require('csv-parser');


module.exports = function(app) {
  app.get('/reservations', (req, res) => { 
    
    amenityFilePath = "./files//Amenity.csv";
    reservationsFilePath = "./files//Reservations.csv";

    let amenityId = null;
    let amenityName = null;
    let timestamp = null; 
    let date = null;   
    
    if (!req.query.amenityId || !req.query.timestamp) {
      // выдаем сообщение на случай если отсутствует один из необходимых для получения данных параметров и завершаем стрим
      res.send('NO REQUIRED DATA IN PARAMETERS');
      res.end();
    } else {     
      
      amenityId = req.query.amenityId;
      timestamp = +req.query.timestamp;
      date = new Date(timestamp);
  
      const reservations = [];
      let results = [];
  
      let reservationIdIndex, amenityIdIndex, userIdIndex, startTimeIndex, endTimeIndex, tsIndex;
  
      fs.createReadStream(reservationsFilePath)
        .pipe(csv({ separator: '\t' }))
        .on('headers', (headers) => {
          //получаем содержимое header'а таблицы
          let header = headers[0].split(";");
  
          // получаем индексы каждого элемента header'а
          reservationIdIndex = header.indexOf("id");
          amenityIdIndex = header.indexOf("amenity_id");
          userIdIndex = header.indexOf("user_id");
          startTimeIndex = header.indexOf("start_time");
          endTimeIndex = header.indexOf("end_time");
          tsIndex = header.indexOf("date");
  
        })
        .on('data', (row) => {  

          //получаем строку файла, разбиваем ее по символу ";"    
          reservationValue = Object.values(row)[0].split(";");
          //если amenity_id в строке равен заданному, то помещаем в массив reservations
          if (reservationValue[amenityIdIndex] == amenityId && reservationValue[tsIndex] == timestamp) {
            reservations.push(reservationValue);           
          }      
  
        })
        .on('end', () => {           

          //читаем данные из файла Amenity.csv
          fs.createReadStream(amenityFilePath)
            .pipe(csv({ separator: '\t' }))
            .on('data', (row) => {

              // получаем amenity_name и присваиваем его в amenityName
              let amentityValue = Object.values(row)[0];
              // получаем amenity name
              if (amentityValue.split(';')[0] == amenityId) {
                amenityName = amentityValue.split(';')[1];
              }

            })
            .on('end', () => {

              // вспомогательная функция для добавления незначащих нулей в двузначные числа
              const addZero = (num) => {
                return (num >= 10) ? num : `0${num}`;
              }
              // получаем месяц, день, часы и минуты с даты
              let month = date.getMonth() + 1;
              let day = date.getDate();
              let hours = date.getHours();
              let minutes = date.getMinutes();              

              if (reservations.length > 0) {

                // если массив reservations не пустой, то сразу сортируем его по параметру start_time
                reservations.sort((a, b) =>  a[startTimeIndex] - b[startTimeIndex]);

                // затем интересующие значения пишем в массив результатов, дополнительно в массив результатов время старта и продолжительность
                results = reservations.map(item => {

                  let duration = item[endTimeIndex] - item[startTimeIndex];
                  itemHours = hours + (item[startTimeIndex] / 60);
                  itemMinutes = minutes + item[startTimeIndex] % 60;
    
                  let startTimeStr = `${addZero(itemHours)}:${addZero(minutes)}`;
                  return ({
                      reservation_id: item[reservationIdIndex],
                      user_id: item[userIdIndex],
                      start_time: startTimeStr,
                      duration: duration,
                      amenity_name: amenityName,
                  })
                });

                // т.к. в задании написано результат вывести в виде списке, решил воспользоваться таблицей для этого
                let table = `<table>`;

                // т.к. у нас соблюдено условие по длине массива больше нуля, из первой значения массива результатов берем ключи и формируем заголовки для таблицы
                let keys = Object.keys(results[0]);
                keys.forEach(key => table += `<th>  ${key.toUpperCase()}  </th>`)

                // затем проходимся по значениям, вычитываем интересующие параметры и добавляем в таблицу-список строку с данными
                results.forEach(result => {

                  let tdReservId = `<td>${result.reservation_id}</td>`;
                  let tdUserId = `<td>${result.user_id}</td>`;
                  let tdStartTime = `<td>${result.start_time}</td>`;
                  let tdDuration = `<td>${result.duration}</td>`;
                  let tdAmentityName = `<td>${result.amenity_name}</td>`;
                  table += `<tr>${tdReservId}${tdUserId}${tdStartTime}${tdDuration}${tdAmentityName}</tr>`

                })

                // отправляем в браузер и завершаем стрим
                res.send(table) ;                
                res.end();

              } else {
                // сообщение на случай, если по заданному amentityId ничего не найдено
                let noReservationString = `No reservations for <b>${(amenityName) ? amenityName : amenityId}</b> on ${addZero(day)}/${addZero(month)}`;
              
                res.send(noReservationString);
                res.end();
              }     
  
            })
            
        });

    }
    
  });

// localhost:3333/page?amenityId=3&timestamp=1592611200000
};

