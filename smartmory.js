var util = require('util');

var bleno = require('./node_modules/bleno/index');

var gpio = require('./node_modules/onoff').Gpio;

const { exec } = require('child_process');

const dropboxV2Api = require('dropbox-v2-api');

const raspi = require('./node_modules/raspi');
const GPIO = require('./node_modules/raspi-gpio');

const fs = require('fs');
const path = require('path');

var imageNum = 0;
var imageName;
var imagePath;
var folderPath;
var GPIOpin;
var doorStatus;
var usbNumber;

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, './credentials.json')));

//set token authentication:
const dropbox = dropboxV2Api.authenticate({
  token: credentials.TOKEN
});
//13 and 21
var checkDoor = function(GPIOpin) {
	raspi.init(() => {
  const input = new GPIO.DigitalInput({
    pin: GPIOpin,
    pullResistor: GPIO.PULL_UP
  });

  const output = new GPIO.DigitalOutput('GPIO17');

  output.write(input.read());

  doorStatus = input.read();
  console.log("This is function: "+input.read());
console.log("This is the doorStatus: " + doorStatus);

if(doorStatus == 1) {
  var command = "nfc-poll pn532_uart:/dev/ttyUSB" + usbNumber + " | grep UID | sed 's/^.*: //'";

  exec(command, (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }
  console.log("This is stdout"+stdout);

  nfcResponse = stdout.trimRight();

  console.log("While loop finished");
  nfcResponse = stdout.trimRight();
  var nfcErr = stderr.trimRight();
  var nfcStatus = (nfcValues.indexOf(nfcResponse) > -1);

  if (nfcErr == "nfc_initiator_poll_target: Success"){
  nfcResponse = "2";
  }

  else if(nfcStatus == true) {
    nfcResponse = "1";
    imageNum++;
    console.log("About to run pic function");

  cameraTrigger(imageNum);

    console.log("Finished running pic function");
  }
  else if(nfcStatus == false){
    nfcResponse = "0";
  }
  // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    //console.log(`nfc: ${rfc}`);


    console.log(`nfcStatus: ${nfcStatus}`);
    console.log(`stderr: ${stderr}`);
    console.log(`nfcResponse: ${nfcResponse}`);

  });
}
});
};

var cameraTrigger = function (imageNum, usbNumber) {
  console.log("About to take picture...");
  console.log("Image number is " + imageNum);
  var command = "fswebcam -r -d /dev/video" + usbNumber + " 640x480 -S 15 image" + imageNum + ".jpg";
  console.log("This is the command " + command);
  imageName = './image' + imageNum + '.jpg';
  console.log("This is the name " + imageName);
  imagePath = '/Smartmory-Images/image' + imageNum + '.jpg';
  console.log("This is the path " + imagePath);
  while ( !fs.existsSync(imageName)){
    exec(command, (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        return;
      }
  });}
    if (fs.existsSync(imageName)){
      const dropboxUploadStream = dropbox({
        resource: 'files/upload',
        parameters: {
          path: imagePath
        }
      }, (err, result) => {});

      fs.createReadStream(imageName).pipe(dropboxUploadStream);
    }
};

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

var nfcResponse;

var nfcValues = [ "04  66  c8  b2  a6  4a  81", "c4  e4  53  12"];

var inventory = {
  compartments: {
    0: "",
    1: ""
  }
}

console.log('bleno...');

var StaticReadOnlyCharacteristic = function() {
  StaticReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF1',
    properties: ['read'],
    value: new Buffer('value'),
    descriptors: [
      new BlenoDescriptor({
        uuid: '2901',
        value: 'staticRead'
      })
    ]
  });
};
util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

var DynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF2',
    properties: ['read']
  });
};

util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  console.log("About to exec...");

  if (offset) {
  callback(this.RESULT_ATTR_NOT_LONG, null);
}
else {
  var data = new Buffer(2);
  data.writeUInt16BE(nfcResponse, 0);
  callback(this.RESULT_SUCCESS, data);
}

};
var LongDynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF3',
    properties: ['read']
  });
};

