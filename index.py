import json
import RPi.GPIO as GPIO
from time import sleep
from losantmqtt import Device #Import Losant library: https://github.com/Losant/losant-mqtt-python
import binascii
import sys

from Adafruit_PN532 as PN532

#PIN = 17;

def activateSolenoid(PIN):
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(PIN, GPIO.OUT)
    GPIO.output(PIN, GPIO.LOW)
    print("UNLOCKED")
    sleep(6)
    GPIO.cleanup()
    print("LOCKED")
    
# We need to describe what GPIO is available to control.
# This key is the GPIO number and the value is the peripheral to control.

# Construct Losant device
device = Device("5a00bfc943f88f00078e3937", "d7ff9bec-fd52-41f0-ac8f-1337e657b9c7", "01d41ec9fd8f5e6b69bd77b53f7de0c4d9afa1d829f95ec455af6e269567a0cb")

def on_command(device, command):
    print(command["name"] + " command received.")

    # Listen for the gpioControl. This name configured in Losant
    if command["name"] == "gpioControl":
  
        currentGpio = int(command["payload"]["gpio"])

        activateSolenoid(currentGpio)

# Listen for commands.
device.add_event_observer("command", on_command)

print("Listening for device commands")

# Connect to Losant and leave the connection open
device.connect(blocking=True)
