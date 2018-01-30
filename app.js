var myPythonScriptPath = 'smartmory.py';

var PythonShell = require('python-shell');
var pyshell = new PythonShell(myPythonScriptPath);

pyshell.on('message', function (message) {
    console.log(message);
});

pyshell.end(function (err) {
    if (err){
        throw err;
    };
    console.log('finished');
});