util.inherits(LongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

LongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  //checkDoor('GPIO4');
  for(var i = 0; i < 2; i++) {
    var command = "nfc-poll pn532_uart:/dev/ttyUSB" + i + " | grep UID | sed 's/^.*: //'";
  exec(command, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
	console.log("This is stdout"+stdout);

    nfcResponse = stdout.trimRight();

	console.log("While loop finished");
    nfcResponse = stdout.trimRight();
    var nfcErr = stderr.trimRight();
    var nfcStatus = (nfcValues.indexOf(nfcResponse) > -1);

	if (nfcErr == "nfc_initiator_poll_target: Success"){
	  nfcResponse = "2";
    }

    else if(nfcStatus == true) {
      nfcResponse = "1";
    }
    else if(nfcStatus == false){
      nfcResponse = "0";
    }

    inventory["compartments"][i] = nfcResponse;
    // the *entire* stdout and stderr (buffered)
      console.log(`stdout: ${stdout}`);
      //console.log(`nfc: ${rfc}`);


      console.log(`nfcStatus: ${nfcStatus}`);
      console.log(`stderr: ${stderr}`);
      console.log(`nfcResponse: ${nfcResponse}`);
    }
      if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
      var data = new Buffer(2);
      data.writeUInt16BE(nfcResponse, 0);
      callback(this.RESULT_SUCCESS, data);
    }

});
  if (offset) {
  callback(this.RESULT_ATTR_NOT_LONG, null);
}
else {
  var data = new Buffer(2);
  data.writeUInt16BE(doorStatus, 0);
  callback(this.RESULT_SUCCESS, data);
}
};

var WriteOnlyCharacteristic = function() {
  WriteOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF4',
    properties: ['write', 'writeWithoutResponse']
  });
};

util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);

//Function to turn on GPIO pins for the locks
var GPIOcontrol = function (pin) {
  console.log("Started GPIO control function execution...");
  console.log("Selected pin number: " + pin);
  var SOLENOID = new gpio(pin, 'out');

  function activateLock() {
      SOLENOID.writeSync(1);
  }

  function deactivateLock() {
    SOLENOID.writeSync(0);
    SOLENOID.unexport();
  }

  setTimeout(deactivateLock, 5000);

};

WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('WriteOnlyCharacteristic write request in hex: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);
  //Convert data from hex to integer
  var pin = parseInt('0x'+data.toString('hex'));
  console.log('This is the sent pin: ' + pin);
  //Execute pin control function
  GPIOcontrol(pin);
  console.log("Gpio control function finished executing.");

  callback(this.RESULT_SUCCESS);
};

var NotifyOnlyCharacteristic = function() {
  NotifyOnlyCharacteristic.super_.call(this, {
    uuid: 'ccc8',
    properties: ['notify']
  });
};

util.inherits(NotifyOnlyCharacteristic, BlenoCharacteristic);

NotifyOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('NotifyOnlyCharacteristic subscribe');

  this.counter = 0;
  this.changeInterval = setInterval(function() {
    var data = new Buffer(4);
    data.writeUInt32LE(this.counter, 0);

    console.log('NotifyOnlyCharacteristic update value: ' + this.counter);
    updateValueCallback(data);
    this.counter++;
  }.bind(this), 5000);
};

NotifyOnlyCharacteristic.prototype.onUnsubscribe = function() {
  console.log('NotifyOnlyCharacteristic unsubscribe');

  if (this.changeInterval) {
    clearInterval(this.changeInterval);
    this.changeInterval = null;
  }
};

NotifyOnlyCharacteristic.prototype.onNotify = function() {
  console.log('NotifyOnlyCharacteristic on notify');
};

var IndicateOnlyCharacteristic = function() {
  IndicateOnlyCharacteristic.super_.call(this, {
    uuid: 'ccc3',
    properties: ['indicate']
  });
};

util.inherits(IndicateOnlyCharacteristic, BlenoCharacteristic);

IndicateOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('IndicateOnlyCharacteristic subscribe');

  this.counter = 0;
  this.changeInterval = setInterval(function() {
    var data = new Buffer(4);
    data.writeUInt32LE(this.counter, 0);

    console.log('IndicateOnlyCharacteristic update value: ' + this.counter);
    updateValueCallback(data);
    this.counter++;
  }.bind(this), 1000);
};

IndicateOnlyCharacteristic.prototype.onUnsubscribe = function() {
  console.log('IndicateOnlyCharacteristic unsubscribe');

  if (this.changeInterval) {
    clearInterval(this.changeInterval);
    this.changeInterval = null;
  }
};

IndicateOnlyCharacteristic.prototype.onIndicate = function() {
  console.log('IndicateOnlyCharacteristic on indicate');
};

function SampleService() {
  SampleService.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF0',
    characteristics: [
      new StaticReadOnlyCharacteristic(),
      new DynamicReadOnlyCharacteristic(),
      new LongDynamicReadOnlyCharacteristic(),
      new WriteOnlyCharacteristic(),
      new NotifyOnlyCharacteristic(),
      new IndicateOnlyCharacteristic()
    ]
  });
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('Smartmory', ['FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF0']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new SampleService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});

