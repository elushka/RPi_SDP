var util = require('util');

var bleno = require('./node_modules/bleno/index');

var gpio = require('./node_modules/onoff').Gpio;

const { exec } = require('child_process');

const { execSync } = require('child_process');

const dropboxV2Api = require('dropbox-v2-api');

const raspi = require('./node_modules/raspi');
const GPIO = require('./node_modules/raspi-gpio');

const fs = require('fs');
const path = require('path');

var inventory = {
  compartments: {
    0: "",
    1: ""
  }
}

var imageNum;
var imageName;
var imagePath;
var folderPath;
var i;
var GPIOpin;
var lastDoor;
var returnCompleted;

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, './credentials.json')));

//set token authentication:
const dropbox = dropboxV2Api.authenticate({
  token: credentials.TOKEN
});

var checkCompartments = function (i) {

    var command = "nfc-poll pn532_uart:/dev/ttyUSB" + i + " | grep UID | sed 's/^.*: //'";
    console.log(command);
  var nfcResponse;
var nfcErr;
var nfcStatus;

var c;
var e;
try {
   c = execSync(command).toString().trimRight();
} catch (err) {
    c = err.stdout.toString();
    e = err.stderr.toString().trimRight();
}
	console.log(c);
    nfcResponse = c;
    nfcErr = e;
    nfcStatus = (nfcValues.indexOf(nfcResponse) > -1);
    
  if(nfcStatus == false) {
      inventory["compartments"][i] = "0";
    }
  else if(nfcStatus == true) {
      inventory["compartments"][i] = c;
    } 
}


var cameraTrigger = function (imageNum) {
  console.log("About to take picture...");
  console.log("Image number is " + imageNum);
  var command = "fswebcam -r 640x480 -S 15 image" + imageNum + ".jpg";
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

var nfcValues = [ "d4  29  4d  12", "c4  e4  53  12"];

console.log('bleno...');

var StaticReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF1',
    properties: ['read']
  });
};
util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

StaticReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {

var tags = 0;
  for (var k = 0; k < 2; k++) {
  checkCompartments(k);
	if(inventory["compartments"][k] == "0"){
		tags+=0;
	}
	if(inventory["compartments"][k] == nfcValues[0]){
		tags += 3*(10^(k+1));
	}
	if(inventory["compartments"][k] == nfcValues[1]){
		tags +=5*(10^(k+1));
	}
}
	if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
      var data = new Buffer(2)

      data.writeUInt16BE(tags, 0);
	console.log(data);
      callback(this.RESULT_SUCCESS, data);
    }

}

var DynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF2',
    properties: ['read']
  });
};

util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

var validateReturn = function(GPIOpin) {
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

if(doorStatus == 0) {

        checkCompartments(lastDoor);

        if (nfcValues.indexOf(inventory["compartments"][lastDoor]) > -1) {
              fs.readFile('photoNum.txt', (err, imageNum) => {if (err) throw err;
console.log(imageNum);cameraTrigger(imageNum);imageNum++;
fs.writeFile('photoNum.txt', imageNum, function (err){ if (err) throw err});
});
            returnCompleted = 1;
        }
        else {
          returnCompleted = 0;
        }

}
  else {
    returnCompleted = 0;
  }
});
};

DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  console.log("About to exec...");

      if(lastDoor == 0) {
          GPIOpin = "GPIO13";
        }
        else {
           GPIOpin = "GPIO21";
        }

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

if(doorStatus == 0) {

        checkCompartments(lastDoor);

        if (nfcValues.indexOf(inventory["compartments"][lastDoor]) > -1) {
              fs.readFile('photoNum.txt', (err, imageNum) => {if (err) throw err;
console.log(imageNum);cameraTrigger(imageNum);imageNum++;
fs.writeFile('photoNum.txt', imageNum, function (err){ if (err) throw err});
});
            returnCompleted = 2;
        }
        else {
          returnCompleted = 1;
        }

}
  else {
    returnCompleted = 0;
  }


	console.log("Return value:"+ returnCompleted);
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
console.log("This is else");
      var data = new Buffer(2);
	
      data.writeUInt16BE(returnCompleted, 0);
      callback(this.RESULT_SUCCESS, data);
    }
});
    };

var LongDynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF3',
    properties: ['read']
  });
};

util.inherits(LongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

LongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var open = 170;
  for (var k = 0; k < 2; k++) {
  checkCompartments(k);
  console.log("This is "+k+": "+inventory["compartments"][k]);
  if (inventory["compartments"][k] == 0) {
    open = k;
    console.log(open);
    break;  
  }
}

    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
      var data = new Buffer(2);
      data.writeUInt16BE(open, 0);
  console.log(data);
      callback(this.RESULT_SUCCESS, data);
    }
};

var VeryLongDynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF1',
    properties: ['read']
  });
};

util.inherits(VeryLongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

VeryLongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var tags = 0;
  for (var k = 0; k < 2; k++) {
  checkCompartments(k);
  console.log("This is "+k+": "+inventory["compartments"][k]);
	tags += inventory["compartments"][k] 
	}
console.log(tags);
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
      var data = new Buffer(8);
      data.writeUInt16BE(tags, 0);
  console.log(data);
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

  lastDoor = pin - 2;

  setTimeout(deactivateLock, 500);

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

var WriteTwoCharacteristic = function() {
  WriteOnlyCharacteristic.super_.call(this, {
    uuid: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFF5',
    properties: ['write', 'writeWithoutResponse']
  });
};

util.inherits(WriteTwoCharacteristic, BlenoCharacteristic);

WriteTwoCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log("About to check compartment...");

var comp = parseInt('0x'+data.toString('hex'));
console.log('This is the sent comp: ' + comp);
  checkCompartments(comp);
  callback(this.RESULT_SUCCESS);
}

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
