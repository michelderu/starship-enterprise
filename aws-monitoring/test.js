const time = new Date();
const yyyymmddhhmm = time.getFullYear() + ('0' + (time.getMonth()+1)).slice(-2) + ('0' + (time.getDate()+1)).slice(-2) + ('0' + (time.getHours())).slice(-2) + ('0' + (time.getMinutes())).slice(-2);
console.log(yyyymmddhhmm);