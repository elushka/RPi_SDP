import os
import json
import RPi.GPIO as GPIO
from time import sleep
from losantmqtt import Device

def activateSolenoid(PIN):
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(PIN, GPIO.OUT)
    GPIO.output(PIN, GPIO.LOW)
    print("UNLOCKED")
    sleep(6)
    GPIO.cleanup()
    print("LOCKED")

# Construct Losant device
device = Device("5a00bfc943f88f00078e3937", "d7ff9bec-fd52-41f0-ac8f-1337e657b9c7", "01d41ec9fd8f5e6b69bd77b53f7de0c4d9afa1d829f95ec455af6e269567a0cb")

nfcUIDs = ["c4  e4  53  12", "04  66  c8  b2  a6  4a  81"]

def nfcReader():
    result = [ i.strip() for i in os.popen(r"nfc-poll | grep UID | sed 's/^.*: //'").readlines()]
    returnValue = str(result[-1])
    result = []
    print "UID: ",returnValue
    if returnValue in nfcUIDs:
        response = 1
    else:
        response = 0
        
    return response

def sendDeviceState():
        
        nfcResult = nfcReader()
        
        device.send_state({"nfcReading": nfcResult})

def on_command(device, command):
    print(command["name"] + " command received.")

    # Listen for the gpioControl. This name configured in Losant
    if command["name"] == "gpioControl":
  
        currentGpio = int(command["payload"]["gpio"])
        
        if currentGpio == 9:
            activateSolenoid(2)
            sendDeviceState()
        else:
            activateSolenoid(currentGpio)

# Listen for commands.
device.add_event_observer("command", on_command)

print("Listening for device commands")
    
# Connect to Losant and leave the connection open
device.connect(blocking=True)
